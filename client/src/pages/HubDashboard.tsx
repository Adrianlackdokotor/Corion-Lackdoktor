import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Users,
  Plus,
  RefreshCw,
  ChevronRight,
  Settings,
  Calculator,
  BarChart2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  todayOrders: number;
  inProgressOrders: number;
  completedToday: number;
  estimatedRevenueToday: number;
}

interface Order {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  damageDescription: string;
  damageLocation: string;
  totalGrossCents: number;
  estimatedDays: number;
  createdAt: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  color: string;
  isActive: boolean;
}

const statusLabels: Record<string, string> = {
  pending_review: "Prufung",
  ready_for_estimate: "Bereit fur KV",
  offer_created: "Angebot erstellt",
  booked: "Gebucht",
  in_repair: "In Reparatur",
  qa_check: "QA-Prufung",
  completed: "Abgeschlossen",
  invoiced: "Berechnet",
  cancelled: "Storniert",
};

const statusColors: Record<string, string> = {
  pending_review: "bg-yellow-500",
  ready_for_estimate: "bg-indigo-500",
  offer_created: "bg-blue-500",
  booked: "bg-purple-500",
  in_repair: "bg-orange-500",
  qa_check: "bg-cyan-500",
  completed: "bg-green-500",
  invoiced: "bg-gray-500",
  cancelled: "bg-red-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-400",
  normal: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

export default function HubDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: dashboardData, isLoading, refetch } = useQuery<{
    stats: DashboardStats;
    recentOrders: Order[];
    resources: Resource[];
  }>({
    queryKey: ["/api/hub/dashboard"],
    enabled: isAuthenticated,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hub/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/dashboard"] });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    todayOrders: 0,
    inProgressOrders: 0,
    completedToday: 0,
    estimatedRevenueToday: 0,
  };

  const orders = dashboardData?.recentOrders || [];
  const resources = dashboardData?.resources || [];

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mission Control | Corion Hub"
        description="Dashboard fur das Corion Werkstatt-Management-System"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              Mission Control
            </h1>
            <p className="text-muted-foreground mt-1">
              Willkommen zuruck, {user?.firstName || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
            {orders.length === 0 && (
              <Button 
                size="sm" 
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                data-testid="button-seed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Demo-Daten erstellen
              </Button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="w-1 h-12 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Neue Auftrage heute</p>
                  <p className="text-3xl font-bold">{stats.todayOrders}</p>
                </div>
                <ClipboardList className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="w-1 h-12 rounded-full bg-orange-500" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">In Bearbeitung</p>
                  <p className="text-3xl font-bold">{stats.inProgressOrders}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="w-1 h-12 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Heute abgeschlossen</p>
                  <p className="text-3xl font-bold">{stats.completedToday}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="w-1 h-12 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Umsatz heute</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.estimatedRevenueToday)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Aktuelle Auftrage
                </CardTitle>
                <Button variant="ghost" size="sm" data-testid="link-all-orders">
                  Alle anzeigen
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Auftrage vorhanden</p>
                    <p className="text-sm mt-2">Klicken Sie auf "Demo-Daten erstellen" um zu beginnen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                        data-testid={`order-card-${order.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${priorityColors[order.priority] || priorityColors.normal}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{order.referenceNumber}</span>
                              <Badge 
                                variant="secondary" 
                                className={`${statusColors[order.status] || 'bg-gray-500'} text-white text-xs`}
                              >
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {order.damageLocation}: {order.damageDescription?.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {order.totalGrossCents ? (
                            <p className="font-bold">{formatCurrency(order.totalGrossCents)}</p>
                          ) : (
                            <p className="text-muted-foreground text-sm">Ausstehend</p>
                          )}
                          {order.estimatedDays && (
                            <p className="text-xs text-muted-foreground">{order.estimatedDays} Tage</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resources Panel */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Ressourcen
                </CardTitle>
                <Button variant="ghost" size="icon" data-testid="button-resource-settings">
                  <Settings className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {resources.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Keine Ressourcen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                        data-testid={`resource-${resource.id}`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: resource.color || '#6B7280' }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {resource.type === 'technician' ? 'Techniker' : 
                             resource.type === 'paint_booth' ? 'Lackierkabine' : 
                             resource.type}
                          </p>
                        </div>
                        <Badge variant={resource.isActive ? "default" : "secondary"}>
                          {resource.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Schnellaktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/hub/intake")}
                  data-testid="button-new-order"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Auftrag
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/hub/scheduler")}
                  data-testid="button-calendar"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Kalender offnen
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-vehicles">
                  <Car className="w-4 h-4 mr-2" />
                  Fahrzeuge verwalten
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/hub/calculator")}
                  data-testid="button-calculator"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Finanzrechner
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/hub/finance")}
                  data-testid="button-finance"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Finanzen Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
