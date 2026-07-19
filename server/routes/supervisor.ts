// Supervisor delegation surface.
//
// Allows a trusted non-browser caller (e.g. Cora) to delegate a task to the
// Claude worker and get back a structured outcome, without human relay for
// auto-approvable task types.
//
// Control flow:
//   POST /api/supervisor/delegate
//     → dispatches task (creates + triggers run)
//     → returns 202 immediately with delegationId (= taskId)
//     → runs poll → evaluate → act in background
//     → stores LoopResult in memory (1 h TTL)
//
//   GET /api/supervisor/delegate/:id
//     → returns LoopResult if the loop finished
//     → returns { status: "running" } if still in progress
//
// Auth: same AGENT_TASK_SERVICE_TOKEN bearer path as /api/agent-tasks/*.
//       Session-cookie admins also accepted so the admin UI can call this.
//
// In-memory result cache: survives for 1 h after loop completion.
//   Not persisted across server restarts — the underlying agent_task row
//   in the DB is the durable record. The cache is only needed to surface
//   the decision.reasons and outcome label to the poller.

import { timingSafeEqual } from "crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { dispatch } from "../services/supervisorDispatch";
import { evaluateDispatchedTask } from "../services/supervisorLoop";
import type { LoopResult } from "../services/supervisorLoop";

// ── Auth ──────────────────────────────────────────────────────────────────────
//
// Mirrors the auth logic in agent-tasks.ts. Scoped to this file only.
// Returns true and sets nothing on success; writes a 401/503 response and
// returns false on failure.

function ensureSupervisorAuth(req: Request, res: Response): boolean {
  // Path 1: existing admin session
  const sessionUser = (req as any).user;
  if (sessionUser?.role === "admin") return true;

  // Path 2: bearer token
  const expected = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (!expected) {
    res.status(503).json({ message: "Supervisor endpoint not configured — AGENT_TASK_SERVICE_TOKEN not set" });
    return false;
  }

  const authHeader = req.headers.authorization ?? "";
  const candidate = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(expected);

  if (
    candidate.length > 0 &&
    candidateBuf.length === expectedBuf.length &&
    timingSafeEqual(candidateBuf, expectedBuf)
  ) {
    return true;
  }

  res.status(401).json({ message: "Auth required" });
  return false;
}

// ── In-memory result cache ────────────────────────────────────────────────────

const RESULT_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedDelegation {
  status: "running" | "complete";
  result?: LoopResult;
  expiresAt: number;
}

const delegations = new Map<string, CachedDelegation>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [id, entry] of Array.from(delegations.entries())) {
    if (entry.expiresAt <= now) delegations.delete(id);
  }
}

// ── Schema ────────────────────────────────────────────────────────────────────

const delegateSchema = z.object({
  title: z.string().min(1).max(300),
  taskType: z.enum(["coding", "docs", "analysis", "cleanup"]).default("docs"),
  taskPrompt: z.string().min(10).max(8000),
  workingDirectory: z.string().default("."),
  contextRefs: z.array(z.string()).default([]),
  reviewNotes: z.string().max(500).optional(),
  // Hard cap: 600 s (10 min). Actual Claude runs are typically 30–120 s.
  timeoutSeconds: z.number().int().min(30).max(600).default(300),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export function registerSupervisorRoutes(app: Express): void {

  // ── Delegate a task ──────────────────────────────────────────────────────────
  //
  // 1. Dispatches the task (create + triggerRun) — fast, completes in <1 s.
  // 2. Returns 202 with delegationId (= taskId) so caller can start polling.
  // 3. Fires the poll → evaluate → act loop in the background.
  // 4. When the loop finishes, stores the LoopResult in the cache.
  //
  // Caller should poll GET /api/supervisor/delegate/:id every 5–10 s.
  // For needs_human outcomes, the underlying task stays in pending_review —
  // the operator reviews it via /admin/agent-tasks or the review API.

  app.post("/api/supervisor/delegate", async (req: Request, res: Response) => {
    if (!ensureSupervisorAuth(req, res)) return;

    const parsed = delegateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request", issues: parsed.error.issues });
    }

    const { timeoutSeconds, reviewNotes, ...taskParams } = parsed.data;

    // Step 1: dispatch synchronously to get the taskId for the 202 response.
    let taskId: string;
    try {
      taskId = await dispatch(taskParams);
    } catch (err) {
      return res.status(502).json({
        message: "Dispatch failed — could not create or trigger the task",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Register the delegation as running before acknowledging, so the GET
    // endpoint can respond immediately if polled before the loop completes.
    delegations.set(taskId, {
      status: "running",
      expiresAt: Date.now() + RESULT_TTL_MS,
    });

    // Step 2: acknowledge — caller can start polling now.
    res.status(202).json({
      delegationId: taskId,
      taskId,
      message: "Delegation started — poll GET /api/supervisor/delegate/:id for outcome",
    });

    // Step 3: run the loop in the background (poll → evaluate → act).
    // res has already been sent; errors here are logged only.
    evaluateDispatchedTask(taskId, {
      timeoutMs: timeoutSeconds * 1000,
      reviewNotes: reviewNotes ?? "Automated — supervisor delegate",
    })
      .then((loopResult) => {
        delegations.set(taskId, {
          status: "complete",
          result: loopResult,
          expiresAt: Date.now() + RESULT_TTL_MS,
        });
      })
      .catch((err) => {
        console.error(`[supervisor] background loop error for delegation ${taskId}:`, err);
        delegations.set(taskId, {
          status: "complete",
          result: {
            outcome: "needs_human",
            taskId,
            elapsedMs: 0,
            decision: {
              verdict: "needs_human",
              reasons: [`Background loop threw: ${err instanceof Error ? err.message : String(err)}`],
            },
          },
          expiresAt: Date.now() + RESULT_TTL_MS,
        });
      });
  });

  // ── Poll delegation status ───────────────────────────────────────────────────
  //
  // Returns { status: "running" } until the loop completes, then the full
  // LoopResult. Caller should stop polling when status === "complete".
  //
  // Outcomes the caller must handle:
  //   approved         — task auto-approved; no human action needed
  //   rework_requested — task auto-reworked; monitor or re-delegate
  //   needs_human      — task in pending_review; surface to operator
  //   timed_out        — task still running; check agent-tasks UI
  //   dispatch_failed  — task was never created (rare); retry if needed

  app.get("/api/supervisor/delegate/:id", (req: Request, res: Response) => {
    if (!ensureSupervisorAuth(req, res)) return;

    sweepExpired();

    const entry = delegations.get(req.params.id);
    if (!entry) {
      return res.status(404).json({
        message: "Delegation not found — it may have expired (1 h TTL) or never existed",
      });
    }

    if (entry.status === "running") {
      return res.json({ status: "running", delegationId: req.params.id });
    }

    res.json({ status: "complete", delegationId: req.params.id, ...entry.result });
  });
}
