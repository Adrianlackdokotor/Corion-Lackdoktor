// Team coordination workspace — /admin/comms
//
// Operational work room, not a message log.
// PendingStrip: shows what needs action without scrolling.
// Compact rows: status/note from agents = single line. Important messages stand out naturally.
// Richer order channel header: damage excerpt + delivery date urgency.
// Scroll-to-message from pending strip chips.

import { useState, useEffect, useRef, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Send, RefreshCw, MessageSquare,
  ExternalLink, ChevronDown, ChevronUp, X, AlertCircle, Link2,
} from "lucide-react";
import { useLocation } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthorRole = "human" | "orchestrator" | "worker" | "agent";
type Intent     = "note" | "status" | "question" | "direction" | "task_result" | "decision";
type Ownership  = "awaiting_admin" | "awaiting_agent" | "informational";

interface CoordMessage {
  id:             string;
  channel:        string;
  authorSlug:     string;
  authorRole:     AuthorRole;
  body:           string;
  relatedOrderId: string | null;
  relatedTaskId:  string | null;
  telegramChatId: string | null;
  telegramMsgId:  number | null;
  intent:         Intent | null;
  createdAt:      string;
}

interface LatestRow {
  channel:     string;
  author_slug: string;
  author_role: string;
  body:        string;
  intent:      string | null;
  created_at:  string;
}

// ── Channel definitions ───────────────────────────────────────────────────────

interface ChannelDef {
  key:         string;
  label:       string;
  description: string;
  purpose:     string;
  icon:        string;
}

const PINNED_CHANNELS: ChannelDef[] = [
  {
    key:         "general",
    label:       "general",
    description: "Team-Koordination & Direktiven",
    purpose:     "Anweisungen, Entscheidungen und allgemeine Koordination",
    icon:        "💬",
  },
  {
    key:         "telegram",
    label:       "telegram",
    description: "Brücke von CorionWorkerBot",
    purpose:     "Alle /claude-Gespräche zwischen Adrian und dem Worker",
    icon:        "📱",
  },
  {
    key:         "ops",
    label:       "ops",
    description: "Betriebs- & Statusmeldungen",
    purpose:     "Agenten-Status, System-Events, Cora-Reports",
    icon:        "⚙️",
  },
];

function getChannelDef(key: string): ChannelDef {
  const found = PINNED_CHANNELS.find((c) => c.key === key);
  if (found) return found;
  if (key.startsWith("order:")) {
    const short = key.slice(6, 14);
    return { key, label: `auftrag·${short}`, description: "Auftrag-Raum", purpose: "Koordination für diesen Auftrag", icon: "🔧" };
  }
  if (key.startsWith("task:")) {
    const short = key.slice(5, 13);
    return { key, label: `task·${short}`, description: "Task-Raum", purpose: "Koordination für diesen Task", icon: "📋" };
  }
  return { key, label: key, description: key, purpose: "Kanal", icon: "💬" };
}

// ── Unread tracking ───────────────────────────────────────────────────────────

function getLastSeen(channel: string): number {
  try {
    const v = localStorage.getItem(`comms_seen_${channel}`);
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}
function markSeen(channel: string): void {
  try { localStorage.setItem(`comms_seen_${channel}`, String(Date.now())); } catch {}
}

// ── Ownership derivation ──────────────────────────────────────────────────────

function deriveOwnership(role: AuthorRole, intent: Intent | null): Ownership | null {
  if (!intent) return null;
  if (intent === "note"   || intent === "status") return "informational";
  if (intent === "task_result") return role !== "human" ? "awaiting_admin" : null;
  if (intent === "question")    return role === "human"  ? "awaiting_agent" : "awaiting_admin";
  if (intent === "direction" || intent === "decision") return "awaiting_agent";
  return null;
}

const OWNERSHIP_STYLE: Record<Ownership, { label: string; chipCls: string; badgeCls: string }> = {
  awaiting_admin: {
    label:    "→ Admin",
    chipCls:  "border-amber-700/60 hover:border-amber-500",
    badgeCls: "bg-amber-900/70 text-amber-300 border border-amber-700/50",
  },
  awaiting_agent: {
    label:    "→ Agent",
    chipCls:  "border-sky-700/60 hover:border-sky-500",
    badgeCls: "bg-sky-900/70 text-sky-300 border border-sky-700/50",
  },
  informational: {
    label:    "ℹ︎ Info",
    chipCls:  "border-zinc-700/40 hover:border-zinc-600",
    badgeCls: "bg-zinc-800 text-zinc-500 border border-zinc-700/50",
  },
};

function OwnershipBadge({ role, intent }: { role: AuthorRole; intent: Intent | null }) {
  const o = deriveOwnership(role, intent);
  if (!o || o === "informational") return null;
  const { label, badgeCls } = OWNERSHIP_STYLE[o];
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${badgeCls}`}>{label}</span>;
}

// ── Compact message predicate ─────────────────────────────────────────────────
// status/note from non-human with no linked entity → single compact row

function isCompactMessage(msg: CoordMessage): boolean {
  if (msg.authorRole === "human") return false;
  if (msg.intent !== "status" && msg.intent !== "note") return false;
  if (msg.relatedOrderId || msg.relatedTaskId) return false;
  return true;
}

// ── Role / intent styling ─────────────────────────────────────────────────────

const ROLE_BG: Record<AuthorRole, string> = {
  human:        "bg-zinc-800/80 border border-zinc-700/60",
  orchestrator: "bg-violet-950/80 border border-violet-800/60",
  worker:       "bg-sky-950/80 border border-sky-800/60",
  agent:        "bg-emerald-950/80 border border-emerald-800/60",
};
const ROLE_NAME_COLOR: Record<AuthorRole, string> = {
  human:        "text-zinc-300",
  orchestrator: "text-violet-300",
  worker:       "text-sky-300",
  agent:        "text-emerald-300",
};
const ROLE_BADGE: Record<AuthorRole, string> = {
  human:        "bg-zinc-700 text-zinc-300",
  orchestrator: "bg-violet-800 text-violet-200",
  worker:       "bg-sky-800 text-sky-200",
  agent:        "bg-emerald-800 text-emerald-200",
};

const INTENT_META: Record<Intent, { label: string; icon: string; badge: string; elevated: boolean; accentBorder: string }> = {
  note:        { label: "Notiz",        icon: "📝", badge: "bg-zinc-700 text-zinc-400",       elevated: false, accentBorder: "" },
  status:      { label: "Status",       icon: "🔵", badge: "bg-blue-900 text-blue-300",        elevated: false, accentBorder: "border-l-2 border-l-blue-600" },
  question:    { label: "Frage",        icon: "❓", badge: "bg-amber-900/80 text-amber-300",   elevated: false, accentBorder: "border-l-2 border-l-amber-500" },
  direction:   { label: "Anweisung",    icon: "🎯", badge: "bg-violet-800 text-violet-200",    elevated: true,  accentBorder: "border-l-4 border-l-violet-500" },
  task_result: { label: "Ergebnis",     icon: "✅", badge: "bg-sky-900 text-sky-300",          elevated: false, accentBorder: "border-l-2 border-l-sky-500" },
  decision:    { label: "Entscheidung", icon: "⚡", badge: "bg-rose-900/80 text-rose-300",     elevated: true,  accentBorder: "border-l-4 border-l-rose-500" },
};

// ── Status colors ─────────────────────────────────────────────────────────────

const ORDER_STATUS_COLOR: Record<string, string> = {
  open:           "bg-zinc-700 text-zinc-300",
  angenommen:     "bg-blue-900 text-blue-300",
  in_bearbeitung: "bg-amber-900 text-amber-300",
  fertig:         "bg-lime-900 text-lime-300",
  completed:      "bg-emerald-900 text-emerald-300",
  cancelled:      "bg-rose-900 text-rose-300",
};

const ORDER_STATUS_BORDER: Record<string, string> = {
  open:           "border-l-zinc-600",
  angenommen:     "border-l-blue-600",
  in_bearbeitung: "border-l-amber-500",
  fertig:         "border-l-lime-500",
  completed:      "border-l-emerald-500",
  cancelled:      "border-l-rose-600",
};

const TASK_STATUS_COLOR: Record<string, string> = {
  queued:         "bg-zinc-700 text-zinc-300",
  running:        "bg-sky-900 text-sky-300",
  completed:      "bg-emerald-900 text-emerald-300",
  failed:         "bg-rose-900 text-rose-300",
  pending_review: "bg-amber-900 text-amber-300",
  approved:       "bg-emerald-900 text-emerald-300",
  needs_rework:   "bg-orange-900 text-orange-300",
};

function StatusChip({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const cls = colorMap[status] ?? "bg-zinc-700 text-zinc-300";
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60) return "gerade";
  const min  = Math.floor(sec / 60);
  if (min < 60) return `${min} Min`;
  const h    = Math.floor(min / 60);
  if (h < 24)  return `${h} Std`;
  const d    = Math.floor(h / 24);
  return d === 1 ? "gestern" : `${d} Tage`;
}
function fmtDate(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Heute";
  const y   = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" });
}
function dayKey(iso: string): string { return iso.slice(0, 10); }

function deliveryDateCls(iso: string | null): string {
  if (!iso) return "";
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return "text-rose-400 font-semibold";
  if (diff === 0) return "text-amber-400 font-semibold";
  if (diff <= 2)  return "text-yellow-400";
  return "text-zinc-500";
}

function scrollToMsg(id: string): void {
  document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ── Inline work context cards ─────────────────────────────────────────────────

function OrderContextCard({ orderId }: { orderId: string }) {
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/workshop/orders", orderId],
    queryFn:  () => apiRequest("GET", `/api/workshop/orders/${orderId}`).then((r) => r.json()),
    staleTime: 60000,
    retry: 1,
  });
  const order = data?.order;
  if (isLoading) return (
    <div className="mt-1.5 rounded-md bg-zinc-900/60 border border-zinc-700/40 px-2.5 py-1.5">
      <span className="text-[10px] text-zinc-600">Lade Auftrag…</span>
    </div>
  );
  if (!order) return null;
  return (
    <div className="mt-1.5 rounded-md bg-zinc-900/60 border border-zinc-700/40 px-2.5 py-1.5">
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">🔧</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {order.referenceNumber && <span className="text-[10px] font-mono text-zinc-500">#{order.referenceNumber}</span>}
            <span className="text-[10px] font-semibold text-zinc-300 truncate">{order.customerName}</span>
            <StatusChip status={order.status} colorMap={ORDER_STATUS_COLOR} />
          </div>
          {(order.vehicleMake || order.vehicleModel || order.vehiclePlate) && (
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
              {[order.vehicleMake, order.vehicleModel, order.vehiclePlate].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <button onClick={() => navigate(`/workshop/auftrag/${orderId}`)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0" title="Auftrag öffnen">
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function TaskContextCard({ taskId }: { taskId: string }) {
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/agent-tasks", taskId],
    queryFn:  () => apiRequest("GET", `/api/agent-tasks/${taskId}`).then((r) => r.json()),
    staleTime: 60000,
    retry: 1,
  });
  const task = data?.task ?? data;
  if (isLoading) return (
    <div className="mt-1.5 rounded-md bg-zinc-900/60 border border-zinc-700/40 px-2.5 py-1.5">
      <span className="text-[10px] text-zinc-600">Lade Task…</span>
    </div>
  );
  if (!task?.id) return null;
  return (
    <div className="mt-1.5 rounded-md bg-zinc-900/60 border border-zinc-700/40 px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm shrink-0">📋</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-zinc-300 truncate">{task.title}</span>
            <StatusChip status={task.status} colorMap={TASK_STATUS_COLOR} />
          </div>
          {task.taskType && <p className="text-[10px] text-zinc-600 mt-0.5">{task.agentType} · {task.taskType}</p>}
        </div>
        <button onClick={() => navigate("/admin/agent-tasks")} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0" title="Task öffnen">
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Channel work header (order:* / task:* rooms) ──────────────────────────────

function ChannelWorkHeader({ channel, msgCount }: { channel: string; msgCount: number }) {
  const [, navigate]  = useLocation();
  const queryClient   = useQueryClient();
  const isOrderChannel = channel.startsWith("order:");
  const isTaskChannel  = channel.startsWith("task:");
  const entityId = isOrderChannel ? channel.slice(6) : isTaskChannel ? channel.slice(5) : null;

  const { data: orderData } = useQuery({
    queryKey:  ["/api/workshop/orders", entityId],
    queryFn:   () => apiRequest("GET", `/api/workshop/orders/${entityId}`).then((r) => r.json()),
    enabled:   isOrderChannel && !!entityId,
    staleTime: 30000,
    retry: 1,
  });
  const { data: taskData } = useQuery({
    queryKey:  ["/api/agent-tasks", entityId],
    queryFn:   () => apiRequest("GET", `/api/agent-tasks/${entityId}`).then((r) => r.json()),
    enabled:   isTaskChannel && !!entityId,
    staleTime: 30000,
    retry: 1,
  });

  const order:       any       = orderData?.order;
  const allowedNext: string[]  = orderData?.allowedNext ?? [];
  const files:       any[]     = orderData?.files       ?? [];

  const { data: partnerUser } = useQuery({
    queryKey:  ["/api/admin/users", order?.partnerId],
    queryFn:   () => apiRequest("GET", `/api/admin/users/${order!.partnerId}`).then((r) => r.json()),
    enabled:   !!order?.partnerId,
    staleTime: 60000,
    retry: 1,
  });

  const advanceMutation = useMutation({
    mutationFn: (to: string) =>
      apiRequest("POST", `/api/workshop/orders/${entityId}/transition`, { to }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", entityId] });
    },
  });

  if (!isOrderChannel && !isTaskChannel) return null;

  const task = taskData?.task ?? taskData;

  if (isOrderChannel && order) {
    const delivDate     = order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
      : null;
    const borderCls      = ORDER_STATUS_BORDER[order.status] ?? "border-l-zinc-600";
    const paymentBlocked = ["fertig", "completed"].includes(order.status) && order.paymentStatus === "offen";
    const partnerName    = partnerUser
      ? [partnerUser.firstName, partnerUser.lastName].filter(Boolean).join(" ") || partnerUser.company || "Partner"
      : null;
    const noFiles    = files.length === 0 && !["open", "cancelled"].includes(order.status);
    const noSchedule = !order.scheduledDate && ["angenommen", "in_bearbeitung"].includes(order.status);
    const noPartner  = !order.partnerId && !["open", "cancelled"].includes(order.status);
    const unpriced   = (order.totalAmountCents ?? 0) === 0 && ["fertig", "completed"].includes(order.status);
    const hasReadiness = files.length > 0 || noFiles || order.scheduledDate || noSchedule || (order.totalAmountCents ?? 0) > 0 || unpriced;

    return (
      <div className={`px-4 py-3 bg-zinc-900/60 border-b border-zinc-800 border-l-4 ${borderCls} space-y-1.5`}>
        {/* Row 1: identity + status + advance buttons + open */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Auftrag-Raum</span>
          {order.referenceNumber && <span className="text-[10px] font-mono text-zinc-600">#{order.referenceNumber}</span>}
          <StatusChip status={order.status} colorMap={ORDER_STATUS_COLOR} />
          {allowedNext.slice(0, 2).map((next) => (
            <button
              key={next}
              onClick={() => advanceMutation.mutate(next)}
              disabled={advanceMutation.isPending}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors disabled:opacity-40"
            >
              → {next}
            </button>
          ))}
          {paymentBlocked && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-800/40">
              ⚠ Zahlung offen
            </span>
          )}
          <button
            onClick={() => navigate(`/workshop/auftrag/${entityId}`)}
            className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
          >
            Öffnen <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        {/* Row 2: customer + vehicle + phone + partner */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-zinc-200">{order.customerName}</span>
          {(order.vehicleMake || order.vehicleModel) && (
            <span className="text-[11px] text-zinc-500">
              {[order.vehicleMake, order.vehicleModel].filter(Boolean).join(" ")}
              {order.vehiclePlate && ` · ${order.vehiclePlate}`}
            </span>
          )}
          {order.customerPhone && (
            <a href={`tel:${order.customerPhone}`} className="text-[11px] text-sky-500 hover:text-sky-300 transition-colors">
              ☎ {order.customerPhone}
            </a>
          )}
          {order.partnerId ? (
            <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
              <span className="text-zinc-700">|</span>
              🤝 {partnerName ?? <span className="text-zinc-700">…</span>}
              {partnerUser?.phone && (
                <a href={`tel:${partnerUser.phone}`} className="text-sky-500 hover:text-sky-300 transition-colors">
                  ☎ {partnerUser.phone}
                </a>
              )}
            </span>
          ) : noPartner ? (
            <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
              <span className="text-zinc-700">|</span>
              🤝 kein Partner
            </span>
          ) : null}
        </div>
        {/* Row 3: damage + delivery */}
        {(order.damageDescription || delivDate) && (
          <div className="flex items-center gap-3 flex-wrap">
            {order.damageDescription && (
              <p className="text-[10px] text-zinc-600 truncate max-w-[300px]">
                {order.damageDescription.slice(0, 80)}{order.damageDescription.length > 80 ? "…" : ""}
              </p>
            )}
            {delivDate && (
              <span className={`text-[10px] shrink-0 ${deliveryDateCls(order.deliveryDate)}`}>
                📅 {delivDate}
                {deliveryDateCls(order.deliveryDate).includes("rose") && " · überfällig"}
                {deliveryDateCls(order.deliveryDate).includes("amber") && " · heute"}
              </span>
            )}
          </div>
        )}
        {/* Row 4: readiness snapshot — zero extra fetches, all from existing query */}
        {hasReadiness && (
          <div className="flex items-center gap-3 flex-wrap border-t border-zinc-800/50 pt-1.5">
            {files.length > 0 ? (
              <span className="text-[10px] text-zinc-600">
                📎 {files.length} Datei{files.length !== 1 ? "en" : ""}
              </span>
            ) : noFiles ? (
              <span className="text-[10px] text-amber-500/70">📎 keine Dateien</span>
            ) : null}
            {order.scheduledDate ? (
              <span className="text-[10px] text-zinc-600">
                📅 {new Date(order.scheduledDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
              </span>
            ) : noSchedule ? (
              <span className="text-[10px] text-amber-500/70">📅 kein Termin</span>
            ) : null}
            {(order.totalAmountCents ?? 0) > 0 && (
              <span className="text-[10px] text-zinc-600">
                € {((order.totalAmountCents ?? 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            {unpriced && (
              <span className="text-[10px] text-rose-400/70">€ nicht kalkuliert</span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isTaskChannel && task?.id) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800/40 border-b border-zinc-800 text-xs">
        <span className="text-zinc-500 shrink-0">📋 Task</span>
        <span className="font-semibold text-zinc-200 truncate">{task.title}</span>
        <StatusChip status={task.status} colorMap={TASK_STATUS_COLOR} />
        {task.taskType && <span className="text-zinc-600 hidden sm:inline">{task.agentType} · {task.taskType}</span>}
        <button onClick={() => navigate("/admin/agent-tasks")} className="ml-auto flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors shrink-0">
          Öffnen <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return null;
}

// ── Pending strip ─────────────────────────────────────────────────────────────
// Compact action-queue above the stream. Shows what needs attention now.

function PendingStrip({
  messages,
  dismissed,
  onDismiss,
}: {
  messages:  CoordMessage[];
  dismissed: Set<string>;
  onDismiss: (id: string) => void;
}) {
  const cutoff = Date.now() - 48 * 3600 * 1000;

  const items = messages.filter((m) => {
    if (dismissed.has(m.id)) return false;
    if (new Date(m.createdAt).getTime() < cutoff) return false;
    const o = deriveOwnership(m.authorRole, m.intent);
    return o === "awaiting_admin" || o === "awaiting_agent";
  });

  if (items.length === 0) return null;

  const adminCount = items.filter((m) => deriveOwnership(m.authorRole, m.intent) === "awaiting_admin").length;
  const agentCount = items.filter((m) => deriveOwnership(m.authorRole, m.intent) === "awaiting_agent").length;

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/30 px-3 py-2 shrink-0">
      {/* Summary line */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wider">Ausstehend</span>
        {adminCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-900/60 text-amber-300">
            {adminCount} → Admin
          </span>
        )}
        {agentCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-900/60 text-sky-300">
            {agentCount} → Agent
          </span>
        )}
      </div>

      {/* Scrollable chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {items.map((m) => {
          const o    = deriveOwnership(m.authorRole, m.intent)!;
          const meta = m.intent ? INTENT_META[m.intent] : null;
          const { chipCls } = OWNERSHIP_STYLE[o];

          return (
            <div
              key={m.id}
              onClick={() => scrollToMsg(m.id)}
              className={`flex items-center gap-1.5 shrink-0 border rounded-lg px-2.5 py-1.5 bg-zinc-900 cursor-pointer transition-colors ${chipCls} max-w-[200px] group`}
            >
              <span className="text-xs shrink-0">{meta?.icon ?? "·"}</span>
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-600">{m.authorSlug}</p>
                <p className="text-[10px] text-zinc-300 truncate">{m.body.slice(0, 26)}{m.body.length > 26 ? "…" : ""}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(m.id); }}
                className="text-zinc-700 hover:text-zinc-400 transition-colors shrink-0 ml-0.5 opacity-0 group-hover:opacity-100"
                aria-label="Schließen"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact informational row ─────────────────────────────────────────────────
// Used for status/note messages from non-human agents — not a full bubble.

function CompactRow({ msg, hideHeader }: { msg: CoordMessage; hideHeader: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = msg.intent ? INTENT_META[msg.intent] : null;
  const body = expanded ? msg.body : (msg.body.length > 120 ? msg.body.slice(0, 120) + "…" : msg.body);

  return (
    <div
      id={`msg-${msg.id}`}
      className="flex items-start gap-2 px-2 py-1 rounded-md hover:bg-zinc-900/40 transition-colors"
    >
      <span className="text-xs shrink-0 mt-0.5 opacity-70">{meta?.icon ?? "·"}</span>
      {!hideHeader && (
        <span className={`text-[10px] font-medium shrink-0 mt-0.5 ${ROLE_NAME_COLOR[msg.authorRole]}`}>
          {msg.authorSlug}
        </span>
      )}
      {hideHeader && <span className="w-[52px] shrink-0" />}
      <p
        className="text-xs text-zinc-500 flex-1 leading-relaxed select-text cursor-text"
        onClick={() => msg.body.length > 120 && setExpanded((v) => !v)}
      >
        {body}
      </p>
      <span className="text-[10px] text-zinc-700 shrink-0 mt-0.5">{fmtTime(msg.createdAt)}</span>
    </div>
  );
}

// ── Message body with collapse ────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 400;

function MessageBody({ body, forceExpand }: { body: string; forceExpand?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = !forceExpand && body.length > COLLAPSE_THRESHOLD;
  const shown = needsCollapse && !expanded ? body.slice(0, COLLAPSE_THRESHOLD) + "…" : body;
  return (
    <div>
      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text">{shown}</p>
      {needsCollapse && (
        <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
          {expanded
            ? <><ChevronUp className="w-3 h-3" /> Weniger</>
            : <><ChevronDown className="w-3 h-3" /> {body.length - COLLAPSE_THRESHOLD} Zeichen mehr</>}
        </button>
      )}
    </div>
  );
}

// ── Full message bubble ───────────────────────────────────────────────────────

function MessageBubble({ msg, hideHeader, suppressOrderCard }: { msg: CoordMessage; hideHeader: boolean; suppressOrderCard?: string }) {
  const isHuman  = msg.authorRole === "human";
  const hasTG    = !!msg.telegramChatId;
  const meta     = msg.intent ? INTENT_META[msg.intent] : null;
  const elevated = meta?.elevated ?? false;

  const baseBg = elevated
    ? (msg.intent === "decision"
        ? "bg-rose-950/70 border border-rose-800/50"
        : "bg-violet-950/70 border border-violet-800/50")
    : ROLE_BG[msg.authorRole];

  return (
    <div id={`msg-${msg.id}`} className={`flex ${isHuman ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`
        max-w-[80%] sm:max-w-[72%] rounded-xl px-3 pt-2 pb-2
        ${baseBg} ${meta?.accentBorder ?? ""}
        ${isHuman ? "rounded-tr-sm" : "rounded-tl-sm"}
        ${elevated ? "shadow-lg" : ""}
      `}>
        {!hideHeader && (
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`text-xs font-semibold ${ROLE_NAME_COLOR[msg.authorRole]}`}>{msg.authorSlug}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_BADGE[msg.authorRole]}`}>{msg.authorRole}</span>
            {hasTG && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/80 text-blue-300">📱 TG</span>}
            {meta && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.icon} {meta.label}</span>}
            <OwnershipBadge role={msg.authorRole} intent={msg.intent} />
          </div>
        )}
        <MessageBody body={msg.body} forceExpand={elevated} />
        {msg.relatedOrderId && msg.relatedOrderId !== suppressOrderCard && <OrderContextCard orderId={msg.relatedOrderId} />}
        {msg.relatedTaskId  && <TaskContextCard  taskId={msg.relatedTaskId} />}
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-zinc-600">{fmtTime(msg.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar channel item ──────────────────────────────────────────────────────

function SidebarChannel({ def, active, latest, unread, needsAttention, onClick }: {
  def:            ChannelDef;
  active:         boolean;
  latest:         LatestRow | null;
  unread:         boolean;
  needsAttention: boolean;
  onClick:        () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-0.5 ${
        active ? "bg-zinc-700/80 text-white" : "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base shrink-0">{def.icon}</span>
        <span className="text-xs font-semibold truncate flex-1">#{def.label}</span>
        {unread && !active && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />}
        {needsAttention && !active && <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />}
      </div>
      {latest ? (
        <div className="mt-0.5 pl-7">
          <p className="text-[10px] text-zinc-500 truncate">
            <span className="text-zinc-600">{latest.author_slug}: </span>
            {latest.body.slice(0, 42)}{latest.body.length > 42 ? "…" : ""}
          </p>
          <p className="text-[9px] text-zinc-700 mt-0.5">{relTime(latest.created_at)}</p>
        </div>
      ) : (
        <p className="mt-0.5 pl-7 text-[10px] text-zinc-700">Leer</p>
      )}
    </button>
  );
}

// ── Day divider ───────────────────────────────────────────────────────────────

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-xs text-zinc-600 font-medium">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

// ── Intent picker ─────────────────────────────────────────────────────────────

const COMPOSE_INTENTS: Intent[] = ["note", "status", "question", "direction", "decision"];

function IntentPicker({ value, onChange }: { value: Intent | null; onChange: (v: Intent | null) => void }) {
  return (
    <div className="flex gap-1 flex-wrap px-3 pt-2 pb-0">
      {COMPOSE_INTENTS.map((opt) => {
        const m      = INTENT_META[opt];
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? null : opt)}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              active ? m.badge + " ring-1 ring-white/20" : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Link input ────────────────────────────────────────────────────────────────

function LinkInput({ orderId, taskId, onOrderId, onTaskId }: {
  orderId: string; taskId: string;
  onOrderId: (v: string) => void; onTaskId: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 px-3 pb-1">
      <div className="flex-1">
        <label className="block text-[9px] text-zinc-600 mb-0.5">Auftrag-ID</label>
        <Input value={orderId} onChange={(e) => onOrderId(e.target.value)} placeholder="UUID…"
          className="h-7 text-[11px] bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-700" />
      </div>
      <div className="flex-1">
        <label className="block text-[9px] text-zinc-600 mb-0.5">Task-ID</label>
        <Input value={taskId} onChange={(e) => onTaskId(e.target.value)} placeholder="UUID…"
          className="h-7 text-[11px] bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-700" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminComms() {
  const [, navigate]   = useLocation();
  const queryClient    = useQueryClient();
  const [channel, setChannel]         = useState(() => {
    try { return new URLSearchParams(window.location.search).get("channel") ?? "general"; }
    catch { return "general"; }
  });
  const [draft, setDraft]             = useState("");
  const [intent, setIntent]           = useState<Intent | null>(null);
  const [linkOpen, setLinkOpen]       = useState(false);
  const [linkOrderId, setLinkOrderId] = useState("");
  const [linkTaskId, setLinkTaskId]   = useState("");
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());
  const bottomRef    = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const def            = getChannelDef(channel);
  const channelOrderId = channel.startsWith("order:") ? channel.slice(6) : "";
  const channelTaskId  = channel.startsWith("task:")  ? channel.slice(5)  : "";
  const isWorkRoom     = !!channelOrderId || !!channelTaskId;

  const { data, isLoading, refetch, isFetching } = useQuery<{ messages: CoordMessage[] }>({
    queryKey:        ["/api/comms/messages", channel],
    queryFn:         () =>
      apiRequest("GET", `/api/comms/messages?channel=${encodeURIComponent(channel)}&limit=200`).then((r) => r.json()),
    refetchInterval: 5000,
  });

  const { data: latestData } = useQuery<{ latest: LatestRow[] }>({
    queryKey:        ["/api/comms/latest"],
    queryFn:         () => apiRequest("GET", "/api/comms/latest").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const { data: channelListData } = useQuery<{ channels: string[] }>({
    queryKey:        ["/api/comms/channels"],
    queryFn:         () => apiRequest("GET", "/api/comms/channels").then((r) => r.json()),
    refetchInterval: 20000,
  });

  // Room-level order context (deduped with ChannelWorkHeader query)
  const { data: roomOrderData } = useQuery({
    queryKey:  ["/api/workshop/orders", channelOrderId],
    queryFn:   () => apiRequest("GET", `/api/workshop/orders/${channelOrderId}`).then((r) => r.json()),
    enabled:   !!channelOrderId,
    staleTime: 30000,
    retry: 1,
  });
  const roomStatus    = roomOrderData?.order?.status ?? null;
  const streamBorder  = channelOrderId && roomStatus
    ? `border-l-2 ${ORDER_STATUS_BORDER[roomStatus] ?? "border-l-zinc-700"}`
    : "";

  const messages   = data?.messages ?? [];
  const latestMap  = new Map<string, LatestRow>(
    (latestData?.latest ?? []).map((r) => [r.channel, r]),
  );

  // Cross-channel attention count — channels where last message needs admin action
  const globalPending = (latestData?.latest ?? []).filter((r) => {
    if (r.channel === channel) return false; // active channel already visible
    const o = deriveOwnership(r.author_role as AuthorRole, r.intent as Intent | null);
    return o === "awaiting_admin";
  }).length;

  const pinnedKeys     = PINNED_CHANNELS.map((c) => c.key);
  const dbChannels     = channelListData?.channels ?? [];
  const extraKeys      = dbChannels.filter((c) => !pinnedKeys.includes(c));
  const allChannelKeys = [...pinnedKeys, ...extraKeys];

  useEffect(() => { if (messages.length > 0) markSeen(channel); }, [channel, messages.length]);

  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 60);
  }, [channel]);

  const postMutation = useMutation({
    mutationFn: (p: { body: string; intent: Intent | null; orderId: string; taskId: string }) =>
      apiRequest("POST", "/api/comms/messages", {
        channel,
        authorSlug: "admin",
        authorRole: "human",
        body:       p.body,
        ...(p.intent  ? { intent: p.intent }                  : {}),
        ...(p.orderId ? { relatedOrderId: p.orderId }         : {}),
        ...(p.taskId  ? { relatedTaskId:  p.taskId }          : {}),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comms/messages", channel] });
      queryClient.invalidateQueries({ queryKey: ["/api/comms/latest"] });
      setDraft(""); setIntent(null); setLinkOrderId(""); setLinkTaskId(""); setLinkOpen(false);
    },
  });

  function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || postMutation.isPending) return;
    const effectiveOrderId = channelOrderId || linkOrderId.trim();
    const effectiveTaskId  = channelTaskId  || linkTaskId.trim();
    postMutation.mutate({ body: text, intent, orderId: effectiveOrderId, taskId: effectiveTaskId });
  }

  function dismissItem(id: string) {
    setDismissed((s) => { const n = new Set(Array.from(s)); n.add(id); return n; });
  }

  // Needs-attention indicator in channel bar
  const lastMsg = messages[messages.length - 1];
  const channelNeedsAttention = !!lastMsg && lastMsg.authorRole !== "human" && lastMsg.intent === "question";

  // Group messages by day → consecutive same-author
  const grouped: Array<{
    day:    string;
    label:  string;
    groups: Array<{ author: string; role: AuthorRole; messages: CoordMessage[] }>;
  }> = [];

  for (const msg of messages) {
    const dk = dayKey(msg.createdAt);
    let dayBlock = grouped[grouped.length - 1];
    if (!dayBlock || dayBlock.day !== dk) {
      dayBlock = { day: dk, label: fmtDate(msg.createdAt), groups: [] };
      grouped.push(dayBlock);
    }
    const lastGroup = dayBlock.groups[dayBlock.groups.length - 1];
    if (lastGroup && lastGroup.author === msg.authorSlug && lastGroup.role === msg.authorRole) {
      lastGroup.messages.push(msg);
    } else {
      dayBlock.groups.push({ author: msg.authorSlug, role: msg.authorRole, messages: [msg] });
    }
  }

  const hasLink = linkOrderId.trim() || linkTaskId.trim();

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => navigate("/admin")} className="text-zinc-500 hover:text-white transition-colors" aria-label="Zurück">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MessageSquare className="w-4 h-4 text-sky-500 shrink-0" />
        <span className="font-semibold text-base">Koordinations-Raum</span>
        {globalPending > 0 && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/40">
            <AlertCircle className="w-3 h-3" />
            {globalPending} warten
          </span>
        )}
        <div className="flex-1" />
        <button onClick={() => refetch()} className={`text-zinc-500 hover:text-white transition-colors ${isFetching ? "animate-spin" : ""}`} aria-label="Aktualisieren">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto p-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-2 mt-1">Kanäle</p>
          {allChannelKeys.map((key) => {
            const d        = getChannelDef(key);
            const latest   = latestMap.get(key) ?? null;
            const isActive = key === channel;
            const unread   = !isActive && !!latest && new Date(latest.created_at).getTime() > getLastSeen(key);
            const attn     = !isActive && !!latest && latest.author_role !== "human" && latest.intent === "question";
            return (
              <SidebarChannel key={key} def={d} active={isActive} latest={latest}
                unread={unread} needsAttention={attn} onClick={() => setChannel(key)} />
            );
          })}
          <div className="mt-auto pt-4 border-t border-zinc-800 px-2 pb-2">
            <p className="text-[9px] text-zinc-700 leading-relaxed">
              Linked rooms: Nachrichten an <span className="font-mono">order:&lt;id&gt;</span> oder{" "}
              <span className="font-mono">task:&lt;id&gt;</span> erscheinen hier automatisch.
            </p>
          </div>
        </nav>

        {/* Stream column */}
        <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${streamBorder}`}>

          {/* Mobile channel tabs */}
          <div className="md:hidden flex gap-1.5 flex-wrap px-3 pt-2 pb-1 border-b border-zinc-900">
            {allChannelKeys.map((key) => {
              const d      = getChannelDef(key);
              const latest = latestMap.get(key) ?? null;
              const unread = key !== channel && !!latest && new Date(latest.created_at).getTime() > getLastSeen(key);
              return (
                <button key={key} onClick={() => setChannel(key)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    key === channel ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>#{d.label}</span>
                  {unread && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Channel info bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border-b border-zinc-900 shrink-0">
            <span>{def.icon}</span>
            <span className="text-xs font-semibold text-zinc-200">#{def.label}</span>
            <span className="text-zinc-700 text-xs">·</span>
            <span className="text-xs text-zinc-500 truncate">{def.purpose}</span>
            {channelNeedsAttention && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-400 shrink-0">
                <AlertCircle className="w-3 h-3" /> Antwort erwartet
              </span>
            )}
            {!channelNeedsAttention && messages.length > 0 && (
              <span className="ml-auto text-[10px] text-zinc-700">{messages.length}</span>
            )}
          </div>

          {/* Live work object header for order:* / task:* channels */}
          <ChannelWorkHeader channel={channel} msgCount={messages.length} />

          {/* Pending actions strip */}
          <PendingStrip messages={messages} dismissed={dismissed} onDismiss={dismissItem} />

          {/* Message stream */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {isLoading && <div className="text-center text-zinc-600 text-sm mt-10">Lade…</div>}

            {!isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center pb-16">
                <span className="text-3xl mb-3 opacity-30">{def.icon}</span>
                <p className="text-zinc-500 text-sm font-medium">#{def.label} ist leer</p>
                <p className="text-zinc-700 text-xs mt-1 max-w-[240px]">{def.purpose}</p>
                {channel === "telegram" && (
                  <p className="text-zinc-700 text-xs mt-3 max-w-[240px]">
                    Nachrichten erscheinen automatisch wenn du mit /claude im Bot sprichst.
                  </p>
                )}
              </div>
            )}

            {grouped.map(({ day, label, groups }) => (
              <div key={day}>
                <DayDivider label={label} />
                {groups.map((group, gi) => (
                  <div key={gi} className="mb-1.5">
                    {group.messages.map((msg, mi) =>
                      isCompactMessage(msg)
                        ? <CompactRow key={msg.id} msg={msg} hideHeader={mi > 0} />
                        : <MessageBubble key={msg.id} msg={msg} hideHeader={mi > 0} suppressOrderCard={channelOrderId || undefined} />
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-950">
            <IntentPicker value={intent} onChange={setIntent} />
            {linkOpen && (
              <LinkInput orderId={linkOrderId} taskId={linkTaskId}
                onOrderId={setLinkOrderId} onTaskId={setLinkTaskId} />
            )}
            <form onSubmit={handleSend} className="flex items-end gap-2 px-3 py-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as FormEvent);
                  }
                }}
                placeholder={
                  channelOrderId ? "Koordinations-Notiz zu diesem Auftrag…"
                  : channelTaskId ? "Notiz zu diesem Task…"
                  : `Nachricht an #${def.label}…`
                }
                rows={2}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm resize-none flex-1 min-h-[44px] max-h-[120px]"
              />
              <div className="flex flex-col gap-1">
                {!isWorkRoom && (
                  <Button
                    type="button"
                    onClick={() => setLinkOpen((v) => !v)}
                    title="Verknüpfen"
                    className={`h-9 w-9 p-0 shrink-0 transition-colors ${
                      linkOpen || hasLink ? "bg-sky-800 hover:bg-sky-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                )}
                <Button type="submit" disabled={!draft.trim() || postMutation.isPending}
                  className="bg-sky-600 hover:bg-sky-500 text-white shrink-0 h-9 w-9 p-0" aria-label="Senden">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="px-4 pb-2 flex items-center gap-2 text-[10px] text-zinc-700">
              <span>Enter senden · Shift+Enter Zeile</span>
              {channelOrderId && (
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">🔧 auto-verknüpft</span>
              )}
              {channelTaskId && (
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">📋 auto-verknüpft</span>
              )}
              {intent && (
                <span className={`px-1.5 py-0.5 rounded-full ${INTENT_META[intent].badge}`}>
                  {INTENT_META[intent].icon} {INTENT_META[intent].label}
                </span>
              )}
              {!isWorkRoom && hasLink && (
                <span className="px-1.5 py-0.5 rounded-full bg-sky-900/60 text-sky-400">🔗 verknüpft</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
