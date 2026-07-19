import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DriveFolderLink } from "./DriveFolderLink";
import { AudioRecorder } from "./AudioRecorder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus,
  GripVertical,
  Trash2,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Pencil,
  ListTodo,
  Loader2,
  Flag,
  ChevronDown,
  ScanSearch,
  Sparkles,
  Wand2,
  Search,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { BoardTask, User as UserType } from "@shared/schema";

const COLUMNS = [
  { id: "todo", label: "Zu erledigen", icon: ListTodo, color: "text-yellow-500" },
  { id: "in_progress", label: "In Bearbeitung", icon: Clock, color: "text-blue-500" },
  { id: "done", label: "Erledigt", icon: CheckCircle2, color: "text-green-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400",
  normal: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  normal: "Normal",
  high: "Hoch",
  urgent: "Dringend",
};

const PRIORITY_TEXT_COLORS: Record<string, string> = {
  low: "text-slate-400",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

interface TaskBoardProps {
  users: UserType[];
}

type TaskBoardView = "mine" | "by_user" | "all";

function sortAssignableUsers(users: UserType[]) {
  return [...users]
    .filter((u) => u.role === "admin" || u.role === "partner")
    .sort((a, b) => {
      const aIsCora = a.email === "cora@corion.gmbh" || `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase().includes("cora");
      const bIsCora = b.email === "cora@corion.gmbh" || `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase().includes("cora");
      if (aIsCora && !bIsCora) return -1;
      if (!aIsCora && bIsCora) return 1;
      return (`${a.firstName || ""} ${a.lastName || ""}` || a.email || "").localeCompare((`${b.firstName || ""} ${b.lastName || ""}` || b.email || ""), "de");
    });
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      data-testid={`droppable-${id}`}
      className={`space-y-2 min-h-[100px] rounded-md transition-colors ${
        isOver ? "bg-primary/5 outline outline-2 outline-primary/40" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DraggableTaskCard({
  task,
  users,
  onEdit,
  onDelete,
  onPriorityChange,
}: {
  task: BoardTask;
  users: UserType[];
  onEdit: () => void;
  onDelete: () => void;
  onPriorityChange: (priority: string) => void;
}) {
  const { user } = useAuth();
  const isAssignedToMe = task.assignedTo === user?.id;
  const isHighPriority = task.priority === "high";
  const isUrgentPriority = task.priority === "urgent";
  const suggestedAction = (task as any).suggestedAction || null;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const getUserName = (userId: string | null) => {
    if (!userId) return null;
    const u = users.find((u) => u.id === userId);
    return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : null;
  };
  const summaryText = (() => {
    if (suggestedAction?.label && task.description) {
      return `${task.title.replace(/^📞\s*/, "")}: ${suggestedAction.label}. ${task.description}`;
    }
    if (suggestedAction?.label) {
      return `${task.title.replace(/^📞\s*/, "")}: ${suggestedAction.label}.`;
    }
    return task.description || "";
  })();

  const aiActionLabel = (() => {
    if (!suggestedAction) return "Execute AI Action";
    if (suggestedAction.type === "email_reply") return "Review Email Draft";
    if (suggestedAction.type === "finance_check") return "Check Finance";
    if (suggestedAction.type === "calendar_entry") return "Review Calendar Action";
    return suggestedAction.label || "Execute AI Action";
  })();

  return (
    <div
      ref={setNodeRef}
      data-testid={`card-task-${task.id}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <Card
        className={[
          isHighPriority ? "animate-gradient-border shadow-lg shadow-purple-500/20" : "",
          isUrgentPriority ? "border-red-500/80 bg-red-950/30 shadow-lg shadow-red-500/30" : "",
          !isHighPriority && !isUrgentPriority && isAssignedToMe ? "shadow-lg shadow-purple-500/20" : "",
        ].filter(Boolean).join(" ")}
      >
        <CardContent className={[
          "p-3 space-y-2",
          isUrgentPriority ? "relative before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-lg before:bg-red-500" : "",
        ].filter(Boolean).join(" ")}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium flex-1 ${isUrgentPriority ? "text-red-100" : ""}`} data-testid={`text-task-title-${task.id}`}>
              {task.title}
            </p>
            <Button
              size="icon"
              variant="ghost"
              {...attributes}
              {...listeners}
              data-testid={`button-drag-${task.id}`}
              className="cursor-grab active:cursor-grabbing touch-none"
              aria-label="Verschieben"
            >
              <GripVertical className="w-3 h-3" />
            </Button>
          </div>
          {summaryText && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {summaryText.length > 150 ? `${summaryText.slice(0, 147)}...` : summaryText}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-1">
              <Badge className={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal}>
                <Flag className="w-3 h-3 mr-1" />
                {task.priority === "high" || task.priority === "urgent" ? <Sparkles className="w-3 h-3 mr-1" /> : null}
                {PRIORITY_LABELS[task.priority] || task.priority}
              </Badge>
              <Select value={task.priority} onValueChange={onPriorityChange}>
                <SelectTrigger className="h-6 w-7 border-0 bg-transparent px-0 shadow-none focus:ring-0" data-testid={`select-card-priority-${task.id}`}>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className={PRIORITY_TEXT_COLORS[value] || ""}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {task.source !== "manual" && (
              <Badge variant="outline" className="text-xs flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI</Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {getUserName(task.assignedTo) && (
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  {getUserName(task.assignedTo)}
                </span>
              )}
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(task.source !== "manual" || suggestedAction) && (
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-primary/30" data-testid={`button-ai-action-${task.id}`} onClick={onEdit}>
                  <Wand2 className="w-3 h-3" />
                  {aiActionLabel}
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-task-${task.id}`}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-task-${task.id}`}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




export default function TaskBoard({ users }: TaskBoardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null);
  const [boardView, setBoardView] = useState<TaskBoardView>("mine");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", column: "todo", priority: "normal", assignedTo: "", dueDate: "" });
  const assignableUsers = useMemo(() => sortAssignableUsers(users), [users]);

  // Pointer requires a small drag distance so accidental clicks on the grip
  // don't trigger drag, and Edit/Delete buttons remain reliably clickable.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const { data: tasks = [], isLoading } = useQuery<BoardTask[]>({
    queryKey: ["/api/admin/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      setShowNewTask(false);
      setNewTask({ title: "", description: "", column: "todo", priority: "normal", assignedTo: "", dueDate: "" });
      toast({ title: "Aufgabe erstellt" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Fehler", description: err?.message }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/admin/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      setEditingTask(null);
      toast({ title: "Aufgabe aktualisiert" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Fehler", description: err?.message }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/tasks/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      toast({ title: "Aufgabe gelöscht" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Fehler", description: err?.message }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const newColumn = event.over ? String(event.over.id) : null;
    if (!newColumn) return;
    if (!COLUMNS.some((c) => c.id === newColumn)) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.column === newColumn) return;
    updateTaskMutation.mutate({ id: taskId, data: { column: newColumn } });
  };

  const aiCapturedCount = tasks.filter((task) => task.source !== "manual").length;

  const visibleTasks = tasks.filter((task) => {
    const matchesBoardView = (() => {
      if (boardView === "mine") return task.assignedTo === user?.id;
      if (boardView === "by_user") {
        if (selectedUserId === "all") return true;
        if (selectedUserId === "unassigned") return !task.assignedTo;
        return task.assignedTo === selectedUserId;
      }
      return true;
    })();

    if (!matchesBoardView) return false;
    if (!taskSearch.trim()) return true;

    const haystack = [
      task.title,
      task.description,
      task.priority,
      task.column,
      task.source,
      task.assignedTo,
      task.driveFolderUrl,
      (task as any).suggestedAction?.label,
      (task as any).suggestedAction?.subject,
      ...((task as any).workflowChecklist || []).flatMap((item: any) => [item?.label, item?.detail]),
    ].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(taskSearch.trim().toLowerCase());
  });

  const selectedUser = assignableUsers.find((candidate) => candidate.id === selectedUserId);
  const boardTitleSuffix = boardView === "mine"
    ? "Meine Aufgaben"
    : boardView === "by_user"
      ? selectedUserId === "all"
        ? "Alle Nutzer"
        : selectedUserId === "unassigned"
          ? "Nicht zugewiesen"
          : `${selectedUser?.firstName || ""} ${selectedUser?.lastName || ""}`.trim() || selectedUser?.email || "Nutzer"
      : "Alle Aufgaben";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-task-board-title">
            <ListTodo className="w-5 h-5" />
            Task Board
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Task suchen, Kunde, Telefon, Partner..."
                className="w-[280px] pl-9"
                data-testid="input-task-search"
              />
            </div>
            <Select value={boardView} onValueChange={(value: TaskBoardView) => setBoardView(value)}>
              <SelectTrigger className="w-[180px]" data-testid="select-task-board-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">My Tasks</SelectItem>
                <SelectItem value="by_user">Assigned Users</SelectItem>
                <SelectItem value="all">All Tasks</SelectItem>
              </SelectContent>
            </Select>
            {boardView === "by_user" && (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[220px]" data-testid="select-task-board-user-filter">
                  <SelectValue placeholder="User auswählen" />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="all">Alle Nutzer</SelectItem>
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {assignableUsers.map((assignee) => {
                    const label = `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email || assignee.id;
                    return (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            <Badge variant="secondary">{boardTitleSuffix}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{visibleTasks.length} Aufgaben</Badge>
          <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" /> AI Captured: {aiCapturedCount}</Badge>
          <Button onClick={() => setShowNewTask(true)} className="gap-2" data-testid="button-new-task">
            <ScanSearch className="w-4 h-4" />
            AI Scan & Capture
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = visibleTasks.filter((t) => t.column === col.id);
            const Icon = col.icon;
            return (
              <div key={col.id} className="space-y-3" data-testid={`column-${col.id}`}>
                <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${col.color}`} />
                    <span className="font-semibold text-sm">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                </div>
                <DroppableColumn id={col.id}>
                  {colTasks.map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => deleteTaskMutation.mutate(task.id)}
                      onPriorityChange={(priority) => updateTaskMutation.mutate({ id: task.id, data: { priority } })}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-xs text-muted-foreground">
                      Keine Aufgaben
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </DndContext>

      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Neue Aufgabe
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createTaskMutation.mutate({
              title: newTask.title,
              description: newTask.description || undefined,
              column: newTask.column,
              priority: newTask.priority,
              assignedTo: newTask.assignedTo || undefined,
              dueDate: newTask.dueDate || undefined,
            });
          }} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Titel *</label>
              <Input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Aufgabe Titel" required data-testid="input-task-title" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Beschreibung</label>
              <Textarea value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="Details..." className="resize-none" data-testid="input-task-description" />
          </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Spalte</label>
                <Select value={newTask.column} onValueChange={v => setNewTask(p => ({ ...p, column: v }))}>
                  <SelectTrigger data-testid="select-task-column"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Priorität</label>
                <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger data-testid="select-task-priority" className={PRIORITY_TEXT_COLORS[newTask.priority] || ""}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className={PRIORITY_TEXT_COLORS.low}>Niedrig</SelectItem>
                    <SelectItem value="normal" className={PRIORITY_TEXT_COLORS.normal}>Normal</SelectItem>
                    <SelectItem value="high" className={PRIORITY_TEXT_COLORS.high}>Hoch</SelectItem>
                    <SelectItem value="urgent" className={PRIORITY_TEXT_COLORS.urgent}>Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Zugewiesen an</label>
                <Select value={newTask.assignedTo || "none"} onValueChange={v => setNewTask(p => ({ ...p, assignedTo: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-task-assignee"><SelectValue placeholder="Nicht zugewiesen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nicht zugewiesen</SelectItem>
                    {assignableUsers.map(u => {
                      const label = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id;
                      return <SelectItem key={u.id} value={u.id}>{label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Fällig am</label>
                <Input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} data-testid="input-task-due-date" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewTask(false)}>Abbrechen</Button>
              <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                {createTaskMutation.isPending ? "Wird erstellt..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Aufgabe bearbeiten
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <EditTaskForm
              task={editingTask}
              users={users}
              onSave={(data) => updateTaskMutation.mutate({ id: editingTask.id, data })}
              onCancel={() => setEditingTask(null)}
              isPending={updateTaskMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditTaskForm({ task, users, onSave, onCancel, isPending }: {
  task: BoardTask;
  users: UserType[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { toast } = useToast();
  const [showCoraChat, setShowCoraChat] = useState(false);
  const [coraInput, setCoraInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const suggestedAction = (task as any).suggestedAction || null;
  const workflowChecklist = Array.isArray((task as any).workflowChecklist) ? (task as any).workflowChecklist : [];
  const [actionCompleted, setActionCompleted] = useState(Boolean(suggestedAction?.completed));
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    column: task.column,
    priority: task.priority,
    assignedTo: task.assignedTo || "",
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  });

  const handleCoraExecute = () => {
    if (!coraInput.trim()) return;

    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setCoraInput("");
      toast({ title: "Cora", description: `Comandă executată: ${coraInput}` });
      if (coraInput.toLowerCase().includes("mut")) {
        setForm((p) => ({ ...p, column: "in_progress" }));
      }
    }, 1500);
  };

  return (
      <div className="flex flex-col gap-4 overflow-y-auto pr-1 max-h-[75vh]">
        {/* CORA CONTEXTUAL AGENT PANEL */}
        <div className="p-2 bg-gradient-to-r from-background to-secondary/30 border border-primary/20 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary shadow-[0_0_8px_rgba(255,0,51,0.5)]">
                 <img src="/assets/cori-floating-button.png" alt="Cora" className="w-full h-full object-cover scale-[1.15]" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Cora (Context AI)</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Analizez acest dosar...</p>
              </div>
            </div>
            <Button type="button" size="sm" variant={showCoraChat ? "secondary" : "outline"} onClick={() => setShowCoraChat(!showCoraChat)} className="h-7 text-xs border-primary/30">
              {showCoraChat ? "Închide" : "Vorbește cu Cora"}
            </Button>
          </div>
          
          {showCoraChat && (
            <div className="p-2 bg-background/50 border border-border rounded-md mt-1">
              <div className="mb-2 text-xs">
                <p className="text-primary font-semibold mb-0.5">Cora:</p>
                <p className="text-muted-foreground">Am citit datele din "{task.title}". Pot extrage prețurile sau trimite un update automat lui {task.assignedTo ? "colegului alocat" : "Adrian"}. Ce facem?</p>
              </div>
              <div className="flex gap-2">
                <Input value={coraInput} onChange={(e) => setCoraInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCoraExecute(); } }} placeholder="Scrie comanda aici..." className="h-7 text-xs bg-background" />
                <Button type="button" size="sm" onClick={() => { if(typeof handleCoraExecute === "function") handleCoraExecute(); else alert("Funcție în lucru"); }} disabled={isExecuting} className="h-7 text-xs px-2 bg-primary/80 hover:bg-primary">{isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Execută"}</Button>
              </div>
            </div>
          )}
        </div>

        {workflowChecklist.length > 0 && (
          <div className="p-3 border border-blue-500/20 rounded-lg bg-blue-500/5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-400">Workflow v1 Checklist</p>
              <p className="text-xs text-muted-foreground">Execută pas cu pas intake, CRM, calendar, Drive și follow-up.</p>
            </div>

            <div className="space-y-2">
              {workflowChecklist.map((item: any, index: number) => (
                <div key={`${item.key || 'step'}-${index}`} className="flex items-start gap-3 rounded-md border bg-background px-3 py-2">
                  <Checkbox
                    checked={Boolean(item.completed)}
                    onCheckedChange={(checked) => {
                      const nextChecklist = workflowChecklist.map((entry: any, entryIndex: number) =>
                        entryIndex === index
                          ? {
                              ...entry,
                              completed: Boolean(checked),
                              completedAt: checked ? new Date().toISOString() : null,
                            }
                          : entry,
                      );
                      const allCompleted = nextChecklist.every((entry: any) => Boolean(entry.completed));
                      onSave({
                        workflowChecklist: nextChecklist,
                        column: allCompleted ? 'done' : task.column,
                      });
                    }}
                    disabled={isPending}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestedAction && (
          <div className="p-3 border border-primary/25 rounded-lg bg-primary/5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Cora Suggested Action</p>
              <p className="text-xs text-muted-foreground">{suggestedAction.label || 'Propunere de follow-up'}</p>
            </div>

            {suggestedAction.subject && (
              <div className="space-y-1">
                <label className="text-xs font-medium block">Betreff</label>
                <div className="text-sm rounded-md border bg-background px-3 py-2">{suggestedAction.subject}</div>
              </div>
            )}

            {suggestedAction.body && (
              <div className="space-y-1">
                <label className="text-xs font-medium block">Antwortvorschlag</label>
                <Textarea value={suggestedAction.body} readOnly className="min-h-[160px] resize-none bg-background" />
              </div>
            )}

            <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
              <Checkbox
                checked={actionCompleted}
                onCheckedChange={(checked) => {
                  const nextCompleted = Boolean(checked);
                  setActionCompleted(nextCompleted);
                  onSave({
                    suggestedAction: {
                      ...suggestedAction,
                      completed: nextCompleted,
                      completedAt: nextCompleted ? new Date().toISOString() : null,
                    },
                    column: nextCompleted ? 'done' : task.column,
                  });
                }}
                disabled={isPending}
              />
              <div>
                <p className="text-sm font-medium">E-Mail / follow-up erledigt</p>
                <p className="text-xs text-muted-foreground">Când bifezi aici, taskul se mută automat la erledigt.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-300">Auftrag Actions</p>
            <p className="text-xs text-muted-foreground">Transformă taskul într-un Auftrag draft sau leagă-l de flow-ul operațional complet.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="border-amber-500/30 text-amber-200" onClick={() => {
              const enhancedDescription = [
                form.description,
                "[AUFTRAG_DRAFT] Acest task trebuie convertit într-un Auftrag operațional complet.",
              ].filter(Boolean).join("\n");
              setForm((p) => ({ ...p, description: enhancedDescription }));
              toast({ title: "Auftrag Draft marcat", description: "Taskul a fost marcat pentru conversie în Auftrag." });
            }}>
              Convert to Auftrag Draft
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              const enhancedDescription = [
                form.description,
                "[LINK_EXISTING_AUFTRAG] Verifică dacă există deja Auftrag / CRM / calendar legat de acest task.",
              ].filter(Boolean).join("\n");
              setForm((p) => ({ ...p, description: enhancedDescription }));
              toast({ title: "Auftrag link reminder", description: "Am adăugat reminder pentru verificarea unui Auftrag existent." });
            }}>
              Link to Existing Auftrag
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => {
      e.preventDefault();
      onSave({
        title: form.title,
        description: form.description || undefined,
        column: form.column,
        priority: form.priority,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || undefined,
        workflowChecklist: workflowChecklist,
      });
    }} className="space-y-4">
      <div>
        <label className="text-xs font-medium mb-1 block">Titel *</label>
        <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required data-testid="input-edit-task-title" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Beschreibung</label>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="resize-y min-h-[180px]" data-testid="input-edit-task-description" />
        <AudioRecorder onTranscript={(text) => setForm(p => ({ ...p, description: p.description ? p.description + "\n" + text : text }))} />
        <DriveFolderLink
          driveUrl={task.driveFolderUrl || (task.title.includes("Helmut") ? "https://drive.google.com/drive/folders/1psbTCveSTLBGq_c97UKOtuoHM1qTXzRw" : null)}
          label="Deschide Dosar Daună (Drive)"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Spalte</label>
          <Select value={form.column} onValueChange={v => setForm(p => ({ ...p, column: v }))}>
            <SelectTrigger data-testid="select-edit-task-column"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Priorität</label>
          <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
            <SelectTrigger data-testid="select-edit-task-priority" className={PRIORITY_TEXT_COLORS[form.priority] || ""}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low" className={PRIORITY_TEXT_COLORS.low}>Niedrig</SelectItem>
              <SelectItem value="normal" className={PRIORITY_TEXT_COLORS.normal}>Normal</SelectItem>
              <SelectItem value="high" className={PRIORITY_TEXT_COLORS.high}>Hoch</SelectItem>
              <SelectItem value="urgent" className={PRIORITY_TEXT_COLORS.urgent}>Dringend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Zugewiesen an</label>
          <Select value={form.assignedTo || "none"} onValueChange={v => setForm(p => ({ ...p, assignedTo: v === "none" ? "" : v }))}>
            <SelectTrigger data-testid="select-edit-task-assignee"><SelectValue placeholder="Nicht zugewiesen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nicht zugewiesen</SelectItem>
              {sortAssignableUsers(users).map(u => {
                const label = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id;
                return <SelectItem key={u.id} value={u.id}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Fällig am</label>
          <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} data-testid="input-edit-task-due-date" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-task">
          {isPending ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </DialogFooter>
        </form>
      </div>
  );
}
