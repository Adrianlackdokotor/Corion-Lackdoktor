// Mechanical policy evaluator for agent task results.
// Implements docs/architecture/agent-task-approval-policy.md as executable logic.
//
// evaluateResult() is deterministic — same inputs always produce same verdict.
// It never calls the API or modifies state; callers decide what to do with the verdict.
//
// Verdict meanings:
//   auto_approve  — safe to call approveTask() without human review
//   auto_rework   — safe to call requestRework() without human review (execution failure)
//   needs_human   — must surface to operator; do not call approveTask/requestRework

import type { AgentTask, AgentTaskResult } from "../../shared/schema";

// ── Public types ──────────────────────────────────────────────────────────────

export type PolicyVerdict = "auto_approve" | "auto_rework" | "needs_human";

export interface PolicyDecision {
  verdict: PolicyVerdict;
  // Non-empty list of signals that determined the verdict.
  // Include in any notification or audit log so the decision is traceable.
  reasons: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Any changed-file path that matches one of these patterns forces needs_human.
// Patterns map to the "Sensitive areas" section of CLAUDE.md and the approval policy.
const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /shared\/schema\.ts/,
  /server\/routes\/auth/i,
  /server\/routes\/admin-finance/i,
  /password/i,
  /credential/i,
  /\.env($|\.)/,
  /PartnerDashboard/,
  /PartnerPortal/,
];

// Keywords in the task prompt that imply destructive intent.
const DESTRUCTIVE_KEYWORDS = ["delete", "drop", "migrate", "force", " rm ", "reset"] as const;

// Substrings in rawOutput that indicate the bridge itself (not Claude) failed.
const BRIDGE_ERROR_MARKERS = [
  "[bridge] error",
  "claude cli exited",
  "[bridge] rejected",
] as const;

// Task types that always require a human to approve the result.
const HUMAN_REQUIRED_TASK_TYPES = ["coding", "cleanup"] as const;

// Task types eligible for auto-approve when all other conditions are met.
const AUTO_APPROVABLE_TASK_TYPES = ["docs", "analysis"] as const;

// ── Private helpers ───────────────────────────────────────────────────────────

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function isExecutionFailure(result: AgentTaskResult): boolean {
  if (result.exitCode != null && result.exitCode !== 0) return true;
  if (!result.summary?.trim()) return true;
  if (result.rawOutput) {
    const lower = result.rawOutput.toLowerCase();
    if (BRIDGE_ERROR_MARKERS.some((m) => lower.includes(m))) return true;
  }
  return false;
}

function sensitivePaths(changedFiles: string[]): string[] {
  return changedFiles.filter((p) => SENSITIVE_PATH_PATTERNS.some((re) => re.test(p)));
}

function hasDestructiveKeyword(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return DESTRUCTIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Evaluator ─────────────────────────────────────────────────────────────────

export function evaluateResult(task: AgentTask, result: AgentTaskResult): PolicyDecision {
  const changedFiles = toStringArray(result.changedFilesJson);
  const risks = toStringArray(result.risksJson);
  const verificationNeeded = toStringArray(result.verificationNeededJson);
  const executionFailed = isExecutionFailure(result);

  // ── Rule 1: auto_rework — execution failed with no file writes ───────────────
  //
  // Requesting rework on a clearly broken run is mechanical, not evaluative.
  // If files were written despite the failure we escalate instead: a partial write
  // means the working tree may already be modified, and re-running without human
  // inspection could compound the damage.
  if (executionFailed && changedFiles.length === 0) {
    const reasons: string[] = [];
    if (result.exitCode != null && result.exitCode !== 0)
      reasons.push(`non-zero exit code (${result.exitCode})`);
    if (!result.summary?.trim())
      reasons.push("summary is blank or missing");
    if (
      result.rawOutput &&
      BRIDGE_ERROR_MARKERS.some((m) => result.rawOutput!.toLowerCase().includes(m))
    )
      reasons.push("bridge error marker in rawOutput");
    return { verdict: "auto_rework", reasons };
  }

  // ── Rule 2: needs_human — collect all disqualifying signals ─────────────────
  //
  // Any single disqualifier forces needs_human. All signals are collected so the
  // notification to the operator is informative, not just "human needed".
  const disqualifiers: string[] = [];

  // Null exit code means the outcome is uncertain — auto-approve would be blind trust.
  if (result.exitCode === null)
    disqualifiers.push("exit code is null — outcome uncertain, cannot auto-approve");

  if (changedFiles.length > 0)
    disqualifiers.push(`files written: ${changedFiles.join(", ")}`);

  if ((HUMAN_REQUIRED_TASK_TYPES as readonly string[]).includes(task.taskType))
    disqualifiers.push(`task type '${task.taskType}' always requires human review`);

  const bad = sensitivePaths(changedFiles);
  if (bad.length > 0)
    disqualifiers.push(`sensitive path(s): ${bad.join(", ")}`);

  if (risks.length > 0)
    disqualifiers.push(`worker flagged ${risks.length} risk(s): ${risks.join("; ")}`);

  if (verificationNeeded.length > 0)
    disqualifiers.push(`worker requested verification: ${verificationNeeded.join("; ")}`);

  if (hasDestructiveKeyword(task.taskPrompt))
    disqualifiers.push("destructive keyword in task prompt");

  // Execution failed AND files were changed — partial write scenario.
  if (executionFailed && changedFiles.length > 0)
    disqualifiers.push("execution failed with partial file writes — inspect before re-running");

  if (disqualifiers.length > 0)
    return { verdict: "needs_human", reasons: disqualifiers };

  // ── Rule 3: auto_approve — explicitly safe task types only ───────────────────
  //
  // Only reached when: no changed files, no risks, no verification requests,
  // no destructive keywords, and task type is not coding/cleanup.
  if ((AUTO_APPROVABLE_TASK_TYPES as readonly string[]).includes(task.taskType)) {
    return {
      verdict: "auto_approve",
      reasons: [
        `task type '${task.taskType}' with clean exit, no file writes, and no risk signals`,
      ],
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────────
  //
  // Task type not covered by an explicit auto-approve rule (e.g. a future task
  // type added to the schema before the policy is updated). Default to human review.
  return {
    verdict: "needs_human",
    reasons: [`task type '${task.taskType}' has no explicit auto-approve rule — defaulting to human review`],
  };
}
