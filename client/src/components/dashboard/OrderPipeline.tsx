import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import {
  Car,
  User as UserIcon,
  AlertCircle,
  Wrench,
  CheckCircle2,
  Inbox,
  XCircle,
  Handshake,
  CheckSquare,
  Pencil,
  Flame,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { WorkshopOrder, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const PIPELINE_STATUSES = [
  "open",
  "angenommen",
  "in_bearbeitung",
  "fertig",
  "completed",
  "cancelled",
] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

interface PipelineColumnDef {
  id: PipelineStatus;
  label: string;
  icon: typeof Inbox;
  accent: string; // top border color
  dotBg: string;
  emptyHint: string;
}

const COLUMNS: PipelineColumnDef[] = [
  {
    id: "open",
    label: "Offen",
    icon: Inbox,
    accent: "border-t-blue-500",
    dotBg: "bg-blue-500",
    emptyHint: "Neue Anfragen erscheinen hier.",
  },
  {
    id: "angenommen",
    label: "Angenommen",
    icon: Handshake,
    accent: "border-t-purple-500",
    dotBg: "bg-purple-500",
    emptyHint: "Vom Partner angenommene Aufträge.",
  },
  {
    id: "in_bearbeitung",
    label: "In Arbeit",
    icon: Wrench,
    accent: "border-t-orange-500",
    dotBg: "bg-orange-500",
    emptyHint: "Aktive Reparaturen.",
  },
  {
    id: "fertig",
    label: "Fertig",
    icon: CheckCircle2,
    accent: "border-t-green-500",
    dotBg: "bg-green-500",
    emptyHint: "Bereit zur Abholung.",
  },
  {
    id: "completed",
    label: "Abgeschlossen",
    icon: CheckSquare,
    accent: "border-t-emerald-500",
    dotBg: "bg-emerald-500",
    emptyHint: "Abgeschlossen & abgerechnet.",
  },
  {
    id: "cancelled",
    label: "Storniert",
    icon: XCircle,
    accent: "border-t-red-500",
    dotBg: "bg-red-500",
    emptyHint: "Stornierte Aufträge.",
  },
];

const BRAND_PALETTE = [
  "from-blue-600 to-blue-800",
  "from-red-600 to-red-800",
  "from-emerald-600 to-emerald-800",
  "from-amber-600 to-amber-800",
  "from-purple-600 to-purple-800",
  "from-cyan-600 to-cyan-800",
  "from-pink-600 to-pink-800",
  "from-zinc-600 to-zinc-800",
];

// Distinct palette for partner identity — solid, saturated, recognizable
const PARTNER_COLORS = [
  "#7c3aed", // violet
  "#0284c7", // sky-blue
  "#059669", // emerald
  "#e11d48", // rose
  "#d97706", // amber
  "#4f46e5", // indigo
  "#0d9488", // teal
  "#c026d3", // fuchsia
  "#dc2626", // red
  "#16a34a", // green
];

function partnerColor(partnerId: string): string {
  let hash = 0;
  for (let i = 0; i < partnerId.length; i++)
    hash = (hash * 31 + partnerId.charCodeAt(i)) | 0;
  return PARTNER_COLORS[Math.abs(hash) % PARTNER_COLORS.length];
}

function partnerInitials(partner: User): string {
  const first = (partner.firstName ?? "").trim();
  const last = (partner.lastName ?? "").trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (partner.company) return partner.company.slice(0, 2).toUpperCase();
  return ((partner.email ?? "??").slice(0, 2)).toUpperCase();
}

function PartnerBadge({ partner }: { partner: User }) {
  const color = partnerColor(partner.id);
  const initials = partnerInitials(partner);
  const label = [partner.firstName, partner.lastName].filter(Boolean).join(" ") || partner.company || "Partner";

  if (partner.profileImageUrl) {
    return (
      <div
        className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 shadow-md"
        style={{ outline: `2px solid ${color}`, outlineOffset: "1px" }}
        title={`Partner: ${label}`}
      >
        <img
          src={partner.profileImageUrl}
          alt={initials}
          className="w-full h-full object-cover"
          onError={(e) => {
            // show initials fallback if image URL breaks
            const el = e.currentTarget.parentElement;
            if (el) {
              el.style.outline = `2px solid ${color}`;
              el.style.outlineOffset = "1px";
              el.style.background = color;
              el.style.display = "flex";
              el.style.alignItems = "center";
              el.style.justifyContent = "center";
              el.innerHTML = `<span style="font-size:11px;font-weight:900;color:white;">${initials}</span>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="w-9 h-9 rounded-md flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 shadow-md"
      style={{ background: color }}
      title={`Partner: ${label}`}
      aria-label={`Partner: ${label}`}
    >
      {initials}
    </div>
  );
}

function brandSwatch(make: string | null | undefined): {
  initials: string;
  gradient: string;
} {
  const m = (make ?? "").trim();
  const initials = m ? m.slice(0, 2).toUpperCase() : "??";
  let hash = 0;
  for (let i = 0; i < m.length; i++) hash = (hash * 31 + m.charCodeAt(i)) | 0;
  const gradient = BRAND_PALETTE[Math.abs(hash) % BRAND_PALETTE.length];
  return { initials, gradient };
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getOrderMeta(order: WorkshopOrder): {
  priority: "low" | "normal" | "high" | "urgent";
  internalNote: string;
} {
  const json = (order.repairProtocolJson as any) || {};
  return {
    priority: ["low", "normal", "high", "urgent"].includes(json?.priority)
      ? json.priority
      : "normal",
    internalNote: typeof json?.internalNote === "string" ? json.internalNote : "",
  };
}

function isOverdue(order: WorkshopOrder): boolean {
  if (!order.scheduledDate) return false;
  if (["fertig", "completed", "cancelled"].includes(order.status)) return false;
  return new Date(order.scheduledDate).getTime() < Date.now();
}

interface OrderPipelineProps {
  orders: WorkshopOrder[];
  partners: User[];
  onOpenCrm?: (order: WorkshopOrder) => void;
}

export default function OrderPipeline({
  orders,
  partners,
  onOpenCrm,
}: OrderPipelineProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PipelineStatus }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/workshop-orders/${id}/status`,
        { status },
      );
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/admin/workshop-orders"],
      });
      const previous = queryClient.getQueryData<WorkshopOrder[]>([
        "/api/admin/workshop-orders",
      ]);
      if (previous) {
        queryClient.setQueryData<WorkshopOrder[]>(
          ["/api/admin/workshop-orders"],
          previous.map((o) => (o.id === id ? { ...o, status } : o)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(
          ["/api/admin/workshop-orders"],
          ctx.previous,
        );
      }
      toast({
        variant: "destructive",
        title: "Status konnte nicht geändert werden",
        description: "Bitte erneut versuchen.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/workshop-orders"],
      });
    },
  });

  const grouped = useMemo(() => {
    const result: Record<PipelineStatus, WorkshopOrder[]> = {
      open: [],
      angenommen: [],
      in_bearbeitung: [],
      fertig: [],
      completed: [],
      cancelled: [],
    };
    for (const order of orders) {
      const status = (PIPELINE_STATUSES as readonly string[]).includes(
        order.status,
      )
        ? (order.status as PipelineStatus)
        : "open";
      result[status].push(order);
    }
    return result;
  }, [orders]);

  const overdueCount = useMemo(
    () => orders.filter(isOverdue).length,
    [orders],
  );

  const activeOrder = activeId
    ? orders.find((o) => o.id === activeId) ?? null
    : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const target = String(over.id);
    if (!(PIPELINE_STATUSES as readonly string[]).includes(target)) return;
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status === target) return;
    statusMutation.mutate({ id, status: target as PipelineStatus });
  }

  return (
    <div data-testid="pipeline-orders">
      {overdueCount > 0 && (
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400"
          data-testid="pipeline-overdue-banner"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {overdueCount} überfällige{" "}
          {overdueCount === 1 ? "Auftrag" : "Aufträge"}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="overflow-x-auto -mx-4 md:mx-0 scrollbar-thin">
          <div className="min-w-[1280px] xl:min-w-0 px-4 md:px-0 grid grid-cols-6 gap-3">
            {COLUMNS.map((col) => (
              <PipelineColumn
                key={col.id}
                col={col}
                items={grouped[col.id]}
                partners={partners}
                onOpenCrm={onOpenCrm}
                isDragging={activeId !== null}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="rotate-1 opacity-90">
              <OrderCard
                order={activeOrder}
                partners={partners}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface ColumnProps {
  col: PipelineColumnDef;
  items: WorkshopOrder[];
  partners: User[];
  onOpenCrm?: (order: WorkshopOrder) => void;
  isDragging: boolean;
}

function PipelineColumn({
  col,
  items,
  partners,
  onOpenCrm,
  isDragging,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const totalCents = items.reduce(
    (sum, o) => sum + (o.totalAmountCents ?? 0),
    0,
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-zinc-950/60 border border-zinc-800 border-t-4 rounded-lg overflow-hidden transition-colors ${col.accent} ${
        isOver
          ? "ring-2 ring-red-500/60 bg-zinc-900/80"
          : isDragging
            ? "bg-zinc-900/40"
            : ""
      }`}
      data-testid={`pipeline-column-${col.id}`}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full ${col.dotBg} flex-shrink-0`}
          />
          <col.icon className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
            {col.label}
          </span>
        </div>
        <span
          className="text-[11px] font-bold tabular-nums text-zinc-300 bg-zinc-900 rounded-full px-2 py-0.5"
          data-testid={`pipeline-count-${col.id}`}
        >
          {items.length}
        </span>
      </div>

      {totalCents > 0 && (
        <div className="px-3 py-1 text-[10px] text-zinc-500 border-b border-zinc-800/60">
          Σ {fmtEur(totalCents)} €
        </div>
      )}

      <div className="p-2 space-y-2 min-h-[160px] max-h-[640px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-10 px-2 text-[11px] text-zinc-600">
            {isOver ? "Hier ablegen" : col.emptyHint}
          </div>
        ) : (
          items.map((o) => (
            <DraggableCard
              key={o.id}
              order={o}
              partners={partners}
              onOpenCrm={onOpenCrm}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface DraggableCardProps {
  order: WorkshopOrder;
  partners: User[];
  onOpenCrm?: (order: WorkshopOrder) => void;
}

function DraggableCard({ order, partners, onOpenCrm }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
    >
      <OrderCard
        order={order}
        partners={partners}
        onOpenCrm={onOpenCrm}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface OrderCardProps {
  order: WorkshopOrder;
  partners: User[];
  onOpenCrm?: (order: WorkshopOrder) => void;
  dragHandleProps?: any;
  isOverlay?: boolean;
}

function OrderCard({
  order,
  partners,
  onOpenCrm,
  dragHandleProps,
  isOverlay,
}: OrderCardProps) {
  const swatch = brandSwatch(order.vehicleMake);
  const total = order.totalAmountCents ?? 0;
  const nettoCents = Math.round(total / 1.19);
  const isUnassigned = !order.partnerId;
  const meta = getOrderMeta(order);
  const overdue = isOverdue(order);
  const partner = partners.find((p) => p.id === order.partnerId);

  const priorityStyles: Record<typeof meta.priority, string> = {
    low: "text-zinc-500 border-zinc-700",
    normal: "",
    high: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    urgent: "text-red-400 border-red-500/40 bg-red-500/10",
  };

  return (
    <article
      className={`group relative bg-zinc-900 border border-zinc-800 hover:border-red-600/50 rounded-md p-3 transition-colors ${
        isOverlay ? "shadow-2xl ring-1 ring-red-500/50" : ""
      } ${overdue ? "border-l-2 border-l-red-500" : ""}`}
      data-testid={`pipeline-card-${order.id}`}
    >
      {/* Drag handle covers most of the card. Buttons stop propagation so they remain clickable. */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
        aria-label="Karte verschieben"
        data-testid={`pipeline-card-drag-${order.id}`}
      />

      {/* Action row (above drag layer) */}
      <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {partner ? (
            <PartnerBadge partner={partner} />
          ) : (
            <div
              className={`w-9 h-9 rounded-md bg-gradient-to-br ${swatch.gradient} flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 shadow-md`}
              aria-label={order.vehicleMake ?? "Unbekannte Marke"}
            >
              {swatch.initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {order.vehicleMake || "Marke?"}{" "}
              <span className="text-zinc-300 font-normal">
                {order.vehicleModel || ""}
              </span>
            </div>
            {order.referenceNumber && (
              <div className="text-[10px] text-zinc-500 font-mono truncate">
                {order.referenceNumber}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {meta.priority === "urgent" && (
              <span
                className="inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider border-red-500/50 bg-red-500/15 text-red-400"
                title="Dringend"
              >
                <Flame className="w-2.5 h-2.5" /> Dringend
              </span>
            )}
            {meta.priority === "high" && (
              <span
                className="inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider border-amber-500/50 bg-amber-500/15 text-amber-400"
                title="Hoch"
              >
                Hoch
              </span>
            )}
            {isUnassigned && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 text-[10px] font-bold px-1.5 py-0.5"
                title="Kein Partner zugewiesen"
              >
                <AlertCircle className="w-2.5 h-2.5" /> Offen
              </span>
            )}
          </div>
          {!isOverlay && onOpenCrm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCrm(order);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="opacity-60 hover:opacity-100 text-zinc-300 hover:text-white p-1 rounded hover-elevate"
              aria-label="Kundendossier öffnen"
              data-testid={`pipeline-card-edit-${order.id}`}
              title="Kundendossier öffnen"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {order.vehiclePlate && (
        <div className="relative z-10 mb-2">
          <div
            className="inline-flex items-center gap-1 max-w-full rounded border-2 border-white/90 bg-white text-black text-[11px] font-black tracking-wider px-1.5 py-0.5 shadow-sm"
            title={order.vehiclePlate}
          >
            <Car className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{order.vehiclePlate}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center gap-1.5 text-xs text-zinc-300 mb-2 truncate">
        <UserIcon className="w-3 h-3 text-zinc-500 flex-shrink-0" />
        <span className="truncate">
          {order.customerName || "Kein Name"}
        </span>
      </div>

      {partner && (
        <div
          className="relative z-10 text-[10px] font-semibold mb-2 truncate"
          style={{ color: partnerColor(partner.id) }}
        >
          {[partner.firstName, partner.lastName].filter(Boolean).join(" ") || partner.company || "Partner"}
        </div>
      )}

      {order.scheduledDate && (
        <div
          className={`relative z-10 inline-flex items-center gap-1 text-[10px] mb-2 ${
            overdue ? "text-red-400 font-bold" : "text-zinc-400"
          }`}
        >
          <Clock className="w-2.5 h-2.5" />
          {new Date(order.scheduledDate).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
          {overdue && " · überfällig"}
        </div>
      )}

      <div className="relative z-10 flex items-end justify-between gap-2 pt-2 border-t border-zinc-800">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 leading-none">
            Netto
          </div>
          <div className="text-xs font-bold tabular-nums text-zinc-300 leading-tight">
            {fmtEur(nettoCents)} €
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-red-400 leading-none">
            Brutto
          </div>
          <div className="text-base font-black tabular-nums text-white leading-tight">
            {fmtEur(total)} €
          </div>
        </div>
      </div>

      {/* Click target above drag layer for opening CRM modal */}
      {!isOverlay && onOpenCrm && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCrm(order);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-1 right-1 z-10 text-[10px] text-zinc-500 hover:text-white px-1.5 py-0.5 rounded hover-elevate"
          data-testid={`pipeline-card-open-${order.id}`}
        >
          Details →
        </button>
      )}

      {/* Suppress className unused-var lint */}
      <span className={`hidden ${priorityStyles[meta.priority]}`} />
    </article>
  );
}
