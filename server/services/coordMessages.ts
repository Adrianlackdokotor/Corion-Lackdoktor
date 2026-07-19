// Coordination message writer — shared by comms route and Telegram bridge.
//
// Wraps insert into coordination_messages so any server-side caller can write
// to the team coordination thread without importing route files.

import { db } from "../../db/index";
import { coordinationMessages } from "@shared/schema";

export type CoordIntent = "note" | "status" | "question" | "direction" | "task_result" | "decision";

export interface CoordMessageInput {
  channel?:        string;
  authorSlug:      string;
  authorRole:      "human" | "orchestrator" | "worker" | "agent";
  body:            string;
  relatedOrderId?: string | null;
  relatedTaskId?:  string | null;
  telegramChatId?: string | null;
  telegramMsgId?:  number | null;
  intent?:         CoordIntent | null;
}

export async function writeCoordMessage(msg: CoordMessageInput): Promise<void> {
  try {
    await db.insert(coordinationMessages).values({
      channel:        msg.channel ?? "general",
      authorSlug:     msg.authorSlug,
      authorRole:     msg.authorRole,
      body:           msg.body,
      relatedOrderId: msg.relatedOrderId ?? null,
      relatedTaskId:  msg.relatedTaskId  ?? null,
      telegramChatId: msg.telegramChatId ?? null,
      telegramMsgId:  msg.telegramMsgId  ?? null,
      intent:         msg.intent         ?? null,
    });
  } catch (err: any) {
    // Fail-soft — never block calling code
    console.warn(`[coordMessages] write failed: ${err?.message}`);
  }
}
