import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface MaterialsKpiResponse {
  partnerId: string;
  partnerName: string;
  targetPercent: number;
  actualPercent: number | null;
  materialCents: number;
  laborCents: number;
  materialInvoiceCount: number;
  orderCount: number;
  periodDays: number;
  suggestedBdePercent: number;
  partnerLaborSharePercent: number;
  materialDeductionPercent: number;
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

/**
 * Materials-KPI Card — shows the 40/60 split visually plus the partner's actual
 * material consumption ratio (sourced from AI-extracted supplier invoices).
 *
 * Two variants:
 *  - `dark` — used inside PartnerDashboard wallet tab (dark theme)
 *  - `light` — used inside AdminDashboard / CFO surfaces (light theme)
 */
export function MaterialsKpiCard({
  partnerId,
  variant = "dark",
}: {
  partnerId: string;
  variant?: "dark" | "light";
}) {
  const q = useQuery<MaterialsKpiResponse>({
    queryKey: ["/api/partners", partnerId, "materials-kpi"],
    enabled: !!partnerId,
  });

  const dark = variant === "dark";
  const surface = dark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900";
  const muted = dark ? "text-zinc-400" : "text-slate-500";
  const subtle = dark ? "text-zinc-500" : "text-slate-400";

  if (q.isLoading) {
    return (
      <Card className={`p-5 ${surface}`} data-testid="card-materials-kpi-loading">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-full mb-3" />
        <Skeleton className="h-3 w-48" />
      </Card>
    );
  }
  if (!q.data) {
    return null;
  }

  const data = q.data;
  const actual = data.actualPercent;
  const target = data.targetPercent;
  const diff = actual === null ? null : actual - target;

  // Direction is "good" when actual ≤ target (partner uses less material than budgeted).
  let DirectionIcon = Minus;
  let directionColor = muted;
  let directionLabel = "Keine Daten";
  if (diff !== null) {
    if (Math.abs(diff) < 1) {
      DirectionIcon = Minus;
      directionColor = dark ? "text-blue-400" : "text-blue-600";
      directionLabel = "Auf Ziel";
    } else if (diff < 0) {
      DirectionIcon = TrendingDown;
      directionColor = dark ? "text-emerald-400" : "text-emerald-600";
      directionLabel = `${Math.abs(diff).toFixed(1).replace(".", ",")}% unter Ziel`;
    } else {
      DirectionIcon = TrendingUp;
      directionColor = dark ? "text-rose-400" : "text-rose-600";
      directionLabel = `${diff.toFixed(1).replace(".", ",")}% über Ziel`;
    }
  }

  return (
    <Card className={`p-5 ${surface} relative overflow-hidden`} data-testid="card-materials-kpi">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center ${dark ? "bg-red-500/15" : "bg-red-50"}`}>
            <Package className={`w-5 h-5 ${dark ? "text-red-400" : "text-red-600"}`} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Material-KPI</p>
            <p className="text-sm font-semibold">{data.partnerName}</p>
          </div>
        </div>
        <Badge variant="outline" className={dark ? "border-zinc-700 text-zinc-300" : ""}>
          letzte {data.periodDays} Tage
        </Badge>
      </div>

      {/* 40 / 60 split visualization */}
      <div className="mb-4">
        <p className={`text-xs ${muted} mb-1.5 font-medium uppercase tracking-wide`}>Aufteilung Manopera</p>
        <div className="flex h-10 rounded-md overflow-hidden ring-1 ring-black/5">
          <div
            className={`flex items-center justify-center text-xs font-bold ${dark ? "bg-red-500/80 text-white" : "bg-red-500 text-white"}`}
            style={{ width: `${target}%` }}
            data-testid="bar-material-deduction"
          >
            {target}% Material
          </div>
          <div
            className={`flex items-center justify-center text-xs font-bold ${dark ? "bg-emerald-500/80 text-white" : "bg-emerald-500 text-white"}`}
            style={{ width: `${100 - target}%` }}
            data-testid="bar-partner-share"
          >
            {100 - target}% Partner
          </div>
        </div>
        <p className={`text-xs ${subtle} mt-1.5`}>
          {target}% deiner Manopera wird automatisch für Material zurückgehalten — der Rest geht in deinen Anteil.
        </p>
      </div>

      {/* Actual vs target */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className={`rounded-md p-3 ${dark ? "bg-zinc-800/60" : "bg-slate-50"}`}>
          <p className={`text-[10px] uppercase tracking-wider ${muted} mb-1`}>Aktuell</p>
          <p className="text-2xl font-bold tabular-nums" data-testid="text-material-actual">
            {actual === null ? "—" : `${actual.toFixed(1).replace(".", ",")}%`}
          </p>
          <p className={`text-xs ${subtle} mt-0.5 tabular-nums`}>{fmtEur(data.materialCents)} Material</p>
        </div>
        <div className={`rounded-md p-3 ${dark ? "bg-zinc-800/60" : "bg-slate-50"}`}>
          <p className={`text-[10px] uppercase tracking-wider ${muted} mb-1`}>Ziel</p>
          <p className="text-2xl font-bold tabular-nums" data-testid="text-material-target">
            {target}%
          </p>
          <p className={`text-xs ${subtle} mt-0.5 tabular-nums`}>{fmtEur(data.laborCents)} Manopera</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/5">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${directionColor}`} data-testid="text-material-direction">
          <DirectionIcon className="w-3.5 h-3.5" /> {directionLabel}
        </div>
        <p className={`text-xs ${subtle} tabular-nums`}>
          {data.materialInvoiceCount} Rg · {data.orderCount} Aufträge
        </p>
      </div>
    </Card>
  );
}
