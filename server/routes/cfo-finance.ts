import type { Express, Response } from "express";
import { isAuthenticated } from "../auth";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { buildLanguageInstruction } from "../lib/agentLanguage";

// neon-http occasionally returns `null` rows for queries whose result set is
// empty (e.g. CTEs whose IN-subquery resolves to zero matching ids). The
// driver's processQueryResult then throws "Cannot read properties of null
// (reading 'map')". Catch that one specific class of error and degrade to an
// empty result so dashboards stay green even when filters match nothing.
async function safeExec<T = any>(query: any): Promise<{ rows: T[] }> {
  try {
    const r: any = await db.execute(query);
    return { rows: (r?.rows ?? r ?? []) as T[] };
  } catch (e: any) {
    const msg = String(e?.message || e?.cause?.message || "");
    const stack = String(e?.cause?.stack || e?.stack || "");
    // Narrow guard: only the specific neon-http processQueryResult bug where
    // an empty result set is deserialized as `null`. Both the error text AND
    // the @neondatabase/serverless stack frame must be present.
    const isNeonNullRowsBug =
      msg.includes("Cannot read properties of null") &&
      msg.includes("reading 'map'") &&
      stack.includes("@neondatabase/serverless");
    if (isNeonNullRowsBug) {
      console.warn("[cfo/cashflow] neon-http null-rows bug — degrading to empty result");
      return { rows: [] };
    }
    throw e;
  }
}

/**
 * Aggregated cashflow snapshot for the CFO Dashboard.
 *
 * Source of truth (real DB):
 *   - workshop_orders.total_amount_cents (gross customer revenue)
 *   - workshop_orders.partner_payout_net_cents (partner payout)
 *   - workshop_orders.corion_share_cents (Corion margin)
 *   - workshop_orders.material_deduction_cents (cost of materials)
 *   - workshop_orders.created_at (time bucket)
 *   - workshop_orders.partner_id → users.name (partner)
 *   - workshop_orders.location (Mainz-Kastel | Wallau | …)
 *   - supplier_invoices.total_cents (approved invoices = expenses)
 *
 * Returns three slices the chart consumes:
 *   - byMonth:    [{ month: 'YYYY-MM', incomeCents, expenseCents, profitCents }]
 *   - byPartner:  [{ partnerId, partnerName, revenueCents, payoutCents, corionCents, orderCount }]
 *   - byLocation: [{ location, revenueCents, expenseCents, orderCount }]
 *   - totals:     { incomeCents, expenseCents, profitCents, partnerPayoutCents, openInvoicesCents, openInvoicesCount, ordersCount }
 *
 * Defaults to last 6 calendar months. Override with ?months=12.
 */
const VALID_DRILLDOWN_ROUTES = new Set([
  "/auftraege",
  "/admin",
  "/admin/calendar",
  "/admin/partner-payouts",
  "/finanzen/detail",
  "/cfo-inbox",
]);

export function registerCfoFinanceRoutes(app: Express) {
  app.get("/api/cfo/cashflow", isAuthenticated, async (req: any, res: Response) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "cfo") {
      return res.status(403).json({ message: "Zugriff verweigert" });
    }

    const monthsRaw = parseInt(String(req.query.months ?? "6"), 10);
    const months = Math.min(Math.max(isNaN(monthsRaw) ? 6 : monthsRaw, 1), 24);
    const locationFilter = String(req.query.location ?? "").trim();
    const partnerFilter = String(req.query.partner ?? "").trim();
    const hasLocation = locationFilter && locationFilter !== "ALL";
    const hasPartner = partnerFilter && partnerFilter !== "ALL";

    // Build optional WHERE fragments. partner can be either a user.id (uuid) or
    // a display name; we match both via OR. location matches users.company.
    const orderFilter = hasLocation || hasPartner
      ? sql` AND o.partner_id IN (SELECT id FROM users WHERE 1=1 ${
          hasLocation ? sql` AND COALESCE(NULLIF(company, ''), 'Werkstatt') = ${locationFilter}` : sql``
        } ${
          hasPartner ? sql` AND (id::text = ${partnerFilter} OR email = ${partnerFilter} OR NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), '') = ${partnerFilter} OR company = ${partnerFilter})` : sql``
        })`
      : sql``;

    try {
      // ---- byMonth ----------------------------------------------------------
      // Build the last `months` month buckets, left-join orders & invoices.
      // Note: supplier_invoices are NOT filtered by partner/location (they're
      // company-wide expenses today).
      const monthSeries: any = await safeExec(sql`
        WITH months AS (
          SELECT
            to_char(date_trunc('month', (CURRENT_DATE - (g || ' month')::interval)), 'YYYY-MM') AS month
          FROM generate_series(0, ${months - 1}) AS g
        ),
        orders AS (
          SELECT
            to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(o.total_amount_cents), 0)::bigint AS income_cents
          FROM workshop_orders o
          WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
          ${orderFilter}
          GROUP BY 1
        ),
        invs AS (
          SELECT
            to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(total_cents), 0)::bigint AS expense_cents
          FROM supplier_invoices
          WHERE status = 'approved'
            AND created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
          GROUP BY 1
        )
        SELECT
          m.month,
          COALESCE(o.income_cents, 0) AS income_cents,
          COALESCE(i.expense_cents, 0) AS expense_cents,
          COALESCE(o.income_cents, 0) - COALESCE(i.expense_cents, 0) AS profit_cents
        FROM months m
        LEFT JOIN orders o ON o.month = m.month
        LEFT JOIN invs   i ON i.month = m.month
        ORDER BY m.month ASC
      `);

      // ---- byPartner --------------------------------------------------------
      const partnerSeries: any = await safeExec(sql`
        SELECT
          o.partner_id AS partner_id,
          COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.company, u.email, 'Unbekannt') AS partner_name,
          COALESCE(SUM(o.total_amount_cents), 0)::bigint AS revenue_cents,
          COALESCE(SUM(o.partner_payout_net_cents), 0)::bigint AS payout_cents,
          COALESCE(SUM(o.corion_share_cents), 0)::bigint AS corion_cents,
          COUNT(*)::int AS order_count
        FROM workshop_orders o
        LEFT JOIN users u ON u.id = o.partner_id
        WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
          AND o.partner_id IS NOT NULL
        ${orderFilter}
        GROUP BY o.partner_id, u.first_name, u.last_name, u.company, u.email
        ORDER BY revenue_cents DESC
        LIMIT 12
      `);

      // ---- byLocation -------------------------------------------------------
      const locationSeries: any = await safeExec(sql`
        SELECT
          COALESCE(NULLIF(u.company, ''), 'Werkstatt') AS location,
          COALESCE(SUM(o.total_amount_cents), 0)::bigint AS revenue_cents,
          COUNT(*)::int AS order_count
        FROM workshop_orders o
        LEFT JOIN users u ON u.id = o.partner_id
        WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
        ${orderFilter}
        GROUP BY 1
        ORDER BY revenue_cents DESC
        LIMIT 8
      `);

      // ---- totals (current period) -----------------------------------------
      const totalsRow: any = await safeExec(sql`
        SELECT
          (SELECT COALESCE(SUM(o.total_amount_cents), 0)::bigint FROM workshop_orders o WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval ${orderFilter}) AS income_cents,
          (SELECT COALESCE(SUM(total_cents), 0)::bigint FROM supplier_invoices WHERE status = 'approved' AND created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval) AS expense_cents,
          (SELECT COALESCE(SUM(o.partner_payout_net_cents), 0)::bigint FROM workshop_orders o WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval ${orderFilter}) AS partner_payout_cents,
          (SELECT COALESCE(SUM(total_cents), 0)::bigint FROM supplier_invoices WHERE status = 'pending_approval') AS open_invoices_cents,
          (SELECT COUNT(*)::int FROM supplier_invoices WHERE status = 'pending_approval') AS open_invoices_count,
          (SELECT COUNT(*)::int FROM workshop_orders o WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval ${orderFilter}) AS orders_count,
          (SELECT COALESCE(SUM(o.total_amount_cents) FILTER (WHERE LOWER(o.payment_method) IN ('bar','cash')), 0)::bigint FROM workshop_orders o WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval ${orderFilter}) AS bar_cents,
          (SELECT COALESCE(SUM(o.total_amount_cents) FILTER (WHERE LOWER(o.payment_method) NOT IN ('bar','cash') OR o.payment_method IS NULL), 0)::bigint FROM workshop_orders o WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval ${orderFilter}) AS konto_cents
      `);

      // ---- previous period (same length, immediately before) ---------------
      const previousRow: any = await safeExec(sql`
        SELECT
          (SELECT COALESCE(SUM(o.total_amount_cents), 0)::bigint FROM workshop_orders o
            WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${(months * 2) - 1} || ' month')::interval
              AND o.created_at <  date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
            ${orderFilter}) AS income_cents,
          (SELECT COALESCE(SUM(total_cents), 0)::bigint FROM supplier_invoices
            WHERE status = 'approved'
              AND created_at >= date_trunc('month', CURRENT_DATE) - (${(months * 2) - 1} || ' month')::interval
              AND created_at <  date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
          ) AS expense_cents,
          (SELECT COUNT(*)::int FROM workshop_orders o
            WHERE o.created_at >= date_trunc('month', CURRENT_DATE) - (${(months * 2) - 1} || ' month')::interval
              AND o.created_at <  date_trunc('month', CURRENT_DATE) - (${months - 1} || ' month')::interval
            ${orderFilter}) AS orders_count
      `);

      const t = totalsRow.rows?.[0] ?? {};
      const p = previousRow.rows?.[0] ?? {};
      const incomeCents = Number(t.income_cents ?? 0);
      const expenseCents = Number(t.expense_cents ?? 0);
      const prevIncome = Number(p.income_cents ?? 0);
      const prevExpense = Number(p.expense_cents ?? 0);

      return res.json({
        months,
        filters: {
          location: hasLocation ? locationFilter : null,
          partner: hasPartner ? partnerFilter : null,
        },
        byMonth: (monthSeries.rows ?? []).map((r: any) => ({
          month: r.month,
          incomeCents: Number(r.income_cents ?? 0),
          expenseCents: Number(r.expense_cents ?? 0),
          profitCents: Number(r.profit_cents ?? 0),
        })),
        byPartner: (partnerSeries.rows ?? []).map((r: any) => ({
          partnerId: r.partner_id,
          partnerName: r.partner_name ?? "Unbekannt",
          revenueCents: Number(r.revenue_cents ?? 0),
          payoutCents: Number(r.payout_cents ?? 0),
          corionCents: Number(r.corion_cents ?? 0),
          orderCount: Number(r.order_count ?? 0),
        })),
        byLocation: (locationSeries.rows ?? []).map((r: any) => ({
          location: r.location ?? "Werkstatt",
          revenueCents: Number(r.revenue_cents ?? 0),
          orderCount: Number(r.order_count ?? 0),
        })),
        totals: {
          incomeCents,
          expenseCents,
          profitCents: incomeCents - expenseCents,
          partnerPayoutCents: Number(t.partner_payout_cents ?? 0),
          openInvoicesCents: Number(t.open_invoices_cents ?? 0),
          openInvoicesCount: Number(t.open_invoices_count ?? 0),
          ordersCount: Number(t.orders_count ?? 0),
          barCents: Number(t.bar_cents ?? 0),
          kontoCents: Number(t.konto_cents ?? 0),
        },
        previous: {
          incomeCents: prevIncome,
          expenseCents: prevExpense,
          profitCents: prevIncome - prevExpense,
          ordersCount: Number(p.orders_count ?? 0),
        },
      });
    } catch (err: any) {
      console.error("[cfo/cashflow] error:", err?.message || err);
      return res.status(500).json({ message: "Failed to load cashflow", error: err?.message });
    }
  });

  // ---- Drill-down: orders + invoices for a single YYYY-MM bucket -----------
  app.get("/api/cfo/cashflow/month/:month", isAuthenticated, async (req: any, res: Response) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "cfo") {
      return res.status(403).json({ message: "Zugriff verweigert" });
    }
    const month = String(req.params.month || "");
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month must be YYYY-MM" });
    }
    try {
      const orders: any = await safeExec(sql`
        SELECT
          o.id,
          o.reference_number,
          o.customer_name,
          to_char(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS created_date,
          o.total_amount_cents,
          o.partner_payout_net_cents,
          o.corion_share_cents,
          o.status,
          o.payment_status,
          COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.company, u.email, '—') AS partner_name,
          COALESCE(NULLIF(u.company, ''), 'Werkstatt') AS location
        FROM workshop_orders o
        LEFT JOIN users u ON u.id = o.partner_id
        WHERE to_char(date_trunc('month', o.created_at), 'YYYY-MM') = ${month}
        ORDER BY o.created_at DESC
        LIMIT 100
      `);
      const invs: any = await safeExec(sql`
        SELECT
          i.id,
          i.supplier_name,
          i.invoice_number,
          i.total_cents,
          i.status,
          to_char(i.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS created_date
        FROM supplier_invoices i
        WHERE to_char(date_trunc('month', i.created_at), 'YYYY-MM') = ${month}
        ORDER BY i.created_at DESC
        LIMIT 100
      `);
      return res.json({
        month,
        orders: (orders.rows ?? []).map((r: any) => ({
          id: r.id,
          referenceNumber: r.reference_number,
          customerName: r.customer_name,
          createdDate: r.created_date,
          totalCents: Number(r.total_amount_cents ?? 0),
          partnerPayoutCents: Number(r.partner_payout_net_cents ?? 0),
          corionCents: Number(r.corion_share_cents ?? 0),
          status: r.status,
          paymentStatus: r.payment_status,
          partnerName: r.partner_name,
          location: r.location,
        })),
        invoices: (invs.rows ?? []).map((r: any) => ({
          id: r.id,
          supplierName: r.supplier_name,
          invoiceNumber: r.invoice_number,
          totalCents: Number(r.total_cents ?? 0),
          status: r.status,
          createdDate: r.created_date,
        })),
      });
    } catch (err: any) {
      console.error("[cfo/cashflow/month] error:", err?.message || err);
      return res.status(500).json({ message: "Failed to load month detail", error: err?.message });
    }
  });

  // ---- AI Advisor: 3-5 actionable, German bullets ---------------------------
  // Cached in-memory for 60s per role, keyed by snapshot fingerprint.
  const adviceCache = new Map<string, { ts: number; advice: any }>();
  let aiClient: GoogleGenAI | null = null;
  const getAi = (): GoogleGenAI | null => {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!key) return null;
    if (!aiClient) aiClient = new GoogleGenAI({ apiKey: key });
    return aiClient;
  };

  app.post("/api/cfo/ai-advice", isAuthenticated, async (req: any, res: Response) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "cfo") {
      return res.status(403).json({ message: "Zugriff verweigert" });
    }

    const snapshot = req.body?.snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return res.status(400).json({ message: "snapshot required" });
    }

    const fingerprint = JSON.stringify({
      i: snapshot?.totals?.incomeCents,
      e: snapshot?.totals?.expenseCents,
      p: snapshot?.totals?.partnerPayoutCents,
      o: snapshot?.totals?.openInvoicesCount,
      pn: (snapshot?.byPartner ?? []).length,
      ln: (snapshot?.byLocation ?? []).length,
    });
    const cached = adviceCache.get(fingerprint);
    if (cached && Date.now() - cached.ts < 60_000) {
      return res.json({ advice: cached.advice, cached: true });
    }

    const ai = getAi();
    if (!ai) {
      return res.json({
        advice: heuristicAdvice(snapshot),
        cached: false,
        source: "heuristic",
      });
    }

    try {
      const prompt = buildAdvicePrompt(snapshot);
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string", enum: ["positive", "info", "warning", "critical"] },
                    title: { type: "string" },
                    body: { type: "string" },
                    action: { type: "string" },
                  },
                  required: ["severity", "title", "body"],
                },
              },
            },
            required: ["insights"],
          },
        },
      });
      const text = result.text ?? "";
      const parsed = JSON.parse(text);
      const advice = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [];
      adviceCache.set(fingerprint, { ts: Date.now(), advice });
      return res.json({ advice, cached: false, source: "gemini" });
    } catch (err: any) {
      console.warn("[cfo/ai-advice] gemini failed, falling back:", err?.message);
      return res.json({
        advice: heuristicAdvice(snapshot),
        cached: false,
        source: "heuristic",
        warning: err?.message,
      });
    }
  });

  // ---- Finance Agent: grounded Q&A against live dashboard context ----------
  app.post("/api/cfo/agent-query", isAuthenticated, async (req: any, res: Response) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "cfo") {
      return res.status(403).json({ message: "Zugriff verweigert" });
    }

    const { question, context } = req.body ?? {};
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "question required" });
    }

    const cleanQuestion = question.trim().slice(0, 500);
    const attentionItems: any[] = Array.isArray(context?.attentionItems) ? context.attentionItems : [];
    const signals: any = context?.signals ?? {};
    const snapshot: any = context?.snapshot ?? {};

    const ai = getAi();
    if (!ai) {
      return res.json({
        answer:          buildHeuristicAgentAnswer(cleanQuestion, attentionItems, signals, snapshot),
        relevantItemIds: [],
        drilldowns:      buildHeuristicDrilldowns(attentionItems, signals, snapshot),
        source: "heuristic",
      });
    }

    try {
      const systemPrompt = buildAgentSystemPrompt(attentionItems, signals, snapshot, cleanQuestion);
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: cleanQuestion }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              answer:          { type: "string" },
              relevantItemIds: { type: "array", items: { type: "string" } },
              drilldowns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    href:   { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["href", "reason"],
                },
              },
            },
            required: ["answer", "relevantItemIds", "drilldowns"],
          },
        },
      });
      const text = result.text ?? "";
      const parsed = JSON.parse(text);
      const rawDrilldowns: any[] = Array.isArray(parsed.drilldowns) ? parsed.drilldowns : [];
      const drilldowns = rawDrilldowns
        .filter((d: any) =>
          typeof d.href === "string" &&
          typeof d.reason === "string" &&
          VALID_DRILLDOWN_ROUTES.has(d.href)
        )
        .slice(0, 2)
        .map((d: any) => ({ href: d.href as string, reason: d.reason as string }));

      return res.json({
        answer:          typeof parsed.answer === "string" ? parsed.answer : "",
        relevantItemIds: Array.isArray(parsed.relevantItemIds) ? parsed.relevantItemIds : [],
        drilldowns,
        source: "gemini",
      });
    } catch (err: any) {
      console.warn("[cfo/agent-query] gemini failed:", err?.message);
      return res.json({
        answer:          buildHeuristicAgentAnswer(cleanQuestion, attentionItems, signals, snapshot),
        relevantItemIds: [],
        drilldowns:      buildHeuristicDrilldowns(attentionItems, signals, snapshot),
        source: "heuristic",
        warning: err?.message,
      });
    }
  });

  // ---- Payout gaps: completed partner orders with no payout defined ----------

  app.get("/api/cfo/payout-gaps", isAuthenticated, async (req: any, res: Response) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "cfo") {
      return res.status(403).json({ message: "Zugriff verweigert" });
    }
    try {
      const rows = await safeExec(sql`
        SELECT
          o.id,
          o.reference_number,
          o.customer_name,
          o.status,
          o.total_amount_cents,
          o.partner_payout_net_cents,
          o.scheduled_date,
          to_char(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS created_date,
          COALESCE(
            NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
            u.company,
            u.email,
            '—'
          ) AS partner_name,
          u.id AS partner_id
        FROM workshop_orders o
        JOIN users u ON u.id = o.partner_id
        WHERE
          o.partner_id IS NOT NULL
          AND o.status IN ('fertig', 'completed')
          AND (o.partner_payout_net_cents IS NULL OR o.partner_payout_net_cents = 0)
        ORDER BY o.created_at DESC
        LIMIT 100
      `);
      return res.json((rows.rows ?? []).map((r: any) => ({
        id: r.id,
        referenceNumber: r.reference_number,
        customerName: r.customer_name,
        status: r.status,
        totalAmountCents: Number(r.total_amount_cents ?? 0),
        partnerPayoutNetCents: Number(r.partner_payout_net_cents ?? 0),
        scheduledDate: r.scheduled_date ?? null,
        createdDate: r.created_date,
        partnerName: r.partner_name,
        partnerId: r.partner_id,
      })));
    } catch (err: any) {
      console.error("[cfo/payout-gaps] error:", err?.message);
      return res.status(500).json({ message: "Fehler beim Laden", error: err?.message });
    }
  });

  app.patch("/api/cfo/payout-gaps/:id", isAuthenticated, async (req: any, res: Response) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "cfo") {
      return res.status(403).json({ message: "Zugriff verweigert" });
    }
    const schema = z.object({
      partnerPayoutNetCents: z.number().int().min(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    }
    const orderId = String(req.params.id ?? "");
    if (!orderId) return res.status(400).json({ message: "id required" });
    try {
      await db.execute(sql`
        UPDATE workshop_orders
        SET partner_payout_net_cents = ${parsed.data.partnerPayoutNetCents}
        WHERE id = ${orderId}
          AND partner_id IS NOT NULL
          AND status IN ('fertig', 'completed')
      `);
      return res.json({ ok: true, partnerPayoutNetCents: parsed.data.partnerPayoutNetCents });
    } catch (err: any) {
      console.error("[cfo/payout-gaps PATCH] error:", err?.message);
      return res.status(500).json({ message: "Speichern fehlgeschlagen", error: err?.message });
    }
  });
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function buildAdvicePrompt(snapshot: any): string {
  return `Du bist der CFO-Berater einer deutschen Autoreparatur-Werkstatt-Kette.
Analysiere die folgenden Cashflow-Daten der letzten ${snapshot?.months ?? 6} Monate und gib 3-5 konkrete, umsetzbare Empfehlungen.

Sprache: deutsch.
Stil: prägnant, freundlich-direkt (Stripe/Revolut Tonfall), kein Jargon.
Format: streng JSON nach Schema.
Severity-Logik:
  - "critical" → akute Liquiditätsgefahr / Marge < 10%
  - "warning"  → unbalancierte Verteilung Partner/Standort, hohe offene Posten
  - "info"     → neutrale Beobachtung
  - "positive" → guter Trend, Marge > 25%, Partner über Plan

Daten:
- Gesamteinnahmen: ${fmtEur(snapshot?.totals?.incomeCents ?? 0)}
- Gesamtausgaben: ${fmtEur(snapshot?.totals?.expenseCents ?? 0)}
- Profit: ${fmtEur(snapshot?.totals?.profitCents ?? 0)}
- Partner-Auszahlungen gesamt: ${fmtEur(snapshot?.totals?.partnerPayoutCents ?? 0)}
- Offene Rechnungen (zur Freigabe): ${snapshot?.totals?.openInvoicesCount ?? 0} Stück (${fmtEur(snapshot?.totals?.openInvoicesCents ?? 0)})
- Aufträge gesamt: ${snapshot?.totals?.ordersCount ?? 0}

Monatsverlauf:
${(snapshot?.byMonth ?? []).map((m: any) => `  ${m.month}: ein ${fmtEur(m.incomeCents)} | aus ${fmtEur(m.expenseCents)} | netto ${fmtEur(m.profitCents)}`).join("\n")}

Nach Partner:
${(snapshot?.byPartner ?? []).map((p: any) => `  ${p.partnerName}: ${p.orderCount} Auftr. · Umsatz ${fmtEur(p.revenueCents)} · Auszahlung ${fmtEur(p.payoutCents)}`).join("\n")}

Nach Standort:
${(snapshot?.byLocation ?? []).map((l: any) => `  ${l.location}: ${l.orderCount} Auftr. · ${fmtEur(l.revenueCents)}`).join("\n")}

Wichtig: Jede Empfehlung muss eine konkrete nächste Aktion enthalten (z.B. "3 offene Rechnungen heute freigeben", "Partner X mit kleinem Mengen-Bonus aktivieren"). Keine Floskeln.`;
}

function heuristicAdvice(snapshot: any): any[] {
  const insights: any[] = [];
  const t = snapshot?.totals ?? {};
  const income = Number(t.incomeCents ?? 0);
  const expense = Number(t.expenseCents ?? 0);
  const profit = income - expense;
  const margin = income > 0 ? profit / income : 0;
  const partners = snapshot?.byPartner ?? [];
  const locations = snapshot?.byLocation ?? [];

  if (t.openInvoicesCount && t.openInvoicesCount > 0) {
    insights.push({
      severity: t.openInvoicesCount > 5 ? "warning" : "info",
      title: `${t.openInvoicesCount} Rechnung${t.openInvoicesCount === 1 ? "" : "en"} im CFO-Inbox`,
      body: `Im Wert von ${fmtEur(Number(t.openInvoicesCents ?? 0))}. Schnelle Freigabe vermeidet Mahnungen und nutzt Skonti.`,
      action: "Inbox jetzt öffnen",
    });
  }

  if (income > 0 && margin < 0.1) {
    insights.push({
      severity: margin < 0 ? "critical" : "warning",
      title: margin < 0 ? "Verlust im Zeitraum" : "Marge unter 10%",
      body: `Einnahmen ${fmtEur(income)} vs. Ausgaben ${fmtEur(expense)} ergeben ${(margin * 100).toFixed(1)}% Marge. Material- und Lieferantenkosten prüfen.`,
      action: "Kostenstellen analysieren",
    });
  } else if (margin > 0.25) {
    insights.push({
      severity: "positive",
      title: `Starke Marge: ${(margin * 100).toFixed(1)}%`,
      body: `Profit ${fmtEur(profit)} bei ${fmtEur(income)} Umsatz. Reinvestitionsfenster für Equipment oder Standorterweiterung.`,
      action: "Investitionsplan öffnen",
    });
  }

  if (partners.length >= 2) {
    const top = partners[0];
    const others = partners.slice(1).reduce((s: number, p: any) => s + p.revenueCents, 0);
    if (top.revenueCents > others * 1.5 && others > 0) {
      insights.push({
        severity: "warning",
        title: `Konzentrationsrisiko: ${top.partnerName}`,
        body: `${top.partnerName} verantwortet mehr als 60% des Umsatzes. Ein Ausfall würde stark treffen.`,
        action: "2. Partner aktivieren",
      });
    }
  }

  if (locations.length >= 2) {
    const sorted = [...locations].sort((a: any, b: any) => b.revenueCents - a.revenueCents);
    const top = sorted[0];
    const tail = sorted[sorted.length - 1];
    if (top.revenueCents > tail.revenueCents * 3 && tail.revenueCents > 0) {
      insights.push({
        severity: "info",
        title: `Standort-Lücke: ${top.location} vs. ${tail.location}`,
        body: `${top.location} läuft 3× besser als ${tail.location}. Lokale Marketing-Kampagne oder Personal-Rotation prüfen.`,
        action: "Standort-Plan anlegen",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      severity: "info",
      title: "Keine kritischen Signale",
      body: `Cashflow stabil über die letzten ${snapshot?.months ?? 6} Monate. Weiter so — und die nächsten Belege zügig freigeben.`,
      action: "OK",
    });
  }

  return insights.slice(0, 5);
}

// ── Finance Agent helpers ─────────────────────────────────────────────────

function buildAgentSystemPrompt(attentionItems: any[], signals: any, snapshot: any, userQuestion = ""): string {
  const t = snapshot?.totals ?? {};
  const p = snapshot?.previous ?? {};
  const byMonth: any[] = snapshot?.byMonth ?? [];

  const income   = Number(t.incomeCents   ?? 0);
  const expenses = Number(t.expenseCents  ?? 0);
  const profit   = Number(t.profitCents   ?? 0);
  const margin   = income > 0 ? ((profit / income) * 100).toFixed(1) : "0";

  const prevIncome  = Number(p.incomeCents  ?? 0);
  const prevProfit  = Number(p.profitCents  ?? 0);
  const revDelta    = prevIncome > 0 ? (((income - prevIncome) / prevIncome) * 100).toFixed(1) : null;
  const profitDelta = prevProfit !== 0 ? (((profit - prevProfit) / Math.abs(prevProfit)) * 100).toFixed(1) : null;

  const attentionBlock = attentionItems.length > 0
    ? attentionItems.map((item: any) =>
        `  - [${item.id}] [${String(item.severity).toUpperCase()}/${item.category}] ${item.title}: ${item.why}` +
        ` (${item.count} Stück${item.amount ? `, ${fmtEur(Number(item.amount))}` : ""})` +
        ` → Drilldown: ${item.href ?? "—"}`
      ).join("\n")
    : "  Keine aktiven Aktionspunkte.";

  const trendBlock = byMonth.length > 0
    ? byMonth.slice(-3).map((m: any) =>
        `  ${m.month}: Umsatz ${fmtEur(Number(m.incomeCents ?? 0))} | Kosten ${fmtEur(Number(m.expenseCents ?? 0))} | Gewinn ${fmtEur(Number(m.profitCents ?? 0))}`
      ).join("\n")
    : "  Keine Monatsdaten verfügbar.";

  const langInstruction = buildLanguageInstruction(userQuestion, "de");

  return `Du bist der Finance-Agent von Corion Lackdoktor, einer deutschen Autoreparatur-Werkstatt-Kette (Standorte: Mainz-Kastel, Wallau und weitere).
Du hast Zugriff auf die aktuellen Dashboard-Daten des Finance OS (letzte 6 Monate).

${langInstruction}
- Unterscheide: (a) Dashboard-Fakten, (b) heuristische Einschätzung, (c) KI-Interpretation. Nutze klare Formulierungen: "Laut Dashboard...", "Basierend auf den Daten...", "Das deutet darauf hin...".
- Antworte präzise und datenbasiert. Keine Floskeln. 2–5 Sätze.
- Wenn ein Aktionspunkt relevant ist, gib seine ID in relevantItemIds zurück.
- Gib in drilldowns 1–2 relevante Routen zurück (max. 8 Wörter Grund je Route). Nur aus den unten aufgeführten echten Routen. Leeres Array wenn keine passt.

AKTUELLE DASHBOARD-DATEN:
Umsatz: ${fmtEur(income)}${revDelta ? ` (${Number(revDelta) >= 0 ? "+" : ""}${revDelta}% vs. Vorperiode)` : ""}
Ausgaben: ${fmtEur(expenses)}
Gewinn: ${fmtEur(profit)} | Marge: ${margin}%${profitDelta ? ` (${Number(profitDelta) >= 0 ? "+" : ""}${profitDelta}% vs. Vorperiode)` : ""}
Partner-Auszahlungen: ${fmtEur(Number(t.partnerPayoutCents ?? 0))}
Offene Forderungen: ${fmtEur(Number(signals.unpaidCents ?? 0))} (${signals.fertigUnpaidCount ?? 0} fertige, unbezahlte Aufträge)
In Bearbeitung: ${signals.inProgressCount ?? 0} Aufträge
Offene Eingangsrechnungen (CFO): ${t.openInvoicesCount ?? 0} Stück, ${fmtEur(Number(t.openInvoicesCents ?? 0))}

TREND (letzte 3 Monate):
${trendBlock}

AKTIONSPUNKTE (${attentionItems.length} aktiv):
${attentionBlock}

VERFÜGBARE DRILLDOWN-ROUTEN (nur echte, existierende Routen verwenden):
  /auftraege               — Auftragsliste (alle Aufträge, filterbar nach Status)
  /admin                   — Admin Pipeline (Kanban, Partnerzuweisung)
  /admin/calendar          — Werkstattkalender (Terminplanung)
  /admin/partner-payouts   — Auszahlungslücken (fertige Aufträge ohne Auszahlungsbetrag — direkt bearbeitbar)
  /finanzen/detail         — Cashflow-Detail (Monatsübersicht, Partneraufschlüsselung)
  /cfo-inbox               — CFO-Eingang (Lieferantenrechnungen freigeben)`;
}

function buildHeuristicAgentAnswer(question: string, attentionItems: any[], signals: any, snapshot: any): string {
  const q = question.toLowerCase();
  const t = snapshot?.totals ?? {};
  const income   = Number(t.incomeCents  ?? 0);
  const expenses = Number(t.expenseCents ?? 0);
  const profit   = income - expenses;
  const margin   = income > 0 ? ((profit / income) * 100).toFixed(1) : "0";

  // Attention / today / what needs action
  if (/attention|handlungsbedarf|dringend|heute|today|jetzt|now|braucht/.test(q)) {
    if (attentionItems.length === 0) {
      return "Keine kritischen Aktionspunkte. Alle Signale sind im grünen Bereich.";
    }
    const critical = attentionItems.filter((i: any) => i.severity === "critical");
    const warnings = attentionItems.filter((i: any) => i.severity === "warning");
    const parts: string[] = [];
    if (critical.length > 0) parts.push(`${critical.length} kritisch: ${critical.map((i: any) => i.title).join(", ")}`);
    if (warnings.length > 0) parts.push(`${warnings.length} Achtung: ${warnings.map((i: any) => i.title).join(", ")}`);
    return `Aktuell ${attentionItems.length} Aktionspunkt${attentionItems.length !== 1 ? "e" : ""}: ${parts.join(" — ")}.`;
  }

  // Revenue / Umsatz
  if (/umsatz|revenue|einnahmen|income/.test(q)) {
    return `Laut Dashboard: Umsatz der letzten 6 Monate ${fmtEur(income)}, Ausgaben ${fmtEur(expenses)}, Gewinn ${fmtEur(profit)} (Marge ${margin}%).`;
  }

  // Profit / margin
  if (/gewinn|profit|marge|margin/.test(q)) {
    return `Laut Dashboard: Gewinn ${fmtEur(profit)} bei ${fmtEur(income)} Umsatz — Marge ${margin}%. ${
      Number(margin) < 10 ? "Die Marge liegt unter 10% — Kostenstellen prüfen." :
      Number(margin) > 25 ? "Starke Marge über 25%." : "Marge im normalen Bereich."
    }`;
  }

  // Receivables / unpaid
  if (/forderung|unbezahlt|zahlung|receivable|unpaid|payment/.test(q)) {
    const cnt = Number(signals.fertigUnpaidCount ?? 0);
    const amt = Number(signals.unpaidCents ?? 0);
    if (cnt === 0) return "Keine offenen Forderungen — alle fertigen Aufträge sind bezahlt.";
    return `Laut Dashboard: ${cnt} fertige Aufträge unbezahlt, Gesamtbetrag ${fmtEur(amt)}. Einsehbar unter /auftraege.`;
  }

  // Invoices / CFO
  if (/rechnung|invoice|cfo|lieferant|supplier/.test(q)) {
    const cnt = Number(t.openInvoicesCount ?? 0);
    if (cnt === 0) return "Keine offenen Eingangsrechnungen im CFO-Eingang.";
    return `Laut Dashboard: ${cnt} Eingangsrechnung${cnt !== 1 ? "en" : ""} zur Freigabe (${fmtEur(Number(t.openInvoicesCents ?? 0))}). Freigabe unter /cfo-inbox.`;
  }

  // Partner payout
  if (/partner|auszahlung|payout/.test(q)) {
    const cnt = Number(signals.noPayoutPartnerCount ?? 0);
    return cnt > 0
      ? `Laut Dashboard: ${cnt} fertige Partneraufträge ohne definierten Auszahlungsbetrag. Beträge unter /auftraege nachtragen.`
      : `Partner-Auszahlungen gesamt: ${fmtEur(Number(t.partnerPayoutCents ?? 0))}. Keine offenen Auszahlungslücken erkannt.`;
  }

  // Trend
  if (/trend|verlauf|entwicklung|monat|month/.test(q)) {
    const byMonth: any[] = snapshot?.byMonth ?? [];
    if (byMonth.length < 2) return `Nicht genug Monatsdaten für eine Trendanalyse. Aktueller Gewinn: ${fmtEur(profit)}.`;
    const last = byMonth[byMonth.length - 1];
    const prev = byMonth[byMonth.length - 2];
    const delta = prev.profitCents > 0 ? (((last.profitCents - prev.profitCents) / prev.profitCents) * 100).toFixed(1) : null;
    return `Letzter Monat (${last.month}): Gewinn ${fmtEur(Number(last.profitCents))}${delta ? ` (${Number(delta) >= 0 ? "+" : ""}${delta}% vs. Vormonat)` : ""}. Umsatz: ${fmtEur(Number(last.incomeCents))}.`;
  }

  // Fallback
  return `Aktuelle Kennzahlen: Umsatz ${fmtEur(income)}, Ausgaben ${fmtEur(expenses)}, Gewinn ${fmtEur(profit)} (${margin}%). ${
    attentionItems.length > 0 ? `${attentionItems.length} offene Aktionspunkte.` : "Keine kritischen Signale."
  }`;
}

const SEV_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function buildHeuristicDrilldowns(
  attentionItems: any[],
  _signals: any,
  _snapshot: any,
): Array<{ href: string; reason: string }> {
  // Sort by severity, pick items that have a valid drilldown href
  const sorted = [...attentionItems].sort(
    (a, b) => (SEV_RANK[a.severity] ?? 3) - (SEV_RANK[b.severity] ?? 3),
  );

  const seen = new Set<string>();
  const result: Array<{ href: string; reason: string }> = [];

  for (const item of sorted) {
    if (result.length >= 2) break;
    const href = item.href as string | undefined;
    if (!href || !VALID_DRILLDOWN_ROUTES.has(href) || seen.has(href)) continue;
    seen.add(href);
    const countStr = item.count > 1 ? `${item.count} ` : "";
    result.push({
      href,
      reason: `${countStr}${item.title}`,
    });
  }

  return result;
}
