import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SEO from "@/components/SEO";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Plus,
  Settings,
  Trash2,
  Save,
  Wallet,
  CreditCard,
  CircleDot,
  Target,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Calculator,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import type { ExpenseCategory, FinancialTransaction } from "@shared/schema";

const CHART_COLORS = ["#E53935", "#43A047", "#1E88E5", "#FB8C00", "#8E24AA", "#00ACC1", "#6D4C41", "#546E7A"];

function fmt(cents: number): string {
  return (cents / 100).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}

export default function HubFinance() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"dashboard" | "transactions" | "settings">("dashboard");
  const [fixedCostsInput, setFixedCostsInput] = useState("");

  const { data: categories = [], isLoading: catLoading } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/hub/finance/categories"],
    enabled: isAuthenticated,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<FinancialTransaction[]>({
    queryKey: ["/api/hub/finance/transactions"],
    enabled: isAuthenticated,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hub/finance/categories/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/finance/categories"] });
      toast({ title: "Categorii create cu succes" });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (data: { name: string; type: string; targetGuwPercent: number }) =>
      apiRequest("POST", "/api/hub/finance/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/finance/categories"] });
      toast({ title: "Categorie adăugată" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/hub/finance/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/finance/categories"] });
      toast({ title: "Categorie ștearsă" });
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/hub/finance/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/finance/transactions"] });
      toast({ title: "Tranzacție adăugată" });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/hub/finance/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/finance/transactions"] });
      toast({ title: "Tranzacție ștearsă" });
    },
  });

  const kpis = useMemo(() => {
    const totalRevenue = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amountCents, 0);
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amountCents, 0);
    const netProfit = totalRevenue - totalExpenses;

    const fixedCats = categories.filter((c) => c.type === "fixed").map((c) => c.id);
    const totalFixed = transactions.filter((t) => t.type === "expense" && t.categoryId && fixedCats.includes(t.categoryId)).reduce((s, t) => s + t.amountCents, 0);
    const fixedOverride = fixedCostsInput ? parseFloat(fixedCostsInput) * 100 : 0;
    const fixedForBreakEven = fixedOverride || totalFixed;
    const breakEven = netProfit - fixedForBreakEven;

    const materialCat = categories.find((c) => c.name.toLowerCase().includes("material"));
    const partsCat = categories.find((c) => c.name.toLowerCase().includes("piese") || c.name.toLowerCase().includes("ersatz"));
    const subCat = categories.find((c) => c.name.toLowerCase().includes("subcontract") || c.name.toLowerCase().includes("manopera ext"));

    const materialExpense = materialCat ? transactions.filter((t) => t.type === "expense" && t.categoryId === materialCat.id).reduce((s, t) => s + t.amountCents, 0) : 0;
    const partsExpense = partsCat ? transactions.filter((t) => t.type === "expense" && t.categoryId === partsCat.id).reduce((s, t) => s + t.amountCents, 0) : 0;
    const subExpense = subCat ? transactions.filter((t) => t.type === "expense" && t.categoryId === subCat.id).reduce((s, t) => s + t.amountCents, 0) : 0;

    const partsGuw = partsCat?.targetGuwPercent || 10;
    const estimatedPartsProfit = Math.round(partsExpense * (partsGuw / 100));

    return {
      totalRevenue, totalExpenses, netProfit, breakEven, fixedForBreakEven,
      materialExpense, partsExpense, subExpense, estimatedPartsProfit,
      materialPct: pct(materialExpense, totalRevenue),
      partsPct: pct(partsExpense, totalRevenue),
      subPct: pct(subExpense, totalRevenue),
    };
  }, [transactions, categories, fixedCostsInput]);

  const monthlyChart = useMemo(() => {
    const months: Record<string, { month: string; incasari: number; cheltuieli: number }> = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { month: key, incasari: 0, cheltuieli: 0 };
      if (t.type === "income") months[key].incasari += t.amountCents / 100;
      else months[key].cheltuieli += t.amountCents / 100;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const name = cat?.name || "Altele";
      byCategory[name] = (byCategory[name] || 0) + t.amountCents / 100;
    });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Tablou de Bord Financiar | Corion Hub" description="Management financiar pentru atelierul auto" />

      <div className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/hub">
                <Button variant="ghost" size="sm" data-testid="link-back-hub">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Hub
                </Button>
              </Link>
              <h1 className="text-lg font-bold font-heading">Tablou de Bord Financiar</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant={view === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setView("dashboard")} data-testid="button-view-dashboard">
                <BarChart3 className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
              <Button variant={view === "transactions" ? "default" : "outline"} size="sm" onClick={() => setView("transactions")} data-testid="button-view-transactions">
                <FileText className="w-4 h-4 mr-1" />
                Tranzacții
              </Button>
              <Button variant={view === "settings" ? "default" : "outline"} size="sm" onClick={() => setView("settings")} data-testid="button-view-settings">
                <Settings className="w-4 h-4 mr-1" />
                Categorii
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {view === "dashboard" && <DashboardView kpis={kpis} monthlyChart={monthlyChart} pieData={pieData} fixedCostsInput={fixedCostsInput} setFixedCostsInput={setFixedCostsInput} />}
        {view === "transactions" && (
          <TransactionsView
            transactions={transactions}
            categories={categories}
            onAdd={addTransactionMutation.mutate}
            onDelete={deleteTransactionMutation.mutate}
            isAdding={addTransactionMutation.isPending}
            isLoading={txLoading}
          />
        )}
        {view === "settings" && (
          <SettingsView
            categories={categories}
            onSeed={() => seedMutation.mutate()}
            onAdd={addCategoryMutation.mutate}
            onDelete={deleteCategoryMutation.mutate}
            isSeeding={seedMutation.isPending}
            isLoading={catLoading}
          />
        )}
      </div>
    </div>
  );
}

function GaugeCard({ label, value, color, thresholds }: { label: string; value: number; color: string; thresholds?: { green: number; red: number } }) {
  let statusColor = "text-muted-foreground";
  if (thresholds) {
    if (value <= thresholds.green) statusColor = "text-green-500";
    else if (value >= thresholds.red) statusColor = "text-red-500";
    else statusColor = "text-yellow-500";
  }

  const displayPct = Math.min(value, 100);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (displayPct / 100) * circumference;

  return (
    <Card className="p-4 text-center" data-testid={`gauge-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
          <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${statusColor}`}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
      {thresholds && (
        <p className="text-[11px] text-muted-foreground mt-1">
          {value <= thresholds.green ? "Optim" : value >= thresholds.red ? "Atenție!" : "Acceptabil"}
        </p>
      )}
    </Card>
  );
}

function DashboardView({ kpis, monthlyChart, pieData, fixedCostsInput, setFixedCostsInput }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4" data-testid="kpi-revenue">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Încasări</p>
              <p className="text-lg font-bold">{fmt(kpis.totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" data-testid="kpi-expenses">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cheltuieli</p>
              <p className="text-lg font-bold">{fmt(kpis.totalExpenses)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" data-testid="kpi-cashflow">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${kpis.netProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <DollarSign className={`w-5 h-5 ${kpis.netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cashflow</p>
              <p className={`text-lg font-bold ${kpis.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(kpis.netProfit)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" data-testid="kpi-breakeven">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${kpis.breakEven >= 0 ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
              {kpis.breakEven >= 0 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Break-Even</p>
              <p className={`text-lg font-bold ${kpis.breakEven >= 0 ? "text-green-500" : "text-yellow-500"}`}>{fmt(kpis.breakEven)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" data-testid="kpi-parts-profit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profit Piese (est.)</p>
              <p className="text-lg font-bold text-blue-500">{fmt(kpis.estimatedPartsProfit)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GaugeCard label="Materiale %" value={kpis.materialPct} color="#43A047" thresholds={{ green: 12, red: 18 }} />
        <GaugeCard label="Piese Auto %" value={kpis.partsPct} color="#1E88E5" />
        <GaugeCard label="Subcontractori %" value={kpis.subPct} color="#FB8C00" />
      </div>

      <Card className="p-4" data-testid="section-fixed-costs">
        <div className="flex items-center gap-3 flex-wrap">
          <Target className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm font-medium">Costuri fixe lunare (estimare rapidă):</span>
          <Input
            type="number"
            placeholder="ex. 5000"
            value={fixedCostsInput}
            onChange={(e) => setFixedCostsInput(e.target.value)}
            className="w-40"
            data-testid="input-fixed-costs"
          />
          <span className="text-xs text-muted-foreground">€ / lună (opțional, suprascrie calculul automat)</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4" data-testid="chart-monthly">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Încasări vs. Cheltuieli (lunar)
          </h3>
          {monthlyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("ro-RO")} €`} />
                <Legend />
                <Bar dataKey="incasari" name="Încasări" fill="#43A047" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cheltuieli" name="Cheltuieli" fill="#E53935" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Adăugați tranzacții pentru a vedea graficul
            </div>
          )}
        </Card>
        <Card className="p-4" data-testid="chart-pie">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Distribuție Cheltuieli
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {pieData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toLocaleString("ro-RO")} €`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Adăugați cheltuieli pentru a vedea graficul
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function TransactionsView({ transactions, categories, onAdd, onDelete, isAdding, isLoading }: any) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<string>("income");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onAdd({
      date: new Date(date).toISOString(),
      type,
      amountCents: Math.round(parseFloat(amount) * 100),
      categoryId: type === "expense" ? categoryId || null : null,
      description: description || null,
      paymentMethod: type === "income" ? paymentMethod : null,
    });
    setAmount("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-5" data-testid="form-transaction">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Adaugă Tranzacție
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="text-xs font-medium mb-1 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-tx-date" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Tip</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-tx-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Încasare</SelectItem>
                <SelectItem value="expense">Cheltuială</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Sumă (€)</label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-tx-amount" />
          </div>
          {type === "expense" && (
            <div>
              <label className="text-xs font-medium mb-1 block">Categorie</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-tx-category">
                  <SelectValue placeholder="Alege..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: ExpenseCategory) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === "income" && (
            <div>
              <label className="text-xs font-medium mb-1 block">Metoda</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-tx-payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bancă</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 block">Descriere / Client</label>
            <Input placeholder="ex. Reparatie BMW" value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-tx-description" />
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={isAdding} data-testid="button-add-tx">
              <Plus className="w-4 h-4 mr-1" />
              {isAdding ? "Se adaugă..." : "Adaugă"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5" data-testid="table-transactions">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Jurnal Tranzacții
        </h3>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nicio tranzacție încă. Adăugați prima tranzacție mai sus.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Data</th>
                  <th className="text-left p-2 font-medium">Tip</th>
                  <th className="text-left p-2 font-medium">Categorie / Metodă</th>
                  <th className="text-right p-2 font-medium">Sumă</th>
                  <th className="text-left p-2 font-medium">Descriere</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: FinancialTransaction) => {
                  const cat = categories.find((c: ExpenseCategory) => c.id === t.categoryId);
                  return (
                    <tr key={t.id} className="border-b border-border/50" data-testid={`row-tx-${t.id}`}>
                      <td className="p-2">{new Date(t.date).toLocaleDateString("ro-RO")}</td>
                      <td className="p-2">
                        <Badge className={t.type === "income" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}>
                          {t.type === "income" ? (
                            <><Wallet className="w-3 h-3 mr-1" />Încasare</>
                          ) : (
                            <><CreditCard className="w-3 h-3 mr-1" />Cheltuială</>
                          )}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {t.type === "income" ? (t.paymentMethod === "cash" ? "Cash" : "Bancă") : cat?.name || "-"}
                      </td>
                      <td className={`p-2 text-right font-bold ${t.type === "income" ? "text-green-500" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amountCents)}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs max-w-[200px] truncate">{t.description || "-"}</td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)} data-testid={`button-delete-tx-${t.id}`}>
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SettingsView({ categories, onSeed, onAdd, onDelete, isSeeding, isLoading }: any) {
  const [name, setName] = useState("");
  const [type, setType] = useState("variable");
  const [guw, setGuw] = useState("0");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, targetGuwPercent: parseInt(guw) || 0 });
    setName("");
    setGuw("0");
  };

  return (
    <div className="space-y-6">
      {categories.length === 0 && (
        <Card className="p-6 text-center" data-testid="section-seed">
          <p className="text-muted-foreground mb-4">Nu aveți categorii de cheltuieli. Încărcați categoriile implicite sau creați-le manual.</p>
          <Button onClick={onSeed} disabled={isSeeding} data-testid="button-seed-categories">
            <Plus className="w-4 h-4 mr-2" />
            {isSeeding ? "Se creează..." : "Încarcă Categorii Implicite"}
          </Button>
        </Card>
      )}

      <Card className="p-5" data-testid="form-category">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Adaugă Categorie
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-medium mb-1 block">Nume</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Consumabile" data-testid="input-cat-name" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Tip</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-cat-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="variable">Variabil</SelectItem>
                <SelectItem value="fixed">Fix</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">GuW % (Profit Markup)</label>
            <Input type="number" min="0" max="100" value={guw} onChange={(e) => setGuw(e.target.value)} data-testid="input-cat-guw" />
          </div>
          <div>
            <Button type="submit" className="w-full" data-testid="button-add-cat">
              <Save className="w-4 h-4 mr-1" />
              Salvează
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5" data-testid="table-categories">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Categorii Existente
        </h3>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nicio categorie configurată.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Nume</th>
                  <th className="text-left p-2 font-medium">Tip</th>
                  <th className="text-right p-2 font-medium">GuW %</th>
                  <th className="text-center p-2 font-medium">Implicit</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c: ExpenseCategory) => (
                  <tr key={c.id} className="border-b border-border/50" data-testid={`row-cat-${c.id}`}>
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2">
                      <Badge className={c.type === "fixed" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"}>
                        {c.type === "fixed" ? "Fix" : "Variabil"}
                      </Badge>
                    </td>
                    <td className="p-2 text-right font-bold">{c.targetGuwPercent}%</td>
                    <td className="p-2 text-center">{c.isDefault && <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} data-testid={`button-delete-cat-${c.id}`}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
