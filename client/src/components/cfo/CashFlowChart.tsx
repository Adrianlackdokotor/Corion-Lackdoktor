import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, MapPin } from "lucide-react";

export interface CashflowByMonth {
  month: string;
  incomeCents: number;
  expenseCents: number;
  profitCents: number;
}
export interface CashflowByPartner {
  partnerId: string;
  partnerName: string;
  revenueCents: number;
  payoutCents: number;
  corionCents: number;
  orderCount: number;
}
export interface CashflowByLocation {
  location: string;
  revenueCents: number;
  orderCount: number;
}
export interface CashflowSnapshot {
  months: number;
  filters?: { location: string | null; partner: string | null };
  byMonth: CashflowByMonth[];
  byPartner: CashflowByPartner[];
  byLocation: CashflowByLocation[];
  totals: {
    incomeCents: number;
    expenseCents: number;
    profitCents: number;
    partnerPayoutCents: number;
    openInvoicesCents: number;
    openInvoicesCount: number;
    ordersCount: number;
    barCents?: number;
    kontoCents?: number;
  };
  previous?: {
    incomeCents: number;
    expenseCents: number;
    profitCents: number;
    ordersCount: number;
  };
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function fmtEurShort(cents: number): string {
  const eur = cents / 100;
  if (Math.abs(eur) >= 1_000_000) return (eur / 1_000_000).toFixed(1).replace(".", ",") + " M€";
  if (Math.abs(eur) >= 1_000) return (eur / 1_000).toFixed(1).replace(".", ",") + " k€";
  return eur.toFixed(0) + " €";
}

function fmtEurFull(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const mi = parseInt(m, 10) - 1;
  return `${months[mi] ?? m} ${(y || "").slice(2)}`;
}

interface Props {
  snapshot: CashflowSnapshot;
  onMonthClick?: (yyyymm: string) => void;
}

export function CashFlowChart({ snapshot, onMonthClick }: Props) {
  const monthData = useMemo(
    () =>
      snapshot.byMonth.map((m) => ({
        label: fmtMonthLabel(m.month),
        rawMonth: m.month,
        Einnahmen: m.incomeCents / 100,
        Ausgaben: m.expenseCents / 100,
        Profit: m.profitCents / 100,
      })),
    [snapshot.byMonth],
  );

  const handleBarClick = (state: any) => {
    if (!onMonthClick) return;
    const idx = state?.activeTooltipIndex;
    if (typeof idx !== "number") return;
    const m = monthData[idx]?.rawMonth;
    if (m) onMonthClick(m);
  };

  const partnerData = useMemo(
    () =>
      snapshot.byPartner.slice(0, 8).map((p) => ({
        name: p.partnerName.length > 14 ? p.partnerName.slice(0, 12) + "…" : p.partnerName,
        Umsatz: p.revenueCents / 100,
        Auszahlung: p.payoutCents / 100,
        Corion: p.corionCents / 100,
      })),
    [snapshot.byPartner],
  );

  const locationData = useMemo(
    () => snapshot.byLocation.map((l) => ({ name: l.location, value: l.revenueCents / 100 })),
    [snapshot.byLocation],
  );

  const hasMonth = monthData.some((m) => m.Einnahmen > 0 || m.Ausgaben > 0);
  const hasPartner = partnerData.length > 0;
  const hasLocation = locationData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="cfo-cashflow-charts">
      {/* Time-series — full width on mobile, 2/3 on lg */}
      <Card className="bg-white border-slate-200 p-5 lg:col-span-2" data-testid="card-chart-monthly">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Cashflow {snapshot.months} Monate</h3>
              <p className="text-xs text-slate-500">Einnahmen vs. Ausgaben (real, aus Aufträgen + freigegebenen Belegen)</p>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
            {snapshot.totals.ordersCount} Aufträge
          </Badge>
        </div>
        <div className="h-72" data-testid="chart-monthly">
          {hasMonth ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onClick={handleBarClick}
                style={{ cursor: onMonthClick ? "pointer" : undefined }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => fmtEurShort(v * 100)} tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  formatter={(v: any) => fmtEurFull(Number(v) * 100)}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Einnahmen" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="Ausgaben" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                <Bar dataKey="Profit" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Noch keine Bewegungen im Zeitraum." />
          )}
        </div>
      </Card>

      {/* Location donut — 1/3 on lg */}
      <Card className="bg-white border-slate-200 p-5" data-testid="card-chart-location">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Umsatz pro Filiale</h3>
            <p className="text-xs text-slate-500">Anteil am Gesamtumsatz</p>
          </div>
        </div>
        <div className="h-72" data-testid="chart-location">
          {hasLocation ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {locationData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => fmtEurFull(Number(v) * 100)}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Keine Umsätze pro Filiale." />
          )}
        </div>
      </Card>

      {/* Partner bars — full width row */}
      <Card className="bg-white border-slate-200 p-5 lg:col-span-3" data-testid="card-chart-partner">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-emerald-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Geldfluss pro Partner</h3>
              <p className="text-xs text-slate-500">Umsatz · Partner-Auszahlung · Corion-Anteil</p>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">
            Top {partnerData.length}
          </Badge>
        </div>
        <div className="h-72" data-testid="chart-partner">
          {hasPartner ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => fmtEurShort(v * 100)} tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  formatter={(v: any) => fmtEurFull(Number(v) * 100)}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Umsatz" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="Auszahlung" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="Corion" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Noch keine Aufträge pro Partner." />
          )}
        </div>
      </Card>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-slate-400">
      {label}
    </div>
  );
}
