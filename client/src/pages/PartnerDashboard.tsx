import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { applyLanguagePreference } from "@/i18n/LanguageContext";
import SEO from "@/components/SEO";
import {
  LogOut,
  Wrench,
  Bell,
  Shield,
  Home,
  Wallet as WalletIcon,
  Camera as CameraIcon,
  Bot,
  Car,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Send,
  X,
  Image as ImageIcon,
  Loader2,
  Trophy,
  Zap,
  FileText,
  Target,
  Clock,
  Paperclip,
  Cloud,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import HubTokensCounter, {
  deductHubTokens,
} from "@/components/dashboard/HubTokensCounter";
import AiAgentHubMenu from "@/components/dashboard/AiAgentHubMenu";
import FixicoCalendar from "@/components/FixicoCalendar";
import { CalendarDays } from "lucide-react";
import { MaterialsKpiCard } from "@/components/materials/MaterialsKpiCard";
import type { Notification } from "@shared/schema";

type PayoutState = "in_progress" | "not_set" | "pending" | "paid";
type WorkState = "scheduled" | "accepted" | "in_repair" | "ready_pickup" | "delivered" | "cancelled";

type ContactMeta = { name: string; phone: string | null; damage: string | null };

type PartnerFeedJob = {
  id: string;
  title: string;
  description: string;
  contactMeta: ContactMeta;
  status: string;
  licensePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  payoutNetCents: number;
  payoutIsEstimate: boolean;
  payoutState: PayoutState;
  photos: string[];
  completedAt: string | null;
  partnerVisibleDescription?: string;
  damagePhotos?: Array<{ id: string; driveLink?: string | null; mimeType?: string | null }>;
  // operational context
  workState: WorkState;
  scheduledDate: string | null;
  referenceNumber: string | null;
  fileCount: number;
  photoCount: number;
  hasDriveLink: boolean;
  hasLocalFolder: boolean;
  driveFolderUrl: string | null;
};

type PartnerOrderFeedItem = {
  id: string;
  referenceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  damageDescription?: string;
  status?: string;
  paymentStatus?: string;
  totalAmountCents?: number;
  laborAmountCents?: number;
  partnerPayoutNetCents?: number;
  partnerCommissionCalc?: number;
  attachments?: any[];
  scheduledDate?: string | null;
  partnerVisibleDescription?: string;
  damagePhotos?: any[];
  createdAt?: string | null;
  // enriched by /api/partner/my-orders
  driveFolderUrl?: string | null;
  localFolderPath?: string | null;
  appointmentId?: string | null;
};

type Tab = "feed" | "kalender" | "wallet" | "upload" | "meister";

type PartnerLang = "de" | "ro" | "en";

const PARTNER_COPY: Record<PartnerLang, Record<string, string>> = {
  de: {
    loading: "Wird geladen...",
    accessDenied: "Zugriff verweigert",
    accessDeniedDesc: "Sie haben keine Berechtigung für diesen Bereich.",
    seoDesc: "Mobile-first Werkstatt-App für Corion-Partner: Aufträge, Wallet, Uploads & Meister AI.",
    hi: "Hi",
    activeJobs: "aktive Jobs",
    newOrder: "Neuer Auftrag",
    feed: "Feed",
    calendar: "Kalender",
    wallet: "Wallet",
    upload: "Upload",
    meister: "Meister",
    inRepair: "In Reparatur",
    accepted: "Angenommen",
    scheduled: "Geplant",
    readyPickup: "Abholbereit",
    delivered: "Abgeschlossen",
    cancelled: "Storniert",
    vehicle: "Fahrzeug",
    repairOrder: "Reparaturauftrag",
  },
  ro: {
    loading: "Se încarcă...",
    accessDenied: "Acces interzis",
    accessDeniedDesc: "Nu ai permisiune pentru această zonă.",
    seoDesc: "Aplicație mobile-first pentru partenerii Corion: comenzi, wallet, uploaduri și Meister AI.",
    hi: "Salut",
    activeJobs: "lucrări active",
    newOrder: "Lucrare nouă",
    feed: "Feed",
    calendar: "Calendar",
    wallet: "Portofel",
    upload: "Upload",
    meister: "Meșter",
    inRepair: "În reparație",
    accepted: "Acceptat",
    scheduled: "Programat",
    readyPickup: "Pregătit de ridicare",
    delivered: "Finalizat",
    cancelled: "Anulat",
    vehicle: "Vehicul",
    repairOrder: "Comandă reparație",
  },
  en: {
    loading: "Loading...",
    accessDenied: "Access denied",
    accessDeniedDesc: "You do not have permission for this area.",
    seoDesc: "Mobile-first workshop app for Corion partners: jobs, wallet, uploads and Meister AI.",
    hi: "Hi",
    activeJobs: "active jobs",
    newOrder: "New job",
    feed: "Feed",
    calendar: "Calendar",
    wallet: "Wallet",
    upload: "Upload",
    meister: "Meister",
    inRepair: "In repair",
    accepted: "Accepted",
    scheduled: "Scheduled",
    readyPickup: "Ready for pickup",
    delivered: "Completed",
    cancelled: "Cancelled",
    vehicle: "Vehicle",
    repairOrder: "Repair order",
  },
};

function normalizePartnerLang(lang?: string | null): PartnerLang {
  if (lang === "ro" || lang === "en") return lang;
  return "de";
}

function getPartnerCopy(lang?: string | null) {
  return PARTNER_COPY[normalizePartnerLang(lang)];
}

function translateWorkState(workState: WorkState, lang?: string | null): string {
  const t = getPartnerCopy(lang);
  switch (workState) {
    case "accepted": return t.accepted;
    case "in_repair": return t.inRepair;
    case "ready_pickup": return t.readyPickup;
    case "delivered": return t.delivered;
    case "cancelled": return t.cancelled;
    case "scheduled":
    default:
      return t.scheduled;
  }
}

function buildPartnerLabels(lang?: string | null) {
  const base = normalizePartnerLang(lang);
  const isRo = base === "ro";
  const isEn = base === "en";

  return {
    workState: {
      scheduled: isRo ? "Programat" : isEn ? "Scheduled" : "Eingeplant",
      accepted: isRo ? "Acceptat" : isEn ? "Accepted" : "Angenommen",
      in_repair: isRo ? "În reparație" : isEn ? "In repair" : "In Reparatur",
      ready_pickup: isRo ? "Pregătit de ridicare" : isEn ? "Ready for pickup" : "Abholbereit",
      delivered: isRo ? "Predat" : isEn ? "Delivered" : "Übergeben",
      cancelled: isRo ? "Anulat" : isEn ? "Cancelled" : "Storniert",
    },
    payoutState: {
      paid: isRo ? "Plătit" : isEn ? "Paid" : "Bezahlt",
      pending: isRo ? "În așteptare" : isEn ? "Pending" : "Ausstehend",
      not_set: isRo ? "Lipsește suma" : isEn ? "Amount missing" : "Betrag fehlt",
      in_progress: isRo ? "În lucru" : isEn ? "In progress" : "In Arbeit",
    },
    subLabel: {
      scheduled_no_date: isRo ? "Programarea nu este încă setată" : isEn ? "Appointment not set yet" : "Termin noch nicht festgelegt",
      scheduled_overdue: isRo ? "Programare depășită, verifică preluarea" : isEn ? "Appointment overdue, check intake" : "Termin überfällig — Abnahme prüfen",
      scheduled_set: isRo ? "Programarea este setată" : isEn ? "Appointment is set" : "Termin steht — Abnahme bevorstehend",
      accepted_no_files: isRo ? "Încarcă pozele" : isEn ? "Upload photos" : "Fotos hochladen",
      accepted_ready: isRo ? "Gata pentru reparație" : isEn ? "Ready for repair" : "Bereit zur Reparatur",
      in_repair_no_files: isRo ? "Pozele încă lipsesc" : isEn ? "Photos still missing" : "Fotos fehlen noch",
      in_repair_running: isRo ? "Reparația este în lucru" : isEn ? "Repair in progress" : "Reparatur läuft",
      ready_pickup: isRo ? "Gata, așteaptă ridicarea clientului" : isEn ? "Done, waiting for customer pickup" : "Fertig — warte auf Kundenabholung",
      delivered_not_set: isRo ? "Suma de plată nu este setată" : isEn ? "Payout amount not set" : "Auszahlungsbetrag noch nicht gesetzt",
      delivered_pending: isRo ? "Plata clientului este în așteptare" : isEn ? "Customer payment pending" : "Kundenzahlung ausstehend",
      delivered_paid: isRo ? "Totul este finalizat" : isEn ? "Fully completed" : "Vollständig abgeschlossen",
    },
    action: {
      admin_set_payout: isRo ? "Adminul trebuie să seteze suma" : isEn ? "Admin must set payout amount" : "Admin muss Auszahlungsbetrag setzen",
      wait_customer: isRo ? "Așteaptă plata clientului" : isEn ? "Wait for customer payment" : "Warte auf Kundenzahlung",
      prepare_handover: isRo ? "Pregătește predarea către client" : isEn ? "Prepare handover to customer" : "Übergabe an Kunden vorbereiten",
      upload_photos: isRo ? "Încarcă pozele comenzii" : isEn ? "Upload order photos" : "Fotos zum Auftrag hochladen",
      finish_repair: isRo ? "Finalizează reparația și setează statusul" : isEn ? "Finish repair and set status" : "Reparatur abschließen und Status setzen",
      upload_photos_tab: isRo ? "Încarcă pozele (tab Upload)" : isEn ? "Upload photos (Uploads tab)" : "Fotos hochladen (Tab: Uploads)",
      start_repair: isRo ? "Începe reparația" : isEn ? "Start repair" : "Reparatur beginnen",
      appt_not_set: isRo ? "Programarea nu este setată" : isEn ? "Appointment not set" : "Termin noch nicht gesetzt",
      appt_overdue: isRo ? "Programare depășită, acceptă comanda" : isEn ? "Appointment overdue, accept job" : "Termin überfällig — Auftrag annehmen",
      wait_appointment: isRo ? "Așteaptă programarea" : isEn ? "Wait for appointment" : "Termin abwarten",
      cta_accept: isRo ? "Acceptă comanda" : isEn ? "Accept job" : "Auftrag annehmen",
      cta_start_repair: isRo ? "Începe reparația" : isEn ? "Start repair" : "Reparatur beginnen",
      cta_upload_required: isRo ? "Încarcă poze (obligatoriu)" : isEn ? "Upload photos (required)" : "Fotos hochladen (Pflicht)",
      cta_complete_repair: isRo ? "Finalizează reparația" : isEn ? "Complete repair" : "Reparatur abschließen",
      cta_awaiting_pickup: isRo ? "Gata, așteaptă ridicarea" : isEn ? "Done, waiting for pickup" : "Fertig — Warte auf Abholung",
    },
    toast: {
      accepted_title: isRo ? "Comandă acceptată" : isEn ? "Job accepted" : "Auftrag angenommen",
      repair_started: isRo ? "Reparația a început" : isEn ? "Repair started" : "Reparatur gestartet",
      repair_done_title: isRo ? "Reparația a fost finalizată" : isEn ? "Repair completed" : "Reparatur abgeschlossen",
      repair_done_desc: isRo ? "Așteaptă ridicarea clientului" : isEn ? "Waiting for customer pickup" : "Warte auf Kundenabholung",
      upload_needed: isRo ? "Mai întâi încarcă pozele" : isEn ? "Please upload photos first" : "Bitte erst Fotos hochladen",
      upload_needed_desc: isRo ? "Este necesară cel puțin o poză pentru finalizare." : isEn ? "At least one photo is required for completion." : "Mindestens ein Foto ist für den Abschluss erforderlich.",
      generic_error: isRo ? "Eroare" : isEn ? "Error" : "Fehler",
      saving: isRo ? "Se salvează..." : isEn ? "Saving..." : "Wird gespeichert...",
    },
    completedState: {
      paid:        { text: isRo ? "Finalizat — Plătit ✓" : isEn ? "Completed — Paid ✓" : "Abgeschlossen — Bezahlt ✓",                cls: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" },
      pending:     { text: isRo ? "Finalizat — Plata în așteptare" : isEn ? "Completed — Payout pending" : "Abgeschlossen — Auszahlung ausstehend",     cls: "bg-blue-500/15 border-blue-500/40 text-blue-400" },
      not_set:     { text: isRo ? "Finalizat — Suma nu este setată" : isEn ? "Completed — Amount not set" : "Abgeschlossen — Betrag noch nicht gesetzt", cls: "bg-amber-500/15 border-amber-500/40 text-amber-400" },
      in_progress: { text: isRo ? "Finalizat" : isEn ? "Completed" : "Abgeschlossen",                             cls: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" },
    } as Record<PayoutState, { text: string; cls: string }>,
    date: {
      overdue_prefix: isRo ? "Depășit · " : isEn ? "Overdue · " : "Überfällig · ",
      today_prefix: isRo ? "Astăzi · " : isEn ? "Today · " : "Heute · ",
      tomorrow_prefix: isRo ? "Mâine · " : isEn ? "Tomorrow · " : "Morgen · ",
      no_appt: isRo ? "Nicio programare setată" : isEn ? "No appointment set" : "Kein Termin gesetzt",
    },
    files: {
      none: isRo ? "Fără fișiere" : isEn ? "No files" : "Keine Dateien",
      drive_open: isRo ? "Deschide Drive" : isEn ? "Open Drive" : "Drive öffnen",
      drive: "Drive",
      no_drive: isRo ? "Fără Drive" : isEn ? "No Drive" : "Kein Drive",
      photo_singular: isRo ? "poză" : isEn ? "photo" : "Foto",
      photo_plural: isRo ? "poze" : isEn ? "photos" : "Fotos",
      file_singular: isRo ? "fișier" : isEn ? "file" : "Datei",
      file_plural: isRo ? "fișiere" : isEn ? "files" : "Dateien",
    },
    contact: {
      no_name: "—",
    },
    misc: {
      progress_aria: isRo ? "Progres comandă" : isEn ? "Job progress" : "Auftragsfortschritt",
      no_reference: isRo ? "Fără ref." : isEn ? "No ref." : "Keine Ref.",
      amount_not_set_admin: isRo ? "Suma nu este încă setată de admin" : isEn ? "Amount not yet set by admin" : "Betrag noch nicht vom Admin gesetzt",
      waiting_customer_payment: isRo ? "așteaptă plata clientului" : isEn ? "waiting for customer payment" : "wartet auf Kundenzahlung",
      estimated_value: isRo ? "Valoare estimată" : isEn ? "Estimated value" : "Schätzwert",
      posting_done: isRo ? "Postare publicată!" : isEn ? "Post published!" : "Post veröffentlicht!",
      posting_done_desc: isRo ? "Story-ul tău înainte/după este live." : isEn ? "Your before/after story is live." : "Deine Vorher/Nachher Story ist live.",
      upload_header_prefix: isRo ? "Nou" : isEn ? "New" : "Neuer",
      upload_header_highlight: isRo ? "Înainte/După" : isEn ? "Before/After" : "Vorher/Nachher",
      upload_subtitle: isRo ? "Arată-ți meseria. Cele mai bune postări ajung în profilul public." : isEn ? "Show your craft. Top posts appear in the public profile." : "Zeig dein Handwerk. Top-Posts kommen ins öffentliche Profil.",
      caption: isRo ? "Descriere" : isEn ? "Caption" : "Caption",
      caption_placeholder: isRo ? "Care a fost provocarea? Ce tehnică ai folosit?" : isEn ? "What was the challenge? Which technique did you use?" : "Was war die Herausforderung? Welche Technik?",
      link_job: isRo ? "Leagă de o lucrare (opțional)" : isEn ? "Link a job (optional)" : "Job verknüpfen (optional)",
      no_job_linked: isRo ? "Nicio lucrare legată" : isEn ? "No linked job" : "Kein Job verknüpft",
      posting: isRo ? "Se postează..." : isEn ? "Posting..." : "Wird gepostet...",
      post: isRo ? "POSTEAZĂ" : isEn ? "POST" : "POSTEN",
      remove_photo: isRo ? "Șterge poza" : isEn ? "Remove photo" : "Foto entfernen",
      meister_welcome: isRo ? "Salut! Eu sunt Meister 🛠️, cu ce te ajut? Alege o comandă mai jos." : isEn ? "Hey! I'm Meister 🛠️, what do you need? Tap a command below." : "Servus! Ich bin der Meister 🛠️ — was brauchst du? Tipp einen Befehl unten an.",
      commands: isRo ? "Comenzi" : isEn ? "Commands" : "Befehle",
      required_fields_missing: isRo ? "Lipsesc câmpuri obligatorii" : isEn ? "Required fields missing" : "Pflichtfelder fehlen",
      close: isRo ? "Închide" : isEn ? "Close" : "Schließen",
      no_inputs_needed: isRo ? "Nu sunt necesare date, poți trimite direct." : isEn ? "No inputs needed, you can submit directly." : "Keine Eingaben benötigt — direkt absenden.",
      select_placeholder: isRo ? "Alege..." : isEn ? "Select..." : "Auswählen...",
      send_to_meister: isRo ? "Trimite la Meister AI" : isEn ? "Send to Meister AI" : "An Meister AI senden",
      sending: isRo ? "Se trimite..." : isEn ? "Sending..." : "Sende...",
      typing: isRo ? "Scrie..." : isEn ? "Typing..." : "Tippt...",
      no_response: isRo ? "Nu am primit răspuns." : isEn ? "No response received." : "Keine Antwort erhalten.",
      request_failed: isRo ? "Cererea nu a putut fi procesată." : isEn ? "The request could not be processed." : "Konnte die Anfrage nicht bearbeiten.",
      please_retry: isRo ? "Te rog încearcă din nou." : isEn ? "Please try again." : "Bitte erneut versuchen.",
      pipeline_overview: isRo ? "📊 Rezumat pipeline" : isEn ? "📊 Pipeline overview" : "📊 Pipeline-Übersicht",
      open_offers: isRo ? "Oferte deschise" : isEn ? "Open offers" : "Offene Angebote",
      accepted_offers: isRo ? "Acceptate" : isEn ? "Accepted" : "Akzeptiert",
      win_rate: isRo ? "Rată de succes" : isEn ? "Win rate" : "Erfolgsquote",
      recommendations: isRo ? "Recomandări" : isEn ? "Recommendations" : "Empfehlungen",
      opening: isRo ? "Deschidere" : isEn ? "Opening" : "Eröffnung",
      key_points: isRo ? "Puncte cheie" : isEn ? "Key points" : "Kernpunkte",
      objections: isRo ? "Obiecții" : isEn ? "Objections" : "Einwände",
      services: isRo ? "Servicii" : isEn ? "Services" : "Leistungen",
      tips: isRo ? "💡 Sfaturi" : isEn ? "💡 Tips" : "💡 Tipps",
    },
  } as const;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function PartnerDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("feed");
  const partnerLang = normalizePartnerLang((user as any)?.preferredLanguage);
  const copy = getPartnerCopy(partnerLang);

  const { data: partnerOrders = [], isLoading: loadingPartnerOrders } = useQuery<PartnerOrderFeedItem[]>({
    queryKey: ["/api/partner/my-orders"],
    queryFn: async () => {
      const res = await fetch("/api/partner/my-orders", { credentials: "include" });
      if (!res.ok) throw new Error("Partner orders could not be loaded");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role !== "partner" &&
      user?.role !== "admin"
    ) {
      toast({
        variant: "destructive",
        title: copy.accessDenied,
        description: copy.accessDeniedDesc,
      });
      navigate("/");
    }
  }, [isAuthenticated, isLoading, user, navigate, toast, copy.accessDenied, copy.accessDeniedDesc]);

  useEffect(() => {
    applyLanguagePreference(partnerLang);
  }, [partnerLang]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  if (isLoading || loadingPartnerOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">{copy.loading}</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const orderFeedItems: PartnerFeedJob[] = (partnerOrders || []).map((order) => {
    const allAttachments = order.attachments || [];
    const imageAttachments = allAttachments.filter((att: any) => att?.mimeType?.startsWith("image/"));
    const rawStatus = order.status ?? "open";
    const isComplete = rawStatus === "completed";

    const workStateMap: Record<string, WorkState> = {
      open: "scheduled",
      angenommen: "accepted",
      in_bearbeitung: "in_repair",
      fertig: "ready_pickup",
      completed: "delivered",
      cancelled: "cancelled",
    };
    const workState: WorkState = workStateMap[rawStatus] ?? "scheduled";

    // Use the persisted net payout if set; fall back to the calc estimate.
    const hasNetPayout = (order.partnerPayoutNetCents ?? 0) > 0;
    const payoutNetCents = hasNetPayout
      ? (order.partnerPayoutNetCents ?? 0)
      : (order.partnerCommissionCalc ?? 0);
    const payoutIsEstimate = !hasNetPayout;

    // Three real payout states for completed jobs:
    //   not_set   — completed but admin hasn't defined the payout amount yet
    //   pending   — payout defined, customer hasn't settled yet
    //   paid      — customer settled (paymentStatus = bezahlt/paid)
    let payoutState: PayoutState = "in_progress";
    if (isComplete) {
      const customerPaid =
        order.paymentStatus === "bezahlt" || order.paymentStatus === "paid";
      if (!hasNetPayout) {
        payoutState = "not_set";
      } else if (customerPaid) {
        payoutState = "paid";
      } else {
        payoutState = "pending";
      }
    }

    return {
      id: order.id,
      title: `${order.vehicleMake || copy.vehicle} ${order.vehicleModel || ""}`.trim() || copy.repairOrder,
      description: `${order.customerName || "—"}${order.customerPhone ? ` · ${order.customerPhone}` : ""}${(order.partnerVisibleDescription || order.damageDescription) ? ` · ${order.partnerVisibleDescription || order.damageDescription}` : ""}`,
      contactMeta: {
        name: order.customerName || "—",
        phone: order.customerPhone ?? null,
        damage: order.damageDescription ?? null,
      },
      status: rawStatus,
      licensePlate: order.vehiclePlate || "—",
      vehicleMake: order.vehicleMake || "",
      vehicleModel: order.vehicleModel || "",
      vehicleYear: "",
      payoutNetCents,
      payoutIsEstimate,
      payoutState,
      photos: ((order.damagePhotos?.length ? order.damagePhotos : imageAttachments) || []).map((att: any) => att.serveUrl || (att.id ? `/api/admin/workshop-orders/files/${att.id}` : null) || att.driveLink || att.url).filter(Boolean),
      completedAt: isComplete
        ? (order.scheduledDate ?? order.createdAt ?? new Date().toISOString())
        : null,
      // operational context
      workState,
      scheduledDate: order.scheduledDate ?? null,
      referenceNumber: order.referenceNumber ?? null,
      fileCount: allAttachments.length,
      photoCount: imageAttachments.length,
      hasDriveLink: !!(order.driveFolderUrl),
      hasLocalFolder: !!(order.localFolderPath),
      driveFolderUrl: order.driveFolderUrl ?? null,
    };
  });

  // Buckets: workState is the canonical display truth — use it, not raw status strings.
  const activeRequests = orderFeedItems.filter(
    (r) => r.workState !== "delivered" && r.workState !== "cancelled",
  );
  const completedRequests = orderFeedItems.filter((r) => r.workState === "delivered");

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <SEO
        title="Partner Portal | Corion Lackdoktor"
        description={copy.seoDesc}
      />

      {/* ── STICKY TOP CHROME ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-zinc-900">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/40">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div
                className="text-sm font-extrabold leading-tight tracking-tight truncate"
                data-testid="text-title"
              >
                Corion <span className="text-red-500">Partner</span>
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {user?.company || user?.firstName || user?.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <AiAgentHubMenu />
            <HubTokensCounter />
            <Button
              variant="ghost"
              size="icon"
              className="relative text-zinc-300"
              data-testid="button-notifications"
              aria-label="Benachrichtigungen"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-zinc-300"
              data-testid="button-logout"
              aria-label="Abmelden"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN SCROLL AREA ──────────────────────────────────────── */}
      <main className="max-w-xl mx-auto" data-testid={`tab-content-${tab}`}>
        {tab === "feed" && (
          <FeedTab
            jobs={activeRequests}
            partnerName={user?.firstName ?? user?.company ?? "Partner"}
            onNeedUpload={() => setTab("upload")}
            lang={partnerLang}
          />
        )}
        {tab === "kalender" && (
          <div className="px-3 pt-3 pb-2">
            <FixicoCalendar
              orders={partnerOrders.map((order) => ({
                id: order.id,
                referenceNumber: order.referenceNumber ?? null,
                vehicleMake: order.vehicleMake ?? null,
                vehicleModel: order.vehicleModel ?? null,
                vehiclePlate: order.vehiclePlate ?? null,
                customerName: order.customerName ?? null,
                status: order.status ?? null,
                totalAmountCents: order.totalAmountCents ?? order.laborAmountCents ?? null,
                scheduledDate: (order as any).scheduledDate ?? null,
                createdAt: (order as any).createdAt ?? null,
              }))}
            />
          </div>
        )}
        {tab === "wallet" && user?.id && (
          <div className="px-3 pt-3">
            <MaterialsKpiCard partnerId={user.id} variant="dark" />
          </div>
        )}
        {tab === "wallet" && (
          <WalletTab
            completed={completedRequests}
            active={activeRequests}
          />
        )}
        {tab === "upload" && (
          <UploadTab activeRequests={activeRequests} lang={partnerLang} />
        )}
        {tab === "meister" && <MeisterTab lang={partnerLang} />}
      </main>

      {/* ── BOTTOM NAV ────────────────────────────────────────────── */}
      <BottomNav tab={tab} setTab={setTab} pendingCount={activeRequests.length} lang={partnerLang} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FEED TAB — vertical Instagram-style job posts
// ════════════════════════════════════════════════════════════════════════════

function FeedTab({
  jobs,
  partnerName,
  onNeedUpload,
  lang,
}: {
  jobs: PartnerFeedJob[];
  partnerName: string;
  onNeedUpload: () => void;
  lang: string | null | undefined;
}) {
  const { toast } = useToast();
  const copy = getPartnerCopy(lang);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ vehiclePlate: "", vehicleMake: "", vehicleModel: "", customerName: "", customerPhone: "", damageDescription: "", notes: "" });

  const newAuftragMutation = useMutation({
    mutationFn: async (data: typeof newForm) => {
      const res = await fetch("/api/partner/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? (lang === "ro" ? "Comanda nu a putut fi creată." : lang === "en" ? "Job could not be created." : "Auftrag konnte nicht erstellt werden."));
      }
      return res.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/my-orders"] });
      setShowNewForm(false);
      setNewForm({ vehiclePlate: "", vehicleMake: "", vehicleModel: "", customerName: "", customerPhone: "", damageDescription: "", notes: "" });
      const pending: string[] = result?.pendingSteps ?? [];
      toast({
        title: `${lang === "ro" ? "Comandă trimisă" : lang === "en" ? "Job submitted" : "Auftrag eingereicht"} — ${result?.referenceNumber ?? ""}`,
        description: pending.length > 0 ? `${lang === "ro" ? "Încă deschis" : lang === "en" ? "Still open" : "Noch offen"}: ${pending.join(", ")}` : (lang === "ro" ? "Comanda a ajuns la admin." : lang === "en" ? "The job reached admin." : "Auftrag ist beim Admin eingegangen."),
      });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: lang === "ro" ? "Eroare" : lang === "en" ? "Error" : "Fehler", description: err.message });
    },
  });

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.vehiclePlate || !newForm.vehicleMake || !newForm.customerName || !newForm.damageDescription) return;
    newAuftragMutation.mutate(newForm);
  };

  return (
    <div className="px-3 pt-3 pb-2 space-y-4">
      {/* Header row with "Neuer Auftrag" CTA */}
      <div className="px-1 flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">
          {copy.hi} {partnerName.split(" ")[0]}{" "}
          <span className="text-red-500">👋</span>
        </h2>
        <div className="flex items-center gap-2">
          {jobs.length > 0 && (
            <span className="text-xs font-semibold text-zinc-500">{jobs.length} {copy.activeJobs}</span>
          )}
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full transition-colors shadow-md shadow-red-900/40"
            data-testid="button-new-auftrag"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            {copy.newOrder}
          </button>
        </div>
      </div>

      {/* Inline new-Auftrag form — partner-initiated intake */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
            data-testid="form-new-auftrag"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white">{lang === "ro" ? "Trimite comandă nouă" : lang === "en" ? "Submit new job" : "Neuer Auftrag einreichen"}</span>
              <button onClick={() => setShowNewForm(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleNewSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Număr *" : lang === "en" ? "Plate *" : "Kennzeichen *"}</label>
                  <Input value={newForm.vehiclePlate} onChange={(e) => setNewForm((p) => ({ ...p, vehiclePlate: e.target.value }))} placeholder="WI AB 1234" className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Marcă *" : lang === "en" ? "Make *" : "Marke *"}</label>
                  <Input value={newForm.vehicleMake} onChange={(e) => setNewForm((p) => ({ ...p, vehicleMake: e.target.value }))} placeholder="BMW, VW …" className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Model" : lang === "en" ? "Model" : "Modell"}</label>
                  <Input value={newForm.vehicleModel} onChange={(e) => setNewForm((p) => ({ ...p, vehicleModel: e.target.value }))} placeholder="320i, Golf …" className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Nume client *" : lang === "en" ? "Customer name *" : "Kundenname *"}</label>
                  <Input value={newForm.customerName} onChange={(e) => setNewForm((p) => ({ ...p, customerName: e.target.value }))} placeholder="Max Mustermann" className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Telefon" : lang === "en" ? "Phone" : "Telefon"}</label>
                <Input value={newForm.customerPhone} onChange={(e) => setNewForm((p) => ({ ...p, customerPhone: e.target.value }))} placeholder="+49 …" className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Descriere daună *" : lang === "en" ? "Damage description *" : "Schadensbeschreibung *"}</label>
                <Textarea value={newForm.damageDescription} onChange={(e) => setNewForm((p) => ({ ...p, damageDescription: e.target.value }))} placeholder="Kratzer vorne links, Delle …" className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[60px]" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{lang === "ro" ? "Notițe" : lang === "en" ? "Notes" : "Notizen"}</label>
                <Input value={newForm.notes} onChange={(e) => setNewForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional …" className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm" />
              </div>
              <p className="text-[10px] text-zinc-600 leading-snug">{lang === "ro" ? "Comanda este trimisă la admin pentru verificare. Vei fi salvat ca inițiator." : lang === "en" ? "The job is sent to admin for review. You will be stored as the creator." : "Der Auftrag wird zur Prüfung an den Admin weitergeleitet. Du wirst als Ersteller gespeichert."}</p>
              <button
                type="submit"
                disabled={newAuftragMutation.isPending || !newForm.vehiclePlate || !newForm.vehicleMake || !newForm.customerName || !newForm.damageDescription}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-black text-sm tracking-wide shadow-lg shadow-red-900/40 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              >
                {newAuftragMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "ro" ? "Se trimite..." : lang === "en" ? "Submitting..." : "Wird eingereicht…"}</> : <><Send className="w-4 h-4" /> {lang === "ro" ? "Trimite comanda" : lang === "en" ? "Submit job" : "Auftrag einreichen"}</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={lang === "ro" ? "Nu există lucrări deschise" : lang === "en" ? "No open jobs" : "Keine offenen Aufträge"}
          subtitle={lang === "ro" ? `Foarte bine, ${partnerName}! Totul este rezolvat. Lucrările noi apar automat aici.` : lang === "en" ? `Nice work, ${partnerName}! Everything is handled. New jobs appear here automatically.` : `Stark, ${partnerName}! Alles abgearbeitet. Neue Aufträge erscheinen automatisch hier.`}
        />
      ) : (
        jobs.map((job) => (
          <JobCard key={job.id} job={job} onNeedUpload={onNeedUpload} lang={lang} />
        ))
      )}
    </div>
  );
}

// ── i18n-ready string store ───────────────────────────────────────────────────
// All user-visible labels live here. Replace with a locale hook when i18n lands.
function WorkStateBadge({ state, lang }: { state: WorkState; lang?: string | null }) {
  const labels = buildPartnerLabels(lang);
  const cfg: Record<WorkState, { label: string; cls: string }> = {
    scheduled:    { label: labels.workState.scheduled,    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    accepted:     { label: labels.workState.accepted,     cls: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
    in_repair:    { label: labels.workState.in_repair,    cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    ready_pickup: { label: labels.workState.ready_pickup, cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    delivered:    { label: labels.workState.delivered,    cls: "bg-zinc-700 text-zinc-400 border-zinc-600" },
    cancelled:    { label: labels.workState.cancelled,    cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const { label, cls } = cfg[state];
  return (
    <span className={`inline-flex items-center border rounded-full text-xs font-semibold px-2.5 py-1 ${cls}`}>
      {label}
    </span>
  );
}

// Compact 5-dot progress strip — shows position in the workflow without labels.
// WorkStateBadge already names the current stage; this gives the positional feeling.
const PROGRESS_STEPS: WorkState[] = ["scheduled", "accepted", "in_repair", "ready_pickup", "delivered"];

function ProgressStrip({ workState, lang }: { workState: WorkState; lang?: string | null }) {
  if (workState === "cancelled") return null;
  const labels = buildPartnerLabels(lang);
  const currentIdx = PROGRESS_STEPS.indexOf(workState);

  return (
    <div className="flex items-center" aria-label={labels.misc.progress_aria}>
      {PROGRESS_STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step} className={`flex items-center ${i < PROGRESS_STEPS.length - 1 ? "flex-1" : ""}`}>
            <div
              className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors ${
                isDone
                  ? "bg-emerald-500 border-emerald-500"
                  : isCurrent
                    ? "bg-primary border-primary ring-2 ring-primary/25"
                    : "bg-transparent border-zinc-700"
              }`}
            />
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${isDone ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// One-phrase contextual description of what is specifically happening or blocking.
function workStageSubLabel(job: PartnerFeedJob, lang?: string | null): string | null {
  const sl = buildPartnerLabels(lang).subLabel;
  switch (job.workState) {
    case "scheduled":
      if (!job.scheduledDate) return sl.scheduled_no_date;
      return classifyDate(job.scheduledDate) === "overdue" ? sl.scheduled_overdue : sl.scheduled_set;
    case "accepted":
      return job.fileCount === 0 ? sl.accepted_no_files : sl.accepted_ready;
    case "in_repair":
      return job.fileCount === 0 ? sl.in_repair_no_files : sl.in_repair_running;
    case "ready_pickup":
      return sl.ready_pickup;
    case "delivered":
      if (job.payoutState === "not_set") return sl.delivered_not_set;
      if (job.payoutState === "pending") return sl.delivered_pending;
      if (job.payoutState === "paid") return sl.delivered_paid;
      return null;
    case "cancelled":
      return null;
  }
}

function PayoutStatePill({ state, small, lang }: { state: PayoutState; small?: boolean; lang?: string | null }) {
  const labels = buildPartnerLabels(lang);
  const cfg: Record<PayoutState, { label: string; cls: string }> = {
    paid:        { label: labels.payoutState.paid,        cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    pending:     { label: labels.payoutState.pending,     cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    not_set:     { label: labels.payoutState.not_set,     cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    in_progress: { label: labels.payoutState.in_progress, cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  };
  const { label, cls } = cfg[state];
  const size = small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center border rounded-full font-semibold ${size} ${cls}`}>
      {label}
    </span>
  );
}

// ── Date classification ───────────────────────────────────────────────────────

type DateClass = "none" | "overdue" | "today" | "tomorrow" | "soon" | "future";

function classifyDate(iso: string | null): DateClass {
  if (!iso) return "none";
  const apptDay = new Date(new Date(iso).toDateString());
  const todayDay = new Date(new Date().toDateString());
  const diff = Math.round((apptDay.getTime() - todayDay.getTime()) / 86_400_000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "soon";
  return "future";
}

function DateRow({ scheduledDate, lang }: { scheduledDate: string | null; lang?: string | null }) {
  const labels = buildPartnerLabels(lang);
  const cfg: Record<DateClass, { prefix: string; cls: string; iconCls: string }> = {
    none:     { prefix: "",                          cls: "text-zinc-600",  iconCls: "text-zinc-700" },
    overdue:  { prefix: labels.date.overdue_prefix,  cls: "text-rose-400 font-semibold", iconCls: "text-rose-500" },
    today:    { prefix: labels.date.today_prefix,    cls: "text-amber-400 font-semibold",  iconCls: "text-amber-400" },
    tomorrow: { prefix: labels.date.tomorrow_prefix, cls: "text-amber-300", iconCls: "text-amber-400" },
    soon:     { prefix: "",                          cls: "text-zinc-200",  iconCls: "text-zinc-400" },
    future:   { prefix: "",                          cls: "text-zinc-400",  iconCls: "text-zinc-500" },
  };
  const cls = classifyDate(scheduledDate);
  const { prefix, cls: textCls, iconCls } = cfg[cls];

  const CalIcon = cls === "overdue" ? AlertCircle : CalendarDays;

  const label = scheduledDate
    ? prefix + new Date(scheduledDate).toLocaleDateString("de-DE", {
        weekday: "short", day: "2-digit", month: "short",
        ...(cls === "future" ? { year: "numeric" } : {}),
      })
    : labels.date.no_appt;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <CalIcon className={`w-3.5 h-3.5 shrink-0 ${iconCls}`} />
      <span className={textCls}>{label}</span>
    </div>
  );
}

// ── Files + Drive row ─────────────────────────────────────────────────────────

function FilesRow({ fileCount, photoCount, hasDriveLink, driveFolderUrl, lang }: {
  fileCount: number;
  photoCount: number;
  hasDriveLink: boolean;
  driveFolderUrl: string | null;
  lang?: string | null;
}) {
  const labels = buildPartnerLabels(lang);
  const fileLabel = fileCount === 0
    ? labels.files.none
    : photoCount > 0 && photoCount < fileCount
      ? `${fileCount} ${labels.files.file_plural} (${photoCount} ${labels.files.photo_plural})`
      : photoCount > 0
        ? `${photoCount} ${photoCount === 1 ? labels.files.photo_singular : labels.files.photo_plural}`
        : `${fileCount} ${fileCount === 1 ? labels.files.file_singular : labels.files.file_plural}`;

  const fileCls = fileCount === 0
    ? "text-zinc-600 border-zinc-800"
    : "text-zinc-300 bg-zinc-800 border-zinc-700";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 ${fileCls}`}>
        <Paperclip className="w-3 h-3" />
        {fileLabel}
      </span>

      {hasDriveLink && driveFolderUrl ? (
        <a
          href={driveFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5 hover:bg-emerald-500/20 transition-colors"
          data-testid="link-drive"
        >
          <Cloud className="w-3 h-3" />
          {labels.files.drive_open}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ) : hasDriveLink ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500/60 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
          <Cloud className="w-3 h-3" />
          {labels.files.drive}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
          <Cloud className="w-3 h-3" />
          {labels.files.no_drive}
        </span>
      )}
    </div>
  );
}

// ── Next-action logic ────────────────────────────────────────────────────────

type NextAction = {
  text: string;
  type: "action" | "waiting" | "blocked";
} | null;

function getNextAction(job: PartnerFeedJob, lang?: string | null): NextAction {
  const a = buildPartnerLabels(lang).action;
  if (job.workState === "cancelled") return null;
  if (job.workState === "delivered" && job.payoutState === "paid") return null;

  if (job.workState === "delivered") {
    if (job.payoutState === "not_set") return { text: a.admin_set_payout, type: "blocked" };
    if (job.payoutState === "pending") return { text: a.wait_customer,    type: "waiting" };
  }

  if (job.workState === "ready_pickup")
    return { text: a.prepare_handover, type: "action" };

  if (job.workState === "in_repair") {
    if (job.fileCount === 0) return { text: a.upload_photos, type: "action" };
    return { text: a.finish_repair, type: "action" };
  }

  if (job.workState === "accepted") {
    if (job.fileCount === 0) return { text: a.upload_photos_tab, type: "action" };
    return { text: a.start_repair, type: "action" };
  }

  if (job.workState === "scheduled") {
    if (!job.scheduledDate) return { text: a.appt_not_set, type: "waiting" };
    const isPast = new Date(job.scheduledDate) < new Date();
    if (isPast) return { text: a.appt_overdue, type: "action" };
    return { text: a.wait_appointment, type: "waiting" };
  }

  return null;
}

const NEXT_ACTION_CFG = {
  action:  { cls: "bg-orange-500/10 border-orange-500/25 text-orange-400", Icon: ArrowRight },
  waiting: { cls: "bg-zinc-800/80 border-zinc-700 text-zinc-400",          Icon: Clock },
  blocked: { cls: "bg-amber-500/10 border-amber-500/25 text-amber-400",    Icon: AlertCircle },
} as const;

function NextActionHint({ job, lang }: { job: PartnerFeedJob; lang?: string | null }) {
  const action = getNextAction(job, lang);
  if (!action) return null;
  const { cls, Icon } = NEXT_ACTION_CFG[action.type];
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cls}`}
      data-testid={`next-action-${job.id}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs font-semibold leading-tight">{action.text}</span>
    </div>
  );
}

// ── Stage-aware CTA derivation ───────────────────────────────────────────────────

type StageAction = {
  label: string;
  nextStatus: string | null; // null → open upload tab, no status advance
  gradientCls: string;
  Icon: typeof CheckCircle2;
};

function getStageAction(job: PartnerFeedJob, lang?: string | null): StageAction | null {
  const a = buildPartnerLabels(lang).action;
  switch (job.workState) {
    case "scheduled":
      return { label: a.cta_accept, nextStatus: "angenommen", gradientCls: "from-blue-500 to-blue-700 shadow-blue-900/50 hover:shadow-blue-900/80", Icon: CheckCircle2 };
    case "accepted":
      return { label: a.cta_start_repair, nextStatus: "in_bearbeitung", gradientCls: "from-orange-500 to-orange-700 shadow-orange-900/50 hover:shadow-orange-900/80", Icon: Wrench };
    case "in_repair":
      if (job.fileCount === 0)
        return { label: a.cta_upload_required, nextStatus: null, gradientCls: "from-amber-500 to-amber-700 shadow-amber-900/50 hover:shadow-amber-900/80", Icon: CameraIcon };
      return { label: a.cta_complete_repair, nextStatus: "fertig", gradientCls: "from-emerald-500 to-emerald-700 shadow-emerald-900/50 hover:shadow-emerald-900/80", Icon: CheckCircle2 };
    case "ready_pickup":
    case "delivered":
    case "cancelled":
      return null;
  }
}

// ── ContactRow — structured customer info (i18n-friendly: each field is separate) ──

function ContactRow({ meta }: { meta: ContactMeta }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-zinc-200 leading-tight truncate">
        {meta.name}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {meta.phone && (
          <span className="text-xs text-zinc-500">{meta.phone}</span>
        )}
        {meta.damage && (
          <span className="text-xs text-zinc-600 italic line-clamp-1">{meta.damage}</span>
        )}
      </div>
    </div>
  );
}

// ── JobCard ───────────────────────────────────────────────────────────────────

function JobCard({ job, onNeedUpload, lang }: { job: PartnerFeedJob; onNeedUpload: () => void; lang?: string | null }) {
  const { toast } = useToast();
  const labels = buildPartnerLabels(lang);
  const [meisterOpen, setMeisterOpen] = useState(false);
  const [meisterData, setMeisterData] = useState<any | null>(null);
  const [meisterInput, setMeisterInput] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = job.photos?.[0];
  const photoCount = job.photos?.length || 0;
  const activePhoto = photoCount > 0 ? job.photos?.[photoIndex] || job.photos?.[0] : undefined;
  const payoutCents = job.payoutNetCents ?? 0;
  const payoutEur = (payoutCents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const stageAction = getStageAction(job, lang);

  const advanceMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/workshop-orders/${job.id}/partner-status`,
        { status: nextStatus },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Unbekannter Fehler");
      }
      return res.json();
    },
    onSuccess: (_data, nextStatus) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/my-orders"] });
      const t = labels.toast;
      if (nextStatus === "angenommen") toast({ title: t.accepted_title });
      else if (nextStatus === "in_bearbeitung") toast({ title: t.repair_started });
      else if (nextStatus === "fertig") toast({ title: t.repair_done_title, description: t.repair_done_desc });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: labels.toast.generic_error, description: err.message || buildPartnerLabels(lang).misc.please_retry });
    },
  });

  const meisterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/meister-ai/auftrag-assist", { orderId: job.id, userMessage: meisterInput.trim() || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      setMeisterData(data);
      setMeisterOpen(true);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: labels.toast.generic_error, description: err.message || buildPartnerLabels(lang).misc.please_retry });
    },
  });

  const handleMainAction = () => {
    if (!stageAction) return;
    if (stageAction.nextStatus === null) {
      onNeedUpload();
      return;
    }
    advanceMutation.mutate(stageAction.nextStatus);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl shadow-black/40"
      data-testid={`feed-card-${job.id}`}
    >
      {/* Image / damage hero */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-950 overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activePhoto}
            alt={job.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="w-24 h-24 text-zinc-700" strokeWidth={1.2} />
          </div>
        )}
        {photoCount > 1 && (
          <>
            <button
              type="button"
              onClick={() => setPhotoIndex((prev) => (prev - 1 + photoCount) % photoCount)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/55 border border-white/15 text-white flex items-center justify-center"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setPhotoIndex((prev) => (prev + 1) % photoCount)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/55 border border-white/15 text-white flex items-center justify-center"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              {job.photos.map((_, idx) => (
                <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === photoIndex ? "w-5 bg-white" : "w-1.5 bg-white/45"}`} />
              ))}
            </div>
          </>
        )}
        {/* Gradient wash for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
        {/* License plate */}
        {job.licensePlate && (
          <div
            className="absolute top-3 right-3 bg-white text-black border-2 border-white rounded-md px-2 py-1 text-sm font-black tracking-wider shadow-md"
            data-testid={`feed-plate-${job.id}`}
          >
            {job.licensePlate}
          </div>
        )}
        <button
          type="button"
          onClick={() => meisterMutation.mutate()}
          className="absolute right-3 bottom-20 inline-flex items-center gap-1.5 rounded-full bg-black/70 border border-white/15 px-3 py-1.5 text-white shadow-lg backdrop-blur hover:bg-black/80"
          data-testid={`button-meister-${job.id}`}
          aria-label="Meister"
        >
          <Bot className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold">{meisterMutation.isPending ? "..." : "Meister"}</span>
        </button>
        {/* Payout state badge — state-aware */}
        {job.payoutState === "not_set" ? (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-amber-500/90 text-amber-950 rounded-full px-3 py-1 shadow-lg">
            <Target className="w-3.5 h-3.5" />
            <span className="text-xs font-black">Betrag fehlt</span>
          </div>
        ) : job.payoutState === "in_progress" ? (
          payoutCents > 0 ? (
            <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-zinc-800/90 text-zinc-300 rounded-full px-3 py-1 shadow-lg border border-zinc-700">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tabular-nums" data-testid={`feed-payout-${job.id}`}>
                ~{payoutEur} €
              </span>
            </div>
          ) : null
        ) : (
          <div className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 shadow-lg ${
            job.payoutState === "paid"
              ? "bg-emerald-500 text-emerald-950"
              : "bg-blue-500/90 text-white"
          }`}>
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-sm font-black tabular-nums" data-testid={`feed-payout-${job.id}`}>
              {job.payoutIsEstimate ? "~" : "+"}{payoutEur} €
            </span>
          </div>
        )}
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            {job.vehicleMake} {job.vehicleModel}
            {job.vehicleYear ? ` · ${job.vehicleYear}` : ""}
          </div>
          <h3
            className="text-xl font-black leading-tight text-white"
            data-testid={`feed-title-${job.id}`}
          >
            {job.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">

        {/* Work state + reference */}
        <div className="flex items-center justify-between gap-2">
          <WorkStateBadge state={job.workState} lang={lang} />
          {job.referenceNumber ? (
            <span className="text-[10px] text-zinc-600 font-mono truncate">{job.referenceNumber}</span>
          ) : (
            <span className="text-[10px] text-zinc-700">{labels.misc.no_reference}</span>
          )}
        </div>

        {/* Compact workflow progression strip */}
        <ProgressStrip workState={job.workState} lang={lang} />

        {/* Contextual sub-label for current stage */}
        {workStageSubLabel(job, lang) && (
          <p className="text-[11px] text-zinc-500 leading-tight -mt-1">
            {workStageSubLabel(job, lang)}
          </p>
        )}

        {/* Scheduled date — color-coded by proximity */}
        <DateRow scheduledDate={job.scheduledDate} lang={lang} />

        {/* Files + drive — actionable link when Drive URL is present */}
        <FilesRow
          fileCount={job.fileCount}
          photoCount={job.photoCount}
          hasDriveLink={job.hasDriveLink}
          driveFolderUrl={job.driveFolderUrl}
          lang={lang}
        />

        {/* Payout state + block reason */}
        <div className="flex items-center justify-between gap-2">
          <PayoutStatePill state={job.payoutState} lang={lang} />
          <span className="text-[10px] text-right leading-tight">
            {job.payoutState === "not_set" && (
              <span className="text-amber-600">{labels.misc.amount_not_set_admin}</span>
            )}
            {job.payoutState === "pending" && (
              <span className="text-zinc-600">{labels.misc.waiting_customer_payment}</span>
            )}
            {job.payoutIsEstimate && job.payoutState === "in_progress" && (
              <span className="text-zinc-600">{labels.misc.estimated_value}</span>
            )}
          </span>
        </div>

        <ContactRow meta={job.contactMeta} />

        {/* Next-action hint */}
        <NextActionHint job={job} lang={lang} />

        {/* Stage-aware main CTA */}
        {job.workState === "delivered" && (
          <div
            className={`w-full min-h-14 rounded-xl border flex items-center justify-center gap-2 font-bold px-3 py-3 text-center text-sm ${labels.completedState[job.payoutState].cls}`}
            data-testid={`feed-completed-${job.id}`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {labels.completedState[job.payoutState].text}
          </div>
        )}
        {job.workState === "ready_pickup" && (
          <div className="w-full min-h-14 rounded-xl border border-emerald-500/30 bg-emerald-500/8 flex items-center justify-center gap-2 px-3 py-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">{labels.action.cta_awaiting_pickup}</span>
          </div>
        )}
        {stageAction && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={advanceMutation.isPending}
            onClick={handleMainAction}
            className={`w-full h-14 rounded-xl bg-gradient-to-r text-white font-black text-base tracking-wide shadow-lg transition-shadow disabled:opacity-60 flex items-center justify-center gap-2 ${stageAction.gradientCls}`}
            data-testid={`button-action-${job.id}`}
          >
            {advanceMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {labels.toast.saving}</>
            ) : (
              <><stageAction.Icon className="w-5 h-5" /> {stageAction.label}</>
            )}
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {meisterOpen && meisterData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center sm:justify-center" onClick={() => setMeisterOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-zinc-950 border-t sm:border border-zinc-800 sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {photoCount > 0 && (
                <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-[4/3] mb-4">
                  <img src={activePhoto} alt={job.title} className="absolute inset-0 w-full h-full object-cover" />
                  {photoCount > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((prev) => (prev - 1 + photoCount) % photoCount)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/55 border border-white/15 text-white flex items-center justify-center"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((prev) => (prev + 1) % photoCount)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/55 border border-white/15 text-white flex items-center justify-center"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-black">Meister</h3>
                <Button variant="ghost" size="icon" onClick={() => setMeisterOpen(false)} className="ml-auto" aria-label="Close">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Traducere Auftrag</div>
                  <p className="text-zinc-100">{meisterData.translatedDescription}</p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Răspuns Meister</div>
                  <p className="text-zinc-100">{meisterData.replyMessage || meisterData.workAdvice}</p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Sfaturi</div>
                  <p className="text-zinc-100">{meisterData.workAdvice}</p>
                </div>
                {!!meisterData.riskNotes?.length && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Riscuri</div>
                    <ul className="list-disc pl-5 text-zinc-100 space-y-1">
                      {meisterData.riskNotes.map((note: string, idx: number) => <li key={idx}>{note}</li>)}
                    </ul>
                  </div>
                )}
                {!!meisterData.suggestedNextStep && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Următorul pas</div>
                    <p className="text-zinc-100">{meisterData.suggestedNextStep}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <textarea
                    value={meisterInput}
                    onChange={(e) => setMeisterInput(e.target.value)}
                    placeholder="Scrie despre Auftrag..."
                    className="w-full min-h-20 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                  />
                  <Button
                    className="w-full bg-red-600 hover:bg-red-500 text-white"
                    onClick={() => meisterMutation.mutate()}
                    disabled={meisterMutation.isPending}
                  >
                    {meisterMutation.isPending ? "Meister gândește..." : "Trimite către Meister"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WALLET TAB — motivational earnings dashboard
// ════════════════════════════════════════════════════════════════════════════

function WalletTab({
  completed,
  active,
}: {
  completed: PartnerFeedJob[];
  active: PartnerFeedJob[];
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedThisMonth = completed.filter((r) => {
    const d = r.completedAt ? new Date(r.completedAt) : null;
    return d ? d >= monthStart : false;
  });
  const paidCompleted = completed.filter((r) => r.payoutState === "paid");
  const outstandingCompleted = completed.filter((r) => r.payoutState !== "paid");
  const monthCents = completedThisMonth.reduce((s, r) => s + (r.payoutNetCents ?? 0), 0);
  const allTimeCents = paidCompleted.reduce((s, r) => s + (r.payoutNetCents ?? 0), 0);
  const outstandingCents = outstandingCompleted.reduce((s, r) => s + (r.payoutNetCents ?? 0), 0);
  const pipelineCents = active.reduce((s, r) => s + (r.payoutNetCents ?? 0), 0);

  const monthEur = monthCents / 100;
  const allTimeEur = allTimeCents / 100;
  const pipelineEur = pipelineCents / 100;
  const avgEur =
    completedThisMonth.length > 0
      ? Math.round(monthEur / completedThisMonth.length)
      : 0;

  return (
    <div className="px-3 pt-3 space-y-4">
      {/* Hero: Month revenue */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 bg-gradient-to-br from-red-600 via-red-700 to-red-900 shadow-xl shadow-red-900/40 relative overflow-hidden"
        data-testid="wallet-hero"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="text-xs font-bold uppercase tracking-widest text-red-200 mb-2">
            Dein Umsatz · {monthLabel(now)}
          </div>
          <CountUp
            value={monthEur}
            className="text-5xl sm:text-6xl font-black leading-none tracking-tight"
            testId="text-wallet-month-revenue"
            suffix=" €"
          />
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-100">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {completedThisMonth.length} Jobs diesen Monat
          </div>
        </div>
      </motion.section>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          icon={Trophy}
          label="Bezahlt"
          value={`${formatEur(allTimeEur)} €`}
          color="text-emerald-400"
          testId="stat-alltime"
        />
        <StatTile
          icon={TrendingUp}
          label="Pipeline"
          value={`${formatEur(pipelineEur)} €`}
          color="text-blue-400"
          testId="stat-pipeline"
        />
        <StatTile
          icon={Clock}
          label="Ausstehend"
          value={outstandingCents > 0 ? `${formatEur(outstandingCents / 100)} €` : "—"}
          color="text-amber-400"
          testId="stat-outstanding"
        />
      </div>

      {/* Completed jobs split by payout state */}
      <section className="space-y-4 pt-2">
        {completed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            Noch keine abgeschlossenen Jobs.
          </div>
        ) : (
          <>
            {paidCompleted.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">
                    Bezahlt
                  </h3>
                  <span className="text-xs text-zinc-600">{paidCompleted.length}</span>
                </div>
                {paidCompleted.slice(0, 8).map((r) => (
                  <PayoutRow key={r.id} request={r} />
                ))}
              </div>
            )}
            {outstandingCompleted.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                    Ausstehend
                  </h3>
                  <span className="text-xs text-zinc-600">{outstandingCompleted.length}</span>
                </div>
                {outstandingCompleted.slice(0, 8).map((r) => (
                  <PayoutRow key={r.id} request={r} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function PayoutRow({ request }: { request: PartnerFeedJob }) {
  const cents = request.payoutNetCents ?? 0;
  const eur = (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const date = request.completedAt
    ? new Date(request.completedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
    : "—";

  const iconCls = {
    paid:        "bg-emerald-500/15 text-emerald-400",
    pending:     "bg-blue-500/15 text-blue-400",
    not_set:     "bg-amber-500/15 text-amber-400",
    in_progress: "bg-zinc-800 text-zinc-400",
  }[request.payoutState];

  const RowIcon = {
    paid:        CheckCircle2,
    pending:     Clock,
    not_set:     Target,
    in_progress: Wrench,
  }[request.payoutState];

  const amountDisplay =
    request.payoutState === "not_set"
      ? <span className="text-xs font-bold text-amber-400">—</span>
      : <span className={`text-sm font-black tabular-nums ${request.payoutState === "paid" ? "text-emerald-400" : "text-blue-400"}`}>
          {request.payoutIsEstimate ? "~" : "+"}{eur} €
        </span>;

  return (
    <div
      className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 rounded-xl p-3"
      data-testid={`payout-row-${request.id}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
        <RowIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate">{request.title}</div>
        <div className="text-[11px] text-zinc-500 truncate">
          {request.vehicleMake} {request.vehicleModel} · {date}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {amountDisplay}
        <PayoutStatePill state={request.payoutState} small />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  color,
  testId,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  color: string;
  testId: string;
}) {
  return (
    <div
      className="bg-zinc-950 border border-zinc-900 rounded-xl p-3"
      data-testid={testId}
    >
      <Icon className={`w-4 h-4 mb-1.5 ${color}`} />
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 leading-tight">
        {label}
      </div>
      <div className="text-base font-black tabular-nums leading-tight mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// UPLOAD TAB — Before/After photo poster
// ════════════════════════════════════════════════════════════════════════════

function UploadTab({ activeRequests, lang }: { activeRequests: PartnerFeedJob[]; lang?: string | null }) {
  const labels = buildPartnerLabels(lang);
  const { toast } = useToast();
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [linkedJobId, setLinkedJobId] = useState<string>("");
  const [posting, setPosting] = useState(false);

  // Object-URL lifecycle: create on commit, revoke on next commit / unmount.
  // Doing this in useEffect (not useMemo) is required for React 18 concurrent
  // rendering — an aborted render must not revoke a still-displayed URL.
  useEffect(() => {
    if (!beforeFile) {
      setBeforeUrl(null);
      return;
    }
    const url = URL.createObjectURL(beforeFile);
    setBeforeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [beforeFile]);

  useEffect(() => {
    if (!afterFile) {
      setAfterUrl(null);
      return;
    }
    const url = URL.createObjectURL(afterFile);
    setAfterUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [afterFile]);

  const canPost = beforeFile && afterFile && !posting;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    const payload = {
      jobId: linkedJobId || null,
      caption,
      beforeName: beforeFile?.name,
      afterName: afterFile?.name,
      ts: Date.now(),
    };
    // Real upload: send before+after to /api/uploads (partner_post bucket).
    try {
      const fileToB64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => {
            const s = String(r.result || "");
            resolve(s.includes(",") ? s.split(",")[1] : s);
          };
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      const filesPayload = [
        { name: `before-${beforeFile!.name}`, type: beforeFile!.type, data: await fileToB64(beforeFile!) },
        { name: `after-${afterFile!.name}`, type: afterFile!.type, data: await fileToB64(afterFile!) },
      ];
      await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category: "partner_post", files: filesPayload }),
      });
    } catch (err) {
      console.warn("[PartnerUpload] upload failed:", err);
    }
    setTimeout(() => {
      setPosting(false);
      setBeforeFile(null);
      setAfterFile(null);
      setCaption("");
      setLinkedJobId("");
      toast({
        title: labels.misc.posting_done,
        description: labels.misc.posting_done_desc,
      });
    }, 800);
  };

  return (
    <div className="px-3 pt-3 pb-2 space-y-4" data-testid="upload-tab-content">
      <div className="px-1">
        <h2 className="text-2xl font-black tracking-tight">
          {labels.misc.upload_header_prefix} <span className="text-red-500">{labels.misc.upload_header_highlight}</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          {labels.misc.upload_subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PhotoSlot
          label={lang === "ro" ? "ÎNAINTE" : lang === "en" ? "BEFORE" : "VORHER"}
          color="border-orange-500/50 bg-orange-500/5"
          file={beforeFile}
          previewUrl={beforeUrl}
          onPick={(f) => setBeforeFile(f)}
          testId="upload-slot-before"
          lang={lang}
        />
        <PhotoSlot
          label={lang === "ro" ? "DUPĂ" : lang === "en" ? "AFTER" : "NACHHER"}
          color="border-emerald-500/50 bg-emerald-500/5"
          file={afterFile}
          previewUrl={afterUrl}
          onPick={(f) => setAfterFile(f)}
          testId="upload-slot-after"
          lang={lang}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {labels.misc.caption}
        </label>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={labels.misc.caption_placeholder}
          className="bg-zinc-950 border-zinc-800 text-white resize-none min-h-[88px]"
          data-testid="upload-caption"
        />
      </div>

      {activeRequests.length > 0 && (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {labels.misc.link_job}
          </label>
          <select
            value={linkedJobId}
            onChange={(e) => setLinkedJobId(e.target.value)}
            className="w-full h-11 rounded-md bg-zinc-950 border border-zinc-800 text-white px-3 text-sm"
            data-testid="upload-link-job"
          >
            <option value="">{labels.misc.no_job_linked}</option>
            {activeRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} {r.licensePlate ? `· ${r.licensePlate}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={!canPost}
        onClick={handlePost}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-black text-base tracking-wide shadow-lg shadow-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        data-testid="button-upload-post"
      >
        {posting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> {labels.misc.posting}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" /> {labels.misc.post}
          </>
        )}
      </motion.button>
    </div>
  );
}

function PhotoSlot({
  label,
  color,
  file,
  previewUrl,
  onPick,
  testId,
  lang,
}: {
  label: string;
  color: string;
  file: File | null;
  previewUrl: string | null;
  onPick: (f: File | null) => void;
  testId: string;
  lang?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5" data-testid={testId}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative aspect-square w-full rounded-xl border-2 border-dashed ${color} overflow-hidden flex flex-col items-center justify-center gap-1.5 hover-elevate active-elevate-2`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPick(null);
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label={buildPartnerLabels(lang).misc.remove_photo}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <CameraIcon className="w-7 h-7 text-zinc-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              {label}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {file && (
        <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
          <ImageIcon className="w-2.5 h-2.5" />
          {file.name}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MEISTER AI TAB — chat-style with command chips
// ════════════════════════════════════════════════════════════════════════════

interface ChatMsg {
  id: number;
  from: "user" | "ai";
  text: string;
  pending?: boolean;
}

function getCommandSpecs(lang?: string | null): CommandSpec[] {
  const isRo = lang === "ro";
  const isEn = lang === "en";
  return [
    {
      command: "/sales:prepare-offer",
      label: isRo ? "Pregătește ofertă" : isEn ? "Prepare offer" : "Angebot vorbereiten",
      icon: FileText,
      description: isRo ? "AI creează o ofertă cu argumente de vânzare" : isEn ? "AI creates an offer with selling arguments" : "KI erstellt ein Angebot mit Verkaufsargumenten",
      endpoint: "/api/meister-ai/sales/prepare-offer",
      fields: [
        { name: "customerName", label: isRo ? "Client" : isEn ? "Customer" : "Kunde", type: "text", required: true },
        { name: "vehicleInfo", label: isRo ? "Vehicul" : isEn ? "Vehicle" : "Fahrzeug", type: "text", required: true },
        { name: "damageDescription", label: isRo ? "Daună" : isEn ? "Damage" : "Schaden", type: "textarea", required: true },
        { name: "estimatedAmount", label: isRo ? "Sumă (€)" : isEn ? "Amount (€)" : "Betrag (€)", type: "number", required: true },
      ],
    },
    {
      command: "/sales:battlecard",
      label: isRo ? "Battlecard" : isEn ? "Battlecard" : "Battlecard",
      icon: Target,
      description: isRo ? "Pregătire de discuție cu tratarea obiecțiilor" : isEn ? "Conversation prep with objection handling" : "Gesprächsvorbereitung mit Einwandbehandlung",
      endpoint: "/api/meister-ai/sales/battlecard",
      fields: [
        { name: "customerName", label: isRo ? "Client" : isEn ? "Customer" : "Kunde", type: "text", required: true },
        { name: "vehicleInfo", label: isRo ? "Vehicul" : isEn ? "Vehicle" : "Fahrzeug", type: "text" },
        {
          name: "objective",
          label: isRo ? "Obiectiv" : isEn ? "Objective" : "Ziel",
          type: "select",
          options: isRo
            ? ["Câștigă client nou", "Urmărește oferta", "Upselling", "Rezolvă reclamația", "Stabilește programare"]
            : isEn
              ? ["Win new customer", "Follow up offer", "Upselling", "Resolve complaint", "Book appointment"]
              : ["Neukunde gewinnen", "Angebot nachfassen", "Upselling", "Reklamation lösen", "Termin vereinbaren"],
        },
      ],
    },
    {
      command: "/sales:pipeline",
      label: isRo ? "Analizează pipeline" : isEn ? "Analyze pipeline" : "Pipeline analysieren",
      icon: TrendingUp,
      description: isRo ? "AI oferă recomandări de acțiune" : isEn ? "AI gives action recommendations" : "KI gibt Handlungsempfehlungen",
      endpoint: "/api/meister-ai/sales/pipeline",
      fields: [],
    },
  ];
}

let COMMANDS: CommandSpec[] = [];

interface CommandSpec {
  command: string;
  label: string;
  icon: typeof FileText;
  description: string;
  endpoint: string;
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "textarea" | "number" | "select";
    required?: boolean;
    options?: string[];
  }>;
}


function MeisterTab({ lang }: { lang?: string | null }) {
  const { toast } = useToast();
  const labels = buildPartnerLabels(lang);
  const COMMANDS = getCommandSpecs(lang);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      from: "ai",
      text: labels.misc.meister_welcome,
    },
  ]);
  const [activeCmd, setActiveCmd] = useState<CommandSpec | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const openCommand = (cmd: CommandSpec) => {
    setActiveCmd(cmd);
    setFormData({});
  };

  const submitCommand = async () => {
    if (!activeCmd) return;
    // Required-field validation
    const missing = activeCmd.fields
      .filter((f) => f.required)
      .filter((f) => !formData[f.name]?.trim());
    if (missing.length > 0) {
      toast({
        variant: "destructive",
        title: labels.misc.required_fields_missing,
        description: missing.map((f) => f.label).join(", "),
      });
      return;
    }

    const cmd = activeCmd;
    const userText =
      cmd.command +
      (Object.keys(formData).length > 0
        ? " · " +
          cmd.fields
            .map((f) => formData[f.name])
            .filter(Boolean)
            .join(" · ")
        : "");

    setMessages((m) => [
      ...m,
      { id: idRef.current++, from: "user", text: userText },
      { id: idRef.current++, from: "ai", text: labels.misc.typing, pending: true },
    ]);
    setActiveCmd(null);
    setBusy(true);
    deductHubTokens(0.15, `meister:${cmd.command}`);

    // Build typed body for the endpoint
    const body: Record<string, any> = { ...formData };
    if (body.estimatedAmount) {
      body.estimatedAmount = Number(body.estimatedAmount);
    }

    try {
      const res =
        cmd.endpoint === "/api/meister-ai/sales/pipeline"
          ? await apiRequest("POST", cmd.endpoint, {})
          : await apiRequest("POST", cmd.endpoint, body);
      const data = await res.json();
      const text = formatAiResponse(cmd.command, data, lang);
      setMessages((m) => {
        const next = m.filter((x) => !x.pending);
        return [...next, { id: idRef.current++, from: "ai", text }];
      });
    } catch (err: any) {
      setMessages((m) => {
        const next = m.filter((x) => !x.pending);
        return [
          ...next,
          {
            id: idRef.current++,
            from: "ai",
            text:
              labels.misc.request_failed + " " +
              (err?.message ?? labels.misc.please_retry),
          },
        ];
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-zinc-900">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight">Meister AI</div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Online · GPT-4o-mini
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        data-testid="meister-chat"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} msg={m} />
        ))}
      </div>

      {/* Command chips */}
      <div className="border-t border-zinc-900 bg-black px-3 py-3 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">
          {labels.misc.commands}
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {COMMANDS.map((c) => (
            <button
              key={c.command}
              onClick={() => openCommand(c)}
              disabled={busy}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-semibold text-zinc-200 hover-elevate active-elevate-2 disabled:opacity-50"
              data-testid={`chip-cmd-${c.command.replace(/[/:]/g, "-")}`}
            >
              <c.icon className="w-3.5 h-3.5 text-red-400" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Command form sheet */}
      <AnimatePresence>
        {activeCmd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center sm:justify-center"
            onClick={() => !busy && setActiveCmd(null)}
            data-testid="meister-cmd-sheet"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-zinc-950 border-t sm:border border-zinc-800 sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center gap-2">
                <activeCmd.icon className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-black">{activeCmd.label}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => !busy && setActiveCmd(null)}
                  className="ml-auto"
                  aria-label={labels.misc.close}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-400">
                {activeCmd.description}
              </p>
              {activeCmd.fields.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">
                  {labels.misc.no_inputs_needed}
                </p>
              ) : (
                <div className="space-y-3">
                  {activeCmd.fields.map((f) => (
                    <div key={f.name} className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        {f.label}
                        {f.required && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      {f.type === "textarea" ? (
                        <Textarea
                          value={formData[f.name] ?? ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [f.name]: e.target.value,
                            })
                          }
                          className="bg-zinc-900 border-zinc-800 text-white"
                          data-testid={`field-${f.name}`}
                        />
                      ) : f.type === "select" ? (
                        <select
                          value={formData[f.name] ?? ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [f.name]: e.target.value,
                            })
                          }
                          className="w-full h-11 rounded-md bg-zinc-900 border border-zinc-800 text-white px-3 text-sm"
                          data-testid={`field-${f.name}`}
                        >
                          <option value="">{labels.misc.select_placeholder}</option>
                          {f.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={f.type}
                          value={formData[f.name] ?? ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [f.name]: e.target.value,
                            })
                          }
                          className="bg-zinc-900 border-zinc-800 text-white"
                          data-testid={`field-${f.name}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={submitCommand}
                disabled={busy}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold gap-2"
                data-testid="button-submit-meister-cmd"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {labels.misc.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {labels.misc.send_to_meister}
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.from === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`chat-msg-${msg.id}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug whitespace-pre-wrap ${
          isUser
            ? "bg-red-600 text-white rounded-br-sm"
            : "bg-zinc-900 text-zinc-100 rounded-bl-sm border border-zinc-800"
        } ${msg.pending ? "animate-pulse" : ""}`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function formatAiResponse(cmd: string, data: any, lang?: string | null): string {
  const labels = buildPartnerLabels(lang);
  if (!data) return labels.misc.no_response;
  if (cmd === "/sales:prepare-offer") {
    const parts = [
      data.subject ? `📌 ${data.subject}` : null,
      data.greeting,
      data.body,
      Array.isArray(data.services) && data.services.length
        ? `${labels.misc.services}:\n• ${data.services.join("\n• ")}`
        : null,
      data.priceBreakdown,
      data.guarantee ? `🛡️ ${data.guarantee}` : null,
      data.closing,
      Array.isArray(data.tips) && data.tips.length
        ? `\n${labels.misc.tips}:\n• ${data.tips.join("\n• ")}`
        : null,
    ].filter(Boolean);
    return parts.join("\n\n");
  }
  if (cmd === "/sales:battlecard") {
    const parts = [
      data.title ? `🎯 ${data.title}` : "Battlecard",
      Array.isArray(data.openingLines)
        ? `${labels.misc.opening}:\n• ${data.openingLines.join("\n• ")}`
        : null,
      Array.isArray(data.keyPoints)
        ? `${labels.misc.key_points}:\n• ${data.keyPoints.join("\n• ")}`
        : null,
      Array.isArray(data.objections)
        ? `${labels.misc.objections}:\n• ${data.objections
            .map((o: any) => `${o.objection} → ${o.response}`)
            .join("\n• ")}`
        : null,
      data.closing,
    ].filter(Boolean);
    return parts.join("\n\n");
  }
  if (cmd === "/sales:pipeline") {
    const s = data.stats || {};
    const parts = [
      `${labels.misc.pipeline_overview}`,
      `${labels.misc.open_offers}: ${s.openOffers ?? 0}`,
      `${labels.misc.accepted_offers}: ${s.acceptedOffers ?? 0}`,
      `${labels.misc.win_rate}: ${s.winRate ?? 0}%`,
      data.summary,
      Array.isArray(data.recommendations) && data.recommendations.length
        ? `${labels.misc.recommendations}:\n• ${data.recommendations.join("\n• ")}`
        : null,
    ].filter(Boolean);
    return parts.join("\n\n");
  }
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED — Bottom nav, empty state, count-up, helpers
// ════════════════════════════════════════════════════════════════════════════

function BottomNav({
  tab,
  setTab,
  pendingCount,
  lang,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  pendingCount: number;
  lang?: string | null;
}) {
  const copy = getPartnerCopy(lang);
  const items: Array<{
    id: Tab;
    label: string;
    icon: typeof Home;
    badge?: number;
  }> = [
    { id: "feed", label: copy.feed, icon: Home, badge: pendingCount },
    { id: "kalender", label: copy.calendar, icon: CalendarDays },
    { id: "wallet", label: copy.wallet, icon: WalletIcon },
    { id: "upload", label: copy.upload, icon: CameraIcon },
    { id: "meister", label: copy.meister, icon: Bot },
  ];
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur border-t border-zinc-900 safe-area-bottom"
      data-testid="bottom-nav"
    >
      <div className="max-w-xl mx-auto px-2 py-1.5 grid grid-cols-5 gap-1">
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${
                active
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              data-testid={`nav-${it.id}`}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-1 rounded-xl bg-red-600/15 border border-red-600/40"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <div className="relative">
                <it.icon className="w-5 h-5" />
                {it.badge !== undefined && it.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                    {it.badge > 9 ? "9+" : it.badge}
                  </span>
                )}
              </div>
              <span className="relative text-[10px] font-bold tracking-wide">
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-6 py-20 text-center" data-testid="empty-state">
      <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-zinc-500" />
      </div>
      <h3 className="text-lg font-black mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{subtitle}</p>
    </div>
  );
}

function CountUp({
  value,
  className,
  testId,
  suffix = "",
}: {
  value: number;
  className?: string;
  testId?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = 0;
    let raf: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round((from + (value - from) * eased) * 100) / 100);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className={className} data-testid={testId}>
      {formatEur(display)}
      {suffix}
    </span>
  );
}

function formatEur(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}
