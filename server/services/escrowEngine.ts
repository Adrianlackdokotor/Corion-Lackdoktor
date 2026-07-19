import { storage } from "../storage";
import { applyReputation } from "./reputationEngine";
import { tryFillFromWaitlist } from "./waitlistMatcher";

/**
 * Hub+1 Escrow Engine — small EUR-cent deposits per appointment that protect
 * partners against last-minute cancellations / no-shows. All operations are
 * idempotent at the (auftragId, status) level.
 *
 * Lifecycle:
 *   placed   → status="held"      — created when appointment is scheduled
 *   released → status="released"  — order reaches terminal status (completed/paid/invoiced)
 *   refunded → status="refunded"  — early cancel inside grace window
 *   forfeited→ status="forfeited" — no-show OR late cancel (penalty kept by network)
 *   replaced → status="replaced"  — slot auto-refilled from waitlist (small fee)
 *
 * Token math (mirrors /economy/earn-catalog `escrow` block):
 *   slotDepositCents     = 1000  (10€ default)
 *   replacedFeeCents     = 200   (2€ kept on auto-refill)
 *   emptyPenaltyCents    = 1000  (10€ forfeited on no-show)
 *
 * Tokens map 1 token ↔ 1 EUR (utilityCreditEurPerToken=1). Forfeit/refund
 * adjusts the user's token balance accordingly so the economy stays closed.
 */

const SLOT_DEPOSIT_CENTS = 1000;       // 10€
const REPLACED_FEE_CENTS = 200;        // 2€
const TOKENS_PER_EUR = 1;              // 1 token == 1 EUR utility credit

function centsToTokens(cents: number): number {
  return Math.max(0, Math.round((cents / 100) * TOKENS_PER_EUR));
}

/**
 * Create a held escrow row for an appointment. Idempotent per auftragId:
 * if a "held" hold already exists for the order, returns it instead of duplicating.
 */
export async function placeEscrow(opts: {
  userId: string;
  auftragId: string;
  partnerId?: string | null;
  amountCents?: number;
  reason?: string;
}): Promise<{ ok: boolean; holdId?: string; reason?: string }> {
  try {
    const existing = await storage.getEscrowsByAuftrag(opts.auftragId);
    const heldAlready = existing.find((e) => e.status === "held");
    if (heldAlready) {
      console.log(`[Escrow] place: already held for auftrag ${opts.auftragId}`);
      return { ok: true, holdId: heldAlready.id, reason: "already_held" };
    }
    const amount = opts.amountCents ?? SLOT_DEPOSIT_CENTS;
    const hold = await storage.createEscrowHold({
      userId: opts.userId,
      partnerId: opts.partnerId ?? null,
      auftragId: opts.auftragId,
      amountCents: amount,
      status: "held",
      reason: opts.reason ?? "appointment_deposit",
    } as any);
    console.log(`[Escrow] held ${amount}¢ user=${opts.userId} auftrag=${opts.auftragId} id=${hold.id}`);
    return { ok: true, holdId: hold.id };
  } catch (err) {
    console.error("[Escrow] place failed (non-fatal):", err);
    return { ok: false, reason: String(err) };
  }
}

/**
 * Release every "held" escrow on the auftrag. Used when the job completes
 * successfully — deposit is returned implicitly (no token movement needed).
 */
export async function releaseEscrow(auftragId: string): Promise<number> {
  try {
    const list = await storage.getEscrowsByAuftrag(auftragId);
    let n = 0;
    for (const h of list) {
      if (h.status !== "held") continue;
      await storage.resolveEscrowHold(h.id, "released", "order_completed");
      console.log(`[Escrow] released ${h.amountCents}¢ id=${h.id}`);
      n++;
    }
    return n;
  } catch (err) {
    console.error("[Escrow] release failed (non-fatal):", err);
    return 0;
  }
}

/**
 * Forfeit every "held" escrow on the auftrag (no-show / late cancel).
 * Debits the holder's tokens by the deposit amount and posts a reputation
 * penalty. Token debit is best-effort: if balance < cost, debit clamps to
 * available so we never throw inside the lifecycle hook.
 */
export async function forfeitEscrow(auftragId: string, kind: "no_show" | "late_cancel"): Promise<number> {
  try {
    const list = await storage.getEscrowsByAuftrag(auftragId);
    let n = 0;
    for (const h of list) {
      if (h.status !== "held") continue;
      await storage.resolveEscrowHold(h.id, "forfeited", kind);
      const tokenCost = centsToTokens(h.amountCents);
      if (tokenCost > 0 && h.userId) {
        try {
          const bal = await storage.getTokenBalance(h.userId);
          const debit = Math.min(bal, tokenCost);
          if (debit > 0) {
            await storage.debitTokens(h.userId, debit, `escrow_forfeit_${kind}`, auftragId);
          }
        } catch (e) {
          console.error("[Escrow] forfeit debit failed:", e);
        }
        await applyReputation({ kind, userId: h.userId });
      }
      console.log(`[Escrow] forfeited ${h.amountCents}¢ id=${h.id} (${kind})`);
      n++;
    }
    return n;
  } catch (err) {
    console.error("[Escrow] forfeit failed (non-fatal):", err);
    return 0;
  }
}

/**
 * Refund every "held" escrow on the auftrag (early cancel within grace window).
 * No token movement — deposit returns to user implicitly.
 */
export async function refundEscrow(auftragId: string, reason = "early_cancel"): Promise<number> {
  try {
    const list = await storage.getEscrowsByAuftrag(auftragId);
    let n = 0;
    for (const h of list) {
      if (h.status !== "held") continue;
      await storage.resolveEscrowHold(h.id, "refunded", reason);
      console.log(`[Escrow] refunded ${h.amountCents}¢ id=${h.id}`);
      n++;
    }
    return n;
  } catch (err) {
    console.error("[Escrow] refund failed (non-fatal):", err);
    return 0;
  }
}

/**
 * Replace flow — slot auto-filled from waitlist. Original held hold is
 * marked "replaced" and a small processing fee is taken in tokens.
 */
export async function replaceEscrow(auftragId: string): Promise<number> {
  try {
    const list = await storage.getEscrowsByAuftrag(auftragId);
    let n = 0;
    for (const h of list) {
      if (h.status !== "held") continue;
      await storage.resolveEscrowHold(h.id, "replaced", "slot_auto_refilled");
      const fee = centsToTokens(REPLACED_FEE_CENTS);
      if (fee > 0 && h.userId) {
        try {
          const bal = await storage.getTokenBalance(h.userId);
          const debit = Math.min(bal, fee);
          if (debit > 0) {
            await storage.debitTokens(h.userId, debit, "escrow_replaced_fee", auftragId);
          }
        } catch (e) {
          console.error("[Escrow] replace fee debit failed:", e);
        }
      }
      console.log(`[Escrow] replaced ${h.amountCents}¢ id=${h.id} (fee=${fee})`);
      n++;
    }
    return n;
  } catch (err) {
    console.error("[Escrow] replace failed (non-fatal):", err);
    return 0;
  }
}

/**
 * Decide whether a cancellation is "late" (< 24h before slot start) and
 * route to forfeit vs refund. Caller passes the appointment startTime.
 */
const LATE_CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function onCancellation(opts: {
  auftragId: string;
  appointmentStart?: Date | null;
  locationId?: string | null;
  serviceKind?: string | null;
  now?: Date;
}): Promise<"replaced" | "forfeited" | "refunded" | "noop"> {
  const now = opts.now ?? new Date();
  const start = opts.appointmentStart ?? null;
  const isLate = !!start && start.getTime() - now.getTime() < LATE_CANCEL_WINDOW_MS;

  // Step 1 — only late cancels trigger waitlist matching (early cancels return
  // the deposit untouched, no need to "save" the slot economically).
  if (isLate) {
    const match = await tryFillFromWaitlist({
      auftragId: opts.auftragId,
      locationId: opts.locationId ?? null,
      serviceKind: opts.serviceKind ?? null,
      slotStart: start,
    });
    if (match.filled) {
      // Slot saved → original hold marked "replaced" inside replaceEscrow.
      return "replaced";
    }
    const n = await forfeitEscrow(opts.auftragId, "late_cancel");
    return n > 0 ? "forfeited" : "noop";
  }

  const n = await refundEscrow(opts.auftragId);
  return n > 0 ? "refunded" : "noop";
}
