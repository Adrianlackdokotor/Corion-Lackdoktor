// One-shot supervised task runner.
//
// Dispatch → poll → evaluate → act (approve / request-rework / escalate).
// Does NOT implement retry loops, notification delivery, or persistent queues.
// One call = one complete lifecycle for one task.
//
// Safety limits:
//   - Hard timeout: caller-configurable, default 5 min. Returns timed_out.
//   - External-review guard: if the task status changes to something unexpected
//     during the poll (e.g. a human reviewed concurrently), the loop aborts
//     and returns needs_human rather than taking a conflicting action.
//   - needs_human is always a no-op on the task — the loop never touches a task
//     it cannot mechanically decide. The caller must surface it to an operator.

import { dispatch, getTaskStatus, approveTask, requestRework } from "./supervisorDispatch";
import { evaluateResult } from "./agentTaskPolicy";
import type { AgentTask, AgentTaskResult } from "../../shared/schema";
import type { DispatchParams } from "./supervisorDispatch";
import type { PolicyDecision } from "./agentTaskPolicy";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes

// Statuses the loop will continue polling through.
const POLL_STATUSES = new Set(["queued", "running"]);

// ── Public types ──────────────────────────────────────────────────────────────

export type LoopOutcome =
  | "approved"          // auto_approve path — approveTask() was called
  | "rework_requested"  // auto_rework path — requestRework() was called
  | "needs_human"       // policy or data issue — task NOT touched, caller must escalate
  | "timed_out"         // task did not reach pending_review within timeoutMs
  | "dispatch_failed";  // createTask() or triggerRun() threw

export interface LoopResult {
  outcome: LoopOutcome;
  taskId: string | null;
  elapsedMs: number;
  // Present for outcomes that reached pending_review:
  task?: AgentTask;
  result?: AgentTaskResult;
  decision?: PolicyDecision;
  // outcome === timed_out: task status when the clock ran out
  taskStatusAtTimeout?: string;
  // outcome === dispatch_failed: the thrown error message
  error?: string;
}

export interface LoopOptions {
  pollIntervalMs?: number; // default 5 000 ms
  timeoutMs?: number;      // default 300 000 ms (5 min)
  // Written verbatim into the review row — always set for auto actions so the
  // DB audit trail shows the loop made the decision, not a human.
  reviewNotes?: string;
}

// ── Private inner loop (poll → evaluate → act) ───────────────────────────────
//
// Shared by runSupervisedTask (dispatch included) and evaluateDispatchedTask
// (task already dispatched, only the loop is needed).

async function pollEvaluateAct(
  taskId: string,
  startedAt: number,
  pollInterval: number,
  timeout: number,
  reviewNotes: string,
): Promise<LoopResult> {
  let latest: { task: AgentTask; result?: AgentTaskResult } | null = null;

  // ── Poll until pending_review, timeout, or unexpected status ─────────────────
  while (true) {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= timeout) {
      return {
        outcome: "timed_out",
        taskId,
        elapsedMs: elapsed,
        task: latest?.task,
        taskStatusAtTimeout: latest?.task.status ?? "unknown",
      };
    }

    latest = await getTaskStatus(taskId);
    const { status } = latest.task;

    if (status === "pending_review") break;

    if (POLL_STATUSES.has(status)) {
      await new Promise<void>((r) => setTimeout(r, pollInterval));
      continue;
    }

    // Any other status means something external acted on this task.
    return {
      outcome: "needs_human",
      taskId,
      elapsedMs: Date.now() - startedAt,
      task: latest.task,
      result: latest.result,
      decision: {
        verdict: "needs_human",
        reasons: [`unexpected task status '${status}' during poll — external action may have occurred`],
      },
    };
  }

  // ── Evaluate ──────────────────────────────────────────────────────────────────
  const { task, result } = latest!;

  if (!result) {
    return {
      outcome: "needs_human",
      taskId,
      elapsedMs: Date.now() - startedAt,
      task,
      decision: {
        verdict: "needs_human",
        reasons: ["task reached pending_review with no result row — data integrity issue"],
      },
    };
  }

  const decision = evaluateResult(task, result);

  // ── Act ───────────────────────────────────────────────────────────────────────
  if (decision.verdict === "auto_approve") {
    await approveTask(taskId, reviewNotes);
    return { outcome: "approved", taskId, elapsedMs: Date.now() - startedAt, task, result, decision };
  }

  if (decision.verdict === "auto_rework") {
    await requestRework(taskId, `${reviewNotes}: ${decision.reasons.join("; ")}`);
    return { outcome: "rework_requested", taskId, elapsedMs: Date.now() - startedAt, task, result, decision };
  }

  // needs_human — leave the task in pending_review; caller must surface it.
  return { outcome: "needs_human", taskId, elapsedMs: Date.now() - startedAt, task, result, decision };
}

// ── Public entry points ───────────────────────────────────────────────────────

/** Dispatch a new task and run the full supervised loop. */
export async function runSupervisedTask(
  params: DispatchParams,
  options: LoopOptions = {},
): Promise<LoopResult> {
  const pollInterval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const reviewNotes = options.reviewNotes ?? "Automated — supervisorLoop";
  const startedAt = Date.now();

  let taskId: string;
  try {
    taskId = await dispatch(params);
  } catch (err) {
    return {
      outcome: "dispatch_failed",
      taskId: null,
      elapsedMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return pollEvaluateAct(taskId, startedAt, pollInterval, timeout, reviewNotes);
}

/**
 * Run the poll → evaluate → act loop for a task that has already been dispatched.
 * Use this when you need the taskId before the loop completes (e.g. to return a
 * 202 response immediately while the loop runs in the background).
 */
export async function evaluateDispatchedTask(
  taskId: string,
  options: LoopOptions = {},
): Promise<LoopResult> {
  return pollEvaluateAct(
    taskId,
    Date.now(),
    options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    options.reviewNotes ?? "Automated — supervisorLoop",
  );
}
