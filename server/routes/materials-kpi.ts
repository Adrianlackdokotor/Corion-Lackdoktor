import type { Express, Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../../db/index";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";

/**
 * Materials-KPI per partner.
 *
 * Definition:
 *   actualPercent = sum(approved supplier_invoices.total_cents WHERE is_material AND partner_id=$1 in last N days)
 *                   / sum(orders.labor_cents WHERE partner_id=$1 in last N days)
 *   where orders.labor_cents = workshop_orders.labor_amount_cents
 *                              UNION ALL auftrag_orders.labor_net_cents
 *
 * targetPercent comes from users.material_kpi_target_percent (default 40).
 *
 * The target also drives the default `material_bde_percent` on new auftrag orders
 * for this partner — see `server/routes/auftrag.ts` createAuftrag().
 */
export function registerMaterialsKpiRoutes(app: Express) {
  // ---- Per-partner KPI ----
  app.get("/api/partners/:id/materials-kpi", isAuthenticated, async (req: any, res: Response) => {
    const partnerId = String(req.params.id);
    const days = Math.min(365, Math.max(7, parseInt(String(req.query.days ?? "90"), 10) || 90));
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    // Allow admin/cfo OR the partner themself.
    if (!["admin", "cfo"].includes(requester.role) && requester.id !== partnerId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const partner = await storage.getUser(partnerId);
      if (!partner) return res.status(404).json({ message: "Partner not found" });
      const target = partner.materialKpiTargetPercent ?? 40;

      const r: any = await db.execute(sql`
        SELECT
          COALESCE((SELECT SUM(total_cents)::bigint FROM supplier_invoices
                    WHERE is_material = true
                      AND partner_id = ${partnerId}
                      AND status = 'approved'
                      AND created_at >= now() - (${days} || ' days')::interval), 0) AS material_cents,
          COALESCE((
            SELECT SUM(labor_cents)::bigint FROM (
              SELECT labor_amount_cents AS labor_cents FROM workshop_orders
                WHERE partner_id = ${partnerId}
                  AND created_at >= now() - (${days} || ' days')::interval
              UNION ALL
              SELECT labor_net_cents AS labor_cents FROM auftrag_orders
                WHERE partner_id = ${partnerId}
                  AND created_at >= now() - (${days} || ' days')::interval
            ) all_orders), 0) AS labor_cents,
          COALESCE((SELECT COUNT(*)::int FROM supplier_invoices
                    WHERE is_material = true
                      AND partner_id = ${partnerId}
                      AND status = 'approved'
                      AND created_at >= now() - (${days} || ' days')::interval), 0) AS material_invoice_count,
          COALESCE((
            SELECT COUNT(*)::int FROM (
              SELECT id FROM workshop_orders
                WHERE partner_id = ${partnerId}
                  AND created_at >= now() - (${days} || ' days')::interval
              UNION ALL
              SELECT id FROM auftrag_orders
                WHERE partner_id = ${partnerId}
                  AND created_at >= now() - (${days} || ' days')::interval
            ) all_orders), 0) AS order_count
      `);
      const row = (r?.rows ?? r ?? [])[0] || {};
      const materialCents = Number(row.material_cents ?? 0);
      const laborCents = Number(row.labor_cents ?? 0);
      const actualPercent = laborCents > 0 ? (materialCents / laborCents) * 100 : null;

      // Suggested BDE: anchored at target, nudged 30% toward the actual when we
      // have data. Bounded [10, 60] to stay sane.
      let suggestedBde = target;
      if (actualPercent !== null) {
        suggestedBde = Math.round(target * 0.7 + actualPercent * 0.3);
        suggestedBde = Math.max(10, Math.min(60, suggestedBde));
      }

      res.json({
        partnerId,
        partnerName:
          [partner.firstName, partner.lastName].filter(Boolean).join(" ") ||
          partner.email ||
          "Partner",
        targetPercent: target,
        actualPercent,
        materialCents,
        laborCents,
        materialInvoiceCount: Number(row.material_invoice_count ?? 0),
        orderCount: Number(row.order_count ?? 0),
        periodDays: days,
        suggestedBdePercent: suggestedBde,
        // 40/60 split visualization data.
        partnerLaborSharePercent: 100 - target,
        materialDeductionPercent: target,
      });
    } catch (err: any) {
      console.error("[materials-kpi] partner error", err);
      res.status(500).json({ message: "Failed to load materials KPI" });
    }
  });

  // ---- Aggregate KPI for admin dashboard (all partners) ----
  app.get("/api/admin/materials-kpi", isAuthenticated, async (req: any, res: Response) => {
    const requester = req.user;
    if (!requester || !["admin", "cfo"].includes(requester.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const days = Math.min(365, Math.max(7, parseInt(String(req.query.days ?? "90"), 10) || 90));
    try {
      const r: any = await db.execute(sql`
        WITH all_partner_orders AS (
          SELECT partner_id, labor_amount_cents AS labor_cents FROM workshop_orders
           WHERE partner_id IS NOT NULL
             AND created_at >= now() - (${days} || ' days')::interval
          UNION ALL
          SELECT partner_id, labor_net_cents AS labor_cents FROM auftrag_orders
           WHERE partner_id IS NOT NULL
             AND created_at >= now() - (${days} || ' days')::interval
        ),
        partner_orders AS (
          SELECT partner_id, COALESCE(SUM(labor_cents), 0)::bigint AS labor_cents,
                 COUNT(*)::int AS order_count
            FROM all_partner_orders
           GROUP BY partner_id
        ),
        partner_materials AS (
          SELECT partner_id, COALESCE(SUM(total_cents), 0)::bigint AS material_cents,
                 COUNT(*)::int AS invoice_count
            FROM supplier_invoices
           WHERE is_material = true
             AND status = 'approved'
             AND partner_id IS NOT NULL
             AND created_at >= now() - (${days} || ' days')::interval
           GROUP BY partner_id
        )
        SELECT u.id AS partner_id,
               TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS partner_name,
               COALESCE(u.email, '') AS partner_email,
               COALESCE(u.company, '') AS partner_company,
               COALESCE(u.material_kpi_target_percent, 40) AS target_percent,
               COALESCE(po.labor_cents, 0) AS labor_cents,
               COALESCE(po.order_count, 0) AS order_count,
               COALESCE(pm.material_cents, 0) AS material_cents,
               COALESCE(pm.invoice_count, 0) AS invoice_count
          FROM users u
          LEFT JOIN partner_orders   po ON po.partner_id = u.id
          LEFT JOIN partner_materials pm ON pm.partner_id = u.id
         WHERE u.role IN ('partner','mechanic')
           AND (po.labor_cents > 0 OR pm.material_cents > 0 OR u.material_kpi_target_percent IS NOT NULL)
         ORDER BY COALESCE(po.labor_cents, 0) DESC
         LIMIT 50
      `);
      const rows = (r?.rows ?? r ?? []).map((row: any) => {
        const labor = Number(row.labor_cents ?? 0);
        const material = Number(row.material_cents ?? 0);
        const target = Number(row.target_percent ?? 40);
        const actual = labor > 0 ? (material / labor) * 100 : null;
        return {
          partnerId: row.partner_id,
          partnerName: row.partner_name || row.partner_email || "Partner",
          partnerCompany: row.partner_company || null,
          targetPercent: target,
          actualPercent: actual,
          materialCents: material,
          laborCents: labor,
          orderCount: Number(row.order_count ?? 0),
          invoiceCount: Number(row.invoice_count ?? 0),
        };
      });
      res.json({ periodDays: days, partners: rows });
    } catch (err: any) {
      console.error("[materials-kpi] admin error", err);
      res.status(500).json({ message: "Failed to load aggregate KPI" });
    }
  });
}
