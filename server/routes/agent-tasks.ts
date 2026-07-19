// REST API for the Claude Worker Bridge task queue.
// Auth model: all endpoints require admin-level access via one of two paths:
//   1. Active admin session cookie  — human operators via the browser UI
//   2. Bearer token in Authorization header — non-browser supervisors (e.g. Cora)
//      Token is read from AGENT_TASK_SERVICE_TOKEN env var. Never stored in DB.
//      Scope is strictly limited to this route file — no other admin surface accepts it.
//
// Lifecycle:
//   POST /api/agent-tasks           → create (status: queued)
//   POST /api/agent-tasks/:id/claim → bridge claims it (status: running)
//   POST /api/agent-tasks/:id/result → bridge writes output (status: pending_review)
//   POST /api/agent-tasks/:id/review → admin approves or rejects

import { timingSafeEqual } from "crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { executeTask } from "../services/claudeWorkerBridge";

// ── Constants ────────────────────────────────────────────────────────────────

const AGENT_TYPES = ["claude_worker"] as const;
const TASK_TYPES = ["coding", "docs", "analysis", "cleanup"] as const;
const REVIEW_STATUSES = ["approved", "needs_rework"] as const;

// ── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(300),
  agentType: z.enum(AGENT_TYPES).default("claude_worker"),
  taskType: z.enum(TASK_TYPES).default("coding"),
  taskPrompt: z.string().min(10).max(8000),
  workingDirectory: z.string().min(1).default("."),
  contextRefs: z.array(z.string()).default([]),
});

const resultSchema = z.object({
  summary: z.string().max(2000).optional(),
  rawOutput: z.string().optional(),
  exitCode: z.number().int().optional(),
  changedFilesJson: z.array(z.string()).default([]),
  risksJson: z.array(z.string()).default([]),
  verificationNeededJson: z.array(z.string()).default([]),
  structuredOutputJson: z.record(z.unknown()).default({}),
});

const reviewSchema = z.object({
  reviewStatus: z.enum(REVIEW_STATUSES),
  reviewNotes: z.string().max(2000).optional(),
});

const resetSchema = z.object({
  reason: z.string().max(500).optional(),
});

// States from which a reset is permitted.
const RESETTABLE_STATUSES = ["running", "failed", "needs_rework"] as const;

// ── Auth ─────────────────────────────────────────────────────────────────────
//
// ensureAgentTaskAuth accepts two auth paths and combines the auth + admin
// check into one call. Returns { id, role: "admin" } on success, null on failure
// (response already written).
//
// Path 1 — session cookie (human operators):
//   Standard Passport session. User must have role = "admin".
//   Non-admin session → 403. No session at all → falls through to path 2.
//
// Path 2 — bearer token (non-browser supervisors):
//   Authorization: Bearer <AGENT_TASK_SERVICE_TOKEN>
//   Token is compared with timingSafeEqual to resist timing attacks.
//   Returns { id: "service", role: "admin" } on match.
//   Invalid or missing token → 401.
//
// Scope: this function is ONLY used in this file. No other admin surface
// accepts the service token. Do not export it.

// id is null for service-token callers (no DB user row — createdById is nullable).
type AgentTaskCaller = { id: string | null; role: string };

function ensureAgentTaskAuth(
  req: Request,
  res: Response,
): AgentTaskCaller | null {
  // Path 1: existing session user.
  const sessionUser = (req as any).user;
  if (sessionUser?.id) {
    if (sessionUser.role !== "admin") {
      res.status(403).json({ message: "Admin only" });
      return null;
    }
    return { id: sessionUser.id, role: "admin" };
  }

  // Path 2: service bearer token.
  const expected = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (expected) {
    const authHeader = req.headers.authorization ?? "";
    const candidate = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    const candidateBuf = Buffer.from(candidate);
    const expectedBuf = Buffer.from(expected);

    // Length must match before calling timingSafeEqual (which requires equal-length buffers).
    // Length inequality leaks no exploitable information here: token space is large enough
    // that knowing the length provides no practical advantage.
    if (
      candidate.length > 0 &&
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf)
    ) {
      // id: null — service callers have no user row; createdById is nullable in the schema.
      return { id: null, role: "admin" };
    }
  }

  res.status(401).json({ message: "Auth required" });
  return null;
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerAgentTaskRoutes(app: Express) {
  // -------- Create a new worker task ---------
  app.post("/api/agent-tasks", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", issues: parsed.error.issues });
    }

    const task = await storage.createAgentTask({
      ...parsed.data,
      status: "queued",
      createdById: u.id ?? undefined, // null for service-token callers; storage maps undefined → NULL
    });
    res.status(201).json({ task });
  });

  // -------- List tasks ---------
  app.get("/api/agent-tasks", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const agentType = typeof req.query.agentType === "string" ? req.query.agentType : undefined;
    const rawLimit = parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

    const tasks = await storage.listAgentTasks({ status, agentType, limit });
    res.json({ tasks });
  });

  // -------- Get one task + result ---------
  app.get("/api/agent-tasks/:id", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const data = await storage.getAgentTaskWithResult(req.params.id);
    if (!data) return res.status(404).json({ message: "Task not found" });
    res.json(data);
  });

  // -------- Claim a queued task (bridge runner calls this before executing) ---------
  // Atomically transitions status: queued → running.
  // Returns 409 CLAIM_RACE if the task is no longer queued.
  app.post("/api/agent-tasks/:id/claim", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const task = await storage.claimAgentTask(req.params.id);
    if (!task) {
      return res.status(409).json({
        message: "Task not claimable — not queued or already taken",
        code: "CLAIM_RACE",
      });
    }
    res.json({ task });
  });

  // -------- Trigger execution (admin fires this to run a queued task) ---------
  // Returns 202 immediately. The bridge runs Claude in the background and writes
  // its own result via the storage layer when done. Poll GET /api/agent-tasks/:id
  // to see when status transitions to pending_review.
  app.post("/api/agent-tasks/:id/run", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const task = await storage.getAgentTask(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.status !== "queued") {
      return res.status(400).json({
        message: `Task is not queued (current status: ${task.status})`,
        code: "NOT_QUEUED",
      });
    }

    // Check no other task is already running.
    const running = await storage.listAgentTasks({ status: "running", limit: 1 });
    if (running.length > 0) {
      return res.status(409).json({
        message: "Another task is already running. Wait for it to finish before triggering a new one.",
        code: "BRIDGE_BUSY",
        runningTaskId: running[0].id,
      });
    }

    // Acknowledge immediately — Claude can run for minutes.
    res.status(202).json({
      message: "Task execution started",
      taskId: task.id,
    });

    // Fire and forget — executeTask handles claim, run, and result storage.
    executeTask(task.id).catch((err) => {
      console.error(`[agent-tasks] background executeTask error for ${task.id}:`, err);
    });
  });

  // -------- Store result (bridge runner calls this after Claude finishes) ---------
  // Task must be in running state. Writes the result row and transitions
  // the task to pending_review. Exit code and failure detail live in the result row.
  app.post("/api/agent-tasks/:id/result", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const task = await storage.getAgentTask(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.status !== "running") {
      return res.status(400).json({
        message: "Task must be running to store a result",
        code: "NOT_RUNNING",
      });
    }

    const parsed = resultSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid result data", issues: parsed.error.issues });
    }

    // createAgentTaskResult transitions the task running→pending_review and
    // stamps finishedAt in one step. No separate finishAgentTask call needed.
    const result = await storage.createAgentTaskResult({
      taskId: req.params.id,
      summary: parsed.data.summary,
      rawOutput: parsed.data.rawOutput,
      exitCode: parsed.data.exitCode,
      changedFilesJson: parsed.data.changedFilesJson,
      risksJson: parsed.data.risksJson,
      verificationNeededJson: parsed.data.verificationNeededJson,
      structuredOutputJson: parsed.data.structuredOutputJson,
      reviewStatus: "pending_review",
    });
    res.status(201).json({ result });
  });

  // -------- Set review status (admin approves or rejects) ---------
  // Only valid when task is in pending_review state.
  app.post("/api/agent-tasks/:id/review", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "reviewStatus required: approved | needs_rework",
        issues: parsed.error.issues,
      });
    }

    const data = await storage.getAgentTaskWithResult(req.params.id);
    if (!data) return res.status(404).json({ message: "Task not found" });
    if (!data.result) {
      return res.status(400).json({ message: "No result stored yet", code: "NO_RESULT" });
    }
    if (data.task.status !== "pending_review") {
      return res.status(400).json({
        message: "Task is not in pending_review state",
        code: "NOT_PENDING_REVIEW",
      });
    }

    const result = await storage.setResultReviewStatus(
      req.params.id,
      parsed.data.reviewStatus,
      parsed.data.reviewNotes,
    );
    res.json({ result });
  });

  // -------- Reset a stuck or rejected task back to queued ---------
  // Allowed source states: running | failed | needs_rework.
  //   running      — task was mid-execution when the server crashed, timed out without a result,
  //                  or bridgeBusy guard rejected it before execution started.
  //   failed       — finishAgentTask wrote failed but createAgentTaskResult then threw,
  //                  leaving the task in the phantom failed state with no result row.
  //   needs_rework — operator reviewed the result and wants the task re-executed.
  //
  // What reset does:
  //   status → queued, started_at → NULL, finished_at → NULL.
  //   Existing result rows are NOT deleted — they remain as audit history.
  //   When the task next runs, a new result row is inserted; GET /api/agent-tasks/:id
  //   returns the newest result (ORDER BY created_at DESC LIMIT 1).
  //
  // What reset does NOT allow:
  //   queued        — already queued; reset would be a no-op (return 400).
  //   pending_review — has a result awaiting review; call /review first.
  //   approved      — terminal; creating a new task is the correct path.
  app.post("/api/agent-tasks/:id/reset", async (req, res) => {
    const u = ensureAgentTaskAuth(req, res);
    if (!u) return;

    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid reset data", issues: parsed.error.issues });
    }

    const task = await storage.getAgentTask(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!(RESETTABLE_STATUSES as readonly string[]).includes(task.status)) {
      return res.status(400).json({
        message: `Task cannot be reset from status '${task.status}'. Allowed: ${RESETTABLE_STATUSES.join(", ")}.`,
        code: "NOT_RESETTABLE",
        currentStatus: task.status,
      });
    }

    const reset = await storage.resetAgentTask(req.params.id);
    if (!reset) {
      return res.status(409).json({
        message: "Reset failed — task status changed between read and update (race condition).",
        code: "RESET_RACE",
      });
    }

    console.log(
      `[agent-tasks] task ${req.params.id} reset to queued by ${u.id}` +
        (parsed.data.reason ? ` — reason: ${parsed.data.reason}` : ""),
    );
    res.json({ task: reset });
  });
}
