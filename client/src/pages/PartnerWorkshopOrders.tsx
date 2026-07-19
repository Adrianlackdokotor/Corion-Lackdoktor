import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import {
  ArrowLeft, Car, Clock, Users, Wrench, AlertCircle, Calendar,
  CreditCard, FileText, File, Image, ChevronDown, ChevronUp,
  CheckCircle, Loader2, Play, CircleDot
} from "lucide-react";

const statusMap: Record<string, string> = {
  open: "Offen",
  angenommen: "Angenommen",
  in_bearbeitung: "In Bearbeitung",
  fertig: "Fertig",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-500",
  angenommen: "bg-purple-500/20 text-purple-500",
  in_bearbeitung: "bg-orange-500/20 text-orange-500",
  fertig: "bg-green-500/20 text-green-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

export default function PartnerWorkshopOrders() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderFiles, setOrderFiles] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "partner" && user?.role !== "admin"))) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const { data: orders = [], isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ["/api/admin/workshop-orders"],
    enabled: isAuthenticated,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/workshop-orders/${id}/partner-status`, { status });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      toast({
        title: "Status aktualisiert",
        description: `Auftrag wurde auf "${statusMap[variables.status]}" gesetzt.`,
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Fehler", description: error?.message || "Status konnte nicht aktualisiert werden." });
    },
  });

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

  if (isLoading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const paymentStatusMap: Record<string, string> = {
    offen: "Offen", bezahlt: "Bezahlt", teil_bezahlt: "Teil bezahlt"
  };
  const paymentBadgeColors: Record<string, string> = {
    offen: "bg-yellow-500/20 text-yellow-500",
    bezahlt: "bg-green-500/20 text-green-500",
    teil_bezahlt: "bg-orange-500/20 text-orange-500",
  };

  const statusSteps = ["open", "angenommen", "in_bearbeitung", "fertig"];

  const getNextStatus = (current: string) => {
    const idx = statusSteps.indexOf(current);
    if (idx >= 0 && idx < statusSteps.length - 1) return statusSteps[idx + 1];
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Werkstattaufträge | Partner" description="Zugewiesene Werkstattaufträge verwalten" />

      <div className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <span className="text-xl font-bold font-heading text-primary" data-testid="link-logo">+1 Corion</span>
              </a>
              <span className="text-muted-foreground">|</span>
              <h1 className="text-lg font-semibold" data-testid="text-page-title">Werkstattaufträge</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{orders.length} Aufträge</Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/partner")} data-testid="button-back-partner">
                <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Aufträge zugewiesen</h3>
              <p className="text-muted-foreground">Ihnen wurden noch keine Werkstattaufträge zugewiesen.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order: any) => {
            const isExpanded = expandedId === order.id;
            const attachments = orderFiles[order.id] || [];
            const paymentStatus = order.paymentStatus || "offen";
            const nextStatus = getNextStatus(order.status);

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
                      <div className="p-4 rounded-md bg-muted">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" /> Auftrags-Status
                        </h4>
                        <div className="flex flex-wrap items-center gap-1 mb-4">
                          {statusSteps.map((s, i) => {
                            const isActive = order.status === s;
                            const currentIdx = statusSteps.indexOf(order.status);
                            const isPast = i < currentIdx;
                            return (
                              <span key={s} className="flex items-center gap-1">
                                {i > 0 && <span className={`w-4 h-0.5 ${isPast || isActive ? "bg-primary" : "bg-muted-foreground/30"}`} />}
                                <Badge
                                  variant={isActive ? "default" : "outline"}
                                  className={isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-green-500/20 text-green-500 border-green-500/30" : "opacity-50"}
                                >
                                  {statusMap[s]}
                                </Badge>
                              </span>
                            );
                          })}
                        </div>
                        {nextStatus && (
                          <Button
                            onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: order.id, status: nextStatus }); }}
                            disabled={statusMutation.isPending}
                            className="gap-2"
                            data-testid={`button-next-status-${order.id}`}
                          >
                            {statusMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : nextStatus === "angenommen" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : nextStatus === "in_bearbeitung" ? (
                              <Play className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {nextStatus === "angenommen" && "Auftrag annehmen"}
                            {nextStatus === "in_bearbeitung" && "In Bearbeitung setzen"}
                            {nextStatus === "fertig" && "Als fertig markieren"}
                          </Button>
                        )}
                        {order.status === "fertig" && (
                          <p className="text-sm text-green-500 font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Auftrag abgeschlossen
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {(() => {
                            const firstPhoto = attachments.find((a: any) => a.mimeType?.startsWith("image/"));
                            if (!firstPhoto) return null;
                            return (
                              <div className="relative rounded-md overflow-hidden h-40 mb-2">
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
                              <p><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
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
                              <p>{order.damageDescription || "Keine Beschreibung"}</p>
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
          })
        )}
      </div>
    </div>
  );
}
