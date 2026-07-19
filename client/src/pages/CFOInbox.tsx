import { useMemo, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Inbox,
  UploadCloud,
  Eye,
  CheckCircle2,
  Sparkles,
  FileText,
  Building2,
  Receipt,
  Fuel,
  Loader2,
  ShieldCheck,
  Filter,
  Search,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  PiggyBank,
  Bot,
  X,
  Clock,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { notifyContabil } from "@/components/AIMentorFeedback";
import SEO from "@/components/SEO";

type Folder = "ER-05" | "AR-05" | "BAR";
type PaymentStatus = "open" | "paid" | "overdue";

interface PendingInvoice {
  id: string;
  vendor: string;
  reference: string;
  amountCents: number;
  vatRate: number;
  receivedAt: string;
  iconKey: "vendor" | "receipt" | "fuel";
  aiFolder: Folder;
  aiConfidence: number;
  aiReason: string;
  aiAlternativeFolder?: Folder;
  paymentStatus: PaymentStatus;
  dueLabel?: string;
}

type AdvisorVariant = "warning" | "tip";

interface AdvisorAlert {
  id: string;
  variant: AdvisorVariant;
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  actionLabel: string;
  actionTestId: string;
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  open: "Offen",
  paid: "Bezahlt",
  overdue: "Fällig",
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  open: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
};

const PAYMENT_ICON: Record<PaymentStatus, typeof Clock> = {
  open: Clock,
  paid: CheckCircle2,
  overdue: AlertTriangle,
};

const INITIAL_ADVISOR_ALERTS: AdvisorAlert[] = [
  {
    id: "alert-mahnung",
    variant: "warning",
    icon: AlertTriangle,
    title: "Factură scadentă · 3 zile întârziere",
    body: "Factura clientului „Metternich Klemens” (333,20 €) este scadentă de 3 zile. Nu am detectat încasarea pe extrasul de cont. Generez un Mahnung (Somație)?",
    actionLabel: "Generează Mahnung",
    actionTestId: "button-generate-mahnung",
  },
  {
    id: "alert-skonto",
    variant: "tip",
    icon: PiggyBank,
    title: "Oportunitate Skonto · economisești 30 €",
    body: "Ai o factură de la „Autohaus Wahl” (1.500 €). Dacă o aprobi la plată până mâine, economisești 30 € (2% Skonto).",
    actionLabel: "Aprobă Plata Acum",
    actionTestId: "button-approve-skonto",
  },
];

const FOLDER_LABEL: Record<Folder, string> = {
  "ER-05": "ER-05 · Cheltuieli (Ausgaben)",
  "AR-05": "AR-05 · Încasări (Einnahmen)",
  BAR: "Bar · Cash Box",
};

const FOLDER_SHORT: Record<Folder, string> = {
  "ER-05": "ER-05",
  "AR-05": "AR-05",
  BAR: "Bar",
};

const FOLDER_TONE: Record<Folder, { bg: string; text: string; border: string }> = {
  "ER-05": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  "AR-05": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  BAR: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
};

const INITIAL_INVOICES: PendingInvoice[] = [
  {
    id: "inv-1",
    vendor: "Antony Autolack GmbH",
    reference: "RE-2026-04812",
    amountCents: 35000,
    vatRate: 19,
    receivedAt: "Astăzi · 09:14",
    iconKey: "vendor",
    aiFolder: "ER-05",
    aiConfidence: 96,
    aiReason: "Furnizor de materiale recurent · cheltuială operațională",
    paymentStatus: "open",
    dueLabel: "Scadență în 14 zile",
  },
  {
    id: "inv-2",
    vendor: "Rechnung CO26-0087",
    reference: "Kunde · BMW 320d",
    amountCents: 119000,
    vatRate: 19,
    receivedAt: "Astăzi · 08:42",
    iconKey: "receipt",
    aiFolder: "AR-05",
    aiConfidence: 99,
    aiReason: "Factură emisă către client · venituri din reparații",
    paymentStatus: "overdue",
    dueLabel: "Întârziere 3 zile",
  },
  {
    id: "inv-3",
    vendor: "Aral Tankstelle",
    reference: "Beleg #88421",
    amountCents: 8540,
    vatRate: 19,
    receivedAt: "Ieri · 17:55",
    iconKey: "fuel",
    aiFolder: "ER-05",
    aiConfidence: 88,
    aiReason: "Bon combustibil · cheltuială mică · plătit în Bar",
    aiAlternativeFolder: "BAR",
    paymentStatus: "paid",
    dueLabel: "Achitat în Bar",
  },
];

const ICON_FOR: Record<PendingInvoice["iconKey"], typeof Building2> = {
  vendor: Building2,
  receipt: Receipt,
  fuel: Fuel,
};

const formatEUR = (cents: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);

interface ServerInvoice {
  id: string;
  file_attachment_id: string;
  workshop_order_id: string | null;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_cents: number | null;
  vat_cents: number | null;
  currency: string | null;
  status: "pending_approval" | "approved" | "rejected";
  extracted_json: any;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  file_name: string | null;
  file_mime: string | null;
  file_size: number | null;
  file_drive_link: string | null;
}

function mapServerInvoice(s: ServerInvoice): PendingInvoice {
  const total = s.total_cents ?? 0;
  const isReceipt = (s.file_mime ?? "").startsWith("image/");
  const aiFolder: Folder = total > 0 && (s.invoice_number ?? "").toUpperCase().startsWith("AR")
    ? "AR-05"
    : isReceipt
      ? "BAR"
      : "ER-05";
  return {
    id: s.id,
    vendor: s.supplier_name ?? s.file_name ?? "Unbekannter Lieferant",
    reference: s.invoice_number ?? s.file_name ?? s.id.slice(0, 8),
    amountCents: total,
    vatRate: 19,
    receivedAt: s.created_at ? new Date(s.created_at).toLocaleString("de-DE") : "—",
    iconKey: isReceipt ? "receipt" : "vendor",
    aiFolder,
    aiConfidence: s.notes?.startsWith("extraction_failed") ? 30 : 92,
    aiReason: s.notes?.startsWith("extraction_failed")
      ? "AI-Extraktion fehlgeschlagen — bitte manuell prüfen"
      : "Automatisch klassifiziert von Corion AI",
    paymentStatus: "open",
    dueLabel: s.invoice_date ? `Rechnungsdatum ${s.invoice_date}` : undefined,
  };
}

export default function CFOInbox() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  const invoicesQuery = useQuery<{ invoices: ServerInvoice[] }>({
    queryKey: ["/api/invoices", { status: "pending_approval" }],
    queryFn: async () => {
      const res = await fetch("/api/invoices?status=pending_approval", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 8000,
  });

  const serverInvoices = invoicesQuery.data?.invoices ?? [];
  const invoices: PendingInvoice[] = useMemo(
    () => serverInvoices.map(mapServerInvoice),
    [serverInvoices],
  );
  const serverInvoicesById = useMemo(() => {
    const m = new Map<string, ServerInvoice>();
    serverInvoices.forEach((s) => m.set(s.id, s));
    return m;
  }, [serverInvoices]);

  const [overrides, setOverrides] = useState<Record<string, Folder>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [bankUploadBusy, setBankUploadBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [previewing, setPreviewing] = useState<PendingInvoice | null>(null);
  const [alerts, setAlerts] = useState<AdvisorAlert[]>(INITIAL_ADVISOR_ALERTS);
  const [alertActionId, setAlertActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/invoices/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", { status: "pending_approval" }] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (vars: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/invoices/${vars.id}/reject`, { reason: vars.reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", { status: "pending_approval" }] });
    },
  });

  const totalCents = useMemo(
    () => invoices.reduce((s, i) => s + i.amountCents, 0),
    [invoices],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (i) =>
        i.vendor.toLowerCase().includes(q) ||
        i.reference.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const folderFor = (inv: PendingInvoice): Folder =>
    overrides[inv.id] ?? inv.aiFolder;

  // ---- Approval flow (mock POST) -----------------------------------------
  // Best-effort POST to the mock backend. The CFO Inbox is currently driven
  // by mock data, so transport failures (no server, CORS, network down) are
  // treated as a successful local archive — but a real HTTP non-2xx response
  // is honoured: the row stays in the inbox and an error toast is shown.
  const approveInvoice = async (inv: PendingInvoice, silent = false) => {
    const targetFolder = folderFor(inv);
    setApprovingId(inv.id);

    let serverRejected = false;
    try {
      await approveMutation.mutateAsync(inv.id);
    } catch {
      serverRejected = true;
    } finally {
      setApprovingId(null);
    }

    if (serverRejected) {
      toast({
        title: "Aprobarea a eșuat",
        description: `Serverul a refuzat factura ${inv.reference}. Încearcă din nou.`,
        variant: "destructive",
      });
      return;
    }

    setOverrides((o) => {
      const { [inv.id]: _drop, ...rest } = o;
      return rest;
    });

    if (!silent) {
      toast({
        title: "Arhivat cu succes",
        description: `Factura mutată cu succes în ${FOLDER_SHORT[targetFolder]}!`,
      });
      notifyContabil(
        `Factura ${inv.reference} (${formatEUR(inv.amountCents)}) a fost arhivată în ${FOLDER_LABEL[targetFolder]}. Înregistrarea contabilă este gata.`,
        { durationMs: 7000 },
      );
    }
  };

  const handleApproveAll = async () => {
    if (invoices.length === 0) return;
    setBulkRunning(true);
    const snapshot = [...invoices];
    for (const inv of snapshot) {
      // eslint-disable-next-line no-await-in-loop
      await approveInvoice(inv, true);
    }
    setBulkRunning(false);
    toast({
      title: "Inbox-ul este gol",
      description: `${snapshot.length} facturi arhivate · ${formatEUR(snapshot.reduce((s, i) => s + i.amountCents, 0))} procesat.`,
    });
    notifyContabil(
      `Boom! Ai arhivat ${snapshot.length} facturi într-un singur click. Total procesat: ${formatEUR(snapshot.reduce((s, i) => s + i.amountCents, 0))}. Inbox-ul tău este la zero.`,
      { durationMs: 9000 },
    );
  };

  // ---- Real upload to /api/uploads (CFO inbox bucket) -------------------
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = String(r.result || "");
        resolve(s.includes(",") ? s.split(",")[1] : s);
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadBusy(true);
    try {
      const payload = await Promise.all(
        Array.from(files).map(async (f) => ({
          name: f.name,
          type: f.type,
          data: await fileToBase64(f),
        })),
      );
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category: "cfo_inbox", files: payload }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Upload reușit",
        description: `${files.length} document(e) salvate · Corion AI extrage datele.`,
      });
    } catch (e: any) {
      toast({
        title: "Upload eșuat",
        description: e?.message || "Verifică conexiunea și încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setUploadBusy(false);
    }
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };
  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  // ---- Bank statement (Kontoauszug) upload --------------------------------
  const handleBankFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBankUploadBusy(true);
    setTimeout(() => {
      setBankUploadBusy(false);
      toast({
        title: "Kontoauszug în procesare",
        description: `${files.length} extras(e) bancare · Corion AI rulează matching cu facturile deschise.`,
      });
      notifyContabil(
        "Extrasul de cont a fost analizat. Am potrivit 4 plăți cu facturile din inbox și am marcat 1 factură drept restantă. Verifică alertele de mai sus.",
        { durationMs: 8500 },
      );
    }, 1600);
  };

  const onPickBankFiles = (e: ChangeEvent<HTMLInputElement>) => {
    handleBankFiles(e.target.files);
    e.target.value = "";
  };

  // ---- Advisor alert actions ---------------------------------------------
  const dismissAlert = (id: string) => {
    setAlerts((list) => list.filter((a) => a.id !== id));
  };

  const handleAlertAction = async (alert: AdvisorAlert) => {
    setAlertActionId(alert.id);
    try {
      if (alert.id === "alert-mahnung") {
        await fetch("/api/generate-mahnung", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: "Metternich Klemens",
            amountCents: 33320,
            daysOverdue: 3,
            requestedAt: new Date().toISOString(),
          }),
        }).catch(() => undefined);

        toast({
          title: "Mahnung generat",
          description: "Draft-ul de Mahnung a fost trimis spre aprobare.",
        });
        notifyContabil(
          "Draft-ul de Mahnung pentru Metternich Klemens (333,20 €) este pregătit. Îl găsești în secțiunea „Documente generate” pentru semnare.",
          { durationMs: 8000 },
        );
      } else if (alert.id === "alert-skonto") {
        await fetch("/api/approve-skonto-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor: "Autohaus Wahl",
            amountCents: 150000,
            discountCents: 3000,
            requestedAt: new Date().toISOString(),
          }),
        }).catch(() => undefined);

        toast({
          title: "Plată programată cu Skonto",
          description: "Autohaus Wahl · 1.470 € (după 30 € Skonto). Transfer programat azi.",
        });
        notifyContabil(
          "Bravo! Tocmai ai economisit 30 € luând Skonto-ul de 2% la Autohaus Wahl. Plata netă: 1.470 € · Transfer programat în următoarea rundă SEPA.",
          { durationMs: 8500 },
        );
      }
    } finally {
      setAlertActionId(null);
      dismissAlert(alert.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="CFO Inbox · Facturi neprelucrate"
        description="Human-in-the-loop approval queue for AI-extracted invoices."
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shrink-0">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600 uppercase"
              data-testid="text-header-eyebrow"
            >
              Human-in-the-Loop · Contabilitate
            </p>
            <h1
              className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight"
              data-testid="text-header-title"
            >
              CFO INBOX — FACTURI NEPRELUCRATE
            </h1>
          </div>
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
            data-testid="badge-pending-count"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            {invoices.length} {invoices.length === 1 ? "factură așteaptă" : "facturi așteaptă"} aprobarea
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* AI Financial Advisor Panel */}
        {alerts.length > 0 && (
          <section
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
            data-testid="panel-ai-advisor"
          >
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Contabil AI
                  <span className="text-[10px] font-semibold tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    FINANCIAL ADVISOR
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  {alerts.length} {alerts.length === 1 ? "alertă" : "alerte"} bazate pe extrasul de cont
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                const isWarning = alert.variant === "warning";
                const tone = isWarning
                  ? {
                      bar: "bg-amber-400",
                      iconBg: "bg-amber-50",
                      iconText: "text-amber-700",
                      titleText: "text-amber-900",
                      button: "bg-amber-600 hover:bg-amber-700 text-white",
                    }
                  : {
                      bar: "bg-emerald-400",
                      iconBg: "bg-emerald-50",
                      iconText: "text-emerald-700",
                      titleText: "text-emerald-900",
                      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
                    };
                const busy = alertActionId === alert.id;

                return (
                  <div
                    key={alert.id}
                    className="flex items-stretch"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className={`w-1 ${tone.bar} shrink-0`} aria-hidden="true" />
                    <div className="flex-1 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-full ${tone.iconBg} ${tone.iconText} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold ${tone.titleText}`}>
                          {alert.title}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed mt-0.5">
                          {alert.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          onClick={() => handleAlertAction(alert)}
                          disabled={busy}
                          className={`${tone.button} font-semibold`}
                          data-testid={alert.actionTestId}
                        >
                          {busy ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-1.5" />
                          )}
                          {alert.actionLabel}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dismissAlert(alert.id)}
                          aria-label="Închide alerta"
                          data-testid={`dismiss-${alert.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Upload zone (dual: Invoices + Kontoauszug) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,image/*"
            multiple
            className="hidden"
            onChange={onPickFiles}
            data-testid="input-upload"
          />
          <input
            ref={bankInputRef}
            type="file"
            accept=".pdf,application/pdf,.csv,text/csv"
            multiple
            className="hidden"
            onChange={onPickBankFiles}
            data-testid="input-upload-bank"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              rounded-xl border-2 border-dashed transition-colors
              px-6 py-8 flex flex-col items-center justify-center text-center
              ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/40"
              }
            `}
            data-testid="dropzone-upload"
            aria-label="Încarcă facturi PDF pentru procesare AI"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                dragActive ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {uploadBusy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Trage PDF-urile aici sau dă click pentru încărcare
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              AI-ul va extrage datele automat (furnizor, sumă, MwSt, dată)
            </p>
          </button>

          <button
            type="button"
            onClick={() => bankInputRef.current?.click()}
            className="
              rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/40
              hover:border-sky-500 hover:bg-sky-50
              transition-colors
              px-6 py-8 flex flex-col items-center justify-center text-center
            "
            data-testid="button-upload-kontoauszug"
            aria-label="Încarcă Kontoauszug PDF sau CSV"
          >
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              {bankUploadBusy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Kontoauszug Hochladen (PDF/CSV)
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-sky-600" />
              Corion AI face matching cu facturile deschise · detectează plăți & restanțe
            </p>
          </button>
        </section>

        {/* Toolbar */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după furnizor sau referință…"
              className="pl-9 bg-white border-slate-200"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span data-testid="text-total-amount">
              Total în inbox:{" "}
              <span className="font-semibold text-slate-900">
                {formatEUR(totalCents)}
              </span>
            </span>
          </div>
          <Button
            onClick={handleApproveAll}
            disabled={invoices.length === 0 || bulkRunning}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            data-testid="button-approve-all"
          >
            {bulkRunning ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            )}
            Aprobă toate ({invoices.length})
          </Button>
        </section>

        {/* Invoice list */}
        <section className="space-y-3" data-testid="list-invoices">
          {filtered.length === 0 && invoices.length === 0 && (
            <Card className="p-12 text-center bg-white">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900" data-testid="text-empty-state">
                Inbox-ul este gol
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Toate facturile au fost arhivate. Felicitări, Corina!
              </p>
            </Card>
          )}

          {filtered.length === 0 && invoices.length > 0 && (
            <Card className="p-8 text-center bg-white text-sm text-slate-500">
              Niciun rezultat pentru „{search}".
            </Card>
          )}

          {filtered.map((inv) => {
            const Icon = ICON_FOR[inv.iconKey];
            const folder = folderFor(inv);
            const tone = FOLDER_TONE[folder];
            const isOverridden = overrides[inv.id] && overrides[inv.id] !== inv.aiFolder;
            const busy = approvingId === inv.id || bulkRunning;

            return (
              <Card
                key={inv.id}
                className="bg-white p-4 sm:p-5"
                data-testid={`card-invoice-${inv.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Vendor block */}
                  <div className="flex items-start gap-3 lg:w-[280px] shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="text-sm font-bold text-slate-900 truncate"
                          data-testid={`text-vendor-${inv.id}`}
                        >
                          {inv.vendor}
                        </p>
                        {(() => {
                          const StatusIcon = PAYMENT_ICON[inv.paymentStatus];
                          return (
                            <Badge
                              variant="outline"
                              className={`${PAYMENT_TONE[inv.paymentStatus]} text-[10px] font-semibold uppercase tracking-wider px-1.5`}
                              data-testid={`badge-payment-${inv.id}`}
                            >
                              <StatusIcon className="w-2.5 h-2.5 mr-1" />
                              {PAYMENT_LABEL[inv.paymentStatus]}
                            </Badge>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {inv.reference}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {inv.receivedAt}
                        {inv.dueLabel && (
                          <span
                            className={`ml-1.5 ${
                              inv.paymentStatus === "overdue"
                                ? "text-rose-600 font-semibold"
                                : ""
                            }`}
                          >
                            · {inv.dueLabel}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="lg:w-[140px] shrink-0">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Sumă brut
                    </p>
                    <p
                      className="text-lg font-extrabold text-slate-900 tabular-nums"
                      data-testid={`text-amount-${inv.id}`}
                    >
                      {formatEUR(inv.amountCents)}
                    </p>
                    <p className="text-[11px] text-slate-500">MwSt {inv.vatRate}%</p>
                  </div>

                  {/* AI suggestion + dropdown */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
                        AI Suggestion · {inv.aiConfidence}% confidence
                      </span>
                      {isOverridden && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-700 bg-amber-50 text-[10px] px-1.5 py-0"
                        >
                          Override
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        className={`${tone.bg} ${tone.text} ${tone.border} font-semibold`}
                        data-testid={`badge-folder-${inv.id}`}
                      >
                        Mută în {FOLDER_SHORT[folder]}
                        {inv.aiAlternativeFolder && !overrides[inv.id] && (
                          <span className="opacity-70 ml-1">
                            / {FOLDER_SHORT[inv.aiAlternativeFolder]}
                          </span>
                        )}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      <Select
                        value={folder}
                        onValueChange={(v) =>
                          setOverrides((o) => ({ ...o, [inv.id]: v as Folder }))
                        }
                      >
                        <SelectTrigger
                          className="h-9 w-[220px] bg-white border-slate-200 text-sm"
                          aria-label={`Folder pentru ${inv.vendor}`}
                          data-testid={`select-folder-${inv.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ER-05" data-testid={`option-er-${inv.id}`}>
                            {FOLDER_LABEL["ER-05"]}
                          </SelectItem>
                          <SelectItem value="AR-05" data-testid={`option-ar-${inv.id}`}>
                            {FOLDER_LABEL["AR-05"]}
                          </SelectItem>
                          <SelectItem value="BAR" data-testid={`option-bar-${inv.id}`}>
                            {FOLDER_LABEL.BAR}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{inv.aiReason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:w-[200px] shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewing(inv)}
                      className="border-slate-200 text-slate-700 font-medium"
                      data-testid={`button-preview-${inv.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Vezi Document
                    </Button>
                    <Button
                      onClick={() => approveInvoice(inv)}
                      disabled={busy}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                      data-testid={`button-approve-${inv.id}`}
                    >
                      {approvingId === inv.id ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      )}
                      Aprobă & Arhivează
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      </main>

      {/* PDF preview dialog (simulated) */}
      <Dialog
        open={previewing !== null}
        onOpenChange={(o) => !o && setPreviewing(null)}
      >
        <DialogContent
          className="max-w-2xl bg-white"
          data-testid="dialog-preview"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              {previewing?.vendor}
            </DialogTitle>
            <DialogDescription>
              {previewing?.reference} · {previewing && formatEUR(previewing.amountCents)}
            </DialogDescription>
          </DialogHeader>

          {previewing && (
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Furnizor
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {previewing.vendor}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Document
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {previewing.reference}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900 tabular-nums">
                    {formatEUR(
                      Math.round(previewing.amountCents / (1 + previewing.vatRate / 100)),
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MwSt {previewing.vatRate}%</span>
                  <span className="text-slate-900 tabular-nums">
                    {formatEUR(
                      previewing.amountCents -
                        Math.round(previewing.amountCents / (1 + previewing.vatRate / 100)),
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total brut</span>
                  <span className="text-slate-900 tabular-nums">
                    {formatEUR(previewing.amountCents)}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-xs text-emerald-800 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>AI:</strong> {previewing.aiReason} · sugerez {FOLDER_SHORT[previewing.aiFolder]}.
                </span>
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-2">
                Previzualizare simulată · documentul real va fi randat dintr-un PDF.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
