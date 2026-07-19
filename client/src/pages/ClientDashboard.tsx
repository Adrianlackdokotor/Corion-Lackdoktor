import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { 
  LogOut, 
  User, 
  Car, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  MessageSquare,
  Bell,
  FileText,
  Settings,
  Home,
  Calendar,
  Package,
  Euro,
  Upload,
  Image,
  File,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { RepairRequest, Notification } from "@shared/schema";

function fileToBase64(file: File): Promise<{ name: string; type: string; data: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve({ name: file.name, type: file.type, data: base64, size: file.size });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  quoted: "bg-blue-500/20 text-blue-500",
  accepted: "bg-purple-500/20 text-purple-500",
  in_progress: "bg-orange-500/20 text-orange-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Ausstehend",
  quoted: "Angebot erhalten",
  accepted: "Akzeptiert",
  in_progress: "In Bearbeitung",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const orderStatusColors: Record<string, string> = {
  open:           "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  angenommen:     "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  in_bearbeitung: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  in_progress:    "bg-orange-500/20 text-orange-500",
  fertig:         "bg-green-500/20 text-green-600 dark:text-green-400",
  completed:      "bg-green-500/20 text-green-500",
  cancelled:      "bg-red-500/20 text-red-500",
};

const orderStatusLabels: Record<string, string> = {
  open:           "Offen",
  angenommen:     "Angenommen",
  in_bearbeitung: "In Bearbeitung",
  in_progress:    "In Bearbeitung",
  fertig:         "Fertig",
  completed:      "Abgeschlossen",
  cancelled:      "Storniert",
};

const ORDER_STEPS = [
  { key: "open", label: "Offen" },
  { key: "angenommen", label: "Angenommen" },
  { key: "in_bearbeitung", label: "In Bearbeitung" },
  { key: "fertig", label: "Fertig" },
];

function OrderStatusTimeline({ status }: { status: string }) {
  const currentIdx = ORDER_STEPS.findIndex(s => s.key === status);
  if (currentIdx < 0) return null;
  return (
    <div className="flex items-center gap-0 mt-3 mb-1">
      {ORDER_STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              idx < currentIdx ? "bg-green-500 border-green-500 text-white" :
              idx === currentIdx ? "bg-primary border-primary text-primary-foreground" :
              "bg-background border-border text-muted-foreground"
            }`}>
              {idx < currentIdx ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${idx <= currentIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {idx < ORDER_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${idx < currentIdx ? "bg-green-500" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

const offerStatusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-500",
  sent: "bg-blue-500/20 text-blue-500",
  accepted: "bg-green-500/20 text-green-500",
  rejected: "bg-red-500/20 text-red-500",
};

const offerStatusLabels: Record<string, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
};

const appointmentStatusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-500",
  confirmed: "bg-green-500/20 text-green-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
  pending: "bg-yellow-500/20 text-yellow-500",
};

type WorkshopOrder = {
  id: number;
  referenceNumber: string;
  status: string;
  customerName: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  damageDescription: string;
  scheduledDate: string | null;
  totalAmountCents: number;
  createdAt: string;
};

type Offer = {
  id: number;
  offerNumber: string;
  status: string;
  totalGrossCents: number;
  repairDescription: string;
  estimatedDays: number;
  createdAt: string;
};

type Appointment = {
  id: number;
  title: string;
  scheduledDate: string;
  status: string;
  vehicleInfo: string;
  licensePlate: string;
};

export default function ClientDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderFiles, setOrderFiles] = useState<Record<string, any[]>>({});

  const { data: repairRequests = [], isLoading: loadingRequests } = useQuery<RepairRequest[]>({
    queryKey: ["/api/client/repair-requests"],
    enabled: isAuthenticated,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const { data: workshopOrders = [], isLoading: loadingOrders } = useQuery<WorkshopOrder[]>({
    queryKey: ["/api/client/my-orders"],
    enabled: isAuthenticated,
  });

  const { data: offers = [], isLoading: loadingOffers } = useQuery<Offer[]>({
    queryKey: ["/api/client/my-offers"],
    enabled: isAuthenticated,
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/client/my-appointments"],
    enabled: isAuthenticated,
  });

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const fetchOrderFiles = async (orderId: string) => {
    try {
      const res = await fetch(`/api/client/orders/${orderId}/files`, { credentials: "include" });
      if (res.ok) {
        const files = await res.json();
        setOrderFiles(prev => ({ ...prev, [orderId]: files }));
      }
    } catch {}
  };

  const uploadFileMutation = useMutation({
    mutationFn: async ({ id, files }: { id: string; files: FileList }) => {
      const base64Files = await Promise.all(Array.from(files).map(fileToBase64));
      const res = await fetch(`/api/client/orders/${id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: base64Files }),
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Upload fehlgeschlagen");
      }
      return { id, result: await res.json() };
    },
    onSuccess: (data) => {
      fetchOrderFiles(data.id);
      toast({ title: "Dateien hochgeladen" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Fehler", description: err.message || "Upload fehlgeschlagen." });
    },
  });

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  };

  if (isLoading || loadingRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activeRequests = repairRequests.filter(r => r.status !== "completed" && r.status !== "cancelled");
  const completedRequests = repairRequests.filter(r => r.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mein Dashboard | Corion Lackdoktor"
        description="Verwalten Sie Ihre Reparaturanfragen und verfolgen Sie den Status"
      />

      <div className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-heading text-primary" data-testid="text-title">
                  Mein Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Willkommen, <span className="font-medium">{user?.firstName || user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-settings">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2" data-testid="button-logout">
                <LogOut className="w-4 h-4" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover-elevate" data-testid="card-stat-active">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Anfragen</p>
                  <p className="text-3xl font-bold">{activeRequests.length}</p>
                </div>
                <Car className="w-10 h-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-completed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                  <p className="text-3xl font-bold">{completedRequests.length}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-pending">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ausstehend</p>
                  <p className="text-3xl font-bold">{repairRequests.filter(r => r.status === "pending").length}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-notifications">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Neue Nachrichten</p>
                  <p className="text-3xl font-bold">{unreadNotifications}</p>
                </div>
                <Bell className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Meine Reparaturanfragen</h2>
          <Link href="/client/new-request">
            <Button className="gap-2" data-testid="button-new-request">
              <Plus className="w-4 h-4" />
              Neue Anfrage
            </Button>
          </Link>
        </div>

        {repairRequests.length === 0 ? (
          <Card className="text-center py-12" data-testid="card-empty-state">
            <CardContent>
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Anfragen vorhanden</h3>
              <p className="text-muted-foreground mb-6">
                Erstellen Sie Ihre erste Reparaturanfrage, um zu beginnen.
              </p>
              <Link href="/client/new-request">
                <Button className="gap-2" data-testid="button-create-first">
                  <Plus className="w-4 h-4" />
                  Erste Anfrage erstellen
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {repairRequests.map((request) => (
              <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{request.title}</h3>
                        <Badge className={statusColors[request.status]}>
                          {statusLabels[request.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {request.vehicleMake && request.vehicleModel && (
                          <span className="flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {request.vehicleMake} {request.vehicleModel}
                          </span>
                        )}
                        {request.damageType && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {request.damageType}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(request.createdAt).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {request.estimatedCost && (
                        <p className="text-xl font-bold text-primary">
                          {(request.estimatedCost / 100).toFixed(2)} €
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/client/repairs/${request.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${request.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </Link>
                        <Link href={`/client/repairs/${request.id}/messages`}>
                          <Button variant="outline" size="sm" data-testid={`button-messages-${request.id}`}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Nachrichten
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12" data-testid="section-workshop-orders">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Meine Aufträge</h2>
          </div>
          {loadingOrders ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-orders">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workshopOrders.length === 0 ? (
            <Card data-testid="card-orders-empty">
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Keine Aufträge vorhanden</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workshopOrders.map((order) => (
                <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold" data-testid={`text-order-ref-${order.id}`}>
                      {order.referenceNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={orderStatusColors[order.status] || "bg-gray-500/20 text-gray-500"} data-testid={`badge-order-status-${order.id}`}>
                        {orderStatusLabels[order.status] || order.status}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const newId = expandedOrderId === String(order.id) ? null : String(order.id);
                          setExpandedOrderId(newId);
                          if (newId) fetchOrderFiles(String(order.id));
                        }}
                        data-testid={`button-expand-order-${order.id}`}
                      >
                        {expandedOrderId === String(order.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(order.vehicleMake || order.vehicleModel) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1" data-testid={`text-order-vehicle-${order.id}`}>
                        <Car className="w-4 h-4" />
                        <span>{order.vehicleMake} {order.vehicleModel}</span>
                        {order.vehiclePlate && <span className="ml-1">({order.vehiclePlate})</span>}
                      </div>
                    )}
                    {order.damageDescription && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-order-damage-${order.id}`}>
                        {order.damageDescription}
                      </p>
                    )}
                    <OrderStatusTimeline status={order.status} />
                    {order.scheduledDate && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2 mt-1" data-testid={`text-order-date-${order.id}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.scheduledDate).toLocaleDateString("de-DE")}</span>
                      </div>
                    )}
                    {order.totalAmountCents > 0 && (
                      <p className="text-lg font-bold text-primary" data-testid={`text-order-amount-${order.id}`}>
                        {(order.totalAmountCents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </p>
                    )}

                    {expandedOrderId === String(order.id) && (
                      <div className="mt-4 pt-4 border-t space-y-3" data-testid={`section-order-files-${order.id}`}>
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Anhänge & Fotos</span>
                        </div>

                        {(orderFiles[String(order.id)] || []).length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {(orderFiles[String(order.id)] || []).map((att: any) => {
                              const isImage = att.mimeType?.startsWith("image/");
                              return (
                                <div key={att.id} className="flex items-center gap-2 p-2 rounded border text-xs" data-testid={`file-item-${att.id}`}>
                                  {isImage ? (
                                    <a href={`/api/admin/workshop-orders/files/${att.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 flex-1">
                                      <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                      <span className="truncate">{att.originalName}</span>
                                    </a>
                                  ) : (
                                    <a href={`/api/admin/workshop-orders/files/${att.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 flex-1">
                                      <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{att.originalName}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <label className="inline-flex">
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,.heic,.gif,.bmp,.tiff,.tif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                uploadFileMutation.mutate({ id: String(order.id), files: e.target.files });
                                e.target.value = "";
                              }
                            }}
                            data-testid={`input-upload-client-${order.id}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={(e) => { (e.currentTarget.previousElementSibling as HTMLInputElement)?.click(); }}
                            disabled={uploadFileMutation.isPending}
                            data-testid={`button-upload-client-${order.id}`}
                          >
                            {uploadFileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploadFileMutation.isPending ? "Wird hochgeladen..." : "Dateien hochladen"}
                          </Button>
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12" data-testid="section-offers">
          <div className="flex items-center gap-3 mb-6">
            <Euro className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Erhaltene Angebote</h2>
          </div>
          {loadingOffers ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-offers">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : offers.length === 0 ? (
            <Card data-testid="card-offers-empty">
              <CardContent className="py-8 text-center">
                <Euro className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Keine Angebote vorhanden</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <Card key={offer.id} className="hover-elevate" data-testid={`card-offer-${offer.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold" data-testid={`text-offer-number-${offer.id}`}>
                      {offer.offerNumber}
                    </CardTitle>
                    <Badge className={offerStatusColors[offer.status] || "bg-gray-500/20 text-gray-500"} data-testid={`badge-offer-status-${offer.id}`}>
                      {offerStatusLabels[offer.status] || offer.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {offer.repairDescription && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-offer-description-${offer.id}`}>
                        {offer.repairDescription}
                      </p>
                    )}
                    {offer.estimatedDays > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2" data-testid={`text-offer-days-${offer.id}`}>
                        <Clock className="w-4 h-4" />
                        <span>{offer.estimatedDays} {offer.estimatedDays === 1 ? "Tag" : "Tage"} geschätzt</span>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-primary" data-testid={`text-offer-total-${offer.id}`}>
                      {(offer.totalGrossCents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    <p className="text-xs text-muted-foreground">Kundenpreis (brutto)</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 mb-8" data-testid="section-appointments">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Geplante Termine</h2>
          </div>
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-appointments">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <Card data-testid="card-appointments-empty">
              <CardContent className="py-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Keine geplanten Termine</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appointment) => {
                const date = new Date(appointment.scheduledDate);
                const dayName = date.toLocaleDateString("de-DE", { weekday: "short" });
                const dayNum = date.getDate();
                const month = date.toLocaleDateString("de-DE", { month: "short" });
                const time = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

                return (
                  <Card key={appointment.id} className="hover-elevate" data-testid={`card-appointment-${appointment.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-2 min-w-[60px]" data-testid={`text-appointment-date-${appointment.id}`}>
                          <span className="text-xs text-muted-foreground uppercase">{dayName}</span>
                          <span className="text-xl font-bold">{dayNum}</span>
                          <span className="text-xs text-muted-foreground">{month}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold truncate" data-testid={`text-appointment-title-${appointment.id}`}>
                              {appointment.title}
                            </h3>
                            <Badge className={appointmentStatusColors[appointment.status] || "bg-gray-500/20 text-gray-500"} data-testid={`badge-appointment-status-${appointment.id}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {time} Uhr
                            </span>
                            {appointment.vehicleInfo && (
                              <span className="flex items-center gap-1" data-testid={`text-appointment-vehicle-${appointment.id}`}>
                                <Car className="w-3 h-3" />
                                {appointment.vehicleInfo}
                              </span>
                            )}
                            {appointment.licensePlate && (
                              <span data-testid={`text-appointment-plate-${appointment.id}`}>
                                {appointment.licensePlate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
