import { storage } from "../storage";

const REWARD_PARTNER = 250;
const REWARD_CUSTOMER = 25;

/**
 * Hub+1 Contribution Economy — fire when a referred user takes their FIRST
 * value-creating action (currently: first Auftrag created). Idempotent: only
 * rewards once because we transition the referral row from pending → rewarded.
 *
 * Safe to call fire-and-forget — never throws to caller.
 */
export async function tryRewardReferral(
  referredUserId: string,
  relatedAuftragId?: string | null,
): Promise<void> {
  try {
    const ref = await storage.getReferralByReferred(referredUserId);
    if (!ref || ref.status !== "pending") return;

    const referredUser = await storage.getUser(referredUserId);
    if (!referredUser) return;

    const isPartner = referredUser.role === "partner";
    const reward = isPartner ? REWARD_PARTNER : REWARD_CUSTOMER;
    const kind = isPartner ? "onboarding_partner" : "referred_customer";

    await storage.creditTokens(
      ref.referrerId,
      reward,
      `referral_${kind}`,
      relatedAuftragId || null,
    );
    await storage.recordTokenEarnEvent({
      userId: ref.referrerId,
      kind,
      tokens: reward,
      refKey: referredUserId,
      meta: { referralId: ref.id, auftragId: relatedAuftragId || null } as any,
    });
    await storage.markReferralRewarded(ref.id, reward);

    console.log(
      `[Referral] rewarded ${ref.referrerId} +${reward} tokens (${kind}) for ${referredUser.email}`,
    );
  } catch (err) {
    console.error("[Referral] reward failed (non-fatal):", err);
  }
}
