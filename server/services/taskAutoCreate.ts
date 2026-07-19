import { storage } from "../storage";
import {
  classifyTask,
  derivePriority,
  type AgentRole,
  type TaskSourceType,
} from "./taskBoardEngine";

export interface AutoCreateInput {
  title: string;
  description?: string;
  sourceType: TaskSourceType;
  sourceId?: string;
  impactValueCents?: number;
  clientFacing?: boolean;
  contractChange?: boolean;
  forcedAgent?: AgentRole;
  payload?: Record<string, unknown>;
  createdById?: string | null;
}

export async function autoCreateBoardTask(input: AutoCreateInput) {
  try {
    const decision = classifyTask({
      sourceType: input.sourceType,
      impactValueCents: input.impactValueCents ?? 0,
      clientFacing: !!input.clientFacing,
      contractChange: !!input.contractChange,
      forcedAgent: input.forcedAgent,
    });
    const priority = derivePriority({
      sourceType: input.sourceType,
      impactValueCents: input.impactValueCents ?? 0,
      clientFacing: !!input.clientFacing,
      contractChange: !!input.contractChange,
    });
    let task = await storage.createTaskBoardTask({
      title: input.title,
      description: input.description ?? null,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      impactValueCents: input.impactValueCents ?? 0,
      payload: input.payload ?? {},
      assignedAgent: decision.assignedAgent,
      priority,
      requiresReview: decision.requiresReview,
      autoClaimEligible: decision.autoClaimEligible,
      createdById: input.createdById ?? null,
      column: "todo",
    });
    await storage.recordAgentAction({
      taskId: task.id,
      actor: "system",
      actorUserId: input.createdById ?? null,
      action: "auto_create",
      input: { sourceType: input.sourceType, sourceId: input.sourceId ?? null },
      output: { decision, priority },
      success: true,
      message: `auto-created from ${input.sourceType}`,
    });
    if (decision.autoClaimEligible && decision.assignedAgent) {
      const claimed = await storage.claimTaskBoardTask(task.id, decision.assignedAgent, null);
      if (claimed) task = claimed;
    }
    return task;
  } catch (e) {
    console.error("[taskAutoCreate] failed:", e);
    return null;
  }
}
