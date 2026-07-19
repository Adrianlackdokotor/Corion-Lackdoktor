import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Users,
  LayoutGrid,
  List,
  RefreshCw,
  Plus,
  GripVertical,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Resource {
  id: string;
  name: string;
  type: string;
  color: string;
  isActive: boolean;
}

interface Appointment {
  id: string;
  orderId: string;
  resourceId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface Order {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  damageDescription: string;
  damageLocation: string;
  assignedResourceId: string | null;
}

const DAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 - 17:00

export default function ResourceScheduler() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "day">("month");
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [dropTarget, setDropTarget] = useState<{ resourceId: string; hour: number } | null>(null);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/hub/resources"],
    enabled: isAuthenticated,
  });

  const { data: appointments = [], refetch: refetchAppointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/hub/appointments", { start: startOfMonth.toISOString(), end: endOfMonth.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/hub/appointments?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/hub/orders"],
    enabled: isAuthenticated,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: { orderId: string; resourceId: string; startTime: Date; endTime: Date; title: string }) => {
      const res = await apiRequest("POST", "/api/hub/appointments", {
        orderId: data.orderId,
        resourceId: data.resourceId,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        title: data.title,
        status: "scheduled",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/orders"] });
      toast({
        title: "Termin erstellt",
        description: "Der Auftrag wurde erfolgreich zugewiesen.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Termin konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const backlogOrders = useMemo(() => {
    return orders.filter(o => 
      !o.assignedResourceId && 
      ["pending_review", "ready_for_estimate", "offer_created", "booked"].includes(o.status)
    );
  }, [orders]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getAppointmentsForDayAndResource = (date: Date, resourceId: string) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.toDateString() === date.toDateString() && apt.resourceId === resourceId;
    });
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const navigateDay = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const selectDay = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, order: Order) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", order.id);
    setDraggedOrder(order);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedOrder(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, resourceId: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ resourceId, hour });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, resourceId: string, hour: number) => {
    e.preventDefault();
    
    if (!draggedOrder) return;

    const resource = resources.find(r => r.id === resourceId);
    const startTime = new Date(currentDate);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hour + 2); // Default 2 hour duration

    createAppointmentMutation.mutate({
      orderId: draggedOrder.id,
      resourceId,
      startTime,
      endTime,
      title: `${draggedOrder.referenceNumber} - ${draggedOrder.damageLocation || "Reparatur"}`,
    });

    setDraggedOrder(null);
    setDropTarget(null);
  }, [draggedOrder, currentDate, resources, createAppointmentMutation]);

  const handleDropOnDay = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    
    if (!draggedOrder || activeResources.length === 0) return;

    const defaultResource = activeResources[0];
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(11); // Default 2 hour duration

    createAppointmentMutation.mutate({
      orderId: draggedOrder.id,
      resourceId: defaultResource.id,
      startTime,
      endTime,
      title: `${draggedOrder.referenceNumber} - ${draggedOrder.damageLocation || "Reparatur"}`,
    });

    setDraggedOrder(null);
  }, [draggedOrder, createAppointmentMutation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const days = getDaysInMonth();
  const activeResources = resources.filter(r => r.isActive);
  const isLoading = resourcesLoading || appointmentsLoading || ordersLoading;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Ressourcen-Planer | Corion Hub"
        description="Werkstatt-Kalender und Ressourcenplanung"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
              <CalendarIcon className="w-7 h-7 text-primary" />
              Ressourcen-Planer
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {activeResources.length} aktive Ressourcen | Drag & Drop zum Zuweisen
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={view} onValueChange={(v) => setView(v as "month" | "day")}>
              <TabsList>
                <TabsTrigger value="month" className="gap-2" data-testid="tab-month">
                  <LayoutGrid className="w-4 h-4" />
                  Monat
                </TabsTrigger>
                <TabsTrigger value="day" className="gap-2" data-testid="tab-day">
                  <List className="w-4 h-4" />
                  Tag
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetchAppointments()}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => view === "month" ? navigateMonth(-1) : navigateDay(-1)}
                      data-testid="button-prev"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => view === "month" ? navigateMonth(1) : navigateDay(1)}
                      data-testid="button-next"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <CardTitle className="text-lg">
                    {view === "month" 
                      ? `${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                      : `${currentDate.getDate()}. ${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    }
                  </CardTitle>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    data-testid="button-today"
                  >
                    Heute
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {view === "month" ? (
                  /* Month View */
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS_DE.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((date, idx) => (
                        <div
                          key={idx}
                          className={`
                            min-h-24 p-1 rounded-lg border cursor-pointer transition-colors
                            ${date ? "hover-elevate" : "bg-muted/30"}
                            ${date && isToday(date) ? "border-primary border-2" : ""}
                            ${date && draggedOrder ? "ring-2 ring-primary/30 ring-dashed" : ""}
                          `}
                          onClick={() => date && selectDay(date)}
                          onDragOver={(e) => date && e.preventDefault()}
                          onDrop={(e) => date && handleDropOnDay(e, date)}
                          data-testid={date ? `day-${date.getDate()}` : undefined}
                        >
                          {date && (
                            <>
                              <div className={`text-sm font-medium mb-1 ${isToday(date) ? "text-primary" : ""}`}>
                                {date.getDate()}
                              </div>
                              <div className="space-y-0.5">
                                {getAppointmentsForDay(date).slice(0, 3).map(apt => {
                                  const resource = resources.find(r => r.id === apt.resourceId);
                                  return (
                                    <div
                                      key={apt.id}
                                      className="text-xs px-1 py-0.5 rounded truncate"
                                      style={{ 
                                        backgroundColor: resource?.color || '#6B7280',
                                        color: 'white'
                                      }}
                                    >
                                      {apt.title}
                                    </div>
                                  );
                                })}
                                {getAppointmentsForDay(date).length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{getAppointmentsForDay(date).length - 3} mehr
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Day View - Swimlane */
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Resource Headers */}
                      <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${activeResources.length}, 1fr)` }}>
                        <div className="p-2 font-medium text-sm text-muted-foreground">Zeit</div>
                        {activeResources.map(resource => (
                          <div 
                            key={resource.id}
                            className="p-2 text-center font-medium text-sm border-l"
                            style={{ borderLeftColor: resource.color, borderLeftWidth: 3 }}
                          >
                            {resource.name}
                          </div>
                        ))}
                      </div>
                      
                      {/* Time Slots */}
                      {HOURS.map(hour => (
                        <div 
                          key={hour}
                          className="grid gap-1 border-t"
                          style={{ gridTemplateColumns: `80px repeat(${activeResources.length}, 1fr)` }}
                        >
                          <div className="p-2 text-sm text-muted-foreground">
                            {hour}:00
                          </div>
                          {activeResources.map(resource => {
                            const dayAppointments = getAppointmentsForDayAndResource(currentDate, resource.id);
                            const hourAppointments = dayAppointments.filter(apt => {
                              const startHour = new Date(apt.startTime).getHours();
                              const endHour = new Date(apt.endTime).getHours();
                              return hour >= startHour && hour < endHour;
                            });
                            
                            const isDropTarget = dropTarget?.resourceId === resource.id && dropTarget?.hour === hour;
                            
                            return (
                              <div 
                                key={resource.id}
                                className={`
                                  min-h-12 p-1 border-l transition-colors
                                  ${isDropTarget ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted/50"}
                                  ${draggedOrder ? "cursor-copy" : ""}
                                `}
                                onDragOver={(e) => handleDragOver(e, resource.id, hour)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, resource.id, hour)}
                                data-testid={`slot-${resource.id}-${hour}`}
                              >
                                {hourAppointments.map(apt => (
                                  <div
                                    key={apt.id}
                                    className="text-xs p-1 rounded mb-1"
                                    style={{ 
                                      backgroundColor: resource.color + '20',
                                      borderLeft: `3px solid ${resource.color}`
                                    }}
                                  >
                                    {apt.title}
                                  </div>
                                ))}
                                {isDropTarget && draggedOrder && (
                                  <div className="text-xs p-1 rounded bg-primary/30 border-2 border-dashed border-primary">
                                    {draggedOrder.referenceNumber}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Backlog & Resources */}
          <div className="space-y-4">
            {/* Backlog */}
            <Card className={draggedOrder ? "ring-2 ring-primary/50" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Backlog
                  {backlogOrders.length > 0 && (
                    <Badge variant="secondary">{backlogOrders.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : backlogOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine unzugewiesenen Aufträge
                  </p>
                ) : (
                  <div className="space-y-2">
                    {backlogOrders.slice(0, 8).map(order => (
                      <div
                        key={order.id}
                        className={`
                          p-2 rounded-lg border text-sm cursor-grab active:cursor-grabbing
                          hover-elevate flex items-center gap-2
                          ${draggedOrder?.id === order.id ? "opacity-50 ring-2 ring-primary" : ""}
                        `}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        data-testid={`backlog-order-${order.id}`}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-xs">{order.referenceNumber}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {order.damageLocation || "Keine Angabe"}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {order.priority === "urgent" ? "Dringend" : order.priority === "high" ? "Hoch" : "Normal"}
                        </Badge>
                      </div>
                    ))}
                    {backlogOrders.length > 8 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{backlogOrders.length - 8} weitere
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Ressourcen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeResources.map(resource => (
                      <div 
                        key={resource.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: resource.color }}
                        />
                        <span>{resource.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {resource.type === "technician" ? "Techniker" : "Kabine"}
                        </Badge>
                      </div>
                    ))}
                    {activeResources.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Keine aktiven Ressourcen
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            {draggedOrder && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-primary">
                    Ziehen Sie den Auftrag auf einen Zeitslot im Kalender, um ihn zuzuweisen.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Button className="w-full" onClick={() => navigate("/hub/intake")} data-testid="button-new-appointment">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Auftrag
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
