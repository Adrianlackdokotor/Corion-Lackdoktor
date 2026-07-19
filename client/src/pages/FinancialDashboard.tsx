import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CashFlowChart, type CashflowSnapshot } from "@/components/cfo/CashFlowChart";
import { CFOAdvisor } from "@/components/cfo/CFOAdvisor";
import { MonthDrilldownModal } from "@/components/cfo/MonthDrilldownModal";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  Upload,
  Loader2,
  Sparkles,
  Banknote,
  CreditCard,
  MapPin,
  User as UserIcon,
  RotateCcw,
  FileText,
  CheckCircle2,
  Download,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

function DeltaPill({
  value,
  positiveIsGood,
  testId,
  subline,
}: {
  value: number | null;
  positiveIsGood: boolean;
  testId?: string;
  subline?: string;
}) {
  if (value === null || !isFinite(value)) {
    return (
      <p className="text-xs text-slate-400 mt-1 tabular-nums" data-testid={testId}>
        — vs. Vorperiode{subline ? ` · ${subline}` : ""}
      </p>
    );
  }
  const isUp = value >= 0;
  const isGood = isUp === positiveIsGood;
  const Arrow = isUp ? ArrowUpRight : ArrowDownRight;
  const color = isGood ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50";
  const display = `${isUp ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
  return (
    <div className="flex items-center gap-1.5 mt-1.5" data-testid={testId}>
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium tabular-nums ${color}`}>
        <Arrow className="w-3 h-3" /> {display}
      </span>
      <span className="text-xs text-slate-400">vs. Vorperiode{subline ? ` · ${subline}` : ""}</span>
    </div>
  );
}

type Location = "Mainz-Kastel" | "Wallau";
type Partner = "Adil" | "Adam";
type PaymentMethod = "BAR" | "KONTO";
type TxType = "Einnahme" | "Ausgabe";

interface Transaction {
  id: string;
  date: string;
  type: TxType;
  counterparty: string;
  amountNetCents: number;
  taxCents: number;
  paymentMethod: PaymentMethod;
  location: Location;
  partner: Partner;
  reference?: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "T-1001", date: "2026-04-02", type: "Einnahme", counterparty: "Müller GmbH", amountNetCents: 84000, taxCents: 15960, paymentMethod: "KONTO", location: "Mainz-Kastel", partner: "Adil", reference: "COR-10231" },
  { id: "T-1002", date: "2026-04-03", type: "Einnahme", counterparty: "Schmidt Spedition", amountNetCents: 142000, taxCents: 26980, paymentMethod: "KONTO", location: "Wallau", partner: "Adam", reference: "COR-10232" },
  { id: "T-1003", date: "2026-04-05", type: "Ausgabe", counterparty: "Standox Lacke", amountNetCents: 38500, taxCents: 7315, paymentMethod: "KONTO", location: "Mainz-Kastel", partner: "Adil", reference: "RG-2026-441" },
  { id: "T-1004", date: "2026-04-07", type: "Einnahme", counterparty: "Becker Mietwagen", amountNetCents: 56000, taxCents: 10640, paymentMethod: "BAR", location: "Mainz-Kastel", partner: "Adil", reference: "COR-10233" },
  { id: "T-1005", date: "2026-04-09", type: "Ausgabe", counterparty: "ATU Großkunden", amountNetCents: 12400, taxCents: 2356, paymentMethod: "BAR", location: "Wallau", partner: "Adam", reference: "BAR-0407" },
  { id: "T-1006", date: "2026-04-12", type: "Einnahme", counterparty: "Weber Karosserie", amountNetCents: 215000, taxCents: 40850, paymentMethod: "KONTO", location: "Wallau", partner: "Adam", reference: "COR-10234" },
  { id: "T-1007", date: "2026-04-14", type: "Ausgabe", counterparty: "Mercedes-Benz NL Mainz", amountNetCents: 67200, taxCents: 12768, paymentMethod: "KONTO", location: "Mainz-Kastel", partner: "Adil", reference: "RG-2026-489" },
  { id: "T-1008", date: "2026-04-16", type: "Einnahme", counterparty: "Schneider Privat", amountNetCents: 32000, taxCents: 6080, paymentMethod: "BAR", location: "Mainz-Kastel", partner: "Adil", reference: "COR-10235" },
  { id: "T-1009", date: "2026-04-18", type: "Einnahme", counterparty: "Hoffmann Leasing", amountNetCents: 178500, taxCents: 33915, paymentMethod: "KONTO", location: "Wallau", partner: "Adam", reference: "COR-10236" },
  { id: "T-1010", date: "2026-04-20", type: "Ausgabe", counterparty: "Würth Werkstattbedarf", amountNetCents: 18900, taxCents: 3591, paymentMethod: "KONTO", location: "Wallau", partner: "Adam", reference: "RG-2026-512" },
  { id: "T-1011", date: "2026-04-22", type: "Einnahme", counterparty: "Fischer Transporte", amountNetCents: 96000, taxCents: 18240, paymentMethod: "KONTO", location: "Mainz-Kastel", partner: "Adil", reference: "COR-10237" },
  { id: "T-1012", date: "2026-04-25", type: "Ausgabe", counterparty: "Tankstelle Aral", amountNetCents: 8400, taxCents: 1596, paymentMethod: "BAR", location: "Mainz-Kastel", partner: "Adil", reference: "BAR-0419" },
  { id: "T-1013", date: "2026-04-27", type: "Einnahme", counterparty: "Wagner Autohaus", amountNetCents: 124000, taxCents: 23560, paymentMethod: "KONTO", location: "Wallau", partner: "Adam", reference: "COR-10238" },
  { id: "T-1014", date: "2026-04-29", type: "Ausgabe", counterparty: "Stadt Mainz Gewerbe", amountNetCents: 45000, taxCents: 0, paymentMethod: "KONTO", location: "Mainz-Kastel", partner: "Adil", reference: "GEW-2026" },
];

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type LocationFilter = "ALL" | Location;
type PartnerFilter = "ALL" | Partner;
type MethodFilter = "ALL" | PaymentMethod;

export default function FinancialDashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("ALL");
  const [partnerFilter, setPartnerFilter] = useState<PartnerFilter>("ALL");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("ALL");
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [periodMonths, setPeriodMonths] = useState<3 | 6 | 12>(6);
  const [drilldownMonth, setDrilldownMonth] = useState<string | null>(null);

  const cashflowQuery = useQuery<CashflowSnapshot>({
    queryKey: ["/api/cfo/cashflow", { months: periodMonths, location: locationFilter, partner: partnerFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ months: String(periodMonths) });
      if (locationFilter !== "ALL") params.set("location", locationFilter);
      if (partnerFilter !== "ALL") params.set("partner", partnerFilter);
      const res = await fetch(`/api/cfo/cashflow?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30000,
  });
  const snapshot = cashflowQuery.data ?? null;

  // Real KPI values (cents → eur). Falls back to mock if API not loaded yet.
  const realTotals = useMemo(() => {
    if (!snapshot) return null;
    const t = snapshot.totals;
    const prev = snapshot.previous;
    const pct = (cur: number, p: number): number | null => {
      if (!p) return cur > 0 ? 100 : cur < 0 ? -100 : null;
      return ((cur - p) / Math.abs(p)) * 100;
    };
    return {
      incomeGross: t.incomeCents / 100,
      expenseGross: t.expenseCents / 100,
      profitGross: t.profitCents / 100,
      bar: (t.barCents ?? 0) / 100,
      konto: (t.kontoCents ?? 0) / 100,
      count: t.ordersCount,
      deltaIncome: pct(t.incomeCents, prev?.incomeCents ?? 0),
      deltaExpense: pct(t.expenseCents, prev?.expenseCents ?? 0),
      deltaProfit: pct(t.profitCents, prev?.profitCents ?? 0),
    };
  }, [snapshot]);

  const handleExportCsv = () => {
    if (!snapshot) return;
    const lines: string[] = [];
    lines.push("Sektion,Schlüssel,Wert (EUR)");
    lines.push(`Totals,Einnahmen,${(snapshot.totals.incomeCents / 100).toFixed(2)}`);
    lines.push(`Totals,Ausgaben,${(snapshot.totals.expenseCents / 100).toFixed(2)}`);
    lines.push(`Totals,Profit,${(snapshot.totals.profitCents / 100).toFixed(2)}`);
    lines.push(`Totals,Partner-Auszahlungen,${(snapshot.totals.partnerPayoutCents / 100).toFixed(2)}`);
    lines.push(`Totals,Offene Rechnungen,${(snapshot.totals.openInvoicesCents / 100).toFixed(2)}`);
    lines.push("");
    lines.push("Monat,Einnahmen,Ausgaben,Profit");
    for (const m of snapshot.byMonth) {
      lines.push(`${m.month},${(m.incomeCents / 100).toFixed(2)},${(m.expenseCents / 100).toFixed(2)},${(m.profitCents / 100).toFixed(2)}`);
    }
    lines.push("");
    lines.push("Partner,Aufträge,Umsatz,Auszahlung,Corion");
    for (const p of snapshot.byPartner) {
      lines.push(`"${p.partnerName.replace(/"/g, '""')}",${p.orderCount},${(p.revenueCents / 100).toFixed(2)},${(p.payoutCents / 100).toFixed(2)},${(p.corionCents / 100).toFixed(2)}`);
    }
    lines.push("");
    lines.push("Standort,Aufträge,Umsatz");
    for (const l of snapshot.byLocation) {
      lines.push(`"${l.location.replace(/"/g, '""')}",${l.orderCount},${(l.revenueCents / 100).toFixed(2)}`);
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cfo-cashflow-${periodMonths}M-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportiert", description: `Cashflow ${periodMonths} Monate als Datei gespeichert.` });
  };

  const filtered = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((t) => {
      if (locationFilter !== "ALL" && t.location !== locationFilter) return false;
      if (partnerFilter !== "ALL" && t.partner !== partnerFilter) return false;
      if (methodFilter !== "ALL" && t.paymentMethod !== methodFilter) return false;
      return true;
    }).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [locationFilter, partnerFilter, methodFilter]);

  const totals = useMemo(() => {
    let incomeNet = 0;
    let incomeTax = 0;
    let expenseNet = 0;
    let expenseTax = 0;
    let bar = 0;
    let konto = 0;

    for (const t of filtered) {
      const gross = t.amountNetCents + t.taxCents;
      if (t.type === "Einnahme") {
        incomeNet += t.amountNetCents;
        incomeTax += t.taxCents;
      } else {
        expenseNet += t.amountNetCents;
        expenseTax += t.taxCents;
      }
      if (t.paymentMethod === "BAR") bar += gross;
      else konto += gross;
    }

    const incomeGross = incomeNet + incomeTax;
    const expenseGross = expenseNet + expenseTax;
    const profitGross = incomeGross - expenseGross;

    return {
      incomeNet,
      incomeGross,
      expenseNet,
      expenseGross,
      profitGross,
      bar,
      konto,
      count: filtered.length,
    };
  }, [filtered]);

  const handleReset = () => {
    setLocationFilter("ALL");
    setPartnerFilter("ALL");
    setMethodFilter("ALL");
  };

  const handleFilesPicked = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const first = files[0];
    setUploading(true);
    setLastUpload(null);
    toast({
      title: "Beleg empfangen",
      description: `${first.name} wird verarbeitet…`,
    });
    window.setTimeout(() => {
      setUploading(false);
      setLastUpload(first.name);
      toast({
        title: "Corion AI fertig",
        description: "Daten wurden extrahiert und vorgemerkt.",
      });
    }, 1800);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  const activeFilterCount =
    (locationFilter !== "ALL" ? 1 : 0) +
    (partnerFilter !== "ALL" ? 1 : 0) +
    (methodFilter !== "ALL" ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="CFO Finanz-Dashboard | Corion Hub"
        description="Single Source of Truth für Einnahmen, Ausgaben und Profit über alle Standorte."
      />

      {/* Top chrome */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" data-testid="link-back-admin">
              <Button variant="ghost" size="icon" className="text-slate-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1
                className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 truncate"
                data-testid="text-page-title"
              >
                CFO Finanz-Dashboard
              </h1>
              <p className="text-xs md:text-sm text-slate-500 truncate">
                Single Source of Truth · Einnahmen, Ausgaben, Profit
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
              <Sparkles className="w-3 h-3 mr-1" /> Corion AI bereit
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Filter bar */}
        <Card className="bg-white border-slate-200 p-4 md:p-5">
          <div className="flex flex-wrap items-end gap-3 md:gap-4">
            <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
              <label
                htmlFor="filter-location"
                className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" /> Standort
              </label>
              <Select
                value={locationFilter}
                onValueChange={(v) => setLocationFilter(v as LocationFilter)}
              >
                <SelectTrigger
                  id="filter-location"
                  className="bg-white border-slate-300 text-slate-900"
                  data-testid="select-location"
                  aria-label="Standort filtern"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" data-testid="option-location-all">Alle Standorte</SelectItem>
                  <SelectItem value="Mainz-Kastel" data-testid="option-location-mainz">Mainz-Kastel</SelectItem>
                  <SelectItem value="Wallau" data-testid="option-location-wallau">Wallau</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
              <label
                htmlFor="filter-partner"
                className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" /> Partner
              </label>
              <Select
                value={partnerFilter}
                onValueChange={(v) => setPartnerFilter(v as PartnerFilter)}
              >
                <SelectTrigger
                  id="filter-partner"
                  className="bg-white border-slate-300 text-slate-900"
                  data-testid="select-partner"
                  aria-label="Partner filtern"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" data-testid="option-partner-all">Alle Partner</SelectItem>
                  <SelectItem value="Adil" data-testid="option-partner-adil">Adil</SelectItem>
                  <SelectItem value="Adam" data-testid="option-partner-adam">Adam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
              <label
                htmlFor="filter-method"
                className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" /> Zahlart
              </label>
              <Select
                value={methodFilter}
                onValueChange={(v) => setMethodFilter(v as MethodFilter)}
              >
                <SelectTrigger
                  id="filter-method"
                  className="bg-white border-slate-300 text-slate-900"
                  data-testid="select-method"
                  aria-label="Zahlart filtern"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" data-testid="option-method-all">Alle Zahlarten</SelectItem>
                  <SelectItem value="KONTO" data-testid="option-method-konto">KONTO</SelectItem>
                  <SelectItem value="BAR" data-testid="option-method-bar">BAR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {activeFilterCount} aktiv
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={activeFilterCount === 0}
                className="border-slate-300 text-slate-700"
                data-testid="button-reset-filters"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Zurücksetzen
              </Button>
            </div>
          </div>
        </Card>

        {/* KPI cards — real data with delta vs previous period */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            // Always prefer real data. While loading, show "—" placeholders rather
            // than mock numbers (avoids misleading the CFO with stale demo data).
            const isLive = !!realTotals;
            const isLoadingFirst = cashflowQuery.isLoading && !realTotals;
            const incomeGross = realTotals?.incomeGross ?? 0;
            const expenseGross = realTotals?.expenseGross ?? 0;
            const profitGross = realTotals?.profitGross ?? 0;
            const count = realTotals?.count ?? 0;
            const fmtKpi = (v: number) => (isLive ? fmtEur(v) : "— €");
            return (
              <>
                <Card className="bg-white border-slate-200 p-5 relative overflow-hidden" data-testid="card-kpi-income">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Einnahmen (Brutto)</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2 tabular-nums" data-testid="text-income-gross">
                        {fmtKpi(incomeGross)}
                      </p>
                      {isLive ? (
                        <DeltaPill value={realTotals!.deltaIncome} positiveIsGood={true} testId="delta-income" />
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 tabular-nums">{isLoadingFirst ? "lade…" : "—"}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-slate-200 p-5 relative overflow-hidden" data-testid="card-kpi-expense">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ausgaben (Brutto)</p>
                      <p className="text-3xl font-bold text-red-600 mt-2 tabular-nums" data-testid="text-expense-gross">
                        {fmtKpi(expenseGross)}
                      </p>
                      {isLive ? (
                        <DeltaPill value={realTotals!.deltaExpense} positiveIsGood={false} testId="delta-expense" />
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 tabular-nums">{isLoadingFirst ? "lade…" : "—"}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-slate-200 p-5 relative overflow-hidden" data-testid="card-kpi-profit">
                  <div className={`absolute top-0 left-0 w-1 h-full ${profitGross >= 0 ? "bg-slate-900" : "bg-amber-500"}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Differenz (Profit)</p>
                      <p
                        className={`text-3xl font-bold mt-2 tabular-nums ${profitGross >= 0 ? "text-slate-900" : "text-amber-600"}`}
                        data-testid="text-profit-gross"
                      >
                        {fmtKpi(profitGross)}
                      </p>
                      {isLive ? (
                        <DeltaPill value={realTotals!.deltaProfit} positiveIsGood={true} testId="delta-profit" subline={`${count} Auftr.`} />
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 tabular-nums">{isLoadingFirst ? "lade…" : "—"}</p>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${profitGross >= 0 ? "bg-slate-100" : "bg-amber-50"}`}>
                      <Wallet className={`w-5 h-5 ${profitGross >= 0 ? "text-slate-900" : "text-amber-600"}`} />
                    </div>
                  </div>
                </Card>
              </>
            );
          })()}
        </div>

        {/* Cash split sub-cards — real data when available */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white border-slate-200 p-4 flex items-center justify-between" data-testid="card-cash-bar">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-amber-50 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Bargeld-Volumen</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums" data-testid="text-cash-bar">
                  {realTotals ? fmtEur(realTotals.bar) : "— €"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">BAR</Badge>
          </Card>
          <Card className="bg-white border-slate-200 p-4 flex items-center justify-between" data-testid="card-cash-konto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Konto-Volumen</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums" data-testid="text-cash-konto">
                  {realTotals ? fmtEur(realTotals.konto) : "— €"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">KONTO</Badge>
          </Card>
        </div>

        {/* Period selector + CSV export */}
        <div className="flex items-center justify-between gap-3 flex-wrap" data-testid="section-period-controls">
          <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1">
            <CalendarRange className="w-3.5 h-3.5 ml-2 mr-1 text-slate-500" />
            {([3, 6, 12] as const).map((n) => (
              <Button
                key={n}
                size="sm"
                variant={periodMonths === n ? "default" : "ghost"}
                onClick={() => setPeriodMonths(n)}
                className={periodMonths === n ? "bg-slate-900 text-white" : "text-slate-700"}
                data-testid={`button-period-${n}`}
              >
                {n}M
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={!snapshot}
            className="border-slate-300 text-slate-700"
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" /> CSV exportieren
          </Button>
        </div>

        {/* Real-data money-flow charts */}
        {snapshot && (
          <div className="space-y-4" data-testid="section-cashflow">
            <CashFlowChart snapshot={snapshot} onMonthClick={setDrilldownMonth} />
          </div>
        )}
        {cashflowQuery.isLoading && !snapshot && (
          <div className="space-y-4" data-testid="cashflow-loading">
            <Card className="bg-white border-slate-200 p-5">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="h-72 bg-gradient-to-br from-slate-100 to-slate-50 rounded animate-pulse" />
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white border-slate-200 p-5">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="h-56 bg-gradient-to-br from-slate-100 to-slate-50 rounded animate-pulse" />
              </Card>
              <Card className="bg-white border-slate-200 p-5">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="h-56 bg-gradient-to-br from-slate-100 to-slate-50 rounded animate-pulse" />
              </Card>
            </div>
          </div>
        )}

        <MonthDrilldownModal month={drilldownMonth} onClose={() => setDrilldownMonth(null)} />

        {/* AI advisor */}
        <CFOAdvisor snapshot={snapshot} />

        {/* Upload Center */}
        <Card className="bg-white border-slate-200 p-5" data-testid="card-upload-center">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">
                  Beleg / Rechnung hochladen
                </p>
                <p className="text-sm text-slate-500">
                  PDF · JPG · XLSX · Corion AI extrahiert Lieferant, Datum, Netto und MwSt automatisch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastUpload && !uploading && (
                <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  <span className="truncate max-w-[160px]" data-testid="text-last-upload">
                    {lastUpload}
                  </span>
                </Badge>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFilesPicked(e.target.files)}
                data-testid="input-upload-file"
              />
              <Button
                onClick={triggerFilePicker}
                disabled={uploading}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                data-testid="button-upload-receipt"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Corion AI extrahiert Daten…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Datei auswählen
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Transactions table */}
        <Card className="bg-white border-slate-200 overflow-hidden" data-testid="card-transactions">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">
                Buchungen
              </h2>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700" data-testid="text-tx-count">
                {filtered.length}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Sortiert nach Datum (neueste zuerst)</p>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center" data-testid="text-tx-empty">
              <p className="text-sm text-slate-500">
                Keine Buchungen für die aktiven Filter. Filter zurücksetzen, um alle anzuzeigen.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-slate-600">Datum</TableHead>
                    <TableHead className="text-slate-600">Typ</TableHead>
                    <TableHead className="text-slate-600">Kunde / Lieferant</TableHead>
                    <TableHead className="text-slate-600">Standort</TableHead>
                    <TableHead className="text-slate-600">Partner</TableHead>
                    <TableHead className="text-slate-600">Zahlart</TableHead>
                    <TableHead className="text-slate-600 text-right">Netto</TableHead>
                    <TableHead className="text-slate-600 text-right">MwSt</TableHead>
                    <TableHead className="text-slate-600 text-right">Brutto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                      const gross = t.amountNetCents + t.taxCents;
                      const isIncome = t.type === "Einnahme";
                      return (
                        <TableRow
                          key={t.id}
                          className="border-slate-100"
                          data-testid={`row-tx-${t.id}`}
                        >
                          <TableCell className="text-slate-700 tabular-nums whitespace-nowrap">
                            {fmtDate(t.date)}
                          </TableCell>
                          <TableCell>
                            {isIncome ? (
                              <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
                                <TrendingUp className="w-3 h-3 mr-1" /> Einnahme
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                                <TrendingDown className="w-3 h-3 mr-1" /> Ausgabe
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-900 font-medium">
                            <div className="flex flex-col">
                              <span>{t.counterparty}</span>
                              {t.reference && (
                                <span className="text-xs text-slate-500">{t.reference}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {t.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">{t.partner}</TableCell>
                          <TableCell>
                            {t.paymentMethod === "BAR" ? (
                              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                                <Banknote className="w-3 h-3 mr-1" /> BAR
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                                <CreditCard className="w-3 h-3 mr-1" /> KONTO
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-slate-700 tabular-nums whitespace-nowrap">
                            {fmtEur(t.amountNetCents)}
                          </TableCell>
                          <TableCell className="text-right text-slate-500 tabular-nums whitespace-nowrap">
                            {fmtEur(t.taxCents)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold tabular-nums whitespace-nowrap ${
                              isIncome ? "text-emerald-700" : "text-red-700"
                            }`}
                            data-testid={`text-tx-gross-${t.id}`}
                          >
                            {isIncome ? "+" : "−"} {fmtEur(gross)}
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <p className="text-xs text-slate-400 text-center pt-2">
          Mock-Datenbasis · Anbindung an lokales OCR (Mac Mini) folgt im nächsten Schritt.
        </p>
      </main>
    </div>
  );
}
