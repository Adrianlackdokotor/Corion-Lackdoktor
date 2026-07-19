import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Sparkles, AlertTriangle, AlertCircle, CheckCircle2, Info, RefreshCcw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CashflowSnapshot } from "./CashFlowChart";

interface AdviceItem {
  severity: "positive" | "info" | "warning" | "critical";
  title: string;
  body: string;
  action?: string;
}

interface AdviceResponse {
  advice: AdviceItem[];
  cached: boolean;
  source?: "gemini" | "heuristic";
}

const SEVERITY_TONE: Record<AdviceItem["severity"], { bar: string; iconBg: string; iconText: string; icon: typeof Info; badge: string }> = {
  critical: { bar: "bg-rose-500", iconBg: "bg-rose-50", iconText: "text-rose-600", icon: AlertCircle, badge: "bg-rose-50 text-rose-700 border-rose-200" },
  warning: { bar: "bg-amber-500", iconBg: "bg-amber-50", iconText: "text-amber-700", icon: AlertTriangle, badge: "bg-amber-50 text-amber-800 border-amber-200" },
  info: { bar: "bg-slate-400", iconBg: "bg-slate-100", iconText: "text-slate-700", icon: Info, badge: "bg-slate-100 text-slate-700 border-slate-200" },
  positive: { bar: "bg-emerald-500", iconBg: "bg-emerald-50", iconText: "text-emerald-700", icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const SEVERITY_LABEL: Record<AdviceItem["severity"], string> = {
  critical: "Kritisch",
  warning: "Achtung",
  info: "Hinweis",
  positive: "Positiv",
};

interface Props {
  snapshot: CashflowSnapshot | null;
}

export function CFOAdvisor({ snapshot }: Props) {
  const adviceMutation = useMutation<AdviceResponse, Error, CashflowSnapshot>({
    mutationFn: async (snap) => {
      const res = await fetch("/api/cfo/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ snapshot: snap }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  // Auto-fetch on first snapshot, refetch when fingerprint changes.
  const fingerprint = useMemo(
    () =>
      snapshot
        ? [
            snapshot.totals.incomeCents,
            snapshot.totals.expenseCents,
            snapshot.totals.openInvoicesCount,
            snapshot.byPartner.length,
            snapshot.byLocation.length,
          ].join("|")
        : "",
    [snapshot],
  );

  // Auto-fetch advice when a fresh fingerprint arrives. Stored ref prevents
  // re-firing for the same snapshot on every render. Calling mutate inside
  // render is a React anti-pattern (architect flagged it) — keep it in effect.
  const lastFiredRef = useRef<string>("");
  useEffect(() => {
    if (!snapshot || !fingerprint) return;
    if (lastFiredRef.current === fingerprint) return;
    lastFiredRef.current = fingerprint;
    adviceMutation.mutate(snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  const advice = adviceMutation.data?.advice ?? [];
  const source = adviceMutation.data?.source;
  const isLoading = adviceMutation.isPending || (!adviceMutation.data && !adviceMutation.isError && !!snapshot);

  return (
    <Card className="bg-white border-slate-200 overflow-hidden" data-testid="card-cfo-advisor">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
            CFO AI Berater
            <span className="text-[10px] font-semibold tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              FINANCIAL ADVISOR
            </span>
            {source === "heuristic" && (
              <span className="text-[10px] font-medium tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                OFFLINE-MODUS
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Analysiert deine Cashflow-Daten und schlägt nächste Schritte vor.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => snapshot && adviceMutation.mutate(snapshot)}
          disabled={!snapshot || adviceMutation.isPending}
          className="border-slate-300 text-slate-700"
          data-testid="button-refresh-advice"
        >
          {adviceMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="w-3.5 h-3.5" />
          )}
          <span className="ml-1.5 hidden sm:inline">Neu analysieren</span>
        </Button>
      </div>

      <div className="divide-y divide-slate-100">
        {isLoading && advice.length === 0 ? (
          <div className="px-5 py-8 flex items-center gap-3 text-sm text-slate-500" data-testid="advisor-loading">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            Analysiere deine Zahlen…
          </div>
        ) : adviceMutation.isError ? (
          <div className="px-5 py-6 text-sm text-rose-600" data-testid="advisor-error">
            Berater nicht erreichbar. Versuche es gleich nochmal.
          </div>
        ) : advice.length === 0 ? (
          <div className="px-5 py-6 text-sm text-slate-500" data-testid="advisor-empty">
            Keine Empfehlungen verfügbar.
          </div>
        ) : (
          advice.map((item, idx) => {
            const tone = SEVERITY_TONE[item.severity] ?? SEVERITY_TONE.info;
            const Icon = tone.icon;
            return (
              <div key={idx} className="flex items-stretch" data-testid={`advisor-item-${idx}`}>
                <div className={`w-1 ${tone.bar} shrink-0`} aria-hidden="true" />
                <div className="flex-1 px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-9 h-9 rounded-full ${tone.iconBg} ${tone.iconText} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${tone.badge}`}>
                        {SEVERITY_LABEL[item.severity]}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed mt-1">{item.body}</p>
                  </div>
                  {item.action && (
                    <div className="shrink-0 sm:self-center">
                      <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">
                        {item.action}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
