import { storage } from "../storage";

/**
 * Hub+1 Reputation Engine — score 0..1000, deterministic deltas per event.
 * All hooks are fire-and-forget safe; never throw to caller.
 */

export type RepEvent =
  | { kind: "job_completed"; userId: string }              // partner finishes a real auftrag
  | { kind: "client_job_completed"; userId: string }       // client whose order was finished
  | { kind: "cancellation"; userId: string }               // soft cancel within window
  | { kind: "no_show"; userId: string }                    // hard no-show penalty
  | { kind: "late_cancel"; userId: string }                // last-minute cancel
  | { kind: "review_received"; userId: string; stars: number } // 1..5
  | { kind: "spam_review"; userId: string }                // moderated/removed
  | { kind: "partner_onboarded"; userId: string }          // referral that activated
  | { kind: "bug_fix_merged"; userId: string };

const DELTA: Record<string, number> = {
  job_completed: 20,
  client_job_completed: 5,
  cancellation: -25,
  no_show: -100,
  late_cancel: -50,
  spam_review: -30,
  partner_onboarded: 30,
  bug_fix_merged: 50,
};

export async function applyReputation(ev: RepEvent): Promise<void> {
  try {
    if (ev.kind === "review_received") {
      const stars = Math.max(1, Math.min(5, Math.round(ev.stars)));
      // Score delta: -20 for 1★, -10 for 2★, 0 for 3★, +10 for 4★, +20 for 5★
      const scoreDelta = (stars - 3) * 10;
      await storage.bumpReputation(ev.userId, {
        score: scoreDelta,
        reviewsAvgX10: stars * 10,
        reviewsCount: 1,
      });
      console.log(`[Reputation] ${ev.userId} +${scoreDelta} (${stars}★ review)`);
      return;
    }

    const score = DELTA[ev.kind] ?? 0;
    const counterDelta: any = { score };
    if (ev.kind === "job_completed" || ev.kind === "client_job_completed") {
      counterDelta.completedJobs = 1;
    } else if (ev.kind === "cancellation" || ev.kind === "late_cancel") {
      counterDelta.cancellations = 1;
    } else if (ev.kind === "no_show") {
      counterDelta.noShows = 1;
    }
    await storage.bumpReputation(ev.userId, counterDelta);
    console.log(`[Reputation] ${ev.userId} ${score >= 0 ? "+" : ""}${score} (${ev.kind})`);
  } catch (err) {
    console.error("[Reputation] apply failed (non-fatal):", err);
  }
}

/**
 * Convenience wrapper used by status-change hooks. Delegates to the right
 * combination of events for partner + client when an Auftrag transitions to
 * a terminal status.
 *
 * Idempotency is enforced two ways:
 *   1. Direct terminal→terminal transitions are skipped.
 *   2. The caller passes `alreadyCredited` (e.g. `prev.completedAt != null`)
 *      so reopening + re-completing the same order does NOT re-credit.
 *
 * Identity rules (NEVER fall back to actor for partner credit — that would
 * let an admin self-credit by toggling status):
 *   - partnerId: resolved by the caller from order.assignedResourceId → resource.userId
 *   - clientId:  order.clientId
 *   - actorId:   only used for cancellation penalties (whoever cancels takes the hit)
 */
export async function onAuftragStatusChange(
  prevStatus: string,
  newStatus: string,
  ctx: {
    actorId?: string | null;
    partnerId?: string | null;
    clientId?: string | null;
    alreadyCredited?: boolean;
  },
): Promise<void> {
  if (prevStatus === newStatus) return;
  const actor = ctx.actorId || null;
  const partner = ctx.partnerId || null;   // strict — no actor fallback
  const client = ctx.clientId || null;

  const TERMINAL = new Set(["completed", "paid", "invoiced"]);
  if (TERMINAL.has(newStatus)) {
    if (TERMINAL.has(prevStatus)) return;
    if (ctx.alreadyCredited) {
      console.log("[Reputation] skip: order already credited (completedAt set)");
      return;
    }
    if (partner) await applyReputation({ kind: "job_completed", userId: partner });
    if (client && client !== partner) {
      await applyReputation({ kind: "client_job_completed", userId: client });
    }
  } else if (newStatus === "cancelled") {
    if (actor) await applyReputation({ kind: "cancellation", userId: actor });
  }
}
