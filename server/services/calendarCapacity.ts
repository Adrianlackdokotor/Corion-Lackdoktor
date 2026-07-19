// Calendar Capacity Service
// -------------------------------------------------------------------------
// Pure, testable functions that turn raw appointments + resources into
// per-day / per-resource capacity metrics:
//   - workLoadMinutes  → active labour minutes booked on a day
//   - bayLoad          → max simultaneous cars occupying a physical bay
//   - loadPct          → workLoadMinutes / dailyWorkMinutes
//   - status           → green | yellow | red
//   - gaps             → free windows >= minGapMinutes that fit new work
//
// Drying minutes are *passive* — they occupy the bay but NOT the labour
// budget, so two cars can share a tech during paint cure.
//
// All inputs are plain JS objects; no DB, no I/O. The DB-aware wrapper
// lives in the routes layer.

export interface CapacityAppointment {
  id: string;
  resourceId: string;
  startTime: Date;
  endTime: Date;
  workMinutes: number;
  dryingMinutes: number;
  bayOccupied: boolean;
  status: string;
}

export interface CapacityResource {
  id: string;
  name: string;
  dailyWorkMinutes: number; // default 480 (8h)
  bayCount: number;         // default 1
}

export interface DayLoad {
  date: string;             // YYYY-MM-DD
  resourceId: string;
  workLoadMinutes: number;
  bayLoadPeak: number;      // max simultaneous cars in bays
  loadPct: number;          // 0..>1
  status: "green" | "yellow" | "red";
  appointmentIds: string[];
}

export interface FreeGap {
  resourceId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Workshop operates on Europe/Berlin local time. All day keys, day boundaries
// and working-hour windows are computed in this zone to keep load metrics and
// gap detection consistent with how operators actually plan the day.
export const SHOP_TZ = "Europe/Berlin";

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
});

export function dateKey(d: Date): string {
  return ymdFmt.format(d); // YYYY-MM-DD in shop tz
}

// Compute the UTC instant corresponding to a given wall-clock hour on a given
// shop-tz day. Handles DST by computing the zone offset for that exact instant.
export function shopWallToUtc(dayKeyStr: string, hour: number, minute = 0): Date {
  // Start from the naive UTC instant for that wall-clock time, then correct by
  // the actual offset of Europe/Berlin at that instant.
  const [y, m, d] = dayKeyStr.split("-").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, hour, minute, 0);
  // Compute the offset (minutes) between shop-tz wall time and UTC at this instant.
  const probe = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(naiveUtc));
  const get = (t: string) => Number(probe.find((p) => p.type === t)?.value);
  const wallUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), 0);
  const offsetMs = wallUtc - naiveUtc; // shop_tz - UTC at that instant
  return new Date(naiveUtc - offsetMs);
}

export function eachDay(from: Date, to: Date): string[] {
  const out: string[] = [];
  let cursor = shopWallToUtc(dateKey(from), 0, 0);
  const stop = shopWallToUtc(dateKey(to), 0, 0).getTime();
  while (cursor.getTime() <= stop) {
    out.push(dateKey(cursor));
    cursor = new Date(cursor.getTime() + MS_PER_DAY + 60 * 60 * 1000); // +25h to absorb DST, then snap
    cursor = shopWallToUtc(dateKey(cursor), 0, 0);
  }
  return out;
}

// Compute per-(resource,day) load metrics for the given window.
export function computeWindowLoad(
  appointments: CapacityAppointment[],
  resources: CapacityResource[],
  from: Date,
  to: Date,
): DayLoad[] {
  const days = eachDay(from, to);
  const byResource = new Map(resources.map((r) => [r.id, r]));
  const grouped = new Map<string, CapacityAppointment[]>(); // key = `${resId}|${day}`

  // Split each appointment across the shop-local days it spans so that
  // cross-midnight jobs contribute to every affected day's load and bay use.
  for (const ap of appointments) {
    if (ap.status === "cancelled") continue;
    const startMs = ap.startTime.getTime();
    const endMs = ap.endTime.getTime();
    const totalMin = Math.max(1, (endMs - startMs) / 60_000);
    const startDayKey = dateKey(ap.startTime);
    const endDayKey = dateKey(ap.endTime);
    let dayCursor = startDayKey;
    while (true) {
      const dayStart = shopWallToUtc(dayCursor, 0, 0).getTime();
      const dayEnd = shopWallToUtc(dayCursor, 0, 0).getTime() + 26 * 60 * 60 * 1000; // safe upper bound; clipped below
      const segStart = Math.max(startMs, dayStart);
      const nextDay = dateKey(new Date(dayStart + 26 * 60 * 60 * 1000));
      const realDayEnd = shopWallToUtc(nextDay, 0, 0).getTime();
      const segEnd = Math.min(endMs, realDayEnd);
      if (segEnd > segStart) {
        const segMin = (segEnd - segStart) / 60_000;
        const fraction = segMin / totalMin;
        const day = dayCursor;
        const k = `${ap.resourceId}|${day}`;
        const arr = grouped.get(k) ?? [];
        arr.push({
          ...ap,
          startTime: new Date(segStart),
          endTime: new Date(segEnd),
          workMinutes: Math.round((ap.workMinutes ?? 0) * fraction),
        });
        grouped.set(k, arr);
      }
      if (dayCursor === endDayKey) break;
      dayCursor = dateKey(new Date(dayStart + 26 * 60 * 60 * 1000));
      if (!dayCursor || dayCursor > endDayKey) break;
      void dayEnd;
    }
  }

  const out: DayLoad[] = [];
  for (const r of resources) {
    for (const day of days) {
      const list = grouped.get(`${r.id}|${day}`) ?? [];
      const workLoadMinutes = list.reduce(
        (s, a) => s + Math.max(0, a.workMinutes ?? 0),
        0,
      );
      const bayLoadPeak = peakOverlap(list.filter((a) => a.bayOccupied));
      const cap = byResource.get(r.id)?.dailyWorkMinutes || 480;
      const loadPct = cap > 0 ? workLoadMinutes / cap : 0;
      let status: DayLoad["status"] = "green";
      if (loadPct > 1 || bayLoadPeak > r.bayCount) status = "red";
      else if (loadPct >= 0.8 || bayLoadPeak === r.bayCount) status = "yellow";
      out.push({
        date: day,
        resourceId: r.id,
        workLoadMinutes,
        bayLoadPeak,
        loadPct,
        status,
        appointmentIds: list.map((a) => a.id),
      });
    }
  }
  return out;
}

// Sweep-line max overlap count across a set of [start,end) intervals.
export function peakOverlap(items: { startTime: Date; endTime: Date }[]): number {
  if (items.length === 0) return 0;
  const evts: { t: number; d: number }[] = [];
  for (const it of items) {
    evts.push({ t: it.startTime.getTime(), d: 1 });
    evts.push({ t: it.endTime.getTime(), d: -1 });
  }
  evts.sort((a, b) => a.t - b.t || a.d - b.d);
  let cur = 0;
  let peak = 0;
  for (const e of evts) {
    cur += e.d;
    if (cur > peak) peak = cur;
  }
  return peak;
}

// Find free time windows >= minGapMinutes inside a working day [dayStart, dayEnd).
// Considers only bay-blocking appointments (bayOccupied=true) since drying time
// can be paralleled by another labour task.
export function findGaps(
  appointments: CapacityAppointment[],
  resources: CapacityResource[],
  from: Date,
  to: Date,
  opts: { dayStartHour?: number; dayEndHour?: number; minGapMinutes?: number } = {},
): FreeGap[] {
  const dayStartHour = opts.dayStartHour ?? 8;
  const dayEndHour = opts.dayEndHour ?? 17;
  const minGap = opts.minGapMinutes ?? 60;
  const out: FreeGap[] = [];
  const days = eachDay(from, to);

  for (const r of resources) {
    const bayCap = Math.max(1, r.bayCount);
    for (const day of days) {
      const dayStart = shopWallToUtc(day, dayStartHour, 0);
      const dayEnd = shopWallToUtc(day, dayEndHour, 0);
      const blocking = appointments
        .filter(
          (a) =>
            a.resourceId === r.id &&
            a.bayOccupied &&
            a.status !== "cancelled" &&
            a.endTime.getTime() > dayStart.getTime() &&
            a.startTime.getTime() < dayEnd.getTime(),
        );

      // Sweep-line: a slot is "free" while concurrent bay usage < bayCount.
      // Build minute-resolution sweep events, walk forward, and emit gaps
      // whenever capacity > 0 long enough.
      const evts: { t: number; d: number }[] = [
        { t: dayStart.getTime(), d: 0 },
        { t: dayEnd.getTime(), d: 0 },
      ];
      for (const ap of blocking) {
        evts.push({ t: Math.max(ap.startTime.getTime(), dayStart.getTime()), d: 1 });
        evts.push({ t: Math.min(ap.endTime.getTime(), dayEnd.getTime()), d: -1 });
      }
      evts.sort((a, b) => a.t - b.t || a.d - b.d);

      let usage = 0;
      let gapStart: number | null = dayStart.getTime();
      for (const e of evts) {
        if (e.t < dayStart.getTime() || e.t > dayEnd.getTime()) continue;
        if (usage < bayCap && gapStart !== null && e.t > gapStart) {
          const dur = e.t - gapStart;
          if (dur >= minGap * 60_000) {
            out.push({
              resourceId: r.id,
              date: day,
              startTime: new Date(gapStart),
              endTime: new Date(e.t),
              durationMinutes: Math.floor(dur / 60_000),
            });
          }
        }
        usage += e.d;
        gapStart = usage < bayCap ? e.t : null;
      }
    }
  }
  return out;
}

export interface OverloadFlag {
  resourceId: string;
  date: string;
  reason: "work_over_cap" | "bay_over_cap";
  loadPct: number;
  bayLoadPeak: number;
}

export function findOverloads(loads: DayLoad[], resources: CapacityResource[]): OverloadFlag[] {
  const byId = new Map(resources.map((r) => [r.id, r]));
  return loads
    .filter((l) => l.status === "red")
    .map((l) => {
      const r = byId.get(l.resourceId);
      const reason: OverloadFlag["reason"] =
        l.loadPct > 1 ? "work_over_cap" : "bay_over_cap";
      return {
        resourceId: l.resourceId,
        date: l.date,
        reason,
        loadPct: l.loadPct,
        bayLoadPeak: l.bayLoadPeak,
      };
    });
}
