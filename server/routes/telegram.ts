// POST /api/telegram/webhook — inbound update handler for CorionWorkerBot.
//
// Architecture:
//   Telegram sends updates here via webhook. We normalize each update into a
//   typed InboundMessage, log it to agent_events for Corion visibility, then
//   route worker commands into the existing task bus (submitTask).
//
// Role model (matches agent-constitution-and-iam.md):
//   Cora   = orchestrator (external; sends /intake, /task etc.)
//   Claude = bounded worker (receives delegate bus tasks via supervisor)
//   This route = thin normalization + routing layer; never orchestrates
//
// Routing:
//   /claude <prompt>  → delegate bus task → Claude worker via supervisor/delegate
//   /task <prompt>    → same as /claude
//   /intake <json>    → intake bus task → executeIntake workflow
//   /start, /help     → help reply only
//   other operational free text / captions / media
//                     → logged to agent_events and routed into the persistent
//                       Telegram worker session via runInSession(...)
//
// Media (photos, documents): normalized and logged; file_ids stored so the
// worker session can use them through the existing operational workflow.
// This route itself still does not download media directly.
//
// Security:
//   TELEGRAM_WEBHOOK_SECRET  — must match X-Telegram-Bot-Api-Secret-Token header
//                              if unset, all POST callers accepted (dev only)
//   TELEGRAM_ALLOWED_CHAT_IDS — comma-separated integers; if unset, all chats
//                               accepted (dev only) — set this in production
//
// ENV vars required:
//   TELEGRAM_BOT_TOKEN         — from BotFather; used for outbound replies
// ENV vars optional but strongly recommended in production:
//   TELEGRAM_WEBHOOK_SECRET    — random string registered with Telegram
//   TELEGRAM_ALLOWED_CHAT_IDS  — e.g. "123456789" (Adrian's chat ID)
//
// Webhook registration (run once after deploy):
//   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//        -H "Content-Type: application/json" \
//        -d '{"url":"https://yourserver.com/api/telegram/webhook",
//             "secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
//
// Polling fallback (local dev without public URL):
//   Run scripts/telegram-poll-bridge.mjs — calls this same route locally.

import { timingSafeEqual, randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { submitTask } from "../services/taskBus";
import { runInSession, resetSession, getSessionInfo } from "../services/claudeSessionBridge";
import { writeCoordMessage } from "../services/coordMessages";

// ── Constants ─────────────────────────────────────────────────────────────────

const AGENT_SLUG = "telegram_worker_bot";
const MAX_PROMPT_CHARS = 4000; // leave room for worker bootstrap context
const TASK_TIMEOUT_SECONDS = 300;

// ── Security ──────────────────────────────────────────────────────────────────

function verifyWebhookSecret(req: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret?.trim()) return process.env.NODE_ENV !== "production";

  const header = req.headers["x-telegram-bot-api-secret-token"];
  if (typeof header !== "string" || !header) return false;

  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAllowedChat(chatId: number): boolean {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS;
  if (!raw?.trim()) return process.env.NODE_ENV !== "production";

  const allowed = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  return allowed.includes(chatId);
}

// ── Normalization ─────────────────────────────────────────────────────────────

interface InboundMessage {
  updateId: number;
  messageId: number;
  chatId: number;
  fromUserId?: number;
  fromUsername?: string;
  text?: string;
  caption?: string;
  messageType: "text" | "photo" | "document" | "voice" | "video" | "other";
  hasMedia: boolean;
  mediaFileIds: string[]; // for future drive_upload slice
  date: string; // ISO
}

function normalizeUpdate(update: any): InboundMessage | null {
  const msg = update?.message ?? update?.channel_post ?? null;
  if (!msg?.message_id || !msg?.chat?.id) return null;

  const mediaFileIds: string[] = [];
  let messageType: InboundMessage["messageType"] = "other";

  if (msg.text) {
    messageType = "text";
  } else if (Array.isArray(msg.photo)) {
    messageType = "photo";
    // Telegram sends multiple sizes; last entry is the largest
    const largest = msg.photo[msg.photo.length - 1];
    if (largest?.file_id) mediaFileIds.push(largest.file_id);
  } else if (msg.document?.file_id) {
    messageType = "document";
    mediaFileIds.push(msg.document.file_id);
  } else if (msg.voice?.file_id) {
    messageType = "voice";
    mediaFileIds.push(msg.voice.file_id);
  } else if (msg.video?.file_id) {
    messageType = "video";
    mediaFileIds.push(msg.video.file_id);
  }

  return {
    updateId: update.update_id,
    messageId: msg.message_id,
    chatId: msg.chat.id,
    fromUserId: msg.from?.id,
    fromUsername: msg.from?.username,
    text: msg.text,
    caption: msg.caption,
    messageType,
    hasMedia: mediaFileIds.length > 0,
    mediaFileIds,
    date: new Date((msg.date ?? 0) * 1000).toISOString(),
  };
}

// ── Outbound reply ────────────────────────────────────────────────────────────

async function sendReply(chatId: number, text: string, botTokenOverride?: string | null): Promise<void> {
  const token = botTokenOverride?.trim() || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] sendReply: TELEGRAM_BOT_TOKEN not set — reply not sent");
    return;
  }

  console.log(`[telegram] sendReply → chat ${chatId}: ${text.slice(0, 60)}`);

  // Attempt 1: with HTML parse_mode
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    if (res.ok) {
      console.log(`[telegram] sendReply ✓ chat ${chatId}`);
      return;
    }

    const errBody = await res.text().catch(() => "(unreadable)");
    console.warn(`[telegram] sendReply HTML failed (${res.status}): ${errBody}`);
  } catch (err: any) {
    console.warn(`[telegram] sendReply network error: ${err?.message}`);
  }

  // Attempt 2: plain text fallback (strips HTML tags)
  const plain = text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: plain }),
    });

    if (res.ok) {
      console.log(`[telegram] sendReply ✓ (plain fallback) chat ${chatId}`);
      return;
    }

    const errBody = await res.text().catch(() => "(unreadable)");
    console.error(`[telegram] sendReply plain also failed (${res.status}): ${errBody}`);
  } catch (err: any) {
    console.error(`[telegram] sendReply plain network error: ${err?.message}`);
  }
}

// ── Inbound logging ───────────────────────────────────────────────────────────

async function logInbound(msg: InboundMessage, routedAs: string | null): Promise<void> {
  const raw = msg.text ?? msg.caption ?? "";
  const shortLabel = raw.slice(0, 80) || `${msg.messageType} from @${msg.fromUsername ?? msg.fromUserId ?? msg.chatId}`;

  await storage
    .insertAgentEvent({
      agentSlug: AGENT_SLUG,
      eventType: "telegram_inbound",
      busTaskId: null,
      busTaskType: routedAs,
      title: `Telegram: ${shortLabel}`,
      summary: routedAs ? `Routed as ${routedAs}` : "Logged only — no task created",
      payload: {
        updateId: msg.updateId,
        chatId: msg.chatId,
        fromUsername: msg.fromUsername ?? null,
        fromUserId: msg.fromUserId ?? null,
        text: raw || null,
        messageType: msg.messageType,
        hasMedia: msg.hasMedia,
        mediaFileIds: msg.mediaFileIds,
        date: msg.date,
      },
      relatedOrderId: null,
      relatedTaskId: null,
      status: "ok",
      visibility: "admin",
    })
    .catch((err: any) =>
      console.warn(`[telegram] logInbound agent_event failed: ${err?.message}`),
    );
}

// ── Command routing ───────────────────────────────────────────────────────────

const HELP_TEXT =
  "Bună! Sunt CorionWorkerBot.\n\n" +
  "Comenzile disponibile:\n" +
  "/claude <mesaj>  — mesaj pentru Claude (sesiune persistentă)\n" +
  "/task <mesaj>    — același lucru\n" +
  "/reset           — șterge sesiunea curentă și pornește una nouă\n" +
  "/status          — afișează info despre sesiunea activă\n" +
  "/intake <json>   — creează Auftrag nou\n\n" +
  "Exemplu: /claude Ce ordine active sunt azi?";

async function processUpdate(msg: InboundMessage, botTokenOverride?: string | null): Promise<void> {
  const raw = (msg.text ?? msg.caption ?? "").trim();
  const lower = raw.toLowerCase();

  console.log(`[telegram] processUpdate chat=${msg.chatId} type=${msg.messageType} text="${raw.slice(0, 60)}"`);

  // Determine route
  const isStartCmd  = lower === "/start";
  const isHelpCmd   = lower === "/help";
  const isClaudeCmd = lower.startsWith("/claude ") || lower.startsWith("/task ");
  const isIntakeCmd = lower.startsWith("/intake ");

  const routedAs = isClaudeCmd ? "delegate" : isIntakeCmd ? "intake" : null;

  // Always log to agent_events — visibility in /admin/agents
  await logInbound(msg, routedAs);

  // ── /start or /help ────────────────────────────────────────────────────────
  if (isStartCmd || isHelpCmd) {
    await sendReply(msg.chatId, HELP_TEXT, botTokenOverride);
    return;
  }

  const shouldTreatAsOperationalMessage =
    !!raw &&
    !lower.startsWith("/") &&
    (msg.messageType === "text" || msg.hasMedia);

  // ── /reset — delete current session ───────────────────────────────────────
  if (lower === "/reset") {
    resetSession(msg.chatId);
    await sendReply(msg.chatId, "Sesiune stearsa. Urmatorul /claude porneste o sesiune noua.", botTokenOverride);
    return;
  }

  // ── /status — show session info ────────────────────────────────────────────
  if (lower === "/status") {
    const info = getSessionInfo(msg.chatId);
    if (!info) {
      await sendReply(msg.chatId, "Nicio sesiune activa. Trimite /claude <mesaj> pentru a incepe.", botTokenOverride);
    } else {
      const age = Math.round((Date.now() - new Date(info.createdAt).getTime()) / 60000);
      await sendReply(
        msg.chatId,
        `Sesiune activa:\nID: ${info.sessionId.slice(0, 8)}...\nMesaje: ${info.messageCount}\nVarsta: ${age} minute\n\n/reset pentru a sterge`,
        botTokenOverride,
      );
    }
    return;
  }

  // ── /claude or /task → persistent Claude session ───────────────────────────
  if (isClaudeCmd) {
    const prefixLen = lower.startsWith("/claude ") ? "/claude ".length : "/task ".length;
    const prompt = raw.slice(prefixLen).trim().slice(0, MAX_PROMPT_CHARS);

    if (prompt.length < 3) {
      await sendReply(msg.chatId, "Scrie un mesaj dupa /claude", botTokenOverride);
      return;
    }

    const sessionInfo = getSessionInfo(msg.chatId);
    const isFirstMessage = !sessionInfo;

    console.log(`[telegram] runInSession chat=${msg.chatId} new=${isFirstMessage} prompt="${prompt.slice(0, 60)}"`);

    // Write inbound human message to coordination thread
    await writeCoordMessage({
      channel: "telegram",
      authorSlug: msg.fromUsername ?? `tg_${msg.chatId}`,
      authorRole: "human",
      body: prompt,
      telegramChatId: String(msg.chatId),
      telegramMsgId: msg.messageId,
    });

    const result = await runInSession(msg.chatId, prompt);

    console.log(`[telegram] session reply in ${result.elapsedMs}ms session=${result.sessionId?.slice(0, 8)}`);

    if (!result.response) {
      await sendReply(msg.chatId, "Claude nu a raspuns — incearca din nou.", botTokenOverride);
      return;
    }

    // Write Claude's reply to coordination thread
    await writeCoordMessage({
      channel: "telegram",
      authorSlug: "claude-worker",
      authorRole: "worker",
      body: result.response,
      telegramChatId: String(msg.chatId),
    });

    // Send the response. If it's very long, truncate with a note.
    const MAX_TG = 4000;
    const replyText = result.response.length > MAX_TG
      ? result.response.slice(0, MAX_TG) + "\n\n[raspuns trunchiat — continuare disponibila la /claude continua]"
      : result.response;

    await sendReply(msg.chatId, replyText, botTokenOverride);
    return;
  }

  // ── /intake → intake workflow ──────────────────────────────────────────────
  if (isIntakeCmd) {
    const jsonRaw = raw.slice("/intake ".length).trim();

    let data: unknown;
    try {
      data = JSON.parse(jsonRaw);
    } catch {
      await sendReply(msg.chatId, "JSON invalid dupa /intake — verifica formatul", botTokenOverride);
      return;
    }

    const taskId = randomUUID();

    submitTask({
      id: taskId,
      type: "intake",
      from: AGENT_SLUG,
      data: data as Record<string, unknown>,
    }).catch((err: any) =>
      console.error(`[telegram] intake task ${taskId} error: ${err?.message}`),
    );

    await sendReply(msg.chatId, "Intake trimis. Verifica /admin/agents pentru rezultat.", botTokenOverride);
    return;
  }

  // ── Natural-language operational worker mode ──────────────────────────────
  if (shouldTreatAsOperationalMessage) {
    const prompt = [
      raw,
      msg.hasMedia ? `\n[media_file_ids=${msg.mediaFileIds.join(",")}]` : "",
      `\n[message_type=${msg.messageType}]`,
    ].join("").trim().slice(0, MAX_PROMPT_CHARS);

    await writeCoordMessage({
      channel: "telegram",
      authorSlug: msg.fromUsername ?? `tg_${msg.chatId}`,
      authorRole: "human",
      body: prompt,
      telegramChatId: String(msg.chatId),
      telegramMsgId: msg.messageId,
    });

    const result = await runInSession(msg.chatId, prompt);

    if (!result.response) {
      await sendReply(msg.chatId, "Nu am putut procesa cererea operațională. Încearcă din nou.", botTokenOverride);
      return;
    }

    await writeCoordMessage({
      channel: "telegram",
      authorSlug: "claude-worker",
      authorRole: "worker",
      body: result.response,
      telegramChatId: String(msg.chatId),
    });

    const MAX_TG = 4000;
    const replyText = result.response.length > MAX_TG
      ? result.response.slice(0, MAX_TG) + "\n\n[raspuns trunchiat — continuare disponibila la /claude continua]"
      : result.response;

    await sendReply(msg.chatId, replyText, botTokenOverride);
    return;
  }

  // ── Media only (no text command) ───────────────────────────────────────────
  if (msg.hasMedia && !raw) {
    const prompt = `[media_only]\n[media_file_ids=${msg.mediaFileIds.join(",")}]\n[message_type=${msg.messageType}]`;

    const result = await runInSession(msg.chatId, prompt);
    const reply = result.response || `Media primit (${msg.mediaFileIds.length} fisier).`;
    await sendReply(msg.chatId, reply, botTokenOverride);
    return;
  }

  // ── Bare text or unrecognized /command ─────────────────────────────────────
  await sendReply(msg.chatId, HELP_TEXT, botTokenOverride);
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerTelegramRoutes(app: Express): void {
  // Log configuration state at startup so it's visible in the server console
  const botOk      = !!process.env.TELEGRAM_BOT_TOKEN;
  const secretOk   = !!process.env.TELEGRAM_WEBHOOK_SECRET;
  const chatsOk    = !!process.env.TELEGRAM_ALLOWED_CHAT_IDS;
  console.log(
    `[telegram] routes registered — bot:${botOk ? "✓" : "✗ MISSING"}` +
    ` secret:${secretOk ? "✓" : "open"}` +
    ` allowedChats:${chatsOk ? process.env.TELEGRAM_ALLOWED_CHAT_IDS : "open"}`,
  );

  // Webhook endpoint — Telegram calls this for every update.
  // Must always respond 200 quickly; processing is async.
  app.post("/api/telegram/webhook", (req: Request, res: Response) => {
    if (!verifyWebhookSecret(req)) {
      console.warn("[telegram] webhook 403 — secret mismatch");
      res.status(403).end();
      return;
    }

    // Acknowledge to Telegram immediately — they retry if we don't respond in time
    res.status(200).end();

    const update = req.body;
    if (!update?.update_id) return;

    const msg = normalizeUpdate(update);
    if (!msg) {
      console.warn(`[telegram] normalizeUpdate returned null for update ${update.update_id}`);
      return;
    }

    if (!isAllowedChat(msg.chatId)) {
      console.warn(`[telegram] rejected update from non-allowed chat ${msg.chatId} (update ${update.update_id})`);
      return;
    }

    const botTokenOverride = typeof req.headers["x-corion-telegram-bot-token"] === "string"
      ? req.headers["x-corion-telegram-bot-token"]
      : null;

    processUpdate(msg, botTokenOverride).catch((err: any) =>
      console.error(`[telegram] processUpdate error for update ${update.update_id}: ${err?.message}`),
    );
  });

  // Health check — used to verify the route is reachable before registering webhook
  app.get("/api/telegram/webhook", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      agent: AGENT_SLUG,
      botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
      secretConfigured: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      allowedChatsConfigured: !!process.env.TELEGRAM_ALLOWED_CHAT_IDS,
    });
  });
}
