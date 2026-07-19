import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, RefreshCw, Bot, Play, RotateCcw, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Clock, Loader2, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentTask {
  id: string;
  title: string;
  agentType: string;
  taskType: string;
  taskPrompt: string;
  workingDirectory: string;
  contextRefs: string[];
  status: string;
  createdById: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

interface AgentTaskResult {
  id: string;
  taskId: string;
  summary: string | null;
  rawOutput: string | null;
  exitCode: number | null;
  changedFilesJson: string[];
  risksJson: string[];
  verificationNeededJson: string[];
  reviewStatus: string;
  reviewNotes: string | null;
  createdAt: string;
}

// ── Status helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    queued:         { label: "Queued",          className: "bg-muted text-muted-foreground" },
    running:        { label: "Running…",         className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    pending_review: { label: "Pending Review",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    approved:       { label: "Approved",         className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    needs_rework:   { label: "Needs Rework",     className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
    failed:         { label: "Failed",           className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}>
      {status === "running" && <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />}
      {cfg.label}
    </span>
  );
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAgentTasks() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const listQ = useQuery<{ tasks: AgentTask[] }>({
    queryKey: ["/api/agent-tasks"],
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: 8000,
  });

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6"><p className="text-sm text-muted-foreground">Admin access required.</p></Card>
      </div>
    );
  }

  const tasks = listQ.data?.tasks ?? [];
  const filteredTasks = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const filterOptions = [
    { value: "all",           label: "All" },
    { value: "queued",        label: "Queued" },
    { value: "running",       label: "Running" },
    { value: "pending_review",label: "Review" },
    { value: "approved",      label: "Approved" },
    { value: "needs_rework",  label: "Rework" },
  ];

  // Clear the selected task when switching to a filter that excludes it,
  // so the detail panel never shows a task the list isn't currently displaying.
  const applyFilter = (value: string) => {
    setStatusFilter(value);
    if (selectedId && value !== "all") {
      const stillVisible = tasks.some((t) => t.id === selectedId && t.status === value);
      if (!stillVisible) setSelectedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/admin")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Claude Worker Bridge</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => listQ.refetch()} data-testid="button-refresh">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} data-testid="button-create-task">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Task
            </Button>
            <Button size="sm" onClick={() => setDelegateOpen(true)} data-testid="button-delegate-task">
              <Zap className="w-3.5 h-3.5 mr-1" /> Delegate
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-4 h-4" /> Tasks
              <Badge variant="outline" className="ml-auto">
                {statusFilter === "all" ? tasks.length : `${filteredTasks.length}/${tasks.length}`}
              </Badge>
            </CardTitle>
            {/* Status filter pills */}
            <div className="flex flex-wrap gap-1 pt-1">
              {filterOptions.map((opt) => {
                const count = opt.value === "all" ? tasks.length : tasks.filter((t) => t.status === opt.value).length;
                const active = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => applyFilter(opt.value)}
                    data-testid={`filter-${opt.value}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                    {count > 0 && (
                      <span className={`rounded-full px-1 text-[10px] ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {listQ.isLoading && <Skeleton className="h-20 w-full" />}
            {!listQ.isLoading && filteredTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {tasks.length === 0 ? "No tasks yet. Create one to get started." : "No tasks with this status."}
              </p>
            )}
            {filteredTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left rounded-md border p-3 transition-colors hover:border-primary/50 ${
                  selectedId === t.id ? "border-primary bg-primary/5" : "border-border"
                }`}
                data-testid={`row-task-${t.id.slice(0, 8)}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate leading-snug">{t.title}</p>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{t.taskType}</span>
                  <span>·</span>
                  <span><Clock className="w-2.5 h-2.5 inline mb-0.5 mr-0.5" />{fmt(t.createdAt)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="p-12 text-center">
              <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Select a task from the list, or create a new one.
              </p>
            </Card>
          ) : (
            <TaskDetail
              task={selected}
              onRefresh={() => {
                listQ.refetch();
                queryClient.invalidateQueries({ queryKey: ["/api/agent-tasks", selected.id] });
              }}
              toast={toast}
            />
          )}
        </div>
      </main>

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          queryClient.invalidateQueries({ queryKey: ["/api/agent-tasks"] });
          setSelectedId(id);
          setCreateOpen(false);
        }}
        toast={toast}
      />

      <DelegateDialog
        open={delegateOpen}
        onClose={() => setDelegateOpen(false)}
        onSelectTask={(id) => {
          queryClient.invalidateQueries({ queryKey: ["/api/agent-tasks"] });
          setSelectedId(id);
        }}
        onRefreshList={() => queryClient.invalidateQueries({ queryKey: ["/api/agent-tasks"] })}
        toast={toast}
      />
    </div>
  );
}

// ── Task detail ───────────────────────────────────────────────────────────────

function TaskDetail({
  task,
  onRefresh,
  toast,
}: {
  task: AgentTask;
  onRefresh: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [showRaw, setShowRaw] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const detailQ = useQuery<{ task: AgentTask; result: AgentTaskResult | null }>({
    queryKey: ["/api/agent-tasks", task.id],
    enabled: true,
    refetchInterval: task.status === "running" ? 5000 : false,
  });

  const result = detailQ.data?.result ?? null;
  const liveTask = detailQ.data?.task ?? task;

  const run = useMutation({
    mutationFn: () => apiRequest("POST", `/api/agent-tasks/${task.id}/run`),
    onSuccess: () => {
      toast({ title: "Task started", description: "Bridge execution in progress…" });
      onRefresh();
    },
    onError: async (err: any) => {
      // Surface the structured API error message if available
      const msg = err?.message ?? "Could not start task";
      toast({ title: "Run failed", description: msg, variant: "destructive" });
    },
  });

  const reset = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agent-tasks/${task.id}/reset`, {
        reason: "Manual reset via admin UI",
      }),
    onSuccess: () => {
      toast({ title: "Task reset to queued" });
      onRefresh();
    },
    onError: async (err: any) => {
      toast({ title: "Reset failed", description: err?.message, variant: "destructive" });
    },
  });

  const approve = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agent-tasks/${task.id}/review`, {
        reviewStatus: "approved",
        reviewNotes: reviewNotes || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Approved" });
      setReviewNotes("");
      onRefresh();
    },
    onError: async (err: any) => {
      toast({ title: "Approve failed", description: err?.message, variant: "destructive" });
    },
  });

  const reject = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agent-tasks/${task.id}/review`, {
        reviewStatus: "needs_rework",
        reviewNotes: reviewNotes || "Needs rework",
      }),
    onSuccess: () => {
      toast({ title: "Marked needs_rework" });
      setReviewNotes("");
      onRefresh();
    },
    onError: async (err: any) => {
      toast({ title: "Reject failed", description: err?.message, variant: "destructive" });
    },
  });

  const canRun   = liveTask.status === "queued";
  const canReset = ["running", "failed", "needs_rework"].includes(liveTask.status);
  const canReview = liveTask.status === "pending_review" && !!result;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base leading-snug">{liveTask.title}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={liveTask.status} />
            <span className="text-[11px] text-muted-foreground">{liveTask.taskType}</span>
            <span className="text-[11px] text-muted-foreground font-mono truncate">{liveTask.workingDirectory}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {canRun && (
            <Button
              size="sm"
              onClick={() => run.mutate()}
              disabled={run.isPending}
              data-testid="button-run"
            >
              {run.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
              Run
            </Button>
          )}
          {canReset && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => reset.mutate()}
              disabled={reset.isPending}
              data-testid="button-reset"
            >
              {reset.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timestamps */}
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <span>Created: {fmt(liveTask.createdAt)}</span>
          {liveTask.startedAt && <span>Started: {fmt(liveTask.startedAt)}</span>}
          {liveTask.finishedAt && <span>Finished: {fmt(liveTask.finishedAt)}</span>}
        </div>

        {/* Prompt */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Prompt</p>
          <p className="text-sm bg-muted/40 rounded-md p-3 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-32 overflow-y-auto">
            {liveTask.taskPrompt}
          </p>
        </div>

        {/* Running state */}
        {liveTask.status === "running" && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            Claude is running… page auto-refreshes every 5 s.
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Result</p>
              {result.exitCode !== null && (
                <Badge
                  variant={result.exitCode === 0 ? "outline" : "destructive"}
                  className="text-[10px]"
                >
                  exit {result.exitCode}
                </Badge>
              )}
            </div>

            {result.summary && (
              <div>
                <p className="text-xs font-medium mb-1">Summary</p>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>
            )}

            {result.changedFilesJson.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Files Changed</p>
                <ul className="space-y-0.5">
                  {result.changedFilesJson.map((f, i) => (
                    <li key={i} className="text-xs font-mono text-muted-foreground bg-muted/40 rounded px-2 py-0.5">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.risksJson.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Risks
                </p>
                <ul className="space-y-0.5">
                  {result.risksJson.map((r, i) => (
                    <li key={i} className="text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 rounded px-2 py-0.5">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.verificationNeededJson.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-amber-600 dark:text-amber-400">Needs Live Verification</p>
                <ul className="space-y-0.5">
                  {result.verificationNeededJson.map((v, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-0.5">{v}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw output toggle */}
            {result.rawOutput && (
              <div>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowRaw((v) => !v)}
                  data-testid="button-toggle-raw"
                >
                  {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showRaw ? "Hide" : "Show"} raw output
                </button>
                {showRaw && (
                  <pre className="mt-2 text-xs font-mono bg-muted/40 rounded-md p-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                    {result.rawOutput}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Review actions */}
        {canReview && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Review</p>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Review notes…"
                className="mt-1 h-20 text-sm resize-none"
                data-testid="input-review-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => approve.mutate()}
                disabled={approve.isPending}
                data-testid="button-approve"
              >
                {approve.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                onClick={() => reject.mutate()}
                disabled={reject.isPending}
                data-testid="button-reject"
              >
                {reject.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                Needs Rework
              </Button>
            </div>
          </div>
        )}

        {/* Approved/terminal state */}
        {liveTask.status === "approved" && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Approved{result?.reviewNotes ? ` — ${result.reviewNotes}` : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Create dialog ─────────────────────────────────────────────────────────────


function CreateTaskDialog({
  open,
  onClose,
  onCreated,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("coding");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [workingDirectory, setWorkingDirectory] = useState(".");

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agent-tasks", {
        title,
        taskType,
        taskPrompt,
        workingDirectory,
        contextRefs: [],
      });
      return res.json() as Promise<{ task: AgentTask }>;
    },
    onSuccess: (data) => {
      toast({ title: "Task created" });
      setTitle(""); setTaskPrompt(""); setTaskType("coding"); setWorkingDirectory(".");
      onCreated(data.task.id);
    },
    onError: async (err: any) => {
      toast({ title: "Create failed", description: err?.message, variant: "destructive" });
    },
  });

  const valid = title.trim().length > 0 && taskPrompt.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4" /> New Agent Task
          </DialogTitle>
          <DialogDescription>
            Create a bounded task for the Claude worker to execute against this repo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Extract TaskCard into a separate component"
              data-testid="input-task-title"
            />
          </div>

          <div>
            <Label>Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger data-testid="select-task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="docs">Docs</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="cleanup">Cleanup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Task Prompt</Label>
            <Textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Describe exactly what Claude should do. Be specific and bounded."
              className="h-36 text-sm resize-none font-mono"
              maxLength={8000}
              data-testid="input-task-prompt"
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">
              {taskPrompt.length}/8000
            </p>
          </div>

          <div>
            <Label>Working Directory</Label>
            <Input
              value={workingDirectory}
              onChange={(e) => setWorkingDirectory(e.target.value)}
              placeholder="e.g. /absolute/path/to/repo"
              className="font-mono text-xs"
              data-testid="input-workdir"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              <code className="font-mono">.</code> resolves to the server's working directory (repo root in normal usage).
              Use an absolute path to target a different directory.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !valid}
            data-testid="button-confirm-create"
          >
            {create.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delegate dialog ───────────────────────────────────────────────────────────
//
// Calls POST /api/supervisor/delegate and polls GET /api/supervisor/delegate/:id.
// Phase machine: form → polling → done.
// On "done", surfaces the LoopResult outcome with appropriate next action.
// For auto_approve outcomes, no human action is required.
// For needs_human, the task is already in pending_review — "Go to task" selects it.

type DelegatePhase =
  | { tag: "form" }
  | { tag: "polling"; delegationId: string; taskId: string }
  | { tag: "done"; outcome: string; taskId: string; reasons: string[]; elapsedMs: number };

function DelegateDialog({
  open,
  onClose,
  onSelectTask,
  onRefreshList,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  onSelectTask: (id: string) => void;
  onRefreshList: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [phase, setPhase] = useState<DelegatePhase>({ tag: "form" });
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("docs");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [workingDirectory, setWorkingDirectory] = useState(".");
  const [reviewNotes, setReviewNotes] = useState("");
  const [timeoutSec, setTimeoutSec] = useState(120);

  useEffect(() => {
    if (!open) {
      setPhase({ tag: "form" });
      setTitle(""); setTaskType("docs"); setTaskPrompt("");
      setWorkingDirectory("."); setReviewNotes(""); setTimeoutSec(120);
    }
  }, [open]);

  const delegationId = phase.tag === "polling" ? phase.delegationId : null;

  const pollQ = useQuery<any>({
    queryKey: ["/api/supervisor/delegate", delegationId],
    enabled: !!delegationId,
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await fetch(`/api/supervisor/delegate/${delegationId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (pollQ.data?.status === "complete" && phase.tag === "polling") {
      setPhase({
        tag: "done",
        outcome: pollQ.data.outcome ?? "needs_human",
        taskId: pollQ.data.taskId ?? phase.taskId,
        reasons: pollQ.data.decision?.reasons ?? [],
        elapsedMs: pollQ.data.elapsedMs ?? 0,
      });
      onRefreshList();
    }
  }, [pollQ.data, phase.tag]);

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/supervisor/delegate", {
        title,
        taskType,
        taskPrompt,
        workingDirectory,
        reviewNotes: reviewNotes.trim() || undefined,
        timeoutSeconds: timeoutSec,
      });
      return res.json() as Promise<{ delegationId: string; taskId: string }>;
    },
    onSuccess: ({ delegationId: did, taskId: tid }) => {
      setPhase({ tag: "polling", delegationId: did, taskId: tid });
      onRefreshList();
    },
    onError: (err: any) => {
      toast({ title: "Delegation failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  const valid = title.trim().length > 0 && taskPrompt.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Delegate to Claude
          </DialogTitle>
          <DialogDescription>
            Claude runs autonomously. Docs/analysis tasks with clean results auto-approve — no human step required.
          </DialogDescription>
        </DialogHeader>

        {phase.tag === "form" && (
          <>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summarize partner Auftrag status for Q2"
                  data-testid="input-delegate-title"
                />
              </div>
              <div>
                <Label>Task Type</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger data-testid="select-delegate-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docs">Docs</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="cleanup">Cleanup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Task Prompt</Label>
                <Textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="Describe exactly what Claude should do. Be specific and bounded."
                  className="h-32 text-sm resize-none font-mono"
                  maxLength={8000}
                  data-testid="input-delegate-prompt"
                />
                <p className="text-[11px] text-muted-foreground mt-1 text-right">{taskPrompt.length}/8000</p>
              </div>
              <div>
                <Label>Working Directory</Label>
                <Input
                  value={workingDirectory}
                  onChange={(e) => setWorkingDirectory(e.target.value)}
                  className="font-mono text-xs"
                  data-testid="input-delegate-workdir"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Timeout (s)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={600}
                    value={timeoutSec}
                    onChange={(e) => setTimeoutSec(Number(e.target.value))}
                    className="font-mono text-xs"
                    data-testid="input-delegate-timeout"
                  />
                </div>
                <div>
                  <Label>Review Notes (optional)</Label>
                  <Input
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Context for reviewer…"
                    data-testid="input-delegate-notes"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => submit.mutate()}
                disabled={submit.isPending || !valid}
                data-testid="button-confirm-delegate"
              >
                {submit.isPending
                  ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  : <Zap className="w-3.5 h-3.5 mr-1" />}
                Delegate
              </Button>
            </DialogFooter>
          </>
        )}

        {phase.tag === "polling" && (
          <div className="py-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-sm font-medium">Claude is working…</p>
            <p className="text-xs text-muted-foreground">
              Supervisor is evaluating the result. Checking every 5 s.
            </p>
            {pollQ.isError && (
              <p className="text-xs text-red-500 mt-1">Poll error — retrying…</p>
            )}
          </div>
        )}

        {phase.tag === "done" && (
          <DelegationOutcome
            outcome={phase.outcome}
            taskId={phase.taskId}
            reasons={phase.reasons}
            elapsedMs={phase.elapsedMs}
            onClose={onClose}
            onGoToTask={() => { onSelectTask(phase.taskId); onClose(); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Delegation outcome display ────────────────────────────────────────────────

const OUTCOME_CFG: Record<string, {
  icon: typeof CheckCircle;
  iconClass: string;
  title: string;
  body: string;
  needsReview: boolean;
}> = {
  approved: {
    icon: CheckCircle,
    iconClass: "text-emerald-500",
    title: "Auto-approved",
    body: "Claude completed the task and it passed policy review automatically. No action required.",
    needsReview: false,
  },
  rework_requested: {
    icon: RotateCcw,
    iconClass: "text-amber-500",
    title: "Rework requested",
    body: "The result did not pass policy. A rework was automatically queued — monitor the task for the retry.",
    needsReview: true,
  },
  needs_human: {
    icon: AlertCircle,
    iconClass: "text-blue-500",
    title: "Needs your review",
    body: "The outcome requires human judgment. The task is waiting in the pending-review queue.",
    needsReview: true,
  },
  timed_out: {
    icon: Clock,
    iconClass: "text-orange-500",
    title: "Timed out",
    body: "Claude did not complete within the timeout window. The task may still be running — check the task list.",
    needsReview: true,
  },
  dispatch_failed: {
    icon: AlertCircle,
    iconClass: "text-red-500",
    title: "Dispatch failed",
    body: "The task could not be created or started. Check server logs.",
    needsReview: false,
  },
};

function DelegationOutcome({
  outcome,
  taskId,
  reasons,
  elapsedMs,
  onClose,
  onGoToTask,
}: {
  outcome: string;
  taskId: string;
  reasons: string[];
  elapsedMs: number;
  onClose: () => void;
  onGoToTask: () => void;
}) {
  const cfg = OUTCOME_CFG[outcome] ?? OUTCOME_CFG.needs_human;
  const Icon = cfg.icon;
  const elapsed = Math.round(elapsedMs / 1000);

  return (
    <div className="space-y-4 py-2">
      <div className="text-center space-y-2">
        <Icon className={`w-10 h-10 mx-auto ${cfg.iconClass}`} />
        <p className="font-semibold">{cfg.title}</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{cfg.body}</p>
        <p className="text-[11px] text-muted-foreground">
          {elapsed > 0 ? `${elapsed}s · ` : ""}task <span className="font-mono">{taskId.slice(0, 8)}</span>
        </p>
      </div>

      {reasons.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Policy reasons
          </p>
          {reasons.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground">· {r}</p>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {cfg.needsReview && (
          <Button onClick={onGoToTask} data-testid="button-go-to-task">
            Go to task
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}
