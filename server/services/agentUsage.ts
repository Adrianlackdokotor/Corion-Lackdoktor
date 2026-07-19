import { storage } from "../storage";
import type { AgentSurface } from "../ai-skills/agent-registry";

export type AgentUsageInput = {
  agentSlug: string;
  agentKey: string;
  ownerUserId?: string | null;
  beneficiaryUserId?: string | null;
  surface: AgentSurface;
  operation: string;
  units?: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  model?: string | null;
  provider?: string | null;
  relatedOrderId?: string | null;
  relatedTaskId?: string | null;
  billable?: boolean;
  debitCredits?: boolean;
};

export async function recordAgentUsage(input: AgentUsageInput) {
  const units = Math.max(1, Math.round(input.units ?? 1));
  let balanceAfter: number | null = null;
  let debitStatus: "not_requested" | "debited" | "insufficient" = "not_requested";

  // Measurement and billing are deliberately separate. A caller must opt into
  // both flags before this service touches the financial token ledger.
  if (input.billable && input.debitCredits && input.beneficiaryUserId) {
    try {
      balanceAfter = await storage.debitTokens(
        input.beneficiaryUserId,
        units,
        `agent_usage:${input.agentKey}:${input.operation}`,
        input.relatedOrderId ?? null,
      );
      debitStatus = "debited";
    } catch (error: any) {
      if (error?.message === "INSUFFICIENT_TOKENS") debitStatus = "insufficient";
      else throw error;
    }
  }

  const event = await storage.insertAgentEvent({
    agentSlug: input.agentSlug,
    eventType: "usage_recorded",
    busTaskType: input.operation,
    title: `${input.agentKey} · ${input.operation}`,
    summary: `${units} usage unit(s) on ${input.surface}`,
    payload: {
      schemaVersion: "hub1.agent-usage.v1",
      agentKey: input.agentKey,
      ownerUserId: input.ownerUserId ?? null,
      beneficiaryUserId: input.beneficiaryUserId ?? null,
      surface: input.surface,
      operation: input.operation,
      units,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      model: input.model ?? null,
      provider: input.provider ?? null,
      billable: input.billable ?? false,
      debitStatus,
      balanceAfter,
    },
    relatedOrderId: input.relatedOrderId ?? null,
    relatedTaskId: input.relatedTaskId ?? null,
    status: debitStatus === "insufficient" ? "error" : "ok",
    visibility: "admin",
  });

  return { eventId: event.id, units, debitStatus, balanceAfter };
}
