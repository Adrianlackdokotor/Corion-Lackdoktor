import { storage } from "../storage";
import { replaceEscrow } from "./escrowEngine";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";

/**
 * Atomically claim a waitlist candidate by flipping its status from "waiting"
 * to the new status in a single SQL statement. Returns true iff exactly one
 * row was updated (i.e. we won the race against any concurrent matcher).
 * This guards against double-fill when two cancellations land at the same time.
 */
async function claimCandidate(id: string, newStatus: "accepted" | "offered"): Promise<boolean> {
  const result: any = await db.execute(sql`
    UPDATE appointment_waitlist
       SET status = ${newStatus}, notified_at = NOW()
     WHERE id = ${id} AND status = 'waiting'
  `);
  const count = Number(result?.rowCount ?? result?.rows?.length ?? 0);
  return count === 1;
}

/**
 * Hub+1 Waitlist Matcher — when an appointment is cancelled, try to re-fill
 * the slot from the standby waitlist before forfeiting/refunding the deposit.
 *
 * Matching is best-effort:
 *   - candidate must be `status="waiting"`
 *   - location filter: candidate's locationId is null OR matches the order's location
 *   - service filter:  candidate's serviceKind is null OR matches the order's service
 *   - time filter:     slot start is within candidate's [preferredFrom, preferredTo]
 *
 * If a candidate has `autoAccept=true`, the slot is filled automatically and
 * the original escrow is marked "replaced" (small fee instead of full forfeit).
 * Manual-accept candidates are just notified — handled by a future notify
 * channel; they remain in "offered" state until they confirm.
 */
export async function tryFillFromWaitlist(opts: {
  auftragId: string;
  locationId?: string | null;
  serviceKind?: string | null;
  slotStart?: Date | null;
}): Promise<{ filled: boolean; candidateId?: string; reason?: string }> {
  try {
    const candidates = await storage.getWaitingCandidates({
      locationId: opts.locationId ?? null,
      serviceKind: opts.serviceKind ?? null,
      at: opts.slotStart ?? null,
    });
    if (candidates.length === 0) {
      return { filled: false, reason: "no_candidates" };
    }
    // Try auto-accept candidates first, then manual. We loop because the
    // atomic claim may lose a race with a concurrent matcher.
    const ordered = [
      ...candidates.filter((c) => c.autoAccept === true),
      ...candidates.filter((c) => c.autoAccept !== true),
    ];
    for (const cand of ordered) {
      const target: "accepted" | "offered" = cand.autoAccept ? "accepted" : "offered";
      const won = await claimCandidate(cand.id, target);
      if (!won) continue; // another matcher already took this candidate

      if (target === "accepted") {
        const replaced = await replaceEscrow(opts.auftragId);
        if (replaced > 0) {
          console.log(
            `[Waitlist] auto-filled auftrag=${opts.auftragId} via candidate=${cand.id} (replaced=${replaced})`,
          );
          return { filled: true, candidateId: cand.id };
        }
        // Replacement failed (no held escrow / already settled). Roll the
        // candidate back so they can be matched again instead of being stuck
        // in "accepted" with nothing to attend.
        await storage.updateWaitlistEntry(cand.id, { status: "waiting" });
        console.warn(
          `[Waitlist] replaceEscrow=0 for auftrag=${opts.auftragId}; rolled back candidate=${cand.id}`,
        );
        return { filled: false, reason: "replace_failed" };
      }
      console.log(
        `[Waitlist] offered slot to candidate=${cand.id} for auftrag=${opts.auftragId} (manual accept pending)`,
      );
      return { filled: false, candidateId: cand.id, reason: "offered_manual" };
    }
    return { filled: false, reason: "all_claimed" };
  } catch (err) {
    console.error("[Waitlist] match failed (non-fatal):", err);
    return { filled: false, reason: String(err) };
  }
}
