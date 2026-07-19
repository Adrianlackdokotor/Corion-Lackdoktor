import { db } from "../../db/index";
import { auditLogs } from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type AuditAction =
  | "document.upload"
  | "document.delete"
  | "invoice.extract"
  | "invoice.extract_failed"
  | "invoice.approve"
  | "invoice.reject"
  | "invoice.view"
  | string;

export interface AuditEntry {
  actorUserId?: string | null;
  actorLabel?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, any> | null;
  ip?: string | null;
}

/** Fire-and-forget audit logger. Never throws to caller.
 *  Uses dynamic SQL because drizzle + neon-http binds JS `null` as the string
 *  "null" — which (a) breaks varchar FKs (becomes "") and (b) breaks jsonb
 *  parsing. We omit nullable columns from the INSERT entirely.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const cols: string[] = ["action", "entity_type"];
    const vals: any[] = [sql`${entry.action}`, sql`${entry.entityType}`];
    if (entry.actorUserId) { cols.push("actor_user_id"); vals.push(sql`${entry.actorUserId}`); }
    if (entry.actorLabel) { cols.push("actor_label"); vals.push(sql`${entry.actorLabel}`); }
    if (entry.entityId) { cols.push("entity_id"); vals.push(sql`${entry.entityId}`); }
    if (entry.meta != null) { cols.push("meta"); vals.push(sql`${JSON.stringify(entry.meta)}::jsonb`); }
    if (entry.ip) { cols.push("ip"); vals.push(sql`${entry.ip}`); }
    const colsSql = sql.raw(cols.join(", "));
    const valsSql = sql.join(vals, sql`, `);
    await db.execute(sql`INSERT INTO audit_logs (${colsSql}) VALUES (${valsSql})`);
  } catch (err: any) {
    console.error("[auditLog] failed", err?.message ?? err);
  }
}

export interface AuditQuery {
  limit?: number;
  entityType?: string;
  entityId?: string;
  action?: string;
}

/**
 * List audit events. Reads timestamp via raw SQL `to_char` because drizzle +
 * neon-http returns Invalid Date for `timestamp without time zone`.
 */
export async function listAuditEvents(q: AuditQuery = {}): Promise<Array<{
  id: string;
  actor_user_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  meta: any;
  ip: string | null;
  created_at: string;
}>> {
  const limit = Math.min(Math.max(q.limit ?? 100, 1), 500);
  const filters: any[] = [];
  if (q.entityType) filters.push(sql`entity_type = ${q.entityType}`);
  if (q.entityId) filters.push(sql`entity_id = ${q.entityId}`);
  if (q.action) filters.push(sql`action = ${q.action}`);
  const where = filters.length
    ? sql`WHERE ${sql.join(filters, sql` AND `)}`
    : sql``;

  try {
    const r: any = await db.execute(sql`
      SELECT
        id,
        actor_user_id,
        actor_label,
        action,
        entity_type,
        entity_id,
        meta,
        ip,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
      FROM audit_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
    return (r?.rows ?? r ?? []) as any[];
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const stack = String(err?.stack ?? "");
    if (
      msg.includes("Cannot read properties of null") &&
      msg.includes("'map'") &&
      stack.includes("@neondatabase/serverless") &&
      stack.includes("processQueryResult")
    ) {
      return []; // neon parser bug on empty results
    }
    throw err;
  }
}
