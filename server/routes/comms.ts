// Team coordination thread API.
//
// GET  /api/comms/messages?channel=general&limit=100&before=<iso>
//   Returns messages for a channel, newest first (reversed for UI).
//   Auth: admin session or AGENT_TASK_SERVICE_TOKEN bearer.
//
// POST /api/comms/messages
//   Writes a message to a channel.
//   Auth: admin session (human) or service bearer (agents).
//   Body: { channel?, authorSlug, authorRole, body, relatedOrderId?, relatedTaskId? }
//
// The table is bootstrapped (CREATE TABLE IF NOT EXISTS) at registration time
// so no manual db:push is required on first run after restart.

import { timingSafeEqual } from "crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "../../db/index";
import { coordinationMessages } from "@shared/schema";
import { desc, eq, and, lt, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";

// ── Auth ──────────────────────────────────────────────────────────────────────

function ensureCommsAuth(req: Request, res: Response): { id: string | null; role: string } | null {
  const session = (req as any).user;
  if (session?.role === "admin") return { id: session.id, role: "admin" };

  const expected = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (expected) {
    const hdr = req.headers.authorization ?? "";
    const candidate = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
    const cBuf = Buffer.from(candidate);
    const eBuf = Buffer.from(expected);
    if (candidate.length > 0 && cBuf.length === eBuf.length && timingSafeEqual(cBuf, eBuf)) {
      return { id: null, role: "admin" };
    }
  }

  res.status(401).json({ message: "Auth required" });
  return null;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const postSchema = z.object({
  channel:        z.string().min(1).max(100).default("general"),
  authorSlug:     z.string().min(1).max(80),
  authorRole:     z.enum(["human", "orchestrator", "worker", "agent"]).default("agent"),
  body:           z.string().min(1).max(8000),
  relatedOrderId: z.string().nullish(),
  relatedTaskId:  z.string().nullish(),
  telegramChatId: z.string().nullish(),
  telegramMsgId:  z.number().int().nullish(),
  intent:         z.enum(["note", "status", "question", "direction", "task_result", "decision"]).nullish(),
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrapTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coordination_messages (
        id              varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        channel         text    NOT NULL DEFAULT 'general',
        author_slug     text    NOT NULL,
        author_role     text    NOT NULL DEFAULT 'agent',
        body            text    NOT NULL,
        related_order_id text,
        related_task_id  text,
        telegram_chat_id text,
        telegram_msg_id  integer,
        intent           text,
        created_at      timestamp NOT NULL DEFAULT now()
      )
    `);
    // Add intent column if table already existed without it
    await db.execute(sql`
      ALTER TABLE coordination_messages
        ADD COLUMN IF NOT EXISTS intent text
    `);
  } catch (err: any) {
    console.warn("[comms] table bootstrap warning:", err?.message);
  }
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerCommsRoutes(app: Express): void {
  // Ensure table exists — idempotent, runs once per server boot
  bootstrapTable().catch((err: any) =>
    console.error("[comms] bootstrapTable error:", err?.message),
  );

  // ── GET messages ────────────────────────────────────────────────────────────
  app.get("/api/comms/messages", async (req: Request, res: Response) => {
    const caller = ensureCommsAuth(req, res);
    if (!caller) return;

    const channel = typeof req.query.channel === "string" ? req.query.channel : "general";
    const limit   = Math.min(parseInt(String(req.query.limit  ?? "100"), 10) || 100, 500);
    const before  = typeof req.query.before === "string" ? req.query.before : null;

    try {
      const conditions = [eq(coordinationMessages.channel, channel)];
      if (before) {
        conditions.push(lt(coordinationMessages.createdAt, new Date(before)));
      }

      const rows = await db
        .select()
        .from(coordinationMessages)
        .where(and(...conditions))
        .orderBy(desc(coordinationMessages.createdAt))
        .limit(limit);

      // Return in chronological order (oldest first) for UI display
      res.json({ messages: rows.reverse(), channel });
    } catch (err: any) {
      console.error("[comms] GET messages error:", err?.message);
      res.status(500).json({ message: "DB error", error: err?.message });
    }
  });

  // ── POST message ────────────────────────────────────────────────────────────
  app.post("/api/comms/messages", async (req: Request, res: Response) => {
    const caller = ensureCommsAuth(req, res);
    if (!caller) return;

    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", issues: parsed.error.issues });
    }

    try {
      const [row] = await db
        .insert(coordinationMessages)
        .values({
          channel:         parsed.data.channel,
          authorSlug:      parsed.data.authorSlug,
          authorRole:      parsed.data.authorRole,
          body:            parsed.data.body,
          relatedOrderId:  parsed.data.relatedOrderId ?? null,
          relatedTaskId:   parsed.data.relatedTaskId  ?? null,
          telegramChatId:  parsed.data.telegramChatId ?? null,
          telegramMsgId:   parsed.data.telegramMsgId  ?? null,
          intent:          parsed.data.intent         ?? null,
        })
        .returning();

      res.status(201).json({ message: row });
    } catch (err: any) {
      console.error("[comms] POST message error:", err?.message);
      res.status(500).json({ message: "DB error", error: err?.message });
    }
  });

  // ── List channels (basic) ────────────────────────────────────────────────────
  app.get("/api/comms/channels", async (req: Request, res: Response) => {
    const caller = ensureCommsAuth(req, res);
    if (!caller) return;
    try {
      const rows = await db
        .selectDistinct({ channel: coordinationMessages.channel })
        .from(coordinationMessages)
        .orderBy(coordinationMessages.channel);
      res.json({ channels: rows.map((r) => r.channel) });
    } catch (err: any) {
      res.status(500).json({ message: "DB error", error: err?.message });
    }
  });

  // ── Latest message per channel (for sidebar previews) ────────────────────────
  // Returns one row per channel: the most recent message.
  // Used by the sidebar to show previews + enable cross-channel unread detection.
  app.get("/api/comms/latest", async (req: Request, res: Response) => {
    const caller = ensureCommsAuth(req, res);
    if (!caller) return;
    try {
      const rows = await db.execute(sql`
        SELECT DISTINCT ON (channel)
          id, channel, author_slug, author_role, body,
          related_order_id, related_task_id,
          telegram_chat_id, telegram_msg_id, intent, created_at
        FROM coordination_messages
        ORDER BY channel, created_at DESC
      `);
      res.json({ latest: rows.rows });
    } catch (err: any) {
      res.status(500).json({ message: "DB error", error: err?.message });
    }
  });
}
