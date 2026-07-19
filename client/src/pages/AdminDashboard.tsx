import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import FixicoCalendar from "@/components/FixicoCalendar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Menu, 
  X, 
  LogOut, 
  Users, 
  Wrench, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
  UserPlus,
  FileText,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Percent,
  Hash,
  BarChart3,
  Calendar,
  Plus,
  Trash2,
  Euro,
  ChevronDown,
  ChevronUp,
  Upload,
  Image,
  File,
  CreditCard,
  Banknote,
  Eye,
  Pencil,
  Search,
  ArrowLeft,
  History,
  User as UserIcon,
  ClipboardList,
  Copy,
  Sparkles,
  Loader2,
  ListTodo,
  FileDown,
  Zap,
  Package,
  FolderOpen,
  Bot,
  MessageSquare,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import DocumentsLibrary from "@/components/admin/DocumentsLibrary";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import type { RepairRequest, User as UserType, FranchiseWaitlist, DailyFinancialEntry, FixedCostItem, WorkshopOrder, BoardTask } from "@shared/schema";
import TaskBoard from "@/components/TaskBoard";
import HubTokensCounter from "@/components/dashboard/HubTokensCounter";
import AiAgentHubMenu from "@/components/dashboard/AiAgentHubMenu";
import { useCoriLauncherVisible, fireCoriOpen } from "@/lib/coriWidgetState";
import coriAvatarImg from '@assets/cori-floating-head-v2.png';
import OrderPipeline from "@/components/dashboard/OrderPipeline";
import OrderCrmModal from "@/components/dashboard/OrderCrmModal";
import { AdminMaterialsKpiPanel } from "@/components/materials/AdminMaterialsKpiPanel";
import { LayoutGrid, List as ListIcon } from "lucide-react";

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
  quoted: "Angebot erstellt",
  accepted: "Akzeptiert",
  in_progress: "In Bearbeitung",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  client: "Kunde",
  partner: "Partner",
};

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const showCoriLauncher = useCoriLauncherVisible();
  const now = new Date();
  const [finPartnerId, setFinPartnerId] = useState<string>("");
  const [finYear, setFinYear] = useState(now.getFullYear());
  const [finMonth, setFinMonth] = useState(now.getMonth() + 1);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ entryDate: "", cashAmount: "", invoiceGross: "", invoiceAccount: "", paymentStatus: "unpaid", variableCosts: "", description: "" });
  const [newFixedCost, setNewFixedCost] = useState({ name: "", amountCents: "" });
  const [showWorkshopForm, setShowWorkshopForm] = useState(false);
  const [wsForm, setWsForm] = useState({ orderDate: "", customerName: "", customerAddress: "", customerPhone: "", customerEmail: "", vehicleMake: "", vehicleModel: "", vehiclePlate: "", vehicleVin: "", vehicleColor: "", vehicleMileage: "", damageDescription: "", priorDamage: "", deliveryDate: "", pickupDate: "", totalAmountCents: "", laborAmountCents: "", partsAmountCents: "", partnerId: "", customerSignature: "" });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderFiles, setOrderFiles] = useState<Record<string, any[]>>({});
  const [paymentForm, setPaymentForm] = useState<{ paidAmountCents: string; paymentMethod: string }>({ paidAmountCents: "", paymentMethod: "bar" });
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState({ email: "", firstName: "", lastName: "", phone: "", company: "", address: "", city: "", postalCode: "", taxNumber: "", partnerSharePercent: "", preferredLanguage: "de", role: "client", newPassword: "" });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");
  const [activeTab, setActiveTab] = useState("auftraege");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderPartnerFilter, setOrderPartnerFilter] = useState<string>("all");
  const [orderDateFromFilter, setOrderDateFromFilter] = useState<string>("");
  const [orderOverdueOnly, setOrderOverdueOnly] = useState<boolean>(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [crmDialogOrder, setCrmDialogOrder] = useState<WorkshopOrder | null>(null);
  const [vehicleDialogOrder, setVehicleDialogOrder] = useState<WorkshopOrder | null>(null);
  const [showNewPartner, setShowNewPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "", company: "", address: "", city: "", postalCode: "", taxNumber: "", partnerSharePercent: "40", preferredLanguage: "de" });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: repairRequests = [], isLoading: loadingRequests } = useQuery<RepairRequest[]>({
    queryKey: ["/api/admin/repair-requests"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: franchiseWaitlist = [] } = useQuery<FranchiseWaitlist[]>({
    queryKey: ["/api/admin/franchise-waitlist"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: finEntries = [] } = useQuery<DailyFinancialEntry[]>({
    queryKey: ["/api/admin/finance/entries", { year: String(finYear), month: String(finMonth), partnerId: finPartnerId }],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(finYear), month: String(finMonth) });
      if (finPartnerId) params.set("partnerId", finPartnerId);
      const res = await fetch(`/api/admin/finance/entries?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: fixedCosts = [] } = useQuery<FixedCostItem[]>({
    queryKey: ["/api/admin/finance/fixed-costs", { partnerId: finPartnerId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (finPartnerId) params.set("partnerId", finPartnerId);
      const res = await fetch(`/api/admin/finance/fixed-costs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: boardTasks = [] } = useQuery<BoardTask[]>({
    queryKey: ["/api/admin/tasks"],
  });

  const { data: workshopOrders = [] } = useQuery<WorkshopOrder[]>({
    queryKey: ["/api/admin/workshop-orders"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: schedulerAppointments = [] } = useQuery<any[]>({
    queryKey: ["/api/scheduler/appointments", "admin-dashboard-month"],
    queryFn: async () => {
      const from = new Date(2026, 4, 1).toISOString();
      const to = new Date(2026, 4, 31, 23, 59, 59).toISOString();
      const res = await fetch(`/api/scheduler/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('failed appointments');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/finance/entries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/finance/entries") });
      setShowNewEntry(false);
      setNewEntry({ entryDate: "", cashAmount: "", invoiceGross: "", invoiceAccount: "", paymentStatus: "unpaid", variableCosts: "", description: "" });
      toast({ title: "Eintrag erstellt" });
    },
    onError: () => { toast({ variant: "destructive", title: "Fehler", description: "Eintrag konnte nicht erstellt werden." }); },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/finance/entries/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/finance/entries") }); toast({ title: "Eintrag gelöscht" }); },
    onError: () => { toast({ variant: "destructive", title: "Fehler" }); },
  });

  const createFixedCostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/finance/fixed-costs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/finance/fixed-costs") });
      setNewFixedCost({ name: "", amountCents: "" });
      toast({ title: "Fixkosten erstellt" });
    },
    onError: () => { toast({ variant: "destructive", title: "Fehler" }); },
  });

  const deleteFixedCostMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/finance/fixed-costs/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/finance/fixed-costs") }); toast({ title: "Fixkosten gelöscht" }); },
    onError: () => { toast({ variant: "destructive", title: "Fehler" }); },
  });

  const createWorkshopOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/intake", data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Auftrag konnte nicht erstellt werden.");
      }
      return res.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      setShowWorkshopForm(false);
      setWsForm({ orderDate: "", customerName: "", customerAddress: "", customerPhone: "", customerEmail: "", vehicleMake: "", vehicleModel: "", vehiclePlate: "", vehicleVin: "", vehicleColor: "", vehicleMileage: "", damageDescription: "", priorDamage: "", deliveryDate: "", pickupDate: "", totalAmountCents: "", laborAmountCents: "", partsAmountCents: "", partnerId: "", customerSignature: "" });
      const pending: string[] = result?.pendingSteps ?? [];
      toast({
        title: `Auftrag erstellt — ${result?.referenceNumber ?? ""}`,
        description: pending.length > 0
          ? `Noch offen: ${pending.join(", ")}`
          : "Alle Schritte erfolgreich abgeschlossen.",
      });
    },
    onError: (err: Error) => { toast({ variant: "destructive", title: "Fehler", description: err.message || "Auftrag konnte nicht erstellt werden." }); },
  });

  const deleteWorkshopOrderMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/workshop-orders/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] }); toast({ title: "Auftrag gelöscht" }); },
    onError: () => { toast({ variant: "destructive", title: "Fehler" }); },
  });

  const updateWorkshopOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/workshop-orders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      toast({ title: "Auftrag aktualisiert" });
    },
    onError: () => { toast({ variant: "destructive", title: "Fehler", description: "Auftrag konnte nicht aktualisiert werden." }); },
  });

  const fetchOrderFiles = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/workshop-orders/${orderId}/files`, { credentials: "include" });
      if (res.ok) {
        const files = await res.json();
        setOrderFiles(prev => ({ ...prev, [orderId]: files }));
      }
    } catch {}
  };

  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ id, files }: { id: string; files: FileList }) => {
      const base64Files = await Promise.all(Array.from(files).map(fileToBase64));
      const res = await fetch(`/api/admin/workshop-orders/${id}/attachments`, {
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
    onError: (err: Error) => { toast({ variant: "destructive", title: "Fehler", description: err.message || "Upload fehlgeschlagen." }); },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ orderId, attachmentId }: { orderId: string; attachmentId: string }) => {
      await apiRequest("DELETE", `/api/admin/workshop-orders/${orderId}/attachments/${attachmentId}`);
      return { orderId };
    },
    onSuccess: (data) => {
      fetchOrderFiles(data.orderId);
      toast({ title: "Anhang gelöscht" });
    },
    onError: () => { toast({ variant: "destructive", title: "Fehler" }); },
  });

  const [extractingFileId, setExtractingFileId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);

  const extractDocumentMutation = useMutation({
    mutationFn: async ({ orderId, fileId }: { orderId: string; fileId: string }) => {
      setExtractingFileId(fileId);
      const res = await apiRequest("POST", `/api/admin/workshop-orders/${orderId}/extract-document`, { fileId });
      return res.json();
    },
    onSuccess: (data) => {
      setExtractedData(data.extracted);
      setExtractingFileId(null);
      toast({ title: "Daten extrahiert", description: `Dokumenttyp: ${data.documentType}` });
    },
    onError: (err: Error) => {
      setExtractingFileId(null);
      toast({ variant: "destructive", title: "Fehler", description: err.message || "KI-Analyse fehlgeschlagen" });
    },
  });

  const applyExtractionMutation = useMutation({
    mutationFn: async ({ orderId, extracted }: { orderId: string; extracted: any }) => {
      const res = await apiRequest("POST", `/api/admin/workshop-orders/${orderId}/apply-extraction`, { extracted });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      setExtractedData(null);
      toast({ title: "Daten übernommen", description: `${data.appliedFields?.length || 0} Felder aktualisiert` });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Fehler", description: "Daten konnten nicht übernommen werden" });
    },
  });

  const openEditPartner = (u: UserType) => {
    setEditingUser(u);
    setEditForm({
      email: u.email || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      phone: u.phone || "",
      company: u.company || "",
      address: u.address || "",
      city: u.city || "",
      postalCode: u.postalCode || "",
      taxNumber: (u as any).taxNumber || "",
      partnerSharePercent: (u as any).partnerSharePercent != null ? String((u as any).partnerSharePercent) : "",
      preferredLanguage: (u as any).preferredLanguage || "de",
      role: u.role,
      newPassword: "",
    });
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({
        title: "Benutzer aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Änderungen konnten nicht gespeichert werden.",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteUserId(null);
      setDeleteUserName("");
      toast({ title: "Benutzer gelöscht", description: "Der Benutzer wurde erfolgreich entfernt." });
    },
    onError: (error: any) => {
      setDeleteUserId(null);
      const msg = error?.message || "";
      const description = msg.includes("verknüpfte Daten") ? "Benutzer kann nicht gelöscht werden, da noch verknüpfte Daten existieren." : "Der Benutzer konnte nicht gelöscht werden.";
      toast({ variant: "destructive", title: "Fehler", description });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Benutzer erstellt", description: "Das Konto wurde erfolgreich angelegt." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Fehler", description: error?.message || "Konto konnte nicht erstellt werden." });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
    if (!isLoading && isAuthenticated && user?.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Zugriff verweigert",
        description: "Sie haben keine Administrator-Berechtigung.",
      });
      navigate("/");
    }
  }, [isAuthenticated, isLoading, user, navigate, toast]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  };

  if (isLoading || loadingUsers || loadingRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const clients = allUsers.filter(u => u.role === "client");
  const partners = allUsers.filter(u => u.role === "partner");
  const pendingPartners = partners.filter(p => !p.isApproved);
  const activeRequests = repairRequests.filter(r => r.status !== "completed" && r.status !== "cancelled");
  const pendingRequests = repairRequests.filter(r => r.status === "pending");
  const activeOrders = workshopOrders.filter(o => o.status !== "fertig" && o.status !== "completed");

  const navItems = [
    { value: "workshop", label: "Workshop OS", icon: FileText, badge: activeOrders.length, testId: "tab-workshop", external: "/workshop" },
    { value: "auftraege", label: "Aufträge", icon: FileText, badge: activeOrders.length, testId: "tab-auftraege" },
    { value: "requests", label: "Anfragen", icon: Wrench, badge: pendingRequests.length, testId: "tab-requests" },
    { value: "tasks", label: "Tasks", icon: ListTodo, badge: boardTasks.filter(t => t.column !== "done").length, testId: "tab-tasks" },
    { value: "kalender", label: "Kalender", icon: Calendar, badge: 0, testId: "tab-kalender" },
    { value: "users", label: "Benutzer", icon: Users, badge: 0, testId: "tab-users" },
    { value: "partners", label: "Partner", icon: UserCheck, badge: pendingPartners.length, testId: "tab-partners" },
    { value: "finanzen", label: "Finance OS", icon: BarChart3, badge: 0, testId: "tab-finanzen", external: "/finanzen" },
    { value: "franchise", label: "Franchise", icon: TrendingUp, badge: 0, testId: "tab-franchise" },
    { value: "documents", label: "Dokumente", icon: FolderOpen, badge: 0, testId: "tab-documents" },
    { value: "agent-tasks", label: "Agent Tasks", icon: Bot, badge: 0, testId: "tab-agent-tasks", external: "/admin/agent-tasks" },
    { value: "agents", label: "Agent Activity", icon: Bot, badge: 0, testId: "tab-agents", external: "/admin/agents" },
    { value: "comms", label: "Koordination", icon: MessageSquare, badge: 0, testId: "tab-comms", external: "/admin/comms" },
  ];
  const currentNav = navItems.find(n => n.value === activeTab);

  return (
    <div className="min-h-screen bg-background flex">
      <SEO
        title="Admin Dashboard | Corion Lackdoktor"
        description="Corion Lackdoktor Administration - Benutzer, Anfragen und Analytics"
      />

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-card border-r border-border flex flex-col z-50 transition-all duration-300 ${isSidebarOpen ? "w-56" : "w-14"} overflow-hidden`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        {/* Brand area */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className={`min-w-0 transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}>
            <p className="text-sm font-bold truncate leading-tight" data-testid="text-title">Corion Hub</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Quick KPIs */}
        <div className={`px-3 py-3 border-b border-border grid grid-cols-3 gap-1.5 transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
          {[
            { label: "Auftr.", value: activeOrders.length, color: "text-primary" },
            { label: "Anfr.", value: pendingRequests.length, color: "text-orange-500" },
            { label: "Tasks", value: boardTasks.filter(t => t.column !== "done").length, color: "text-blue-400" },
          ].map(k => (
            <div key={k.label} className="bg-muted/50 rounded-md p-1.5 text-center">
              <p className={`text-lg font-bold leading-tight ${k.color}`}>{k.value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.value}
              onClick={() => (item as any).external ? navigate((item as any).external) : setActiveTab(item.value)}
              data-testid={item.testId}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                activeTab === item.value
                  ? "bg-primary text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className={`flex-1 truncate transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}>{item.label}</span>
              {item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${activeTab === item.value ? "bg-white/20 text-white" : "bg-primary/15 text-primary"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-border space-y-0.5">
          <Link href="/repair-order">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-repair-protocol-sidebar">
              <FileDown className="w-4 h-4" />
              <span className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>Reparaturprotokoll</span>
            </button>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            <span className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <div className="flex-1 ml-14 min-h-screen flex flex-col transition-all duration-300">

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              {currentNav && <currentNav.icon className="w-4 h-4 text-primary" />}
              {currentNav?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground">Admin · Corion Lackdoktor</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stat pills in topbar */}
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={() => setActiveTab("auftraege")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeTab==="auftraege"?"bg-primary text-white border-primary":"border-border text-muted-foreground hover:border-primary/50"}`} data-testid="card-stat-orders">
                <FileText className="w-3 h-3" />
                {activeOrders.length} Aufträge
              </button>
              <button onClick={() => setActiveTab("requests")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeTab==="requests"?"bg-orange-500 text-white border-orange-500":"border-border text-muted-foreground hover:border-orange-500/50"}`} data-testid="card-stat-requests">
                <Wrench className="w-3 h-3" />
                {pendingRequests.length} Anfragen
              </button>
            </div>
            {/* AI Agent Hub + Hub+1 Tokens (premium SaaS chrome) */}
            <AiAgentHubMenu />
            <HubTokensCounter />
            {showCoriLauncher && (
              <button
                type="button"
                onClick={fireCoriOpen}
                className="hidden sm:flex items-center gap-2 rounded-full border border-primary/30 bg-card pl-0.5 pr-3 py-0.5 hover:bg-muted transition-colors shadow-sm"
                aria-label="CORI öffnen"
              >
                <img src={coriAvatarImg} alt="CORI" className="h-7 w-7 rounded-full object-contain" />
                <span className="hidden lg:inline text-xs font-semibold text-primary">CORI</span>
              </button>
            )}
          </div>
        </div>

        {/* Stat cards row (only on Aufträge tab) */}
        {activeTab === "auftraege" && (
          <div className="px-6 pt-5 pb-0">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
              {[
                {
                  label: "Aktive Aufträge",
                  value: workshopOrders.filter(o => o.status !== "fertig" && o.status !== "completed" && o.status !== "cancelled").length,
                  sub: `${workshopOrders.filter(o => !o.partnerId).length} ohne Partner`,
                  icon: FileText, accent: "border-primary/40 bg-primary/5", iconColor: "text-primary",
                  onClick: () => setActiveTab("auftraege"), testId: "text-active-orders-count",
                },
                {
                  label: "Aktive Anfragen", value: activeRequests.length,
                  sub: `${pendingRequests.length} unbearbeitet`,
                  icon: Wrench, accent: "border-orange-500/40 bg-orange-500/5", iconColor: "text-orange-500",
                  onClick: () => setActiveTab("requests"), testId: "text-active-requests-count",
                },
                {
                  label: "Kalender OS View",
                  value: workshopOrders.filter(o => o.status === "open" || o.status === "in_bearbeitung").length,
                  sub: "Manager-Ansicht · nur Übersicht",
                  icon: Calendar, accent: "border-green-500/40 bg-green-500/5", iconColor: "text-green-500",
                  onClick: () => navigate("/admin/calendar?mode=os"), testId: "text-calendar-count",
                },
                {
                  label: "Tasks", value: boardTasks.filter(t => t.column !== "done").length,
                  sub: `${boardTasks.filter(t => t.column === "in_progress").length} in Bearbeitung · ${boardTasks.filter(t => t.column === "review").length} Review`,
                  icon: ListTodo, accent: "border-blue-500/40 bg-blue-500/5", iconColor: "text-blue-400",
                  onClick: () => setActiveTab("tasks"), testId: "text-tasks-count",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  onClick={card.onClick}
                  className={`border rounded-lg p-4 cursor-pointer hover-elevate transition-all ${card.accent}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{card.label}</p>
                      <p className="text-3xl font-bold leading-none" data-testid={card.testId}>{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
                    </div>
                    <card.icon className={`w-8 h-8 ${card.iconColor} opacity-70 flex-shrink-0 mt-0.5`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pb-8 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* No TabsList — navigation is in the sidebar */}

          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Reparaturanfragen</h2>
              <Badge variant="outline">{repairRequests.length} gesamt</Badge>
            </div>
            
            {repairRequests.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Anfragen</h3>
                  <p className="text-muted-foreground">Es gibt noch keine Reparaturanfragen.</p>
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
                            <h3 className="font-semibold">{request.title}</h3>
                            <Badge className={statusColors[request.status]}>
                              {statusLabels[request.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {request.vehicleMake && (
                              <span>{request.vehicleMake} {request.vehicleModel}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(request.createdAt).toLocaleDateString("de-DE")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {request.estimatedCost && (
                            <p className="text-lg font-bold">{(request.estimatedCost / 100).toFixed(2)} €</p>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-${request.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            {!request.partnerId && request.status === "pending" && (
                              <Button size="sm" data-testid={`button-assign-${request.id}`}>
                                Partner zuweisen
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Alle Benutzer</h2>
              <Badge variant="outline">{allUsers.length} gesamt</Badge>
            </div>

            <CreateUserForm onSubmit={(data: any) => createUserMutation.mutate(data)} isPending={createUserMutation.isPending} />
            
            {selectedUserId && (() => {
              const selectedUser = allUsers.find(u => u.id === selectedUserId);
              if (!selectedUser) return null;
              const userOrders = workshopOrders.filter(o =>
                o.partnerId === selectedUserId ||
                o.customerEmail === selectedUser.email
              );
              const userRequests = repairRequests.filter(r =>
                r.clientId === selectedUserId || r.partnerId === selectedUserId
              );
              const allActivity: { type: string; date: Date; data: any }[] = [
                ...userOrders.map(o => ({ type: "order" as const, date: new Date(o.orderDate), data: o })),
                ...userRequests.map(r => ({ type: "request" as const, date: new Date(r.createdAt), data: r })),
              ].sort((a, b) => b.date.getTime() - a.date.getTime());

              return (
                <Card className="mb-6" data-testid="panel-user-detail">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedUserId(null)} data-testid="button-close-user-detail">
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {selectedUser.profileImageUrl ? (
                            <img src={selectedUser.profileImageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {selectedUser.firstName} {selectedUser.lastName}
                            <Badge variant="outline">{roleLabels[selectedUser.role] || selectedUser.role}</Badge>
                            <Badge className={selectedUser.isApproved ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}>
                              {selectedUser.isApproved ? "Genehmigt" : "Wartend"}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-3 mt-1">
                            {selectedUser.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedUser.email}</span>}
                            {selectedUser.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedUser.phone}</span>}
                            {selectedUser.company && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{selectedUser.company}</span>}
                            {selectedUser.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedUser.address}, {selectedUser.postalCode} {selectedUser.city}</span>}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Aktivitätslog ({allActivity.length} Einträge)
                    </h4>
                    {allActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Keine Aktivitäten für diesen Benutzer</p>
                    ) : (
                      <div className="space-y-3">
                        {allActivity.map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-3 rounded-md bg-muted/50" data-testid={`activity-${idx}`}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: activity.type === "order" ? "rgba(59,130,246,0.1)" : "rgba(249,115,22,0.1)" }}>
                              {activity.type === "order" ? <ClipboardList className="w-4 h-4 text-blue-500" /> : <Wrench className="w-4 h-4 text-orange-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs text-muted-foreground">{activity.date.toLocaleDateString("de-DE")} {activity.date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                                {activity.type === "order" ? (
                                  <>
                                    <Badge variant="outline" className="text-xs">Auftrag</Badge>
                                    {activity.data.referenceNumber && (
                                      <Badge variant="outline" className="font-mono text-xs">{activity.data.referenceNumber}</Badge>
                                    )}
                                    <Badge className={activity.data.status === "completed" ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"}>
                                      {activity.data.status === "completed" ? "Abgeschlossen" : activity.data.status === "open" ? "Offen" : activity.data.status}
                                    </Badge>
                                  </>
                                ) : (
                                  <>
                                    <Badge variant="outline" className="text-xs">Anfrage</Badge>
                                    <Badge className={statusColors[activity.data.status]}>
                                      {statusLabels[activity.data.status]}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <p className="text-sm font-medium">
                                {activity.type === "order"
                                  ? `${activity.data.customerName} - ${activity.data.vehicleMake || ""} ${activity.data.vehicleModel || ""}`
                                  : activity.data.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {activity.type === "order" ? activity.data.damageDescription : activity.data.description}
                              </p>
                              {activity.type === "order" && activity.data.totalAmountCents > 0 && (
                                <p className="text-sm font-semibold mt-1">{(activity.data.totalAmountCents / 100).toFixed(2)} €</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            <div className="space-y-4">
              {allUsers.map((u) => (
                <Card key={u.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedUserId(u.id)} data-testid={`card-user-${u.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {u.profileImageUrl ? (
                            <img src={u.profileImageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold" data-testid={`text-user-name-${u.id}`}>{u.firstName} {u.lastName}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                          {u.company && <p className="text-xs text-muted-foreground">{u.company}</p>}
                          {(u as any).taxNumber && <p className="text-xs text-muted-foreground">St.Nr.: {(u as any).taxNumber}</p>}
                          {(u as any).partnerSharePercent != null && <p className="text-xs text-muted-foreground">Anteil: {(u as any).partnerSharePercent}%</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge className={u.isApproved ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}>
                          {u.isApproved ? "Genehmigt" : "Wartend"}
                        </Badge>
                        <Badge variant="outline">{roleLabels[u.role] || u.role}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUser(u);
                            setEditForm({
                              email: u.email || "",
                              firstName: u.firstName || "",
                              lastName: u.lastName || "",
                              phone: u.phone || "",
                              company: u.company || "",
                              address: u.address || "",
                              city: u.city || "",
                              postalCode: u.postalCode || "",
                              taxNumber: (u as any).taxNumber || "",
                              partnerSharePercent: (u as any).partnerSharePercent != null ? String((u as any).partnerSharePercent) : "",
                              preferredLanguage: (u as any).preferredLanguage || "de",
                              role: u.role,
                              newPassword: "",
                            });
                          }}
                          data-testid={`button-edit-user-${u.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteUserId(u.id);
                            setDeleteUserName(`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "");
                          }}
                          data-testid={`button-delete-user-${u.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) { setEditingUser(null); setConfirmEditOpen(false); } }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-user">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-primary" /> Benutzer bearbeiten</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">E-Mail</label>
                    <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} data-testid="input-edit-email" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Rolle</label>
                    <Select value={editForm.role} onValueChange={v => setEditForm(p => ({ ...p, role: v }))}>
                      <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Kunde</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Vorname</label>
                    <Input value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} data-testid="input-edit-firstname" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Nachname</label>
                    <Input value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} data-testid="input-edit-lastname" />
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
                    <label className="text-xs font-medium mb-1 block">Stadt</label>
                    <Input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} data-testid="input-edit-city" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">PLZ</label>
                    <Input value={editForm.postalCode} onChange={e => setEditForm(p => ({ ...p, postalCode: e.target.value }))} data-testid="input-edit-plz" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Steuernummer</label>
                    <Input value={editForm.taxNumber} onChange={e => setEditForm(p => ({ ...p, taxNumber: e.target.value }))} data-testid="input-edit-taxnumber" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Anteil %</label>
                    <Input type="number" min="0" max="100" value={editForm.partnerSharePercent} onChange={e => setEditForm(p => ({ ...p, partnerSharePercent: e.target.value }))} data-testid="input-edit-share" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Sprache</label>
                    <Select value={editForm.preferredLanguage} onValueChange={v => setEditForm(p => ({ ...p, preferredLanguage: v }))}>
                      <SelectTrigger data-testid="select-edit-language"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ro">Română</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="el">Ελληνικά</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium mb-1 block">Neues Passwort <span className="text-zinc-500 font-normal">(leer lassen = unverändert)</span></label>
                    <Input type="password" value={editForm.newPassword} onChange={e => setEditForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Neues Passwort setzen..." data-testid="input-edit-password" />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)} data-testid="button-cancel-edit">Abbrechen</Button>
                  <Button onClick={() => setConfirmEditOpen(true)} className="gap-2" data-testid="button-save-edit">
                    <Save className="w-4 h-4" />
                    Änderungen speichern
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={confirmEditOpen} onOpenChange={setConfirmEditOpen}>
              <AlertDialogContent data-testid="dialog-confirm-edit">
                <AlertDialogHeader>
                  <AlertDialogTitle>Änderungen speichern?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sind Sie sicher, dass Sie die Änderungen an diesem Benutzer speichern möchten?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-confirm-edit">Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (editingUser) {
                        const { newPassword, ...formRest } = editForm;
                        updateUserMutation.mutate({
                          id: editingUser.id,
                          ...formRest,
                          ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
                          partnerSharePercent: editForm.partnerSharePercent ? parseInt(editForm.partnerSharePercent) : null,
                          preferredLanguage: editForm.preferredLanguage || "de",
                        });
                      }
                      setConfirmEditOpen(false);
                    }}
                    data-testid="button-confirm-edit"
                  >
                    Ja, speichern
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteUserId} onOpenChange={(open) => { if (!open) setDeleteUserId(null); }}>
              <AlertDialogContent data-testid="dialog-confirm-delete">
                <AlertDialogHeader>
                  <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sind Sie sicher, dass Sie den Benutzer <strong>{deleteUserName}</strong> löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { if (deleteUserId) deleteUserMutation.mutate(deleteUserId); }}
                    className="bg-destructive text-destructive-foreground"
                    data-testid="button-confirm-delete"
                  >
                    Ja, löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="partners" className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold">Partner verwalten</h2>
                <Badge variant="outline">{partners.length} Partner</Badge>
              </div>
              <Button onClick={() => setShowNewPartner(true)} data-testid="button-new-partner">
                <Plus className="w-4 h-4 mr-2" /> Neuer Partner
              </Button>
            </div>

            <Dialog open={showNewPartner} onOpenChange={setShowNewPartner}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Neuer Partner</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Vorname</Label>
                    <Input value={newPartner.firstName} onChange={(e) => setNewPartner({ ...newPartner, firstName: e.target.value })} data-testid="input-partner-firstname" />
                  </div>
                  <div>
                    <Label>Nachname</Label>
                    <Input value={newPartner.lastName} onChange={(e) => setNewPartner({ ...newPartner, lastName: e.target.value })} data-testid="input-partner-lastname" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>E-Mail *</Label>
                    <Input type="email" value={newPartner.email} onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })} data-testid="input-partner-email" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Passwort *</Label>
                    <Input type="text" value={newPartner.password} onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })} placeholder="Min. 6 Zeichen" data-testid="input-partner-password" />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input value={newPartner.phone} onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })} data-testid="input-partner-phone" />
                  </div>
                  <div>
                    <Label>Firma</Label>
                    <Input value={newPartner.company} onChange={(e) => setNewPartner({ ...newPartner, company: e.target.value })} data-testid="input-partner-company" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adresse</Label>
                    <Input value={newPartner.address} onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })} data-testid="input-partner-address" />
                  </div>
                  <div>
                    <Label>PLZ</Label>
                    <Input value={newPartner.postalCode} onChange={(e) => setNewPartner({ ...newPartner, postalCode: e.target.value })} data-testid="input-partner-postal" />
                  </div>
                  <div>
                    <Label>Stadt</Label>
                    <Input value={newPartner.city} onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })} data-testid="input-partner-city" />
                  </div>
                  <div>
                    <Label>Steuernummer</Label>
                    <Input value={newPartner.taxNumber} onChange={(e) => setNewPartner({ ...newPartner, taxNumber: e.target.value })} data-testid="input-partner-tax" />
                  </div>
                  <div>
                    <Label>Anteil %</Label>
                    <Input type="number" value={newPartner.partnerSharePercent} onChange={(e) => setNewPartner({ ...newPartner, partnerSharePercent: e.target.value })} data-testid="input-partner-share" />
                  </div>
                  <div>
                    <Label>Sprache</Label>
                    <Select value={newPartner.preferredLanguage} onValueChange={(value) => setNewPartner({ ...newPartner, preferredLanguage: value })}>
                      <SelectTrigger data-testid="select-partner-language">
                        <SelectValue placeholder="Sprache wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ro">Română</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="el">Ελληνικά</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewPartner(false)}>Abbrechen</Button>
                  <Button
                    onClick={async () => {
                      if (!newPartner.email || !newPartner.password) {
                        toast({ title: "Fehler", description: "E-Mail und Passwort sind Pflicht", variant: "destructive" });
                        return;
                      }
                      try {
                        const payload = {
                          email: newPartner.email,
                          password: newPartner.password,
                          role: "partner",
                          firstName: newPartner.firstName || null,
                          lastName: newPartner.lastName || null,
                          phone: newPartner.phone || null,
                          company: newPartner.company || null,
                          address: newPartner.address || null,
                          city: newPartner.city || null,
                          postalCode: newPartner.postalCode || null,
                          taxNumber: newPartner.taxNumber || null,
                          partnerSharePercent: newPartner.partnerSharePercent || null,
                          preferredLanguage: newPartner.preferredLanguage || "de",
                        };
                        await apiRequest("POST", "/api/admin/users", payload);
                        toast({ title: "Partner erstellt", description: `${newPartner.email} wurde angelegt` });
                        setShowNewPartner(false);
                        setNewPartner({ email: "", password: "", firstName: "", lastName: "", phone: "", company: "", address: "", city: "", postalCode: "", taxNumber: "", partnerSharePercent: "40", preferredLanguage: "de" });
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                      } catch (err: any) {
                        toast({ title: "Fehler", description: err?.message || "Partner konnte nicht erstellt werden", variant: "destructive" });
                      }
                    }}
                    data-testid="button-save-partner"
                  >
                    Partner anlegen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {pendingPartners.length > 0 && (
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Wartende Genehmigungen ({pendingPartners.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingPartners.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">{p.firstName} {p.lastName}</p>
                        <p className="text-sm text-muted-foreground">{p.email}</p>
                        {p.company && <p className="text-xs">{p.company}</p>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <ConfirmAction
                          testId={`approve-${p.id}`}
                          trigger={
                            <Button size="sm" data-testid={`button-approve-${p.id}`}>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Genehmigen
                            </Button>
                          }
                          title="Partner freigeben?"
                          description={`${p.firstName ?? ""} ${p.lastName ?? ""} (${p.email}) erhält sofort Zugriff zum Partner-Hub und kann Aufträge sehen.`}
                          confirmLabel="Freigeben"
                          onConfirm={() =>
                            updateUserMutation.mutateAsync({ id: p.id, isApproved: true })
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditPartner(p)}
                          data-testid={`button-edit-pending-${p.id}`}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Bearbeiten
                        </Button>
                        <ConfirmAction
                          testId={`reject-${p.id}`}
                          trigger={
                            <Button size="sm" variant="outline" data-testid={`button-reject-${p.id}`}>
                              <UserX className="w-4 h-4 mr-1" />
                              Ablehnen
                            </Button>
                          }
                          title="Partner ablehnen?"
                          description={`Die Partneranfrage von ${p.firstName ?? ""} ${p.lastName ?? ""} wird auf "Client" zurückgestuft. Die Aktion ist über erneute Genehmigung umkehrbar.`}
                          confirmLabel="Ablehnen"
                          variant="destructive"
                          onConfirm={() =>
                            updateUserMutation.mutateAsync({ id: p.id, role: "client" })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {partners.filter(p => p.isApproved).map((p) => (
                <Card key={p.id} className="hover-elevate cursor-pointer" onClick={() => navigate(`/admin/partner/${p.id}`)} data-testid={`card-partner-${p.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{p.firstName} {p.lastName}</p>
                          <p className="text-sm text-muted-foreground">{p.email}</p>
                          {p.company && <p className="text-xs text-muted-foreground">{p.company}</p>}
                          <div className="flex flex-wrap gap-3 mt-1">
                            {p.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                            {p.address && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{p.address}, {p.postalCode} {p.city}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {(p as any).partnerSharePercent != null && (
                          <Badge className="bg-blue-500/10 text-blue-500">{(p as any).partnerSharePercent}% Anteil</Badge>
                        )}
                        {(p as any).taxNumber && (
                          <Badge variant="outline" className="text-xs">St.Nr.: {(p as any).taxNumber}</Badge>
                        )}
                        <Badge className="bg-green-500/20 text-green-500">Aktiv</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); openEditPartner(p); }}
                          data-testid={`button-edit-partner-${p.id}`}
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteUserId(p.id);
                            setDeleteUserName(`${p.firstName || ""} ${p.lastName || ""}`.trim() || p.email || "");
                          }}
                          data-testid={`button-delete-partner-${p.id}`}
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="franchise" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Franchise Interessenten</h2>
              <Badge variant="outline">{franchiseWaitlist.length} Anfragen</Badge>
            </div>

            {franchiseWaitlist.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Franchise-Anfragen</h3>
                  <p className="text-muted-foreground">Es gibt noch keine Franchise-Interessenten.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {franchiseWaitlist.map((entry) => (
                  <Card key={entry.id} className="hover-elevate" data-testid={`card-franchise-${entry.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                          {entry.phone && <p className="text-sm text-muted-foreground">{entry.phone}</p>}
                          <Badge className="mt-2">{entry.interestType}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                          </p>
                          {entry.message && (
                            <p className="text-sm mt-2 max-w-md text-left bg-muted p-3 rounded">
                              {entry.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskBoard users={allUsers} />
          </TabsContent>

          <TabsContent value="finanzen" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Finanzen (Break Even)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Partner</label>
                <Select value={finPartnerId || "__all__"} onValueChange={(v) => setFinPartnerId(v === "__all__" ? "" : v)}>
                  <SelectTrigger data-testid="select-finance-partner"><SelectValue placeholder="Alle Partner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle Partner</SelectItem>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName} {p.company ? `(${p.company})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Monat</label>
                <Select value={String(finMonth)} onValueChange={v => setFinMonth(parseInt(v))}>
                  <SelectTrigger data-testid="select-finance-month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <SelectItem key={m} value={String(m)}>{["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][m-1]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Jahr</label>
                <Select value={String(finYear)} onValueChange={v => setFinYear(parseInt(v))}>
                  <SelectTrigger data-testid="select-finance-year"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024,2025,2026,2027].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Badge variant="outline">{finEntries.length} Einträge</Badge>
              <Button onClick={() => setShowNewEntry(!showNewEntry)} className="gap-2" data-testid="button-new-entry">
                <Plus className="w-4 h-4" />
                Neuer Eintrag
              </Button>
            </div>

            {showNewEntry && (
              <Card className="p-5" data-testid="form-new-entry">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Neuer Finanzeintrag</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createEntryMutation.mutate({
                      partnerId: finPartnerId || undefined,
                      entryDate: newEntry.entryDate ? new Date(newEntry.entryDate).toISOString() : new Date().toISOString(),
                      cashAmount: Math.round(parseFloat(newEntry.cashAmount || "0") * 100),
                      invoiceGross: Math.round(parseFloat(newEntry.invoiceGross || "0") * 100),
                      invoiceAccount: Math.round(parseFloat(newEntry.invoiceAccount || "0") * 100),
                      paymentStatus: newEntry.paymentStatus,
                      variableCosts: Math.round(parseFloat(newEntry.variableCosts || "0") * 100),
                      description: newEntry.description,
                    });
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" /> Datum</label>
                        <Input type="date" value={newEntry.entryDate} onChange={e => setNewEntry(p => ({...p, entryDate: e.target.value}))} data-testid="input-entry-date" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Euro className="w-3 h-3" /> Bar (EUR)</label>
                        <Input type="number" step="0.01" min="0" value={newEntry.cashAmount} onChange={e => setNewEntry(p => ({...p, cashAmount: e.target.value}))} placeholder="0.00" data-testid="input-entry-cash" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Rechnung Brutto (EUR)</label>
                        <Input type="number" step="0.01" min="0" value={newEntry.invoiceGross} onChange={e => setNewEntry(p => ({...p, invoiceGross: e.target.value}))} placeholder="0.00" data-testid="input-entry-invoice-gross" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Rechnung Konto (EUR)</label>
                        <Input type="number" step="0.01" min="0" value={newEntry.invoiceAccount} onChange={e => setNewEntry(p => ({...p, invoiceAccount: e.target.value}))} placeholder="0.00" data-testid="input-entry-invoice-account" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Status</label>
                        <Select value={newEntry.paymentStatus} onValueChange={v => setNewEntry(p => ({...p, paymentStatus: v}))}>
                          <SelectTrigger data-testid="select-entry-status"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Offen</SelectItem>
                            <SelectItem value="paid">Bezahlt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Variable Kosten (EUR)</label>
                        <Input type="number" step="0.01" min="0" value={newEntry.variableCosts} onChange={e => setNewEntry(p => ({...p, variableCosts: e.target.value}))} placeholder="0.00" data-testid="input-entry-variable-costs" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium mb-1 block">Beschreibung</label>
                        <Input value={newEntry.description} onChange={e => setNewEntry(p => ({...p, description: e.target.value}))} placeholder="Fahrzeug / Info" data-testid="input-entry-description" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowNewEntry(false)} data-testid="button-cancel-entry">Abbrechen</Button>
                      <Button type="submit" disabled={createEntryMutation.isPending} className="gap-2" data-testid="button-submit-entry">
                        <Save className="w-4 h-4" />
                        {createEntryMutation.isPending ? "Speichern..." : "Speichern"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-finance-entries">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Datum</th>
                        <th className="text-right p-3 font-medium">Bar</th>
                        <th className="text-right p-3 font-medium">Rechnung Brutto</th>
                        <th className="text-right p-3 font-medium">Rechnung Konto</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Partner Anteil</th>
                        <th className="text-right p-3 font-medium">Corion Anteil</th>
                        <th className="text-right p-3 font-medium">Var. Kosten</th>
                        <th className="text-left p-3 font-medium">Beschreibung</th>
                        <th className="text-right p-3 font-medium">MwSt</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {finEntries.map((entry) => {
                        const selectedPartner = partners.find(p => p.id === entry.partnerId);
                        const sharePercent = (selectedPartner?.partnerSharePercent ?? 80) / 100;
                        const cash = entry.cashAmount;
                        const invGrossNet = entry.invoiceGross / 1.19;
                        const invAccNet = entry.invoiceAccount / 1.19;
                        const partnerShare = sharePercent * cash + sharePercent * invGrossNet + sharePercent * invAccNet;
                        const totalRevenue = cash + invGrossNet + invAccNet;
                        const corionShare = totalRevenue - partnerShare;
                        const mwst = (entry.invoiceGross / 1.19) * 0.19 + (entry.invoiceAccount / 1.19) * 0.19;
                        return (
                          <tr key={entry.id} className="border-b" data-testid={`row-entry-${entry.id}`}>
                            <td className="p-3">{new Date(entry.entryDate).toLocaleDateString("de-DE")}</td>
                            <td className="p-3 text-right">{(cash / 100).toFixed(2)} €</td>
                            <td className="p-3 text-right">{(entry.invoiceGross / 100).toFixed(2)} €</td>
                            <td className="p-3 text-right">{(entry.invoiceAccount / 100).toFixed(2)} €</td>
                            <td className="p-3 text-center">
                              <Badge className={entry.paymentStatus === "paid" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}>
                                {entry.paymentStatus === "paid" ? "Bezahlt" : "Offen"}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">{(partnerShare / 100).toFixed(2)} €</td>
                            <td className="p-3 text-right">{(corionShare / 100).toFixed(2)} €</td>
                            <td className="p-3 text-right">{(entry.variableCosts / 100).toFixed(2)} €</td>
                            <td className="p-3 text-muted-foreground">{entry.description || "-"}</td>
                            <td className="p-3 text-right">{(mwst / 100).toFixed(2)} €</td>
                            <td className="p-3">
                              <Button size="icon" variant="ghost" onClick={() => deleteEntryMutation.mutate(entry.id)} data-testid={`button-delete-entry-${entry.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {finEntries.length === 0 && (
                        <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">Keine Einträge für diesen Zeitraum</td></tr>
                      )}
                    </tbody>
                    {finEntries.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 font-bold bg-muted/30" data-testid="row-totals">
                          <td className="p-3">Summe</td>
                          <td className="p-3 text-right">{(finEntries.reduce((s, e) => s + e.cashAmount, 0) / 100).toFixed(2)} €</td>
                          <td className="p-3 text-right">{(finEntries.reduce((s, e) => s + e.invoiceGross, 0) / 100).toFixed(2)} €</td>
                          <td className="p-3 text-right">{(finEntries.reduce((s, e) => s + e.invoiceAccount, 0) / 100).toFixed(2)} €</td>
                          <td className="p-3"></td>
                          <td className="p-3 text-right">
                            {(() => {
                              const total = finEntries.reduce((s, e) => {
                                const sp = ((partners.find(p => p.id === e.partnerId)?.partnerSharePercent ?? 80) / 100);
                                return s + sp * e.cashAmount + sp * (e.invoiceGross / 1.19) + sp * (e.invoiceAccount / 1.19);
                              }, 0);
                              return (total / 100).toFixed(2) + " €";
                            })()}
                          </td>
                          <td className="p-3 text-right">
                            {(() => {
                              const total = finEntries.reduce((s, e) => {
                                const sp = ((partners.find(p => p.id === e.partnerId)?.partnerSharePercent ?? 80) / 100);
                                const rev = e.cashAmount + e.invoiceGross / 1.19 + e.invoiceAccount / 1.19;
                                const ps = sp * e.cashAmount + sp * (e.invoiceGross / 1.19) + sp * (e.invoiceAccount / 1.19);
                                return s + rev - ps;
                              }, 0);
                              return (total / 100).toFixed(2) + " €";
                            })()}
                          </td>
                          <td className="p-3 text-right">{(finEntries.reduce((s, e) => s + e.variableCosts, 0) / 100).toFixed(2)} €</td>
                          <td className="p-3"></td>
                          <td className="p-3 text-right">
                            {(finEntries.reduce((s, e) => s + (e.invoiceGross / 1.19) * 0.19 + (e.invoiceAccount / 1.19) * 0.19, 0) / 100).toFixed(2)} €
                          </td>
                          <td className="p-3"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-fixed-costs">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Fixkosten (Cheltuieli Fixe)
                </CardTitle>
                <CardDescription>Monatliche fixe Kosten für den ausgewählten Partner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {fixedCosts.map(fc => (
                    <div key={fc.id} className="flex items-center justify-between gap-4 p-3 bg-muted rounded-md" data-testid={`row-fixed-cost-${fc.id}`}>
                      <span className="font-medium">{fc.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{(fc.amountCents / 100).toFixed(2)} €</span>
                        <Button size="icon" variant="ghost" onClick={() => deleteFixedCostMutation.mutate(fc.id)} data-testid={`button-delete-fixed-cost-${fc.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {fixedCosts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Keine Fixkosten eingetragen</p>
                  )}
                </div>
                {fixedCosts.length > 0 && (
                  <div className="flex items-center justify-between p-3 border-t font-bold">
                    <span>Summe Fixkosten</span>
                    <span data-testid="text-total-fixed-costs">{(fixedCosts.reduce((s, fc) => s + fc.amountCents, 0) / 100).toFixed(2)} €</span>
                  </div>
                )}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newFixedCost.name || !newFixedCost.amountCents) return;
                  createFixedCostMutation.mutate({
                    partnerId: finPartnerId || undefined,
                    name: newFixedCost.name,
                    amountCents: Math.round(parseFloat(newFixedCost.amountCents) * 100),
                  });
                }} className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-medium mb-1 block">Name</label>
                    <Input value={newFixedCost.name} onChange={e => setNewFixedCost(p => ({...p, name: e.target.value}))} placeholder="z.B. Miete" data-testid="input-fixed-cost-name" />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium mb-1 block">Betrag (EUR)</label>
                    <Input type="number" step="0.01" min="0" value={newFixedCost.amountCents} onChange={e => setNewFixedCost(p => ({...p, amountCents: e.target.value}))} placeholder="0.00" data-testid="input-fixed-cost-amount" />
                  </div>
                  <Button type="submit" disabled={createFixedCostMutation.isPending} className="gap-2" data-testid="button-add-fixed-cost">
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auftraege" className="space-y-6">
            {/* Materials-KPI overview — AI-driven 40/60 split health per partner */}
            <AdminMaterialsKpiPanel />

            {/* Aufträge Filter & Search Toolbar — applied to both pipeline & list */}
            {(() => {
              const searchLower = orderSearchQuery.toLowerCase().trim();
              const isOverdue = (o: WorkshopOrder) =>
                !!o.scheduledDate &&
                !["fertig", "completed", "cancelled"].includes(o.status) &&
                new Date(o.scheduledDate as any).getTime() < Date.now();
              const dateFromTs = orderDateFromFilter
                ? new Date(orderDateFromFilter).getTime()
                : null;
              const filteredOrders = workshopOrders.filter((o) => {
                if (
                  orderStatusFilter !== "all" &&
                  o.status !== orderStatusFilter
                )
                  return false;
                if (orderPartnerFilter === "unassigned" && o.partnerId)
                  return false;
                if (
                  orderPartnerFilter !== "all" &&
                  orderPartnerFilter !== "unassigned" &&
                  o.partnerId !== orderPartnerFilter
                )
                  return false;
                if (
                  dateFromTs !== null &&
                  o.scheduledDate &&
                  new Date(o.scheduledDate as any).getTime() < dateFromTs
                )
                  return false;
                if (orderOverdueOnly && !isOverdue(o)) return false;
                if (searchLower) {
                  const hay = [
                    o.referenceNumber ?? "",
                    o.customerName ?? "",
                    o.customerEmail ?? "",
                    o.vehicleMake ?? "",
                    o.vehicleModel ?? "",
                    o.vehiclePlate ?? "",
                    o.vehicleVin ?? "",
                  ]
                    .join(" ")
                    .toLowerCase();
                  if (!hay.includes(searchLower)) return false;
                }
                return true;
              });
              const overdueCount = workshopOrders.filter(isOverdue).length;
              const filterActive =
                orderStatusFilter !== "all" ||
                orderPartnerFilter !== "all" ||
                !!orderDateFromFilter ||
                orderOverdueOnly ||
                !!searchLower;

              return (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        Pipeline
                      </h2>
                      <div className="text-xs text-muted-foreground">
                        {filteredOrders.length}
                        {filterActive
                          ? ` von ${workshopOrders.length}`
                          : ""}{" "}
                        Aufträge · 6 Statusphasen
                      </div>
                    </div>

                    <Card className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Suchen: Kunde, Kennzeichen, Ref…"
                            value={orderSearchQuery}
                            onChange={(e) =>
                              setOrderSearchQuery(e.target.value)
                            }
                            className="pl-9"
                            data-testid="input-search-orders"
                          />
                        </div>
                        <Select
                          value={orderStatusFilter}
                          onValueChange={setOrderStatusFilter}
                        >
                          <SelectTrigger
                            className="w-40"
                            data-testid="filter-status"
                          >
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Status</SelectItem>
                            <SelectItem value="open">Offen</SelectItem>
                            <SelectItem value="angenommen">
                              Angenommen
                            </SelectItem>
                            <SelectItem value="in_bearbeitung">
                              In Arbeit
                            </SelectItem>
                            <SelectItem value="fertig">Fertig</SelectItem>
                            <SelectItem value="completed">
                              Abgeschlossen
                            </SelectItem>
                            <SelectItem value="cancelled">
                              Storniert
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={orderPartnerFilter}
                          onValueChange={setOrderPartnerFilter}
                        >
                          <SelectTrigger
                            className="w-44"
                            data-testid="filter-partner"
                          >
                            <SelectValue placeholder="Partner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Partner</SelectItem>
                            <SelectItem value="unassigned">
                              Nicht zugewiesen
                            </SelectItem>
                            {partners.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.firstName} {p.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={orderDateFromFilter}
                          onChange={(e) =>
                            setOrderDateFromFilter(e.target.value)
                          }
                          className="w-40"
                          data-testid="filter-date-from"
                          title="Termin ab"
                        />
                        <Button
                          type="button"
                          variant={orderOverdueOnly ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setOrderOverdueOnly((v) => !v)
                          }
                          className="gap-1"
                          data-testid="filter-overdue"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Überfällig{" "}
                          {overdueCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 px-1 text-[10px]"
                            >
                              {overdueCount}
                            </Badge>
                          )}
                        </Button>
                        {filterActive && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOrderSearchQuery("");
                              setOrderStatusFilter("all");
                              setOrderPartnerFilter("all");
                              setOrderDateFromFilter("");
                              setOrderOverdueOnly(false);
                            }}
                            data-testid="filter-reset"
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </Card>

                    {workshopOrders.length === 0 ? (
                      <Card className="text-center py-12">
                        <CardContent>
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-lg font-semibold mb-2">
                            Noch keine Aufträge
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Erfasse deinen ersten Werkstatt-Auftrag, um die
                            Pipeline zu starten.
                          </p>
                          <Button
                            onClick={() => setShowWorkshopForm(true)}
                            className="gap-2"
                            data-testid="empty-create-order"
                          >
                            <Plus className="w-4 h-4" /> Neuer Auftrag
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <OrderPipeline
                        orders={filteredOrders}
                        partners={partners}
                        onOpenCrm={setCrmDialogOrder}
                      />
                    )}
                  </div>
                </>
              );
            })()}

            <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ListIcon className="w-5 h-5" />
                Auftragsliste
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/repair-order">
                  <Button variant="outline" className="gap-2" data-testid="button-repair-protocol">
                    <FileDown className="w-4 h-4" />
                    Reparaturprotokoll
                  </Button>
                </Link>
                <Button onClick={() => setShowWorkshopForm(!showWorkshopForm)} className="gap-2" data-testid="button-new-workshop-order">
                  <Plus className="w-4 h-4" />
                  Neuer Auftrag
                </Button>
              </div>
            </div>

            {showWorkshopForm && (
              <Card className="p-5" data-testid="form-workshop-order">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Neuer Werkstatt Auftrag</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createWorkshopOrderMutation.mutate({
                      intakeDate: wsForm.orderDate || undefined,
                      customerName: wsForm.customerName,
                      customerAddress: wsForm.customerAddress || undefined,
                      customerPhone: wsForm.customerPhone || undefined,
                      customerEmail: wsForm.customerEmail || undefined,
                      vehicleMake: wsForm.vehicleMake || "Unbekannt",
                      vehicleModel: wsForm.vehicleModel || undefined,
                      vehiclePlate: wsForm.vehiclePlate || "—",
                      vehicleVin: wsForm.vehicleVin || undefined,
                      vehicleColor: wsForm.vehicleColor || undefined,
                      vehicleMileage: wsForm.vehicleMileage || undefined,
                      damageDescription: wsForm.damageDescription || "Keine Beschreibung",
                      totalAmountCents: wsForm.totalAmountCents ? Math.round(parseFloat(wsForm.totalAmountCents) * 100) : undefined,
                      laborAmountCents: wsForm.laborAmountCents ? Math.round(parseFloat(wsForm.laborAmountCents) * 100) : undefined,
                      partsAmountCents: wsForm.partsAmountCents ? Math.round(parseFloat(wsForm.partsAmountCents) * 100) : undefined,
                      partnerId: wsForm.partnerId || undefined,
                      scheduledStart: wsForm.deliveryDate ? new Date(wsForm.deliveryDate).toISOString() : undefined,
                      notes: wsForm.priorDamage || undefined,
                      intakeSource: "admin_manual",
                    });
                  }} className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Auftragsdaten</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Datum</label>
                          <Input type="date" value={wsForm.orderDate} onChange={e => setWsForm(p => ({...p, orderDate: e.target.value}))} data-testid="input-ws-order-date" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Partner</label>
                          <Select value={wsForm.partnerId} onValueChange={v => setWsForm(p => ({...p, partnerId: v}))}>
                            <SelectTrigger data-testid="select-ws-partner"><SelectValue placeholder="Partner wählen" /></SelectTrigger>
                            <SelectContent>
                              {partners.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Euro className="w-3 h-3" /> Rechnung Brutto (EUR)</label>
                          <Input type="number" step="0.01" min="0" value={wsForm.totalAmountCents} onChange={e => setWsForm(p => ({...p, totalAmountCents: e.target.value}))} placeholder="0.00" data-testid="input-ws-amount" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Euro className="w-3 h-3" /> Manöver/Arbeit (EUR)</label>
                          <Input type="number" step="0.01" min="0" value={wsForm.laborAmountCents} onChange={e => setWsForm(p => ({...p, laborAmountCents: e.target.value}))} placeholder="0.00" data-testid="input-ws-labor" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Package className="w-3 h-3" /> Teile/Material (EUR)</label>
                          <Input type="number" step="0.01" min="0" value={wsForm.partsAmountCents} onChange={e => setWsForm(p => ({...p, partsAmountCents: e.target.value}))} placeholder="0.00" data-testid="input-ws-parts" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Kundendaten</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Name *</label>
                          <Input required value={wsForm.customerName} onChange={e => setWsForm(p => ({...p, customerName: e.target.value}))} placeholder="Kundenname" data-testid="input-ws-customer-name" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</label>
                          <Input value={wsForm.customerAddress} onChange={e => setWsForm(p => ({...p, customerAddress: e.target.value}))} placeholder="Straße Nr., PLZ Ort" data-testid="input-ws-customer-address" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</label>
                          <Input value={wsForm.customerPhone} onChange={e => setWsForm(p => ({...p, customerPhone: e.target.value}))} placeholder="Telefonnummer" data-testid="input-ws-customer-phone" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> E-Mail</label>
                          <Input type="email" value={wsForm.customerEmail} onChange={e => setWsForm(p => ({...p, customerEmail: e.target.value}))} placeholder="email@example.com" data-testid="input-ws-customer-email" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Fahrzeugdaten</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Marke</label>
                          <Input value={wsForm.vehicleMake} onChange={e => setWsForm(p => ({...p, vehicleMake: e.target.value}))} placeholder="z.B. BMW" data-testid="input-ws-vehicle-make" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Modell</label>
                          <Input value={wsForm.vehicleModel} onChange={e => setWsForm(p => ({...p, vehicleModel: e.target.value}))} placeholder="z.B. 3er" data-testid="input-ws-vehicle-model" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Kennzeichen</label>
                          <Input value={wsForm.vehiclePlate} onChange={e => setWsForm(p => ({...p, vehiclePlate: e.target.value}))} placeholder="z.B. F-AB 1234" data-testid="input-ws-vehicle-plate" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">FIN (VIN)</label>
                          <Input value={wsForm.vehicleVin} onChange={e => setWsForm(p => ({...p, vehicleVin: e.target.value}))} placeholder="Fahrzeug-Identnummer" data-testid="input-ws-vehicle-vin" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Farbe</label>
                          <Input value={wsForm.vehicleColor} onChange={e => setWsForm(p => ({...p, vehicleColor: e.target.value}))} placeholder="Fahrzeugfarbe" data-testid="input-ws-vehicle-color" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">km-Stand</label>
                          <Input value={wsForm.vehicleMileage} onChange={e => setWsForm(p => ({...p, vehicleMileage: e.target.value}))} placeholder="Kilometerstand" data-testid="input-ws-vehicle-mileage" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3">Schadensbeschreibung</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Schaden Beschreibung *</label>
                          <Textarea required value={wsForm.damageDescription} onChange={e => setWsForm(p => ({...p, damageDescription: e.target.value}))} placeholder="Beschreibung des Schadens..." className="resize-none" data-testid="input-ws-damage-description" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Vorschäden</label>
                          <Textarea value={wsForm.priorDamage} onChange={e => setWsForm(p => ({...p, priorDamage: e.target.value}))} placeholder="Vorhandene Schäden..." className="resize-none" data-testid="input-ws-prior-damage" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3">Termine & Unterschrift</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Abgabetermin</label>
                          <Input type="date" value={wsForm.deliveryDate} onChange={e => setWsForm(p => ({...p, deliveryDate: e.target.value}))} data-testid="input-ws-delivery-date" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Abholtermin</label>
                          <Input type="date" value={wsForm.pickupDate} onChange={e => setWsForm(p => ({...p, pickupDate: e.target.value}))} data-testid="input-ws-pickup-date" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Unterschrift Kunde</label>
                          <Input value={wsForm.customerSignature} onChange={e => setWsForm(p => ({...p, customerSignature: e.target.value}))} placeholder="Name des Kunden" data-testid="input-ws-signature" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowWorkshopForm(false)} data-testid="button-cancel-ws-order">Abbrechen</Button>
                      <Button type="submit" disabled={createWorkshopOrderMutation.isPending} className="gap-2" data-testid="button-submit-ws-order">
                        <Save className="w-4 h-4" />
                        {createWorkshopOrderMutation.isPending ? "Wird erstellt..." : "Auftrag erstellen"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {(() => {
                const searchLower = orderSearchQuery.toLowerCase().trim();
                const isOverdueLocal = (o: WorkshopOrder) =>
                  !!o.scheduledDate &&
                  !["fertig", "completed", "cancelled"].includes(o.status) &&
                  new Date(o.scheduledDate as any).getTime() < Date.now();
                const dateFromTsLocal = orderDateFromFilter
                  ? new Date(orderDateFromFilter).getTime()
                  : null;
                const filteredOrders = workshopOrders.filter((o) => {
                  if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
                  if (orderPartnerFilter === "unassigned" && o.partnerId) return false;
                  if (
                    orderPartnerFilter !== "all" &&
                    orderPartnerFilter !== "unassigned" &&
                    o.partnerId !== orderPartnerFilter
                  )
                    return false;
                  if (
                    dateFromTsLocal !== null &&
                    o.scheduledDate &&
                    new Date(o.scheduledDate as any).getTime() < dateFromTsLocal
                  )
                    return false;
                  if (orderOverdueOnly && !isOverdueLocal(o)) return false;
                  if (searchLower) {
                    const hay = [
                      o.referenceNumber ?? "",
                      o.customerName ?? "",
                      o.customerEmail ?? "",
                      o.vehicleMake ?? "",
                      o.vehicleModel ?? "",
                      o.vehiclePlate ?? "",
                      o.vehicleVin ?? "",
                    ]
                      .join(" ")
                      .toLowerCase();
                    if (!hay.includes(searchLower)) return false;
                  }
                  return true;
                });
                const isFilterActive =
                  orderStatusFilter !== "all" ||
                  orderPartnerFilter !== "all" ||
                  !!orderDateFromFilter ||
                  orderOverdueOnly ||
                  !!searchLower;
                return (
                  <>
              <Badge variant="outline">{filteredOrders.length} {isFilterActive ? `von ${workshopOrders.length} ` : ""}Aufträge</Badge>
              {filteredOrders.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Keine Aufträge</h3>
                    <p className="text-muted-foreground">Es gibt noch keine Werkstatt-Aufträge.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const paymentStatusValue = (order as any).paymentStatus || "offen";
                    const paymentBadgeColor = paymentStatusValue === "bezahlt" ? "bg-green-500/20 text-green-500" : paymentStatusValue === "teil_bezahlt" ? "bg-orange-500/20 text-orange-500" : "bg-yellow-500/20 text-yellow-500";
                    const assignedPartner = partners.find(p => p.id === order.partnerId);
                    const attachments: any[] = orderFiles[order.id] || [];

                    const orderStatusColor =
                      order.status === "completed" ? "bg-emerald-500"
                      : order.status === "fertig" ? "bg-green-500"
                      : order.status === "in_bearbeitung" ? "bg-orange-500"
                      : order.status === "angenommen" ? "bg-purple-500"
                      : order.status === "cancelled" ? "bg-red-500"
                      : "bg-blue-500";
                    const orderStatusLabel =
                      order.status === "completed" ? "Abgeschlossen"
                      : order.status === "fertig" ? "Fertig"
                      : order.status === "in_bearbeitung" ? "In Bearbeitung"
                      : order.status === "angenommen" ? "Angenommen"
                      : order.status === "cancelled" ? "Storniert"
                      : "Offen";

                    return (
                      <div key={order.id} className="bg-card border border-border rounded-lg hover-elevate overflow-visible" data-testid={`card-workshop-order-${order.id}`}>
                        {/* ── Card header row ── */}
                        <div
                          className="flex items-start gap-0 cursor-pointer"
                          onClick={() => {
                            const nextId = isExpanded ? null : order.id;
                            setExpandedOrderId(nextId);
                            if (!isExpanded) {
                              fetchOrderFiles(order.id);
                              setPaymentForm({
                                paidAmountCents: (order as any).paidAmountCents ? String(((order as any).paidAmountCents / 100).toFixed(2)) : "",
                                paymentMethod: (order as any).paymentMethod || "bar",
                              });
                            }
                          }}
                          data-testid={`button-toggle-order-${order.id}`}
                        >
                          {/* Status strip */}
                          <div className={`w-1 self-stretch rounded-l-lg flex-shrink-0 ${orderStatusColor}`} />

                          <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              {/* Left: vehicle + customer */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {/* Plate number — Fixico-style prominent */}
                                  {order.vehiclePlate ? (
                                    <span className="font-mono font-bold text-base tracking-widest bg-muted px-2 py-0.5 rounded border border-border" data-testid={`badge-plate-${order.id}`}>
                                      {order.vehiclePlate}
                                    </span>
                                  ) : null}
                                  {order.vehicleMake && (
                                    <span className="text-sm font-medium text-muted-foreground">{order.vehicleMake} {order.vehicleModel}</span>
                                  )}
                                </div>
                                <p className="font-semibold text-sm">{order.customerName}</p>
                                {order.damageDescription && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{order.damageDescription}</p>
                                )}
                              </div>

                              {/* Right: status + meta */}
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <Badge className={`${orderStatusColor} text-white border-0 text-[10px]`}>
                                  {orderStatusLabel}
                                </Badge>
                                {order.referenceNumber && (
                                  <span className="text-[10px] font-mono text-muted-foreground" data-testid={`badge-ref-${order.id}`}>{order.referenceNumber}</span>
                                )}
                                {order.totalAmountCents > 0 && (
                                  <span className="text-sm font-bold" data-testid={`text-total-${order.id}`}>{(order.totalAmountCents / 100).toFixed(2)} €</span>
                                )}
                              </div>
                            </div>

                            {/* Bottom row: meta info + quick actions */}
                            <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {new Date(order.orderDate).toLocaleDateString("de-DE")}
                                </span>
                                {!order.partnerId ? (
                                  <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-[10px]" data-testid={`badge-unassigned-${order.id}`}>
                                    Kein Partner
                                  </Badge>
                                ) : assignedPartner ? (
                                  <Badge variant="secondary" className="text-[10px]" data-testid={`badge-partner-${order.id}`}>
                                    {assignedPartner.firstName} {assignedPartner.lastName}
                                  </Badge>
                                ) : null}
                                <Badge className={`${paymentBadgeColor} text-[10px]`}>
                                  {paymentStatusValue === "bezahlt" ? "Bezahlt" : paymentStatusValue === "teil_bezahlt" ? "Teil bezahlt" : "Offen"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" title="CRM Kundendaten"
                                  onClick={() => setCrmDialogOrder(order)} data-testid={`button-crm-${order.id}`}>
                                  <UserIcon className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Fahrzeugdaten"
                                  onClick={() => setVehicleDialogOrder(order)} data-testid={`button-vehicle-${order.id}`}>
                                  <Wrench className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Löschen"
                                  onClick={() => deleteWorkshopOrderMutation.mutate(order.id)} data-testid={`button-delete-ws-order-${order.id}`}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
                              </div>
                            </div>
                          </div>
                        </div>

                          {isExpanded && (
                            <div className="border-t p-4 space-y-5">
                              {/* Payment status quick-change */}
                              <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
                                <span className="text-xs font-medium text-muted-foreground">Zahlungsstatus:</span>
                                <Select
                                  value={paymentStatusValue}
                                  onValueChange={(value) => updateWorkshopOrderMutation.mutate({ id: order.id, data: { paymentStatus: value } })}
                                >
                                  <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-payment-status-${order.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="offen">Offen</SelectItem>
                                    <SelectItem value="bezahlt">Bezahlt</SelectItem>
                                    <SelectItem value="teil_bezahlt">Teil bezahlt</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(paymentStatusValue === "bezahlt" || paymentStatusValue === "teil_bezahlt") && (
                                <div className="p-4 rounded-md bg-muted space-y-3" data-testid={`panel-payment-${order.id}`}>
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Zahlungsdetails
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                    <div>
                                      <label className="text-xs font-medium mb-1 block">Betrag (EUR)</label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={paymentForm.paidAmountCents}
                                        onChange={e => setPaymentForm(p => ({ ...p, paidAmountCents: e.target.value }))}
                                        placeholder="0.00"
                                        data-testid={`input-paid-amount-${order.id}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium mb-1 block">Zahlungsart</label>
                                      <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm(p => ({ ...p, paymentMethod: v }))}>
                                        <SelectTrigger data-testid={`select-payment-method-${order.id}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="bar">Bar</SelectItem>
                                          <SelectItem value="konto">Konto</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        updateWorkshopOrderMutation.mutate({
                                          id: order.id,
                                          data: {
                                            paidAmountCents: Math.round(parseFloat(paymentForm.paidAmountCents || "0") * 100),
                                            paymentMethod: paymentForm.paymentMethod,
                                          },
                                        });
                                      }}
                                      disabled={updateWorkshopOrderMutation.isPending}
                                      className="gap-2"
                                      data-testid={`button-save-payment-${order.id}`}
                                    >
                                      <Save className="w-4 h-4" />
                                      Speichern
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  {(() => {
                                    const firstPhoto = attachments.find((a: any) => a.mimeType?.startsWith("image/"));
                                    if (!firstPhoto) return null;
                                    return (
                                      <div className="relative rounded-md overflow-hidden h-40 mb-2" data-testid={`order-hero-image-${order.id}`}>
                                        <img src={`/api/admin/workshop-orders/files/${firstPhoto.id}`} alt="Schadensfoto" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-2 left-3 text-white text-xs font-medium">{order.customerName} — {[order.vehicleMake, order.vehicleModel].filter(Boolean).join(" ")}</div>
                                      </div>
                                    );
                                  })()}
                                  <div>
                                    <h4
                                      className="text-sm font-semibold mb-2 flex items-center gap-2 cursor-pointer text-primary hover:underline"
                                      onClick={(e) => { e.stopPropagation(); setCrmDialogOrder(order); }}
                                      data-testid={`button-crm-${order.id}`}
                                    >
                                      <Users className="w-4 h-4" /> Kundendaten
                                      <Eye className="w-3 h-3 ml-1 opacity-60" />
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <p data-testid={`text-customer-name-${order.id}`}><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
                                      {order.customerAddress && <p><span className="text-muted-foreground">Adresse:</span> {order.customerAddress}</p>}
                                      {order.customerPhone && <p><span className="text-muted-foreground">Telefon:</span> {order.customerPhone}</p>}
                                      {order.customerEmail && <p><span className="text-muted-foreground">E-Mail:</span> {order.customerEmail}</p>}
                                    </div>
                                  </div>

                                  <div>
                                    <h4
                                      className="text-sm font-semibold mb-2 flex items-center gap-2 cursor-pointer text-primary hover:underline"
                                      onClick={(e) => { e.stopPropagation(); setVehicleDialogOrder(order); }}
                                      data-testid={`button-vehicle-${order.id}`}
                                    >
                                      <Wrench className="w-4 h-4" /> Fahrzeugdaten
                                      <Eye className="w-3 h-3 ml-1 opacity-60" />
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      {order.vehicleMake && <p><span className="text-muted-foreground">Marke:</span> {order.vehicleMake}</p>}
                                      {order.vehicleModel && <p><span className="text-muted-foreground">Modell:</span> {order.vehicleModel}</p>}
                                      {order.vehiclePlate && <p><span className="text-muted-foreground">Kennzeichen:</span> {order.vehiclePlate}</p>}
                                      {order.vehicleVin && <p><span className="text-muted-foreground">FIN:</span> {order.vehicleVin}</p>}
                                      {order.vehicleColor && <p><span className="text-muted-foreground">Farbe:</span> {order.vehicleColor}</p>}
                                      {order.vehicleMileage && <p><span className="text-muted-foreground">km-Stand:</span> {order.vehicleMileage}</p>}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Auftrags-Status</h4>
                                    <div className="flex flex-wrap items-center gap-1 text-xs">
                                      {["open", "angenommen", "in_bearbeitung", "fertig"].map((s, i) => {
                                        const labels: Record<string, string> = { open: "Offen", angenommen: "Angenommen", in_bearbeitung: "In Bearbeitung", fertig: "Fertig" };
                                        const isActive = order.status === s;
                                        const statusOrder = ["open", "angenommen", "in_bearbeitung", "fertig"];
                                        const currentIdx = statusOrder.indexOf(order.status);
                                        const isPast = i < currentIdx;
                                        return (
                                          <span key={s} className="flex items-center gap-1">
                                            {i > 0 && <span className={`w-4 h-0.5 ${isPast || isActive ? "bg-primary" : "bg-muted-foreground/30"}`} />}
                                            <Badge
                                              variant={isActive ? "default" : "outline"}
                                              className={isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-green-500/20 text-green-500 border-green-500/30" : "opacity-50"}
                                            >
                                              {labels[s] || s}
                                            </Badge>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Schadensbeschreibung</h4>
                                    <div className="space-y-1 text-sm">
                                      <p data-testid={`text-damage-${order.id}`}>{order.damageDescription}</p>
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
                                    <h4 className="text-sm font-semibold mb-2">Weitere Details</h4>
                                    <div className="space-y-1 text-sm">
                                      {order.totalAmountCents > 0 && <p><span className="text-muted-foreground">Betrag:</span> {(order.totalAmountCents / 100).toFixed(2)} €</p>}
                                      {order.customerSignature && <p><span className="text-muted-foreground">Unterschrift Kunde:</span> {order.customerSignature}</p>}
                                      <p><span className="text-muted-foreground">Zahlungsstatus:</span> <Badge className={paymentBadgeColor}>{paymentStatusValue === "teil_bezahlt" ? "Teil bezahlt" : paymentStatusValue === "bezahlt" ? "Bezahlt" : "Offen"}</Badge></p>
                                      {(order as any).paidAmountCents > 0 && <p><span className="text-muted-foreground">Bezahlt:</span> {((order as any).paidAmountCents / 100).toFixed(2)} € ({(order as any).paymentMethod === "konto" ? "Konto" : "Bar"})</p>}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Partner-Zuweisung</h4>
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                      <Select
                                        value={order.partnerId || "none"}
                                        onValueChange={(value) => {
                                          const newPartnerId = value === "none" ? null : value;
                                          updateWorkshopOrderMutation.mutate({ id: order.id, data: { partnerId: newPartnerId } });
                                        }}
                                      >
                                        <SelectTrigger className="w-full" data-testid={`select-partner-assign-${order.id}`}>
                                          <SelectValue placeholder="Partner auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Nicht zugewiesen</SelectItem>
                                          {partners.filter(p => p.role === "partner").map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.email}) {p.partnerSharePercent ? `– ${p.partnerSharePercent}%` : ""}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {assignedPartner && (
                                      <p className="text-xs text-muted-foreground mt-1">Aktuell: {assignedPartner.firstName} {assignedPartner.lastName} ({assignedPartner.partnerSharePercent || 0}%)</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> Anhänge</h4>
                                {attachments.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                    {attachments.map((att: any) => {
                                      const fileUrl = `/api/admin/workshop-orders/files/${att.id}`;
                                      const isImage = att.mimeType?.startsWith("image/");
                                      const isPdf = att.mimeType === "application/pdf" || att.originalName?.endsWith(".pdf");
                                      const formatSize = (bytes: number) => {
                                        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                                        return `${(bytes / 1024).toFixed(1)} KB`;
                                      };
                                      return (
                                        <div key={att.id} className="border rounded-md p-3 space-y-2" data-testid={`attachment-${att.id}`}>
                                          {isImage ? (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block" data-testid={`link-attachment-view-${att.id}`}>
                                              <img src={fileUrl} alt={att.originalName} className="w-full h-32 object-cover rounded-md" />
                                            </a>
                                          ) : (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-32 bg-muted rounded-md" data-testid={`link-attachment-view-${att.id}`}>
                                              {isPdf ? <FileText className="w-10 h-10 text-red-500" /> : <File className="w-10 h-10 text-muted-foreground" />}
                                            </a>
                                          )}
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-medium truncate" data-testid={`text-attachment-name-${att.id}`}>{att.originalName}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {att.size ? formatSize(att.size) : ""}
                                                {att.createdAt ? ` · ${new Date(att.createdAt).toLocaleDateString("de-DE")}` : ""}
                                              </p>
                                              {att.driveLink && (
                                                <a href={att.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1" data-testid={`link-drive-${att.id}`}>
                                                  <FileDown className="w-3 h-3" /> Google Drive
                                                </a>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              {(isImage || isPdf) && (
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={() => extractDocumentMutation.mutate({ orderId: order.id, fileId: att.id })}
                                                  disabled={extractingFileId === att.id}
                                                  data-testid={`button-extract-${att.id}`}
                                                  title="KI-Datenextraktion"
                                                >
                                                  {extractingFileId === att.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                                                </Button>
                                              )}
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => deleteAttachmentMutation.mutate({ orderId: order.id, attachmentId: att.id })}
                                                data-testid={`button-delete-attachment-${att.id}`}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <label className="inline-flex">
                                  <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp,.heic,.gif,.bmp,.tiff,.tif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z,.ppt,.pptx,.odt,.ods"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        uploadAttachmentsMutation.mutate({ id: order.id, files: e.target.files });
                                        e.target.value = "";
                                      }
                                    }}
                                    data-testid={`input-upload-files-${order.id}`}
                                  />
                                  <Button variant="outline" className="gap-2" onClick={(e) => { (e.currentTarget.previousElementSibling as HTMLInputElement)?.click(); }} data-testid={`button-upload-files-${order.id}`}>
                                    <Upload className="w-4 h-4" />
                                    {uploadAttachmentsMutation.isPending ? "Wird hochgeladen..." : "Dateien hochladen"}
                                  </Button>
                                </label>

                                {extractedData && expandedOrderId === order.id && (
                                  <div className="mt-4 border rounded-md p-4 bg-primary/5 space-y-3" data-testid="extracted-data-panel">
                                    <h4 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> KI-extrahierte Daten</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {extractedData.documentType && <div><span className="text-muted-foreground">Dokumenttyp:</span> <span className="font-medium">{extractedData.documentType}</span></div>}
                                      {extractedData.customerName && <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{extractedData.customerName}</span></div>}
                                      {extractedData.customerAddress && <div><span className="text-muted-foreground">Adresse:</span> <span className="font-medium">{extractedData.customerAddress}</span></div>}
                                      {extractedData.customerPhone && <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{extractedData.customerPhone}</span></div>}
                                      {extractedData.customerEmail && <div><span className="text-muted-foreground">E-Mail:</span> <span className="font-medium">{extractedData.customerEmail}</span></div>}
                                      {extractedData.vehicleMake && <div><span className="text-muted-foreground">Marke:</span> <span className="font-medium">{extractedData.vehicleMake}</span></div>}
                                      {extractedData.vehicleModel && <div><span className="text-muted-foreground">Modell:</span> <span className="font-medium">{extractedData.vehicleModel}</span></div>}
                                      {extractedData.vehiclePlate && <div><span className="text-muted-foreground">Kennzeichen:</span> <span className="font-medium">{extractedData.vehiclePlate}</span></div>}
                                      {extractedData.vehicleVin && <div><span className="text-muted-foreground">FIN:</span> <span className="font-medium">{extractedData.vehicleVin}</span></div>}
                                      {extractedData.vehicleColor && <div><span className="text-muted-foreground">Farbe:</span> <span className="font-medium">{extractedData.vehicleColor}</span></div>}
                                      {extractedData.damageDescription && <div className="col-span-2"><span className="text-muted-foreground">Schaden:</span> <span className="font-medium">{extractedData.damageDescription}</span></div>}
                                      {extractedData.totalAmountCents && <div><span className="text-muted-foreground">Betrag:</span> <span className="font-medium">{(extractedData.totalAmountCents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} &euro;</span></div>}
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                      <Button size="sm" onClick={() => applyExtractionMutation.mutate({ orderId: order.id, extracted: extractedData })} disabled={applyExtractionMutation.isPending} data-testid="button-apply-extraction">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {applyExtractionMutation.isPending ? "Wird übernommen..." : "Daten übernehmen"}
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setExtractedData(null)} data-testid="button-dismiss-extraction">Verwerfen</Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
              </>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="kalender" className="space-y-4">
            <FixicoCalendar
              orders={(workshopOrders as any[]) || []}
              appointments={schedulerAppointments || []}
              onOpen={(id) => {
                const appointmentMatch = (schedulerAppointments || []).find((a: any) => a.id === id);
                if (appointmentMatch) {
                  if (appointmentMatch.orderId) {
                    const linkedOrder = (workshopOrders || []).find((o: any) => o.id === appointmentMatch.orderId);
                    if (linkedOrder) {
                      setCrmDialogOrder(linkedOrder as any);
                    } else {
                      navigate(`/workshop/auftrag/${appointmentMatch.orderId}`);
                    }
                    return;
                  }
                  navigate(`/admin/calendar?appointmentId=${id}`);
                  return;
                }

                const orderMatch = (workshopOrders || []).find((o: any) => o.id === id);
                if (orderMatch) {
                  setCrmDialogOrder(orderMatch as any);
                  return;
                }

                navigate(`/workshop/auftrag/${id}`);
              }}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentsLibrary />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <OrderCrmModal
        order={crmDialogOrder}
        partners={partners}
        allOrders={workshopOrders}
        onClose={() => setCrmDialogOrder(null)}
      />

      <Dialog open={!!vehicleDialogOrder} onOpenChange={() => setVehicleDialogOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" /> Fahrzeugdatenbank
            </DialogTitle>
          </DialogHeader>
          {vehicleDialogOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-md bg-muted">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg" data-testid="vehicle-title">{vehicleDialogOrder.vehicleMake} {vehicleDialogOrder.vehicleModel}</p>
                  {vehicleDialogOrder.vehiclePlate && <p className="text-sm text-muted-foreground font-mono">{vehicleDialogOrder.vehiclePlate}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">Marke</p>
                  <p className="text-sm font-medium">{vehicleDialogOrder.vehicleMake || "—"}</p>
                </div>
                <div className="p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">Modell</p>
                  <p className="text-sm font-medium">{vehicleDialogOrder.vehicleModel || "—"}</p>
                </div>
                <div className="p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">Kennzeichen</p>
                  <p className="text-sm font-medium font-mono">{vehicleDialogOrder.vehiclePlate || "—"}</p>
                </div>
                <div className="p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">FIN</p>
                  <p className="text-sm font-medium font-mono">{vehicleDialogOrder.vehicleVin || "—"}</p>
                </div>
                <div className="p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">Farbe</p>
                  <p className="text-sm font-medium">{vehicleDialogOrder.vehicleColor || "—"}</p>
                </div>
                <div className="p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">km-Stand</p>
                  <p className="text-sm font-medium">{vehicleDialogOrder.vehicleMileage || "—"}</p>
                </div>
              </div>
              <div className="p-3 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Kunde</p>
                <p className="text-sm font-medium">{vehicleDialogOrder.customerName}</p>
              </div>
              <div className="p-3 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Referenz</p>
                <p className="text-sm font-medium font-mono">{vehicleDialogOrder.referenceNumber || vehicleDialogOrder.id.slice(0, 8)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateUserForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [seedingAdil, setSeedingAdil] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: "", password: "", role: "client", firstName: "", lastName: "",
    phone: "", company: "", address: "", city: "", postalCode: "",
    taxNumber: "", partnerSharePercent: "", materialPercent: "20", partnerModel: "B",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      partnerSharePercent: form.partnerSharePercent ? parseInt(form.partnerSharePercent) : null,
      materialPercent: parseInt(form.materialPercent) || 20,
    });
    setForm({ email: "", password: "", role: "client", firstName: "", lastName: "", phone: "", company: "", address: "", city: "", postalCode: "", taxNumber: "", partnerSharePercent: "", materialPercent: "20", partnerModel: "B" });
    setOpen(false);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value }));

  async function seedAdil() {
    setSeedingAdil(true);
    try {
      const res = await fetch("/api/admin/seed-adil", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message === "Bereits vorhanden" ? "Adil Lackdoktor existiert bereits" : "Adil Lackdoktor wurde erstellt!", description: "Login: adil@corion-lackdoktor.de / Adil2024!" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      } else {
        toast({ title: "Fehler", description: data.message, variant: "destructive" });
      }
    } finally {
      setSeedingAdil(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)} className="gap-2" data-testid="button-open-create-user">
          <UserPlus className="w-4 h-4" />
          Neuen Benutzer erstellen
        </Button>
        <Button variant="outline" onClick={seedAdil} disabled={seedingAdil} className="gap-2" data-testid="button-seed-adil">
          {seedingAdil ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-500" />}
          Partner Adil Lackdoktor anlegen
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-5" data-testid="form-create-user">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Neuen Benutzer erstellen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> E-Mail *</label>
              <Input type="email" required value={form.email} onChange={set("email")} placeholder="email@example.com" data-testid="input-new-email" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Shield className="w-3 h-3" /> Passwort *</label>
              <Input type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="Min. 6 Zeichen" data-testid="input-new-password" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Rolle</label>
              <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger data-testid="select-new-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Kunde</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Vorname</label>
              <Input value={form.firstName} onChange={set("firstName")} placeholder="Vorname" data-testid="input-new-firstname" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Nachname</label>
              <Input value={form.lastName} onChange={set("lastName")} placeholder="Nachname" data-testid="input-new-lastname" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</label>
              <Input value={form.phone} onChange={set("phone")} placeholder="01556 ..." data-testid="input-new-phone" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Building className="w-3 h-3" /> Firma</label>
              <Input value={form.company} onChange={set("company")} placeholder="Firmenname" data-testid="input-new-company" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</label>
              <Input value={form.address} onChange={set("address")} placeholder="Straße Nr." data-testid="input-new-address" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Stadt</label>
              <Input value={form.city} onChange={set("city")} placeholder="Stadt" data-testid="input-new-city" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">PLZ</label>
              <Input value={form.postalCode} onChange={set("postalCode")} placeholder="PLZ" data-testid="input-new-plz" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Hash className="w-3 h-3" /> Steuernummer</label>
              <Input value={form.taxNumber} onChange={set("taxNumber")} placeholder="26/023/62218" data-testid="input-new-taxnumber" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Percent className="w-3 h-3" /> Anteil % (Partner)</label>
              <Input type="number" min="0" max="100" value={form.partnerSharePercent} onChange={set("partnerSharePercent")} placeholder="z.B. 40" data-testid="input-new-share" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Percent className="w-3 h-3" /> Material-Abzug %</label>
              <Input type="number" min="0" max="100" value={form.materialPercent} onChange={set("materialPercent")} placeholder="20" data-testid="input-new-material-pct" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Partnermodell</label>
              <Select value={form.partnerModel} onValueChange={(v) => setForm(p => ({ ...p, partnerModel: v }))}>
                <SelectTrigger data-testid="select-new-partner-model"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Modell A</SelectItem>
                  <SelectItem value="B">Modell B</SelectItem>
                  <SelectItem value="C">Modell C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.role === "partner" && form.partnerSharePercent && (
            <div className="rounded-md bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Provisionsformel:</span>{" "}
              Partner erhält <strong>{form.partnerSharePercent}%</strong> der Manöver nach Abzug von <strong>{form.materialPercent || 20}%</strong> Material.{" "}
              Teile/Ersatzteile werden nicht eingerechnet.
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-create">Abbrechen</Button>
            <Button type="submit" disabled={isPending} className="gap-2" data-testid="button-submit-create-user">
              <Save className="w-4 h-4" />
              {isPending ? "Wird erstellt..." : "Benutzer erstellen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
