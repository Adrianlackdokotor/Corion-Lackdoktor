import { storage } from "../storage";
import type { StakingPosition } from "@shared/schema";

/**
 * Hub+1 Staking Engine
 *
 * Users lock HUB+1 utility tokens into a pool for a fixed period and earn
 * a published APY in tokens. On unstake (after lockUntil) the principal +
 * accrued rewards are credited back to the user wallet.
 *
 * NOTE: HUB+1 tokens are utility credits, NOT securities. Staking here is
 * a usage-incentive program — pools fund the AI infra, partner liquidity,
 * growth budget, and governance reserve respectively.
 */

export type PoolKey = "ai_infra" | "partner_pool" | "growth" | "governance";

export interface PoolDef {
  key: PoolKey;
  label: string;
  description: string;
  apyBps: number; // 100 = 1%
  lockOptionsDays: number[]; // allowed lock durations
  minStake: number; // tokens
}

export const POOL_CATALOG: PoolDef[] = [
  {
    key: "ai_infra",
    label: "AI Infrastructure",
    description: "Fund AI compute & model fees. Stable mid-yield.",
    apyBps: 800, // 8%
    lockOptionsDays: [30, 90, 180],
    minStake: 100,
  },
  {
    key: "partner_pool",
    label: "Partner Liquidity",
    description: "Underwrite partner escrow & speed-up payouts. Highest yield.",
    apyBps: 1200, // 12%
    lockOptionsDays: [90, 180, 365],
    minStake: 500,
  },
  {
    key: "growth",
    label: "Growth Budget",
    description: "Fund acquisition campaigns. Short lock-ups.",
    apyBps: 600, // 6%
    lockOptionsDays: [30, 90],
    minStake: 100,
  },
  {
    key: "governance",
    label: "Governance Reserve",
    description: "Voting weight, no lock. Lower yield.",
    apyBps: 400, // 4%
    lockOptionsDays: [0],
    minStake: 50,
  },
];

export function getPool(key: string): PoolDef | undefined {
  return POOL_CATALOG.find((p) => p.key === key);
}

/**
 * Pure function: how many tokens this position has accrued so far.
 * Always rounded DOWN to never over-credit.
 */
export function calculateAccruedRewards(position: StakingPosition, now: Date = new Date()): number {
  const created = position.createdAt ? new Date(position.createdAt) : now;
  const elapsedMs = Math.max(0, now.getTime() - created.getTime());
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  // neon-http returns integer cols as strings sometimes — coerce defensively.
  const amount = Number(position.amountTokens);
  const apyBps = Number(position.apyBps);
  const annualRate = apyBps / 10000;
  return Math.floor(amount * annualRate * (elapsedDays / 365));
}

export interface StakeResult {
  position: StakingPosition;
  newBalance: number;
}

export async function stake(opts: {
  userId: string;
  pool: PoolKey;
  amount: number;
  lockDays: number;
}): Promise<StakeResult> {
  const def = getPool(opts.pool);
  if (!def) throw new Error("UNKNOWN_POOL");
  if (!def.lockOptionsDays.includes(opts.lockDays)) {
    throw new Error("INVALID_LOCK_DURATION");
  }
  if (!Number.isFinite(opts.amount) || opts.amount < def.minStake) {
    throw new Error("AMOUNT_BELOW_MIN");
  }
  const amount = Math.floor(opts.amount);
  // Atomic-ish: debit first (throws INSUFFICIENT_TOKENS if low), then create
  // the position. If position insert fails, the debit ledger row stays — we
  // log it so an admin can refund. In practice neon-http insert rarely fails
  // after a successful update.
  const newBalance = await storage.debitTokens(
    opts.userId,
    amount,
    `stake_${opts.pool}`,
  );
  const lockUntil =
    opts.lockDays > 0
      ? new Date(Date.now() + opts.lockDays * 24 * 60 * 60 * 1000)
      : null;
  try {
    const position = await storage.createStakingPosition({
      userId: opts.userId,
      amountTokens: amount,
      pool: opts.pool,
      apyBps: def.apyBps,
      lockUntil,
      status: "active",
    } as any);
    console.log(
      `[Staking] staked ${amount} tokens user=${opts.userId} pool=${opts.pool} lockUntil=${lockUntil?.toISOString() ?? "none"}`,
    );
    return { position, newBalance };
  } catch (err) {
    console.error(
      `[Staking] CRITICAL: debited ${amount} but createStakingPosition failed for user=${opts.userId}. Manual refund needed.`,
      err,
    );
    throw err;
  }
}

export interface UnstakeResult {
  principal: number;
  rewards: number;
  newBalance: number;
}

export async function unstake(opts: {
  userId: string;
  positionId: string;
}): Promise<UnstakeResult> {
  const pos = await storage.getStakingPosition(opts.positionId);
  if (!pos) throw new Error("POSITION_NOT_FOUND");
  if (pos.userId !== opts.userId) throw new Error("FORBIDDEN");
  if (pos.status !== "active") throw new Error("POSITION_NOT_ACTIVE");
  if (pos.lockUntil && new Date(pos.lockUntil).getTime() > Date.now()) {
    throw new Error("STILL_LOCKED");
  }

  const rewards = calculateAccruedRewards(pos);
  // neon-http int cols may arrive as strings → coerce before arithmetic.
  const principal = Number(pos.amountTokens);
  const totalCredit = principal + rewards;
  if (!Number.isFinite(totalCredit) || totalCredit <= 0) {
    throw new Error("INVALID_TOTAL_CREDIT");
  }

  // Mark withdrawn FIRST (atomic guard against double-withdraw racing).
  // updateStakingPositionStatus only flips when status='active' so undefined
  // here means another request already withdrew this position.
  const updated = await storage.updateStakingPositionStatus(opts.positionId, "withdrawn");
  if (!updated) {
    throw new Error("WITHDRAW_RACE");
  }

  const newBalance = await storage.creditTokens(
    opts.userId,
    totalCredit,
    `unstake_${pos.pool}`,
  );
  console.log(
    `[Staking] unstaked id=${opts.positionId} principal=${principal} rewards=${rewards} newBalance=${newBalance}`,
  );
  return { principal, rewards, newBalance };
}
