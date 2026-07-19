import { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Progress } from "@/components/ui/progress";
import {
  LogOut, Home, Bell, Calendar, Settings, Plus, ChevronLeft, ChevronRight,
  List, LayoutGrid, Clock, Search, Phone, Mail, Building, Car, FileText,
  TrendingUp, Euro, Users, Loader2, Trash2, Send, Check, X, MessageSquare,
  CalendarDays, Eye, Brain, Target, Copy, Sparkles, ArrowRight, Shield,
  BarChart3, AlertTriangle, CheckCircle, Lightbulb, Zap, Upload, File, Image, FolderUp,
  ClipboardList, Filter, Wrench, CircleDollarSign, Package, ChevronDown, ChevronUp
} from "lucide-react";
import type { Appointment, Client, ClientInteraction, Offer, OfferLineItem, PartnerTransaction, Resource } from "@shared/schema";

const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DAYS_SHORT_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DAYS_FULL_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function PriceEurInput({
  cents,
  onCentsChange,
  testId,
}: {
  cents: number;
  onCentsChange: (cents: number) => void;
  testId?: string;
}) {
  // Local string state so the user can freely type "10.0" / "10," etc. without the
  // value snapping to "10.00" mid-typing. We only re-sync from cents when the parent
  // changes the value to something that doesn't match the current draft.
  const [draft, setDraft] = useState<string>(cents === 0 ? "" : (cents / 100).toFixed(2));
  useEffect(() => {
    const parsed = parseFloat(draft.replace(",", "."));
    const draftCents = Number.isNaN(parsed) ? 0 : Math.round(parsed * 100);
    if (draftCents !== cents) {
      setDraft(cents === 0 ? "" : (cents / 100).toFixed(2));
    }
  }, [cents]);
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        const raw = e.target.value;
        // allow only digits, one dot or comma, max 2 decimals
        if (raw !== "" && !/^\d*[.,]?\d{0,2}$/.test(raw)) return;
        setDraft(raw);
        if (raw === "" || raw === "." || raw === ",") {
          onCentsChange(0);
          return;
        }
        const eur = parseFloat(raw.replace(",", "."));
        if (Number.isNaN(eur) || eur < 0) {
          onCentsChange(0);
          return;
        }
        onCentsChange(Math.round(eur * 100));
      }}
      onBlur={() => {
        // pretty-print on blur, e.g. "10" -> "10,00", "10.5" -> "10,50"
        if (draft === "") return;
        const eur = parseFloat(draft.replace(",", "."));
        if (Number.isNaN(eur) || eur < 0) {
          setDraft("");
          onCentsChange(0);
          return;
        }
        setDraft(eur.toFixed(2));
        onCentsChange(Math.round(eur * 100));
      }}
      placeholder="0,00"
      data-testid={testId}
    />
  );
}

function formatDateHeader(date: Date): string {
  const dayName = DAYS_SHORT_DE[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_DE[date.getMonth()];
  return `${dayName}., ${day}. ${month}`;
}

interface OfferWithLineItems extends Offer {
  lineItems?: OfferLineItem[];
}

interface RevenueSummary {
  totalRevenue: number;
  totalCommission: number;
  pendingAmount: number;
  paidAmount: number;
  transactionCount: number;
}

export default function PartnerPortal() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("uebersicht");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
    if (!isLoading && isAuthenticated && user?.role !== "partner" && user?.role !== "admin") {
      toast({ variant: "destructive", title: "Zugriff verweigert", description: "Sie haben keine Berechtigung für diesen Bereich." });
      navigate("/");
    }
  }, [isAuthenticated, isLoading, user, navigate, toast]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Partner Portal | Corion Lackdoktor" description="Verwalten Sie Ihre Termine, Kunden, Angebote und Umsätze" />

      <div className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold font-heading text-primary" data-testid="text-portal-title">Partner Portal</h1>
                <p className="text-xs text-muted-foreground" data-testid="text-user-info">{user?.company || user?.firstName || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-notifications"><Bell className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" data-testid="button-calendar-nav"><Calendar className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" data-testid="button-settings"><Settings className="w-5 h-5" /></Button>
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />Abmelden
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap gap-1" data-testid="tabs-list">
            <TabsTrigger value="uebersicht" data-testid="tab-uebersicht">Übersicht</TabsTrigger>
            <TabsTrigger value="auftraege" data-testid="tab-auftraege" className="gap-1">
              <ClipboardList className="w-3.5 h-3.5" />Aufträge
            </TabsTrigger>
            <TabsTrigger value="termine" data-testid="tab-termine">Termine</TabsTrigger>
            <TabsTrigger value="kunden" data-testid="tab-kunden">Kunden</TabsTrigger>
            <TabsTrigger value="angebote" data-testid="tab-angebote">Angebote</TabsTrigger>
            <TabsTrigger value="umsatz" data-testid="tab-umsatz">Umsatz</TabsTrigger>
            <TabsTrigger value="upload-center" data-testid="tab-upload-center" className="gap-1">
              <FolderUp className="w-4 h-4" />Upload Center
            </TabsTrigger>
            <TabsTrigger value="meister-ai" data-testid="tab-meister-ai" className="gap-1">
              <Brain className="w-4 h-4" />Meister AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uebersicht">
            <OverviewTab onSwitchTab={setActiveTab} />
          </TabsContent>
          <TabsContent value="auftraege">
            <AuftraegeTab />
          </TabsContent>
          <TabsContent value="termine">
            <TermineTab />
          </TabsContent>
          <TabsContent value="kunden">
            <KundenTab />
          </TabsContent>
          <TabsContent value="angebote">
            <AngeboteTab />
          </TabsContent>
          <TabsContent value="umsatz">
            <UmsatzTab />
          </TabsContent>
          <TabsContent value="upload-center">
            <UploadCenterTab />
          </TabsContent>
          <TabsContent value="meister-ai">
            <MeisterAITab />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:            { label: "Offen",          color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  angenommen:      { label: "Angenommen",     color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/30" },
  in_bearbeitung:  { label: "In Bearbeitung", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
  fertig:          { label: "Fertig",         color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-950/30" },
  cancelled:       { label: "Storniert",      color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950/30" },
};

type MyOrder = {
  id: string; referenceNumber?: string; customerName: string;
  vehicleMake?: string; vehicleModel?: string; vehiclePlate?: string; vehicleColor?: string;
  damageDescription: string; status: string; orderDate: string | Date;
  deliveryDate?: string | Date | null; scheduledDate?: string | Date | null;
  totalAmountCents: number; laborAmountCents: number; partsAmountCents: number;
  partnerCommissionCalc: number; partnerModel?: string;
  customerPhone?: string; customerEmail?: string; priorDamage?: string;
};

// ── AUFTRÄGE TAB ───────────────────────────────────────────────────────────────
function AuftraegeTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<MyOrder[]>({
    queryKey: ["/api/partner/my-orders"],
  });

  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/workshop-orders/${id}/partner-status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/my-orders"] });
      toast({ title: "Status aktualisiert" });
    },
    onError: () => toast({ title: "Fehler beim Aktualisieren", variant: "destructive" }),
  });

  const normalizedOrders = orders.map((o: any) => ({
    ...o,
    status: o.status === "fertig" ? "completed" : o.status,
  }));

  const filtered = normalizedOrders.filter(o => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !search || [o.customerName, o.vehicleMake, o.vehicleModel, o.vehiclePlate, o.referenceNumber]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const statusCounts = normalizedOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const totalCommission = normalizedOrders.reduce((s, o) => s + (o.partnerCommissionCalc || 0), 0);
  const activeOrders = normalizedOrders.filter(o => o.status !== "completed" && o.status !== "cancelled");

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
      <span className="text-muted-foreground">Aufträge werden geladen…</span>
    </div>
  );

  const NEXT_STATUS: Record<string, string> = {
    open: "angenommen", angenommen: "in_bearbeitung", in_bearbeitung: "fertig",
  };

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Gesamt</span>
            </div>
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-xs text-muted-foreground">Aufträge</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Aktiv</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeOrders.length}</div>
            <div className="text-xs text-muted-foreground">In Bearbeitung</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CircleDollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Mein Anteil</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCommission)}</div>
            <div className="text-xs text-muted-foreground">Gesamt-Provision</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Abgeschlossen</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statusCounts["fertig"] || 0}
            </div>
            <div className="text-xs text-muted-foreground">Aufträge fertig</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background"
            placeholder="Suchen nach Kunde, Fahrzeug, Referenz…"
            value={search} onChange={e => setSearch(e.target.value)}
            data-testid="input-order-search"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "open", "angenommen", "in_bearbeitung", "fertig"].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
              data-testid={`filter-${s}`}>
              {s === "all" ? `Alle (${orders.length})` : `${ORDER_STATUS_CONFIG[s]?.label} (${statusCounts[s] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Keine Aufträge gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">Noch keine Aufträge zugewiesen oder Filter anpassen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: "text-foreground", bg: "bg-muted" };
            const isExpanded = expandedId === order.id;
            const nextStatus = NEXT_STATUS[order.status];
            const nextCfg = nextStatus ? ORDER_STATUS_CONFIG[nextStatus] : null;

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Main row */}
                  <div className="p-4 flex flex-wrap gap-4 items-start">
                    {/* Car icon + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {order.vehicleMake} {order.vehicleModel}
                          </span>
                          {order.vehiclePlate && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{order.vehiclePlate}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{order.customerName}</div>
                        {order.referenceNumber && (
                          <div className="text-xs text-muted-foreground font-mono">#{order.referenceNumber}</div>
                        )}
                      </div>
                    </div>

                    {/* Status + dates */}
                    <div className="flex flex-col gap-1 text-right">
                      <span className={`inline-flex items-center justify-end gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Eingang: {formatDate(order.orderDate)}
                      </span>
                      {order.deliveryDate && (
                        <span className="text-xs text-muted-foreground">
                          Rückgabe: {formatDate(order.deliveryDate)}
                        </span>
                      )}
                    </div>

                    {/* Commission */}
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Mein Anteil</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(order.partnerCommissionCalc)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Gesamt: {formatCurrency(order.totalAmountCents)}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="self-start p-1 rounded hover:bg-muted text-muted-foreground"
                      data-testid={`toggle-order-${order.id}`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-4 bg-muted/20">
                      {/* Damage desc + prior damage */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Schadenbeschreibung</div>
                          <p className="text-sm">{order.damageDescription}</p>
                          {order.priorDamage && (
                            <p className="text-xs text-muted-foreground mt-1">Vorschaden: {order.priorDamage}</p>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Kontakt</div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              <a href={`tel:${order.customerPhone}`} className="hover:text-primary">{order.customerPhone}</a>
                            </div>
                          )}
                          {order.customerEmail && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <a href={`mailto:${order.customerEmail}`} className="hover:text-primary">{order.customerEmail}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Commission breakdown */}
                      <div className="bg-background rounded-md border border-border p-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                          <CircleDollarSign className="w-3.5 h-3.5" />Provisions-Berechnung
                          {order.partnerModel && (
                            <Badge variant="outline" className="ml-auto text-xs">Modell {order.partnerModel}</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Manöver (Arbeit)</span>
                            <span>{formatCurrency(order.laborAmountCents)}</span>
                          </div>
                          <div className="flex justify-between text-red-500 dark:text-red-400">
                            <span>– Material (20%)</span>
                            <span>– {formatCurrency(Math.round(order.laborAmountCents * 0.20))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Netto-Manöver</span>
                            <span>{formatCurrency(Math.round(order.laborAmountCents * 0.80))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Partner-Anteil (40%)</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(order.partnerCommissionCalc)}
                            </span>
                          </div>
                          {order.partsAmountCents > 0 && (
                            <div className="flex justify-between text-muted-foreground text-xs border-t border-border pt-1 mt-1">
                              <span>Teile/Material (nicht im Anteil)</span>
                              <span>{formatCurrency(order.partsAmountCents)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status progression */}
                      {nextStatus && (
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Nächster Schritt: <span className="font-medium">{nextCfg?.label}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: nextStatus })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`btn-advance-status-${order.id}`}>
                            {updateStatusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Als „{nextCfg?.label}" markieren
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OverviewTab({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data: todayAppointments = [], isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ["/api/partner-portal/appointments", { start: startOfDay.toISOString(), end: endOfDay.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/appointments?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: offers = [], isLoading: loadingOffers } = useQuery<Offer[]>({
    queryKey: ["/api/partner-portal/offers"],
  });

  const { data: revenueSummary, isLoading: loadingRevenue } = useQuery<RevenueSummary>({
    queryKey: ["/api/partner-portal/revenue-summary"],
  });

  const { data: transactions = [] } = useQuery<PartnerTransaction[]>({
    queryKey: ["/api/partner-portal/transactions"],
  });

  const openOffers = offers.filter(o => o.status === "draft" || o.status === "sent");
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.createdAt);
    return d >= startOfMonth && d <= endOfMonth;
  });
  const monthRevenue = monthTransactions.reduce((s, t) => s + t.revenueCents, 0);
  const monthCommission = monthTransactions.reduce((s, t) => s + t.commissionCents, 0);

  const isPageLoading = loadingAppts || loadingOffers || loadingRevenue;

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate" data-testid="kpi-termine-heute">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Termine Heute</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-termine-heute">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="kpi-offene-angebote">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offene Angebote</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-offene-angebote">{openOffers.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="kpi-umsatz-monat">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Umsatz (Monat)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-umsatz-monat">{formatCurrency(monthRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="kpi-provision-monat">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provision (Monat)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-provision-monat">{formatCurrency(monthCommission)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => onSwitchTab("termine")} data-testid="button-quick-neuer-termin">
            <Plus className="w-4 h-4 mr-2" />Neuer Termin
          </Button>
          <Button variant="outline" onClick={() => onSwitchTab("angebote")} data-testid="button-quick-neues-angebot">
            <FileText className="w-4 h-4 mr-2" />Neues Angebot
          </Button>
          <Button variant="outline" onClick={() => onSwitchTab("kunden")} data-testid="button-quick-neuer-kunde">
            <Users className="w-4 h-4 mr-2" />Neuer Kunde
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Heutige Termine</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-appointments-today">Keine Termine für heute geplant</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between gap-2 p-2 rounded-md border" data-testid={`appointment-overview-${appt.id}`}>
                    <div>
                      <p className="font-medium text-sm">{appt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} - {new Date(appt.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{appt.status === "scheduled" ? "Geplant" : appt.status === "in_progress" ? "In Reparatur" : appt.status === "completed" ? "Fertig" : appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Letzte Transaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-transactions">Keine Transaktionen vorhanden</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between gap-2 p-2 rounded-md border" data-testid={`transaction-overview-${tx.id}`}>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(tx.revenueCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TermineTab() {
  const [calView, setCalView] = useState<"list" | "month" | "week">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newAppt, setNewAppt] = useState({ title: "", date: "", startTime: "09:00", endTime: "10:00", notes: "", resourceId: "" });
  const { toast } = useToast();

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/partner-portal/appointments", { start: startOfMonth.toISOString(), end: endOfMonth.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/appointments?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/partner-portal/resources"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/partner-portal/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/appointments"] });
      toast({ title: "Termin erstellt", description: "Der Termin wurde erfolgreich angelegt." });
      setShowNewDialog(false);
      setNewAppt({ title: "", date: "", startTime: "09:00", endTime: "10:00", notes: "", resourceId: "" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fehler", description: "Termin konnte nicht erstellt werden." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/partner-portal/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/appointments"] });
      toast({ title: "Status aktualisiert" });
    },
  });

  const handleCreateAppointment = () => {
    if (!newAppt.title || !newAppt.date || !newAppt.resourceId) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte füllen Sie alle Pflichtfelder aus." });
      return;
    }
    const startTime = new Date(`${newAppt.date}T${newAppt.startTime}:00`);
    const endTime = new Date(`${newAppt.date}T${newAppt.endTime}:00`);
    createMutation.mutate({
      title: newAppt.title,
      resourceId: newAppt.resourceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: newAppt.notes || null,
      status: "scheduled",
    });
  };

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goNext = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    appointments.forEach(appt => {
      const dateKey = new Date(appt.startTime).toISOString().split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(appt);
    });
    return groups;
  }, [appointments]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let startDay = first.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getApptStatusBadge = (status: string) => {
    if (status === "scheduled") return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 no-default-hover-elevate no-default-active-elevate">Geplant</Badge>;
    if (status === "in_progress") return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 no-default-hover-elevate no-default-active-elevate">In Reparatur</Badge>;
    if (status === "completed") return <Badge variant="secondary" className="bg-green-500/20 text-green-400 no-default-hover-elevate no-default-active-elevate">Rückgabebereit</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant={calView === "list" ? "default" : "outline"} size="sm" onClick={() => setCalView("list")} data-testid="button-view-list">
            <List className="w-4 h-4 mr-1" />Terminübersicht
          </Button>
          <Button variant={calView === "month" ? "default" : "outline"} size="sm" onClick={() => setCalView("month")} data-testid="button-view-month">
            <LayoutGrid className="w-4 h-4 mr-1" />Monat
          </Button>
          <Button variant={calView === "week" ? "default" : "outline"} size="sm" onClick={() => setCalView("week")} data-testid="button-view-week">
            <CalendarDays className="w-4 h-4 mr-1" />Woche
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday} data-testid="button-today">Heute</Button>
          <Button variant="ghost" size="icon" onClick={goPrev} data-testid="button-prev-month"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium text-sm min-w-[120px] text-center" data-testid="text-current-month">{MONTHS_DE[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <Button variant="ghost" size="icon" onClick={goNext} data-testid="button-next-month"><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <Button size="sm" onClick={() => setShowNewDialog(true)} data-testid="button-neuer-termin">
          <Plus className="w-4 h-4 mr-1" />Neuer Termin
        </Button>
      </div>

      {calView === "list" && (
        <div className="space-y-4">
          {Object.keys(groupedByDate).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-appointments">Für diesen Monat sind keine Termine geplant</CardContent></Card>
          ) : (
            Object.entries(groupedByDate).sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, appts]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2" data-testid={`date-header-${dateKey}`}>{formatDateHeader(new Date(dateKey))}</h3>
                <div className="space-y-2">
                  {appts.map(appt => (
                    <Card key={appt.id} className="hover-elevate" data-testid={`appointment-${appt.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Car className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" data-testid={`appointment-title-${appt.id}`}>{appt.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(appt.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} - {new Date(appt.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {appt.notes && (
                              <p className="text-xs text-muted-foreground mt-1" data-testid={`appointment-notes-${appt.id}`}>
                                {appt.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {getApptStatusBadge(appt.status)}
                            {appt.status === "scheduled" && (
                              <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "in_progress" })} data-testid={`button-start-repair-${appt.id}`}>
                                Reparatur Starten
                              </Button>
                            )}
                            {appt.status === "in_progress" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "completed" })} data-testid={`button-ready-${appt.id}`}>
                                  Rückgabebereit
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {calView === "month" && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {daysInMonth.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="p-2 min-h-[60px]" />;
                const dateKey = day.toISOString().split("T")[0];
                const dayAppts = groupedByDate[dateKey] || [];
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={dateKey} className={`p-1 min-h-[60px] rounded-md border ${isToday ? "border-primary bg-primary/5" : "border-transparent"}`} data-testid={`calendar-day-${dateKey}`}>
                    <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayAppts.slice(0, 2).map(a => (
                        <div key={a.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-primary/10 text-primary">{a.title}</div>
                      ))}
                      {dayAppts.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{dayAppts.length - 2} mehr</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {calView === "week" && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const dateKey = day.toISOString().split("T")[0];
                const dayAppts = groupedByDate[dateKey] || [];
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={dateKey} className={`rounded-md border p-2 min-h-[200px] ${isToday ? "border-primary" : ""}`} data-testid={`week-day-${dateKey}`}>
                    <div className="text-center mb-2">
                      <div className="text-xs text-muted-foreground">{DAYS_SHORT_DE[day.getDay()]}</div>
                      <div className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>{day.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      {dayAppts.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center">Keine Termine</p>
                      ) : dayAppts.map(a => (
                        <div key={a.id} className="text-[10px] p-1 rounded bg-primary/10 text-primary truncate">{a.title}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neuer Termin</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titel *</label>
              <Input value={newAppt.title} onChange={e => setNewAppt(p => ({ ...p, title: e.target.value }))} placeholder="Terminbezeichnung" data-testid="input-appt-title" />
            </div>
            <div>
              <label className="text-sm font-medium">Datum *</label>
              <Input type="date" value={newAppt.date} onChange={e => setNewAppt(p => ({ ...p, date: e.target.value }))} data-testid="input-appt-date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Startzeit</label>
                <Input type="time" value={newAppt.startTime} onChange={e => setNewAppt(p => ({ ...p, startTime: e.target.value }))} data-testid="input-appt-start" />
              </div>
              <div>
                <label className="text-sm font-medium">Endzeit</label>
                <Input type="time" value={newAppt.endTime} onChange={e => setNewAppt(p => ({ ...p, endTime: e.target.value }))} data-testid="input-appt-end" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Ressource *</label>
              <Select value={newAppt.resourceId} onValueChange={v => setNewAppt(p => ({ ...p, resourceId: v }))}>
                <SelectTrigger data-testid="select-appt-resource"><SelectValue placeholder="Ressource wählen" /></SelectTrigger>
                <SelectContent>
                  {resources.filter(r => r.isActive).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                  {resources.filter(r => r.isActive).length === 0 && <SelectItem value="__none" disabled>Keine Ressourcen verfügbar</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notizen</label>
              <Textarea value={newAppt.notes} onChange={e => setNewAppt(p => ({ ...p, notes: e.target.value }))} placeholder="Optionale Notizen" data-testid="input-appt-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} data-testid="button-cancel-appt">Abbrechen</Button>
            <Button onClick={handleCreateAppointment} disabled={createMutation.isPending} data-testid="button-save-appt">
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KundenTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [newClient, setNewClient] = useState({
    name: "", email: "", phone: "", company: "", address: "", city: "", postalCode: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "", licensePlate: "", vin: "", notes: "", status: "lead",
  });
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/partner-portal/clients"],
  });

  const { data: interactions = [] } = useQuery<ClientInteraction[]>({
    queryKey: ["/api/partner-portal/clients", selectedClient?.id, "interactions"],
    queryFn: async () => {
      if (!selectedClient) return [];
      const res = await fetch(`/api/partner-portal/clients/${selectedClient.id}/interactions`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedClient,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/partner-portal/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/clients"] });
      toast({ title: "Kunde erstellt", description: "Der Kunde wurde erfolgreich angelegt." });
      setShowNewDialog(false);
      setNewClient({ name: "", email: "", phone: "", company: "", address: "", city: "", postalCode: "", vehicleMake: "", vehicleModel: "", vehicleYear: "", licensePlate: "", vin: "", notes: "", status: "lead" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fehler", description: "Kunde konnte nicht erstellt werden." });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/partner-portal/clients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/clients"] });
      toast({ title: "Kunde aktualisiert" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ clientId, content }: { clientId: string; content: string }) => {
      const res = await apiRequest("POST", `/api/partner-portal/clients/${clientId}/interactions`, { content, type: "note" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/clients", selectedClient?.id, "interactions"] });
      toast({ title: "Notiz hinzugefügt" });
      setShowNoteDialog(false);
      setNoteContent("");
    },
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.email?.toLowerCase().includes(searchQuery.toLowerCase())) || (c.company?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "alle" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    if (status === "lead") return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 no-default-hover-elevate no-default-active-elevate">Lead</Badge>;
    if (status === "active") return <Badge variant="secondary" className="bg-green-500/20 text-green-400 no-default-hover-elevate no-default-active-elevate">Aktiv</Badge>;
    if (status === "lost") return <Badge variant="secondary" className="bg-red-500/20 text-red-400 no-default-hover-elevate no-default-active-elevate">Verloren</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Kunden suchen..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} data-testid="input-search-clients" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-client-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="lost">Verloren</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowNewDialog(true)} data-testid="button-neuer-kunde">
          <Plus className="w-4 h-4 mr-1" />Neuer Kunde
        </Button>
      </div>

      {filteredClients.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-clients">Keine Kunden gefunden</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map(client => (
            <Card key={client.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)} data-testid={`client-card-${client.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold" data-testid={`client-name-${client.id}`}>{client.name}</p>
                      {getStatusBadge(client.status)}
                    </div>
                    {client.company && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building className="w-3 h-3" />{client.company}</p>}
                    {client.phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</p>}
                    {client.email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</p>}
                    {client.vehicleMake && <p className="text-sm text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" />{client.vehicleMake} {client.vehicleModel} {client.vehicleYear}</p>}
                  </div>
                  <Select value={client.status} onValueChange={v => { updateClientMutation.mutate({ id: client.id, status: v }); }}>
                    <SelectTrigger className="w-[110px]" data-testid={`select-status-${client.id}`} onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="lost">Verloren</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedClient?.id === client.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-medium text-sm">Interaktionshistorie</h4>
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setShowNoteDialog(true); }} data-testid={`button-add-note-${client.id}`}>
                        <MessageSquare className="w-4 h-4 mr-1" />Notiz hinzufügen
                      </Button>
                    </div>
                    {interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine Notizen vorhanden</p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {interactions.map(int => (
                          <div key={int.id} className="p-2 rounded-md border text-sm" data-testid={`interaction-${int.id}`}>
                            <p>{int.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(int.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {client.notes && (
                      <div>
                        <h4 className="font-medium text-sm">Notizen</h4>
                        <p className="text-sm text-muted-foreground">{client.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Neuer Kunde</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name *</label><Input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Vor- und Nachname" data-testid="input-client-name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">E-Mail</label><Input value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} placeholder="email@beispiel.de" data-testid="input-client-email" /></div>
              <div><label className="text-sm font-medium">Telefon</label><Input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} placeholder="+49..." data-testid="input-client-phone" /></div>
            </div>
            <div><label className="text-sm font-medium">Firma</label><Input value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))} placeholder="Firmenname" data-testid="input-client-company" /></div>
            <div><label className="text-sm font-medium">Adresse</label><Input value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} placeholder="Straße, Nr." data-testid="input-client-address" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Stadt</label><Input value={newClient.city} onChange={e => setNewClient(p => ({ ...p, city: e.target.value }))} placeholder="Stadt" data-testid="input-client-city" /></div>
              <div><label className="text-sm font-medium">PLZ</label><Input value={newClient.postalCode} onChange={e => setNewClient(p => ({ ...p, postalCode: e.target.value }))} placeholder="PLZ" data-testid="input-client-plz" /></div>
            </div>
            <h4 className="font-medium text-sm pt-2 border-t">Fahrzeuginformationen</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium">Marke</label><Input value={newClient.vehicleMake} onChange={e => setNewClient(p => ({ ...p, vehicleMake: e.target.value }))} placeholder="BMW" data-testid="input-client-vmake" /></div>
              <div><label className="text-sm font-medium">Modell</label><Input value={newClient.vehicleModel} onChange={e => setNewClient(p => ({ ...p, vehicleModel: e.target.value }))} placeholder="3er" data-testid="input-client-vmodel" /></div>
              <div><label className="text-sm font-medium">Jahr</label><Input value={newClient.vehicleYear} onChange={e => setNewClient(p => ({ ...p, vehicleYear: e.target.value }))} placeholder="2024" data-testid="input-client-vyear" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Kennzeichen</label><Input value={newClient.licensePlate} onChange={e => setNewClient(p => ({ ...p, licensePlate: e.target.value }))} placeholder="F-AB 1234" data-testid="input-client-plate" /></div>
              <div><label className="text-sm font-medium">FIN</label><Input value={newClient.vin} onChange={e => setNewClient(p => ({ ...p, vin: e.target.value }))} placeholder="VIN" data-testid="input-client-vin" /></div>
            </div>
            <div><label className="text-sm font-medium">Notizen</label><Textarea value={newClient.notes} onChange={e => setNewClient(p => ({ ...p, notes: e.target.value }))} placeholder="Zusätzliche Informationen" data-testid="input-client-notes" /></div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newClient.status} onValueChange={v => setNewClient(p => ({ ...p, status: v }))}>
                <SelectTrigger data-testid="select-client-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="lost">Verloren</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} data-testid="button-cancel-client">Abbrechen</Button>
            <Button onClick={() => { if (!newClient.name) { return; } createClientMutation.mutate(newClient); }} disabled={createClientMutation.isPending} data-testid="button-save-client">
              {createClientMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Notiz hinzufügen</DialogTitle></DialogHeader>
          <Textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Notiz eingeben..." data-testid="input-note-content" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)} data-testid="button-cancel-note">Abbrechen</Button>
            <Button onClick={() => { if (selectedClient && noteContent) addNoteMutation.mutate({ clientId: selectedClient.id, content: noteContent }); }} disabled={addNoteMutation.isPending} data-testid="button-save-note">
              {addNoteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AngeboteTab() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithLineItems | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  const [newOffer, setNewOffer] = useState({
    clientName: "", vehicleInfo: "", licensePlate: "", repairDescription: "", estimatedDays: 1, notes: "",
    lineItems: [{ type: "labor", description: "", quantity: 1, unitPriceCents: 0 }] as { type: string; description: string; quantity: number; unitPriceCents: number }[],
    discountCents: 0,
  });

  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/partner-portal/offers"],
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/partner-portal/offers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/offers"] });
      toast({ title: "Angebot erstellt", description: "Das Angebot wurde erfolgreich angelegt." });
      setShowNewDialog(false);
      setNewOffer({ clientName: "", vehicleInfo: "", licensePlate: "", repairDescription: "", estimatedDays: 1, notes: "", lineItems: [{ type: "labor", description: "", quantity: 1, unitPriceCents: 0 }], discountCents: 0 });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fehler", description: "Angebot konnte nicht erstellt werden." });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/partner-portal/offers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/offers"] });
      toast({ title: "Angebot aktualisiert" });
      setShowDetailDialog(false);
    },
  });

  const subtotal = newOffer.lineItems.reduce((s, item) => s + item.quantity * item.unitPriceCents, 0);
  const netTotal = subtotal - newOffer.discountCents;
  const taxAmount = Math.round(netTotal * 0.19);
  const grossTotal = netTotal + taxAmount;

  const handleSaveOffer = (status: string) => {
    if (!newOffer.clientName) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte Kundennamen angeben." });
      return;
    }
    createOfferMutation.mutate({
      clientName: newOffer.clientName,
      vehicleInfo: newOffer.vehicleInfo,
      licensePlate: newOffer.licensePlate,
      repairDescription: newOffer.repairDescription,
      estimatedDays: newOffer.estimatedDays,
      notes: newOffer.notes,
      status,
      subtotalCents: subtotal,
      discountCents: newOffer.discountCents,
      totalNetCents: netTotal,
      totalTaxCents: taxAmount,
      totalGrossCents: grossTotal,
      taxRate: 19,
      lineItems: newOffer.lineItems.filter(li => li.description),
    });
  };

  const addLineItem = () => {
    setNewOffer(p => ({ ...p, lineItems: [...p.lineItems, { type: "labor", description: "", quantity: 1, unitPriceCents: 0 }] }));
  };

  const removeLineItem = (index: number) => {
    setNewOffer(p => ({ ...p, lineItems: p.lineItems.filter((_, i) => i !== index) }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setNewOffer(p => ({
      ...p,
      lineItems: p.lineItems.map((li, i) => i === index ? { ...li, [field]: value } : li),
    }));
  };

  const viewOfferDetail = async (offer: Offer) => {
    try {
      const res = await fetch(`/api/partner-portal/offers/${offer.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSelectedOffer(data);
      setShowDetailDialog(true);
    } catch {
      toast({ variant: "destructive", title: "Fehler", description: "Angebot konnte nicht geladen werden." });
    }
  };

  const getOfferStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: "Entwurf", className: "bg-gray-500/20 text-gray-400" },
      sent: { label: "Gesendet", className: "bg-blue-500/20 text-blue-400" },
      accepted: { label: "Angenommen", className: "bg-green-500/20 text-green-400" },
      rejected: { label: "Abgelehnt", className: "bg-red-500/20 text-red-400" },
      expired: { label: "Abgelaufen", className: "bg-yellow-500/20 text-yellow-400" },
    };
    const s = map[status] || { label: status, className: "" };
    return <Badge variant="secondary" className={`${s.className} no-default-hover-elevate no-default-active-elevate`}>{s.label}</Badge>;
  };

  const typeLabels: Record<string, string> = { labor: "Arbeit", material: "Material", paint: "Lack", part: "Teile" };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold">Angebote</h2>
        <Button size="sm" onClick={() => setShowNewDialog(true)} data-testid="button-neues-angebot">
          <Plus className="w-4 h-4 mr-1" />Neues Angebot
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-offers">Keine Angebote vorhanden</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <Card key={offer.id} className="hover-elevate cursor-pointer" onClick={() => viewOfferDetail(offer)} data-testid={`offer-card-${offer.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" data-testid={`offer-number-${offer.id}`}>{offer.offerNumber || "Entwurf"}</span>
                      {getOfferStatusBadge(offer.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{offer.clientName} {offer.vehicleInfo && `- ${offer.vehicleInfo}`}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(offer.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" data-testid={`offer-total-${offer.id}`}>{formatCurrency(offer.totalGrossCents)}</p>
                    <p className="text-xs text-muted-foreground">Brutto inkl. MwSt.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Neues Angebot</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="text-sm font-medium">Kundenname *</label><Input value={newOffer.clientName} onChange={e => setNewOffer(p => ({ ...p, clientName: e.target.value }))} placeholder="Kundenname" data-testid="input-offer-client" /></div>
              <div><label className="text-sm font-medium">Fahrzeug</label><Input value={newOffer.vehicleInfo} onChange={e => setNewOffer(p => ({ ...p, vehicleInfo: e.target.value }))} placeholder="BMW 3er 2024" data-testid="input-offer-vehicle" /></div>
              <div><label className="text-sm font-medium">Kennzeichen</label><Input value={newOffer.licensePlate} onChange={e => setNewOffer(p => ({ ...p, licensePlate: e.target.value }))} placeholder="F-AB 1234" data-testid="input-offer-plate" /></div>
            </div>
            <div><label className="text-sm font-medium">Reparaturbeschreibung</label><Textarea value={newOffer.repairDescription} onChange={e => setNewOffer(p => ({ ...p, repairDescription: e.target.value }))} placeholder="Beschreibung der Reparaturarbeiten" data-testid="input-offer-description" /></div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <label className="text-sm font-medium">Positionen</label>
                <Button variant="outline" size="sm" onClick={addLineItem} data-testid="button-add-line-item">
                  <Plus className="w-3 h-3 mr-1" />Position
                </Button>
              </div>
              <div className="space-y-2">
                {newOffer.lineItems.map((item, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 p-2 rounded-md border">
                    <div className="w-[100px]">
                      <label className="text-xs text-muted-foreground">Typ</label>
                      <Select value={item.type} onValueChange={v => updateLineItem(i, "type", v)}>
                        <SelectTrigger data-testid={`select-line-type-${i}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="labor">Arbeit</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="paint">Lack</SelectItem>
                          <SelectItem value="part">Teile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="text-xs text-muted-foreground">Beschreibung</label>
                      <Input value={item.description} onChange={e => updateLineItem(i, "description", e.target.value)} placeholder="Beschreibung" data-testid={`input-line-desc-${i}`} />
                    </div>
                    <div className="w-[70px]">
                      <label className="text-xs text-muted-foreground">Menge</label>
                      <Input type="number" min="1" value={item.quantity} onChange={e => updateLineItem(i, "quantity", parseInt(e.target.value) || 1)} data-testid={`input-line-qty-${i}`} />
                    </div>
                    <div className="w-[110px]">
                      <label className="text-xs text-muted-foreground">Preis (€)</label>
                      <PriceEurInput
                        cents={item.unitPriceCents}
                        onCentsChange={(c) => updateLineItem(i, "unitPriceCents", c)}
                        testId={`input-line-price-${i}`}
                      />
                    </div>
                    <div className="w-[80px] text-right text-sm font-medium">{formatCurrency(item.quantity * item.unitPriceCents)}</div>
                    {newOffer.lineItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeLineItem(i)} data-testid={`button-remove-line-${i}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm"><span>Zwischensumme (Netto)</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Rabatt</span>
                <Input type="number" min="0" className="w-[120px]" value={newOffer.discountCents} onChange={e => setNewOffer(p => ({ ...p, discountCents: parseInt(e.target.value) || 0 }))} data-testid="input-offer-discount" />
              </div>
              <div className="flex justify-between text-sm"><span>Netto</span><span>{formatCurrency(netTotal)}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>MwSt. (19%)</span><span>{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between font-bold"><span>Kundenpreis (Brutto)</span><span data-testid="text-offer-gross-total">{formatCurrency(grossTotal)}</span></div>
            </div>

            <div className="border-t pt-3 space-y-2 bg-muted/30 rounded-md p-3">
              <h4 className="text-sm font-bold flex items-center gap-2"><Euro className="w-4 h-4 text-primary" />Provisionsberechnung</h4>
              {(() => {
                const matPct = 20;
                const matCost = Math.round(netTotal * matPct / 100);
                const afterMat = netTotal - matCost;
                const partnerPct = 40;
                const partnerComm = Math.round(afterMat * partnerPct / 100);
                const corionComm = afterMat - partnerComm;
                return (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground"><span>Materialkosten ({matPct}%)</span><span>-{formatCurrency(matCost)}</span></div>
                    <div className="flex justify-between text-sm"><span>Netto nach Material</span><span>{formatCurrency(afterMat)}</span></div>
                    <div className="flex justify-between text-sm text-green-500"><span>Ihr Anteil ({partnerPct}%)</span><span data-testid="text-partner-commission">{formatCurrency(partnerComm)}</span></div>
                    <div className="flex justify-between text-sm text-muted-foreground"><span>Corion Anteil ({100 - partnerPct}%)</span><span>{formatCurrency(corionComm)}</span></div>
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Geschätzte Tage</label><Input type="number" min="1" value={newOffer.estimatedDays} onChange={e => setNewOffer(p => ({ ...p, estimatedDays: parseInt(e.target.value) || 1 }))} data-testid="input-offer-days" /></div>
            </div>
            <div><label className="text-sm font-medium">Notizen</label><Textarea value={newOffer.notes} onChange={e => setNewOffer(p => ({ ...p, notes: e.target.value }))} placeholder="Interne Notizen" data-testid="input-offer-notes" /></div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowNewDialog(false)} data-testid="button-cancel-offer">Abbrechen</Button>
            <Button variant="secondary" onClick={() => handleSaveOffer("draft")} disabled={createOfferMutation.isPending} data-testid="button-save-draft">
              {createOfferMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Als Entwurf speichern
            </Button>
            <Button onClick={() => handleSaveOffer("sent")} disabled={createOfferMutation.isPending} data-testid="button-send-offer">
              <Send className="w-4 h-4 mr-1" />Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Angebot {selectedOffer?.offerNumber || "Details"}</DialogTitle></DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getOfferStatusBadge(selectedOffer.status)}
                <span className="text-sm text-muted-foreground">{formatDate(selectedOffer.createdAt)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Kunde:</span> <span className="font-medium">{selectedOffer.clientName}</span></div>
                <div><span className="text-muted-foreground">Fahrzeug:</span> <span className="font-medium">{selectedOffer.vehicleInfo}</span></div>
                {selectedOffer.licensePlate && <div><span className="text-muted-foreground">Kennzeichen:</span> <span className="font-medium">{selectedOffer.licensePlate}</span></div>}
                {selectedOffer.estimatedDays && <div><span className="text-muted-foreground">Geschätzte Tage:</span> <span className="font-medium">{selectedOffer.estimatedDays}</span></div>}
              </div>
              {selectedOffer.repairDescription && <div className="text-sm"><span className="text-muted-foreground">Beschreibung:</span><p className="mt-1">{selectedOffer.repairDescription}</p></div>}

              {selectedOffer.lineItems && selectedOffer.lineItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Positionen</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50"><th className="text-left p-2">Typ</th><th className="text-left p-2">Beschreibung</th><th className="text-right p-2">Menge</th><th className="text-right p-2">Preis</th><th className="text-right p-2">Gesamt</th></tr></thead>
                      <tbody>
                        {selectedOffer.lineItems.map((li: OfferLineItem) => (
                          <tr key={li.id} className="border-b">
                            <td className="p-2">{typeLabels[li.type] || li.type}</td>
                            <td className="p-2">{li.description}</td>
                            <td className="p-2 text-right">{li.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(li.unitPriceCents)}</td>
                            <td className="p-2 text-right">{formatCurrency(li.quantity * li.unitPriceCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Netto</span><span>{formatCurrency(selectedOffer.totalNetCents)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>MwSt. ({selectedOffer.taxRate}%)</span><span>{formatCurrency(selectedOffer.totalTaxCents)}</span></div>
                <div className="flex justify-between font-bold"><span>Kundenpreis (Brutto)</span><span>{formatCurrency(selectedOffer.totalGrossCents)}</span></div>
              </div>

              <div className="border-t pt-3 space-y-1 text-sm bg-muted/30 rounded-md p-3">
                <h4 className="font-bold flex items-center gap-2"><Euro className="w-4 h-4 text-primary" />Provisionsaufschl.</h4>
                <div className="flex justify-between text-muted-foreground"><span>Materialkosten ({selectedOffer.materialPercent || 20}%)</span><span>-{formatCurrency(selectedOffer.materialCostCents || 0)}</span></div>
                <div className="flex justify-between"><span>Nach Material</span><span>{formatCurrency(selectedOffer.netAfterMaterialCents || 0)}</span></div>
                <div className="flex justify-between text-green-500 font-medium"><span>Ihr Anteil ({selectedOffer.partnerSharePercent || 40}%)</span><span data-testid="detail-partner-commission">{formatCurrency(selectedOffer.partnerCommissionCents || 0)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Corion ({100 - (selectedOffer.partnerSharePercent || 40)}%)</span><span>{formatCurrency(selectedOffer.corionCommissionCents || 0)}</span></div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedOffer.status === "draft" && (
                  <Button size="sm" onClick={() => updateOfferMutation.mutate({ id: selectedOffer.id, status: "sent" })} data-testid="button-offer-send">
                    <Send className="w-4 h-4 mr-1" />Senden
                  </Button>
                )}
                {selectedOffer.status === "sent" && (
                  <>
                    <Button size="sm" onClick={() => updateOfferMutation.mutate({ id: selectedOffer.id, status: "accepted" })} data-testid="button-offer-accept">
                      <Check className="w-4 h-4 mr-1" />Akzeptieren
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateOfferMutation.mutate({ id: selectedOffer.id, status: "rejected" })} data-testid="button-offer-reject">
                      <X className="w-4 h-4 mr-1" />Ablehnen
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UmsatzTab() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ description: "", revenueCents: 0 });
  const { toast } = useToast();

  const { data: revenueSummary, isLoading: loadingSummary } = useQuery<RevenueSummary>({
    queryKey: ["/api/partner-portal/revenue-summary"],
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery<PartnerTransaction[]>({
    queryKey: ["/api/partner-portal/transactions"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/partner-portal/transactions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/revenue-summary"] });
      toast({ title: "Transaktion erstellt", description: "Die Transaktion wurde erfolgreich angelegt." });
      setShowNewDialog(false);
      setNewTransaction({ description: "", revenueCents: 0 });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fehler", description: "Transaktion konnte nicht erstellt werden." });
    },
  });

  const getTxStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Ausstehend", className: "bg-yellow-500/20 text-yellow-400" },
      paid: { label: "Ausgezahlt", className: "bg-green-500/20 text-green-400" },
      cancelled: { label: "Storniert", className: "bg-red-500/20 text-red-400" },
    };
    const s = map[status] || { label: status, className: "" };
    return <Badge variant="secondary" className={`${s.className} no-default-hover-elevate no-default-active-elevate`}>{s.label}</Badge>;
  };

  if (loadingSummary || loadingTx) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const summary = revenueSummary || { totalRevenue: 0, totalCommission: 0, pendingAmount: 0, paidAmount: 0, transactionCount: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate" data-testid="kpi-gesamtumsatz">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="value-gesamtumsatz">{formatCurrency(summary.totalRevenue)}</div></CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="kpi-provision">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provision</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="value-provision">{formatCurrency(summary.totalCommission)}</div></CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="kpi-ausstehend">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="value-ausstehend">{formatCurrency(summary.pendingAmount)}</div></CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="kpi-ausgezahlt">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausgezahlt</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="value-ausgezahlt">{formatCurrency(summary.paidAmount)}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold">Transaktionen</h2>
        <Button size="sm" onClick={() => setShowNewDialog(true)} data-testid="button-neue-transaktion">
          <Plus className="w-4 h-4 mr-1" />Neue Transaktion
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-transactions-umsatz">Keine Transaktionen vorhanden</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50"><th className="text-left p-3">Datum</th><th className="text-left p-3">Beschreibung</th><th className="text-right p-3">Umsatz</th><th className="text-right p-3">Provision %</th><th className="text-right p-3">Provision</th><th className="text-center p-3">Status</th></tr></thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b" data-testid={`transaction-row-${tx.id}`}>
                      <td className="p-3">{formatDate(tx.createdAt)}</td>
                      <td className="p-3" data-testid={`transaction-desc-${tx.id}`}>{tx.description}</td>
                      <td className="p-3 text-right">{formatCurrency(tx.revenueCents)}</td>
                      <td className="p-3 text-right">{tx.commissionPercent}%</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(tx.commissionCents)}</td>
                      <td className="p-3 text-center">{getTxStatusBadge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Transaktion</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Beschreibung *</label><Input value={newTransaction.description} onChange={e => setNewTransaction(p => ({ ...p, description: e.target.value }))} placeholder="Reparaturauftrag #..." data-testid="input-tx-description" /></div>
            <div><label className="text-sm font-medium">Umsatz (Cent) *</label><Input type="number" min="0" value={newTransaction.revenueCents} onChange={e => setNewTransaction(p => ({ ...p, revenueCents: parseInt(e.target.value) || 0 }))} data-testid="input-tx-revenue" /></div>
            <p className="text-xs text-muted-foreground">Die Provision wird automatisch basierend auf Ihrem Anteil berechnet.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} data-testid="button-cancel-tx">Abbrechen</Button>
            <Button onClick={() => { if (!newTransaction.description || !newTransaction.revenueCents) return; createTransactionMutation.mutate(newTransaction); }} disabled={createTransactionMutation.isPending} data-testid="button-save-tx">
              {createTransactionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MeisterCommand {
  command: string;
  label: string;
  description: string;
  icon: string;
  fields: { name: string; label: string; type: string; options?: string[]; required: boolean }[];
}

interface OfferResult {
  type: "offer";
  subject?: string;
  greeting?: string;
  body?: string;
  services?: string[];
  priceBreakdown?: string;
  guarantee?: string;
  closing?: string;
  tips?: string[];
}

interface BattlecardResult {
  type: "battlecard";
  customerProfile?: string;
  objective?: string;
  openingLine?: string;
  keyArguments?: string[];
  objectionHandling?: { objection: string; response: string }[];
  upsellOpportunities?: string[];
  closingStrategy?: string;
  followUpPlan?: string;
}

interface PipelineResult {
  type: "pipeline";
  stats?: Record<string, number>;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: { priority: string; action: string; expectedImpact: string }[];
  kpis?: Record<string, string>;
  nextSteps?: string[];
}

type AIResult = OfferResult | BattlecardResult | PipelineResult;

function MeisterAITab() {
  const { toast } = useToast();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resultHistory, setResultHistory] = useState<AIResult[]>([]);

  const { data: commands = [] } = useQuery<MeisterCommand[]>({
    queryKey: ["/api/meister-ai/commands"],
  });

  const filteredCommands = commands.filter(c =>
    commandInput === "" || c.command.toLowerCase().includes(commandInput.toLowerCase()) || c.label.toLowerCase().includes(commandInput.toLowerCase())
  );

  const activeCommand = commands.find(c => c.command === selectedCommand);

  const handleSelectCommand = (cmd: string) => {
    setSelectedCommand(cmd);
    setCommandInput(cmd);
    setShowSuggestions(false);
    setFormData({});
    setAiResult(null);
  };

  const handleExecute = async () => {
    if (!selectedCommand) return;

    const cmd = commands.find(c => c.command === selectedCommand);
    if (!cmd) return;

    const missingRequired = cmd.fields.filter(f => f.required && !formData[f.name]);
    if (missingRequired.length > 0) {
      toast({ variant: "destructive", title: "Fehlende Pflichtfelder", description: `Bitte füllen Sie aus: ${missingRequired.map(f => f.label).join(", ")}` });
      return;
    }

    setIsProcessing(true);
    setAiResult(null);

    try {
      const endpoint = selectedCommand === "/sales:prepare-offer"
        ? "/api/meister-ai/sales/prepare-offer"
        : selectedCommand === "/sales:battlecard"
        ? "/api/meister-ai/sales/battlecard"
        : "/api/meister-ai/sales/pipeline";

      const payload = selectedCommand === "/sales:prepare-offer"
        ? { ...formData, estimatedAmount: parseFloat(formData.estimatedAmount) || 0 }
        : formData;

      const res = await apiRequest("POST", endpoint, payload);
      const data = await res.json();
      setAiResult(data);
      setResultHistory(prev => [data, ...prev].slice(0, 10));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fehler", description: error.message || "KI konnte die Anfrage nicht verarbeiten" });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert", description: "Text in die Zwischenablage kopiert" });
  };

  const getCommandIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText": return <FileText className="w-5 h-5" />;
      case "Target": return <Target className="w-5 h-5" />;
      case "TrendingUp": return <TrendingUp className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const renderOfferResult = (result: OfferResult) => (
    <div className="space-y-4">
      {result.subject && (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Betreff</p>
            <p className="font-semibold text-lg">{result.subject}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(result.subject || "")} data-testid="button-copy-subject"><Copy className="w-4 h-4" /></Button>
        </div>
      )}
      {result.greeting && <p className="text-muted-foreground italic">{result.greeting}</p>}
      {result.body && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Angebotstext</p>
            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(result.body || "")} data-testid="button-copy-body"><Copy className="w-4 h-4" /></Button>
          </div>
          <div className="bg-muted/30 rounded-md p-4 whitespace-pre-wrap text-sm">{result.body}</div>
        </div>
      )}
      {result.services && result.services.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Enthaltene Leistungen</p>
          <div className="space-y-1">
            {result.services.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.priceBreakdown && (
        <div className="bg-muted/30 rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-1">Preisaufschlüsselung</p>
          <p className="text-sm font-medium">{result.priceBreakdown}</p>
        </div>
      )}
      {result.guarantee && (
        <div className="flex items-start gap-2 text-sm">
          <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <span>{result.guarantee}</span>
        </div>
      )}
      {result.closing && <p className="text-sm font-medium border-t pt-3">{result.closing}</p>}
      {result.tips && result.tips.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Interne Verkaufstipps (nicht für den Kunden)</p>
          <div className="space-y-1">
            {result.tips.map((tip, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />{tip}
              </p>
            ))}
          </div>
        </div>
      )}
      <Button className="w-full" onClick={() => {
        const fullText = [result.subject, "", result.greeting, "", result.body, "", result.services?.map(s => `- ${s}`).join("\n"), "", result.priceBreakdown, "", result.guarantee, "", result.closing].filter(Boolean).join("\n");
        copyToClipboard(fullText);
      }} data-testid="button-copy-full-offer"><Copy className="w-4 h-4 mr-2" />Komplettes Angebot kopieren</Button>
    </div>
  );

  const renderBattlecardResult = (result: BattlecardResult) => (
    <div className="space-y-4">
      {result.customerProfile && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Kundenprofil</p>
          <p className="text-sm">{result.customerProfile}</p>
        </div>
      )}
      {result.objective && (
        <div className="bg-muted/30 rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Gesprächsziel</p>
          <p className="text-sm font-medium">{result.objective}</p>
        </div>
      )}
      {result.openingLine && (
        <div className="border-l-2 border-[#c00000] pl-3">
          <p className="text-xs text-muted-foreground mb-1">Empfohlener Einstieg</p>
          <p className="text-sm italic">"{result.openingLine}"</p>
          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.openingLine || "")} className="mt-1" data-testid="button-copy-opening"><Copy className="w-3 h-3 mr-1" />Kopieren</Button>
        </div>
      )}
      {result.keyArguments && result.keyArguments.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Hauptargumente</p>
          <div className="space-y-1">
            {result.keyArguments.map((arg, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{arg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.objectionHandling && result.objectionHandling.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> Einwandbehandlung</p>
          <div className="space-y-3">
            {result.objectionHandling.map((obj, i) => (
              <div key={i} className="bg-muted/20 rounded-md p-3">
                <p className="text-sm font-medium flex items-start gap-1"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> {obj.objection}</p>
                <p className="text-sm mt-1 pl-5 text-muted-foreground">{obj.response}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.upsellOpportunities && result.upsellOpportunities.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Upselling-Chancen</p>
          <div className="space-y-1">
            {result.upsellOpportunities.map((opp, i) => (
              <p key={i} className="text-sm flex items-start gap-1"><Euro className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {opp}</p>
            ))}
          </div>
        </div>
      )}
      {result.closingStrategy && (
        <div className="bg-muted/30 rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-1">Abschlussstrategie</p>
          <p className="text-sm">{result.closingStrategy}</p>
        </div>
      )}
      {result.followUpPlan && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Nachfass-Plan</p>
          <p className="text-sm">{result.followUpPlan}</p>
        </div>
      )}
    </div>
  );

  const renderPipelineResult = (result: PipelineResult) => (
    <div className="space-y-4">
      {result.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{result.stats.totalOffers || 0}</p>
            <p className="text-xs text-muted-foreground">Angebote</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{result.stats.conversionRate || 0}%</p>
            <p className="text-xs text-muted-foreground">Konversion</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{result.stats.totalClients || 0}</p>
            <p className="text-xs text-muted-foreground">Kunden</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{((result.stats.totalRevenueCents || 0) / 100).toLocaleString("de-DE")} &euro;</p>
            <p className="text-xs text-muted-foreground">Umsatz</p>
          </CardContent></Card>
        </div>
      )}
      {result.summary && (
        <div className="bg-muted/30 rounded-md p-4">
          <p className="text-sm">{result.summary}</p>
        </div>
      )}
      {result.kpis && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(result.kpis).map(([key, val]) => (
            <Badge key={key} variant={val === "gut" ? "default" : val === "kritisch" ? "destructive" : "secondary"}>
              {key}: {val}
            </Badge>
          ))}
        </div>
      )}
      {result.strengths && result.strengths.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Stärken</p>
          {result.strengths.map((s, i) => <p key={i} className="text-sm flex items-start gap-1 mb-1"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {s}</p>)}
        </div>
      )}
      {result.weaknesses && result.weaknesses.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Schwächen</p>
          {result.weaknesses.map((w, i) => <p key={i} className="text-sm flex items-start gap-1 mb-1"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> {w}</p>)}
        </div>
      )}
      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Empfehlungen</p>
          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="bg-muted/20 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={rec.priority === "hoch" ? "destructive" : rec.priority === "mittel" ? "default" : "secondary"} className="text-xs">{rec.priority}</Badge>
                </div>
                <p className="text-sm font-medium">{rec.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{rec.expectedImpact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.nextSteps && result.nextSteps.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground mb-2">Nächste Schritte</p>
          {result.nextSteps.map((step, i) => (
            <p key={i} className="text-sm flex items-start gap-1 mb-1"><ArrowRight className="w-4 h-4 text-[#c00000] mt-0.5 shrink-0" /> {step}</p>
          ))}
        </div>
      )}
    </div>
  );

  const renderResult = (result: AIResult) => {
    switch (result.type) {
      case "offer": return renderOfferResult(result);
      case "battlecard": return renderBattlecardResult(result);
      case "pipeline": return renderPipelineResult(result);
      default: return <p className="text-sm text-muted-foreground">Unbekanntes Ergebnis</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#c00000] to-[#ff4444] flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-meister-ai-title">Meister AI <Badge variant="secondary" className="text-xs">Sales</Badge></h2>
          <p className="text-sm text-muted-foreground">Ihr KI-Verkaufsassistent für professionelle Angebote und Kundengewinnung</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={commandInput}
                  onChange={e => { setCommandInput(e.target.value); setShowSuggestions(true); setSelectedCommand(null); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Befehl eingeben (z.B. /sales:prepare-offer) ..."
                  className="pl-10 font-mono text-sm"
                  data-testid="input-meister-command"
                />
              </div>
              {selectedCommand && (
                <Button onClick={handleExecute} disabled={isProcessing} data-testid="button-execute-command">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Ausführen
                </Button>
              )}
            </div>

            {showSuggestions && filteredCommands.length > 0 && !selectedCommand && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-md bg-popover shadow-lg">
                {filteredCommands.map(cmd => (
                  <button
                    key={cmd.command}
                    onClick={() => handleSelectCommand(cmd.command)}
                    className="w-full flex items-start gap-3 p-3 text-left hover-elevate transition-colors"
                    data-testid={`button-cmd-${cmd.command.replace(/[/:]/g, "-")}`}
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      {getCommandIcon(cmd.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium">{cmd.command}</p>
                      <p className="text-xs text-muted-foreground">{cmd.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {activeCommand && activeCommand.fields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {getCommandIcon(activeCommand.icon)}
              {activeCommand.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCommand.fields.map(field => (
              <div key={field.name}>
                <label className="text-sm font-medium">{field.label}{field.required && " *"}</label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={formData[field.name] || ""}
                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.label}
                    className="mt-1"
                    data-testid={`input-meister-${field.name}`}
                  />
                ) : field.type === "select" && field.options ? (
                  <Select value={formData[field.name] || ""} onValueChange={val => setFormData(prev => ({ ...prev, [field.name]: val }))}>
                    <SelectTrigger className="mt-1" data-testid={`select-meister-${field.name}`}>
                      <SelectValue placeholder={field.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={formData[field.name] || ""}
                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.label}
                    className="mt-1"
                    data-testid={`input-meister-${field.name}`}
                  />
                )}
              </div>
            ))}
            <Button onClick={handleExecute} disabled={isProcessing} className="w-full" data-testid="button-execute-form">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isProcessing ? "KI verarbeitet..." : "KI generieren"}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedCommand === "/sales:pipeline" && !aiResult && !isProcessing && (
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Klicken Sie "Ausführen" um Ihre Vertriebspipeline zu analysieren</p>
            <Button onClick={handleExecute} disabled={isProcessing} data-testid="button-run-pipeline">
              <TrendingUp className="w-4 h-4 mr-2" />Pipeline analysieren
            </Button>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#c00000] mb-3" />
            <p className="text-sm font-medium">Meister AI arbeitet...</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedCommand === "/sales:prepare-offer" && "Ihr professionelles Angebot wird erstellt"}
              {selectedCommand === "/sales:battlecard" && "Ihre Battlecard wird vorbereitet"}
              {selectedCommand === "/sales:pipeline" && "Ihre Pipeline wird analysiert"}
            </p>
          </CardContent>
        </Card>
      )}

      {aiResult && (
        <Card className="border-[#c00000]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c00000]" />
              {aiResult.type === "offer" && "Angebot generiert"}
              {aiResult.type === "battlecard" && "Battlecard erstellt"}
              {aiResult.type === "pipeline" && "Pipeline-Analyse"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderResult(aiResult)}
          </CardContent>
        </Card>
      )}

      {!selectedCommand && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Verfügbare Befehle</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {commands.map(cmd => (
              <Card key={cmd.command} className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => handleSelectCommand(cmd.command)} data-testid={`card-cmd-${cmd.command.replace(/[/:]/g, "-")}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#c00000] to-[#ff4444] flex items-center justify-center text-white">
                      {getCommandIcon(cmd.icon)}
                    </div>
                    <p className="font-mono text-sm font-medium">{cmd.command}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{cmd.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {resultHistory.length > 1 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Letzte Ergebnisse</h3>
          <div className="space-y-2">
            {resultHistory.slice(1).map((result, i) => (
              <Card key={i} className="cursor-pointer" onClick={() => setAiResult(result)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {result.type === "offer" ? "Angebot" : result.type === "battlecard" ? "Battlecard" : "Pipeline"}
                  </Badge>
                  <p className="text-sm text-muted-foreground truncate">
                    {result.type === "offer" ? (result as OfferResult).subject : result.type === "battlecard" ? (result as BattlecardResult).customerProfile : (result as PipelineResult).summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== UPLOAD CENTER TAB ==============
function UploadCenterTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [galleryOrder, setGalleryOrder] = useState<any | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [repairUploadsByOrder, setRepairUploadsByOrder] = useState<Record<string, File[]>>({});

  const { data: myOrders = [], isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ["/api/partner/my-orders"],
    queryFn: async () => {
      const res = await fetch("/api/partner/my-orders", { credentials: "include" });
      if (!res.ok) throw new Error("Meine Aufträge konnten nicht geladen werden");
      return res.json();
    },
  });

  const normalizedMyOrders = myOrders.map((order: any) => ({
    ...order,
    status: order.status === "fertig" ? "completed" : order.status === "in_progress" ? "in_progress" : order.status,
  }));

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/workshop-orders/${id}/partner-status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/my-orders"] });
      toast({ title: "Status aktualisiert" });
    },
    onError: () => toast({ title: "Fehler beim Aktualisieren", variant: "destructive" }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (selectedFiles.length === 0) throw new Error("Keine Dateien ausgewählt");

      setUploadProgress(10);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      const base64Files = await Promise.all(selectedFiles.map(f => {
        return new Promise<{ name: string; type: string; data: string; size: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || result;
            resolve({ name: f.name, type: f.type, data: base64, size: f.size });
          };
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      }));

      const res = await fetch("/api/upload-center/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: base64Files,
          customerName: customerName || undefined,
          damageDescription: damageDescription || undefined,
          vehiclePlate: vehiclePlate || undefined,
          vehicleMake: vehicleMake || undefined,
          vehicleModel: vehicleModel || undefined,
        }),
        credentials: "include",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Fehler beim Hochladen" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Auftrag erstellt", description: `Referenz: ${data.referenceNumber} - ${selectedFiles.length} Datei(en) hochgeladen` });
      setSelectedFiles([]);
      setCustomerName("");
      setDamageDescription("");
      setVehiclePlate("");
      setVehicleMake("");
      setVehicleModel("");
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/partner/my-orders"] });
    },
    onError: (err: Error) => {
      setUploadProgress(0);
      toast({ variant: "destructive", title: "Fehler", description: err.message });
    },
  });

  const uploadRepairPhotosMutation = useMutation({
    mutationFn: async ({ orderId, files }: { orderId: string; files: File[] }) => {
      if (!files.length) throw new Error("Keine Dateien ausgewählt");
      const base64Files = await Promise.all(files.map(f => {
        return new Promise<{ name: string; type: string; data: string; size: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || result;
            resolve({ name: f.name, type: f.type, data: base64, size: f.size });
          };
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      }));
      const res = await fetch(`/api/admin/workshop-orders/${orderId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ files: base64Files }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Fehler beim Hochladen" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      toast({ title: "Fotos hochgeladen", description: "Reparaturfotos wurden dem Auftrag hinzugefügt." });
      setRepairUploadsByOrder((prev) => ({ ...prev, [vars.orderId]: [] }));
      queryClient.invalidateQueries({ queryKey: ["/api/partner/my-orders"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: err.message });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-5 h-5 text-blue-500" />;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-heading" data-testid="text-upload-center-title">Upload Center</h2>
          <p className="text-muted-foreground text-sm">Laden Sie Dokumente, Fotos oder Gutachten hoch. Es wird automatisch ein Auftrag erstellt.</p>
        </div>
      </div>

      <Card data-testid="card-upload-dropzone">
        <CardContent className="p-6 space-y-6">
          <div
            className={`border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("upload-center-input")?.click()}
            data-testid="dropzone-upload"
          >
            <input
              id="upload-center-input"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.heic,.gif,.bmp,.tiff,.tif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z,.ppt,.pptx,.odt,.ods"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-upload-files"
            />
            <FolderUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Dateien hierher ziehen oder klicken</p>
            <p className="text-sm text-muted-foreground">Fotos, PDFs, Gutachten, ZIP-Archive (max. 100 MB/Datei, 40 Dateien)</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedFiles.length} Datei(en) ausgewählt</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded-md" data-testid={`selected-file-${i}`}>
                    {getFileIcon(file)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); removeFile(i); }} data-testid={`button-remove-file-${i}`}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kundenname (optional)</label>
              <Input placeholder="z.B. Max Mustermann" value={customerName} onChange={e => setCustomerName(e.target.value)} data-testid="input-customer-name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kennzeichen (optional)</label>
              <Input placeholder="z.B. DA-AB 1234" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} data-testid="input-vehicle-plate" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fahrzeug Marke (optional)</label>
              <Input placeholder="z.B. BMW" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} data-testid="input-vehicle-make" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fahrzeug Modell (optional)</label>
              <Input placeholder="z.B. 3er Touring" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} data-testid="input-vehicle-model" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Schadensbeschreibung (optional)</label>
            <Textarea placeholder="Beschreiben Sie den Schaden..." value={damageDescription} onChange={e => setDamageDescription(e.target.value)} data-testid="input-damage-description" />
          </div>

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Wird hochgeladen...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button
            className="w-full gap-2"
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            data-testid="button-submit-upload"
          >
            {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploadMutation.isPending ? "Wird hochgeladen..." : `Auftrag erstellen (${selectedFiles.length} Datei${selectedFiles.length !== 1 ? "en" : ""})`}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-bold mb-4" data-testid="text-my-orders-title">Meine Aufträge</h3>
        {loadingOrders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : myOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Noch keine Aufträge vorhanden.</p>
              <p className="text-sm">Laden Sie Dokumente hoch, um Ihren ersten Auftrag zu erstellen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {normalizedMyOrders.map((order: any) => {
              const attachments = (order.attachments as any[]) || [];
              const imageAttachments = attachments.filter((att: any) => att.mimeType?.startsWith("image/"));
              const visualStatus = order.status === "fertig" ? "completed" : order.status;
              const selectedRepairFiles = repairUploadsByOrder[order.id] || [];
              return (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs" data-testid={`badge-ref-${order.id}`}>{order.referenceNumber}</Badge>
                          <Badge variant={visualStatus === "open" ? "secondary" : visualStatus === "completed" ? "default" : "outline"} className={visualStatus === "completed" ? "bg-green-600 text-white hover:bg-green-600" : ""} data-testid={`badge-status-${order.id}`}>
                            {visualStatus === "open" ? "Job Accepted" : visualStatus === "in_progress" ? "In Progress" : visualStatus === "completed" ? "Job Completed" : visualStatus}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate" data-testid={`text-customer-${order.id}`}>{order.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.damageDescription}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(order.createdAt)}</p>
                    </div>
                    {(order.vehicleMake || order.vehiclePlate) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Car className="w-3 h-3" />
                        <span>{[order.vehicleMake, order.vehicleModel, order.vehiclePlate].filter(Boolean).join(" · ")}</span>
                      </div>
                    )}
                    {imageAttachments.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2"><Image className="w-3 h-3" /><span>{imageAttachments.length} Foto{imageAttachments.length !== 1 ? "s" : ""}</span></div>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => { setGalleryOrder(order); setGalleryIndex(0); }}>Galerie öffnen</Button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {imageAttachments.slice(0, 6).map((att: any, index: number) => (
                            <button key={att.id} type="button" className="shrink-0" onClick={() => { setGalleryOrder(order); setGalleryIndex(index); }}>
                              <img src={att.driveLink || att.url} alt={att.originalName || 'order image'} className="h-20 w-20 rounded-md object-cover border" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {attachments.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <File className="w-3 h-3" />
                        <span>{attachments.length} Dokument{attachments.length !== 1 ? "e" : ""}</span>
                        <div className="flex gap-1 flex-wrap">
                          {attachments.slice(0, 4).map((att: any) => (
                            <a key={att.id} href={att.driveLink || att.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs" data-testid={`link-att-${att.id}`}>
                              {att.originalName?.length > 15 ? att.originalName.substring(0, 15) + "..." : att.originalName}
                            </a>
                          ))}
                          {attachments.length > 4 && <span className="text-xs">+{attachments.length - 4} weitere</span>}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button size="sm" variant={visualStatus === "open" ? "default" : "outline"} onClick={() => updateStatusMutation.mutate({ id: order.id, status: "open" })}>Job Accepted</Button>
                      <Button size="sm" variant={visualStatus === "in_progress" ? "default" : "outline"} onClick={() => updateStatusMutation.mutate({ id: order.id, status: "in_progress" })}>In Progress</Button>
                      <Button size="sm" variant={visualStatus === "completed" ? "default" : "outline"} className={visualStatus === "completed" ? "bg-green-600 hover:bg-green-600 text-white" : ""} onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed" })}>Job Completed</Button>
                    </div>

                    <div className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium">Repaired Car Photos</p>
                        <input
                          id={`repair-upload-${order.id}`}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setRepairUploadsByOrder((prev) => ({ ...prev, [order.id]: files }));
                          }}
                        />
                        <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById(`repair-upload-${order.id}`)?.click()}>Select Photos</Button>
                      </div>
                      {selectedRepairFiles.length > 0 && (
                        <p className="text-xs text-muted-foreground">{selectedRepairFiles.length} Datei(en) ausgewählt</p>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={selectedRepairFiles.length === 0 || uploadRepairPhotosMutation.isPending}
                        onClick={() => uploadRepairPhotosMutation.mutate({ orderId: order.id, files: selectedRepairFiles })}
                      >
                        {uploadRepairPhotosMutation.isPending ? "Uploading..." : "Upload Repaired Photos"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!galleryOrder} onOpenChange={(open) => { if (!open) { setGalleryOrder(null); setGalleryIndex(0); } }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{galleryOrder?.referenceNumber || 'Auftrag Galerie'}</DialogTitle>
          </DialogHeader>
          {galleryOrder && (() => {
            const imageAttachments = ((galleryOrder.attachments as any[]) || []).filter((att: any) => att.mimeType?.startsWith("image/"));
            const current = imageAttachments[galleryIndex];
            return imageAttachments.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" onClick={() => setGalleryIndex((i) => Math.max(0, i - 1))} disabled={galleryIndex === 0}><ChevronLeft className="w-4 h-4 mr-1" />Prev</Button>
                  <span className="text-sm text-muted-foreground">{galleryIndex + 1} / {imageAttachments.length}</span>
                  <Button variant="outline" onClick={() => setGalleryIndex((i) => Math.min(imageAttachments.length - 1, i + 1))} disabled={galleryIndex >= imageAttachments.length - 1}>Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
                </div>
                <div className="rounded-lg border bg-black/60 p-2 flex items-center justify-center">
                  <img src={current?.driveLink || current?.url} alt={current?.originalName || 'gallery image'} className="max-h-[65vh] w-auto rounded-md object-contain" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageAttachments.map((att: any, index: number) => (
                    <button key={att.id} type="button" onClick={() => setGalleryIndex(index)} className={`shrink-0 rounded-md border ${index === galleryIndex ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}>
                      <img src={att.driveLink || att.url} alt={att.originalName || 'thumb'} className="h-16 w-16 rounded-md object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Keine Bilder vorhanden.</p>;
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}