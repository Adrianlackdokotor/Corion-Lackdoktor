import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderCrmModal from "@/components/dashboard/OrderCrmModal";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────
interface Resource {
  id: string;
  name: string;
  type: string;
  color: string | null;
  isActive: boolean;
  dailyWorkMinutes: number;
  bayCount: number;
}
interface Appointment {
  id: string;
  orderId: string | null;
  resourceId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  workMinutes: number;
  dryingMinutes: number;
  bayOccupied: boolean;
  complexity: string;
  colorOverride: string | null;
  notes?: string | null;
  driveFolderUrl?: string | null;
  localFolderPath?: string | null;
  libraryKey?: string | null;
  localFiles?: Array<{ type?: string; name?: string; path?: string }> | null;
  linkedTaskIds?: string[] | null;
  assignedPartnerUserId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  vehicleLabel?: string | null;
  priceInfo?: string | null;
  deadlineNote?: string | null;
}
interface DayLoad {
  date: string;
  resourceId: string;
  workLoadMinutes: number;
  bayLoadPeak: number;
  loadPct: number;
  status: "green" | "yellow" | "red";
  appointmentIds: string[];
}
interface CapacityResp {
  loads: DayLoad[];
  gaps: { resourceId: string; date: string; startTime: string; endTime: string; durationMinutes: number }[];
  overloads: { resourceId: string; date: string; reason: string; loadPct: number; bayLoadPeak: number }[];
}
interface SchedulerSuggestion {
  kind: "overload" | "fill_gap" | "stack_drying";
  severity: "info" | "warn" | "critical";
  resourceId: string;
  resourceName: string;
  date: string;
  message: string;
  payload: Record<string, unknown>;
}

// ── Constants ────────────────────────────────────────────────────────
const DAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7:00 – 17:00

// ── Helpers ──────────────────────────────────────────────────────────
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); }

function statusColor(status: DayLoad["status"]): string {
  if (status === "red")    return "bg-red-500/15 border-red-500/40 text-red-400";
  if (status === "yellow") return "bg-amber-500/15 border-amber-500/40 text-amber-400";
  return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
}

function fmtHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isMeaningfulValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().toUpperCase() !== "UNBEKANNT";
}

function getCalendarOrderLabel(order: any, appointment?: Appointment | null): string {
  const customer = isMeaningfulValue(order?.customerName)
    ? order.customerName.trim()
    : null;
  const plate = isMeaningfulValue(order?.vehiclePlate)
    ? order.vehiclePlate.trim()
    : null;
  const reference = isMeaningfulValue(order?.referenceNumber)
    ? order.referenceNumber.trim()
    : null;
  const fallbackTitle = isMeaningfulValue(appointment?.title)
    ? appointment!.title.trim()
    : null;

  return customer ?? plate ?? reference ?? fallbackTitle ?? "Auftrag";
}

// ── Page ─────────────────────────────────────────────────────────────
export default function AdminCalendar() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const isOsView = searchParams.get("mode") === "os";
  const appointmentIdFromQuery = searchParams.get("appointmentId");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "partner">("month");
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDraft, setAppointmentDraft] = useState<Partial<Appointment>>({});
  const [crmDialogOrder, setCrmDialogOrder] = useState<any | null>(null);
  const [crmLoadingOrderId, setCrmLoadingOrderId] = useState<string | null>(null);

  const from = startOfMonth(currentDate);
  const to = endOfMonth(currentDate);

  const { data: resources = [], isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ["/api/scheduler/resources"],
    enabled: isAuthenticated,
  });
  const { data: appointments = [], isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ["/api/scheduler/appointments", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const r = await fetch(
        `/api/scheduler/appointments?from=${from.toISOString()}&to=${to.toISOString()}`,
        { credentials: "include" },
      );
      if (!r.ok) throw new Error("Termine konnten nicht geladen werden");
      return r.json();
    },
    enabled: isAuthenticated,
  });

  const { data: workshopOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/workshop-orders"],
    enabled: isAuthenticated,
  });
  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/workshop/partners"],
    enabled: isAuthenticated,
  });

  // Fallback: fetch a single order by ID when the full workshopOrders cache didn't match.
  const { data: fallbackOrderData } = useQuery<any>({
    queryKey: ["/api/admin/workshop-orders", crmLoadingOrderId],
    queryFn: async () => {
      if (!crmLoadingOrderId) return null;
      const r = await fetch(`/api/admin/workshop-orders/${crmLoadingOrderId}`, { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!crmLoadingOrderId,
  });
  useEffect(() => {
    if (fallbackOrderData && crmLoadingOrderId) {
      const o = fallbackOrderData.order ?? fallbackOrderData;
      if (o?.id) {
        setCrmDialogOrder(o);
        setCrmLoadingOrderId(null);
      }
    }
  }, [fallbackOrderData, crmLoadingOrderId]);
  const { data: capacity, isLoading: loadingCap } = useQuery<CapacityResp>({
    queryKey: ["/api/scheduler/capacity", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const r = await fetch(
        `/api/scheduler/capacity?from=${from.toISOString()}&to=${to.toISOString()}`,
        { credentials: "include" },
      );
      if (!r.ok) throw new Error("Capacity check failed");
      return r.json();
    },
    enabled: isAuthenticated,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (persist: boolean) => {
      const r = await apiRequest("POST", "/api/scheduler/analyze", {
        persist,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      return r.json();
    },
    onSuccess: (d) => {
      toast({
        title: "Scheduler AI gestartet",
        description: `${d.suggestions?.length ?? 0} Vorschläge${d.tasksCreated ? ` · ${d.tasksCreated} Tasks erstellt` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      setLastSuggestions(d.suggestions ?? []);
    },
    onError: (e: any) => toast({
      title: "Scheduler-Fehler", description: e?.message ?? "Unbekannter Fehler", variant: "destructive",
    }),
  });
  const [lastSuggestions, setLastSuggestions] = useState<SchedulerSuggestion[]>([]);

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Appointment> }) => {
      const r = await apiRequest('PATCH', `/api/hub/appointments/${id}`, data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/appointments'] });
      toast({ title: 'Kalender-Eintrag aktualisiert' });
    },
    onError: (e: any) => toast({ title: 'Fehler', description: e?.message || 'Update fehlgeschlagen', variant: 'destructive' }),
  });

  // ── Derived data ───────────────────────────────────────────────────
  const visibleResources = useMemo(
    () => (selectedResources.size === 0 ? resources : resources.filter((r) => selectedResources.has(r.id))),
    [resources, selectedResources],
  );

  const loadByDay = useMemo(() => {
    const map = new Map<string, DayLoad[]>();
    for (const l of capacity?.loads ?? []) {
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    }
    return map;
  }, [capacity]);

  // Pre-bucket appointments by day and by (day,resource) so render loops are O(1) lookups.
  const apptsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = dateKey(new Date(a.startTime));
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    return map;
  }, [appointments]);
  const apptsByDayResource = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = `${dateKey(new Date(a.startTime))}|${a.resourceId}`;
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    return map;
  }, [appointments]);

  // ── Render helpers ─────────────────────────────────────────────────
  const monthGrid = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last = endOfMonth(currentDate);
    const startWeekday = (first.getDay() + 6) % 7; // Mo=0
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() - (startWeekday - i));
      cells.push({ date: d, inMonth: false });
    }
    for (let day = 1; day <= last.getDate(); day++) {
      cells.push({ date: new Date(first.getFullYear(), first.getMonth(), day), inMonth: true });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const d = new Date(cells[cells.length - 1].date);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
      if (cells.length >= 42) break;
    }
    return cells;
  }, [currentDate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!appointmentIdFromQuery || appointments.length === 0) return;
    const match = appointments.find((a) => a.id === appointmentIdFromQuery);
    if (match) {
      setSelectedAppointment(match);
      setAppointmentDraft({ ...match });
    }
  }, [appointmentIdFromQuery, appointments]);

  // Resolve the canonical workshopOrder for a calendar appointment.
  // workshopOrder links TO appointment via appointmentId (not the reverse).
  function resolveWorkshopOrder(appt: Appointment): any | null {
    const orders = workshopOrders || [];
    return (
      orders.find((o: any) => o.appointmentId === appt.id) ??
      orders.find((o: any) => o.id === appt.orderId) ??
      null
    );
  }

  function openCrmForAppointment(appt: Appointment) {
    const matched = resolveWorkshopOrder(appt);
    if (matched) {
      setCrmDialogOrder(matched);
    } else if (appt.orderId) {
      // workshopOrders cache miss — fetch the specific order
      setCrmLoadingOrderId(appt.orderId);
    }
    // If no orderId at all: fall through to appointment dialog (caller's responsibility)
  }

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const overloadCount = capacity?.overloads.length ?? 0;
  const gapCount = capacity?.gaps.length ?? 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
      <SEO title="Smart Calendar | Corion Lackdoktor" description="Calendar inteligent cu capacitate de partener și agent AI Scheduler." />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
          <CalendarIcon className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold" data-testid="text-calendar-title">
              {isOsView ? 'Kalender OS View' : 'Admin Kalender'} · {MONTHS_DE[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <p className="text-xs text-muted-foreground">
              {resources.length} Partner · {appointments.length} Termine ·{" "}
              {overloadCount > 0 ? <span className="text-red-400">{overloadCount} Überlastung</span> : "Keine Überlastungen"}
              {gapCount > 0 && <span className="text-emerald-500"> · {gapCount} freie Fenster</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} data-testid="button-prev-month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} data-testid="button-today">Heute</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} data-testid="button-next-month">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isOsView && (
            <Button
              variant="default"
              onClick={() => analyzeMutation.mutate(true)}
              disabled={analyzeMutation.isPending}
              data-testid="button-run-scheduler"
            >
              {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Scheduler AI
            </Button>
          )}
        </div>
      </div>

      {/* View tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="month" data-testid="tab-view-month">Monat</TabsTrigger>
          <TabsTrigger value="week" data-testid="tab-view-week">Woche</TabsTrigger>
          <TabsTrigger value="day" data-testid="tab-view-day">Tag</TabsTrigger>
          <TabsTrigger value="partner" data-testid="tab-view-partner">Pe partener</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Partner filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Partner-Filter
            {selectedResources.size > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={() => setSelectedResources(new Set())} data-testid="button-clear-filters">
                Zurücksetzen
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {loadingResources && <Loader2 className="w-4 h-4 animate-spin" />}
          {resources.map((r) => {
            const active = selectedResources.size === 0 || selectedResources.has(r.id);
            return (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedResources((prev) => {
                    const next = new Set(prev);
                    if (next.has(r.id)) next.delete(r.id);
                    else next.add(r.id);
                    return next;
                  });
                }}
                className={`hover-elevate active-elevate-2 rounded-md border px-3 py-1.5 text-xs flex items-center gap-2 ${active ? "border-primary/40 bg-primary/5" : "border-border opacity-50"}`}
                data-testid={`filter-partner-${r.id}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: r.color || "#888" }} />
                {r.name}
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{r.bayCount}🏭 · {Math.round(r.dailyWorkMinutes / 60)}h</Badge>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Suggestions panel */}
      {!isOsView && showSuggestions && lastSuggestions.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Scheduler AI – Empfehlungen
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>Schließen</Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lastSuggestions.slice(0, 8).map((s, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-md border ${
                s.severity === "critical" ? "border-red-500/40 bg-red-500/5" :
                s.severity === "warn" ? "border-amber-500/40 bg-amber-500/5" :
                "border-emerald-500/30 bg-emerald-500/5"}`} data-testid={`suggestion-${i}`}>
                {s.severity === "critical" ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> : <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="font-medium">{s.resourceName} · {s.date}</div>
                  <div className="text-muted-foreground text-xs">{s.message}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Month view (always-visible grid) ──────────────────────── */}
      {view === "month" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {DAYS_DE.map((d) => (
                <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center border-r last:border-r-0">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthGrid.map((cell, idx) => {
                const k = dateKey(cell.date);
                const dayLoads = (loadByDay.get(k) ?? []).filter(
                  (l) => selectedResources.size === 0 || selectedResources.has(l.resourceId),
                );
                const dayAppts = (apptsByDay.get(k) ?? []).filter(
                  (a) => selectedResources.size === 0 || selectedResources.has(a.resourceId),
                );
                const isToday = dateKey(new Date()) === k;
                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] border-r border-b last:border-r-0 p-1.5 ${cell.inMonth ? "" : "opacity-40 bg-muted/20"} ${isToday ? "ring-1 ring-primary/40" : ""}`}
                    data-testid={`day-cell-${k}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>{cell.date.getDate()}</span>
                      {dayLoads.length > 0 && (
                        <div className="flex gap-0.5">
                          {dayLoads.slice(0, 3).map((l) => (
                            <span
                              key={l.resourceId}
                              title={`${Math.round(l.loadPct * 100)}% · Bay ${l.bayLoadPeak}`}
                              className={`w-1.5 h-1.5 rounded-full ${
                                l.status === "red" ? "bg-red-500" :
                                l.status === "yellow" ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 3).map((a) => {
                        const r = resources.find((x) => x.id === a.resourceId);
                        const linked = resolveWorkshopOrder(a);
                        const label = linked ? getCalendarOrderLabel(linked, a) : a.title;
                        return (
                          <button
                            key={a.id}
                            className="text-[10px] px-1.5 py-0.5 rounded truncate text-left w-full"
                            style={{ background: (a.colorOverride || r?.color || "#666") + "33", borderLeft: `2px solid ${a.colorOverride || r?.color || "#666"}` }}
                            title={label}
                            data-testid={`appt-${a.id}`}
                            onClick={() => {
                              // Always prefer CRM modal for order-linked appointments.
                              const linked = resolveWorkshopOrder(a);
                              if (linked) {
                                setCrmDialogOrder(linked);
                                return;
                              }
                              if (a.orderId) {
                                setCrmLoadingOrderId(a.orderId);
                                return;
                              }
                              // Pure calendar appointment (no order link) → appointment dialog
                              const linkedOrder = (workshopOrders || []).find((order: any) => order.appointmentId === a.id || order.scheduledDate === a.startTime || (order.vehiclePlate && a.title?.includes(order.vehiclePlate)));
                              setSelectedAppointment(a);
                              setAppointmentDraft({
                                ...a,
                                driveFolderUrl: (a as any).driveFolderUrl || linkedOrder?.driveFolderUrl || null,
                                localFolderPath: (a as any).localFolderPath || linkedOrder?.localFolderPath || null,
                                libraryKey: (a as any).libraryKey || linkedOrder?.libraryKey || null,
                                localFiles: (a as any).localFiles || ((linkedOrder?.attachments || []).map((att: any) => ({ name: att.originalName, path: att.driveLink || att.filename, type: att.mimeType }))),
                              });
                            }}
                          >
                            {fmtHHMM(a.startTime)} {label}
                          </button>
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayAppts.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Per-Partner swimlane view ─────────────────────────────── */}
      {view === "partner" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {visibleResources.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Niciun partner activ.</div>
            ) : (
              <div className="min-w-[900px]">
                <div className="grid border-b" style={{ gridTemplateColumns: `200px repeat(${monthGrid.length}, minmax(36px, 1fr))` }}>
                  <div className="p-2 text-xs font-medium text-muted-foreground border-r">Partner</div>
                  {monthGrid.map((c, i) => (
                    <div key={i} className={`text-[10px] text-center py-1 border-r last:border-r-0 ${c.inMonth ? "" : "opacity-40"}`}>
                      {c.date.getDate()}
                    </div>
                  ))}
                </div>
                {visibleResources.map((r) => (
                  <div key={r.id} className="grid border-b" style={{ gridTemplateColumns: `200px repeat(${monthGrid.length}, minmax(36px, 1fr))` }}>
                    <div className="p-2 border-r flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: r.color || "#888" }} />
                      <div>
                        <div className="text-xs font-medium">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground">{r.bayCount} bay · {Math.round(r.dailyWorkMinutes / 60)}h/zi</div>
                      </div>
                    </div>
                    {monthGrid.map((c, i) => {
                      const k = dateKey(c.date);
                      const load = (loadByDay.get(k) ?? []).find((l) => l.resourceId === r.id);
                      if (!load) return <div key={i} className={`border-r last:border-r-0 ${c.inMonth ? "" : "opacity-30"}`} />;
                      return (
                        <div
                          key={i}
                          className={`border-r last:border-r-0 text-[10px] flex items-center justify-center font-medium ${statusColor(load.status)} ${c.inMonth ? "" : "opacity-40"}`}
                          title={`${Math.round(load.loadPct * 100)}% manoperă · ${load.bayLoadPeak} bay`}
                          data-testid={`load-${r.id}-${k}`}
                        >
                          {load.workLoadMinutes > 0 ? `${Math.round(load.loadPct * 100)}%` : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Day / Week view (Google-style overlapping) ────────────── */}
      {(view === "day" || view === "week") && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[700px]">
              {(() => {
                const days = view === "day" ? [currentDate] : (() => {
                  const start = new Date(currentDate);
                  const dow = (start.getDay() + 6) % 7;
                  start.setDate(start.getDate() - dow);
                  return Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(start); d.setDate(start.getDate() + i); return d;
                  });
                })();

                return (
                  <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length * Math.max(1, visibleResources.length || 1)}, minmax(80px,1fr))` }}>
                    {/* Header */}
                    <div className="border-b border-r p-1" />
                    {days.flatMap((d) =>
                      (visibleResources.length === 0 ? [{ id: "all", name: "—", color: "#888" } as any] : visibleResources).map((r) => (
                        <div key={`${dateKey(d)}-${r.id}`} className="border-b border-r p-1 text-[10px] text-center">
                          <div className="font-medium">{DAYS_DE[(d.getDay() + 6) % 7]} {d.getDate()}</div>
                          <div className="text-muted-foreground truncate">{r.name}</div>
                        </div>
                      )),
                    )}
                    {/* Hour rows */}
                    {HOURS.map((h) => (
                      <DayRow
                        key={h}
                        hour={h}
                        days={days}
                        resources={visibleResources.length === 0 ? [{ id: "all", name: "—", color: "#888" } as any] : visibleResources}
                        appointments={appointments}
                        resolveWorkshopOrder={resolveWorkshopOrder}
                        setCrmDialogOrder={setCrmDialogOrder}
                        setCrmLoadingOrderId={setCrmLoadingOrderId}
                        setSelectedAppointment={setSelectedAppointment}
                        setAppointmentDraft={setAppointmentDraft}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selectedAppointment)} onOpenChange={(open) => { if (!open) { setSelectedAppointment(null); setAppointmentDraft({}); } }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Kalender-Eintrag Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 text-sm">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="auftrag">Auftrag</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground">Titel</p><Input value={String((appointmentDraft as any).title || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, title: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Status</p><Input value={String((appointmentDraft as any).status || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, status: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Kunde</p><Input value={String((appointmentDraft as any).customerName || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, customerName: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Telefon</p><Input value={String((appointmentDraft as any).customerPhone || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, customerPhone: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Fahrzeug</p><Input value={String((appointmentDraft as any).vehicleLabel || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, vehicleLabel: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Preis</p><Input value={String((appointmentDraft as any).priceInfo || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, priceInfo: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Von</p><Input value={String((appointmentDraft as any).startTime || '').slice(0,16)} onChange={(e) => setAppointmentDraft((p) => ({ ...p, startTime: e.target.value }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Bis</p><Input value={String((appointmentDraft as any).endTime || '').slice(0,16)} onChange={(e) => setAppointmentDraft((p) => ({ ...p, endTime: e.target.value }))} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="auftrag" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground">Work Minutes</p><Input value={String((appointmentDraft as any).workMinutes ?? '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, workMinutes: Number(e.target.value || 0) }))} /></div>
                    <div><p className="text-xs text-muted-foreground">Drying Minutes</p><Input value={String((appointmentDraft as any).dryingMinutes ?? '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, dryingMinutes: Number(e.target.value || 0) }))} /></div>
                    <div className="md:col-span-2"><p className="text-xs text-muted-foreground">Deadline</p><Input value={String((appointmentDraft as any).deadlineNote || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, deadlineNote: e.target.value }))} /></div>
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Operativer Kontext / Auftrag</p>
                    <Textarea value={String((appointmentDraft as any).notes || '')} onChange={(e) => setAppointmentDraft((p) => ({ ...p, notes: e.target.value }))} className="min-h-[120px]" />
                  </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-4 mt-4">
                  <div className="rounded-lg border p-3 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Drive Folder</p>
                      {(appointmentDraft as any).driveFolderUrl ? <a className="text-sm text-blue-400 underline break-all" href={String((appointmentDraft as any).driveFolderUrl)} target="_blank" rel="noreferrer">{String((appointmentDraft as any).driveFolderUrl)}</a> : <p className="text-sm text-muted-foreground">Kein Drive-Link hinterlegt.</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Local Client Folder</p>
                      {(appointmentDraft as any).localFolderPath ? <p className="text-sm text-muted-foreground break-all">{String((appointmentDraft as any).localFolderPath)}</p> : <p className="text-sm text-muted-foreground">Kein lokaler Client-Ordner hinterlegt.</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Library Key</p>
                      {(appointmentDraft as any).libraryKey ? <p className="text-sm text-muted-foreground break-all">{String((appointmentDraft as any).libraryKey)}</p> : <p className="text-sm text-muted-foreground">Kein Library-Key hinterlegt.</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Lokale Dateien</p>
                      <div className="space-y-2">
                        {Array.isArray((appointmentDraft as any).localFiles) && (appointmentDraft as any).localFiles.length > 0 ? (appointmentDraft as any).localFiles.map((file: any, idx: number) => (
                          <div key={idx} className="rounded border px-3 py-2 text-xs">
                            <p className="font-medium">{file.name || 'Datei'}</p>
                            <p className="text-muted-foreground break-all">{file.path || ''}</p>
                          </div>
                        )) : <p className="text-sm text-muted-foreground">Keine lokalen Dateien hinterlegt.</p>}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4 mt-4">
                  <div className="rounded-lg border p-3 space-y-2 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Linked Tasks:</span> {Array.isArray((appointmentDraft as any).linkedTaskIds) ? (appointmentDraft as any).linkedTaskIds.join(', ') : 'Noch keine verlinkten Tasks.'}</p>
                    <p><span className="font-medium text-foreground">Agent Actions:</span> Admin soll von hier aus User-Tasks, Agent-Tasks und Delegation direkt auslösen können.</p>
                  </div>
                  {!isOsView && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const existing = Array.isArray((appointmentDraft as any).linkedTaskIds) ? (appointmentDraft as any).linkedTaskIds : [];
                        const generatedId = `manual-${Date.now()}`;
                        setAppointmentDraft((p) => ({ ...p, linkedTaskIds: [...existing, generatedId] }));
                      }}>Task verknüpfen</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const note = `${String((appointmentDraft as any).notes || '')}\n[Delegation] Bitte Partnerzuweisung prüfen oder ändern.`.trim();
                        setAppointmentDraft((p) => ({ ...p, notes: note }));
                      }}>Delegation vormerken</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const note = `${String((appointmentDraft as any).notes || '')}\n[Agent Action] Folgeaktion für AI / User erforderlich.`.trim();
                        setAppointmentDraft((p) => ({ ...p, notes: note }));
                      }}>Agent Action markieren</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-between gap-2">
                <div>
                  {(selectedAppointment.orderId || resolveWorkshopOrder(selectedAppointment)) && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          openCrmForAppointment(selectedAppointment);
                          setSelectedAppointment(null);
                          setAppointmentDraft({});
                        }}
                      >
                        Kundendossier öffnen
                      </Button>
                      {selectedAppointment.orderId && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/workshop/auftrag/${selectedAppointment.orderId}`)}
                        >
                          Zum Auftrag →
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {!isOsView && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setSelectedAppointment(null); setAppointmentDraft({}); }}>Abbrechen</Button>
                    <Button onClick={() => updateAppointmentMutation.mutate({ id: selectedAppointment.id, data: appointmentDraft as Partial<Appointment> })} disabled={updateAppointmentMutation.isPending}>
                      {updateAppointmentMutation.isPending ? 'Speichert...' : 'Speichern'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OrderCrmModal
        order={crmDialogOrder}
        partners={partners as any[]}
        allOrders={workshopOrders as any[]}
        onClose={() => setCrmDialogOrder(null)}
      />
    </div>
  );
}

function DayRow({
  hour, days, resources, appointments,
  resolveWorkshopOrder,
  setCrmDialogOrder,
  setCrmLoadingOrderId,
  setSelectedAppointment,
  setAppointmentDraft,
}: {
  hour: number;
  days: Date[];
  resources: Resource[];
  appointments: Appointment[];
  resolveWorkshopOrder: (appt: Appointment) => any | null;
  setCrmDialogOrder: (order: any) => void;
  setCrmLoadingOrderId: (id: string) => void;
  setSelectedAppointment: (appt: Appointment | null) => void;
  setAppointmentDraft: (draft: Partial<Appointment>) => void;
}) {
  return (
    <>
      <div className="border-b border-r text-[10px] text-muted-foreground p-1 text-right">{String(hour).padStart(2, "0")}:00</div>
      {days.flatMap((d) =>
        resources.map((r) => {
          const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const slotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0).getTime();
          const slotEnd = slotStart + 60 * 60 * 1000;
          const dayBucket = appointments.filter((a) => {
            const s = new Date(a.startTime);
            return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth() && s.getDate() === d.getDate();
          });
          const list = dayBucket.filter((a) => {
            if (r.id !== "all" && a.resourceId !== r.id) return false;
            return new Date(a.startTime).getTime() < slotEnd && new Date(a.endTime).getTime() > slotStart;
          });
          void dayKey;
          return (
            <div key={`${dateKey(d)}-${r.id}-${hour}`} className="border-b border-r relative min-h-[44px]">
              {list.map((a, i) => {
                const overlap = list.length > 1;
                const linked = resolveWorkshopOrder(a);
                const label = linked ? getCalendarOrderLabel(linked, a) : a.title;
                return (
                  <button
                    key={a.id}
                    className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded text-[10px] px-1 py-0.5 truncate text-left"
                    style={{
                      background: (a.colorOverride || r.color || "#666") + (overlap ? "55" : "AA"),
                      borderLeft: `3px solid ${a.colorOverride || r.color || "#666"}`,
                      left: overlap ? `${i * 6 + 2}px` : "2px",
                      right: overlap ? `${(list.length - 1 - i) * 6 + 2}px` : "2px",
                    }}
                    title={`${label} · ${fmtHHMM(a.startTime)}–${fmtHHMM(a.endTime)} · work ${a.workMinutes}m, dry ${a.dryingMinutes}m`}
                    data-testid={`hour-appt-${a.id}-${hour}`}
                    onClick={() => {
                      const linked = resolveWorkshopOrder(a);
                      if (linked) {
                        setCrmDialogOrder(linked);
                        return;
                      }
                      if (a.orderId) {
                        setCrmLoadingOrderId(a.orderId);
                        return;
                      }
                      setSelectedAppointment(a);
                      setAppointmentDraft(a);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          );
        }),
      )}
    </>
  );
}
