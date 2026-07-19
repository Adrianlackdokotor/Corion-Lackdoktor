import { sql } from "drizzle-orm";
import { db } from "../../db/index";
import { signRequest } from "./fleetCrypto";
import crypto from "crypto";

/**
 * Outbound webhook dispatcher with exponential backoff.
 *
 * Schedule: 0s, 1m, 5m, 30m, 2h, 12h. After 6 failed attempts → status='dead'.
 * The scheduler polls every 30s for due deliveries; race-safety via FOR UPDATE
 * SKIP LOCKED is not supported on neon-http, so we use a status='sending' flip
 * with conditional WHERE to claim a row atomically.
 */

const RETRY_DELAYS_MS = [
  0,
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length;
const POLL_INTERVAL_MS = 30_000;
const HTTP_TIMEOUT_MS = 10_000;

/**
 * Enqueue a webhook delivery for the given fleet. Fire-and-forget; if the
 * fleet has no webhook URL configured this is a no-op.
 */
export async function enqueueFleetWebhook(args: {
  fleetId: string;
  eventType: string;
  payload: Record<string, unknown>;
  repairRequestId?: string | null;
}): Promise<void> {
  try {
    const fleetRes: any = await db.execute(sql`
      SELECT webhook_url, is_active FROM fleet_partners WHERE id = ${args.fleetId}
    `);
    const fleet = (fleetRes?.rows ?? fleetRes ?? [])[0];
    if (!fleet || !fleet.webhook_url || !fleet.is_active) return;
    await db.execute(sql`
      INSERT INTO fleet_webhook_deliveries
        (fleet_id, event_type, payload, repair_request_id, status, next_attempt_at)
      VALUES
        (${args.fleetId}, ${args.eventType}, ${JSON.stringify(args.payload)}::jsonb,
         ${args.repairRequestId ?? null}, 'pending', now())
    `);
    // Trigger an immediate processing pass.
    setImmediate(() => processDueDeliveries().catch(() => {}));
  } catch (err) {
    console.error("[fleetWebhooks] enqueue failed", err);
  }
}

async function safeExecute(query: any): Promise<any[]> {
  try {
    const r: any = await db.execute(query);
    return r?.rows ?? r ?? [];
  } catch (err: any) {
    // neon-http parser bug: empty result set throws "Cannot read properties of null (reading 'map')".
    if (/reading 'map'|Cannot read properties of null/i.test(String(err?.message))) {
      return [];
    }
    throw err;
  }
}

async function processDueDeliveries(): Promise<void> {
  try {
    const rows = await safeExecute(sql`
      SELECT d.id, d.fleet_id, d.event_type, d.payload, d.attempts,
             p.webhook_url, p.webhook_secret
        FROM fleet_webhook_deliveries d
        JOIN fleet_partners p ON p.id = d.fleet_id
       WHERE d.status = 'pending'
         AND d.next_attempt_at <= now()
         AND p.is_active = true
       ORDER BY d.next_attempt_at ASC
       LIMIT 25
    `);
    for (const row of rows) {
      // Atomically claim the row by flipping to 'sending'.
      const claimed = (await safeExecute(sql`
        UPDATE fleet_webhook_deliveries
           SET status = 'sending'
         WHERE id = ${row.id} AND status = 'pending'
         RETURNING id
      `))[0];
      if (!claimed) continue; // another worker grabbed it
      await deliverOne(row).catch((e) => console.error("[fleetWebhooks] delivery error", e));
    }
  } catch (err) {
    console.error("[fleetWebhooks] poll error", err);
  }
}

async function deliverOne(row: any): Promise<void> {
  const attempts = Number(row.attempts ?? 0) + 1;
  const body = JSON.stringify({ event: row.event_type, data: row.payload });
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(12).toString("hex");
  const url = String(row.webhook_url);
  let path = "/";
  try {
    path = new URL(url).pathname || "/";
  } catch {}
  if (!row.webhook_secret) {
    // Hard-fail rather than sign with "null". Mark dead so admin sees it.
    await db.execute(sql`
      UPDATE fleet_webhook_deliveries
         SET status = 'dead', last_error = 'webhook_secret_missing'
       WHERE id = ${row.id}
    `);
    return;
  }
  const signature = signRequest(String(row.webhook_secret), {
    timestamp,
    nonce,
    method: "POST",
    path,
    body,
  });

  let statusCode: number | null = null;
  let lastError: string | null = null;
  let ok = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-fleet-event": String(row.event_type),
        "x-fleet-timestamp": timestamp,
        "x-fleet-nonce": nonce,
        "x-fleet-signature": signature,
      },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    statusCode = res.status;
    ok = res.status >= 200 && res.status < 300;
    if (!ok) lastError = `HTTP ${res.status}`;
  } catch (err: any) {
    lastError = err?.message || String(err);
  }

  if (ok) {
    await db.execute(sql`
      UPDATE fleet_webhook_deliveries
         SET status = 'delivered', attempts = ${attempts},
             last_response_code = ${statusCode}, last_error = NULL,
             delivered_at = now()
       WHERE id = ${row.id}
    `);
    await db.execute(sql`
      INSERT INTO fleet_events (fleet_id, direction, event_type, status_code, payload)
      VALUES (${row.fleet_id}, 'outbound', ${row.event_type}, ${statusCode}, ${JSON.stringify(row.payload)}::jsonb)
    `);
    return;
  }

  // failure path
  if (attempts >= MAX_ATTEMPTS) {
    await db.execute(sql`
      UPDATE fleet_webhook_deliveries
         SET status = 'dead', attempts = ${attempts},
             last_response_code = ${statusCode}, last_error = ${lastError}
       WHERE id = ${row.id}
    `);
  } else {
    const nextDelay = RETRY_DELAYS_MS[attempts] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    await db.execute(sql`
      UPDATE fleet_webhook_deliveries
         SET status = 'pending', attempts = ${attempts},
             last_response_code = ${statusCode}, last_error = ${lastError},
             next_attempt_at = now() + make_interval(secs => ${nextDelay / 1000})
       WHERE id = ${row.id}
    `);
  }
}

let timer: NodeJS.Timeout | null = null;
export function startFleetWebhookScheduler(): void {
  if (timer) return;
  timer = setInterval(() => {
    processDueDeliveries().catch(() => {});
  }, POLL_INTERVAL_MS);
  // Run once immediately on boot to flush any pending from a prior process.
  setImmediate(() => processDueDeliveries().catch(() => {}));
  console.log("[fleetWebhooks] scheduler started (poll every 30s)");
}
