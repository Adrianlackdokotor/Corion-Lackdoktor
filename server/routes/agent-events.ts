// Agent Activity Feed — read-only API for the admin feed page.
// Admin session or service bearer token required.
// All writes come from taskBus.ts — never from this route.

import { timingSafeEqual } from "crypto";
import type { Express, Request, Response } from "express";
import { storage } from "../storage";

function ensureAdmin(req: Request, res: Response): boolean {
  const user = (req as any).user;
  if (user?.role === "admin") return true;

  const expected = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (expected) {
    const authHeader = req.headers.authorization ?? "";
    const candidate = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const cBuf = Buffer.from(candidate);
    const eBuf = Buffer.from(expected);
    if (candidate.length > 0 && cBuf.length === eBuf.length && timingSafeEqual(cBuf, eBuf)) {
      return true;
    }
  }

  res.status(401).json({ message: "Admin access required" });
  return false;
}

export function registerAgentEventRoutes(app: Express): void {

  // ── GET /api/agent-events ─────────────────────────────────────────────────
  // Query params: agentSlug, status, busTaskType, limit (default 50), offset
  app.get("/api/agent-events", async (req: Request, res: Response) => {
    if (!ensureAdmin(req, res)) return;

    const agentSlug   = typeof req.query.agentSlug   === "string" ? req.query.agentSlug   : undefined;
    const status      = typeof req.query.status      === "string" ? req.query.status      : undefined;
    const busTaskType = typeof req.query.busTaskType === "string" ? req.query.busTaskType : undefined;
    const limit       = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    const offset      = parseInt(String(req.query.offset ?? "0"), 10) || 0;

    const events = await storage.listAgentEvents({ agentSlug, status, busTaskType, limit, offset });
    res.json({ events, count: events.length });
  });

  // ── GET /api/agent-events/:id ─────────────────────────────────────────────
  app.get("/api/agent-events/:id", async (req: Request, res: Response) => {
    if (!ensureAdmin(req, res)) return;

    const event = await storage.getAgentEvent(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ event });
  });
}
