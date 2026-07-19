// Thin typed client for the agent-task HTTP surface.
//
// Intended use: any trusted caller (e.g. Cora, server-side cron, webhook handlers)
// that needs to queue and trigger a worker task without a browser session.
//
// Auth: reads AGENT_TASK_SERVICE_TOKEN from env at call time.
//       Throws if the token is not set — fail loudly rather than silently 401.
//
// Base URL: reads CORION_BASE_URL from env; defaults to http://localhost:<PORT>.
//           Set CORION_BASE_URL in prod/staging to the actual service hostname.
//
// This module does NOT poll, retry, or orchestrate. It wraps the five HTTP
// operations (create, run, status, approve, requestRework) into typed async
// functions and offers a dispatch() convenience that does create + run in one call.

import type { AgentTask, AgentTaskResult } from "../../shared/schema";

// ── Config helpers ────────────────────────────────────────────────────────────

function baseUrl(): string {
  return process.env.CORION_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
}

function serviceToken(): string {
  const t = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (!t) throw new Error("[supervisorDispatch] AGENT_TASK_SERVICE_TOKEN is not set");
  return t;
}

// ── HTTP primitive ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceToken()}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[supervisorDispatch] ${method} ${path} → HTTP ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface DispatchParams {
  title: string;
  taskType?: "coding" | "docs" | "analysis" | "cleanup";
  taskPrompt: string;
  workingDirectory?: string;
  contextRefs?: string[];
}

export interface TaskStatusResult {
  task: AgentTask;
  result?: AgentTaskResult;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Create a new agent task (status: queued). */
export async function createTask(params: DispatchParams): Promise<AgentTask> {
  const { task } = await apiFetch<{ task: AgentTask }>("/api/agent-tasks", "POST", params);
  return task;
}

/**
 * Trigger execution of a queued task.
 * Returns immediately (HTTP 202) — the bridge runs Claude in the background.
 * Throws if the task is not queued or another task is already running (BRIDGE_BUSY).
 */
export async function triggerRun(taskId: string): Promise<void> {
  await apiFetch(`/api/agent-tasks/${taskId}/run`, "POST");
}

/** Fetch current task state plus the latest result row (if any). */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResult> {
  return apiFetch<TaskStatusResult>(`/api/agent-tasks/${taskId}`);
}

/**
 * Create a task and immediately trigger it.
 * Returns the task ID so the caller can poll getTaskStatus().
 *
 * Example:
 *   const id = await dispatch({ title: "...", taskPrompt: "..." });
 *   // later:
 *   const { task, result } = await getTaskStatus(id);
 */
export async function dispatch(params: DispatchParams): Promise<string> {
  const task = await createTask(params);
  await triggerRun(task.id);
  return task.id;
}

/**
 * Approve a task that is in pending_review state.
 * Transitions the result row to reviewStatus: "approved".
 * Throws if the task is not in pending_review or has no result yet.
 */
export async function approveTask(
  taskId: string,
  reviewNotes?: string,
): Promise<AgentTaskResult> {
  const { result } = await apiFetch<{ result: AgentTaskResult }>(
    `/api/agent-tasks/${taskId}/review`,
    "POST",
    { reviewStatus: "approved", reviewNotes },
  );
  return result;
}

/**
 * Mark a pending_review task as needing rework.
 * Transitions the result row to reviewStatus: "needs_rework".
 * The task can then be reset to queued and re-run via dispatch().
 * Throws if the task is not in pending_review or has no result yet.
 */
export async function requestRework(
  taskId: string,
  reviewNotes?: string,
): Promise<AgentTaskResult> {
  const { result } = await apiFetch<{ result: AgentTaskResult }>(
    `/api/agent-tasks/${taskId}/review`,
    "POST",
    { reviewStatus: "needs_rework", reviewNotes },
  );
  return result;
}
