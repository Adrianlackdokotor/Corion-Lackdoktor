import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Car,
  Wrench,
  FileText,
  Sparkles,
  Activity,
  Image as ImageIcon,
  Hash,
  Calendar,
  Euro,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Pencil,
  Save,
  X,
  Gauge,
  Palette,
  PackageOpen,
  CalendarClock,
  CreditCard,
  StickyNote,
  Upload,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WorkshopOrder, User } from "@shared/schema";

interface OrderCrmModalProps {
  order: WorkshopOrder | null;
  partners: User[];
  allOrders: WorkshopOrder[];
  onClose: () => void;
}

interface OrderEditForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleVin: string;
  vehicleColor: string;
  vehicleMileage: string;
  damageDescription: string;
  priorDamage: string;
  internalNote: string;
  status: string;
  partnerId: string;
  scheduledDate: string;
  deliveryDate: string;
  pickupDate: string;
  totalNetAmountCents: number;
  materialPercent: number;
  paymentStatus: string;
}

const PARTNER_COLORS: Record<string, string> = {
  adam: "#facc15",
  adil: "#3b82f6",
};

function partnerColorByName(firstName: string | null | undefined): string | null {
  return PARTNER_COLORS[(firstName ?? "").toLowerCase()] ?? null;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  angenommen: "Angenommen",
  in_bearbeitung: "In Arbeit",
  fertig: "Fertig",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  angenommen: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  in_bearbeitung: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  fertig: "bg-green-500/15 text-green-400 border-green-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  teilweise: "Teilbezahlt",
  bezahlt: "Bezahlt",
  storniert: "Storniert",
};

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function centsFromEurString(s: string): number {
  const v = parseFloat(s.replace(",", "."));
  if (isNaN(v) || v < 0) return 0;
  return Math.round(v * 100);
}

function daysSince(d: Date | string | null | undefined): number {
  if (!d) return 0;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

interface DerivedEvent {
  ts: Date;
  label: string;
  detail?: string;
  icon: typeof CircleDot;
  tone: string;
}

function buildTimeline(
  order: WorkshopOrder,
  partner: User | undefined,
): DerivedEvent[] {
  const events: DerivedEvent[] = [];
  events.push({
    ts: new Date(order.createdAt),
    label: "Auftrag erstellt",
    detail: order.referenceNumber ?? undefined,
    icon: ClipboardList,
    tone: "text-blue-400",
  });
  if (order.partnerId && partner) {
    events.push({
      ts: new Date(order.createdAt),
      label: "Partner zugewiesen",
      detail: `${partner.firstName} ${partner.lastName}`,
      icon: Users,
      tone: "text-purple-400",
    });
  }
  if (order.totalAmountCents > 0) {
    events.push({
      ts: new Date(order.createdAt),
      label: "Angebot erstellt",
      detail: `${fmtEur(order.totalAmountCents)} € brutto`,
      icon: FileText,
      tone: "text-amber-400",
    });
  }
  if (order.scheduledDate) {
    events.push({
      ts: new Date(order.scheduledDate),
      label: "Termin geplant",
      detail: fmtDate(order.scheduledDate),
      icon: Calendar,
      tone: "text-cyan-400",
    });
  }
  if (
    order.status === "in_bearbeitung" ||
    order.status === "fertig" ||
    order.status === "completed"
  ) {
    events.push({
      ts: new Date(order.createdAt),
      label: "In Bearbeitung",
      icon: Wrench,
      tone: "text-orange-400",
    });
  }
  if (order.status === "fertig" || order.status === "completed") {
    events.push({
      ts: new Date(order.createdAt),
      label:
        order.status === "completed" ? "Abgeschlossen" : "Fertiggestellt",
      icon: CheckCircle2,
      tone: "text-green-400",
    });
  }
  return events.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}

function buildAiRecap(order: WorkshopOrder, partner: User | undefined) {
  const days = daysSince(order.createdAt);
  const happened: string[] = [];
  const missing: string[] = [];
  const next: string[] = [];

  happened.push(
    `Auftrag für ${order.customerName} (${order.vehicleMake ?? "Fahrzeug"} ${
      order.vehicleModel ?? ""
    })${
      order.vehiclePlate ? ` · Kennzeichen ${order.vehiclePlate}` : ""
    } wurde vor ${days} Tag${days === 1 ? "" : "en"} angelegt.`,
  );
  if (order.damageDescription) {
    happened.push(
      'Schadensbeschreibung erfasst: „' + order.damageDescription + '".',
    );
  }
  if (partner) {
    happened.push(`Partner ${partner.firstName} ${partner.lastName} ist zugewiesen.`);
  }
  if (order.totalAmountCents > 0) {
    happened.push(
      `Brutto-Angebot über ${fmtEur(order.totalAmountCents)} € hinterlegt.`,
    );
  }

  if (!order.partnerId) missing.push("Partner ist noch nicht zugewiesen.");
  if (!order.scheduledDate) missing.push("Es ist noch kein Termin geplant.");
  if (order.totalAmountCents === 0)
    missing.push("Es liegt noch kein verbindliches Angebot vor.");
  if (!order.vehicleVin) missing.push("FIN/VIN fehlt für die Fahrzeugakte.");
  if (!order.customerSignature)
    missing.push("Kundenunterschrift wurde noch nicht erfasst.");

  if (!order.partnerId) next.push("Partner zuweisen.");
  else if (!order.scheduledDate) next.push("Termin mit Partner abstimmen.");
  else if (order.status === "open")
    next.push('Status auf „Angenommen" setzen, sobald der Partner bestätigt.');
  else if (order.status === "angenommen")
    next.push('Reparatur starten und Status auf „In Arbeit" setzen.');
  else if (order.status === "in_bearbeitung")
    next.push('Bei Fertigstellung Status auf „Fertig" ändern.');
  else if (order.status === "fertig")
    next.push('Abrechnen, Zahlung erfassen und Status auf „Abgeschlossen" setzen.');
  else if (order.status === "completed")
    next.push("Bewertung beim Kunden anfragen und Akte archivieren.");

  return { happened, missing, next };
}

function initForm(order: WorkshopOrder): OrderEditForm {
  const meta = (order.repairProtocolJson as any) || {};
  return {
    customerName: order.customerName ?? "",
    customerPhone: order.customerPhone ?? "",
    customerEmail: order.customerEmail ?? "",
    customerAddress: order.customerAddress ?? "",
    vehicleMake: order.vehicleMake ?? "",
    vehicleModel: order.vehicleModel ?? "",
    vehiclePlate: order.vehiclePlate ?? "",
    vehicleVin: order.vehicleVin ?? "",
    vehicleColor: order.vehicleColor ?? "",
    vehicleMileage: order.vehicleMileage ?? "",
    damageDescription: order.damageDescription ?? "",
    priorDamage: order.priorDamage ?? "",
    internalNote: typeof meta.internalNote === "string" ? meta.internalNote : "",
    status: order.status,
    partnerId: order.partnerId ?? "",
    scheduledDate: toDateInput(order.scheduledDate),
    deliveryDate: toDateInput(order.deliveryDate),
    pickupDate: toDateInput(order.pickupDate),
    totalNetAmountCents: order.totalAmountCents ?? 0,
    materialPercent: typeof order.materialBdePercentOverride === "number"
      ? order.materialBdePercentOverride
      : 20,
    paymentStatus: order.paymentStatus ?? "offen",
  };
}

export default function OrderCrmModal({
  order,
  partners,
  allOrders,
  onClose,
}: OrderCrmModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OrderEditForm | null>(null);

  useEffect(() => {
    if (!order) {
      setEditing(false);
      setForm(null);
      return;
    }
    setForm(initForm(order));
    setEditing(false);
  }, [order]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!order || !form) throw new Error("Kein Auftrag gewählt");
      const res = await apiRequest("PATCH", `/api/workshop/orders/${order.id}`, {
        customerName: form.customerName,
        customerPhone: form.customerPhone || null,
        customerEmail: form.customerEmail || null,
        customerAddress: form.customerAddress || null,
        vehicleMake: form.vehicleMake || "",
        vehicleModel: form.vehicleModel || "",
        vehiclePlate: form.vehiclePlate || null,
        vehicleVin: form.vehicleVin || null,
        vehicleColor: form.vehicleColor || null,
        vehicleMileage: form.vehicleMileage || null,
        damageDescription: form.damageDescription || order.damageDescription,
        priorDamage: form.priorDamage || null,
        internalNote: form.internalNote,
        status: form.status,
        partnerId: form.partnerId || null,
        scheduledDate: form.scheduledDate || null,
        deliveryDate: form.deliveryDate || null,
        pickupDate: form.pickupDate || null,
        totalAmountCents: form.totalNetAmountCents,
        laborAmountCents: Math.max(
          0,
          form.totalNetAmountCents - Math.round(form.totalNetAmountCents * (form.materialPercent / 100)),
        ),
        partsAmountCents: Math.round(form.totalNetAmountCents * (form.materialPercent / 100)),
        materialBdePercentOverride: form.materialPercent,
      });
      if (form.paymentStatus !== order.paymentStatus) {
        await apiRequest("PATCH", `/api/workshop/orders/${order.id}/payment`, {
          paymentStatus: form.paymentStatus,
        });
      }
      return res.json();
    },
    onSuccess: () => {
      if (!order) return;
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", order.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", order.id, "crm"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler/appointments"] });
      toast({ title: "Auftrag gespeichert" });
      setEditing(false);
    },
    onError: (e: any) =>
      toast({
        title: "Fehler",
        description: e?.message ?? "Speichern fehlgeschlagen",
        variant: "destructive",
      }),
  });

  const partner = useMemo(
    () => (order ? partners.find((p) => p.id === order.partnerId) : undefined),
    [order, partners],
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: files = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/workshop-orders", order?.id, "files"],
    queryFn: async () => {
      if (!order) return [];
      const res = await fetch(`/api/admin/workshop-orders/${order.id}/files`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!order,
  });

  const uploadMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      if (!order) throw new Error("Kein Auftrag gewählt");
      const payloadFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
          return {
            name: file.name,
            type: file.type || undefined,
            size: file.size,
            data: btoa(binary),
          };
        }),
      );

      const res = await apiRequest("POST", `/api/admin/workshop-orders/${order.id}/attachments`, {
        files: payloadFiles,
      });
      return res.json();
    },
    onSuccess: () => {
      if (!order) return;
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders", order.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders", order.id, "files"] });
      toast({ title: "Dateien hochgeladen" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: any) =>
      toast({
        title: "Upload fehlgeschlagen",
        description: e?.message ?? "Dateien konnten nicht hochgeladen werden",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      if (!order) throw new Error("Kein Auftrag gewählt");
      await apiRequest("DELETE", `/api/admin/workshop-orders/${order.id}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      if (!order) return;
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders", order.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders", order.id, "files"] });
      toast({ title: "Datei entfernt" });
    },
    onError: (e: any) =>
      toast({
        title: "Löschen fehlgeschlagen",
        description: e?.message ?? "Datei konnte nicht entfernt werden",
        variant: "destructive",
      }),
  });

  if (!order) return null;

  const meta = (order.repairProtocolJson as any) || {};
  const priority: string = ["low", "normal", "high", "urgent"].includes(
    meta?.priority,
  )
    ? meta.priority
    : "normal";

  const relatedOrders = allOrders.filter(
    (o) =>
      o.id !== order.id &&
      (o.customerName === order.customerName ||
        (order.customerEmail && o.customerEmail === order.customerEmail) ||
        (order.vehiclePlate && o.vehiclePlate === order.vehiclePlate)),
  );

  const recap = buildAiRecap(order, partner);
  const timeline = buildTimeline(order, partner);

  const normalizedCustomerName = typeof order.customerName === "string"
    ? order.customerName.trim()
    : "";
  const displayCustomerName = normalizedCustomerName && normalizedCustomerName.toUpperCase() !== "UNBEKANNT"
    ? normalizedCustomerName
    : [order.vehicleMake, order.vehicleModel].filter(Boolean).join(" ") || order.referenceNumber || "Auftrag";
  const normalizedPlate = typeof order.vehiclePlate === "string"
    ? order.vehiclePlate.trim()
    : "";
  // Guard stored "UNBEKANNT" placeholders — treat as missing data.
  const displayPlate = normalizedPlate && normalizedPlate.toUpperCase() !== "UNBEKANNT"
    ? normalizedPlate
    : null;
  const displayVehicleLabel = [order.vehicleMake, order.vehicleModel].filter(Boolean).join(" ");

  const effectiveMaterialPercent = editing
    ? (form?.materialPercent ?? 20)
    : (typeof order.materialBdePercentOverride === "number" ? order.materialBdePercentOverride : 20);
  const displayNetTotal = editing
    ? (form?.totalNetAmountCents ?? 0)
    : order.totalAmountCents;
  const displayMaterialNet = Math.round(displayNetTotal * (effectiveMaterialPercent / 100));
  const displayLohnNet = Math.max(0, displayNetTotal - displayMaterialNet);
  const displayVatCents = Math.round(displayNetTotal * 0.19);
  const displayGrossTotal = displayNetTotal + displayVatCents;
  const isClient = !!order.clientUserId;

  const setF = (patch: Partial<OrderEditForm>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleUploadSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate(selectedFiles);
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="crm-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span className="font-bold">
              {displayCustomerName}
              {displayPlate ? ` · ${displayPlate}` : ""}
              {!displayPlate && displayVehicleLabel ? ` · ${displayVehicleLabel}` : ""}
            </span>
            <Badge variant="outline" className={STATUS_TONE[order.status] ?? ""}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
            {order.referenceNumber && (
              <Badge variant="outline" className="font-mono text-xs">
                <Hash className="w-3 h-3 mr-1" />
                {order.referenceNumber}
              </Badge>
            )}
            {priority === "urgent" && <Badge variant="destructive">Dringend</Badge>}
            {partner && (() => {
              const pc = partnerColorByName(partner.firstName);
              return (
                <Badge
                  variant="outline"
                  style={pc ? { borderColor: pc + "66", backgroundColor: pc + "22", color: pc } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-1.5 inline-block flex-shrink-0"
                    style={{ background: pc ?? "#888" }}
                  />
                  {partner.firstName} {partner.lastName}
                </Badge>
              );
            })()}
            <div className="ml-auto flex items-center gap-2">
              {editing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm(initForm(order));
                      setEditing(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" /> Abbrechen
                  </Button>
                  <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form}>
                    <Save className="w-4 h-4 mr-1" /> {saveMutation.isPending ? "Speichert..." : "Speichern"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Bearbeiten
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="auftrag" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="client" data-testid="crm-tab-client">Kunde</TabsTrigger>
            <TabsTrigger value="vehicle" data-testid="crm-tab-vehicle">Fahrzeug</TabsTrigger>
            <TabsTrigger value="auftrag" data-testid="crm-tab-auftrag">Auftrag</TabsTrigger>
            <TabsTrigger value="files" data-testid="crm-tab-files">Dateien</TabsTrigger>
            <TabsTrigger value="ai" data-testid="crm-tab-ai">AI Recap</TabsTrigger>
            <TabsTrigger value="timeline" data-testid="crm-tab-timeline">Verlauf</TabsTrigger>
          </TabsList>

          {/* ── Kunde ─────────────────────────────────────────────── */}
          <TabsContent value="client" className="space-y-3 pt-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <Input value={form?.customerName ?? ""} onChange={(e) => setF({ customerName: e.target.value })} />
                  ) : (
                    <p className="font-bold text-lg" data-testid="crm-customer-name">{displayCustomerName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Auftrag erstellt: {fmtDateTime(order.createdAt)}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={isClient ? "default" : "outline"}>{isClient ? "Registriert" : "Temporär"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editing ? (
                  <>
                    <EditField icon={<Mail className="w-4 h-4" />} label="E-Mail">
                      <Input value={form?.customerEmail ?? ""} onChange={(e) => setF({ customerEmail: e.target.value })} />
                    </EditField>
                    <EditField icon={<Phone className="w-4 h-4" />} label="Telefon">
                      <Input value={form?.customerPhone ?? ""} onChange={(e) => setF({ customerPhone: e.target.value })} />
                    </EditField>
                    <EditField icon={<MapPin className="w-4 h-4" />} label="Adresse" full>
                      <Input value={form?.customerAddress ?? ""} onChange={(e) => setF({ customerAddress: e.target.value })} />
                    </EditField>
                  </>
                ) : (
                  <>
                    <InfoRow icon={<Mail className="w-4 h-4" />} label="E-Mail" value={order.customerEmail} />
                    <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefon" value={order.customerPhone} />
                    <InfoRow icon={<MapPin className="w-4 h-4" />} label="Adresse" value={order.customerAddress} full />
                  </>
                )}
              </div>
            </Card>

            {relatedOrders.length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Weitere Aufträge dieses Kunden</p>
                <div className="flex flex-wrap gap-2">
                  {relatedOrders.map((o) => (
                    <Badge key={o.id} variant="outline" className="text-xs">
                      {o.referenceNumber ?? o.id.slice(0, 8)} · {o.vehicleMake} {o.vehicleModel}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ── Fahrzeug ──────────────────────────────────────────── */}
          <TabsContent value="vehicle" className="space-y-3 pt-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input value={form?.vehicleMake ?? ""} onChange={(e) => setF({ vehicleMake: e.target.value })} placeholder="Marke" />
                      <Input value={form?.vehicleModel ?? ""} onChange={(e) => setF({ vehicleModel: e.target.value })} placeholder="Modell" />
                      <Input value={form?.vehiclePlate ?? ""} onChange={(e) => setF({ vehiclePlate: e.target.value })} placeholder="Kennzeichen" />
                      <Input value={form?.vehicleVin ?? ""} onChange={(e) => setF({ vehicleVin: e.target.value })} placeholder="FIN / VIN" />
                      <Input value={form?.vehicleColor ?? ""} onChange={(e) => setF({ vehicleColor: e.target.value })} placeholder="Farbe" />
                      <Input value={form?.vehicleMileage ?? ""} onChange={(e) => setF({ vehicleMileage: e.target.value })} placeholder="Kilometerstand" />
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-lg">{displayVehicleLabel || "—"}</p>
                      {displayPlate && <p className="text-sm font-mono text-muted-foreground">{displayPlate}</p>}
                    </>
                  )}
                </div>
              </div>
              {!editing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={<Hash className="w-4 h-4" />} label="Kennzeichen" value={order.vehiclePlate} />
                  <InfoRow icon={<Car className="w-4 h-4" />} label="FIN / VIN" value={order.vehicleVin} />
                  <InfoRow icon={<Wrench className="w-4 h-4" />} label="Marke" value={order.vehicleMake} />
                  <InfoRow icon={<Car className="w-4 h-4" />} label="Modell" value={order.vehicleModel} />
                  <InfoRow icon={<Palette className="w-4 h-4" />} label="Farbe" value={order.vehicleColor} />
                  <InfoRow icon={<Gauge className="w-4 h-4" />} label="Km-Stand" value={order.vehicleMileage} />
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Auftrag ───────────────────────────────────────────── */}
          <TabsContent value="auftrag" className="space-y-3 pt-4">
            {/* Status + Zahlung */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Status & Zahlung</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editing ? (
                  <>
                    <EditField icon={<CircleDot className="w-4 h-4" />} label="Auftragsstatus">
                      <Select value={form?.status ?? order.status} onValueChange={(v) => setF({ status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditField>
                    <EditField icon={<CreditCard className="w-4 h-4" />} label="Zahlungsstatus">
                      <Select value={form?.paymentStatus ?? order.paymentStatus} onValueChange={(v) => setF({ paymentStatus: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYMENT_STATUS_LABEL).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditField>
                  </>
                ) : (
                  <>
                    <InfoRow icon={<CircleDot className="w-4 h-4" />} label="Auftragsstatus" value={STATUS_LABEL[order.status] ?? order.status} />
                    <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Zahlungsstatus" value={PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus} />
                  </>
                )}
              </div>
            </Card>

            {/* Partner + Termine */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Partner & Termine</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editing ? (
                  <>
                    <EditField icon={<Users className="w-4 h-4" />} label="Partner" full>
                      <Select value={form?.partnerId ?? ""} onValueChange={(v) => setF({ partnerId: v === "__none__" ? "" : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kein Partner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Kein Partner</SelectItem>
                          {partners.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.firstName} {p.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditField>
                    <EditField icon={<Calendar className="w-4 h-4" />} label="Geplanter Termin">
                      <Input type="date" value={form?.scheduledDate ?? ""} onChange={(e) => setF({ scheduledDate: e.target.value })} />
                    </EditField>
                    <EditField icon={<CalendarClock className="w-4 h-4" />} label="Lieferdatum">
                      <Input type="date" value={form?.deliveryDate ?? ""} onChange={(e) => setF({ deliveryDate: e.target.value })} />
                    </EditField>
                    <EditField icon={<CalendarClock className="w-4 h-4" />} label="Abholdatum">
                      <Input type="date" value={form?.pickupDate ?? ""} onChange={(e) => setF({ pickupDate: e.target.value })} />
                    </EditField>
                  </>
                ) : (
                  <>
                    <InfoRow icon={<Users className="w-4 h-4" />} label="Partner" value={partner ? `${partner.firstName} ${partner.lastName}` : "—"} full />
                    <InfoRow icon={<Calendar className="w-4 h-4" />} label="Geplanter Termin" value={fmtDate(order.scheduledDate)} />
                    <InfoRow icon={<CalendarClock className="w-4 h-4" />} label="Lieferdatum" value={fmtDate(order.deliveryDate)} />
                    <InfoRow icon={<CalendarClock className="w-4 h-4" />} label="Abholdatum" value={fmtDate(order.pickupDate)} />
                  </>
                )}
              </div>
            </Card>

            {/* Preise */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Abrechnung</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {editing ? (
                  <>
                    <EditField icon={<Euro className="w-4 h-4" />} label="Auftrag netto">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={((form?.totalNetAmountCents ?? 0) / 100).toFixed(2)}
                        onChange={(e) => setF({ totalNetAmountCents: centsFromEurString(e.target.value) })}
                      />
                    </EditField>
                    <EditField icon={<PackageOpen className="w-4 h-4" />} label="Material netto">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{fmtEur(displayMaterialNet)} €</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">%</span>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={String(form?.materialPercent ?? 20)}
                            onChange={(e) => setF({ materialPercent: Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10) || 0)) })}
                          />
                        </div>
                      </div>
                    </EditField>
                    <InfoRow icon={<Euro className="w-4 h-4" />} label="Lohn netto" value={`${fmtEur(displayLohnNet)} €`} />
                  </>
                ) : (
                  <>
                    <InfoRow icon={<Euro className="w-4 h-4" />} label="Auftrag netto" value={`${fmtEur(order.totalAmountCents)} €`} />
                    <InfoRow icon={<PackageOpen className="w-4 h-4" />} label="Material netto" value={`${fmtEur(displayMaterialNet)} € (${effectiveMaterialPercent}%)`} />
                    <InfoRow icon={<Euro className="w-4 h-4" />} label="Lohn netto" value={`${fmtEur(displayLohnNet)} €`} />
                  </>
                )}
              </div>
              {!editing && displayNetTotal > 0 && (
                <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                  <div>Gesamt brutto: {fmtEur(displayGrossTotal)} €</div>
                  <div>MwSt. 19%: {fmtEur(displayVatCents)} €</div>
                </div>
              )}
            </Card>

            {/* Beschreibung + Notiz */}
            <Card className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reparaturbeschreibung</p>
                {editing ? (
                  <Textarea rows={4} value={form?.damageDescription ?? ""} onChange={(e) => setF({ damageDescription: e.target.value })} />
                ) : (
                  <p className="text-sm whitespace-pre-line">{order.damageDescription ?? "—"}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vorschaden</p>
                {editing ? (
                  <Textarea rows={3} value={form?.priorDamage ?? ""} onChange={(e) => setF({ priorDamage: e.target.value })} placeholder="Vorschaden" />
                ) : (
                  <p className="text-sm whitespace-pre-line">{order.priorDamage ?? "—"}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <StickyNote className="w-3.5 h-3.5" /> Interne Notiz
                </p>
                {editing ? (
                  <Textarea
                    rows={3}
                    value={form?.internalNote ?? ""}
                    onChange={(e) => setF({ internalNote: e.target.value })}
                    placeholder="Nur für Admins sichtbar"
                    className="bg-amber-500/5 border-amber-500/30"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-line text-amber-300/90">
                    {(() => {
                      const meta2 = (order.repairProtocolJson as any) || {};
                      return typeof meta2.internalNote === "string" && meta2.internalNote
                        ? meta2.internalNote
                        : "—";
                    })()}
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ── Dateien ───────────────────────────────────────────── */}
          <TabsContent value="files" className="space-y-3 pt-4">
            <Card className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Dateien & Anhänge</p>
                  <p className="text-xs text-muted-foreground">Alles, was zum Auftrag gehört, soll hier direkt sichtbar und öffnbar sein.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.driveFolderUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.driveFolderUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" /> Drive Ordner
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="w-4 h-4" /> {uploadMutation.isPending ? "Lädt..." : "Datei hinzufügen"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleUploadSelection}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z,.ppt,.pptx"
                  />
                </div>
              </div>
              {order.localFolderPath && (
                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">Lokaler Auftragspfad</div>
                  <div className="break-all">{order.localFolderPath}</div>
                </div>
              )}
              {files.length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Keine Dateien verknüpft. Du kannst hier direkt manuell hochladen, iar la intake trebuie să le legăm automat la Auftrag.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map((file) => {
                    const isImage = typeof file?.mimeType === "string" && file.mimeType.startsWith("image/");
                    const fileOpenUrl = `/api/admin/workshop-orders/files/${file.id}`;
                    return (
                      <Card key={file.id} className="p-3 border-border/60 bg-background/60">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {isImage ? <ImageIcon className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-medium truncate">{file.originalName ?? file.fileName ?? "Datei"}</p>
                            <p className="text-xs text-muted-foreground">{file.mimeType ?? "Unbekannt"}</p>
                            <p className="text-xs text-muted-foreground">{fmtDateTime(file.createdAt)}</p>
                            <div className="flex flex-wrap gap-3 pt-1">
                              <a href={fileOpenUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline break-all">
                                In App öffnen
                              </a>
                              {file.driveLink && (
                                <a href={file.driveLink} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline break-all">
                                  Drive öffnen
                                </a>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(file.id)}
                            disabled={deleteMutation.isPending}
                            title="Datei entfernen"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── AI Recap ──────────────────────────────────────────── */}
          <TabsContent value="ai" className="space-y-3 pt-4">
            <Card className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Was bereits passiert ist</p>
                <ul className="space-y-2">
                  {recap.happened.map((line, idx) => (
                    <li key={idx} className="flex gap-2 text-sm"><Activity className="w-4 h-4 mt-0.5 text-primary" />{line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Was fehlt</p>
                <ul className="space-y-2">
                  {recap.missing.length > 0 ? recap.missing.map((line, idx) => (
                    <li key={idx} className="flex gap-2 text-sm"><Sparkles className="w-4 h-4 mt-0.5 text-amber-400" />{line}</li>
                  )) : <li className="text-sm text-muted-foreground">Nichts Kritisches offen.</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Nächster sinnvoller Schritt</p>
                <ul className="space-y-2">
                  {recap.next.map((line, idx) => (
                    <li key={idx} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400" />{line}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* ── Verlauf ───────────────────────────────────────────── */}
          <TabsContent value="timeline" className="space-y-3 pt-4">
            <Card className="p-4 space-y-3">
              {timeline.map((event, idx) => {
                const Icon = event.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${event.tone}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.label}</p>
                      {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                      <p className="text-xs text-muted-foreground">{fmtDateTime(event.ts)}</p>
                    </div>
                  </div>
                );
              })}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  icon,
  label,
  value,
  full = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2 rounded-lg border p-3" : "rounded-lg border p-3"}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm break-words">{value || "—"}</div>
    </div>
  );
}

function EditField({
  icon,
  label,
  children,
  full = false,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2 rounded-lg border p-3" : "rounded-lg border p-3"}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
