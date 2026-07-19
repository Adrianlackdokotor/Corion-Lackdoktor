import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AggregateRow {
  partnerId: string;
  partnerName: string;
  partnerCompany: string | null;
  targetPercent: number;
  actualPercent: number | null;
  materialCents: number;
  laborCents: number;
  orderCount: number;
  invoiceCount: number;
}

interface AggregateResponse {
  periodDays: number;
  partners: AggregateRow[];
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

export function AdminMaterialsKpiPanel() {
  const q = useQuery<AggregateResponse>({
    queryKey: ["/api/admin/materials-kpi"],
  });

  if (q.isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-5 w-48 mb-3" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }
  if (!q.data || q.data.partners.length === 0) {
    return (
      <Card className="p-6 text-center" data-testid="card-admin-materials-empty">
        <Package className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Noch keine Material-Daten — Partner brauchen aktive Aufträge und genehmigte Material-Rechnungen.
        </p>
      </Card>
    );
  }

  const rows = q.data.partners;
  const totalLabor = rows.reduce((s, r) => s + r.laborCents, 0);
  const totalMaterial = rows.reduce((s, r) => s + r.materialCents, 0);
  const overallActual = totalLabor > 0 ? (totalMaterial / totalLabor) * 100 : null;
  const partnersOverTarget = rows.filter(
    (r) => r.actualPercent !== null && r.actualPercent > r.targetPercent + 2,
  ).length;
  const partnersOnTarget = rows.filter(
    (r) =>
      r.actualPercent !== null &&
      Math.abs(r.actualPercent - r.targetPercent) <= 2,
  ).length;

  return (
    <Card className="p-5" data-testid="card-admin-materials-kpi">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Material-KPI · Alle Partner</p>
            <p className="text-sm font-semibold">letzte {q.data.periodDays} Tage</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Gesamt-Quote</p>
          <p className="text-2xl font-bold tabular-nums" data-testid="text-overall-material-percent">
            {overallActual === null ? "—" : `${overallActual.toFixed(1).replace(".", ",")}%`}
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Material gesamt</p>
          <p className="text-lg font-bold tabular-nums">{fmtEur(totalMaterial)}</p>
        </div>
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auf Ziel
          </p>
          <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{partnersOnTarget}</p>
        </div>
        <div className="rounded-md bg-rose-50 dark:bg-rose-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Über Ziel
          </p>
          <p className="text-lg font-bold tabular-nums text-rose-700 dark:text-rose-300">{partnersOverTarget}</p>
        </div>
      </div>

      {/* Per-partner rows */}
      <div className="space-y-2">
        {rows.slice(0, 10).map((r) => {
          const diff = r.actualPercent === null ? null : r.actualPercent - r.targetPercent;
          const tone =
            diff === null
              ? "text-muted-foreground"
              : Math.abs(diff) <= 2
                ? "text-blue-600 dark:text-blue-400"
                : diff < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400";
          return (
            <div
              key={r.partnerId}
              className="flex items-center gap-3 rounded-md border border-border/50 px-3 py-2 hover-elevate"
              data-testid={`row-material-partner-${r.partnerId}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.partnerName}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {fmtEur(r.materialCents)} Material · {fmtEur(r.laborCents)} Manopera · {r.orderCount} Aufträge
                </p>
              </div>
              {/* Mini bar */}
              <div className="w-32 hidden sm:block">
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${Math.min(100, r.actualPercent ?? 0)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 text-right tabular-nums">
                  Ziel {r.targetPercent}%
                </div>
              </div>
              <div className="text-right min-w-[64px]">
                <p className={`text-sm font-bold tabular-nums ${tone}`}>
                  {r.actualPercent === null ? "—" : `${r.actualPercent.toFixed(1).replace(".", ",")}%`}
                </p>
                {diff !== null && (
                  <p className={`text-[10px] tabular-nums ${tone}`}>
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(1).replace(".", ",")}%
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
