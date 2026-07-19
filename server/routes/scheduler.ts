// Smart Scheduler routes — capacity overview + AI analysis.
import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { analyzeWindow, emitSuggestionTasks } from "../services/schedulerAgent";

async function isAdmin(req: Request): Promise<boolean> {
  const u = (req as any).user;
  const id = u?.id ?? u?.claims?.sub ?? null;
  if (!id) return false;
  const full = await storage.getUser(id);
  return full?.role === "admin";
}

function parseRange(req: Request): { from: Date; to: Date } {
  const now = new Date();
  const src = (k: string) =>
    (typeof req.query[k] === "string" && req.query[k]) ||
    (typeof req.body?.[k] === "string" && req.body[k]) || null;
  const fromStr = src("from") as string | null;
  const toStr = src("to") as string | null;
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toStr
    ? new Date(toStr)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { from, to };
}

export function registerSchedulerRoutes(app: Express) {
  // Admin-only resource list for the calendar UI.
  app.get("/api/scheduler/resources", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    try { res.json(await storage.getAllResources()); }
    catch (err: any) { res.status(500).json({ message: err?.message }); }
  });
  // Admin-only appointments for a window.
  app.get("/api/scheduler/appointments", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    try {
      const { from, to } = parseRange(req);
      res.json(await storage.getAppointmentsInRange(from, to));
    } catch (err: any) { res.status(500).json({ message: err?.message }); }
  });

  // Capacity matrix per resource × day for the requested window.
  app.get("/api/scheduler/capacity", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    try {
      const { from, to } = parseRange(req);
      const result = await analyzeWindow(from, to);
      res.json({
        from: from.toISOString(),
        to: to.toISOString(),
        loads: result.loads,
        gaps: result.gaps,
        overloads: result.overloads,
      });
    } catch (err: any) {
      console.error("[scheduler] capacity error", err);
      res.status(500).json({ message: "Failed to compute capacity", error: err?.message });
    }
  });

  // Run the Scheduler AI: returns suggestions and (optionally) emits them
  // as tasks on the AI Task Board.
  app.post("/api/scheduler/analyze", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    try {
      const { from, to } = parseRange(req);
      const persist = req.body?.persist === true;
      const result = await analyzeWindow(from, to);
      let tasksCreated = 0;
      if (persist) {
        const userId = (req as any).user?.id ?? null;
        tasksCreated = await emitSuggestionTasks(result.suggestions, userId);
      }
      res.json({
        from: from.toISOString(),
        to: to.toISOString(),
        suggestions: result.suggestions,
        overloads: result.overloads,
        gaps: result.gaps,
        loads: result.loads,
        tasksCreated,
      });
    } catch (err: any) {
      console.error("[scheduler] analyze error", err);
      res.status(500).json({ message: "Failed to analyze schedule", error: err?.message });
    }
  });
}
