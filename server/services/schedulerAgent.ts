// Scheduler AI Agent
// -------------------------------------------------------------------------
// Analyses the capacity window for the next N days and produces concrete
// suggestions to either:
//   - relieve overload (move/split a job)
//   - fill gaps with quick jobs from the unscheduled backlog
//
// Each suggestion can optionally be persisted as a `task_board_tasks` row
// owned by the "scheduler" agent. High-impact / client-facing suggestions
// are routed through HITL via taskBoardEngine.classifyTask.

import { storage } from "../storage";
import { sql } from "drizzle-orm";
import { db } from "../../db/index";
import {
  computeWindowLoad,
  findGaps,
  findOverloads,
  type CapacityAppointment,
  type CapacityResource,
  type DayLoad,
  type FreeGap,
  type OverloadFlag,
} from "./calendarCapacity";
import { classifyTask } from "./taskBoardEngine";

export interface SchedulerSuggestion {
  kind: "overload" | "fill_gap" | "stack_drying";
  severity: "info" | "warn" | "critical";
  resourceId: string;
  resourceName: string;
  date: string;
  message: string;
  payload: Record<string, unknown>;
}

export interface AnalysisResult {
  loads: DayLoad[];
  gaps: FreeGap[];
  overloads: OverloadFlag[];
  suggestions: SchedulerSuggestion[];
}

// Pull capacity-shaped appointments + resources from the DB.
// Uses raw SQL because neon-http has known issues with returning timestamps
// through drizzle's relational queries on this project.
async function loadCapacityData(from: Date, to: Date) {
  const resRows = await db.execute(sql`
    SELECT id, name, daily_work_minutes, bay_count
    FROM resources WHERE is_active = true
  `);
  const resources: CapacityResource[] = (resRows.rows as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    dailyWorkMinutes: Number(r.daily_work_minutes ?? 480),
    bayCount: Number(r.bay_count ?? 1),
  }));

  const apRows = await db.execute(sql`
    SELECT id, resource_id, start_time, end_time, work_minutes,
           drying_minutes, bay_occupied, status
    FROM appointments
    WHERE start_time < ${to.toISOString()}
      AND end_time   > ${from.toISOString()}
  `);
  const appointments: CapacityAppointment[] = (apRows.rows as any[]).map((a) => ({
    id: a.id,
    resourceId: a.resource_id,
    startTime: new Date(a.start_time),
    endTime: new Date(a.end_time),
    workMinutes: Number(a.work_minutes ?? 0),
    dryingMinutes: Number(a.drying_minutes ?? 0),
    bayOccupied: !!a.bay_occupied,
    status: a.status,
  }));

  return { resources, appointments };
}

export async function analyzeWindow(from: Date, to: Date): Promise<AnalysisResult> {
  const { resources, appointments } = await loadCapacityData(from, to);
  const loads = computeWindowLoad(appointments, resources, from, to);
  const gaps = findGaps(appointments, resources, from, to, { minGapMinutes: 60 });
  const overloads = findOverloads(loads, resources);

  const nameOf = new Map(resources.map((r) => [r.id, r.name]));
  const suggestions: SchedulerSuggestion[] = [];

  // 1) Overload alerts.
  for (const o of overloads) {
    const name = nameOf.get(o.resourceId) ?? o.resourceId;
    suggestions.push({
      kind: "overload",
      severity: "critical",
      resourceId: o.resourceId,
      resourceName: name,
      date: o.date,
      message:
        o.reason === "work_over_cap"
          ? `${name}: ${Math.round(o.loadPct * 100)}% încărcare manoperă pe ${o.date}. Recomand mutarea unui Auftrag în zilele următoare cu spațiu liber.`
          : `${name}: ${o.bayLoadPeak} mașini simultan în garaj pe ${o.date} — peste capacitatea bay-urilor. Reprogramează una dintre lucrări.`,
      payload: { ...o },
    });
  }

  // 2) Yellow-zone warnings (>=80%).
  for (const l of loads) {
    if (l.status === "yellow") {
      const name = nameOf.get(l.resourceId) ?? l.resourceId;
      suggestions.push({
        kind: "overload",
        severity: "warn",
        resourceId: l.resourceId,
        resourceName: name,
        date: l.date,
        message: `${name}: ${Math.round(l.loadPct * 100)}% încărcare pe ${l.date}. Aproape plin — evită noi lucrări complexe.`,
        payload: { loadPct: l.loadPct },
      });
    }
  }

  // 3) Fill-gap suggestions for quick jobs.
  for (const g of gaps) {
    if (g.durationMinutes < 60) continue;
    const name = nameOf.get(g.resourceId) ?? g.resourceId;
    suggestions.push({
      kind: "fill_gap",
      severity: "info",
      resourceId: g.resourceId,
      resourceName: name,
      date: g.date,
      message: `${name}: fereastră liberă ${Math.floor(g.durationMinutes / 60)}h${g.durationMinutes % 60 ? " " + (g.durationMinutes % 60) + "m" : ""} pe ${g.date} (${fmtTime(g.startTime)}–${fmtTime(g.endTime)}). Bună pentru lucrări ${g.durationMinutes >= 240 ? "standard" : "rapide"}.`,
      payload: {
        startTime: g.startTime.toISOString(),
        endTime: g.endTime.toISOString(),
        durationMinutes: g.durationMinutes,
      },
    });
  }

  // 4) Stacking hint: when an existing appointment has lots of drying time,
  //    suggest a parallel quick job during cure.
  for (const ap of appointments) {
    if ((ap.dryingMinutes ?? 0) >= 90) {
      const name = nameOf.get(ap.resourceId) ?? ap.resourceId;
      suggestions.push({
        kind: "stack_drying",
        severity: "info",
        resourceId: ap.resourceId,
        resourceName: name,
        date: ap.startTime.toISOString().slice(0, 10),
        message: `${name}: lucrarea curentă are ${ap.dryingMinutes} min de uscare. Poți programa o lucrare paralelă (smart-repair / dent) în acest interval.`,
        payload: {
          appointmentId: ap.id,
          dryingMinutes: ap.dryingMinutes,
        },
      });
    }
  }

  return { loads, gaps, overloads, suggestions };
}

// Persist suggestions as task-board items so they appear in the AI Agent
// Task Board for the human to act on.
export async function emitSuggestionTasks(
  suggestions: SchedulerSuggestion[],
  createdById: string | null,
): Promise<number> {
  let created = 0;
  const existingTasks = await storage.listTaskBoardTasks({});

  for (const s of suggestions) {
    if (s.severity === "info") continue; // only warn+critical generate tasks
    const sourceType =
      s.kind === "overload" ? "scheduler_overload" : "scheduler_gap";

    const duplicateExists = existingTasks.some((task: any) => {
      if (task.sourceType !== sourceType) return false;
      if ((task.column || "") === "done") return false;
      const payload = task.payload || {};
      return (
        task.sourceId === s.resourceId &&
        payload.kind === s.kind &&
        payload.date === s.date
      );
    });

    if (duplicateExists) continue;

    const decision = classifyTask({
      sourceType,
      impactValueCents: s.severity === "critical" ? 100_000 : 0,
      clientFacing: false,
    });
    await storage.createTaskBoardTask({
      title: `[Scheduler] ${s.resourceName} • ${s.date}`,
      description: s.message,
      column: decision.requiresReview ? "review" : "todo",
      assignedAgent: decision.assignedAgent,
      assignedUserId: null,
      createdById,
      sourceType,
      sourceId: s.resourceId,
      priority: s.severity === "critical" ? "critical" : "high",
      impactValueCents: s.severity === "critical" ? 100_000 : 0,
      payload: { ...s.payload, kind: s.kind, message: s.message, date: s.date },
      requiresReview: decision.requiresReview,
      autoClaimEligible: decision.autoClaimEligible,
    } as any);
    created++;
  }
  return created;
}

function fmtTime(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
