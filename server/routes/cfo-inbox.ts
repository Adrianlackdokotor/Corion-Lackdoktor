import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "../../db/index";
import { supplierInvoices, fileAttachments, auditLogs } from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { logAudit, listAuditEvents } from "../services/auditLog";
import { extractInvoiceFromAttachment } from "../services/invoiceExtractor";

function isAdminOrCfo(user: any): boolean {
  return user?.role === "admin" || user?.role === "cfo";
}

/**
 * Read invoices via raw SQL to avoid drizzle/neon-http `Invalid Date`
 * round-trip issues on `timestamp without time zone`.
 */
async function selectInvoicesRaw(opts: { id?: string; status?: string; limit?: number }) {
  const filters: any[] = [];
  if (opts.id) filters.push(sql`i.id = ${opts.id}`);
  if (opts.status) filters.push(sql`i.status = ${opts.status}`);
  const where = filters.length ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``;
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  try {
    const r: any = await db.execute(sql`
      SELECT
        i.id,
        i.file_attachment_id,
        i.workshop_order_id,
        i.supplier_name,
        i.invoice_number,
        i.invoice_date,
        i.total_cents,
        i.vat_cents,
        i.currency,
        i.status,
        i.extracted_json,
        i.notes,
        i.approved_by,
        to_char(i.approved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS approved_at,
        i.rejected_reason,
        to_char(i.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
        f.original_name AS file_name,
        f.mime_type AS file_mime,
        f.size AS file_size,
        f.drive_link AS file_drive_link
      FROM supplier_invoices i
      LEFT JOIN file_attachments f ON f.id = i.file_attachment_id
      ${where}
      ORDER BY i.created_at DESC
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
      return [];
    }
    throw err;
  }
}

const rejectSchema = z.object({ reason: z.string().min(1).max(2000) });

export function registerCfoInboxRoutes(app: Express) {
  app.get("/api/invoices", isAuthenticated, async (req: any, res: Response) => {
    if (!isAdminOrCfo(req.user)) return res.status(403).json({ message: "Zugriff verweigert" });
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const rows = await selectInvoicesRaw({ status, limit: 200 });
    res.json({ invoices: rows });
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req: any, res: Response) => {
    if (!isAdminOrCfo(req.user)) return res.status(403).json({ message: "Zugriff verweigert" });
    const rows = await selectInvoicesRaw({ id: req.params.id, limit: 1 });
    if (!rows[0]) return res.status(404).json({ message: "Rechnung nicht gefunden" });
    res.json({ invoice: rows[0] });
  });

  app.post("/api/invoices/:id/approve", isAuthenticated, async (req: any, res: Response) => {
    if (!isAdminOrCfo(req.user)) return res.status(403).json({ message: "Zugriff verweigert" });
    const id = req.params.id;
    // Race-safe: only the row currently in pending_approval gets stamped; a
    // second concurrent approve sees rowCount=0 and returns the existing row.
    const result: any = await db.execute(sql`
      UPDATE supplier_invoices
      SET status = 'approved',
          approved_by = ${req.user.id},
          approved_at = now()
      WHERE id = ${id} AND status = 'pending_approval'
    `);
    const updated = (result?.rowCount ?? 0) > 0;
    const rows = await selectInvoicesRaw({ id, limit: 1 });
    if (!rows[0]) return res.status(404).json({ message: "Rechnung nicht gefunden" });
    if (updated) {
      await logAudit({
        actorUserId: req.user.id,
        actorLabel: req.user.email ?? req.user.role ?? "admin",
        action: "invoice.approve",
        entityType: "supplier_invoice",
        entityId: id,
        meta: { totalCents: rows[0].total_cents, supplier: rows[0].supplier_name },
        ip: req.ip,
      });
    }
    res.json({ invoice: rows[0], updated });
  });

  app.post("/api/invoices/:id/reject", isAuthenticated, async (req: any, res: Response) => {
    if (!isAdminOrCfo(req.user)) return res.status(403).json({ message: "Zugriff verweigert" });
    const parse = rejectSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ message: "reason erforderlich" });
    const id = req.params.id;
    const result: any = await db.execute(sql`
      UPDATE supplier_invoices
      SET status = 'rejected',
          rejected_reason = ${parse.data.reason},
          approved_by = ${req.user.id},
          approved_at = now()
      WHERE id = ${id} AND status = 'pending_approval'
    `);
    const updated = (result?.rowCount ?? 0) > 0;
    const rows = await selectInvoicesRaw({ id, limit: 1 });
    if (!rows[0]) return res.status(404).json({ message: "Rechnung nicht gefunden" });
    if (updated) {
      await logAudit({
        actorUserId: req.user.id,
        actorLabel: req.user.email ?? req.user.role ?? "admin",
        action: "invoice.reject",
        entityType: "supplier_invoice",
        entityId: id,
        meta: { reason: parse.data.reason, supplier: rows[0].supplier_name },
        ip: req.ip,
      });
    }
    res.json({ invoice: rows[0], updated });
  });

  app.post("/api/invoices/:id/extract", isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Nur Admin" });
    const [inv] = await db
      .select({ fileAttachmentId: supplierInvoices.fileAttachmentId })
      .from(supplierInvoices)
      .where(eq(supplierInvoices.id, req.params.id))
      .limit(1);
    if (!inv) return res.status(404).json({ message: "Rechnung nicht gefunden" });
    // Delete and re-extract: keeps it explicit. For safety only allow when not approved.
    const [current] = await db
      .select({ status: supplierInvoices.status })
      .from(supplierInvoices)
      .where(eq(supplierInvoices.id, req.params.id))
      .limit(1);
    if (current?.status === "approved") {
      return res.status(409).json({ message: "Bereits genehmigt — nicht erneut extrahierbar" });
    }
    await db.delete(supplierInvoices).where(eq(supplierInvoices.id, req.params.id));
    const out = await extractInvoiceFromAttachment(inv.fileAttachmentId);
    res.json({ invoiceId: out.id, status: out.status });
  });

  app.get("/api/audit-logs", isAuthenticated, async (req: any, res: Response) => {
    if (!isAdminOrCfo(req.user)) return res.status(403).json({ message: "Zugriff verweigert" });
    const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 500);
    const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
    const entityId = typeof req.query.entityId === "string" ? req.query.entityId : undefined;
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const events = await listAuditEvents({ limit, entityType, entityId, action });
    res.json({ events });
  });
}
