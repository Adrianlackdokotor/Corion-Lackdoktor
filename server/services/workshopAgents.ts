// Workshop OS — single AI dispatcher for the 6 Fixico-style pending actions.
// Each action maps to a specialised agent and emits a task-board entry so a
// human can review when the AI is unsure (HITL). When the agent can fully
// automate the step, it auto-claims and only logs an audit entry.

import { storage } from "../storage";
import { autoCreateBoardTask } from "./taskAutoCreate";
import type { AgentRole } from "./taskBoardEngine";
import { analyzeWindow } from "./schedulerAgent";
import type { WorkshopOrder } from "@shared/schema";

export type WorkshopAction =
  | "neue_anfragen"
  | "angebot"
  | "termin"
  | "annahme"
  | "rueckgabe"
  | "rechnung";

interface ActionMeta {
  agent: AgentRole;
  titleDe: string;
  defaultRequiresReview: boolean;
  clientFacing: boolean;
}

export const WORKSHOP_ACTIONS: Record<WorkshopAction, ActionMeta> = {
  neue_anfragen: { agent: "reception", titleDe: "Neue Anfrage triagieren", defaultRequiresReview: true, clientFacing: true },
  angebot: { agent: "customer_care", titleDe: "Angebot anpassen", defaultRequiresReview: true, clientFacing: true },
  termin: { agent: "scheduler", titleDe: "Termin vereinbaren", defaultRequiresReview: false, clientFacing: true },
  annahme: { agent: "reception", titleDe: "Annahme bestätigen", defaultRequiresReview: false, clientFacing: false },
  rueckgabe: { agent: "qc", titleDe: "Rückgabe bestätigen", defaultRequiresReview: true, clientFacing: true },
  rechnung: { agent: "cfo", titleDe: "Rechnung hochladen", defaultRequiresReview: true, clientFacing: false },
};

export interface DispatchInput {
  action: WorkshopAction;
  orderId?: string;
  note?: string;
  payload?: Record<string, unknown>;
  createdById?: string | null;
}

export interface DispatchResult {
  ok: boolean;
  taskId?: string;
  agent: AgentRole;
  message: string;
  details?: Record<string, unknown>;
}

// Pure, deterministic dispatcher. The actual ML/LLM heavy-lift (vision OCR,
// generative drafting) hangs off downstream services that are already wired
// (CFO inbox extraction, schedulerAgent, smart triage). Here we only:
//   1. Snapshot the relevant business object.
//   2. Build a HITL task on the AI Task Board.
//   3. Run the deterministic helpers (e.g. scheduler suggestion) inline so the
//      caller gets actionable output for the UI.
export async function dispatchWorkshopAction(input: DispatchInput): Promise<DispatchResult> {
  const meta = WORKSHOP_ACTIONS[input.action];
  if (!meta) return { ok: false, agent: "reception", message: `Unbekannte Aktion: ${input.action}` };

  const order = input.orderId ? await storage.getWorkshopOrder(input.orderId).catch(() => null) : null;
  const impact = order?.totalAmountCents ?? 0;

  // Action-specific deterministic enrichment
  const details: Record<string, unknown> = {};
  let descriptionExtra = "";

  if (input.action === "termin" && order) {
    const from = new Date();
    const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    try {
      const win = await analyzeWindow(from, to);
      const firstGap = win.gaps[0];
      if (firstGap) {
        details.suggestedSlot = {
          date: firstGap.date,
          startTime: firstGap.startTime,
          endTime: firstGap.endTime,
          durationMinutes: firstGap.durationMinutes,
          resourceId: firstGap.resourceId,
        };
        descriptionExtra = `\nVorschlag: ${firstGap.date} ${String(firstGap.startTime).slice(11, 16)}–${String(firstGap.endTime).slice(11, 16)} (${firstGap.durationMinutes} Min, Werkstatt ${firstGap.resourceId.slice(0, 8)}).`;
      } else {
        descriptionExtra = "\nKein freier Slot in den nächsten 14 Tagen — Scheduler-Überlast prüfen.";
      }
    } catch (err) {
      details.schedulerError = String((err as Error)?.message ?? err);
    }
  }

  if (input.action === "rechnung" && order) {
    details.invoiceCheck = {
      paymentStatus: order.paymentStatus,
      paidCents: order.paidAmountCents,
      totalCents: order.totalAmountCents,
      delta: (order.totalAmountCents ?? 0) - (order.paidAmountCents ?? 0),
    };
  }

  if (input.action === "rueckgabe" && order) {
    const files = await storage.getFileAttachmentsByOrder(order.id).catch(() => [] as any[]);
    const before = files.filter((f: any) => /before|vorher/i.test(f.category ?? f.originalName ?? ""));
    const after = files.filter((f: any) => /after|nachher/i.test(f.category ?? f.originalName ?? ""));
    details.qcChecklist = {
      beforePhotos: before.length,
      afterPhotos: after.length,
      paired: Math.min(before.length, after.length),
      missing: before.length === 0 ? "Vorher-Fotos fehlen" : after.length === 0 ? "Nachher-Fotos fehlen" : null,
    };
  }

  const refLabel = order
    ? `${order.referenceNumber ?? order.id.slice(0, 8)} · ${order.vehicleMake ?? ""} ${order.vehicleModel ?? ""}`.trim()
    : "Allgemein";

  const task = await autoCreateBoardTask({
    title: `${meta.titleDe} — ${refLabel}`,
    description: (input.note ? `${input.note}\n` : "") + descriptionExtra.trim(),
    sourceType: "auftrag",
    sourceId: input.orderId,
    impactValueCents: impact,
    clientFacing: meta.clientFacing,
    contractChange: false,
    forcedAgent: meta.agent,
    payload: { action: input.action, ...input.payload, ...details },
    createdById: input.createdById ?? null,
  });

  return {
    ok: !!task,
    taskId: task?.id,
    agent: meta.agent,
    message: task
      ? `${meta.titleDe} wurde an ${meta.agent} delegiert.`
      : "Task konnte nicht angelegt werden.",
    details,
  };
}

// Build the dashboard tile counts. We mirror the 6 Fixico tiles by counting
// open tasks per (sourceType=auftrag, payload.action=…) and by deriving the
// "Neue Anfragen" tile from open auftrag-status orders that still need triage.
export async function buildWorkshopDashboard(opts: { role: string; userId: string }): Promise<{
  tiles: Array<{ key: WorkshopAction; label: string; count: number; agent: AgentRole }>;
  totalOpenTasks: number;
  recentOrders: Array<Pick<WorkshopOrder, "id" | "referenceNumber" | "vehicleMake" | "vehicleModel"
    | "vehiclePlate" | "customerName" | "status" | "totalAmountCents" | "scheduledDate" | "createdAt">>;
}> {
  const [allOrdersRaw, allTasks] = await Promise.all([
    storage.getAllWorkshopOrders().catch(() => [] as WorkshopOrder[]),
    storage.listTaskBoardTasks({ sourceType: "auftrag", limit: 500 }).catch(() => [] as any[]),
  ]);

  const allOrders = opts.role === "admin"
    ? allOrdersRaw
    : allOrdersRaw.filter((o) => o.partnerId === opts.userId || o.createdBy === opts.userId);
  const allowedOrderIds = new Set(allOrders.map((o) => o.id));

  const openTasks = (Array.isArray(allTasks) ? allTasks : []).filter(
    (t: any) => t.column !== "done" && t.sourceType === "auftrag"
      && (opts.role === "admin" || (t.sourceId && allowedOrderIds.has(t.sourceId))),
  );

  const countByAction = (action: WorkshopAction) =>
    openTasks.filter((t: any) => (t.payload?.action ?? null) === action).length;

  const newRequests = allOrders.filter((o) => o.status === "open").length;

  const tiles: Array<{ key: WorkshopAction; label: string; count: number; agent: AgentRole }> = [
    { key: "neue_anfragen", label: "Neue Anfragen", count: newRequests + countByAction("neue_anfragen"), agent: "reception" },
    { key: "angebot", label: "Angebot anpassen", count: countByAction("angebot"), agent: "customer_care" },
    { key: "termin", label: "Termin Vereinbaren", count: countByAction("termin"), agent: "scheduler" },
    { key: "annahme", label: "Annahme Bestätigen", count: countByAction("annahme"), agent: "reception" },
    { key: "rueckgabe", label: "Rückgabe bestätigen", count: countByAction("rueckgabe"), agent: "qc" },
    { key: "rechnung", label: "Rechnung hochladen", count: countByAction("rechnung"), agent: "cfo" },
  ];

  const recentOrders = allOrders
    .slice(0, 50)
    .map((o) => ({
      id: o.id,
      referenceNumber: o.referenceNumber,
      vehicleMake: o.vehicleMake,
      vehicleModel: o.vehicleModel,
      vehiclePlate: o.vehiclePlate,
      customerName: o.customerName,
      status: o.status,
      totalAmountCents: o.totalAmountCents,
      scheduledDate: o.scheduledDate,
      createdAt: o.createdAt,
    }));

  return { tiles, totalOpenTasks: openTasks.length, recentOrders };
}

// Map the 5-state DB status to the 4-step Fixico timeline used in the UI.
export function timelineStep(status: string): 0 | 1 | 2 | 3 {
  switch (status) {
    case "open":
    case "angenommen":
      return 0; // Geplant
    case "in_bearbeitung":
      return 1; // In Reparatur
    case "fertig":
      return 2; // Rückgabebereit
    case "completed":
    case "closed":
    case "cancelled":
      return 3; // Zurückgegeben
    default:
      return 0;
  }
}
