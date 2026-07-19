import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Bot,
  Zap,
  AlertTriangle,
  ArrowRight,
  Activity,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HubLayout } from "@/components/hub/HubLayout";
import { useHubI18n } from "@/lib/hubI18n";
import { useAuth } from "@/hooks/use-auth";
import type { TokenLedger } from "@shared/schema";

interface TokensResp {
  balance: number;
  monthlyIncluded: number;
  used: number;
}

interface LedgerResp {
  entries: TokenLedger[];
}

const PLAN_TOKENS = 5000;

const REASON_LABELS: Record<string, string> = {
  ai_extract: "AI Document Extract",
  ai_chat: "AI Chat",
  ocr_scan: "OCR Scan",
  damage_detect: "Damage Detection",
  pdf_gen: "PDF Generation",
  agent_run: "Agent Orchestration",
  voice_premium: "Realtime Voice",
  topup: "Token Top-Up",
  manual_adjust: "Manual Adjust",
  order_save: "Order Save",
  bootstrap: "Welcome Tokens",
  referral: "Referral Bonus",
};

export default function HubUsage() {
  const { t } = useHubI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: tokens, isLoading: tokensLoading } = useQuery<TokensResp>({
    queryKey: ["/api/hub/tokens"],
    enabled: !!user,
  });

  const { data: ledger } = useQuery<LedgerResp>({
    queryKey: ["/api/hub/ledger"],
    enabled: !!user,
  });

  const balance = tokens?.balance ?? 0;
  const monthlyIncluded = tokens?.monthlyIncluded ?? PLAN_TOKENS;
  const used = tokens?.used ?? 0;
  const usedPct = Math.min(100, Math.round((used / Math.max(monthlyIncluded, 1)) * 100));
  const isNearLimit = usedPct >= 80;
  const isAtLimit = usedPct >= 100;

  const debits = (ledger?.entries ?? []).filter((e) => e.delta < 0);
  const credits = (ledger?.entries ?? []).filter((e) => e.delta > 0);
  const totalDebits = Math.abs(debits.reduce((s, e) => s + e.delta, 0));
  const totalCredits = credits.reduce((s, e) => s + e.delta, 0);

  // Top consumers (group by reason)
  const consumerMap = new Map<string, number>();
  debits.forEach((e) => {
    const k = e.reason || "other";
    consumerMap.set(k, (consumerMap.get(k) ?? 0) + Math.abs(e.delta));
  });
  const topConsumers = Array.from(consumerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!user) {
    return (
      <HubLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <Coins className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Token Usage</h1>
          <p className="text-white/60">{t("usage.signInRequired") || "Sign in to view your token balance and usage."}</p>
          <Button onClick={() => setLocation("/portal")} className="bg-red-600 hover:bg-red-700">
            {t("portal.signIn") || "Sign in"}
          </Button>
        </div>
      </HubLayout>
    );
  }

  return (
    <HubLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-3 border-red-500/40 bg-red-500/10 text-red-400">
              <Activity className="mr-1.5 h-3 w-3" />
              {t("usage.eyebrow") || "Token Governance"}
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl" data-testid="heading-usage">
              {t("usage.title") || "Token Usage"}
            </h1>
            <p className="mt-2 max-w-xl text-white/60">
              {t("usage.subtitle") || "Realtime visibility into your AI consumption. Every token, every action, fully transparent."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/wallet")}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              data-testid="button-open-wallet"
            >
              <Coins className="mr-2 h-4 w-4" />
              {t("usage.openWallet") || "Open Wallet"}
            </Button>
            <Button
              onClick={() => setLocation("/hub/billing")}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-go-billing"
            >
              {t("usage.upgrade") || "Upgrade"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alert if near/at limit */}
        {(isNearLimit || isAtLimit) && (
          <Card className={`flex items-start gap-3 border p-4 ${isAtLimit ? "border-red-500/40 bg-red-500/10" : "border-yellow-500/40 bg-yellow-500/10"}`}>
            <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${isAtLimit ? "text-red-400" : "text-yellow-400"}`} />
            <div className="flex-1">
              <p className="font-semibold text-white">
                {isAtLimit
                  ? t("usage.limitReached") || "Token limit reached"
                  : t("usage.softWarning") || "You've used 80% of your monthly tokens"}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {isAtLimit
                  ? t("usage.limitDesc") || "AI features are paused until you top up or wait for the monthly reset."
                  : t("usage.softDesc") || "Consider upgrading or buying a token pack to avoid interruptions."}
              </p>
            </div>
          </Card>
        )}

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            icon={Coins}
            label={t("usage.balance") || "Current Balance"}
            value={tokensLoading ? "…" : balance.toLocaleString("de-DE")}
            sub="HUB+1"
            color="text-red-400"
            testId="kpi-balance"
          />
          <KpiCard
            icon={TrendingDown}
            label={t("usage.used") || "Used this period"}
            value={used.toLocaleString("de-DE")}
            sub={`${usedPct}%`}
            color="text-orange-400"
            testId="kpi-used"
          />
          <KpiCard
            icon={TrendingUp}
            label={t("usage.credited") || "Credited (lifetime)"}
            value={totalCredits.toLocaleString("de-DE")}
            sub="HUB+1"
            color="text-emerald-400"
            testId="kpi-credited"
          />
          <KpiCard
            icon={Zap}
            label={t("usage.included") || "Plan included"}
            value={monthlyIncluded.toLocaleString("de-DE")}
            sub={t("usage.perMonth") || "per month"}
            color="text-blue-400"
            testId="kpi-included"
          />
        </div>

        {/* Burn rate progress */}
        <Card className="border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{t("usage.burnRate") || "Burn rate"}</h3>
              <p className="text-sm text-white/60">{t("usage.burnDesc") || "Monthly token usage relative to your plan"}</p>
            </div>
            <Badge
              variant="outline"
              className={
                isAtLimit
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : isNearLimit
                  ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              }
            >
              {usedPct}% used
            </Badge>
          </div>
          <Progress value={usedPct} className="h-3 bg-white/10" />
          <div className="mt-2 flex justify-between text-xs text-white/50">
            <span>0</span>
            <span>{monthlyIncluded.toLocaleString("de-DE")} HUB+1</span>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top consumers */}
          <Card className="border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Bot className="h-5 w-5 text-red-400" />
              {t("usage.topConsumers") || "Top consumers"}
            </h3>
            {topConsumers.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">{t("usage.noConsumers") || "No consumption recorded yet."}</p>
            ) : (
              <div className="space-y-3">
                {topConsumers.map(([reason, amt]) => {
                  const pct = Math.round((amt / totalDebits) * 100);
                  return (
                    <div key={reason} data-testid={`consumer-${reason}`}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-white/80">{REASON_LABELS[reason] ?? reason}</span>
                        <span className="font-mono text-white/60">{amt.toLocaleString("de-DE")} · {pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent ledger */}
          <Card className="border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-red-400" />
              {t("usage.recent") || "Recent activity"}
            </h3>
            {(!ledger?.entries || ledger.entries.length === 0) ? (
              <p className="py-8 text-center text-sm text-white/50">{t("usage.noActivity") || "No activity yet."}</p>
            ) : (
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {ledger.entries.slice(0, 12).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-black/30 px-3 py-2"
                    data-testid={`ledger-${e.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/85">{REASON_LABELS[e.reason] ?? e.reason}</p>
                      <p className="text-[10px] text-white/40">{new Date(e.createdAt).toLocaleString("de-DE")}</p>
                    </div>
                    <span className={`shrink-0 font-mono text-sm font-semibold ${e.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {e.delta > 0 ? "+" : ""}{e.delta.toLocaleString("de-DE")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Architecture roadmap */}
        <Card className="border-white/10 bg-gradient-to-br from-red-500/[0.04] to-transparent p-6">
          <Badge variant="outline" className="mb-3 border-white/15 bg-white/5 text-white/60">
            Roadmap
          </Badge>
          <h3 className="text-lg font-semibold text-white">{t("usage.coming") || "Coming next in Token Governance"}</h3>
          <ul className="mt-4 grid gap-2 text-sm text-white/60 md:grid-cols-2">
            <li className="flex gap-2"><span className="text-red-400">→</span> Realtime middleware enforcement (soft/hard limits)</li>
            <li className="flex gap-2"><span className="text-red-400">→</span> Per-agent ROI tracking & cost optimizer</li>
            <li className="flex gap-2"><span className="text-red-400">→</span> B2B / Insurance pooled token accounts</li>
            <li className="flex gap-2"><span className="text-red-400">→</span> Anomaly detection & abuse prevention</li>
            <li className="flex gap-2"><span className="text-red-400">→</span> Smart model routing (cheap vs premium)</li>
            <li className="flex gap-2"><span className="text-red-400">→</span> Token packs, referrals, staking</li>
          </ul>
        </Card>
      </div>
    </HubLayout>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, testId }: any) {
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5" data-testid={testId}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="text-3xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/50">{sub}</div>
    </Card>
  );
}
