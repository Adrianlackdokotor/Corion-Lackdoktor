import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MonthDetail {
  month: string;
  orders: Array<{
    id: string;
    referenceNumber: string | null;
    customerName: string;
    createdDate: string;
    totalCents: number;
    partnerPayoutCents: number;
    corionCents: number;
    status: string;
    paymentStatus: string;
    partnerName: string;
    location: string;
  }>;
  invoices: Array<{
    id: string;
    supplierName: string | null;
    invoiceNumber: string | null;
    totalCents: number;
    status: string;
    createdDate: string;
  }>;
}

const fmtEur = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const MONTH_LABELS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
function fmtMonth(m: string) {
  const [y, mm] = m.split("-");
  return `${MONTH_LABELS[parseInt(mm, 10) - 1] ?? mm} ${y}`;
}

interface Props {
  month: string | null;
  onClose: () => void;
}

export function MonthDrilldownModal({ month, onClose }: Props) {
  const open = !!month;
  const query = useQuery<MonthDetail>({
    queryKey: ["/api/cfo/cashflow/month", month],
    queryFn: async () => {
      const res = await fetch(`/api/cfo/cashflow/month/${month}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: open,
  });

  const data = query.data;
  const totalIncome = data?.orders.reduce((s, o) => s + o.totalCents, 0) ?? 0;
  const totalExpense = data?.invoices.filter((i) => i.status === "approved").reduce((s, i) => s + i.totalCents, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white" data-testid="dialog-month-drilldown">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Detail: {month ? fmtMonth(month) : ""}</DialogTitle>
          <DialogDescription className="text-slate-500">
            Aufträge und freigegebene Belege für diesen Monat.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="py-10 flex items-center justify-center text-slate-500 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Lade Monatsdetails…
          </div>
        ) : query.isError ? (
          <div className="py-10 text-center text-rose-600 text-sm">Konnte Daten nicht laden.</div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-slate-200 bg-emerald-50/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Einnahmen</p>
                <p className="text-xl font-bold text-emerald-700 tabular-nums" data-testid="text-month-income">
                  {fmtEur(totalIncome)}
                </p>
                <p className="text-xs text-slate-500">{data.orders.length} Aufträge</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-rose-50/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Ausgaben (freigegeben)</p>
                <p className="text-xl font-bold text-rose-700 tabular-nums" data-testid="text-month-expense">
                  {fmtEur(totalExpense)}
                </p>
                <p className="text-xs text-slate-500">{data.invoices.length} Belege</p>
              </div>
            </div>

            <section data-testid="section-month-orders">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" /> Aufträge
              </h3>
              {data.orders.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">Keine Aufträge in diesem Monat.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Datum</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead className="text-right">Brutto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((o) => (
                        <TableRow key={o.id} data-testid={`row-month-order-${o.id}`}>
                          <TableCell className="text-xs text-slate-600">{o.createdDate}</TableCell>
                          <TableCell className="text-xs font-mono">{o.referenceNumber ?? o.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm">{o.customerName}</TableCell>
                          <TableCell className="text-sm">{o.partnerName}</TableCell>
                          <TableCell className="text-sm text-right tabular-nums font-semibold">{fmtEur(o.totalCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section data-testid="section-month-invoices">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-slate-500" /> Belege
              </h3>
              {data.invoices.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">Keine Belege in diesem Monat.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Datum</TableHead>
                        <TableHead>Lieferant</TableHead>
                        <TableHead>Nummer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Brutto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.invoices.map((i) => (
                        <TableRow key={i.id} data-testid={`row-month-invoice-${i.id}`}>
                          <TableCell className="text-xs text-slate-600">{i.createdDate}</TableCell>
                          <TableCell className="text-sm">{i.supplierName ?? "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{i.invoiceNumber ?? "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                i.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : i.status === "rejected"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {i.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-right tabular-nums font-semibold">{fmtEur(i.totalCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
