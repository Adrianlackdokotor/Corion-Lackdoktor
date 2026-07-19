// Task Board Routing Engine
// -------------------------------------------------------------------------
// Pure functions that classify a task and decide:
//   1. Which AI agent role should own it.
//   2. Whether the agent may auto-claim (no human assignment needed).
//   3. Whether completion requires human review (HITL) before going to "done".
//
// Keep this file dependency-free (no DB, no I/O) so it stays trivially
// testable and reusable from auto-create hooks across the app.

export type AgentRole =
  | "cfo"
  | "reception"
  | "partner_liaison"
  | "customer_care"
  | "marketing"
  | "qc"
  | "scheduler";

export type TaskSourceType =
  | "auftrag"
  | "invoice"
  | "upload"
  | "lead_stale"
  | "marketing_request"
  | "photo_qc"
  | "scheduler_overload"
  | "scheduler_gap"
  | "manual";

export const AGENT_ROLES: readonly AgentRole[] = [
  "cfo",
  "reception",
  "partner_liaison",
  "customer_care",
  "marketing",
  "qc",
  "scheduler",
] as const;

export const AGENT_LABELS: Record<AgentRole, string> = {
  cfo: "CFO Agent",
  reception: "Reception Agent",
  partner_liaison: "Partner Liaison",
  customer_care: "Customer Care",
  marketing: "Marketing Agent",
  qc: "Quality Control",
  scheduler: "Scheduler AI",
};

// Default routing per source type.
const SOURCE_TO_AGENT: Record<TaskSourceType, AgentRole | null> = {
  auftrag: "reception",
  invoice: "cfo",
  upload: "cfo",
  lead_stale: "partner_liaison",
  marketing_request: "marketing",
  photo_qc: "qc",
  scheduler_overload: "scheduler",
  scheduler_gap: "scheduler",
  manual: null, // requires explicit assignment
};

// Threshold above which any task goes to "review" before "done".
const HITL_IMPACT_CENTS = 50_000; // €500.00

export interface RoutingInput {
  sourceType: TaskSourceType;
  impactValueCents?: number;
  // Flags that always force HITL regardless of value.
  clientFacing?: boolean;
  contractChange?: boolean;
  // Optional explicit override.
  forcedAgent?: AgentRole | null;
}

export interface RoutingDecision {
  assignedAgent: AgentRole | null;
  autoClaimEligible: boolean;
  requiresReview: boolean;
  reason: string[];
}

export function classifyTask(input: RoutingInput): RoutingDecision {
  const reason: string[] = [];
  const assignedAgent =
    input.forcedAgent !== undefined
      ? input.forcedAgent
      : SOURCE_TO_AGENT[input.sourceType];

  if (input.forcedAgent !== undefined) reason.push("forcedAgent");
  else reason.push(`sourceType:${input.sourceType}`);

  const impact = Math.max(0, input.impactValueCents ?? 0);
  const overThreshold = impact >= HITL_IMPACT_CENTS;
  if (overThreshold) reason.push(`impact>=${HITL_IMPACT_CENTS}`);
  if (input.clientFacing) reason.push("clientFacing");
  if (input.contractChange) reason.push("contractChange");

  const requiresReview =
    overThreshold || !!input.clientFacing || !!input.contractChange;

  // Auto-claim only when an agent is decided AND the task is routine
  // (no review trigger). Manual tasks never auto-claim.
  const autoClaimEligible =
    assignedAgent !== null && !requiresReview && input.sourceType !== "manual";

  if (autoClaimEligible) reason.push("auto_claim");
  else if (assignedAgent && requiresReview) reason.push("manual_due_to_review");

  return { assignedAgent, autoClaimEligible, requiresReview, reason };
}

// Convenience: also derive a sensible priority bucket from impact + flags.
export function derivePriority(input: RoutingInput): "routine" | "normal" | "high" | "critical" {
  const impact = Math.max(0, input.impactValueCents ?? 0);
  if (input.contractChange || impact >= 200_000) return "critical";
  if (impact >= HITL_IMPACT_CENTS || input.clientFacing) return "high";
  if (impact > 0) return "normal";
  return "routine";
}

export const HITL_THRESHOLD_CENTS = HITL_IMPACT_CENTS;
