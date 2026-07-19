import { spawn } from "child_process";
import { homedir } from "os";

export type OpenClawCoriTurn = {
  userId: string;
  userEmail?: string | null;
  message: string;
  nativeResult: {
    intent: string;
    status: string;
    reply: string;
    action?: string;
  };
};

export type OpenClawCoriResult = {
  available: boolean;
  reply: string | null;
  sessionId: string;
  agentId: string;
  provider: "openclaw";
  error?: string;
};

const CLI_PATH = process.env.OPENCLAW_CLI_PATH || "/usr/local/bin/openclaw";
const AGENT_ID = process.env.CORI_OPENCLAW_AGENT_ID || "cori-admin";
const TIMEOUT_MS = Number.parseInt(process.env.CORI_OPENCLAW_TIMEOUT_MS || "65000", 10);

/**
 * Stable per-user session keys are deliberately owned by OpenClaw. They provide
 * conversation continuity across browser reloads while never mixing two users'
 * private administrative context.
 */
export function coriOpenClawSessionId(userId: string) {
  return `corion:admin:${userId}`;
}

export function isOpenClawCoriEnabled() {
  return process.env.CORI_OPENCLAW_ENABLED === "true";
}

function buildTurnPrompt(turn: OpenClawCoriTurn) {
  const native = {
    intent: turn.nativeResult.intent,
    status: turn.nativeResult.status,
    action: turn.nativeResult.action ?? null,
    authoritativeReply: turn.nativeResult.reply,
  };

  return [
    "[CORION APP / ADMIN CORI TURN]",
    "You are CORI, Adrian's durable CEO and operations assistant inside the authenticated Corion admin app.",
    "The Corion backend is the only canonical source of operational truth. It has already classified and, where policy permits, executed the deterministic action for this turn.",
    "You have no tools and must not claim an action, lookup, change, detected defect, metric, or customer fact that is absent from the NATIVE_RESULT below.",
    "For operational snapshots, distinguish computed Corion signals from hypotheses. For QA, distinguish a user-reported observation from a verified defect. Suggest the next safe, useful step without inventing execution.",
    "Never request or reveal another user's private data. Keep answers concise and use the user's language when clear (German by default).",
    `Authenticated admin: ${turn.userEmail || turn.userId}.`,
    `USER_MESSAGE:\n${turn.message}`,
    `NATIVE_RESULT (authoritative):\n${JSON.stringify(native)}`,
    "If NATIVE_RESULT.status is unsupported, answer helpfully within Corion operations and offer a safe next step. Otherwise, acknowledge the native result without changing its meaning. Return only the reply text.",
  ].join("\n\n");
}

function parseAgentReply(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    const candidates = [
      ...(Array.isArray(parsed?.result?.payloads) ? parsed.result.payloads.map((payload: any) => payload?.text) : []),
      parsed?.result?.text,
      parsed?.result?.response,
      parsed?.result?.message,
      parsed?.response,
      parsed?.message,
      parsed?.text,
    ];
    const text = candidates.find((value) => typeof value === "string" && value.trim());
    if (typeof text !== "string") return null;
    const reply = text.trim();
    return reply.startsWith("LLM error:") ? null : reply;
  } catch {
    return trimmed;
  }
}

async function runOpenClaw(args: string[]) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(CLI_PATH, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        OPENCLAW_CONFIG_PATH: process.env.OPENCLAW_CONFIG_PATH || `${homedir()}/.openclaw/openclaw.json`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const timer = setTimeout(() => child.kill("SIGTERM"), TIMEOUT_MS);
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: `${stderr}\n${error.message}`, exitCode: 1 });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
  });
}

/**
 * OpenClaw owns durable conversation sessions only. Canonical searches and all
 * mutations remain in the native Corion policy/action layer.
 */
export async function runOpenClawCoriTurn(turn: OpenClawCoriTurn): Promise<OpenClawCoriResult> {
  const sessionId = coriOpenClawSessionId(turn.userId);
  if (!isOpenClawCoriEnabled()) {
    return { available: false, reply: null, sessionId, agentId: AGENT_ID, provider: "openclaw", error: "disabled" };
  }

  try {
    const result = await runOpenClaw([
      "agent",
      "--agent", AGENT_ID,
      "--session-id", sessionId,
      "--message", buildTurnPrompt(turn),
      "--json",
      "--timeout", String(Math.max(10, Math.floor(TIMEOUT_MS / 1000))),
    ]);
    if (result.exitCode !== 0) {
      return {
        available: false,
        reply: null,
        sessionId,
        agentId: AGENT_ID,
        provider: "openclaw",
        error: result.stderr.trim().slice(0, 240) || `exit_${result.exitCode}`,
      };
    }
    const reply = parseAgentReply(result.stdout);
    return {
      available: Boolean(reply),
      reply,
      sessionId,
      agentId: AGENT_ID,
      provider: "openclaw",
      error: reply ? undefined : "empty_or_model_error",
    };
  } catch (error: any) {
    return {
      available: false,
      reply: null,
      sessionId,
      agentId: AGENT_ID,
      provider: "openclaw",
      error: error?.message || "runtime_error",
    };
  }
}
