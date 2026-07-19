import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { CashFlowChart, type CashflowSnapshot } from "@/components/cfo/CashFlowChart";
import type { WorkshopOrder } from "@shared/schema";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Banknote,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Bot,
  Settings2,
  RefreshCcw,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  CalendarOff,
  Zap,
} from "lucide-react";

// ── Widget registry ────────────────────────────────────────────────────
type WidgetId = "cashflow" | "attention" | "operations" | "intelligence" | "agent";

const WIDGET_REGISTRY: { id: WidgetId; label: string; description: string; colSpan: 1 | 2 }[] = [
  { id: "cashflow",      label: "Cashflow Trend",    description: "6-Monats-Kurve",    colSpan: 2 },
  { id: "attention",    label: "Handlungsbedarf",   description: "Aktionspunkte",     colSpan: 2 },
  { id: "operations",   label: "Operative Signale", description: "Rohdaten",          colSpan: 1 },
  { id: "intelligence", label: "KI-Analyse",        description: "CFO-Einschätzung",  colSpan: 1 },
  { id: "agent",        label: "Finance Agent",     description: "Freitext-Abfragen", colSpan: 1 },
];

const WIDGET_STORAGE_KEY = "finance-dashboard-widgets";
const WIDGET_ORDER_KEY   = "finance-dashboard-order";

const DEFAULT_VISIBLE: Record<WidgetId, boolean> = {
  cashflow: true, attention: true, operations: true, intelligence: true, agent: true,
};
const DEFAULT_ORDER: WidgetId[] = ["cashflow", "attention", "operations", "intelligence", "agent"];

function loadVisible(): Record<WidgetId, boolean> {
  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    return raw ? { ...DEFAULT_VISIBLE, ...JSON.parse(raw) } : DEFAULT_VISIBLE;
  } catch { return DEFAULT_VISIBLE; }
}

function loadOrder(): WidgetId[] {
  try {
    const raw = localStorage.getItem(WIDGET_ORDER_KEY);
    if (!raw) return DEFAULT_ORDER;
    const saved: WidgetId[] = JSON.parse(raw);
    const validSet = new Set(DEFAULT_ORDER);
    const filtered = saved.filter(id => validSet.has(id));
    const missing  = DEFAULT_ORDER.filter(id => !filtered.includes(id));
    return [...filtered, ...missing];
  } catch { return DEFAULT_ORDER; }
}

// ── Helpers ────────────────────────────────────────────────────────────
function fmtEur(cents: number): string {
  if (cents >= 100_000_00) return `${(cents / 100_000_00).toFixed(1).replace(".", ",")} Mio €`;
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
}

function deltaPct(current: number, prev: number): number | null {
  if (!prev) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

// ── Attention layer types + constants ─────────────────────────────────
type AttentionCategory = "urgent" | "overdue" | "blocked" | "finance" | "payout" | "timing";
type AttentionSeverity = "critical" | "warning" | "info";

interface AttentionItem {
  id: string;
  category: AttentionCategory;
  severity: AttentionSeverity;
  title: string;
  why: string;
  count: number;
  amount?: number;
  action: string;
  href?: string;
}

const SEV_RANK: Record<AttentionSeverity, number> = { critical: 0, warning: 1, info: 2 };

const SEV_SHORT: Record<AttentionSeverity, string> = {
  critical: "Kritisch", warning: "Achtung", info: "Hinweis",
};

const CAT_LABEL: Record<AttentionCategory, string> = {
  urgent:  "Dringend",
  overdue: "Überfällig",
  blocked: "Blockiert",
  finance: "Finanz",
  payout:  "Auszahlung",
  timing:  "Terminplanung",
};

const ATTEN_STYLE: Record<AttentionSeverity, { bar: string; bg: string; border: string; badge: string; ring: string }> = {
  critical: {
    bar:    "bg-rose-500",
    bg:     "bg-rose-500/5",
    border: "border-rose-500/25",
    badge:  "bg-rose-500/15 text-rose-300 border-rose-500/30",
    ring:   "ring-1 ring-rose-500/60 ring-offset-1 ring-offset-zinc-900",
  },
  warning: {
    bar:    "bg-amber-500",
    bg:     "bg-amber-500/5",
    border: "border-amber-500/25",
    badge:  "bg-amber-500/15 text-amber-300 border-amber-500/30",
    ring:   "ring-1 ring-amber-500/60 ring-offset-1 ring-offset-zinc-900",
  },
  info: {
    bar:    "bg-sky-500",
    bg:     "bg-sky-500/5",
    border: "border-sky-500/20",
    badge:  "bg-sky-500/15 text-sky-300 border-sky-500/30",
    ring:   "ring-1 ring-sky-500/60 ring-offset-1 ring-offset-zinc-900",
  },
};

// ── Attention panel ────────────────────────────────────────────────────
function AttentionPanel({ items, loading, highlightedIds }: {
  items: AttentionItem[];
  loading: boolean;
  highlightedIds?: string[];
}) {
  const critCount   = items.filter(i => i.severity === "critical").length;
  const warnCount   = items.filter(i => i.severity === "warning").length;
  const isHighlight = (id: string) => !!highlightedIds?.includes(id);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-bold text-white">Handlungsbedarf</p>
        </div>
        <div className="flex items-center gap-1.5">
          {critCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {critCount} kritisch
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {warnCount} Achtung
            </span>
          )}
          {!loading && items.length === 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Alles im Griff
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />)}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Keine offenen Aktionspunkte</p>
              <p className="text-xs text-zinc-600 mt-0.5">Alle kritischen Signale sind clear.</p>
            </div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(item => {
              const s = ATTEN_STYLE[item.severity];
              const highlighted = isHighlight(item.id);
              return (
                <div key={item.id} className={`flex gap-3 p-3 rounded-lg border transition-all ${s.border} ${s.bg}${highlighted ? ` ${s.ring}` : ""}`}>
                  <div className={`w-0.5 rounded-full self-stretch flex-shrink-0 ${s.bar}`} />
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.badge}`}>
                        {SEV_SHORT[item.severity]}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        {CAT_LABEL[item.category]}
                      </span>
                    </div>
                    {/* Count + amount */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-white tabular-nums leading-none">{item.count}</span>
                      {item.amount != null && item.amount > 0 && (
                        <span className="text-[11px] text-zinc-400 tabular-nums font-semibold">{fmtEur(item.amount)}</span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-xs font-semibold text-zinc-200 leading-snug">{item.title}</p>
                    {/* Why */}
                    <p className="text-[11px] text-zinc-500 leading-relaxed flex-1">{item.why}</p>
                    {/* Action */}
                    <div className="pt-0.5">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
                        >
                          {item.action}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-zinc-600">{item.action}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  positiveIsGood?: boolean;
  accentClass: string;
  icon: React.ElementType;
  loading?: boolean;
}

function KpiCard({ label, value, sub, delta, positiveIsGood = true, accentClass, icon: Icon, loading }: KpiCardProps) {
  const isUp   = delta != null && delta >= 0;
  const isGood = delta != null ? isUp === positiveIsGood : null;

  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</p>
          {loading ? (
            <div className="h-7 w-28 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-black text-white tabular-nums truncate">{value}</p>
          )}
          {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
          {delta != null && !loading && (
            <p className={`text-[11px] font-semibold mt-1.5 tabular-nums ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
              {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs. Vorperiode
            </p>
          )}
        </div>
        <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

// ── Signal row ─────────────────────────────────────────────────────────
interface SignalRowProps {
  label: string;
  count: number;
  value?: string;
  borderClass: string;
  iconClass: string;
  icon: React.ElementType;
  href?: string;
}

function SignalRow({ label, count, value, borderClass, iconClass, icon: Icon, href }: SignalRowProps) {
  const inner = (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-md border ${borderClass} transition-colors`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} />
        <span className="text-xs text-zinc-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[11px] text-zinc-500 tabular-nums">{value}</span>}
        <span className="text-sm font-black text-white tabular-nums">{count}</span>
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block hover:opacity-80">{inner}</Link>;
  return inner;
}

// ── Intelligence panel ─────────────────────────────────────────────────
interface AdviceItem {
  severity: "positive" | "info" | "warning" | "critical";
  title: string;
  body: string;
  action?: string;
}
interface AdviceResponse { advice: AdviceItem[]; cached: boolean; source?: string; }

const SEV_STYLE: Record<AdviceItem["severity"], { bar: string; icon: React.ElementType; iconClass: string; badge: string }> = {
  critical: { bar: "bg-rose-500",    icon: AlertCircle,   iconClass: "text-rose-400",    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  warning:  { bar: "bg-amber-500",   icon: AlertTriangle, iconClass: "text-amber-400",   badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  info:     { bar: "bg-zinc-500",    icon: Info,          iconClass: "text-zinc-400",    badge: "bg-zinc-700 text-zinc-400 border-zinc-600" },
  positive: { bar: "bg-emerald-500", icon: CheckCircle2,  iconClass: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};
const SEV_LABEL: Record<AdviceItem["severity"], string> = {
  critical: "Kritisch", warning: "Achtung", info: "Hinweis", positive: "Positiv",
};

function IntelligencePanel({ snapshot }: { snapshot: CashflowSnapshot | null }) {
  const adviceMutation = useMutation<AdviceResponse, Error, CashflowSnapshot>({
    mutationFn: async (snap) => {
      const res = await fetch("/api/cfo/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ snapshot: snap }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const run = () => { if (snapshot && !adviceMutation.isPending) adviceMutation.mutate(snapshot); };
  const advice = adviceMutation.data?.advice ?? [];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-white">KI-Analyse</p>
          {adviceMutation.data?.cached && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Cache</span>
          )}
        </div>
        <button
          onClick={run}
          disabled={!snapshot || adviceMutation.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          {adviceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
          Analysieren
        </button>
      </div>
      <div className="flex-1 p-3 space-y-2 min-h-[160px]">
        {adviceMutation.isPending && (
          <div className="flex items-center justify-center py-10 gap-2 text-zinc-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" /> Analyse läuft…
          </div>
        )}
        {!adviceMutation.isPending && advice.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Sparkles className="w-6 h-6 text-zinc-700" />
            <p className="text-xs text-zinc-600">
              {snapshot ? "Analysieren klicken um KI-Einschätzung zu laden." : "Cashflow-Daten werden geladen..."}
            </p>
          </div>
        )}
        {advice.map((item, i) => {
          const s = SEV_STYLE[item.severity];
          const SevIcon = s.icon;
          return (
            <div key={i} className="flex gap-3 p-3 rounded-md bg-zinc-950/60 border border-zinc-800">
              <div className={`w-0.5 rounded-full self-stretch ${s.bar} flex-shrink-0`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <SevIcon className={`w-3 h-3 flex-shrink-0 ${s.iconClass}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.badge}`}>{SEV_LABEL[item.severity]}</span>
                </div>
                <p className="text-xs font-semibold text-zinc-200 leading-snug">{item.title}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{item.body}</p>
                {item.action && <p className="text-[10px] text-primary mt-1">→ {item.action}</p>}
              </div>
            </div>
          );
        })}
        {adviceMutation.isError && (
          <p className="text-xs text-rose-400 p-3">Analyse fehlgeschlagen. Bitte erneut versuchen.</p>
        )}
      </div>
    </div>
  );
}

// ── Finance agent ─────────────────────────────────────────────────────
interface AgentSignalSummary {
  fertigUnpaidCount: number;
  unpaidCents: number;
  overdueCount: number;
  openNoPartnerCount: number;
  inProgressCount: number;
  noPayoutPartnerCount: number;
  noPayoutCents: number;
  unscheduledActiveCount: number;
}

interface AgentDrilldown {
  href: string;
  reason: string;
}

interface AgentResponse {
  answer: string;
  relevantItemIds?: string[];
  drilldowns?: AgentDrilldown[];
  source?: string;
}

const DRILLDOWN_LABEL: Record<string, string> = {
  "/auftraege":             "Auftragsliste",
  "/admin":                 "Admin Pipeline",
  "/admin/calendar":        "Kalender",
  "/admin/partner-payouts": "Auszahlungslücken",
  "/finanzen/detail":       "Cashflow-Detail",
  "/cfo-inbox":             "CFO-Eingang",
};

const QUICK_QUESTIONS = [
  "Was braucht heute Aufmerksamkeit?",
  "Wie ist der Umsatz-Trend?",
  "Warum ist der Gewinn gesunken?",
  "Welche Aufträge blockieren Partner-Auszahlungen?",
];

function AgentPanel({
  attentionItems,
  signalSummary,
  snapshot,
  onHighlight,
}: {
  attentionItems: AttentionItem[];
  signalSummary: AgentSignalSummary;
  snapshot: CashflowSnapshot | null;
  onHighlight: (ids: string[]) => void;
}) {
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");

  const agentMutation = useMutation<AgentResponse, Error, string>({
    mutationFn: async (q) => {
      const res = await fetch("/api/cfo/agent-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: q,
          context: { attentionItems, signals: signalSummary, snapshot },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: (data) => {
      onHighlight(data.relevantItemIds ?? []);
    },
  });

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed || agentMutation.isPending) return;
    setLastQuestion(trimmed);
    setQuestion("");
    agentMutation.mutate(trimmed);
  }

  function reset() {
    agentMutation.reset();
    onHighlight([]);
    setLastQuestion("");
  }

  const response = agentMutation.data;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-white">Finance Agent</p>
          {response?.source === "heuristic" && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Heuristik</span>
          )}
        </div>
        {response && (
          <button onClick={reset} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
            Neue Frage
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto min-h-[180px]">

        {/* Pending */}
        {agentMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 py-6 justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analysiere Dashboard-Daten…
          </div>
        )}

        {/* Error */}
        {agentMutation.isError && !agentMutation.isPending && (
          <p className="text-xs text-rose-400 py-2">Fehler. Bitte erneut versuchen.</p>
        )}

        {/* Answer */}
        {response && !agentMutation.isPending && (
          <div className="flex flex-col gap-2 flex-1">
            {lastQuestion && (
              <p className="text-[11px] text-zinc-600 italic truncate">„{lastQuestion}"</p>
            )}
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 flex-1">
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{response.answer}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {(response.drilldowns ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(response.drilldowns ?? []).map((d, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <Link
                        href={d.href}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        {DRILLDOWN_LABEL[d.href] ?? d.href}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <span className="text-[10px] text-zinc-600 leading-snug">{d.reason}</span>
                    </div>
                  ))}
                </div>
              )}
              {(response.relevantItemIds?.length ?? 0) > 0 && (
                <span className="text-[10px] text-zinc-600">
                  ↳ {response.relevantItemIds!.length} Aktionspunkt{response.relevantItemIds!.length !== 1 ? "e" : ""} hervorgehoben
                </span>
              )}
            </div>
          </div>
        )}

        {/* Empty state — quick questions */}
        {!response && !agentMutation.isPending && !agentMutation.isError && (
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Schnellfragen</p>
            <div className="flex flex-col gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="text-left text-[11px] px-3 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(question); }}
            placeholder="Frage stellen… (beliebige Sprache)"
            disabled={agentMutation.isPending}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 disabled:opacity-40 transition-colors"
          />
          <button
            onClick={() => submit(question)}
            disabled={!question.trim() || agentMutation.isPending}
            aria-label="Absenden"
            className="flex items-center justify-center w-9 h-9 bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-lg text-primary transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {agentMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const [showConfig, setShowConfig]       = useState(false);
  const [visible, setVisible]             = useState<Record<WidgetId, boolean>>(loadVisible);
  const [widgetOrder, setWidgetOrder]     = useState<WidgetId[]>(loadOrder);
  const [agentHighlight, setAgentHighlight] = useState<{ ids: string[] } | null>(null);

  function toggleWidget(id: WidgetId) {
    setVisible(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function moveWidget(id: WidgetId, direction: "up" | "down") {
    setWidgetOrder(prev => {
      const idx  = prev.indexOf(id);
      if (idx === -1) return prev;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      try { localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const cashflowQuery = useQuery<CashflowSnapshot>({
    queryKey: ["/api/cfo/cashflow", 6],
    queryFn: () =>
      fetch("/api/cfo/cashflow?months=6", { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    staleTime: 5 * 60 * 1000,
  });

  const ordersQuery = useQuery<WorkshopOrder[]>({
    queryKey: ["/api/admin/workshop-orders"],
    queryFn: () =>
      fetch("/api/admin/workshop-orders", { credentials: "include" }).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
  });

  const snapshot = cashflowQuery.data ?? null;
  const orders: WorkshopOrder[] = ordersQuery.data ?? [];

  const signals = useMemo(() => {
    const fertigUnpaid = orders.filter(
      o => (o.status === "fertig" || o.status === "completed") &&
           o.paymentStatus !== "bezahlt" &&
           o.paymentStatus !== "paid",
    );
    const openNoPartner = orders.filter(o => o.status === "open" && !o.partnerId);
    const inProgress    = orders.filter(o => o.status === "in_bearbeitung");
    const overdueOrders = orders.filter(o => {
      if (!o.scheduledDate) return false;
      if (["fertig", "completed", "cancelled"].includes(o.status)) return false;
      return new Date(o.scheduledDate).getTime() < Date.now();
    });
    const noPayoutPartner = orders.filter(o =>
      o.partnerId &&
      (o.status === "fertig" || o.status === "completed") &&
      (o.partnerPayoutNetCents ?? 0) === 0,
    );
    const unscheduledActive = orders.filter(o =>
      !["fertig", "completed", "cancelled"].includes(o.status) &&
      !o.scheduledDate,
    );
    const unpaidCents   = fertigUnpaid.reduce((s, o) => s + (o.totalAmountCents ?? 0), 0);
    const noPayoutCents = noPayoutPartner.reduce((s, o) => s + (o.totalAmountCents ?? 0), 0);
    return { fertigUnpaid, openNoPartner, inProgress, overdueOrders, noPayoutPartner, unscheduledActive, unpaidCents, noPayoutCents };
  }, [orders]);

  const t = snapshot?.totals;
  const p = snapshot?.previous;
  const deltaRevenue  = t && p ? deltaPct(t.incomeCents, p.incomeCents)   : null;
  const deltaExpenses = t && p ? deltaPct(t.expenseCents, p.expenseCents) : null;
  const deltaProfit   = t && p ? deltaPct(t.profitCents, p.profitCents)   : null;

  // ── Attention items (sorted by severity) ──────────────────────────
  const attentionItems = useMemo((): AttentionItem[] => {
    const items: AttentionItem[] = [];

    // Fertig + unbezahlt — money earned, not yet collected
    // → Auftragsliste: scan completed orders by status, identify which to chase
    if (signals.fertigUnpaid.length > 0) {
      items.push({
        id: "fertig-unpaid",
        category: "urgent",
        severity: signals.unpaidCents > 100_000 || signals.fertigUnpaid.length > 2 ? "critical" : "warning",
        title: "Fertige Aufträge unbezahlt",
        why: "Erbrachte Leistungen warten auf Zahlung — Liquidität verzögert.",
        count: signals.fertigUnpaid.length,
        amount: signals.unpaidCents,
        action: "Admin Pipeline öffnen",
        href: "/admin",
      });
    }

    // Überfällig — past scheduled date, still open
    // → Kalender: shows past dates visually; identify which orders missed their slot
    if (signals.overdueOrders.length > 0) {
      items.push({
        id: "overdue",
        category: "overdue",
        severity: signals.overdueOrders.length > 3 ? "critical" : "warning",
        title: "Aufträge haben Termin verpasst",
        why: "Geplanter Termin vergangen, Auftrag noch nicht abgeschlossen.",
        count: signals.overdueOrders.length,
        action: "Kalender prüfen",
        href: "/admin/calendar",
      });
    }

    // Offen ohne Partner — no forward progress possible
    // → Admin pipeline: the surface where partner assignment happens
    if (signals.openNoPartner.length > 0) {
      items.push({
        id: "no-partner",
        category: "blocked",
        severity: "warning",
        title: "Aufträge ohne Partnerzuweisung",
        why: "Ohne Werkstattpartner ist kein Fortschritt möglich.",
        count: signals.openNoPartner.length,
        action: "Partner zuweisen",
        href: "/admin",
      });
    }

    // Partner ohne Auszahlungsbetrag — payout accounting gap
    // → /admin/partner-payouts: dedicated focused view to review and set payout amounts
    if (signals.noPayoutPartner.length > 0) {
      items.push({
        id: "no-payout",
        category: "payout",
        severity: "warning",
        title: "Partnerauszahlungen nicht definiert",
        why: "Fertige Partneraufträge ohne Auszahlungsbetrag — Abrechnung offen.",
        count: signals.noPayoutPartner.length,
        amount: signals.noPayoutCents > 0 ? signals.noPayoutCents : undefined,
        action: "Auszahlungen setzen",
        href: "/admin/partner-payouts",
      });
    }

    // CFO Rechnungen — supplier invoices awaiting approval
    // → CFO-Eingang: exact match, purpose-built for this workflow
    if (t && t.openInvoicesCount > 0) {
      items.push({
        id: "cfo-invoices",
        category: "finance",
        severity: "warning",
        title: "Eingangsrechnungen zur Prüfung",
        why: "Lieferantenrechnungen warten auf CFO-Freigabe.",
        count: t.openInvoicesCount,
        amount: t.openInvoicesCents > 0 ? t.openInvoicesCents : undefined,
        action: "CFO-Eingang öffnen",
        href: "/cfo-inbox",
      });
    }

    // Aktiv ohne Termin — revenue timing unclear
    // → Kalender: scheduling surface where dates are set for active orders
    if (signals.unscheduledActive.length > 0) {
      items.push({
        id: "unscheduled",
        category: "timing",
        severity: signals.unscheduledActive.length > 5 ? "warning" : "info",
        title: "Aktive Aufträge ohne Terminplanung",
        why: "Kein Datum gesetzt — Umsatz-Timing und Kapazitätsplanung unklar.",
        count: signals.unscheduledActive.length,
        action: "Termin planen",
        href: "/admin/calendar",
      });
    }

    return items.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
  }, [signals, t]);

  const attentionLoading = ordersQuery.isLoading || cashflowQuery.isLoading;

  // ── Widget render fn ─────────────────────────────────────────────────
  function renderWidget(id: WidgetId) {
    switch (id) {
      case "cashflow":
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Cashflow Trend</p>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-500">6 Monate</span>
                {t && <span className="text-[11px] text-zinc-500">{t.ordersCount} Aufträge</span>}
              </div>
            </div>
            <div className="p-4">
              {cashflowQuery.isLoading ? (
                <div className="h-52 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                </div>
              ) : snapshot ? (
                <CashFlowChart snapshot={snapshot} />
              ) : (
                <div className="h-52 flex items-center justify-center text-zinc-600 text-sm">Keine Daten</div>
              )}
            </div>
          </div>
        );

      case "attention":
        return <AttentionPanel items={attentionItems} loading={attentionLoading} highlightedIds={agentHighlight?.ids} />;

      case "operations":
        return (
          <div className="flex flex-col gap-3 h-full">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-sm font-bold text-white">Operative Signale</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Rohdaten im Überblick</p>
              </div>
              <div className="p-3 space-y-2">
                {ordersQuery.isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-11 bg-zinc-800 rounded-md animate-pulse" />)}
                  </div>
                ) : (
                  <>
                    <SignalRow
                      label="Fertig · unbezahlt"
                      count={signals.fertigUnpaid.length}
                      value={signals.unpaidCents > 0 ? fmtEur(signals.unpaidCents) : undefined}
                      borderClass={signals.fertigUnpaid.length > 0 ? "border-rose-500/40 bg-rose-500/8" : "border-zinc-800"}
                      iconClass={signals.fertigUnpaid.length > 0 ? "text-rose-400" : "text-zinc-700"}
                      icon={AlertCircle}
                    />
                    <SignalRow
                      label="Offen · kein Partner"
                      count={signals.openNoPartner.length}
                      borderClass={signals.openNoPartner.length > 0 ? "border-amber-500/40 bg-amber-500/8" : "border-zinc-800"}
                      iconClass={signals.openNoPartner.length > 0 ? "text-amber-400" : "text-zinc-700"}
                      icon={Users}
                    />
                    <SignalRow
                      label="In Bearbeitung"
                      count={signals.inProgress.length}
                      borderClass="border-blue-500/30 bg-blue-500/5"
                      iconClass="text-blue-400"
                      icon={Clock}
                    />
                    {signals.noPayoutPartner.length > 0 && (
                      <SignalRow
                        label="Partner · Auszahlung fehlt"
                        count={signals.noPayoutPartner.length}
                        value={signals.noPayoutCents > 0 ? fmtEur(signals.noPayoutCents) : undefined}
                        borderClass="border-violet-500/40 bg-violet-500/8"
                        iconClass="text-violet-400"
                        icon={Euro}
                      />
                    )}
                    {signals.unscheduledActive.length > 0 && (
                      <SignalRow
                        label="Aktiv · kein Termin"
                        count={signals.unscheduledActive.length}
                        borderClass="border-sky-500/30 bg-sky-500/5"
                        iconClass="text-sky-400"
                        icon={CalendarOff}
                      />
                    )}
                    {signals.overdueOrders.length > 0 && (
                      <SignalRow
                        label="Überfällig"
                        count={signals.overdueOrders.length}
                        borderClass="border-orange-500/40 bg-orange-500/8"
                        iconClass="text-orange-400"
                        icon={AlertTriangle}
                      />
                    )}
                    {t && t.openInvoicesCount > 0 && (
                      <SignalRow
                        label="Offene Rechnungen (CFO)"
                        count={t.openInvoicesCount}
                        value={t.openInvoicesCents > 0 ? fmtEur(t.openInvoicesCents) : undefined}
                        borderClass="border-orange-500/40 bg-orange-500/8"
                        iconClass="text-orange-400"
                        icon={AlertCircle}
                        href="/cfo-inbox"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Drilldown links */}
            <div className="space-y-1.5">
              {[
                { label: "Cashflow Detail",        href: "/finanzen/detail" },
                { label: "Rechnungseingang (CFO)", href: "/cfo-inbox" },
                { label: "Admin · Finanzdetails",  href: "/admin" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  <span>{label}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        );

      case "intelligence":
        return <IntelligencePanel snapshot={snapshot} />;

      case "agent":
        return (
          <AgentPanel
            attentionItems={attentionItems}
            signalSummary={{
              fertigUnpaidCount:    signals.fertigUnpaid.length,
              unpaidCents:          signals.unpaidCents,
              overdueCount:         signals.overdueOrders.length,
              openNoPartnerCount:   signals.openNoPartner.length,
              inProgressCount:      signals.inProgress.length,
              noPayoutPartnerCount: signals.noPayoutPartner.length,
              noPayoutCents:        signals.noPayoutCents,
              unscheduledActiveCount: signals.unscheduledActive.length,
            }}
            snapshot={snapshot}
            onHighlight={(ids) =>
              setAgentHighlight(ids.length > 0 ? { ids } : null)
            }
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Finance OS</h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">Corion Lackdoktor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { cashflowQuery.refetch(); ordersQuery.refetch(); }}
            disabled={cashflowQuery.isFetching || ordersQuery.isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <RefreshCcw className={`w-3 h-3 ${cashflowQuery.isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Aktualisieren</span>
          </button>
          <button
            onClick={() => setShowConfig(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors ${
              showConfig ? "bg-primary/20 text-primary border border-primary/30" : "text-zinc-500 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Settings2 className="w-3 h-3" />
            <span className="hidden sm:inline">Widgets</span>
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Admin →
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 space-y-5 max-w-[1600px] mx-auto">

        {/* ── Widget config panel ─────────────────────────── */}
        {showConfig && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Widgets konfigurieren</p>
            <div className="space-y-1.5">
              {widgetOrder.map((id, idx) => {
                const w = WIDGET_REGISTRY.find(r => r.id === id)!;
                return (
                  <div key={id} className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveWidget(id, "up")}
                        disabled={idx === 0}
                        className="text-zinc-600 hover:text-zinc-400 disabled:opacity-20 transition-colors"
                        aria-label="Nach oben"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveWidget(id, "down")}
                        disabled={idx === widgetOrder.length - 1}
                        className="text-zinc-600 hover:text-zinc-400 disabled:opacity-20 transition-colors"
                        aria-label="Nach unten"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleWidget(id)}
                      className={`flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-xs transition-colors ${
                        visible[id]
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-zinc-800/60 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${visible[id] ? "bg-primary" : "bg-zinc-600"}`} />
                        <span className="font-semibold">{w.label}</span>
                        <span className="text-[10px] text-zinc-600 hidden sm:inline">{w.description}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide">{visible[id] ? "an" : "aus"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── KPI row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            label="Umsatz (6 Mo.)"
            value={t ? fmtEur(t.incomeCents) : "—"}
            sub={t && t.partnerPayoutCents > 0 ? `Auszahlung: ${fmtEur(t.partnerPayoutCents)}` : undefined}
            delta={deltaRevenue}
            positiveIsGood={true}
            accentClass="bg-emerald-500"
            icon={TrendingUp}
            loading={cashflowQuery.isLoading}
          />
          <KpiCard
            label="Ausgaben (6 Mo.)"
            value={t ? fmtEur(t.expenseCents) : "—"}
            delta={deltaExpenses}
            positiveIsGood={false}
            accentClass="bg-rose-500"
            icon={TrendingDown}
            loading={cashflowQuery.isLoading}
          />
          <KpiCard
            label="Gewinn (6 Mo.)"
            value={t ? fmtEur(t.profitCents) : "—"}
            delta={deltaProfit}
            positiveIsGood={true}
            accentClass="bg-violet-500"
            icon={Euro}
            loading={cashflowQuery.isLoading}
          />
          <KpiCard
            label="Forderungen"
            value={ordersQuery.isLoading ? "—" : (signals.unpaidCents > 0 ? fmtEur(signals.unpaidCents) : "0 €")}
            sub={ordersQuery.isLoading ? undefined : `${signals.fertigUnpaid.length} offene Zahlung${signals.fertigUnpaid.length !== 1 ? "en" : ""}`}
            accentClass={signals.unpaidCents > 0 ? "bg-rose-500" : "bg-zinc-700"}
            icon={Banknote}
            loading={ordersQuery.isLoading}
          />
        </div>

        {/* ── Widget grid (order-driven) ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {widgetOrder.filter(id => visible[id]).map(id => {
            const w = WIDGET_REGISTRY.find(r => r.id === id)!;
            return (
              <div key={id} className={w.colSpan === 2 ? "lg:col-span-2" : ""}>
                {renderWidget(id)}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
