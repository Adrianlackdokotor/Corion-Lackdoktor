import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import Logo from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OrderCrmModal from "@/components/dashboard/OrderCrmModal";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Printer, Download, MapPin, Loader2, CheckCircle2, Sparkles, Mail,
  Pencil, Plus, Trash2, Save, Users, Package, Banknote, Menu, X, MessageSquare,
} from "lucide-react";
import CrmAiPanel from "@/components/workshop/CrmAiPanel";
import { calculateMultiPartnerSplit, calculateAuftrag } from "@shared/auftragCalc";

const STEPS = [
  { key: "geplant", label: "Geplant" },
  { key: "in_reparatur", label: "In Reparatur" },
  { key: "rueckgabebereit", label: "Rückgabebereit" },
  { key: "zurueckgegeben", label: "Zurückgegeben" },
];

function eur(c: number | null | undefined) {
  return ((c ?? 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
function partnerLabel(p: any): string {
  if (!p) return "—";
  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return p.company || name || p.email || p.id;
}

function statusDot(s: string): string {
  if (s === "completed" || s === "zurueckgegeben" || s === "fertig") return "bg-emerald-500";
  if (s === "in_reparatur" || s === "in_bearbeitung") return "bg-amber-500";
  if (s === "rueckgabebereit" || s === "angenommen") return "bg-blue-500";
  if (s === "storniert" || s === "cancelled") return "bg-zinc-500";
  return "bg-zinc-400";
}

type SplitRow = { partnerId: string; sharePercent: number; label?: string | null };

type EditForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleVin: string;
  damageDescription: string;
  priorDamage: string;
  laborEur: string;
  partsEur: string;
  partnerId: string;
  splits: SplitRow[];
  materialsBilledSeparately: boolean;
  materialBdePercentOverride: string;
};

type NewAuftragForm = {
  customerName: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  customerPhone: string;
  damageDescription: string;
  partnerId: string;
  scheduledStart: string;
  notes: string;
};

function buildFormFrom(order: any): EditForm {
  return {
    customerName: order?.customerName ?? "",
    customerPhone: order?.customerPhone ?? "",
    customerEmail: order?.customerEmail ?? "",
    customerAddress: order?.customerAddress ?? "",
    vehicleMake: order?.vehicleMake ?? "",
    vehicleModel: order?.vehicleModel ?? "",
    vehiclePlate: order?.vehiclePlate ?? "",
    vehicleVin: order?.vehicleVin ?? "",
    damageDescription: order?.damageDescription ?? "",
    priorDamage: order?.priorDamage ?? "",
    laborEur: ((order?.laborAmountCents ?? 0) / 100).toString(),
    partsEur: ((order?.partsAmountCents ?? 0) / 100).toString(),
    partnerId: order?.partnerId ?? "",
    splits: Array.isArray(order?.partnerSplitsJson) ? order.partnerSplitsJson : [],
    materialsBilledSeparately: !!order?.materialsBilledSeparately,
    materialBdePercentOverride:
      order?.materialBdePercentOverride != null ? String(order.materialBdePercentOverride) : "",
  };
}

export default function WorkshopOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [photoIdx, setPhotoIdx] = useState(0);
  const [invoiceWizard, setInvoiceWizard] = useState<null | 1 | 2>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [payStatus, setPayStatus] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("");
  const [showRail, setShowRail] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [crmDialogOrder, setCrmDialogOrder] = useState<any | null>(null);
  const [newForm, setNewForm] = useState<NewAuftragForm>({
    customerName: "", vehicleMake: "", vehicleModel: "", vehiclePlate: "",
    customerPhone: "", damageDescription: "", partnerId: "", scheduledStart: "", notes: "",
  });

  const { data: me } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const isAdmin = me?.role === "admin";

  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/workshop/orders", id], enabled: !!id });
  const order = data?.order;
  const step = data?.timelineStep ?? 0;
  const allowedNext: string[] = data?.allowedNext ?? [];
  const files: any[] = data?.files ?? [];
  const photos = files.filter((f) => /image\//.test(f.mimeType ?? ""));
  const docs = files.filter((f) => !/image\//.test(f.mimeType ?? ""));

  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/workshop/partners"],
    enabled: isAdmin,
  });

  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/workshop-orders"],
    enabled: isAdmin,
  });

  // Reset form whenever opening edit mode (or order data changes).
  useEffect(() => {
    if (editing && order && !form) setForm(buildFormFrom(order));
    if (!editing) setForm(null);
  }, [editing, order]); // eslint-disable-line react-hooks/exhaustive-deps

  const transition = useMutation({
    mutationFn: async (to: string) =>
      (await apiRequest("POST", `/api/workshop/orders/${id}/transition`, { to })).json(),
    onSuccess: (res: any) => {
      toast({ title: "Status aktualisiert", description: res.triggeredAgent ? `KI-Agent ${res.triggeredAgent} benachrichtigt.` : undefined });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", id, "crm"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/dashboard"] });
    },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });

  const draftDescription = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", `/api/workshop/ai/angebot`, { orderId: id, note: "Reparaturbeschreibung neu generieren" })).json(),
    onSuccess: () => {
      toast({ title: "AI-Entwurf erstellt", description: "Customer-Care AI hat einen Entwurf vorbereitet (siehe Task Board)." });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", id, "crm"] });
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", `/api/workshop/ai/rechnung`, { orderId: id, note: "Rechnung per Wizard versenden" })).json(),
    onSuccess: () => {
      toast({ title: "Rechnung versendet", description: "CFO Agent hat die Rechnung in die Pipeline gestellt." });
      setInvoiceWizard(null); setConfirmed(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", id, "crm"] });
    },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });

  const saveOrder = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("Kein Formular");
      const body: any = {
        customerName: form.customerName,
        customerPhone: form.customerPhone || null,
        customerEmail: form.customerEmail || null,
        customerAddress: form.customerAddress || null,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        vehiclePlate: form.vehiclePlate || null,
        vehicleVin: form.vehicleVin || null,
        damageDescription: form.damageDescription || null,
        priorDamage: form.priorDamage || null,
        laborAmountCents: Math.round(parseFloat(form.laborEur || "0") * 100) || 0,
        partsAmountCents: Math.round(parseFloat(form.partsEur || "0") * 100) || 0,
        partnerId: form.partnerId || null,
        partnerSplitsJson: form.splits.filter((s) => s.partnerId),
        materialsBilledSeparately: form.materialsBilledSeparately,
        materialBdePercentOverride: form.materialBdePercentOverride
          ? parseInt(form.materialBdePercentOverride)
          : null,
      };
      const res = await apiRequest("PATCH", `/api/workshop/orders/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Auftrag gespeichert", description: "Alle Felder und Split aktualisiert." });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/dashboard"] });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Fehler beim Speichern", description: e?.message, variant: "destructive" }),
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const body: any = { paymentStatus: payStatus || order?.paymentStatus };
      if (payMethod) body.paymentMethod = payMethod;
      const res = await apiRequest("PATCH", `/api/workshop/orders/${id}/payment`, body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Zahlungsstatus gespeichert" });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/dashboard"] });
      setPayStatus("");
      setPayMethod("");
    },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });

  const newAuftragMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/intake", data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Fehler beim Erstellen");
      }
      return res.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      setShowNewForm(false);
      setNewForm({ customerName: "", vehicleMake: "", vehicleModel: "", vehiclePlate: "", customerPhone: "", damageDescription: "", partnerId: "", scheduledStart: "", notes: "" });
      const pending: string[] = result?.pendingSteps ?? [];
      toast({
        title: `Auftrag erstellt — ${result?.referenceNumber ?? ""}`,
        description: pending.length > 0 ? `Noch offen: ${pending.join(", ")}` : "Alle Schritte abgeschlossen.",
      });
      if (result?.orderId) navigate(`/workshop/auftrag/${result.orderId}`);
    },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });

  // Live calculation preview for the edit panel.
  const livePreview = useMemo(() => {
    if (!form) return null;
    const labor = Math.round(parseFloat(form.laborEur || "0") * 100) || 0;
    const parts = Math.round(parseFloat(form.partsEur || "0") * 100) || 0;
    const bdePct = form.materialBdePercentOverride
      ? parseInt(form.materialBdePercentOverride)
      : (() => {
          if (form.partnerId) {
            const p = partners.find((x) => x.id === form.partnerId);
            return typeof p?.materialPercent === "number" ? p.materialPercent : 20;
          }
          return 20;
        })();
    if (form.splits.length > 0) {
      return {
        mode: "multi" as const,
        result: calculateMultiPartnerSplit({
          laborCents: labor,
          partsCents: parts,
          bdePercent: bdePct,
          isOwnMaterial: form.materialsBilledSeparately,
          partners: form.splits.filter((s) => s.partnerId),
        }),
      };
    }
    if (form.partnerId) {
      const p = partners.find((x) => x.id === form.partnerId);
      const partnerPct = typeof p?.partnerSharePercent === "number" ? p.partnerSharePercent : 40;
      return {
        mode: "single" as const,
        result: calculateAuftrag({
          laborCents: labor,
          partsCents: parts,
          bdePercent: bdePct,
          partnerSharePercent: partnerPct,
          isOwnMaterial: form.materialsBilledSeparately,
        }),
      };
    }
    return null;
  }, [form, partners]);

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  }
  if (!order) return <div className="p-8 text-center text-muted-foreground">Auftrag nicht gefunden.</div>;

  // Shared order list used in both desktop rail and mobile overlay
  const OrderRailList = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      {(allOrders as any[]).map((o: any) => (
        <Link key={o.id} href={`/workshop/auftrag/${o.id}`}>
          <div
            className={`px-3 py-2.5 cursor-pointer hover:bg-muted/60 transition-colors border-b border-border/40 ${o.id === id ? "bg-muted" : ""}`}
            onClick={onSelect}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot(o.status ?? "")}`} />
              <span className="text-xs font-semibold truncate">{o.vehiclePlate ?? "—"}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate pl-4">{o.customerName ?? "—"}</div>
            {o.scheduledDate && (
              <div className="text-[10px] text-muted-foreground/70 pl-4 mt-0.5">
                {new Date(o.scheduledDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
              </div>
            )}
          </div>
        </Link>
      ))}
      {(allOrders as any[]).length === 0 && (
        <div className="px-3 py-6 text-xs text-muted-foreground text-center">Keine Aufträge</div>
      )}
    </>
  );

  return (
    <div className="flex bg-background">
      <SEO
        title={`Auftrag ${order.referenceNumber ?? ""} | +1 Corion Lackdoktor`}
        description="Werkstatt-Auftragsdetail mit Fortschritts-Timeline und KI-Assistenten."
      />

      {/* Left rail — desktop, sticky scrollable sidebar */}
      {isAdmin && (
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-border shrink-0 sticky top-0 h-screen overflow-hidden bg-background">
          <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aufträge</span>
            <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => setShowNewForm(true)}>
              <Plus className="h-3 w-3" /> Neu
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <OrderRailList />
          </div>
        </aside>
      )}

      {/* Mobile rail overlay */}
      {showRail && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-background border-r flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aufträge</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowRail(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <OrderRailList onSelect={() => setShowRail(false)} />
            </div>
            <div className="p-3 border-t shrink-0">
              <Button size="sm" className="w-full gap-1" onClick={() => { setShowRail(false); setShowNewForm(true); }}>
                <Plus className="h-3 w-3" /> Neuer Auftrag
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setShowRail(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="container mx-auto p-4 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setShowRail(true)} aria-label="Aufträge">
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <Link href="/workshop"><Button size="icon" variant="ghost" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button></Link>
              <Logo className="h-8 w-auto hidden md:block" showSparkle={false} />
              <div className="md:border-l md:pl-3">
                <div className="text-xs text-muted-foreground">{fmt(order.scheduledDate ?? order.createdAt)}</div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold tracking-tight uppercase" data-testid="text-order-title">
                  {order.vehicleMake} <span className="text-primary">{order.vehicleModel}</span>
                </h1>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                  <span><b>Kennzeichen:</b> {order.vehiclePlate ?? "—"}</span>
                  <span><b>Ref:</b> {order.referenceNumber ?? "—"}</span>
                  {order.customerAddress && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.customerAddress}</span>}
                  <span><b>FIN:</b> {order.vehicleVin ?? "—"}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
                <Button
                  variant={editing ? "default" : "outline"}
                  size="sm"
                  data-testid="button-toggle-edit"
                  onClick={() => setEditing((v) => !v)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> {editing ? "Bearbeitung schließen" : "Auftrag bearbeiten"}
                </Button>
              )}
              <Button variant="outline" size="sm"
                onClick={() => navigate(`/admin/comms?channel=order:${id}`)}>
                <MessageSquare className="h-4 w-4 mr-1" /> Koordination
              </Button>
              <Button variant="outline" size="sm" data-testid="button-print"
                onClick={() => window.open(`/api/workshop/orders/${id}/print`, "_blank")}>
                <Printer className="h-4 w-4 mr-1" /> Drucken
              </Button>
              <Button variant="outline" size="sm" data-testid="button-download"
                onClick={() => window.open(`/api/workshop/orders/${id}/print`, "_blank")}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>

          {/* Edit panel — admin only */}
          {editing && form && (
            <Card className="border-primary/40" data-testid="card-edit-order">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" /> Auftrag bearbeiten
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-edit-order">
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={() => saveOrder.mutate()} disabled={saveOrder.isPending} data-testid="button-save-order">
                    {saveOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Speichern
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer + vehicle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kundendaten</h3>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} data-testid="input-customer-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Telefon</Label>
                        <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} data-testid="input-customer-phone" />
                      </div>
                      <div>
                        <Label className="text-xs">E-Mail</Label>
                        <Input value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} data-testid="input-customer-email" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Adresse</Label>
                      <Input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} data-testid="input-customer-address" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fahrzeug</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Marke</Label>
                        <Input value={form.vehicleMake} onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })} data-testid="input-vehicle-make" />
                      </div>
                      <div>
                        <Label className="text-xs">Modell</Label>
                        <Input value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} data-testid="input-vehicle-model" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Kennzeichen</Label>
                        <Input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} data-testid="input-vehicle-plate" />
                      </div>
                      <div>
                        <Label className="text-xs">FIN</Label>
                        <Input value={form.vehicleVin} onChange={(e) => setForm({ ...form, vehicleVin: e.target.value })} data-testid="input-vehicle-vin" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Reparaturbeschreibung</Label>
                    <Textarea rows={4} value={form.damageDescription} onChange={(e) => setForm({ ...form, damageDescription: e.target.value })} data-testid="input-damage-description" />
                  </div>
                  <div>
                    <Label className="text-xs">Vorschaden</Label>
                    <Textarea rows={4} value={form.priorDamage} onChange={(e) => setForm({ ...form, priorDamage: e.target.value })} data-testid="input-prior-damage" />
                  </div>
                </div>

                {/* Money + Partner Split */}
                <div className="rounded-md border bg-muted/30 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Reparatur (Manopera) €</Label>
                      <Input type="number" step="0.01" value={form.laborEur} onChange={(e) => setForm({ ...form, laborEur: e.target.value })} data-testid="input-labor" />
                    </div>
                    <div>
                      <Label className="text-xs">Ersatzteile / Materiale €</Label>
                      <Input type="number" step="0.01" value={form.partsEur} onChange={(e) => setForm({ ...form, partsEur: e.target.value })} data-testid="input-parts" />
                    </div>
                    <div>
                      <Label className="text-xs">Material-BDE % (Standard 20%)</Label>
                      <Input
                        type="number" min="0" max="100"
                        placeholder="20"
                        value={form.materialBdePercentOverride}
                        onChange={(e) => setForm({ ...form, materialBdePercentOverride: e.target.value })}
                        data-testid="input-bde-override"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.materialsBilledSeparately}
                      onCheckedChange={(v) => setForm({ ...form, materialsBilledSeparately: !!v })}
                      data-testid="checkbox-materials-separate"
                    />
                    <span>
                      <span className="font-medium flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Materialien separat berechnet</span>
                      <span className="block text-xs text-muted-foreground">
                        Wenn aktiviert: Material wird dem Kunden separat in Rechnung gestellt → die 20% Materialabzug entfallen, Manopera wird voll auf die Partner verteilt.
                      </span>
                    </span>
                  </label>

                  {/* Primary Partner */}
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Primärer Partner</Label>
                    <Select
                      value={form.partnerId || "__none"}
                      onValueChange={(v) => setForm({ ...form, partnerId: v === "__none" ? "" : v })}
                    >
                      <SelectTrigger data-testid="select-primary-partner">
                        <SelectValue placeholder="— Kein Partner —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— Kein Partner —</SelectItem>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id} data-testid={`option-partner-${p.id}`}>
                            {partnerLabel(p)} {p.partnerSharePercent != null && `(${p.partnerSharePercent}%)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nutzt das Standard-Profil ({partners.find((p) => p.id === form.partnerId)?.partnerSharePercent ?? "—"}% Anteil). Für gemeinsame Aufträge → "Manopera splitten".
                    </p>
                  </div>

                  {/* Multi-partner split */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold">Manopera splitten ({form.splits.length} Partner)</h4>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setForm({ ...form, splits: [...form.splits, { partnerId: "", sharePercent: 50, label: "" }] })}
                        data-testid="button-add-split"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Partner hinzufügen
                      </Button>
                    </div>
                    {form.splits.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Kein Split aktiv → die Manopera geht zu 100 % an den primären Partner.<br />
                        Beispiel-Split: Delle Drücker 80 % + zweiter Partner 40 %.
                      </p>
                    )}
                    <div className="space-y-2">
                      {form.splits.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end" data-testid={`row-split-${idx}`}>
                          <div className="col-span-6">
                            <Label className="text-xs">Partner</Label>
                            <Select
                              value={row.partnerId || "__pick"}
                              onValueChange={(v) => {
                                const next = [...form.splits];
                                next[idx] = { ...row, partnerId: v === "__pick" ? "" : v };
                                setForm({ ...form, splits: next });
                              }}
                            >
                              <SelectTrigger data-testid={`select-split-partner-${idx}`}>
                                <SelectValue placeholder="Partner wählen…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__pick">— Bitte wählen —</SelectItem>
                                {partners.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{partnerLabel(p)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Anteil %</Label>
                            <Input
                              type="number" min="0" max="100" step="1"
                              value={row.sharePercent}
                              onChange={(e) => {
                                const next = [...form.splits];
                                next[idx] = { ...row, sharePercent: parseFloat(e.target.value) || 0 };
                                setForm({ ...form, splits: next });
                              }}
                              data-testid={`input-split-pct-${idx}`}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Notiz</Label>
                            <Input
                              placeholder="z.B. Delle"
                              value={row.label ?? ""}
                              onChange={(e) => {
                                const next = [...form.splits];
                                next[idx] = { ...row, label: e.target.value };
                                setForm({ ...form, splits: next });
                              }}
                              data-testid={`input-split-label-${idx}`}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => setForm({ ...form, splits: form.splits.filter((_, i) => i !== idx) })}
                              data-testid={`button-remove-split-${idx}`}
                              title="Entfernen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live preview */}
                  {livePreview && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold mb-2">Live-Vorschau Split</h4>
                      {livePreview.mode === "multi" ? (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span>Material-Abzug ({livePreview.result.bdePercent}%)</span><span className="tabular-nums">−{eur(livePreview.result.materialDeductionCents)}</span></div>
                          <div className="flex justify-between border-b pb-1"><span>Basis für Split</span><span className="tabular-nums font-medium">{eur(livePreview.result.baseForSplitCents)}</span></div>
                          {livePreview.result.partners.map((p: any) => {
                            const pInfo = partners.find((x) => x.id === p.partnerId);
                            return (
                              <div key={p.partnerId} className="flex justify-between text-xs">
                                <span>→ {partnerLabel(pInfo)} ({p.sharePercent}%) {p.label ? `· ${p.label}` : ""}</span>
                                <span className="tabular-nums">{eur(p.netPayoutCents)} <span className="text-muted-foreground">(brutto {eur(p.grossShareCents)} − 5% Garantie)</span></span>
                              </div>
                            );
                          })}
                          <div className="flex justify-between border-t pt-1 mt-1 font-medium"><span>Corion Anteil (Rest)</span><span className="tabular-nums">{eur(livePreview.result.corionShareCents)}</span></div>
                          {livePreview.result.totalPartnerSharePercent > 100 && (
                            <p className="text-xs text-orange-500">⚠ Summe der Anteile = {livePreview.result.totalPartnerSharePercent}% &gt; 100% → automatisch proportional skaliert.</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span>Material-Abzug ({livePreview.result.partner.bdePercent}%)</span><span className="tabular-nums">−{eur(livePreview.result.partner.materialDeductionCents)}</span></div>
                          <div className="flex justify-between border-b pb-1"><span>Basis für Split</span><span className="tabular-nums font-medium">{eur(livePreview.result.partner.baseForSplitCents)}</span></div>
                          <div className="flex justify-between text-xs"><span>→ Partner ({livePreview.result.partner.partnerSharePercent}%)</span><span className="tabular-nums">{eur(livePreview.result.partner.partnerPayoutNetCents)} <span className="text-muted-foreground">(brutto {eur(livePreview.result.partner.partnerGrossShareCents)} − 5%)</span></span></div>
                          <div className="flex justify-between font-medium"><span>Corion Anteil ({livePreview.result.partner.corionSharePercent}%)</span><span className="tabular-nums">{eur(livePreview.result.partner.corionGrossShareCents)}</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-2 relative">
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-muted" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all"
                  style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - 1rem)` }} />
                {STEPS.map((s, i) => (
                  <div key={s.key} className="relative flex flex-col items-center gap-1.5 flex-1 z-10">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      i <= step ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>{i <= step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}</div>
                    <div className="text-[11px] text-center text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              {allowedNext.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t">
                  <span className="text-xs text-muted-foreground self-center mr-1">Nächster Schritt:</span>
                  {allowedNext.map((n) => (
                    <Button key={n} size="sm" variant="outline" data-testid={`button-transition-${n}`}
                      onClick={() => transition.mutate(n)} disabled={transition.isPending}>
                      → {n}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Zahlungsstatus ─────────────────────────────────────── */}
          {(() => {
            const ps = order.paymentStatus ?? "offen";
            const isPaid = ps === "bezahlt" || ps === "paid";
            const PAY_LABEL: Record<string, string> = {
              offen: "Offen", teilweise: "Teilweise", bezahlt: "Bezahlt",
              storniert: "Storniert", paid: "Bezahlt", unpaid: "Offen",
            };
            const PAY_STYLE: Record<string, string> = {
              bezahlt: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
              paid:    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
              teilweise:"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
              storniert:"bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
              offen:   "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
              unpaid:  "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
            };
            const effectiveStatus = payStatus || ps;
            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Banknote className="h-4 w-4" /> Zahlungsstatus
                  </CardTitle>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PAY_STYLE[ps] ?? PAY_STYLE.offen}`}>
                    {PAY_LABEL[ps] ?? ps}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.paymentMethod && (
                    <p className="text-xs text-muted-foreground">
                      Zahlungsart: <span className="font-medium text-foreground">{order.paymentMethod}</span>
                    </p>
                  )}
                  {isAdmin && (
                    <div className="space-y-2 pt-1 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-muted-foreground block mb-1">Status</label>
                          <Select value={effectiveStatus} onValueChange={setPayStatus}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="offen">Offen</SelectItem>
                              <SelectItem value="teilweise">Teilweise</SelectItem>
                              <SelectItem value="bezahlt">Bezahlt</SelectItem>
                              <SelectItem value="storniert">Storniert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground block mb-1">Zahlungsart</label>
                          <Select value={payMethod || order.paymentMethod || ""} onValueChange={setPayMethod}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">Bar</SelectItem>
                              <SelectItem value="überweisung">Überweisung</SelectItem>
                              <SelectItem value="karte">Karte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={paymentMutation.isPending || (!payStatus && !payMethod)}
                        onClick={() => paymentMutation.mutate()}
                      >
                        {paymentMutation.isPending
                          ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Speichern…</>
                          : isPaid && !payStatus
                            ? <><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" /> Als bezahlt gespeichert</>
                            : "Zahlungsstatus speichern"
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Rechnungsdaten */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Rechnungsdaten</CardTitle>
                <Button size="sm" data-testid="button-open-invoice-wizard" onClick={() => setInvoiceWizard(1)}>
                  <Mail className="h-4 w-4 mr-1" /> Rechnung Senden
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(() => {
                  const labor = order.laborAmountCents ?? 0;
                  const parts = order.partsAmountCents ?? 0;
                  const netCents = labor + parts;
                  const vatCents = Math.round(netCents * 0.19);
                  const grossCents = netCents + vatCents;
                  return (
                    <>
                      <div className="flex justify-between border-b pb-2"><span>Reparatur</span><span className="tabular-nums" data-testid="text-labor-amount">{eur(labor)}</span></div>
                      <div className="flex justify-between border-b pb-2"><span>Ersatzteile</span><span className="tabular-nums" data-testid="text-parts-amount">{eur(parts)}</span></div>
                      <div className="flex justify-between border-b pb-2"><span>Gesamt exkl. MwSt.</span><span className="tabular-nums" data-testid="text-total-net">{eur(netCents)}</span></div>
                      <div className="flex justify-between border-b pb-2 text-muted-foreground"><span>MwSt. 19%</span><span className="tabular-nums" data-testid="text-vat-amount">{eur(vatCents)}</span></div>
                      <div className="flex justify-between font-semibold text-base pt-2"><span>Gesamt inkl. MwSt.</span>
                        <span className="tabular-nums" data-testid="text-total-gross">{eur(grossCents)}</span></div>
                    </>
                  );
                })()}
                {/* Split summary (read-only) */}
                {(order.partnerCommissionCentsCalc > 0 || (order.partnerSplitsJson?.length ?? 0) > 0) && (
                  <div className="mt-3 pt-3 border-t space-y-1 text-xs">
                    <div className="font-semibold mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Partner-Split</div>
                    {(order.partnerSplitsJson?.length ?? 0) > 0 ? (
                      order.partnerSplitsJson.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between text-muted-foreground" data-testid={`text-split-summary-${i}`}>
                          <span>{s.label || `Partner ${i + 1}`} ({s.sharePercent}%)</span>
                        </div>
                      ))
                    ) : null}
                    <div className="flex justify-between"><span className="text-muted-foreground">Material-Abzug</span><span className="tabular-nums">−{eur(order.materialDeductionCents)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Partner Auszahlung netto</span><span className="tabular-nums">{eur(order.partnerPayoutNetCents)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Corion Anteil</span><span className="tabular-nums">{eur(order.corionShareCents)}</span></div>
                    {order.materialsBilledSeparately && <Badge variant="outline" className="mt-1">Materialien separat</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kundendaten */}
            <Card>
              <CardHeader><CardTitle className="text-base">Kundendaten</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><div className="text-xs text-muted-foreground">Name</div><div className="font-medium">{order.customerName}</div></div>
                <div><div className="text-xs text-muted-foreground">Telefonnummer</div><div>{order.customerPhone ?? "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">E-Mail</div><div className="break-all">{order.customerEmail ?? "—"}</div></div>
              </CardContent>
            </Card>

            {/* Reparaturbeschreibung */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Reparaturbeschreibung</CardTitle>
                <Button size="sm" variant="outline" data-testid="button-ai-draft"
                  onClick={() => draftDescription.mutate()} disabled={draftDescription.isPending}>
                  <Sparkles className="h-4 w-4 mr-1" /> AI Entwurf
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{order.damageDescription ?? "—"}</p>
                {order.priorDamage && (
                  <>
                    <div className="text-xs text-muted-foreground mt-3 mb-1">Vorschaden</div>
                    <p className="text-sm whitespace-pre-line">{order.priorDamage}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dokumente */}
            <Card>
              <CardHeader><CardTitle className="text-base">Dokumente ({docs.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {docs.length === 0 && <div className="text-xs text-muted-foreground">Keine Dokumente.</div>}
                {docs.map((d) => (
                  <a key={d.id} href={d.driveLink ?? "#"} target="_blank" rel="noreferrer"
                    className="block truncate underline" data-testid={`doc-${d.id}`}>{d.originalName}</a>
                ))}
              </CardContent>
            </Card>

            {/* Schadensbeschreibung + Foto-Karussell */}
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle className="text-base">Schadensbeschreibung</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md overflow-hidden bg-muted aspect-video flex items-center justify-center">
                    {photos.length > 0 ? (
                      <img src={photos[photoIdx % photos.length].driveLink ?? ""} alt="" className="object-cover w-full h-full" data-testid="img-damage" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Keine Fotos vorhanden</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm whitespace-pre-line">{order.damageDescription}</p>
                    {photos.length > 1 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Button size="sm" variant="outline" data-testid="button-photo-prev"
                          onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}>‹</Button>
                        <Badge variant="secondary">{(photoIdx % photos.length) + 1} / {photos.length}</Badge>
                        <Button size="sm" variant="outline" data-testid="button-photo-next"
                          onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}>›</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CRM & AI Panel (Salesforce-style) */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">CRM &amp; AI</h2>
              <Button variant="outline" size="sm" onClick={() => setCrmDialogOrder(order)}>
                <Users className="h-4 w-4 mr-1" /> Kundendossier öffnen
              </Button>
            </div>
            <CrmAiPanel orderId={id!} />
          </div>

          <OrderCrmModal
            order={crmDialogOrder}
            partners={partners as any[]}
            allOrders={allOrders as any[]}
            onClose={() => setCrmDialogOrder(null)}
          />

          {/* Rechnung Senden Wizard */}
          <Dialog open={invoiceWizard !== null} onOpenChange={(open) => !open && (setInvoiceWizard(null), setConfirmed(false))}>
            <DialogContent className="max-w-lg" data-testid="dialog-invoice-wizard">
              <DialogHeader>
                <DialogTitle>Rechnung senden | {order.vehicleMake} {order.vehicleModel}</DialogTitle>
              </DialogHeader>
              <div className="text-xs text-right text-muted-foreground -mt-2">Schritt {invoiceWizard ?? 1} / 2</div>
              {invoiceWizard === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Ohne folgende Angaben kann die Rechnung nicht bearbeitet werden:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Rechnungsempfänger</div>
                      <div className="font-medium">{order.customerName}</div>
                      <div>{order.customerAddress ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Referenznummer</div>
                      <div className="font-medium">Kennzeichen: {order.vehiclePlate ?? "—"}</div>
                      <div className="font-medium">Schadensnr.: {order.referenceNumber ?? "—"}</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} data-testid="checkbox-confirm" />
                    Ich verstehe
                  </label>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="rounded-md border p-3 bg-muted/30">
                    <div className="font-semibold">Vorschau</div>
                    <div className="mt-1">An: {order.customerEmail ?? "—"}</div>
                    <div>Betrag: {eur(Math.round((order.totalAmountCents ?? 0) * 1.19))}</div>
                    <div>Ref: {order.referenceNumber}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Der CFO-Agent prüft Skonto/Mahnungen und legt die Rechnung in <b>/cfo-inbox</b> ab.
                  </p>
                </div>
              )}
              <DialogFooter>
                {invoiceWizard === 1 ? (
                  <Button data-testid="button-wizard-next" disabled={!confirmed}
                    onClick={() => setInvoiceWizard(2)}>Weiter</Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setInvoiceWizard(1)}>Zurück</Button>
                    <Button data-testid="button-wizard-send" onClick={() => sendInvoice.mutate()} disabled={sendInvoice.isPending}>
                      {sendInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern & Senden"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Neuer Auftrag Dialog */}
      <Dialog open={showNewForm} onOpenChange={(open) => !open && setShowNewForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer Auftrag</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kennzeichen *</Label>
                <Input
                  placeholder="z.B. MTK AB 123"
                  value={newForm.vehiclePlate}
                  onChange={(e) => setNewForm({ ...newForm, vehiclePlate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Marke *</Label>
                <Input
                  placeholder="z.B. VW"
                  value={newForm.vehicleMake}
                  onChange={(e) => setNewForm({ ...newForm, vehicleMake: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Modell</Label>
                <Input
                  placeholder="z.B. Passat"
                  value={newForm.vehicleModel}
                  onChange={(e) => setNewForm({ ...newForm, vehicleModel: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Kundenname *</Label>
                <Input
                  placeholder="Vor- und Nachname"
                  value={newForm.customerName}
                  onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefon</Label>
                <Input
                  placeholder="+49…"
                  value={newForm.customerPhone}
                  onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Partner</Label>
                <Select
                  value={newForm.partnerId || "__none"}
                  onValueChange={(v) => setNewForm({ ...newForm, partnerId: v === "__none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Kein Partner —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Kein Partner —</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{partnerLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Termin (optional)</Label>
              <Input
                type="datetime-local"
                value={newForm.scheduledStart}
                onChange={(e) => setNewForm({ ...newForm, scheduledStart: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Schadensbeschreibung *</Label>
              <Textarea
                rows={3}
                placeholder="Beschreibung des Schadens…"
                value={newForm.damageDescription}
                onChange={(e) => setNewForm({ ...newForm, damageDescription: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Notizen</Label>
              <Input
                placeholder="Interne Notizen…"
                value={newForm.notes}
                onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>Abbrechen</Button>
            <Button
              disabled={
                newAuftragMutation.isPending ||
                !newForm.vehiclePlate ||
                !newForm.vehicleMake ||
                !newForm.customerName ||
                !newForm.damageDescription
              }
              onClick={() => newAuftragMutation.mutate({
                customerName: newForm.customerName,
                vehicleMake: newForm.vehicleMake,
                vehicleModel: newForm.vehicleModel || undefined,
                vehiclePlate: newForm.vehiclePlate,
                customerPhone: newForm.customerPhone || undefined,
                damageDescription: newForm.damageDescription,
                partnerId: newForm.partnerId || undefined,
                scheduledStart: newForm.scheduledStart
                  ? new Date(newForm.scheduledStart).toISOString()
                  : undefined,
                notes: newForm.notes || undefined,
                intakeSource: "admin_manual",
              })}
            >
              {newAuftragMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Erstelle…</>
                : "Auftrag erstellen"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
