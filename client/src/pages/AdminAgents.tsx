import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, RefreshCw, Bot, Calendar, Upload, ClipboardList,
  FileText, Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentEvent {
  id: string;
  agentSlug: string;
  eventType: string;
  busTaskId: string | null;
  busTaskType: string | null;
  title: string;
  summary: string | null;
  payload: Record<string, unknown> | null;
  relatedOrderId: string | null;
  relatedTaskId: string | null;
  status: string;
  visibility: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function isoDay(iso: string) {
  return iso.slice(0, 10);
}

const TASK_TYPE_ICONS: Record<string, React.ReactNode> = {
  intake:                 <ClipboardList className="w-3.5 h-3.5" />,
  drive_upload:           <Upload className="w-3.5 h-3.5" />,
  calendar_event_create:  <Calendar className="w-3.5 h-3.5" />,
  calendar_event_patch:   <Calendar className="w-3.5 h-3.5" />,
  task_create:            <ClipboardList className="w-3.5 h-3.5" />,
  document_reference:     <FileText className="w-3.5 h-3.5" />,
  delegate:               <Zap className="w-3.5 h-3.5" />,
};

const AGENT_COLORS: Record<string, string> = {
  cora:          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  claude_worker: "bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300",
  system:        "bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-300",
};

const DELEGATE_OUTCOME_STYLES: Record<string, string> = {
  approved:         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rework_requested: "bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-300",
  needs_human:      "bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-300",
  timed_out:        "bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-300",
  dispatch_failed:  "bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-300",
};

function AgentBadge({ slug }: { slug: string }) {
  const cls = AGENT_COLORS[slug] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Bot className="w-3 h-3" />
      {slug}
    </span>
  );
}

function TypeChip({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono bg-muted text-muted-foreground">
      {TASK_TYPE_ICONS[type] ?? <Zap className="w-3.5 h-3.5" />}
      {type}
    </span>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ ev }: { ev: AgentEvent }) {
  const [open, setOpen] = useState(false);
  const isError = ev.status === "error";
  const result = (ev.payload as any)?.result ?? null;

  // Delegate-specific fields (flattened by taskBus into payload top-level)
  const isDelegate    = ev.busTaskType === "delegate";
  const dlgOutcome    = isDelegate ? ((ev.payload as any)?.outcome    as string | null) : null;
  const dlgSummary    = isDelegate ? ((ev.payload as any)?.taskSummary as string | null) : null;
  const dlgFiles      = isDelegate ? (((ev.payload as any)?.changedFiles ?? []) as string[]) : [];
  const dlgId         = isDelegate ? ((ev.payload as any)?.delegationId as string | null) : null;

  // Extract the most useful fields from the result for quick display (non-delegate only)
  const quickFields: [string, string][] = [];
  if (!isDelegate && result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (r.referenceNumber) quickFields.push(["Auftrag", String(r.referenceNumber)]);
    if (r.orderId)         quickFields.push(["Order ID", String(r.orderId).slice(0, 8) + "…"]);
    if (r.eventId)         quickFields.push(["Event ID", String(r.eventId)]);
    if (r.fileId)          quickFields.push(["Drive ID", String(r.fileId)]);
    if (r.taskId)          quickFields.push(["Task ID", String(r.taskId).slice(0, 8) + "…"]);
    if (r.htmlLink)        quickFields.push(["Link", "open"]);
    if (r.fileUrl)         quickFields.push(["Drive URL", "open"]);
    if (r.attachmentCount !== undefined) quickFields.push(["Attachments", String(r.attachmentCount)]);
    if (r.pendingSteps && Array.isArray(r.pendingSteps) && r.pendingSteps.length > 0) {
      quickFields.push(["Pending", (r.pendingSteps as string[]).join(", ")]);
    }
  }

  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-colors ${isError ? "border-red-200 dark:border-red-900/50" : "border-border"}`}>
      <div className="flex items-start gap-3 p-3">
        {/* Status dot */}
        <div className="mt-0.5 shrink-0">
          {isError
            ? <XCircle className="w-4 h-4 text-red-500" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <AgentBadge slug={ev.agentSlug} />
            <TypeChip type={ev.busTaskType} />
            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{fmt(ev.createdAt)}</span>
          </div>

          <p className="text-sm font-medium leading-snug">{ev.title}</p>

          {ev.summary && (
            <p className="text-xs text-muted-foreground mt-0.5">{ev.summary}</p>
          )}

          {/* Delegate detail: Claude outcome, summary, changed files, link */}
          {isDelegate && (dlgOutcome || dlgSummary || dlgFiles.length > 0) && (
            <div className="mt-1.5 space-y-1">
              {dlgOutcome && (
                <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${DELEGATE_OUTCOME_STYLES[dlgOutcome] ?? "bg-muted text-muted-foreground"}`}>
                  {dlgOutcome.replace(/_/g, " ")}
                </span>
              )}
              {dlgSummary && (
                <p className="text-xs text-muted-foreground leading-snug line-clamp-3">{dlgSummary}</p>
              )}
              {dlgFiles.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Changed:</span>{" "}
                  {dlgFiles.slice(0, 3).join(", ")}{dlgFiles.length > 3 ? ` +${dlgFiles.length - 3}` : ""}
                </p>
              )}
              {dlgId && (
                <a href="/admin/agent-tasks" className="text-[11px] text-blue-500 hover:underline">
                  → Full Task Output
                </a>
              )}
            </div>
          )}

          {/* Quick result fields */}
          {quickFields.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {quickFields.map(([label, value]) => {
                const r = (ev.payload as any)?.result as Record<string, unknown> | null;
                const linkUrl = label === "Link" ? String(r?.htmlLink ?? "") :
                                label === "Drive URL" ? String(r?.fileUrl ?? "") : null;
                return (
                  <span key={label} className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{label}:</span>{" "}
                    {linkUrl
                      ? <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">↗ open</a>
                      : value}
                  </span>
                );
              })}
            </div>
          )}

          {/* Linked order / task pills */}
          {(ev.relatedOrderId || ev.relatedTaskId) && (
            <div className="flex gap-2 mt-1.5">
              {ev.relatedOrderId && (
                <a href={`/admin?order=${ev.relatedOrderId}`} className="text-[11px] text-blue-500 hover:underline">
                  → Auftrag
                </a>
              )}
              {ev.relatedTaskId && (
                <a href={`/tasks`} className="text-[11px] text-blue-500 hover:underline">
                  → Task
                </a>
              )}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Raw payload */}
      {open && (
        <div className="border-t px-3 pb-3 pt-2">
          <p className="text-[10px] font-mono text-muted-foreground mb-1">bus_task_id: {ev.busTaskId ?? "—"}</p>
          <pre className="text-[11px] font-mono bg-muted rounded p-2 overflow-x-auto max-h-64 whitespace-pre-wrap break-all">
            {JSON.stringify(ev.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAgents() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [agentFilter,    setAgentFilter]    = useState("all");
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("all");

  const query = useQuery({
    queryKey: ["agent-events", agentFilter, typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (agentFilter  !== "all") params.set("agentSlug",   agentFilter);
      if (typeFilter   !== "all") params.set("busTaskType", typeFilter);
      if (statusFilter !== "all") params.set("status",      statusFilter);
      const res = await apiRequest("GET", `/api/agent-events?${params}`);
      return res.json() as Promise<{ events: AgentEvent[]; count: number }>;
    },
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: 10_000,
  });

  if (authLoading) return null;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6"><p className="text-sm text-muted-foreground">Admin access required.</p></Card>
      </div>
    );
  }

  const events = query.data?.events ?? [];

  // Group by day
  const days = events.reduce<Record<string, AgentEvent[]>>((acc, ev) => {
    const d = isoDay(ev.createdAt);
    (acc[d] ??= []).push(ev);
    return acc;
  }, {});

  const dayKeys = Object.keys(days).sort().reverse();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Admin
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-violet-500" />
          <h1 className="text-base font-semibold">Agent Activity</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              <SelectItem value="cora">Cora</SelectItem>
              <SelectItem value="claude_worker">Claude Worker</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Task type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="intake">intake</SelectItem>
              <SelectItem value="drive_upload">drive_upload</SelectItem>
              <SelectItem value="calendar_event_create">calendar_event_create</SelectItem>
              <SelectItem value="calendar_event_patch">calendar_event_patch</SelectItem>
              <SelectItem value="task_create">task_create</SelectItem>
              <SelectItem value="document_reference">document_reference</SelectItem>
              <SelectItem value="delegate">delegate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {events.length > 0 && (
            <span className="self-center text-xs text-muted-foreground ml-auto">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Empty state */}
        {!query.isFetching && events.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No agent events yet.</p>
            <p className="text-xs mt-1">Events appear here when Cora or other agents complete bus tasks.</p>
          </div>
        )}

        {/* Feed grouped by day */}
        {dayKeys.map((day) => (
          <div key={day}>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {fmtDay(day + "T12:00:00")}
            </p>
            <div className="space-y-2">
              {days[day].map((ev) => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
