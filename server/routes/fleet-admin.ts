import type { Express, Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index";
import { storage } from "../storage";
import { fleetExec } from "../services/fleetDb";
import { isAuthenticated } from "../auth";
import {
  generateApiKeyPair,
  generateWebhookSecret,
} from "../services/fleetCrypto";

/**
 * Admin-only management endpoints for Fleet partners. Mounted under
 * /api/admin/fleet/*.
 */

function requireAdmin(req: any, res: Response): boolean {
  if (!req.user || !["admin", "cfo"].includes(req.user.role)) {
    res.status(403).json({ error: "forbidden" });
    return false;
  }
  return true;
}

const createFleetSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "lowercase, digits, dashes only"),
  name: z.string().min(2).max(200),
  contactEmail: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
  gdprAllowFullPii: z.boolean().optional(),
  gdprDataRetentionDays: z.number().int().min(30).max(3650).optional(),
});

const updateFleetSchema = createFleetSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export function registerFleetAdminRoutes(app: Express): void {
  // ---- List fleets ----
  app.get("/api/admin/fleet/partners", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const r: any = await fleetExec(sql`
      SELECT p.id, p.slug, p.name, p.contact_email, p.webhook_url,
             p.gdpr_allow_full_pii, p.gdpr_data_retention_days,
             p.system_user_id, p.is_active, p.created_at,
             (p.webhook_secret IS NOT NULL) AS webhook_secret_set,
             (SELECT COUNT(*)::int FROM fleet_api_keys k
                WHERE k.fleet_id = p.id AND k.revoked_at IS NULL) AS active_keys,
             (SELECT COUNT(*)::int FROM fleet_events e
                WHERE e.fleet_id = p.id AND e.created_at > now() - interval '30 days') AS events_30d
        FROM fleet_partners p
       ORDER BY p.created_at DESC
    `);
    res.json(r);
  });

  // ---- Create fleet (also provisions a system user that owns inbound RR) ----
  app.post("/api/admin/fleet/partners", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const parsed = createFleetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const d = parsed.data;
    try {
      // Provision the per-fleet system user + fleet_partners row in a single
      // CTE statement so they commit atomically (neon-http executes each
      // db.execute call in its own implicit txn, so we can't span statements).
      // Idempotent: user upsert via ON CONFLICT, fleet insert collides on slug.
      const systemUserId = `fleet-${d.slug}`;
      const webhookSecret = d.webhookUrl ? generateWebhookSecret() : null;
      const r: any = await fleetExec(sql`
        WITH upserted_user AS (
          INSERT INTO users (id, email, first_name, last_name, role, email_verified)
          VALUES (${systemUserId},
                  ${`fleet-${d.slug}@system.corion.local`},
                  ${d.name}, '(Fleet)', 'client', true)
          ON CONFLICT (id) DO UPDATE
            SET email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                updated_at = now()
          RETURNING id
        )
        INSERT INTO fleet_partners
          (slug, name, contact_email, webhook_url, webhook_secret,
           gdpr_allow_full_pii, gdpr_data_retention_days, system_user_id)
        SELECT ${d.slug}, ${d.name}, ${d.contactEmail ?? null},
               ${d.webhookUrl ?? null}, ${webhookSecret},
               ${d.gdprAllowFullPii ?? false}, ${d.gdprDataRetentionDays ?? 365},
               id
          FROM upserted_user
        RETURNING id, slug, name, contact_email, webhook_url,
                  gdpr_allow_full_pii, gdpr_data_retention_days,
                  system_user_id, is_active, created_at
      `);
      // Defensive re-query in case neon-http's RETURNING parser returned empty.
      let fleet = r[0];
      if (!fleet) {
        const reRows: any = await fleetExec(sql`
          SELECT id, slug, name, contact_email, webhook_url,
                 gdpr_allow_full_pii, gdpr_data_retention_days,
                 system_user_id, is_active, created_at
            FROM fleet_partners WHERE slug = ${d.slug}
        `);
        fleet = reRows[0];
      }
      res.status(201).json({ fleet, webhookSecret });
    } catch (err: any) {
      if (/duplicate key/i.test(String(err?.message))) {
        return res.status(409).json({ error: "slug_exists" });
      }
      console.error("[fleet-admin] create error", err);
      res.status(500).json({ error: "create_failed" });
    }
  });

  // ---- Update fleet ----
  app.patch("/api/admin/fleet/partners/:id", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const parsed = updateFleetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const id = String(req.params.id);
    const d = parsed.data;
    // Build SET clauses dynamically using sql fragments (neon-http safe).
    const sets: any[] = [];
    if (d.name !== undefined) sets.push(sql`name = ${d.name}`);
    if (d.contactEmail !== undefined) sets.push(sql`contact_email = ${d.contactEmail}`);
    if (d.webhookUrl !== undefined) {
      sets.push(sql`webhook_url = ${d.webhookUrl}`);
      // Auto-provision a secret if URL set and none exists yet, so the
      // dispatcher never signs with a null/"null" key.
      if (d.webhookUrl) {
        sets.push(sql`webhook_secret = COALESCE(webhook_secret, ${generateWebhookSecret()})`);
      }
    }
    if (d.gdprAllowFullPii !== undefined) sets.push(sql`gdpr_allow_full_pii = ${d.gdprAllowFullPii}`);
    if (d.gdprDataRetentionDays !== undefined) sets.push(sql`gdpr_data_retention_days = ${d.gdprDataRetentionDays}`);
    if (d.isActive !== undefined) sets.push(sql`is_active = ${d.isActive}`);
    if (sets.length === 0) return res.json({ ok: true, noop: true });
    const setSql = sql.join(sets, sql`, `);
    const r: any = await fleetExec(sql`
      UPDATE fleet_partners SET ${setSql} WHERE id = ${id}
      RETURNING id, slug, name, contact_email, webhook_url,
                gdpr_allow_full_pii, gdpr_data_retention_days,
                system_user_id, is_active, created_at,
                (webhook_secret IS NOT NULL) AS webhook_secret_set
    `);
    const row = r[0];
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  });

  // ---- Rotate webhook secret ----
  app.post("/api/admin/fleet/partners/:id/rotate-webhook", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const id = String(req.params.id);
    const secret = generateWebhookSecret();
    const r: any = await fleetExec(sql`
      UPDATE fleet_partners SET webhook_secret = ${secret} WHERE id = ${id} RETURNING id
    `);
    if (!r[0]) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true, webhookSecret: secret });
  });

  // ---- API keys ----
  app.get("/api/admin/fleet/partners/:id/keys", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const id = String(req.params.id);
    const r: any = await fleetExec(sql`
      SELECT id, key_id, label, revoked_at, last_used_at, created_at
        FROM fleet_api_keys WHERE fleet_id = ${id}
       ORDER BY created_at DESC
    `);
    res.json(r);
  });

  app.post("/api/admin/fleet/partners/:id/keys", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const id = String(req.params.id);
    const label = String(req.body?.label || "default");
    const { keyId, secret } = generateApiKeyPair();
    // NOTE: we persist the raw secret in `secret_hash` column for HMAC verify.
    // Trust boundary is the DB; rotation is one click. See fleet-api.ts comment.
    await fleetExec(sql`
      INSERT INTO fleet_api_keys (fleet_id, key_id, secret_hash, label)
      VALUES (${id}, ${keyId}, ${secret}, ${label})
    `);
    // Return the secret exactly once.
    res.status(201).json({ keyId, secret, label });
  });

  app.post("/api/admin/fleet/keys/:keyId/revoke", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const keyId = String(req.params.keyId);
    await fleetExec(sql`
      UPDATE fleet_api_keys SET revoked_at = now() WHERE key_id = ${keyId}
    `);
    res.json({ ok: true });
  });

  // ---- Recent events for a fleet ----
  app.get("/api/admin/fleet/partners/:id/events", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const id = String(req.params.id);
    const r: any = await fleetExec(sql`
      SELECT id, direction, event_type, method, path, status_code,
             error_message, repair_request_id, created_at
        FROM fleet_events
       WHERE fleet_id = ${id}
       ORDER BY created_at DESC
       LIMIT 100
    `);
    res.json(r);
  });

  // ---- Webhook deliveries ----
  app.get("/api/admin/fleet/partners/:id/deliveries", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const id = String(req.params.id);
    const r: any = await fleetExec(sql`
      SELECT id, event_type, status, attempts, last_response_code, last_error,
             next_attempt_at, delivered_at, created_at
        FROM fleet_webhook_deliveries
       WHERE fleet_id = ${id}
       ORDER BY created_at DESC
       LIMIT 50
    `);
    res.json(r);
  });

  // ---- Consent ledger ----
  app.get("/api/admin/fleet/partners/:id/consents", isAuthenticated, async (req: any, res) => {
    if (!requireAdmin(req, res)) return;
    const id = String(req.params.id);
    const r: any = await fleetExec(sql`
      SELECT id, subject_ref, scope, granted, legal_basis, created_at
        FROM fleet_consents
       WHERE fleet_id = ${id}
       ORDER BY created_at DESC
       LIMIT 200
    `);
    res.json(r);
  });
}
