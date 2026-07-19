import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface Order {
  id: string;
  referenceNumber?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehiclePlate?: string | null;
  customerName?: string | null;
  status?: string | null;
  totalAmountCents?: number | null;
  scheduledDate?: string | null;
  createdAt?: string | null;
}
interface AppointmentLike {
  id: string;
  title?: string | null;
  customerName?: string | null;
  vehicleLabel?: string | null;
  priceInfo?: string | null;
  status?: string | null;
  startTime?: string | null;
  colorOverride?: string | null;
  notes?: string | null;
}
interface Props {
  orders: Order[];
  appointments?: AppointmentLike[];
  onOpen?: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  angenommen: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  in_bearbeitung: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  in_progress: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  fertig: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-600/30",
  cancelled: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30",
};

function getTone(item: any) {
  const color = (item?.colorOverride || '').toLowerCase();
  const notes = String(item?.notes || '').toLowerCase();
  const title = String(item?.title || '').toLowerCase();
  if (color === '#facc15' || notes.includes('mainz-kastel') || title.includes('mainz-kastel')) {
    return 'bg-yellow-400/25 text-yellow-200 border-yellow-300/40';
  }
  if (color === '#3b82f6' || notes.includes('wallau') || title.includes('wallau')) {
    return 'bg-blue-500/20 text-blue-200 border-blue-400/40';
  }
  return STATUS_COLOR[item?.status ?? ''] ?? 'bg-muted text-muted-foreground border-border';
}
const STATUS_LABEL: Record<string, string> = {
  open: "Offen", angenommen: "Angenommen", in_bearbeitung: "In Reparatur",
  in_progress: "In Reparatur", fertig: "Fertig", completed: "Abgeschlossen", cancelled: "Storniert",
};
const eur = (c?: number | null) => ((c ?? 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function FixicoCalendar({ orders, appointments = [], onOpen }: Props) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });

  const ordersByDay = useMemo(() => {
    const map = new Map<string, Array<Order | AppointmentLike>>();
    for (const o of orders) {
      const iso = o.scheduledDate ?? null;
      if (!iso) continue;
      const k = iso.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(o);
      map.set(k, arr);
    }
    for (const a of appointments) {
      const iso = a.startTime ?? null;
      if (!iso) continue;
      const k = iso.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    return map;
  }, [orders, appointments]);

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = (first.getDay() + 6) % 7; // Mo-first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ date: dt, key: dt.toISOString() });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, key: `tail-${cells.length}` });
    return cells;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const d = new Date(cursor);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(d); x.setDate(d.getDate() + i); return x;
    });
  }, [cursor]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const totalScheduled = orders.filter((o) => o.scheduledDate).length + appointments.filter((a) => a.startTime).length;
  const monthScheduled = monthCells.reduce(
    (n, c) => n + (c.date ? (ordersByDay.get(c.date.toISOString().slice(0, 10))?.length ?? 0) : 0), 0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-extrabold tracking-tight uppercase flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" /> Werkstatt-Kalender
          </h2>
          <p className="text-xs text-muted-foreground">
            {monthScheduled} geplante Aufträge im Monat · {totalScheduled} gesamt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border p-0.5 flex">
            <Button size="sm" variant={view === "month" ? "default" : "ghost"} className="h-8"
              onClick={() => setView("month")} data-testid="button-cal-month">Monat</Button>
            <Button size="sm" variant={view === "week" ? "default" : "ghost"} className="h-8"
              onClick={() => setView("week")} data-testid="button-cal-week">Woche</Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCursor(() => { const d = new Date(); d.setDate(1); return d; })}
            data-testid="button-cal-today">Heute</Button>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" data-testid="button-cal-prev"
              onClick={() => setCursor((d) => view === "month"
                ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
                : new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-cal-next"
              onClick={() => setCursor((d) => view === "month"
                ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
                : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading uppercase tracking-tight">
            {view === "month"
              ? cursor.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
              : `${weekDays[0].toLocaleDateString("de-DE", { day: "2-digit", month: "short" })} – ${weekDays[6].toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {view === "month" ? (
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden text-xs">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                <div key={d} className="bg-muted/40 px-2 py-1.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{d}</div>
              ))}
              {monthCells.map((c) => {
                const k = c.date ? c.date.toISOString().slice(0, 10) : "";
                const dayOrders = (k && ordersByDay.get(k)) || [];
                const isToday = k === todayIso;
                const isWeekend = c.date && (c.date.getDay() === 0 || c.date.getDay() === 6);
                return (
                  <div key={c.key}
                    className={`min-h-[110px] p-1.5 align-top ${isWeekend ? "bg-muted/20" : "bg-card"} ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}>
                    {c.date && (
                      <div className={`text-[11px] mb-1.5 font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {c.date.getDate()}
                      </div>
                    )}
                    <div className="space-y-1">
                      {dayOrders.slice(0, 4).map((o) => {
                        const tone = getTone(o);
                        return (
                          <button key={o.id}
                            data-testid={`cal-cell-order-${o.id}`}
                            onClick={() => onOpen?.(o.id)}
                            className={`block w-full truncate rounded border px-1.5 py-1 text-[10px] text-left hover-elevate active-elevate-2 ${tone}`}
                            title={`${(o as any).referenceNumber ?? (o as any).title ?? ""} · ${(o as any).customerName ?? ""} · ${(o as any).totalAmountCents != null ? eur((o as any).totalAmountCents) : ((o as any).priceInfo ?? "")}`}>
                            <span className="font-semibold">{(o as any).vehiclePlate ?? (o as any).referenceNumber ?? (o as any).customerName ?? "—"}</span>{" "}
                            <span className="opacity-80">{(o as any).vehicleModel ?? (o as any).vehicleLabel ?? (o as any).title ?? ""}</span>
                          </button>
                        );
                      })}
                      {dayOrders.length > 4 && (
                        <div className="text-[10px] text-muted-foreground pl-1">+{dayOrders.length - 4} weitere</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden text-xs">
              {weekDays.map((d) => {
                const k = d.toISOString().slice(0, 10);
                const dayOrders = ordersByDay.get(k) ?? [];
                const isToday = k === todayIso;
                return (
                  <div key={k} className={`min-h-[300px] bg-card p-2 ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}>
                    <div className={`text-[10px] uppercase ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {d.toLocaleDateString("de-DE", { weekday: "short" })}
                    </div>
                    <div className={`text-lg font-heading font-extrabold mb-2 ${isToday ? "text-primary" : ""}`}>
                      {d.getDate()}
                    </div>
                    <div className="space-y-1.5">
                      {dayOrders.length === 0 && <div className="text-[10px] text-muted-foreground italic">—</div>}
                      {dayOrders.map((o) => {
                        const tone = getTone(o);
                        return (
                          <button key={o.id}
                            data-testid={`cal-week-order-${o.id}`}
                            onClick={() => onOpen?.(o.id)}
                            className={`block w-full text-left rounded border px-2 py-1.5 hover-elevate active-elevate-2 ${tone}`}>
                            <div className="text-[10px] font-bold uppercase truncate">{(o as any).vehiclePlate ?? (o as any).referenceNumber ?? (o as any).customerName}</div>
                            <div className="text-[10px] truncate">{(o as any).vehicleMake ?? ''} {(o as any).vehicleModel ?? (o as any).vehicleLabel ?? ''}</div>
                            <div className="text-[10px] opacity-80 truncate">{(o as any).customerName ?? (o as any).title}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(STATUS_LABEL).filter(([k]) => k !== "in_progress").map(([k, label]) => (
          <Badge key={k} variant="outline" className={`${STATUS_COLOR[k]} no-default-active-elevate`}>{label}</Badge>
        ))}
      </div>
    </div>
  );
}
