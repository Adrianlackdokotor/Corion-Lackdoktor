import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Save, TrendingUp, TrendingDown,
  DollarSign, Receipt, BarChart3, Calendar, Loader2,
  ChevronLeft, ChevronRight, X, PieChart
} from "lucide-react";

const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

interface PartnerBreakEvenProps {
  partnerId: string;
  partnerName: string;
}

interface FinancialEntry {
  id: string;
  partnerId: string;
  month: number;
  year: number;
  entryDate: string;
  barCosti: number;
  rechnungCosti: number;
  stare: string;
  explicatii: string | null;
  clientBar: number;
  clientRechnung: number;
}

interface FixedCost {
  id: string;
  partnerId: string;
  name: string;
  amount: number;
  hasMwst: boolean;
  sortOrder: number;
}

function calcMwst(clientRechnung: number, rechnungCosti: number): number {
  return (clientRechnung - rechnungCosti) / 1.19 * 0.19 + rechnungCosti / 1.19 * 0.19;
}

function calcProfit(clientBar: number, clientRechnung: number, barCosti: number, rechnungCosti: number): number {
  const mwst = calcMwst(clientRechnung, rechnungCosti);
  return clientRechnung + clientBar - barCosti - rechnungCosti - mwst;
}

function fmt(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function PartnerBreakEven({ partnerId, partnerName }: PartnerBreakEvenProps) {
  const { toast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [view, setView] = useState<"month" | "dashboard" | "fixkosten">("month");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<Partial<FinancialEntry> | null>(null);
  const [editData, setEditData] = useState<Partial<FinancialEntry>>({});
  const [newFixedCost, setNewFixedCost] = useState<Partial<FixedCost> | null>(null);

  const { data: entries = [], isLoading: loadingEntries } = useQuery<FinancialEntry[]>({
    queryKey: [`/api/admin/partner/${partnerId}/financial-entries?month=${selectedMonth}&year=${selectedYear}`],
  });

  const { data: yearEntries = [], isLoading: loadingYear } = useQuery<FinancialEntry[]>({
    queryKey: [`/api/admin/partner/${partnerId}/financial-entries/year?year=${selectedYear}`],
    enabled: view === "dashboard",
  });

  const { data: fixedCosts = [], isLoading: loadingCosts } = useQuery<FixedCost[]>({
    queryKey: [`/api/admin/partner/${partnerId}/fixed-costs`],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ predicate: (query) => {
      const key = query.queryKey[0];
      return typeof key === "string" && key.includes(`/api/admin/partner/${partnerId}/`);
    }});
  };

  const createEntry = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/partner/${partnerId}/financial-entries`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setNewRow(null); toast({ title: "Eintrag erstellt" }); },
    onError: () => toast({ variant: "destructive", title: "Fehler" }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/partner/${partnerId}/financial-entries/${id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setEditingRow(null); toast({ title: "Eintrag aktualisiert" }); },
    onError: () => toast({ variant: "destructive", title: "Fehler" }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/partner/${partnerId}/financial-entries/${id}`);
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Eintrag gelöscht" }); },
    onError: () => toast({ variant: "destructive", title: "Fehler" }),
  });

  const createFixedCost = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/partner/${partnerId}/fixed-costs`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setNewFixedCost(null); toast({ title: "Fixkosten erstellt" }); },
    onError: () => toast({ variant: "destructive", title: "Fehler" }),
  });

  const deleteFixedCost = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/partner/${partnerId}/fixed-costs/${id}`);
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Fixkosten gelöscht" }); },
    onError: () => toast({ variant: "destructive", title: "Fehler" }),
  });

  const totals = useMemo(() => {
    const totalBarCosti = entries.reduce((s, e) => s + (e.barCosti || 0), 0);
    const totalRechnungCosti = entries.reduce((s, e) => s + (e.rechnungCosti || 0), 0);
    const totalClientBar = entries.reduce((s, e) => s + (e.clientBar || 0), 0);
    const totalClientRechnung = entries.reduce((s, e) => s + (e.clientRechnung || 0), 0);
    const totalMwst = entries.reduce((s, e) => s + calcMwst(e.clientRechnung || 0, e.rechnungCosti || 0), 0);
    const totalProfit = entries.reduce((s, e) => s + calcProfit(e.clientBar || 0, e.clientRechnung || 0, e.barCosti || 0, e.rechnungCosti || 0), 0);
    const neachitat = entries.filter(e => e.stare === "Neachitat").reduce((s, e) => s + (e.barCosti || 0) + (e.rechnungCosti || 0), 0);
    const totalIncasari = totalClientBar + totalClientRechnung;
    const facturatFirma = totalClientRechnung;

    const fixedCostTotal = fixedCosts.reduce((s, c) => s + (c.amount || 0), 0);
    const fixedCostMwst = fixedCosts.filter(c => c.hasMwst).reduce((s, c) => s + c.amount * 0.19, 0);

    return {
      totalBarCosti, totalRechnungCosti, totalClientBar, totalClientRechnung,
      totalMwst: totalMwst + fixedCostMwst, totalProfit, neachitat, totalIncasari,
      facturatFirma, fixedCostTotal, fixedCostMwst,
    };
  }, [entries, fixedCosts]);

  const dashboardData = useMemo(() => {
    if (view !== "dashboard") return [];
    const monthlyData = MONTHS.map((name, idx) => {
      const monthNum = idx + 1;
      const monthEntries = yearEntries.filter(e => e.month === monthNum);
      const totalBar = monthEntries.reduce((s, e) => s + (e.clientBar || 0), 0);
      const totalRechnung = monthEntries.reduce((s, e) => s + (e.clientRechnung || 0), 0);
      const costi = monthEntries.reduce((s, e) => s + (e.barCosti || 0) + (e.rechnungCosti || 0), 0);
      const mwst = monthEntries.reduce((s, e) => s + calcMwst(e.clientRechnung || 0, e.rechnungCosti || 0), 0);
      const totalChelt = costi + mwst;
      const totalIncasari = totalBar + totalRechnung;
      const profitFirma = totalRechnung - monthEntries.reduce((s, e) => s + (e.rechnungCosti || 0), 0) - mwst;
      const profitTotal = monthEntries.reduce((s, e) => s + calcProfit(e.clientBar || 0, e.clientRechnung || 0, e.barCosti || 0, e.rechnungCosti || 0), 0);
      return { name, monthNum, totalBar, totalRechnung, costi, mwst, totalChelt, totalIncasari, profitFirma, profitTotal };
    });
    return monthlyData;
  }, [yearEntries, view]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const handleSaveNewRow = () => {
    if (!newRow?.entryDate) return;
    createEntry.mutate({
      month: selectedMonth,
      year: selectedYear,
      entryDate: newRow.entryDate,
      barCosti: newRow.barCosti || 0,
      rechnungCosti: newRow.rechnungCosti || 0,
      stare: newRow.stare || "Neachitat",
      explicatii: newRow.explicatii || "",
      clientBar: newRow.clientBar || 0,
      clientRechnung: newRow.clientRechnung || 0,
    });
  };

  const handleSaveEdit = (id: string) => {
    updateEntry.mutate({ id, data: editData });
  };

  const startEdit = (entry: FinancialEntry) => {
    setEditingRow(entry.id);
    setEditData({
      entryDate: entry.entryDate?.split("T")[0],
      barCosti: entry.barCosti,
      rechnungCosti: entry.rechnungCosti,
      stare: entry.stare,
      explicatii: entry.explicatii || "",
      clientBar: entry.clientBar,
      clientRechnung: entry.clientRechnung,
    });
  };

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" data-testid="text-breakeven-title">Break-Even Rechner</h2>
          <p className="text-sm text-muted-foreground">{partnerName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
            data-testid="button-view-month"
          >
            <Calendar className="w-4 h-4 mr-1" /> Monatsansicht
          </Button>
          <Button
            variant={view === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("dashboard")}
            data-testid="button-view-dashboard"
          >
            <BarChart3 className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <Button
            variant={view === "fixkosten" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("fixkosten")}
            data-testid="button-view-fixkosten"
          >
            <Receipt className="w-4 h-4 mr-1" /> Fixkosten
          </Button>
        </div>
      </div>

      {view === "month" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-sm min-w-[140px] text-center">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Facturat Firma Brutto</p>
                <p className="text-lg font-bold" data-testid="text-facturat-firma">{fmt(totals.facturatFirma)} &euro;</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Incasari</p>
                <p className="text-lg font-bold" data-testid="text-total-incasari">{fmt(totals.totalIncasari)} &euro;</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Profit</p>
                <p className={`text-lg font-bold ${totals.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`} data-testid="text-total-profit">
                  {fmt(totals.totalProfit)} &euro;
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Neachitat</p>
                <p className="text-lg font-bold text-orange-500" data-testid="text-neachitat">{fmt(totals.neachitat)} &euro;</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-semibold" rowSpan={2}>Data</th>
                      <th className="p-2 text-center font-semibold border-l" colSpan={2}>Plati Partener</th>
                      <th className="p-2 text-center font-semibold border-l">Stare</th>
                      <th className="p-2 text-left font-semibold border-l">Explicatii</th>
                      <th className="p-2 text-center font-semibold border-l" colSpan={2}>Corion</th>
                      <th className="p-2 text-right font-semibold border-l">MwSt</th>
                      <th className="p-2 text-right font-semibold border-l">Profit</th>
                      <th className="p-2 text-center font-semibold border-l w-16"></th>
                    </tr>
                    <tr className="border-b bg-muted/30">
                      <th className="p-2 text-right font-normal text-muted-foreground border-l">Bar</th>
                      <th className="p-2 text-right font-normal text-muted-foreground">Rechnung</th>
                      <th className="p-2 text-center font-normal text-muted-foreground border-l"></th>
                      <th className="p-2 text-left font-normal text-muted-foreground border-l"></th>
                      <th className="p-2 text-right font-normal text-muted-foreground border-l">Bar</th>
                      <th className="p-2 text-right font-normal text-muted-foreground">Rechnung</th>
                      <th className="p-2 text-right font-normal text-muted-foreground border-l">(TVA)</th>
                      <th className="p-2 text-right font-normal text-muted-foreground border-l">Corion</th>
                      <th className="p-2 border-l"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEntries ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    ) : (
                      <>
                        {entries.map((entry) => {
                          const isEditing = editingRow === entry.id;
                          const mwst = calcMwst(entry.clientRechnung || 0, entry.rechnungCosti || 0);
                          const profit = calcProfit(entry.clientBar || 0, entry.clientRechnung || 0, entry.barCosti || 0, entry.rechnungCosti || 0);
                          const dateStr = entry.entryDate ? new Date(entry.entryDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : "";

                          if (isEditing) {
                            const eMwst = calcMwst(Number(editData.clientRechnung) || 0, Number(editData.rechnungCosti) || 0);
                            const eProfit = calcProfit(Number(editData.clientBar) || 0, Number(editData.clientRechnung) || 0, Number(editData.barCosti) || 0, Number(editData.rechnungCosti) || 0);
                            return (
                              <tr key={entry.id} className="border-b bg-primary/5">
                                <td className="p-1">
                                  <Input type="date" className="h-7 text-xs w-[110px]" value={editData.entryDate as string || ""} onChange={e => setEditData(d => ({...d, entryDate: e.target.value}))} data-testid={`input-edit-date-${entry.id}`} />
                                </td>
                                <td className="p-1 border-l"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" value={editData.barCosti ?? ""} onChange={e => setEditData(d => ({...d, barCosti: parseFloat(e.target.value) || 0}))} /></td>
                                <td className="p-1"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" value={editData.rechnungCosti ?? ""} onChange={e => setEditData(d => ({...d, rechnungCosti: parseFloat(e.target.value) || 0}))} /></td>
                                <td className="p-1 border-l">
                                  <Select value={editData.stare as string || "Neachitat"} onValueChange={v => setEditData(d => ({...d, stare: v}))}>
                                    <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Achitat">Achitat</SelectItem>
                                      <SelectItem value="Neachitat">Neachitat</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-1 border-l"><Input className="h-7 text-xs w-[120px]" value={editData.explicatii ?? ""} onChange={e => setEditData(d => ({...d, explicatii: e.target.value}))} /></td>
                                <td className="p-1 border-l"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" value={editData.clientBar ?? ""} onChange={e => setEditData(d => ({...d, clientBar: parseFloat(e.target.value) || 0}))} /></td>
                                <td className="p-1"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" value={editData.clientRechnung ?? ""} onChange={e => setEditData(d => ({...d, clientRechnung: parseFloat(e.target.value) || 0}))} /></td>
                                <td className="p-1 border-l text-right text-muted-foreground">{fmt(eMwst)}</td>
                                <td className={`p-1 border-l text-right font-medium ${eProfit >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(eProfit)}</td>
                                <td className="p-1 border-l">
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(entry.id)} disabled={updateEntry.isPending} data-testid={`button-save-edit-${entry.id}`}>
                                      <Save className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingRow(null)} data-testid={`button-cancel-edit-${entry.id}`}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={entry.id} className="border-b hover-elevate cursor-pointer" onClick={() => startEdit(entry)} data-testid={`row-entry-${entry.id}`}>
                              <td className="p-2 font-mono">{dateStr}</td>
                              <td className="p-2 text-right border-l">{entry.barCosti ? fmt(entry.barCosti) : ""}</td>
                              <td className="p-2 text-right">{entry.rechnungCosti ? fmt(entry.rechnungCosti) : ""}</td>
                              <td className="p-2 text-center border-l">
                                <Badge variant="outline" className={entry.stare === "Achitat" ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-orange-500/10 text-orange-500 border-orange-500/30"}>
                                  {entry.stare}
                                </Badge>
                              </td>
                              <td className="p-2 border-l text-muted-foreground">{entry.explicatii}</td>
                              <td className="p-2 text-right border-l">{entry.clientBar ? fmt(entry.clientBar) : ""}</td>
                              <td className="p-2 text-right">{entry.clientRechnung ? fmt(entry.clientRechnung) : ""}</td>
                              <td className="p-2 text-right border-l text-muted-foreground">{fmt(mwst)}</td>
                              <td className={`p-2 text-right border-l font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(profit)}</td>
                              <td className="p-1 border-l">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteEntry.mutate(entry.id); }} data-testid={`button-delete-entry-${entry.id}`}>
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}

                        {newRow && (
                          <tr className="border-b bg-primary/5">
                            <td className="p-1">
                              <Input type="date" className="h-7 text-xs w-[110px]" value={newRow.entryDate as string || ""} onChange={e => setNewRow(r => ({...r, entryDate: e.target.value}))} data-testid="input-new-date" />
                            </td>
                            <td className="p-1 border-l"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" placeholder="0.00" value={newRow.barCosti ?? ""} onChange={e => setNewRow(r => ({...r, barCosti: parseFloat(e.target.value) || 0}))} data-testid="input-new-bar-costi" /></td>
                            <td className="p-1"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" placeholder="0.00" value={newRow.rechnungCosti ?? ""} onChange={e => setNewRow(r => ({...r, rechnungCosti: parseFloat(e.target.value) || 0}))} data-testid="input-new-rechnung-costi" /></td>
                            <td className="p-1 border-l">
                              <Select value={newRow.stare || "Neachitat"} onValueChange={v => setNewRow(r => ({...r, stare: v}))}>
                                <SelectTrigger className="h-7 text-xs w-[100px]" data-testid="select-new-stare"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Achitat">Achitat</SelectItem>
                                  <SelectItem value="Neachitat">Neachitat</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1 border-l"><Input className="h-7 text-xs w-[120px]" placeholder="Beschreibung" value={newRow.explicatii ?? ""} onChange={e => setNewRow(r => ({...r, explicatii: e.target.value}))} data-testid="input-new-explicatii" /></td>
                            <td className="p-1 border-l"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" placeholder="0.00" value={newRow.clientBar ?? ""} onChange={e => setNewRow(r => ({...r, clientBar: parseFloat(e.target.value) || 0}))} data-testid="input-new-client-bar" /></td>
                            <td className="p-1"><Input type="number" step="0.01" className="h-7 text-xs w-[80px] text-right" placeholder="0.00" value={newRow.clientRechnung ?? ""} onChange={e => setNewRow(r => ({...r, clientRechnung: parseFloat(e.target.value) || 0}))} data-testid="input-new-client-rechnung" /></td>
                            <td className="p-1 border-l text-right text-muted-foreground text-xs">
                              {fmt(calcMwst(Number(newRow.clientRechnung) || 0, Number(newRow.rechnungCosti) || 0))}
                            </td>
                            <td className="p-1 border-l text-right text-xs font-medium">
                              {fmt(calcProfit(Number(newRow.clientBar) || 0, Number(newRow.clientRechnung) || 0, Number(newRow.barCosti) || 0, Number(newRow.rechnungCosti) || 0))}
                            </td>
                            <td className="p-1 border-l">
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveNewRow} disabled={createEntry.isPending} data-testid="button-save-new-entry">
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewRow(null)} data-testid="button-cancel-new-entry">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr className="bg-muted/50 font-semibold text-xs">
                          <td className="p-2">Total</td>
                          <td className="p-2 text-right border-l">{fmt(totals.totalBarCosti)}</td>
                          <td className="p-2 text-right">{fmt(totals.totalRechnungCosti)}</td>
                          <td className="p-2 text-center border-l text-orange-500">{fmt(totals.neachitat)}</td>
                          <td className="p-2 border-l"></td>
                          <td className="p-2 text-right border-l">{fmt(totals.totalClientBar)}</td>
                          <td className="p-2 text-right">{fmt(totals.totalClientRechnung)}</td>
                          <td className="p-2 text-right border-l">{fmt(totals.totalMwst)}</td>
                          <td className={`p-2 text-right border-l ${totals.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(totals.totalProfit)}</td>
                          <td className="p-2 border-l"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {!newRow && (
            <Button variant="outline" className="gap-2" onClick={() => setNewRow({ stare: "Neachitat" })} data-testid="button-add-entry">
              <Plus className="w-4 h-4" /> Neuer Eintrag
            </Button>
          )}
        </>
      )}

      {view === "dashboard" && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm min-w-[60px] text-center">{selectedYear}</span>
            <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {(() => {
            const grandTotals = dashboardData.reduce((acc, m) => ({
              totalBar: acc.totalBar + m.totalBar,
              totalRechnung: acc.totalRechnung + m.totalRechnung,
              costi: acc.costi + m.costi,
              mwst: acc.mwst + m.mwst,
              totalChelt: acc.totalChelt + m.totalChelt,
              totalIncasari: acc.totalIncasari + m.totalIncasari,
              profitFirma: acc.profitFirma + m.profitFirma,
              profitTotal: acc.profitTotal + m.profitTotal,
            }), { totalBar: 0, totalRechnung: 0, costi: 0, mwst: 0, totalChelt: 0, totalIncasari: 0, profitFirma: 0, profitTotal: 0 });

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Profit Cash+Firma</p>
                      <p className={`text-xl font-bold ${grandTotals.profitTotal >= 0 ? "text-green-500" : "text-red-500"}`} data-testid="text-dashboard-profit">
                        {fmt(grandTotals.profitTotal)} &euro;
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Total Cheltuieli</p>
                      <p className="text-xl font-bold text-red-500" data-testid="text-dashboard-chelt">{fmt(grandTotals.totalChelt)} &euro;</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Total Incasari</p>
                      <p className="text-xl font-bold" data-testid="text-dashboard-incasari">{fmt(grandTotals.totalIncasari)} &euro;</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><PieChart className="w-3 h-3" /> MwSt. 19%</p>
                      <p className="text-xl font-bold text-muted-foreground" data-testid="text-dashboard-mwst">{fmt(grandTotals.mwst)} &euro;</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left font-semibold">Month</th>
                            <th className="p-2 text-right font-semibold">Total Bar</th>
                            <th className="p-2 text-right font-semibold">Total Rechnung</th>
                            <th className="p-2 text-right font-semibold">Costi</th>
                            <th className="p-2 text-right font-semibold">MwSt. 19%</th>
                            <th className="p-2 text-right font-semibold">Total Chelt.</th>
                            <th className="p-2 text-right font-semibold">Total Incasari</th>
                            <th className="p-2 text-right font-semibold">Profit Firma</th>
                            <th className="p-2 text-right font-semibold">Profit Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingYear ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                              </td>
                            </tr>
                          ) : (
                            <>
                              {dashboardData.map((m) => (
                                <tr
                                  key={m.monthNum}
                                  className={`border-b cursor-pointer hover-elevate ${m.totalIncasari > 0 ? "" : "opacity-50"}`}
                                  onClick={() => { setSelectedMonth(m.monthNum); setView("month"); }}
                                  data-testid={`row-dashboard-month-${m.monthNum}`}
                                >
                                  <td className="p-2 font-medium">{m.name}</td>
                                  <td className="p-2 text-right">{fmt(m.totalBar)}</td>
                                  <td className="p-2 text-right">{fmt(m.totalRechnung)}</td>
                                  <td className="p-2 text-right text-red-500">{fmt(m.costi)}</td>
                                  <td className="p-2 text-right text-muted-foreground">{fmt(m.mwst)}</td>
                                  <td className="p-2 text-right text-red-500">{fmt(m.totalChelt)}</td>
                                  <td className="p-2 text-right">{fmt(m.totalIncasari)}</td>
                                  <td className="p-2 text-right">{fmt(m.profitFirma)}</td>
                                  <td className={`p-2 text-right font-medium ${m.profitTotal >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(m.profitTotal)}</td>
                                </tr>
                              ))}
                              <tr className="bg-muted/50 font-semibold">
                                <td className="p-2">Total</td>
                                <td className="p-2 text-right">{fmt(grandTotals.totalBar)}</td>
                                <td className="p-2 text-right">{fmt(grandTotals.totalRechnung)}</td>
                                <td className="p-2 text-right text-red-500">{fmt(grandTotals.costi)}</td>
                                <td className="p-2 text-right text-muted-foreground">{fmt(grandTotals.mwst)}</td>
                                <td className="p-2 text-right text-red-500">{fmt(grandTotals.totalChelt)}</td>
                                <td className="p-2 text-right">{fmt(grandTotals.totalIncasari)}</td>
                                <td className="p-2 text-right">{fmt(grandTotals.profitFirma)}</td>
                                <td className={`p-2 text-right ${grandTotals.profitTotal >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(grandTotals.profitTotal)}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-2">TVA se plateste pe data de 10 la 2 luni diferenta</p>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </>
      )}

      {view === "fixkosten" && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-semibold">Cheltuieli Fixe</th>
                      <th className="p-2 text-right font-semibold">Valoare</th>
                      <th className="p-2 text-right font-semibold">MwSt (TVA)</th>
                      <th className="p-2 text-center font-semibold w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCosts ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    ) : (
                      <>
                        {fixedCosts.map((cost) => (
                          <tr key={cost.id} className="border-b" data-testid={`row-fixcost-${cost.id}`}>
                            <td className="p-2">{cost.name}</td>
                            <td className="p-2 text-right">{fmt(cost.amount)}</td>
                            <td className="p-2 text-right text-muted-foreground">{cost.hasMwst ? fmt(cost.amount * 0.19) : "-"}</td>
                            <td className="p-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteFixedCost.mutate(cost.id)} data-testid={`button-delete-fixcost-${cost.id}`}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}

                        {newFixedCost && (
                          <tr className="border-b bg-primary/5">
                            <td className="p-1">
                              <Input className="h-7 text-xs" placeholder="Name" value={newFixedCost.name ?? ""} onChange={e => setNewFixedCost(c => ({...c, name: e.target.value}))} data-testid="input-new-fixcost-name" />
                            </td>
                            <td className="p-1">
                              <Input type="number" step="0.01" className="h-7 text-xs w-[100px] text-right" placeholder="0.00" value={newFixedCost.amount ?? ""} onChange={e => setNewFixedCost(c => ({...c, amount: parseFloat(e.target.value) || 0}))} data-testid="input-new-fixcost-amount" />
                            </td>
                            <td className="p-1">
                              <Select value={newFixedCost.hasMwst ? "ja" : "nein"} onValueChange={v => setNewFixedCost(c => ({...c, hasMwst: v === "ja"}))}>
                                <SelectTrigger className="h-7 text-xs w-[80px]" data-testid="select-new-fixcost-mwst"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ja">Ja</SelectItem>
                                  <SelectItem value="nein">Nein</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                  if (!newFixedCost.name) return;
                                  createFixedCost.mutate({
                                    name: newFixedCost.name,
                                    amount: newFixedCost.amount || 0,
                                    hasMwst: newFixedCost.hasMwst || false,
                                    sortOrder: fixedCosts.length,
                                  });
                                }} disabled={createFixedCost.isPending} data-testid="button-save-new-fixcost">
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewFixedCost(null)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr className="bg-muted/50 font-semibold">
                          <td className="p-2">Total</td>
                          <td className="p-2 text-right">{fmt(fixedCosts.reduce((s, c) => s + (c.amount || 0), 0))}</td>
                          <td className="p-2 text-right text-muted-foreground">{fmt(fixedCosts.filter(c => c.hasMwst).reduce((s, c) => s + c.amount * 0.19, 0))}</td>
                          <td className="p-2"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {!newFixedCost && (
            <Button variant="outline" className="gap-2" onClick={() => setNewFixedCost({ hasMwst: false })} data-testid="button-add-fixcost">
              <Plus className="w-4 h-4" /> Neue Fixkosten
            </Button>
          )}
        </>
      )}
    </div>
  );
}
