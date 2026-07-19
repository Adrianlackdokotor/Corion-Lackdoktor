// REST API for the AI Agent Task Board.
// Auth model:
//   - Admin sees and acts on every task.
//   - Regular users see tasks they created OR that are assigned to them.
//   - Auto-claim is performed server-side at create-time when eligible.

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import {
  classifyTask,
  derivePriority,
  AGENT_ROLES,
  AGENT_LABELS,
  HITL_THRESHOLD_CENTS,
  type AgentRole,
  type TaskSourceType,
} from "../services/taskBoardEngine";

const COLUMNS = ["todo", "in_progress", "review", "done", "failed"] as const;
const SOURCE_TYPES = [
  "auftrag",
  "invoice",
  "upload",
  "lead_stale",
  "marketing_request",
  "photo_qc",
  "manual",
] as const;

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  sourceType: z.enum(SOURCE_TYPES).default("manual"),
  sourceId: z.string().uuid().optional(),
  impactValueCents: z.number().int().min(0).max(1_000_000_000).default(0),
  payload: z.record(z.unknown()).default({}),
  clientFacing: z.boolean().default(false),
  contractChange: z.boolean().default(false),
  forcedAgent: z.enum(AGENT_ROLES as unknown as [AgentRole, ...AgentRole[]]).optional(),
});

const completeSchema = z.object({
  result: z.record(z.unknown()).default({}),
  // Server-side agent identification for non-human callers (CORA bridge).
  // Falls back to current user if absent.
  asAgent: z.enum(AGENT_ROLES as unknown as [AgentRole, ...AgentRole[]]).optional(),
});

const claimSchema = z.object({
  agent: z.enum(AGENT_ROLES as unknown as [AgentRole, ...AgentRole[]]),
});

const rejectSchema = z.object({
  reason: z.string().min(1).max(1000),
});

const moveSchema = z.object({
  column: z.enum(COLUMNS),
});

function ensureAuth(req: Request, res: Response): { id: string; role?: string } | null {
  // express-session + passport mount the user under req.user.
  const u = (req as any).user;
  if (!u || !u.id) {
    res.status(401).json({ message: "Auth required" });
    return null;
  }
  return u;
}

function isAdmin(u: { role?: string } | null): boolean {
  return !!u && u.role === "admin";
}

export function registerTaskBoardRoutes(app: Express) {
  // -------- Catalog: agent roles and HITL threshold ---------
  app.get("/api/tasks/catalog", (_req, res) => {
    res.json({
      agents: AGENT_ROLES.map((r) => ({ role: r, label: AGENT_LABELS[r] })),
      columns: COLUMNS,
      sourceTypes: SOURCE_TYPES,
      hitlThresholdCents: HITL_THRESHOLD_CENTS,
    });
  });

  // -------- List tasks ---------
  app.get("/api/tasks", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    const column = typeof req.query.column === "string" ? req.query.column : undefined;
    const agent = typeof req.query.agent === "string" ? req.query.agent : undefined;
    const source = typeof req.query.sourceType === "string" ? req.query.sourceType : undefined;

    const filters: any = {};
    if (column && (COLUMNS as readonly string[]).includes(column)) filters.column = column;
    if (agent && (AGENT_ROLES as readonly string[]).includes(agent)) filters.assignedAgent = agent;
    if (source && (SOURCE_TYPES as readonly string[]).includes(source)) filters.sourceType = source;

    let tasks = await storage.listTaskBoardTasks(filters);
    if (!isAdmin(u)) {
      tasks = tasks.filter(
        (t) => t.createdById === u.id || t.assignedUserId === u.id,
      );
    }
    res.json({ tasks });
  });

  // -------- Get single task with audit ---------
  app.get("/api/tasks/:id", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    const t = await storage.getTaskBoardTask(req.params.id);
    if (!t) return res.status(404).json({ message: "Task nicht gefunden" });
    if (!isAdmin(u) && t.createdById !== u.id && t.assignedUserId !== u.id) {
      return res.status(403).json({ message: "Nicht berechtigt" });
    }
    const actions = await storage.listAgentActions(t.id);
    res.json({ task: t, actions });
  });

  // -------- Create task (manual) ---------
  app.post("/api/tasks", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Daten", issues: parsed.error.issues });
    }
    const { title, description, sourceType, sourceId, impactValueCents, payload, clientFacing, contractChange, forcedAgent } = parsed.data;
    const decision = classifyTask({
      sourceType: sourceType as TaskSourceType,
      impactValueCents,
      clientFacing,
      contractChange,
      forcedAgent: forcedAgent as AgentRole | undefined,
    });
    const priority = derivePriority({ sourceType: sourceType as TaskSourceType, impactValueCents, clientFacing, contractChange });
    const task = await storage.createTaskBoardTask({
      title,
      description: description ?? null,
      column: "todo",
      assignedAgent: decision.assignedAgent,
      assignedUserId: null,
      createdById: u.id,
      sourceType,
      sourceId: sourceId ?? null,
      priority,
      impactValueCents,
      payload,
      result: {},
      requiresReview: decision.requiresReview,
      autoClaimEligible: decision.autoClaimEligible,
    } as any);

    await storage.recordAgentAction({
      taskId: task.id,
      actor: "human",
      actorUserId: u.id,
      action: "auto_create",
      input: { sourceType, impactValueCents, clientFacing, contractChange },
      output: { decision },
      success: true,
      message: decision.reason.join(", "),
    } as any);

    // If eligible, auto-claim immediately for the routed agent.
    let final = task;
    if (decision.autoClaimEligible && decision.assignedAgent) {
      const claimed = await storage.claimTaskBoardTask(task.id, decision.assignedAgent, null);
      if (claimed) {
        final = claimed;
        await storage.recordAgentAction({
          taskId: task.id,
          actor: decision.assignedAgent,
          action: "claim",
          input: {},
          output: { autoClaim: true },
          success: true,
          message: "auto-claim on create",
        } as any);
      }
    }
    res.status(201).json({ task: final, decision });
  });

  // -------- Manual claim (admin or eligible user) ---------
  app.post("/api/tasks/:id/claim", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "agent erforderlich" });
    const t = await storage.getTaskBoardTask(req.params.id);
    if (!t) return res.status(404).json({ message: "Task nicht gefunden" });
    // Internal agent board: only admins may drive the lifecycle. The
    // creator of the source artifact (e.g. a customer who placed an order)
    // must NOT be able to claim the corresponding internal triage task.
    if (!isAdmin(u)) {
      return res.status(403).json({ message: "Nur Admin darf zuweisen" });
    }
    const claimed = await storage.claimTaskBoardTask(t.id, parsed.data.agent, u.id);
    if (!claimed) return res.status(409).json({ message: "Bereits zugewiesen oder nicht in todo", code: "CLAIM_RACE" });
    await storage.recordAgentAction({
      taskId: t.id,
      actor: parsed.data.agent,
      actorUserId: u.id,
      action: "claim",
      input: { manual: true },
      output: {},
      success: true,
    } as any);
    res.json({ task: claimed });
  });

  // -------- Complete (agent or human acting as agent) ---------
  app.post("/api/tasks/:id/complete", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültiger Body" });
    const t = await storage.getTaskBoardTask(req.params.id);
    if (!t) return res.status(404).json({ message: "Task nicht gefunden" });
    if (t.column !== "in_progress") {
      return res.status(400).json({ message: "Task nicht in Bearbeitung", code: "NOT_IN_PROGRESS" });
    }
    // Internal agent board: only admins (or the explicitly assigned operator)
    // may complete a task. Auto-claimed agent tasks have no assignedUserId,
    // so they can only be completed by an admin (or by the server-side
    // agent runner, which always acts with admin context).
    if (!isAdmin(u) && (!t.assignedUserId || t.assignedUserId !== u.id)) {
      return res.status(403).json({ message: "Nur zugewiesener User/Admin darf abschließen" });
    }
    const done = await storage.completeTaskBoardTask(t.id, parsed.data.result);
    if (!done) return res.status(409).json({ message: "Race condition", code: "COMPLETE_RACE" });
    await storage.recordAgentAction({
      taskId: t.id,
      actor: parsed.data.asAgent ?? t.assignedAgent ?? "human",
      actorUserId: u.id,
      action: "complete",
      input: parsed.data.result,
      output: { newColumn: done.column },
      success: true,
      message: done.column === "review" ? "moved to review (HITL)" : "auto-done",
    } as any);
    res.json({ task: done });
  });

  // -------- Approve (HITL) ---------
  app.post("/api/tasks/:id/approve", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    if (!isAdmin(u)) return res.status(403).json({ message: "Nur Admin darf freigeben" });
    const t = await storage.approveTaskBoardTask(req.params.id, u.id);
    if (!t) return res.status(409).json({ message: "Nicht in review", code: "APPROVE_RACE" });
    await storage.recordAgentAction({
      taskId: t.id,
      actor: "human",
      actorUserId: u.id,
      action: "approve",
      input: {},
      output: {},
      success: true,
    } as any);
    res.json({ task: t });
  });

  // -------- Reject (HITL) -> back to todo ---------
  app.post("/api/tasks/:id/reject", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    if (!isAdmin(u)) return res.status(403).json({ message: "Nur Admin darf ablehnen" });
    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Begründung erforderlich" });
    const t = await storage.rejectTaskBoardTask(req.params.id, u.id, parsed.data.reason);
    if (!t) return res.status(409).json({ message: "Nicht in review", code: "REJECT_RACE" });
    await storage.recordAgentAction({
      taskId: t.id,
      actor: "human",
      actorUserId: u.id,
      action: "reject",
      input: { reason: parsed.data.reason },
      output: {},
      success: true,
      message: parsed.data.reason,
    } as any);
    res.json({ task: t });
  });

  // -------- Drag-drop column move (admin only safety net) ---------
  app.patch("/api/tasks/:id/column", async (req, res) => {
    const u = ensureAuth(req, res);
    if (!u) return;
    if (!isAdmin(u)) return res.status(403).json({ message: "Nur Admin darf Spalten ändern" });
    const parsed = moveSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Spalte" });
    const existing = await storage.getTaskBoardTask(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task nicht gefunden" });
    // HITL guard: HITL-flagged tasks cannot be moved to `done` via drag-drop;
    // they must go through review → approve. This protects audit integrity.
    if (parsed.data.column === "done" && existing.requiresReview && !existing.approvedAt) {
      return res.status(409).json({
        message: "Task benötigt HITL-Freigabe — nutze Review → Freigeben statt direkt nach Done.",
        code: "HITL_REQUIRED",
      });
    }
    const t = await storage.updateTaskBoardColumn(req.params.id, parsed.data.column);
    if (!t) return res.status(404).json({ message: "Task nicht gefunden" });
    await storage.recordAgentAction({
      taskId: t.id,
      actor: "human",
      actorUserId: u.id,
      action: "reassign",
      input: { column: parsed.data.column },
      output: {},
      success: true,
    } as any);
    res.json({ task: t });
  });
}
