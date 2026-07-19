// Claude Worker Bridge — Phase 3
//
// Spawns `claude -p "prompt"` as a bounded subprocess, captures output,
// and writes a structured result back to the agent_task_results table.
//
// Usage (from a route handler):
//   import { executeTask } from "./claudeWorkerBridge";
//   executeTask(taskId).catch(console.error); // fire and forget — returns 202 upstream
//
// Config env vars:
//   CLAUDE_CLI_PATH  — path to the claude binary (default: "claude", resolved from PATH)
//   CLAUDE_WORKER_TIMEOUT_MS — ms before the subprocess is killed (default: 120000)

import { spawn } from "child_process";
import type { AgentTask } from "@shared/schema";
import { storage } from "../storage";

// ── Config ────────────────────────────────────────────────────────────────────

const CLAUDE_CLI = process.env.CLAUDE_CLI_PATH ?? "claude";
const TIMEOUT_MS = parseInt(process.env.CLAUDE_WORKER_TIMEOUT_MS ?? "120000", 10);

// Module-level guard: prevents two tasks running in the same process simultaneously.
// The DB is the authoritative source (claimAgentTask is atomic), but this adds
// an extra layer of safety within a single server instance.
let bridgeBusy = false;

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildWorkerPrompt(task: AgentTask): string {
  const contextSection =
    task.contextRefs && task.contextRefs.length > 0
      ? `\nAdditional context files to read first:\n${task.contextRefs.map((r) => `- ${r}`).join("\n")}\n`
      : "";

  return [
    "You are a bounded worker agent inside the Corion-Lackdoktor repository.",
    "",
    "Read these files before starting:",
    "- CLAUDE.md",
    "- docs/architecture/corion-spine-map.md",
    "- docs/architecture/junk-preservation-policy.md",
    "- docs/architecture/agent-constitution-and-iam.md",
    contextSection,
    "Hard constraints — do NOT do any of the following without explicit instruction:",
    "- Modify shared/schema.ts (existing tables) or server/routes/admin-finance.ts",
    "- Touch auth, password, or account tooling",
    "- Perform broad refactors spanning many files",
    "- Delete files without first verifying they are unused",
    "- Run git push, git commit --amend, or any deploy command",
    "- Make finance status changes",
    "",
    `Task type: ${task.taskType}`,
    `Working directory: ${task.workingDirectory}`,
    "",
    "Task:",
    task.taskPrompt,
    "",
    "When finished, end your response with EXACTLY these section headers:",
    "## Summary",
    "## Files Changed",
    "## Risks",
    "## Needs Live Verification",
    "",
    "Use 'None' under a section if nothing applies.",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// ── Output parser ─────────────────────────────────────────────────────────────

function parseOutputSections(output: string): {
  summary: string;
  changedFiles: string[];
  risks: string[];
  verifications: string[];
} {
  const extractSection = (header: string): string => {
    const re = new RegExp(`## ${header}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
    return (output.match(re)?.[1] ?? "").trim();
  };

  const toLines = (text: string): string[] =>
    text
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter((l) => l.length > 0 && l.toLowerCase() !== "none");

  return {
    summary: extractSection("Summary"),
    changedFiles: toLines(extractSection("Files Changed")),
    risks: toLines(extractSection("Risks")),
    verifications: toLines(extractSection("Needs Live Verification")),
  };
}

// ── Main executor ─────────────────────────────────────────────────────────────

export async function executeTask(taskId: string): Promise<void> {
  // Module-level guard: one task at a time per server process.
  // If the guard fires, the task has not been claimed yet — it stays queued.
  // No result row is written; a queued task with a result row would be semantically
  // misleading (looks like execution output for a task that never ran).
  // The /run route's DB-level check catches this earlier and returns 409 BRIDGE_BUSY
  // to the caller; this guard is a secondary safety net for direct executeTask calls.
  if (bridgeBusy) {
    console.warn(`[bridge] rejected task ${taskId} — bridge already busy; task stays queued`);
    return;
  }

  // Claim atomically — bail if another process already took it.
  const task = await storage.claimAgentTask(taskId);
  if (!task) {
    console.warn(`[bridge] task ${taskId} not claimable — already running or not queued`);
    return;
  }

  bridgeBusy = true;
  console.log(`[bridge] starting task ${taskId}: "${task.title}"`);

  let stdout = "";
  let stderr = "";
  let exitCode = 1;
  let timedOut = false;

  try {
    const prompt = buildWorkerPrompt(task);

    exitCode = await new Promise<number>((resolve) => {
      const proc = spawn(CLAUDE_CLI, ["-p", prompt], {
        cwd: task.workingDirectory,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      // Kill the process if it exceeds the timeout.
      const killTimer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
        stderr += `\n[bridge] task timed out after ${TIMEOUT_MS}ms and was terminated`;
      }, TIMEOUT_MS);

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on("close", (code) => {
        clearTimeout(killTimer);
        resolve(code ?? 1);
      });
      proc.on("error", (err) => {
        clearTimeout(killTimer);
        stderr += `\n[bridge] spawn error: ${err.message}`;
        if ((err as any).code === "ENOENT") {
          stderr += `\n[bridge] '${CLAUDE_CLI}' not found. Set CLAUDE_CLI_PATH env var to the correct path.`;
        }
        resolve(1);
      });
    });
  } catch (err: any) {
    stderr += `\n[bridge] unexpected error: ${err?.message ?? String(err)}`;
    exitCode = 1;
  } finally {
    bridgeBusy = false;
  }

  // Build the full raw output string (stdout + stderr appendix).
  // createAgentTaskResult below handles the running→pending_review transition
  // and stamps finishedAt atomically with the result row insert.
  const rawOutput =
    stdout + (stderr.trim() ? `\n\n--- stderr ---\n${stderr.trim()}` : "");

  // Parse structured sections from stdout.
  const sections = parseOutputSections(stdout);

  // Fall back to first 500 chars of rawOutput if no summary was found.
  const summary =
    sections.summary || (rawOutput.slice(0, 500) + (rawOutput.length > 500 ? "…" : ""));

  await storage
    .createAgentTaskResult({
      taskId,
      summary,
      rawOutput,
      exitCode,
      changedFilesJson: sections.changedFiles,
      risksJson: sections.risks,
      verificationNeededJson: sections.verifications,
      structuredOutputJson: timedOut ? { timedOut: true } : {},
      reviewStatus: "pending_review",
    })
    .catch((e) => console.error(`[bridge] createAgentTaskResult failed: ${e?.message}`));

  console.log(
    `[bridge] task ${taskId} finished — exit ${exitCode}, status → pending_review`
  );
}
