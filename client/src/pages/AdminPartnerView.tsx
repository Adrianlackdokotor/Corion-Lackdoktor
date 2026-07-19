import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
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
import {
  ArrowLeft, Save, Loader2, Phone, Mail, Building, MapPin,
  Percent, Hash, User as UserIcon, Pencil, FileText, Euro,
  Users, Calendar, TrendingUp, Car, Clock, Check, X,
  Brain, Upload, FolderUp, Shield, ChevronDown, ChevronUp,
  Wrench, AlertCircle, CreditCard, Image, File
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import PartnerBreakEven from "@/components/PartnerBreakEven";

type SafeUser = Omit<UserType, "password">;

export default function AdminPartnerView() {
  const params = useParams<{ id: string }>();
  const partnerId = params.id;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profil");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", company: "",
    address: "", city: "", postalCode: "", taxNumber: "", partnerSharePercent: ""
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate("/admin");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const { data: partner, isLoading: partnerLoading } = useQuery<SafeUser>({
    queryKey: ["/api/admin/users", partnerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${partnerId}`);
      if (!res.ok) throw new Error("Failed to load partner");
      return res.json();
    },
    enabled: !!partnerId && isAuthenticated,
  });

  const { data: workshopOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/workshop-orders"],
    enabled: isAuthenticated,
  });

  const { data: allRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/requests"],
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${partnerId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Gespeichert", description: "Partnerdaten wurden aktualisiert." });
      setIsEditing(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fehler", description: "Daten konnten nicht gespeichert werden." });
    },
  });

  useEffect(() => {
    if (partner) {
      setEditForm({
        firstName: partner.firstName || "",
        lastName: partner.lastName || "",
        email: partner.email || "",
        phone: partner.phone || "",
        company: partner.company || "",
        address: partner.address || "",
        city: partner.city || "",
        postalCode: partner.postalCode || "",
        taxNumber: (partner as any).taxNumber || "",
        partnerSharePercent: (partner as any).partnerSharePercent != null ? String((partner as any).partnerSharePercent) : "",
      });
    }
  }, [partner]);

  const handleSave = () => {
    updateMutation.mutate({
      firstName: editForm.firstName || undefined,
      lastName: editForm.lastName || undefined,
      phone: editForm.phone || undefined,
      company: editForm.company || undefined,
      address: editForm.address || undefined,
      city: editForm.city || undefined,
      postalCode: editForm.postalCode || undefined,
      taxNumber: editForm.taxNumber || undefined,
      partnerSharePercent: editForm.partnerSharePercent ? parseInt(editForm.partnerSharePercent) : undefined,
    });
  };

  const partnerOrders = workshopOrders.filter((o: any) => o.partnerId === partnerId);
  const partnerRequests = allRequests.filter((r: any) => r.partnerId === partnerId);

  if (authLoading || partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Partner nicht gefunden</h2>
            <Button onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Partner: ${partner.firstName} ${partner.lastName} | Admin`} description="Partner Profil verwalten" />

      <div className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <span className="text-xl font-bold font-heading text-primary" data-testid="link-logo-home">+1 Corion</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary">
                <Shield className="w-3 h-3 mr-1" />Admin-Ansicht
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
                <ArrowLeft className="w-4 h-4 mr-2" />Zurück
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold" data-testid="text-partner-name">
                      {partner.firstName} {partner.lastName}
                    </h1>
                    <p className="text-muted-foreground" data-testid="text-partner-email">{partner.email}</p>
                    {partner.company && <p className="text-sm text-muted-foreground" data-testid="text-partner-company">{partner.company}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {partner.phone && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{partner.phone}
                        </span>
                      )}
                      {partner.address && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{partner.address}, {partner.postalCode} {partner.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(partner as any).partnerSharePercent != null && (
                    <Badge className="bg-blue-500/10 text-blue-500">{(partner as any).partnerSharePercent}% Anteil</Badge>
                  )}
                  {(partner as any).taxNumber && (
                    <Badge variant="outline">St.Nr.: {(partner as any).taxNumber}</Badge>
                  )}
                  <Badge className={partner.isApproved ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}>
                    {partner.isApproved ? "Aktiv" : "Wartend"}
                  </Badge>
                  <Button size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-partner">
                    <Pencil className="w-4 h-4 mr-2" />Bearbeiten
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap" data-testid="tabs-partner-view">
            <TabsTrigger value="profil" data-testid="tab-profil">Profil</TabsTrigger>
            <TabsTrigger value="auftraege" data-testid="tab-auftraege">Aufträge</TabsTrigger>
            <TabsTrigger value="anfragen" data-testid="tab-anfragen">Anfragen</TabsTrigger>
            <TabsTrigger value="breakeven" data-testid="tab-breakeven">Break-Even</TabsTrigger>
            <TabsTrigger value="statistiken" data-testid="tab-statistiken">Statistiken</TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <ProfileTab partner={partner} />
          </TabsContent>
          <TabsContent value="auftraege">
            <OrdersTab orders={partnerOrders} />
          </TabsContent>
          <TabsContent value="anfragen">
            <RequestsTab requests={partnerRequests} />
          </TabsContent>
          <TabsContent value="breakeven">
            {partnerId && partner && (
              <PartnerBreakEven
                partnerId={partnerId}
                partnerName={`${partner.firstName || ""} ${partner.lastName || ""} ${partner.company ? `(${partner.company})` : ""}`.trim()}
              />
            )}
          </TabsContent>
          <TabsContent value="statistiken">
            <StatsTab partner={partner} orders={partnerOrders} requests={partnerRequests} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Vorname</label>
              <Input value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} data-testid="input-edit-firstName" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Nachname</label>
              <Input value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} data-testid="input-edit-lastName" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">E-Mail</label>
              <Input value={editForm.email} disabled className="opacity-60" data-testid="input-edit-email" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Telefon</label>
              <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} data-testid="input-edit-phone" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Firma</label>
              <Input value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} data-testid="input-edit-company" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Adresse</label>
              <Input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} data-testid="input-edit-address" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">PLZ</label>
              <Input value={editForm.postalCode} onChange={e => setEditForm(p => ({ ...p, postalCode: e.target.value }))} data-testid="input-edit-postalCode" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Stadt</label>
              <Input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} data-testid="input-edit-city" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Steuernummer</label>
              <Input value={editForm.taxNumber} onChange={e => setEditForm(p => ({ ...p, taxNumber: e.target.value }))} data-testid="input-edit-taxNumber" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Partner Anteil (%)</label>
              <Input type="number" min="0" max="100" value={editForm.partnerSharePercent} onChange={e => setEditForm(p => ({ ...p, partnerSharePercent: e.target.value }))} data-testid="input-edit-partnerShare" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">Abbrechen</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-partner">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileTab({ partner }: { partner: SafeUser }) {
  const fields = [
    { label: "E-Mail", value: partner.email, icon: Mail },
    { label: "Telefon", value: partner.phone, icon: Phone },
    { label: "Firma", value: partner.company, icon: Building },
    { label: "Adresse", value: partner.address ? `${partner.address}, ${partner.postalCode} ${partner.city}` : null, icon: MapPin },
    { label: "Steuernummer", value: (partner as any).taxNumber, icon: Hash },
    { label: "Partner Anteil", value: (partner as any).partnerSharePercent != null ? `${(partner as any).partnerSharePercent}%` : null, icon: Percent },
    { label: "Rolle", value: partner.role, icon: Shield },
    { label: "Erstellt am", value: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString("de-DE") : null, icon: Calendar },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm" data-testid={`text-profile-${label.toLowerCase().replace(/\s/g, "-")}`}>
                {value || "Nicht angegeben"}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OrdersTab({ orders }: { orders: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderFiles, setOrderFiles] = useState<Record<string, any[]>>({});

  const fetchFiles = async (orderId: string) => {
    if (orderFiles[orderId]) return;
    try {
      const res = await fetch(`/api/admin/workshop-orders/${orderId}/files`);
      if (res.ok) {
        const files = await res.json();
        setOrderFiles(prev => ({ ...prev, [orderId]: files }));
      }
    } catch {}
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Aufträge</h3>
          <p className="text-muted-foreground">Diesem Partner sind noch keine Aufträge zugewiesen.</p>
        </CardContent>
      </Card>
    );
  }

  const statusMap: Record<string, string> = {
    new: "Neu", open: "Offen", in_progress: "In Bearbeitung", completed: "Abgeschlossen", cancelled: "Storniert"
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-500", open: "bg-blue-500/20 text-blue-500",
    in_progress: "bg-orange-500/20 text-orange-500",
    completed: "bg-green-500/20 text-green-500", cancelled: "bg-red-500/20 text-red-500"
  };

  const paymentStatusMap: Record<string, string> = {
    offen: "Offen", bezahlt: "Bezahlt", teil_bezahlt: "Teil bezahlt"
  };

  const paymentBadgeColors: Record<string, string> = {
    offen: "bg-yellow-500/20 text-yellow-500",
    bezahlt: "bg-green-500/20 text-green-500",
    teil_bezahlt: "bg-orange-500/20 text-orange-500",
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-3">
      {orders.map((order: any) => {
        const isExpanded = expandedId === order.id;
        const attachments = orderFiles[order.id] || [];
        const paymentStatus = (order as any).paymentStatus || "offen";

        return (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardContent className="p-4">
              <div
                className="flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                onClick={() => {
                  const next = isExpanded ? null : order.id;
                  setExpandedId(next);
                  if (!isExpanded) fetchFiles(order.id);
                }}
                data-testid={`button-toggle-order-${order.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.referenceNumber && (
                        <Badge variant="outline" className="font-mono text-xs">{order.referenceNumber}</Badge>
                      )}
                      <p className="font-semibold text-sm">
                        {order.vehicleMake} {order.vehicleModel} {order.vehiclePlate && `(${order.vehiclePlate})`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.customerName || "Unbekannt"}</p>
                    {order.damageDescription && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{order.damageDescription}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {order.totalAmountCents > 0 && (
                    <span className="text-sm font-bold">{(order.totalAmountCents / 100).toFixed(2)} €</span>
                  )}
                  <Badge className={statusColors[order.status] || "bg-muted"}>
                    {statusMap[order.status] || order.status}
                  </Badge>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 space-y-6 border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {(() => {
                        const firstPhoto = attachments.find((a: any) => a.mimeType?.startsWith("image/"));
                        if (!firstPhoto) return null;
                        return (
                          <div className="relative rounded-md overflow-hidden h-40 mb-2" data-testid={`order-hero-image-${order.id}`}>
                            <img src={`/api/admin/workshop-orders/files/${firstPhoto.id}`} alt="Schadensfoto" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-3 text-white text-xs font-medium">
                              {order.customerName} — {[order.vehicleMake, order.vehicleModel].filter(Boolean).join(" ")}
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Kundendaten</h4>
                        <div className="space-y-1 text-sm">
                          <p data-testid={`text-customer-name-${order.id}`}><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
                          {order.customerAddress && <p><span className="text-muted-foreground">Adresse:</span> {order.customerAddress}</p>}
                          {order.customerPhone && <p><span className="text-muted-foreground">Telefon:</span> {order.customerPhone}</p>}
                          {order.customerEmail && <p><span className="text-muted-foreground">E-Mail:</span> {order.customerEmail}</p>}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Wrench className="w-4 h-4" /> Fahrzeugdaten</h4>
                        <div className="space-y-1 text-sm">
                          {order.vehicleMake && <p><span className="text-muted-foreground">Marke:</span> {order.vehicleMake}</p>}
                          {order.vehicleModel && <p><span className="text-muted-foreground">Modell:</span> {order.vehicleModel}</p>}
                          {order.vehiclePlate && <p><span className="text-muted-foreground">Kennzeichen:</span> {order.vehiclePlate}</p>}
                          {order.vehicleVin && <p><span className="text-muted-foreground">FIN:</span> {order.vehicleVin}</p>}
                          {order.vehicleColor && <p><span className="text-muted-foreground">Farbe:</span> {order.vehicleColor}</p>}
                          {order.vehicleMileage && <p><span className="text-muted-foreground">km-Stand:</span> {order.vehicleMileage}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Schadensbeschreibung</h4>
                        <div className="space-y-1 text-sm">
                          <p data-testid={`text-damage-${order.id}`}>{order.damageDescription || "Keine Beschreibung"}</p>
                          {order.priorDamage && <p><span className="text-muted-foreground">Vorschäden:</span> {order.priorDamage}</p>}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Termine</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Auftragsdatum:</span> {new Date(order.orderDate).toLocaleDateString("de-DE")}</p>
                          {order.deliveryDate && <p><span className="text-muted-foreground">Abgabetermin:</span> {new Date(order.deliveryDate).toLocaleDateString("de-DE")}</p>}
                          {order.pickupDate && <p><span className="text-muted-foreground">Abholtermin:</span> {new Date(order.pickupDate).toLocaleDateString("de-DE")}</p>}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Finanzen</h4>
                        <div className="space-y-1 text-sm">
                          {order.totalAmountCents > 0 && <p><span className="text-muted-foreground">Betrag:</span> {(order.totalAmountCents / 100).toFixed(2)} €</p>}
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Zahlungsstatus:</span>
                            <Badge className={paymentBadgeColors[paymentStatus] || "bg-muted"}>
                              {paymentStatusMap[paymentStatus] || paymentStatus}
                            </Badge>
                          </p>
                          {(order as any).paidAmountCents > 0 && (
                            <p><span className="text-muted-foreground">Bezahlt:</span> {((order as any).paidAmountCents / 100).toFixed(2)} € ({(order as any).paymentMethod === "konto" ? "Konto" : "Bar"})</p>
                          )}
                          {order.customerSignature && <p><span className="text-muted-foreground">Unterschrift:</span> {order.customerSignature}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> Anhänge ({attachments.length})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {attachments.map((att: any) => {
                          const fileUrl = `/api/admin/workshop-orders/files/${att.id}`;
                          const isImage = att.mimeType?.startsWith("image/");
                          const isPdf = att.mimeType === "application/pdf" || att.originalName?.endsWith(".pdf");
                          return (
                            <div key={att.id} className="border rounded-md p-3 space-y-2" data-testid={`attachment-${att.id}`}>
                              {isImage ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                  <img src={fileUrl} alt={att.originalName} className="w-full h-32 object-cover rounded-md" />
                                </a>
                              ) : (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-32 bg-muted rounded-md">
                                  {isPdf ? <FileText className="w-10 h-10 text-red-500" /> : <File className="w-10 h-10 text-muted-foreground" />}
                                </a>
                              )}
                              <div>
                                <p className="text-xs font-medium truncate">{att.originalName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {att.size ? formatSize(att.size) : ""}
                                  {att.createdAt ? ` · ${new Date(att.createdAt).toLocaleDateString("de-DE")}` : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RequestsTab({ requests }: { requests: any[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Anfragen</h3>
          <p className="text-muted-foreground">Diesem Partner sind noch keine Anfragen zugewiesen.</p>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-500", quoted: "bg-blue-500/20 text-blue-500",
    accepted: "bg-purple-500/20 text-purple-500", in_progress: "bg-orange-500/20 text-orange-500",
    completed: "bg-green-500/20 text-green-500", cancelled: "bg-red-500/20 text-red-500"
  };

  return (
    <div className="space-y-3">
      {requests.map((req: any) => (
        <Card key={req.id} className="hover-elevate" data-testid={`card-request-${req.id}`}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{req.vehicleMake} {req.vehicleModel}</p>
                <p className="text-xs text-muted-foreground">{req.damageType}</p>
                {req.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{req.description}</p>}
              </div>
              <Badge className={statusColors[req.status] || "bg-muted"}>{req.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsTab({ partner, orders, requests }: { partner: SafeUser; orders: any[]; requests: any[] }) {
  const completedOrders = orders.filter((o: any) => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (o.totalAmountCents || 0), 0);
  const sharePercent = ((partner as any).partnerSharePercent ?? 80) / 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aufträge gesamt</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-orders">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abgeschlossen</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="stat-completed-orders">{completedOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-revenue">{(totalRevenue / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partner Anteil</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="stat-partner-share">
              {(totalRevenue * sharePercent / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anfragen Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-md bg-muted">
              <p className="text-2xl font-bold">{requests.length}</p>
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted">
              <p className="text-2xl font-bold text-yellow-500">{requests.filter((r: any) => r.status === "pending").length}</p>
              <p className="text-xs text-muted-foreground">Offen</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted">
              <p className="text-2xl font-bold text-orange-500">{requests.filter((r: any) => r.status === "in_progress").length}</p>
              <p className="text-xs text-muted-foreground">In Bearbeitung</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted">
              <p className="text-2xl font-bold text-green-500">{requests.filter((r: any) => r.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
