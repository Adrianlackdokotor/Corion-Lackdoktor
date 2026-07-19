// Corion Task Bus — file-based task handoff between Cora and the Corion runtime.
//
// Cora (or any local agent) writes a JSON task file to .local/corion-bus/in/.
// This watcher polls every 3s, claims any new file, dispatches it, and writes
// the result to .local/corion-bus/out/{id}.json.
//
// Cora's workflow:
//   1. Write {id, type, from, created_at, data} to in/{uuid}.json
//   2. Poll out/{uuid}.json every 3-5s until present
//   3. Read result, reply to Adrian on Telegram
//   4. Optionally delete out file (otherwise stays until next server restart)
//
// Supported task types:
//   intake                 — full Auftrag intake workflow (via executeIntake)
//   delegate               — supervised Claude worker task (via /api/supervisor/delegate)
//   drive_upload           — uploads a local file (e.g. Telegram media inbox) to Google Drive
//   calendar_event_create  — creates a Google Calendar event
//   calendar_event_patch   — updates an existing event (description, location, attachments)
//   task_create            — creates a board task visible in the admin task board
//   document_reference     — records a document reference (board task note or order annotation)
//
// Bus is started once at server boot. If the server is down when a task is
// written, the task file waits in in/ and is picked up on next server start.

import fs from 'fs';
import path from 'path';
import { executeIntake, type IntakeInput } from './auftragIntake';
import {
  driveUpload,          type DriveUploadInput,
  createCalendarEvent,  type CalendarEventInput,
  patchCalendarEvent,   type CalendarEventPatchInput,
  createTask,           type TaskCreateInput,
  documentReference,    type DocumentReferenceInput,
  scheduleOrder,        type OrderScheduleInput,
  mediaAttach,          type MediaAttachInput,
} from './opsActions';
import { storage } from '../storage';

const REPO_ROOT = path.resolve(process.cwd());
const BUS_ROOT = path.join(REPO_ROOT, '.local', 'corion-bus');
const IN_DIR = path.join(BUS_ROOT, 'in');
const OUT_DIR = path.join(BUS_ROOT, 'out');
const PROCESSED_DIR = path.join(BUS_ROOT, 'processed');

const POLL_MS = 3_000;
const DELEGATE_POLL_MS = 6_000;

// ── Types ──────────────────────────────────────────────────────────────────────

type TaskType = 'intake' | 'delegate' | 'drive_upload' | 'calendar_event_create' | 'calendar_event_patch' | 'task_create' | 'document_reference' | 'order_schedule' | 'media_attach';

interface BusTask {
  id: string;
  type: TaskType;
  from?: string;
  created_at: string;
  data: Record<string, unknown>;
}

interface BusResult {
  id: string;
  type: TaskType;
  status: 'done' | 'error';
  completed_at: string;
  result?: unknown;
  error?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ensureDirs(): void {
  fs.mkdirSync(IN_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

function writeResult(result: BusResult): void {
  fs.writeFileSync(path.join(OUT_DIR, `${result.id}.json`), JSON.stringify(result, null, 2));
}

// Derives a short human-readable title from a bus result for the activity feed.
function deriveFeedTitle(result: BusResult): string {
  const r = result.result as Record<string, unknown> | null | undefined;
  switch (result.type) {
    case 'intake': {
      const ref    = (r as any)?.referenceNumber ?? null;
      const partner = (r as any)?.partnerName ? ` → ${(r as any).partnerName}` : '';
      return ref ? `Intake: ${ref}${partner}` : `Intake: ${result.id}`;
    }
    case 'drive_upload':
      return `Drive upload: ${(r as any)?.filename ?? result.id}`;
    case 'calendar_event_create':
      return `Calendar: ${(r as any)?.summary ?? result.id}`;
    case 'calendar_event_patch':
      return `Calendar patch: event ${(r as any)?.eventId ?? result.id}`;
    case 'task_create':
      return `Task: ${(r as any)?.title ?? result.id}`;
    case 'document_reference':
      return `Doc ref: ${result.id}`;
    case 'order_schedule': {
      const ref = (r as any)?.referenceNumber ?? null;
      const start = (r as any)?.scheduledStart ? new Date((r as any).scheduledStart).toLocaleDateString('de-DE') : null;
      return ref ? `Scheduled: ${ref}${start ? ` → ${start}` : ''}` : `Order scheduled: ${result.id.slice(0, 8)}`;
    }
    case 'media_attach': {
      const ref = (r as any)?.referenceNumber ?? null;
      const n   = (r as any)?.created ?? 0;
      return ref ? `Media: ${n} fișiere → ${ref}` : `Media attach: ${n} fișiere`;
    }
    case 'delegate': {
      const taskTitle = (r as any)?.task?.title ?? null;
      const outcome   = (r as any)?.outcome     ?? null;
      if (taskTitle) return `Claude: ${taskTitle}`;
      return outcome ? `Delegate (${outcome})` : `Delegate: ${result.id.slice(0, 8)}`;
    }
    default:
      return result.id;
  }
}

// Writes a row to agent_events after every bus task completes.
// Fail-soft: never throws, so the bus continues even if the DB is down.
async function persistEventFromResult(task: BusTask, result: BusResult): Promise<void> {
  try {
    const r = result.result as Record<string, unknown> | null | undefined;
    const relatedOrderId = (r as any)?.orderId ?? null;

    // For delegate tasks r.taskId is an agent_task UUID, not a board_task UUID —
    // setting relatedTaskId from it would violate the board_tasks FK constraint.
    const relatedTaskId = result.type === 'delegate' ? null : ((r as any)?.taskId ?? null);

    // For delegate tasks, flatten the nested LoopResult fields so the feed UI
    // can render them without digging into raw supervisor response structure.
    let payload: Record<string, unknown> = { result: result.result, error: result.error ?? null };
    if (result.type === 'delegate') {
      const lr = r as any;
      payload = {
        ...payload,
        taskTitle:    lr?.task?.title              ?? null,
        taskSummary:  lr?.result?.summary          ?? null,
        outcome:      lr?.outcome                  ?? null,
        delegationId: lr?.delegationId ?? lr?.taskId ?? null,
        changedFiles: lr?.result?.changedFilesJson ?? [],
      };
    }

    await storage.insertAgentEvent({
      agentSlug:      task.from ?? 'cora',
      eventType:      result.status === 'done' ? 'bus_task_done' : 'bus_task_error',
      busTaskId:      result.id,
      busTaskType:    result.type,
      title:          deriveFeedTitle(result),
      summary:        result.status === 'error'
                        ? `Error: ${result.error ?? 'unknown'}`
                        : null,
      payload,
      relatedOrderId: typeof relatedOrderId === 'string' ? relatedOrderId : null,
      relatedTaskId:  typeof relatedTaskId  === 'string' ? relatedTaskId  : null,
      status:         result.status === 'done' ? 'ok' : 'error',
      visibility:     'admin',
    });
  } catch (err: any) {
    // Never block the bus — DB write failures are logged only.
    console.warn(`[taskBus] agent_event write failed for ${result.id}: ${err?.message}`);
  }
}

function archive(taskId: string, claimPath: string): void {
  const destPath = path.join(PROCESSED_DIR, `${taskId}.json`);
  try {
    fs.renameSync(claimPath, destPath);
  } catch {
    // Already gone — non-fatal
  }
}

// ── Dispatch ───────────────────────────────────────────────────────────────────

async function dispatchIntake(task: BusTask): Promise<unknown> {
  return executeIntake(task.data as unknown as IntakeInput);
}

async function dispatchDelegate(task: BusTask): Promise<unknown> {
  const token = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (!token) throw new Error('AGENT_TASK_SERVICE_TOKEN not set');
  const base = process.env.CORION_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  const delegateRes = await fetch(`${base}/api/supervisor/delegate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(task.data),
  });
  if (!delegateRes.ok) {
    const text = await delegateRes.text().catch(() => '');
    throw new Error(`Delegate HTTP ${delegateRes.status}: ${text}`);
  }
  const { delegationId } = (await delegateRes.json()) as { delegationId: string };

  const timeoutMs = ((task.data.timeoutSeconds as number) || 300) * 1_000 + 90_000;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise<void>((r) => setTimeout(r, DELEGATE_POLL_MS));
    try {
      const pollRes = await fetch(`${base}/api/supervisor/delegate/${delegationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pollRes.ok) {
        const data = (await pollRes.json()) as { status: string };
        if (data.status === 'complete') return data;
      }
    } catch {
      // Transient error — keep polling
    }
  }
  return { outcome: 'timed_out', delegationId };
}

async function dispatch(task: BusTask): Promise<unknown> {
  switch (task.type) {
    case 'intake':                return dispatchIntake(task);
    case 'delegate':              return dispatchDelegate(task);
    case 'drive_upload':          return driveUpload(task.data as unknown as DriveUploadInput);
    case 'calendar_event_create': return createCalendarEvent(task.data as unknown as CalendarEventInput);
    case 'calendar_event_patch':  return patchCalendarEvent(task.data as unknown as CalendarEventPatchInput);
    case 'task_create':           return createTask(task.data as unknown as TaskCreateInput);
    case 'document_reference':    return documentReference(task.data as unknown as DocumentReferenceInput);
    case 'order_schedule':        return scheduleOrder(task.data as unknown as OrderScheduleInput);
    case 'media_attach':          return mediaAttach(task.data as unknown as MediaAttachInput);
    default:                      throw new Error(`Unknown task type: ${(task as any).type}`);
  }
}

// ── File processor ─────────────────────────────────────────────────────────────

async function processFile(filePath: string): Promise<void> {
  // Atomic claim via rename — prevents double-processing.
  const claimPath = `${filePath}.processing`;
  try {
    fs.renameSync(filePath, claimPath);
  } catch {
    return; // Another tick already claimed this file
  }

  let task: BusTask;
  try {
    task = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
  } catch (err: any) {
    console.warn(`[taskBus] bad JSON in ${path.basename(filePath)} — archiving`);
    archive('bad-' + Date.now(), claimPath);
    return;
  }

  console.log(`[taskBus] ▶ ${task.id} (${task.type}) from ${task.from ?? '?'}`);

  let busResult: BusResult;
  try {
    const outcome = await dispatch(task);
    busResult = { id: task.id, type: task.type, status: 'done', completed_at: new Date().toISOString(), result: outcome };
    console.log(`[taskBus] ✓ ${task.id} done`);
  } catch (err: any) {
    busResult = { id: task.id, type: task.type, status: 'error', completed_at: new Date().toISOString(), error: err?.message ?? String(err) };
    console.error(`[taskBus] ✗ ${task.id} error: ${err?.message}`);
  }

  writeResult(busResult);
  archive(task.id, claimPath);
  // Persist to DB for in-app feed visibility. Fail-soft — never blocks the bus.
  persistEventFromResult(task, busResult);
}

// ── Main poll loop ─────────────────────────────────────────────────────────────

let scanning = false;

async function scanAndProcess(): Promise<void> {
  if (scanning) return; // Prevent overlapping scans
  scanning = true;
  try {
    const files = fs.readdirSync(IN_DIR).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      await processFile(path.join(IN_DIR, file));
    }
  } catch (err: any) {
    console.error('[taskBus] scan error:', err?.message);
  } finally {
    scanning = false;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Write a task directly from server-side code (bypasses file drop). */
export async function submitTask(task: Omit<BusTask, 'created_at'>): Promise<BusResult> {
  const full: BusTask = { ...task, created_at: new Date().toISOString() };
  const result = await dispatch(full);
  return {
    id: full.id,
    type: full.type,
    status: 'done',
    completed_at: new Date().toISOString(),
    result,
  };
}

export function startTaskBus(): void {
  ensureDirs();
  // Drain any tasks that arrived before server started
  scanAndProcess().catch(console.error);
  setInterval(() => scanAndProcess().catch(console.error), POLL_MS);
  console.log(`[taskBus] started — polling ${IN_DIR} every ${POLL_MS}ms`);
}
