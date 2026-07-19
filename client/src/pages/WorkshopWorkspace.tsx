import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  FileText, Tag, Calendar, CheckCircle2, ArrowLeftCircle, Receipt,
  ChevronLeft, ChevronRight, Search, Loader2, Cpu, Brain,
  ChevronDown, ChevronUp, Send, ArrowRight,
} from "lucide-react";

// ── types ────────────────────────────────────────────────────────────────────

type WorkshopAction = "neue_anfragen" | "angebot" | "termin" | "annahme" | "rueckgabe" | "rechnung";
interface Tile { key: WorkshopAction; label: string; count: number; agent: string }
interface Order {
  id: string; referenceNumber: string | null;
  vehicleMake: string | null; vehicleModel: string | null; vehiclePlate: string | null;
  customerName: string; status: string; totalAmountCents: number;
  scheduledDate: string | null; createdAt: string;
}
interface Dashboard { tiles: Tile[]; totalOpenTasks: number; recentOrders: Order[] }

interface CoriSnapshot {
  active: number;
  todayCount: number;
  awaitingPickup: number;
  unpaidFinished: number;
  missingPartner: number;
  openTasks: number;
  nextScheduled: { customerName: string; vehiclePlate: string | null; scheduledDate: string } | null;
}

interface CoriResponse {
  answer: string;
  surface?: string | null;
  suggestions?: string[];
  source?: string;
}

// ── constants ─────────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<WorkshopAction, React.ComponentType<{ className?: string }>> = {
  neue_anfragen: FileText, angebot: Tag, termin: Calendar,
  annahme: CheckCircle2, rueckgabe: ArrowLeftCircle, rechnung: Receipt,
};

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
  open: { label: "Geplant", tone: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
  angenommen: { label: "Angenommen", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  in_bearbeitung: { label: "In Reparatur", tone: "bg-orange-500/15 text-orange-600 dark:text-orange-300" },
  fertig: { label: "Rückgabebereit", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  completed: { label: "Zurückgegeben", tone: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300" },
  cancelled: { label: "Storniert", tone: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300" },
};

function eur(c: number | null | undefined) {
  return ((c ?? 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function dayLabel(iso: string | null) {
  if (!iso) return "Ohne Datum";
  return new Date(iso).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long" });
}
function progressPct(status: string) {
  const m: Record<string, number> = { open: 12, angenommen: 30, in_bearbeitung: 55, fertig: 80, completed: 100, cancelled: 0 };
  return m[status] ?? 0;
}

// ── CORION OS header ──────────────────────────────────────────────────────────

function StatChip({
  label, value, href, accent,
}: {
  label: string; value: number; href?: string; accent?: "warning" | "danger";
}) {
  const base =
    accent === "danger"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : accent === "warning"
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-zinc-800 text-zinc-300 border-zinc-700";
  const inner = (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${base}`}>
      <span className="font-bold tabular-nums">{value}</span>
      <span className="opacity-75">{label}</span>
    </span>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function CorionOsHeader({ snapshot, isLoading }: { snapshot?: CoriSnapshot; isLoading: boolean }) {
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="bg-zinc-950 text-zinc-100 rounded-xl px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight leading-none">
              CORION <span className="text-primary">OS</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Operations · Finance · AI Command Center</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
          ) : snapshot ? (
            <>
              <StatChip label="Aktiv" value={snapshot.active} href="/admin" />
              <StatChip label="Heute" value={snapshot.todayCount} href="/admin/calendar" />
              {snapshot.awaitingPickup > 0 && (
                <StatChip label="Abholung" value={snapshot.awaitingPickup} href="/admin" accent="warning" />
              )}
              {snapshot.unpaidFinished > 0 && (
                <StatChip label="Unbezahlt" value={snapshot.unpaidFinished} href="/admin" accent="danger" />
              )}
              {snapshot.openTasks > 0 && (
                <StatChip label="Tasks" value={snapshot.openTasks} href="/tasks" />
              )}
            </>
          ) : null}
          <span className="text-[11px] text-zinc-600 hidden sm:block">{today}</span>
        </div>
      </div>
      {snapshot?.nextScheduled && (
        <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-2">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>
            Nächster Termin:{" "}
            <span className="text-zinc-300">
              {snapshot.nextScheduled.customerName}
              {snapshot.nextScheduled.vehiclePlate ? ` · ${snapshot.nextScheduled.vehiclePlate}` : ""}
            </span>
            {" · "}
            <span className="text-zinc-400">
              {new Date(snapshot.nextScheduled.scheduledDate).toLocaleDateString("de-DE", {
                weekday: "short", day: "2-digit", month: "short",
              })}
            </span>
          </span>
          <Link href="/admin/calendar" className="ml-auto text-primary hover:text-primary/80 flex items-center gap-0.5">
            Kalender <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── CORI inline panel ─────────────────────────────────────────────────────────

function defaultSuggestions(snapshot?: CoriSnapshot): string[] {
  const s: string[] = ["Was braucht heute meine Aufmerksamkeit?"];
  if ((snapshot?.unpaidFinished ?? 0) > 0) s.push(`${snapshot!.unpaidFinished} unbezahlte Aufträge – was tun?`);
  else if ((snapshot?.awaitingPickup ?? 0) > 0) s.push(`${snapshot!.awaitingPickup} Aufträge bereit zur Abholung`);
  s.push("Wo finde ich Finance OS?");
  if (s.length < 4) s.push("Zeige mir offene Tasks");
  return s.slice(0, 4);
}

function CoriPanel({ snapshot }: { snapshot?: CoriSnapshot }) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [response, setResponse] = useState<CoriResponse | null>(null);

  const chatMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await apiRequest("POST", "/api/cori/chat", { question: q, snapshot });
      return res.json() as Promise<CoriResponse>;
    },
    onSuccess: (data) => setResponse(data),
  });

  const ask = (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    setInput(q);
    chatMutation.mutate(q);
  };

  const suggestions = response?.suggestions ?? defaultSuggestions(snapshot);

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-950/60 overflow-hidden">
      {/* header bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-900/60 transition text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-zinc-200">CORI — Corion AI Copilot</span>
          {snapshot && (
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full hidden sm:inline">
              Live-Kontext geladen
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-zinc-800/60">
          {/* greeting / answer */}
          {!response && !chatMutation.isPending && snapshot && (
            <div className="pt-3 text-sm text-zinc-400 leading-relaxed">
              Heute:{" "}
              <span className="text-zinc-200 font-medium">{snapshot.active}</span> aktive Aufträge
              {snapshot.awaitingPickup > 0 && (
                <>, <span className="text-amber-400">{snapshot.awaitingPickup} bereit zur Abholung</span></>
              )}
              {snapshot.unpaidFinished > 0 && (
                <>, <span className="text-red-400">{snapshot.unpaidFinished} unbezahlt</span></>
              )}
              . Was kann ich für dich tun?
            </div>
          )}

          {chatMutation.isPending && (
            <div className="pt-3 flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> CORI denkt nach…
            </div>
          )}

          {response && !chatMutation.isPending && (
            <div className="pt-3 space-y-2">
              {question && (
                <div className="text-[11px] text-zinc-600">↳ {question}</div>
              )}
              <div className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                {response.answer}
              </div>
              {response.surface && (
                <Link
                  href={response.surface}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80"
                >
                  Öffnen: {response.surface} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          {/* suggestion chips */}
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => ask(s)}
                disabled={chatMutation.isPending}
                className="text-[11px] bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 px-3 py-1 rounded-full transition truncate max-w-xs"
              >
                {s}
              </button>
            ))}
          </div>

          {/* input row */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Frag CORI… z.B. was braucht heute Aufmerksamkeit?"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => ask(input)}
              disabled={chatMutation.isPending || !input.trim()}
              className="px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground rounded-lg transition"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function WorkshopWorkspace() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"list" | "month" | "tasks">("list");
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [search, setSearch] = useState("");

  const { data, isLoading: dashLoading } = useQuery<Dashboard>({
    queryKey: ["/api/workshop/dashboard"],
    enabled: !!user,
  });

  const { data: snapshot, isLoading: snapLoading } = useQuery<CoriSnapshot>({
    queryKey: ["/api/cori/snapshot"],
    enabled: !!user,
    staleTime: 60_000,
  });

  const dispatchAi = useMutation({
    mutationFn: async (vars: { action: WorkshopAction; orderId?: string }) =>
      (await apiRequest("POST", `/api/workshop/ai/${vars.action}`, { orderId: vars.orderId })).json(),
    onSuccess: (res: any) => {
      toast({ title: "AI-Agent aktiv", description: res.message ?? "Aufgabe delegiert." });
    },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message ?? "AI-Aktion fehlgeschlagen", variant: "destructive" }),
  });

  const filteredOrders = useMemo(() => {
    const list = data?.recentOrders ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) =>
      [o.referenceNumber, o.vehiclePlate, o.customerName, o.vehicleMake, o.vehicleModel]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, search]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, Order[]>();
    for (const o of filteredOrders) {
      const k = o.scheduledDate ? o.scheduledDate.slice(0, 10) : (o.createdAt ?? "").slice(0, 10);
      const arr = groups.get(k) ?? [];
      arr.push(o);
      groups.set(k, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredOrders]);

  const monthCells = useMemo(() => {
    const first = new Date(monthCursor);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), d);
      cells.push({ date: dt, key: dt.toISOString() });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, key: `tail-${cells.length}` });
    return cells;
  }, [monthCursor]);

  const ordersByDay = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of filteredOrders) {
      const k = (o.scheduledDate ?? o.createdAt ?? "").slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(o);
      map.set(k, arr);
    }
    return map;
  }, [filteredOrders]);

  if (!user || (user.role !== "admin" && user.role !== "partner")) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nur für Admin/Partner.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <SEO
        title="CORION OS | +1 Corion Lackdoktor"
        description="Corion OS – AI-first Operations Command Center: Aufträge, Termine, Finance und CORI Copilot."
      />

      {/* CORION OS header */}
      <CorionOsHeader snapshot={snapshot} isLoading={snapLoading} />

      {/* CORI inline panel */}
      <CoriPanel snapshot={snapshot} />

      {/* Quick navigation + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin"><Button variant="outline" size="sm">Auftragsliste</Button></Link>
          <Link href="/admin/calendar"><Button variant="outline" size="sm">Kalender</Button></Link>
          <Link href="/finanzen"><Button variant="outline" size="sm">Finance OS</Button></Link>
          <Link href="/tasks"><Button variant="outline" size="sm">Tasks</Button></Link>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-workshop-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen: KFZ, Kunde, Ref…"
            className="pl-8 h-9 w-56"
          />
        </div>
      </div>

      {/* Action dispatch tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(data?.tiles ?? []).map((t) => {
          const Icon = ACTION_ICONS[t.key];
          return (
            <button
              key={t.key}
              data-testid={`tile-${t.key}`}
              onClick={() => dispatchAi.mutate({ action: t.key })}
              disabled={dispatchAi.isPending}
              className="text-left rounded-md border bg-card p-3 hover-elevate active-elevate-2 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <Badge variant="secondary" className="text-[10px]">{t.agent}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div className="text-2xl font-semibold tabular-nums" data-testid={`tile-count-${t.key}`}>{t.count}</div>
            </button>
          );
        })}
      </div>

      {/* Content tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list" data-testid="tab-list">Terminübersicht</TabsTrigger>
          <TabsTrigger value="month" data-testid="tab-month">Monat</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Ausstehende Aufgaben</TabsTrigger>
        </TabsList>

        {/* Order list */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {dashLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
              ) : groupedByDay.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Keine Aufträge.</div>
              ) : (
                <ScrollArea className="h-[60vh]">
                  {groupedByDay.map(([day, orders]) => (
                    <div key={day}>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40 sticky top-0 z-50">
                        {dayLabel(day + "T00:00:00")}
                      </div>
                      {orders.map((o) => {
                        const sb = STATUS_BADGE[o.status] ?? { label: o.status, tone: "bg-muted" };
                        return (
                          <button
                            key={o.id}
                            data-testid={`row-order-${o.id}`}
                            onClick={() => navigate(`/workshop/auftrag/${o.id}`)}
                            className="w-full grid grid-cols-12 items-center gap-3 px-4 py-3 border-b text-left hover-elevate"
                          >
                            <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                              <div className="h-10 w-12 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">FOTO</div>
                              <div>
                                <div className="text-sm font-semibold uppercase">{o.vehicleMake} {o.vehicleModel}</div>
                                <div className="text-xs text-muted-foreground">{o.referenceNumber} · {o.vehiclePlate ?? "—"}</div>
                              </div>
                            </div>
                            <div className="col-span-6 md:col-span-3 text-sm truncate">{o.customerName}</div>
                            <div className="col-span-3 md:col-span-2 text-sm font-medium tabular-nums">{eur(o.totalAmountCents)}</div>
                            <div className="col-span-3 md:col-span-3 flex items-center gap-2">
                              <Badge className={`${sb.tone} no-default-active-elevate`}>{sb.label}</Badge>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct(o.status)}%` }} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Month calendar */}
        <TabsContent value="month" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base">
                {monthCursor.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" data-testid="button-prev-month"
                  onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" data-testid="button-next-month"
                  onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden text-xs">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                  <div key={d} className="bg-muted/40 px-2 py-1 text-muted-foreground">{d}</div>
                ))}
                {monthCells.map((c) => {
                  const k = c.date ? c.date.toISOString().slice(0, 10) : "";
                  const dayOrders = (k && ordersByDay.get(k)) || [];
                  return (
                    <div key={c.key} className="bg-card min-h-[88px] p-1.5 align-top">
                      {c.date && (
                        <div className="text-[10px] text-muted-foreground mb-1">{c.date.getDate()}</div>
                      )}
                      <div className="space-y-1">
                        {dayOrders.slice(0, 3).map((o) => (
                          <button
                            key={o.id}
                            data-testid={`cell-order-${o.id}`}
                            onClick={() => navigate(`/workshop/auftrag/${o.id}`)}
                            className="block w-full truncate rounded bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] text-left hover-elevate"
                          >
                            {o.vehiclePlate ?? o.referenceNumber} · {o.vehicleModel}
                          </button>
                        ))}
                        {dayOrders.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">+{dayOrders.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks summary */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Ausstehende Aufgaben</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Klick auf eine Kachel oben delegiert die Aktion an den passenden KI-Agent. Der Verlauf erscheint im{" "}
                <Link href="/tasks" className="underline">Task Board</Link>.
              </p>
              <div className="text-sm">
                Offene auftragsbezogene Tasks: <b data-testid="text-open-tasks">{data?.totalOpenTasks ?? 0}</b>
              </div>
              {snapshot && snapshot.openTasks > 0 && (
                <div className="mt-3">
                  <Link href="/tasks">
                    <Button variant="outline" size="sm">
                      {snapshot.openTasks} Tasks im Board öffnen
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
