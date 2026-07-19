// Persistent Claude session bridge for Telegram chat continuity.
//
// Each Telegram chatId maps to one named Claude session stored in
// ~/.claude/projects/<project-path>/<session-id>.jsonl on disk (Claude's
// native session persistence). The chatId→sessionId mapping is persisted in
// .local/state/telegram-sessions.json (gitignored, same pattern as state tokens).
//
// Flow:
//   First message from a chatId:
//     claude -p "<context + message>" --output-format stream-json
//     → response returned, session_id captured from JSON output, mapping saved
//
//   Subsequent messages from same chatId:
//     claude --resume <sessionId> -p "<message>" --output-format stream-json
//     → full conversation history preserved, Claude remembers prior context
//
//   Session fallback:
//     If --resume fails (session expired/deleted), a fresh session starts with
//     a context preamble that re-establishes Corion identity. The new sessionId
//     is saved and continuity resumes from that point.
//
// Concurrency: per-chatId lock prevents overlapping calls from the same chat.
// The global one-at-a-time constraint from claudeWorkerBridge is NOT shared —
// session calls and one-shot delegate tasks run independently.
//
// ENV:
//   CLAUDE_CLI_PATH          — path to claude binary (default: "claude")
//   CLAUDE_SESSION_TIMEOUT_MS — ms before subprocess kill (default: 120000)

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const CLAUDE_CLI    = process.env.CLAUDE_CLI_PATH ?? "claude";
const TIMEOUT_MS    = parseInt(process.env.CLAUDE_SESSION_TIMEOUT_MS ?? "120000", 10);
const PROJECT_DIR   = path.resolve(process.cwd());
const SESSIONS_FILE = path.join(PROJECT_DIR, ".local", "state", "telegram-sessions.json");

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredSession {
  sessionId: string;
  chatId: number;
  createdAt: string;
  lastUsedAt: string;
  messageCount: number;
}

export interface SessionRunResult {
  response: string;
  sessionId: string | null;
  isNewSession: boolean;
  elapsedMs: number;
}

// ── Per-chatId lock ───────────────────────────────────────────────────────────

const activeChatIds = new Set<number>();

// ── Session file helpers ──────────────────────────────────────────────────────

function loadSessions(): Map<number, StoredSession> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return new Map();
    const raw = fs.readFileSync(SESSIONS_FILE, "utf8");
    const obj = JSON.parse(raw) as Record<string, StoredSession>;
    const map = new Map<number, StoredSession>();
    for (const [k, v] of Object.entries(obj)) {
      map.set(parseInt(k, 10), v);
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveSessions(sessions: Map<number, StoredSession>): void {
  try {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
    const obj: Record<string, StoredSession> = {};
    sessions.forEach((v, k) => { obj[String(k)] = v; });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
  } catch (err: any) {
    console.warn(`[sessionBridge] saveSessions failed: ${err?.message}`);
  }
}

// ── Stream-JSON parser ────────────────────────────────────────────────────────

function parseStreamJson(output: string): { result: string; sessionId: string | null } {
  // stream-json output: multiple lines, last "type":"result" line has session_id + result
  const lines = output.split("\n").filter((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.type === "result") {
        return {
          result: (parsed.result ?? "").trim(),
          sessionId: parsed.session_id ?? null,
        };
      }
    } catch {
      // not a JSON line — skip
    }
  }
  // Fallback: treat whole stdout as the response
  return { result: output.trim(), sessionId: null };
}

// ── Claude subprocess ─────────────────────────────────────────────────────────

async function spawnClaude(
  extraArgs: string[],
  prompt: string,
): Promise<{ stdout: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    const args = [...extraArgs, "-p", prompt, "--output-format", "stream-json"];
    const proc = spawn(CLAUDE_CLI, args, {
      cwd: PROJECT_DIR,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const killTimer = setTimeout(() => {
      proc.kill("SIGTERM");
      stderr += "\n[sessionBridge] process timed out";
    }, TIMEOUT_MS);

    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("close", (code) => {
      clearTimeout(killTimer);
      if (stderr.trim()) {
        console.warn(`[sessionBridge] claude stderr: ${stderr.trim().slice(0, 200)}`);
      }
      resolve({ stdout, exitCode: code ?? 1 });
    });
    proc.on("error", (err) => {
      clearTimeout(killTimer);
      console.error(`[sessionBridge] spawn error: ${err.message}`);
      resolve({ stdout: "", exitCode: 1 });
    });
  });
}

// Preamble injected into the first message of a new session.
// Claude Code auto-discovers CLAUDE.md from the cwd, so we only add the
// Telegram-specific orientation here — no need to repeat the full repo docs.
function buildFirstMessagePreamble(): string {
  return (
    "[CORION WORKER SESSION — TELEGRAM]\n" +
    "You are CorionWorkerBot, a bounded operational worker in the Corion OS ecosystem, connected via Telegram.\n" +
    "Role: operational workflow worker only. Cora is the orchestrator. Adrian is the human principal.\n" +
    "Canonical Auftrag spine: workshop_orders.\n" +
    "You are NOT a coding assistant, NOT a system administrator, and NOT a general-purpose agent.\n" +
    "Allowed work only:\n" +
    "- create Auftrag from chat, images, PDFs, and operational details\n" +
    "- create or update scheduling/calendar entries\n" +
    "- create tasks and follow-ups\n" +
    "- read existing Auftraege and operational client/order details from the application context\n" +
    "- process operational files: classify, route to correct Drive folder/subfolder, and ensure app attachment linkage\n" +
    "- answer staff questions about existing Auftraege, clients, dates, files, prices, status, and next steps\n" +
    "Forbidden work:\n" +
    "- do not modify code, repo files, config, infrastructure, auth, or deployment\n" +
    "- do not perform development tasks, debugging, refactors, or system maintenance\n" +
    "- do not change permissions, user roles, or hidden admin settings\n" +
    "- do not act outside operational workflow scope\n" +
    "Operational Auftrag rule:\n" +
    "When the trigger Auftrag appears, treat it as a direct instruction to create a canonical Auftrag unless the user explicitly says otherwise.\n" +
    "When the trigger Programare appears, treat it as a direct instruction to create or update the scheduling/calendar part of the canonical workflow unless the user explicitly says otherwise.\n" +
    "In both cases, first mentally re-run the full canonical workflow before acting, then execute it completely.\n" +
    "Canonical file-routing rule:\n" +
    "- 01_Documente_Client for registration, customer PDFs, offers, confirmations, and client documents\n" +
    "- 02_Media_Daune for original damage photos and videos\n" +
    "- 03_Expertiza_Tehnica for diagnostics, calculations, technical/expert outputs\n" +
    "- 04_Comunicare_Asigurare for insurance/payment correspondence\n" +
    "Completion rule:\n" +
    "An Auftrag is NOT complete until verification and correction pass: order exists, schedule exists if requested, all files exist in Drive, all files are in the correct subfolder, and all files exist as canonical app attachments. If any check fails, correct it before saying done.\n" +
    "Access rule:\n" +
    "You may read any Auftrag and operational client/order data needed to help staff, but only write within the bounded workflow actions above.\n" +
    "Answer in the language of the user's message. Be concise, operational, and safe.\n" +
    "---\n"
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run a message inside a persistent Claude session scoped to chatId.
 * Creates a new session on first call; resumes the same session on subsequent calls.
 * Falls back to a fresh session if the stored session no longer exists on disk.
 */
export async function runInSession(
  chatId: number,
  message: string,
): Promise<SessionRunResult> {
  if (activeChatIds.has(chatId)) {
    return {
      response: "Procesez inca mesajul anterior — asteapta cateva secunde si trimite din nou.",
      sessionId: null,
      isNewSession: false,
      elapsedMs: 0,
    };
  }

  activeChatIds.add(chatId);
  const t0 = Date.now();

  try {
    const sessions = loadSessions();
    const existing = sessions.get(chatId);

    // ── Attempt 1: resume existing session ──────────────────────────────────
    if (existing?.sessionId) {
      console.log(`[sessionBridge] chat ${chatId} — resuming session ${existing.sessionId} (msg #${existing.messageCount + 1})`);

      const { stdout, exitCode } = await spawnClaude(
        ["--resume", existing.sessionId],
        message,
      );

      const { result, sessionId } = parseStreamJson(stdout);

      if (result && exitCode === 0) {
        // Update session metadata
        sessions.set(chatId, {
          ...existing,
          lastUsedAt: new Date().toISOString(),
          messageCount: existing.messageCount + 1,
        });
        saveSessions(sessions);

        return {
          response: result,
          sessionId: sessionId ?? existing.sessionId,
          isNewSession: false,
          elapsedMs: Date.now() - t0,
        };
      }

      // Resume failed — session may have expired; fall through to new session
      console.warn(`[sessionBridge] chat ${chatId} — resume failed (exit ${exitCode}), starting fresh`);
      sessions.delete(chatId);
      saveSessions(sessions);
    }

    // ── Attempt 2: new session ───────────────────────────────────────────────
    const isNew = !existing;
    console.log(`[sessionBridge] chat ${chatId} — new session`);

    const preamble = buildFirstMessagePreamble();
    const fullPrompt = `${preamble}${message}`;

    const { stdout, exitCode } = await spawnClaude([], fullPrompt);
    const { result, sessionId } = parseStreamJson(stdout);

    if (sessionId) {
      sessions.set(chatId, {
        sessionId,
        chatId,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        messageCount: 1,
      });
      saveSessions(sessions);
      console.log(`[sessionBridge] chat ${chatId} — saved new session ${sessionId}`);
    }

    const finalResult = result || (exitCode !== 0 ? "Claude nu a putut procesa cererea." : "");

    return {
      response: !isNew
        ? `(sesiune noua — cea veche a expirat)\n\n${finalResult}`
        : finalResult,
      sessionId: sessionId ?? null,
      isNewSession: true,
      elapsedMs: Date.now() - t0,
    };
  } finally {
    activeChatIds.delete(chatId);
  }
}

/** Return stored session info for a chatId, or null if none. */
export function getSessionInfo(chatId: number): StoredSession | null {
  return loadSessions().get(chatId) ?? null;
}

/** Delete the stored session for a chatId — next message starts fresh. */
export function resetSession(chatId: number): void {
  const sessions = loadSessions();
  const had = sessions.has(chatId);
  sessions.delete(chatId);
  saveSessions(sessions);
  console.log(`[sessionBridge] chat ${chatId} — session ${had ? "deleted" : "was already absent"}`);
}
