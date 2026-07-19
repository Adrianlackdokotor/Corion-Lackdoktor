import { storage } from "../storage";
import {
  calculateAuftrag,
  calculateMultiPartnerSplit,
  type AuftragCalcResult,
} from "@shared/auftragCalc";
import type { WorkshopOrder, WorkshopPayout } from "@shared/schema";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";

// Workaround: drizzle 0.39.1 + neon-http scrambles boolean / json columns
// declared late in the schema (same bug that affects users.is_approved).
// Read the 3 new editable fields via raw SQL so the calc respects them.
async function readEditableExtras(orderId: string): Promise<{
  materialsBilledSeparately: boolean;
  materialBdePercentOverride: number | null;
  partnerSplitsJson: Array<{ partnerId: string; sharePercent: number; label?: string | null }>;
}> {
  try {
    // Use raw neon tag (bypasses drizzle 0.39.1 boolean/jsonb misread bug).
    const { rawSql } = await import("../../db/index");
    const rows: any[] = await rawSql`
      SELECT materials_billed_separately AS "matSep",
             material_bde_percent_override AS "bdeOverride",
             COALESCE(partner_splits_json, '[]'::jsonb) AS "splits"
        FROM workshop_orders WHERE id = ${orderId}
    `;
    const row = rows?.[0] ?? {};
    const splits = typeof row.splits === "string" ? JSON.parse(row.splits) : (row.splits ?? []);
    console.log("[readEditableExtras]", orderId, "matSep=", row.matSep, "(typeof", typeof row.matSep + ")", "bde=", row.bdeOverride, "splits=", splits.length);
    return {
      materialsBilledSeparately: !!row.matSep,
      materialBdePercentOverride: row.bdeOverride == null ? null : Number(row.bdeOverride),
      partnerSplitsJson: Array.isArray(splits) ? splits : [],
    };
  } catch (e: any) {
    console.error("[readEditableExtras] FAILED for", orderId, "-", e?.message, e?.stack?.split("\n")[1]);
    return { materialsBilledSeparately: false, materialBdePercentOverride: null, partnerSplitsJson: [] };
  }
}

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

function partnerProfileFor(user: any): {
  partnerSharePercent: number;
  bdePercent: number;
  partnerModel: string;
} {
  const partnerSharePercent =
    typeof user?.partnerSharePercent === "number" ? user.partnerSharePercent : 40;
  const bdePercent = typeof user?.materialPercent === "number" ? user.materialPercent : 20;
  const partnerModel = (user?.partnerModel as string) ?? "B";
  return { partnerSharePercent, bdePercent, partnerModel };
}

async function runCalcForOrder(order: WorkshopOrder): Promise<AuftragCalcResult> {
  const partner = order.partnerId ? await storage.getUser(order.partnerId) : null;
  const profile = partnerProfileFor(partner);
  const currentPartnerRetentionTotal = order.partnerId
    ? await storage
        .getPartnerWorkshopRetentionTotalCents(order.partnerId, order.id)
        .catch(() => 0)
    : 0;
  // Per-order overrides take priority over the partner profile defaults.
  // Raw SQL bypass — drizzle 0.39.1 + neon-http misreads booleans/jsonb on
  // late-declared columns (same bug that affects users.is_approved).
  const extras = await readEditableExtras(order.id);
  const bdePct =
    extras.materialBdePercentOverride != null ? extras.materialBdePercentOverride : profile.bdePercent;
  const materialsSeparate = extras.materialsBilledSeparately;
  return calculateAuftrag({
    laborCents: order.laborAmountCents || 0,
    partsCents: order.partsAmountCents || 0,
    bdePercent: bdePct,
    partnerSharePercent: profile.partnerSharePercent,
    // When materials are billed separately to the customer, no Materialabzug.
    isOwnMaterial: materialsSeparate,
    currentPartnerRetentionTotal,
  });
}

/**
 * A1 — Persist the calculateAuftrag() result on the workshop order.
 * Called when status flips to `fertig` (and again on `bezahlt` for safety).
 * Idempotent: always recomputes from current order + partner profile.
 */
export async function computeAndPersistSplit(
  orderId: string,
  extrasOverride?: {
    materialsBilledSeparately?: boolean;
    materialBdePercentOverride?: number | null;
    partnerSplitsJson?: Array<{ partnerId: string; sharePercent: number; label?: string | null }>;
  },
): Promise<{
  order: WorkshopOrder;
  calc: AuftragCalcResult;
} | null> {
  const order = await storage.getWorkshopOrder(orderId);
  if (!order) return null;

  // Raw SQL bypass for the 3 editable extras (drizzle late-column bug).
  // Caller may override (e.g. PATCH route, which just wrote the values via
  // raw SQL and knows the truth without a re-read).
  const fromDb = await readEditableExtras(order.id);
  const extras = {
    materialsBilledSeparately:
      extrasOverride?.materialsBilledSeparately ?? fromDb.materialsBilledSeparately,
    materialBdePercentOverride:
      extrasOverride?.materialBdePercentOverride !== undefined
        ? extrasOverride.materialBdePercentOverride
        : fromDb.materialBdePercentOverride,
    partnerSplitsJson:
      extrasOverride?.partnerSplitsJson ?? fromDb.partnerSplitsJson,
  };
  const splits = extras.partnerSplitsJson;
  if (splits.length > 0) {
    // Use primary partner's profile for default BDE % when no override given.
    const primary = order.partnerId ? await storage.getUser(order.partnerId).catch(() => null) : null;
    const defaultBde = typeof primary?.materialPercent === "number" ? primary.materialPercent : 20;
    const multi = calculateMultiPartnerSplit({
      laborCents: order.laborAmountCents || 0,
      partsCents: order.partsAmountCents || 0,
      bdePercent: extras.materialBdePercentOverride != null ? extras.materialBdePercentOverride : defaultBde,
      isOwnMaterial: extras.materialsBilledSeparately,
      partners: splits,
    });
    const totalGross = multi.partners.reduce((a, p) => a + p.grossShareCents, 0);
    const totalRetention = multi.partners.reduce((a, p) => a + p.warrantyRetentionCents, 0);
    const totalNet = multi.partners.reduce((a, p) => a + p.netPayoutCents, 0);
    const updated = await storage.updateWorkshopOrder(order.id, {
      partnerCommissionCentsCalc: totalGross,
      partnerPayoutNetCents: totalNet,
      corionShareCents: multi.corionShareCents,
      materialDeductionCents: multi.materialDeductionCents,
      warrantyRetentionCents: totalRetention,
      splitCalculatedAt: new Date(),
    } as any);
    // Synthesize an AuftragCalcResult-shaped object for the caller.
    const calc: AuftragCalcResult = {
      client: multi.client,
      partner: {
        laborCents: order.laborAmountCents || 0,
        bdePercent: multi.bdePercent,
        materialBdePercent: multi.bdePercent,
        isOwnMaterial: extras.materialsBilledSeparately,
        materialDeductionCents: multi.materialDeductionCents,
        baseForSplitCents: multi.baseForSplitCents,
        partnerSharePercent: multi.totalPartnerSharePercent,
        corionSharePercent: Math.max(0, 100 - multi.totalPartnerSharePercent),
        partnerGrossShareCents: totalGross,
        corionGrossShareCents: multi.corionShareCents,
        warrantyRetentionPercent: 5,
        warrantyRetentionCents: totalRetention,
        warrantyRetentionCapCents: 300_000,
        warrantyRetentionTotalBeforeCents: 0,
        warrantyRetentionTotalAfterCents: totalRetention,
        warrantyRetentionCapReached: false,
        partnerPayoutNetCents: totalNet,
        partnerShareCents: totalGross,
        corionShareCents: multi.corionShareCents,
      },
    };
    return { order: updated ?? order, calc };
  }

  if (!order.partnerId) {
    console.warn("[payoutEngine] order has no partner, skipping split", orderId);
    return null;
  }
  const calc = await runCalcForOrder(order);
  const updated = await storage.updateWorkshopOrder(order.id, {
    partnerCommissionCentsCalc: calc.partner.partnerGrossShareCents,
    partnerPayoutNetCents: calc.partner.partnerPayoutNetCents,
    corionShareCents: calc.partner.corionGrossShareCents,
    materialDeductionCents: calc.partner.materialDeductionCents,
    warrantyRetentionCents: calc.partner.warrantyRetentionCents,
    splitCalculatedAt: new Date(),
  } as any);
  return { order: updated ?? order, calc };
}

/**
 * A2 — On payment_status='bezahlt': create a payouts row + mint tokens
 * (1 token = 1 € commission paid). Idempotent: skips if tokens already minted.
 */
export async function processPayoutOnPaid(orderId: string): Promise<WorkshopPayout | null> {
  const order = await storage.getWorkshopOrder(orderId);
  if (!order) return null;
  if (!order.partnerId) {
    console.warn("[payoutEngine] cannot pay out — order has no partner", orderId);
    return null;
  }
  // Ensure split is up-to-date (paid amount may have changed labor/parts).
  const splitResult = (await computeAndPersistSplit(order.id)) ?? null;
  const calc = splitResult?.calc ?? null;
  const partnerNet = calc?.partner.partnerPayoutNetCents ?? order.partnerPayoutNetCents ?? 0;
  const retention = calc?.partner.warrantyRetentionCents ?? order.warrantyRetentionCents ?? 0;
  const corion = calc?.partner.corionGrossShareCents ?? order.corionShareCents ?? 0;
  const gross = calc?.partner.partnerGrossShareCents ?? order.partnerCommissionCentsCalc ?? 0;

  // Idempotency layer 1: in-memory check on existing payout flag.
  let payout = await storage.getWorkshopPayoutByOrder(order.id);
  if (payout && (payout.tokensMinted || payout.tokensMintedAmount > 0)) return payout;

  if (!payout) {
    try {
      payout = await storage.createWorkshopPayout({
        workshopOrderId: order.id,
        partnerId: order.partnerId,
        partnerGrossShareCents: gross,
        partnerPayoutNetCents: partnerNet,
        warrantyRetentionCents: retention,
        corionShareCents: corion,
        status: "paid",
        paidAt: new Date(),
        notes: `Auto-payout on payment_status=bezahlt`,
      } as any);
    } catch (err: any) {
      // DB UNIQUE on workshop_order_id — concurrent caller won the race.
      // Fall back to the existing row.
      const existing = await storage.getWorkshopPayoutByOrder(order.id);
      if (!existing) throw err;
      payout = existing;
      if (payout.tokensMinted || payout.tokensMintedAmount > 0) return payout;
    }
  } else {
    // Don't touch paidAt on update — keep the original timestamp (the 12-month
    // retention clock starts from the first paid_at). Only refresh split numbers.
    payout = (await storage.updateWorkshopPayout(payout.id, {
      partnerGrossShareCents: gross,
      partnerPayoutNetCents: partnerNet,
      warrantyRetentionCents: retention,
      corionShareCents: corion,
      status: "paid",
    } as any)) ?? payout;
  }

  // Mint tokens — 1 token = 1 € commission NET (rounded to nearest €).
  // Race-safety lives in the DB: a partial UNIQUE index on
  // token_ledger(user_id, reason, related_auftrag_id) prevents duplicate
  // credits even under concurrent calls. creditTokensIdempotent does the
  // INSERT + balance bump in one CTE so a conflict yields a clean no-op.
  const tokensToMint = Math.max(0, Math.round(partnerNet / 100));
  try {
    await storage.creditTokensIdempotent(order.partnerId, tokensToMint, "job_completed", order.id);
  } catch (err: any) {
    console.error("[payoutEngine] token mint failed", err?.message);
    return payout; // do NOT flip the flag — caller can retry safely
  }
  payout = (await storage.updateWorkshopPayout(payout.id, {
    tokensMinted: true,
    tokensMintedAmount: tokensToMint,
  } as any)) ?? payout;
  await storage.updateWorkshopOrder(order.id, { tokensMintedAt: new Date() } as any);

  // Audit trail in the order timeline.
  try {
    await storage.createOrderTimelineEvent({
      workshopOrderId: order.id,
      kind: "status_change",
      title: `Payout ausgezahlt — ${(partnerNet / 100).toFixed(2)} € + ${(retention / 100).toFixed(2)} € Sicherheitseinbehalt`,
      body: `Tokens gemintet: ${tokensToMint} (1 Token = 1 €). Corion-Anteil: ${(corion / 100).toFixed(2)} €.`,
      source: "ai",
    } as any);
  } catch (err) {
    /* non-fatal */
  }
  return payout;
}

/**
 * A3 — Release a single retention row: mint the held cents as tokens.
 */
export async function releaseRetention(payoutId: string): Promise<WorkshopPayout | null> {
  const all = await storage.listWorkshopPayoutsDueForRetentionRelease(new Date());
  const payout = all.find((p) => p.id === payoutId)
    ?? (await storage.getWorkshopPayoutByOrder(payoutId)); // fallback by orderId
  if (!payout || payout.retentionReleasedAt) return payout ?? null;
  const tokens = Math.max(0, Math.round((payout.warrantyRetentionCents || 0) / 100));
  try {
    await storage.creditTokensIdempotent(
      payout.partnerId,
      tokens,
      "warranty_retention_released",
      payout.workshopOrderId,
    );
  } catch (err: any) {
    // Do NOT mark as released on failure — leave for the next scheduler tick.
    console.error("[payoutEngine] retention mint failed", err?.message);
    return payout;
  }
  // Audit trail (best-effort) — surface in the order timeline.
  try {
    await storage.createOrderTimelineEvent({
      workshopOrderId: payout.workshopOrderId,
      kind: "status_change",
      title: `Sicherheitseinbehalt freigegeben — ${tokens} Tokens (${(payout.warrantyRetentionCents / 100).toFixed(2)} €)`,
      body: `Auto-Release nach 12 Monaten ab ${payout.paidAt?.toISOString?.() ?? payout.paidAt}.`,
      source: "ai",
    } as any);
  } catch {
    /* non-fatal */
  }
  const updated = await storage.updateWorkshopPayout(payout.id, {
    status: "retention_released",
    retentionReleasedAt: new Date(),
    retentionTokensMinted: true,
    retentionTokensAmount: tokens,
  } as any);
  return updated ?? payout;
}

/**
 * A3 — Daily job: scan all paid payouts older than 12 months and release.
 */
export async function releaseDueRetentions(): Promise<{ released: number; tokens: number }> {
  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);
  const due = await storage.listWorkshopPayoutsDueForRetentionRelease(cutoff);
  let released = 0;
  let tokens = 0;
  for (const p of due) {
    const r = await releaseRetention(p.id);
    if (r?.retentionReleasedAt) {
      released += 1;
      tokens += r.retentionTokensAmount || 0;
    }
  }
  return { released, tokens };
}

/**
 * Background scheduler — runs once an hour, idempotent.
 * Booted from server/routes.ts after route registration.
 */
let schedulerStarted = false;
export function startRetentionReleaseScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const HOUR = 60 * 60 * 1000;
  const tick = async () => {
    try {
      const out = await releaseDueRetentions();
      if (out.released > 0) {
        console.log(
          `[payoutEngine] released ${out.released} retentions (${out.tokens} tokens minted)`,
        );
      }
    } catch (err: any) {
      console.error("[payoutEngine] scheduler tick failed", err?.message);
    }
  };
  // Fire shortly after boot so devs can see it work, then hourly.
  setTimeout(tick, 30_000);
  setInterval(tick, HOUR);
}
