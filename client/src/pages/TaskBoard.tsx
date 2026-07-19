import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  ClipboardList,
  CheckCircle2,
  ShieldAlert,
  Plus,
  RefreshCw,
  AlertTriangle,
  User,
  PlayCircle,
} from "lucide-react";

type AgentRole =
  | "cfo"
  | "reception"
  | "partner_liaison"
  | "customer_care"
  | "marketing"
  | "qc";

type Task = {
  id: string;
  title: string;
  description: string | null;
  column: "todo" | "in_progress" | "review" | "done" | "failed";
  assignedAgent: AgentRole | null;
  assignedUserId: string | null;
  createdById: string | null;
  sourceType: string;
  sourceId: string | null;
  priority: "routine" | "normal" | "high" | "critical";
  impactValueCents: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  requiresReview: boolean;
  autoClaimEligible: boolean;
  claimedAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
};

type Catalog = {
  agents: { role: AgentRole; label: string }[];
  columns: Task["column"][];
  sourceTypes: string[];
  hitlThresholdCents: number;
};

const AGENT_COLORS: Record<AgentRole, string> = {
  cfo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  reception:
    "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  partner_liaison:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
  customer_care:
    "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
  marketing:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  qc: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
};

const COLUMN_META: Record<
  Task["column"],
  { title: string; icon: any; tone: string }
> = {
  todo: { title: "Todo", icon: ClipboardList, tone: "text-muted-foreground" },
  in_progress: {
    title: "In Bearbeitung",
    icon: PlayCircle,
    tone: "text-sky-500",
  },
  review: { title: "Review (HITL)", icon: ShieldAlert, tone: "text-amber-500" },
  done: { title: "Done", icon: CheckCircle2, tone: "text-emerald-500" },
  failed: { title: "Failed", icon: AlertTriangle, tone: "text-destructive" },
};

const PRIORITY_TONE: Record<Task["priority"], string> = {
  routine: "bg-muted text-muted-foreground",
  normal: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  high: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  critical: "bg-destructive/15 text-destructive",
};

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function TaskBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [agentFilter, setAgentFilter] = useState<"all" | AgentRole>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: catalog } = useQuery<Catalog>({
    queryKey: ["/api/tasks/catalog"],
  });

  const { data: tasksData, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey:
      agentFilter === "all"
        ? ["/api/tasks"]
        : ["/api/tasks", { agent: agentFilter }],
    queryFn: async () => {
      const url =
        agentFilter === "all"
          ? "/api/tasks"
          : `/api/tasks?agent=${agentFilter}`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    refetchInterval: 10000,
  });

  const tasks = tasksData?.tasks ?? [];
  const grouped = useMemo(() => {
    const g: Record<Task["column"], Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      failed: [],
    };
    for (const t of tasks) g[t.column]?.push(t);
    return g;
  }, [tasks]);

  const claimMut = useMutation({
    mutationFn: async ({ id, agent }: { id: string; agent: AgentRole }) =>
      (await apiRequest("POST", `/api/tasks/${id}/claim`, { agent })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Übernommen" });
    },
    onError: (e: any) =>
      toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const completeMut = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) =>
      (
        await apiRequest("POST", `/api/tasks/${id}/complete`, {
          result: { note: note || "completed" },
        })
      ).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setActiveTask(null);
      toast({ title: "Abgeschlossen" });
    },
  });

  const approveMut = useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest("POST", `/api/tasks/${id}/approve`, {})).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setActiveTask(null);
      toast({ title: "Freigegeben" });
    },
  });

  const rejectMut = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await apiRequest("POST", `/api/tasks/${id}/reject`, { reason })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setActiveTask(null);
      toast({ title: "Abgelehnt" });
    },
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" data-testid="page-task-board">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI Agent Task Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            6 spezialisierte Agents übernehmen Aufgaben automatisch.
            Aktionen mit hohem Impact gehen in Review (HITL).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = "/admin"}
            data-testid="button-back-to-corion-hub"
          >
            Zurück zu Corion Hub
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
            }
            data-testid="button-refresh-tasks"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Aktualisieren
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            data-testid="button-create-task"
          >
            <Plus className="h-4 w-4 mr-2" /> Neuer Task
          </Button>
        </div>
      </div>

      {/* Agent filter chips */}
      <div className="flex gap-2 flex-wrap" data-testid="filter-agents">
        <Badge
          className={`cursor-pointer toggle-elevate ${agentFilter === "all" ? "toggle-elevated" : ""}`}
          variant={agentFilter === "all" ? "default" : "outline"}
          onClick={() => setAgentFilter("all")}
          data-testid="chip-agent-all"
        >
          Alle ({tasks.length})
        </Badge>
        {catalog?.agents.map((a) => {
          const count = tasks.filter((t) => t.assignedAgent === a.role).length;
          return (
            <Badge
              key={a.role}
              variant="outline"
              className={`cursor-pointer toggle-elevate ${agentFilter === a.role ? "toggle-elevated" : ""} ${AGENT_COLORS[a.role]}`}
              onClick={() => setAgentFilter(a.role)}
              data-testid={`chip-agent-${a.role}`}
            >
              {a.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["todo", "in_progress", "review", "done"] as const).map((col) => {
          const Meta = COLUMN_META[col];
          const list = grouped[col];
          return (
            <div
              key={col}
              className="flex flex-col gap-3 min-h-[200px]"
              data-testid={`column-${col}`}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Meta.icon className={`h-4 w-4 ${Meta.tone}`} />
                  <h3 className="font-semibold text-sm">{Meta.title}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {list.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {isLoading && list.length === 0 && (
                  <Card className="opacity-50">
                    <CardContent className="p-4 text-xs text-muted-foreground">
                      Lade...
                    </CardContent>
                  </Card>
                )}
                {list.map((t) => (
                  <Card
                    key={t.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setActiveTask(t)}
                    data-testid={`card-task-${t.id}`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">
                          {t.title}
                        </h4>
                        <Badge
                          className={`text-[10px] shrink-0 ${PRIORITY_TONE[t.priority]}`}
                          variant="outline"
                        >
                          {t.priority}
                        </Badge>
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {t.assignedAgent ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${AGENT_COLORS[t.assignedAgent]}`}
                            data-testid={`badge-agent-${t.id}`}
                          >
                            <Bot className="h-3 w-3 mr-1" />
                            {catalog?.agents.find((a) => a.role === t.assignedAgent)?.label ?? t.assignedAgent}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            <User className="h-3 w-3 mr-1" />
                            Unassigned
                          </Badge>
                        )}
                        {t.impactValueCents > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {fmtEUR(t.impactValueCents)}
                          </span>
                        )}
                      </div>
                      {t.requiresReview && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> HITL erforderlich
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {list.length === 0 && !isLoading && (
                  <p className="text-xs text-muted-foreground italic px-1">
                    Keine Tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create dialog */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        catalog={catalog}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
        }
      />

      {/* Detail dialog */}
      <Dialog
        open={!!activeTask}
        onOpenChange={(o) => !o && setActiveTask(null)}
      >
        <DialogContent className="max-w-lg" data-testid="dialog-task-detail">
          {activeTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{activeTask.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {activeTask.description && (
                  <p className="text-muted-foreground">{activeTask.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Source:</span>{" "}
                    <span className="font-mono">{activeTask.sourceType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>{" "}
                    {activeTask.priority}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impact:</span>{" "}
                    {fmtEUR(activeTask.impactValueCents)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agent:</span>{" "}
                    {activeTask.assignedAgent ?? "—"}
                  </div>
                </div>
                {Object.keys(activeTask.result || {}).length > 0 && (
                  <div className="bg-muted rounded-md p-2 text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(activeTask.result, null, 2)}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-wrap gap-2">
                {activeTask.column === "todo" && (
                  <>
                    {catalog?.agents.map((a) => (
                      <Button
                        key={a.role}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          claimMut.mutate({
                            id: activeTask.id,
                            agent: a.role,
                          })
                        }
                        disabled={claimMut.isPending}
                        data-testid={`button-claim-${a.role}`}
                      >
                        Übernehmen als {a.label}
                      </Button>
                    ))}
                  </>
                )}
                {activeTask.column === "in_progress" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      completeMut.mutate({
                        id: activeTask.id,
                        note: "manually completed",
                      })
                    }
                    disabled={completeMut.isPending}
                    data-testid="button-complete-task"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Abschließen
                  </Button>
                )}
                {activeTask.column === "review" && isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Grund für Ablehnung:");
                        if (reason)
                          rejectMut.mutate({ id: activeTask.id, reason });
                      }}
                      disabled={rejectMut.isPending}
                      data-testid="button-reject-task"
                    >
                      Ablehnen
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate(activeTask.id)}
                      disabled={approveMut.isPending}
                      data-testid="button-approve-task"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Freigeben
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  catalog,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  catalog: Catalog | undefined;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<string>("manual");
  const [forcedAgent, setForcedAgent] = useState<string>("auto");
  const [impactEUR, setImpactEUR] = useState("0");
  const [clientFacing, setClientFacing] = useState(false);
  const [contractChange, setContractChange] = useState(false);

  const createMut = useMutation({
    mutationFn: async () =>
      (
        await apiRequest("POST", "/api/tasks", {
          title,
          description: description || undefined,
          sourceType,
          impactValueCents: Math.round(parseFloat(impactEUR || "0") * 100),
          clientFacing,
          contractChange,
          forcedAgent: forcedAgent === "auto" ? undefined : forcedAgent,
        })
      ).json(),
    onSuccess: () => {
      toast({ title: "Task erstellt" });
      setTitle("");
      setDescription("");
      setImpactEUR("0");
      setClientFacing(false);
      setContractChange(false);
      onCreated();
      onOpenChange(false);
    },
    onError: (e: any) =>
      toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-task">
        <DialogHeader>
          <DialogTitle>Neuer Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-title">Titel</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Triage neuer Auftrag"
              data-testid="input-task-title"
            />
          </div>
          <div>
            <Label htmlFor="t-desc">Beschreibung</Label>
            <Textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-task-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Quelle</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger data-testid="select-source-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(catalog?.sourceTypes ?? ["manual"]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agent</Label>
              <Select value={forcedAgent} onValueChange={setForcedAgent}>
                <SelectTrigger data-testid="select-forced-agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-Routing</SelectItem>
                  {catalog?.agents.map((a) => (
                    <SelectItem key={a.role} value={a.role}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="t-impact">Finanzieller Impact (EUR)</Label>
            <Input
              id="t-impact"
              type="number"
              min="0"
              step="0.01"
              value={impactEUR}
              onChange={(e) => setImpactEUR(e.target.value)}
              data-testid="input-impact-eur"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ≥ {fmtEUR(catalog?.hitlThresholdCents ?? 50000)} → Review (HITL)
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={clientFacing}
                onChange={(e) => setClientFacing(e.target.checked)}
                data-testid="checkbox-client-facing"
              />
              Client-facing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contractChange}
                onChange={(e) => setContractChange(e.target.checked)}
                data-testid="checkbox-contract-change"
              />
              Vertragsänderung
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-create"
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => createMut.mutate()}
            disabled={!title || createMut.isPending}
            data-testid="button-submit-create"
          >
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
