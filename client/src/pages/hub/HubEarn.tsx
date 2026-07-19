import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Sparkles,
  Trophy,
  Users,
  Star,
  FileText,
  Wand2,
  Bug,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Code,
  ShieldCheck,
  Coins,
  TrendingUp,
  Lock,
  AlertTriangle,
  ArrowRight,
  Copy,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HubLayout } from "@/components/hub/HubLayout";
import { BrandLogo } from "@/components/brand/RoleLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type EarnItem = { kind: string; tokens: number; cap: string; desc: string };
type Penalty = { kind: string; tokens: number; desc: string };

interface Catalog {
  catalog: EarnItem[];
  penalties: Penalty[];
  escrow: {
    slotDepositCents: number;
    replacedFeeCents: number;
    emptyPenaltyCents: number;
    prepaymentDiscountBps: number;
  };
  tokenMath: {
    utilityCreditEurPerToken: number;
    monthlyEarnCapPerUser: number;
    burnFeeBps: number;
    rewardPoolMonthlyShareBps: number;
  };
}

interface Reputation {
  score: number;
  level: string;
  completedJobs: number;
  cancellations: number;
  noShows: number;
  reviewsAvg: number;
  reviewsCount: number;
  perks: string[];
}

interface Earnings {
  monthEarned: number;
  lifetimeEarned: number;
  byKind: Record<string, number>;
}

interface ReferralRow {
  id: string;
  status: string;
  rewardTokens: number;
  source: string | null;
  createdAt: string;
  rewardedAt: string | null;
  referredEmail: string | null;
  referredName: string | null;
  referredRole: string | null;
}
interface ReferralsResponse {
  referrals: ReferralRow[];
  totals: { count: number; active: number; rewarded: number; tokensEarned: number };
}

const KIND_ICON: Record<string, any> = {
  referral: Users,
  referred_customer: Users,
  review: Star,
  workflow_use: Wand2,
  template: FileText,
  training_ai: GraduationCap,
  content: Megaphone,
  doc_improvement: FileText,
  bug_fix: Bug,
  onboarding_partner: ShieldCheck,
  social_growth: TrendingUp,
  community_answer: MessageSquare,
};

const KIND_LABEL: Record<string, string> = {
  referral: "Partner-Empfehlung",
  referred_customer: "Kunden-Empfehlung",
  review: "Verifizierte Bewertung",
  workflow_use: "AI-Workflow Nutzung",
  template: "Template angenommen",
  training_ai: "AI Training / Labeling",
  content: "Educational Content",
  doc_improvement: "Doku-Verbesserung",
  bug_fix: "Bug Fix (PR)",
  onboarding_partner: "Partner-Onboarding",
  social_growth: "Social Reach",
  community_answer: "Community Antwort",
};

export default function HubEarn() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: catalog } = useQuery<Catalog>({ queryKey: ["/api/hub/economy/earn-catalog"] });
  const { data: rep } = useQuery<Reputation>({ queryKey: ["/api/hub/economy/reputation"] });
  const { data: earnings } = useQuery<Earnings>({ queryKey: ["/api/hub/economy/earnings"] });
  const { data: refs } = useQuery<ReferralsResponse>({
    queryKey: ["/api/hub/economy/referrals"],
    enabled: !!isAuthenticated,
  });

  const refLink = user?.id
    ? `${window.location.origin}/login?ref=${user.id}`
    : `${window.location.origin}/login`;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      toast({ title: "Referral-Link kopiert", description: refLink });
    } catch {
      toast({ title: "Fehler", description: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  const score = rep?.score ?? 500;
  const scorePct = Math.min(100, Math.round((score / 1000) * 100));
  const monthEarned = earnings?.monthEarned ?? 0;
  const monthCap = catalog?.tokenMath.monthlyEarnCapPerUser ?? 5000;
  const earnPct = Math.min(100, Math.round((monthEarned / monthCap) * 100));

  return (
    <HubLayout>
      <section className="relative overflow-hidden bg-black px-6 py-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 10%, rgba(229,57,53,0.18), transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge
                variant="outline"
                className="mb-3 border-red-500/40 bg-red-500/10 text-red-400"
              >
                <Sparkles className="mr-1.5 h-3 w-3" />
                Hub+1 · Contribution Economy
              </Badge>
              <h1
                className="text-balance text-4xl font-extrabold tracking-tight md:text-5xl"
                data-testid="heading-earn"
              >
                Verdiene Tokens, baue <span className="text-red-500">Reputation</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
                Hub+1 ist eine echte Beitrags-Ökonomie. Wer Wert schafft, verdient.
                Wer Ressourcen verschwendet, zahlt. Tokens sind Utility-Credits — kein
                Spekulationsobjekt.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/hub/usage")}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                data-testid="button-go-usage"
              >
                <Coins className="mr-2 h-4 w-4" />
                Usage
              </Button>
              <Button
                onClick={() => setLocation("/hub/billing")}
                className="bg-red-600 text-white hover:bg-red-700"
                data-testid="button-go-billing"
              >
                Plan & Tokens
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Top KPIs */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Reputation */}
            <Card className="border-white/10 bg-gradient-to-br from-red-950/40 via-black to-black p-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-300">
                  <Trophy className="mr-1 h-3 w-3" /> Reputation
                </Badge>
                <BrandLogo bg="black" size="sm" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white" data-testid="text-rep-score">
                  {score}
                </span>
                <span className="pb-2 text-sm text-white/40">/ 1000</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-red-400" data-testid="text-rep-level">
                {rep?.level ?? "Member"}
              </p>
              <Progress value={scorePct} className="mt-4 h-2 bg-white/10" />
              <ul className="mt-4 space-y-1.5">
                {(rep?.perks ?? []).map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-white/70">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Month earned */}
            <Card className="border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  <TrendingUp className="mr-1 h-3 w-3" /> Diesen Monat verdient
                </Badge>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white" data-testid="text-month-earned">
                  {monthEarned}
                </span>
                <span className="pb-2 text-sm text-white/40">/ {monthCap} Cap</span>
              </div>
              <p className="mt-1 text-xs text-white/50">Anti-Farm Cap: {monthCap} Tokens / Monat</p>
              <Progress value={earnPct} className="mt-4 h-2 bg-white/10" />
              <p className="mt-3 text-xs text-white/50">
                Lifetime: <span className="font-semibold text-white">{earnings?.lifetimeEarned ?? 0}</span> Tokens
              </p>
            </Card>

            {/* Referral link */}
            <Card className="border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
                  <Users className="mr-1 h-3 w-3" /> Referral
                </Badge>
                <Coins className="h-4 w-4 text-blue-400" />
              </div>
              <p className="mt-4 text-sm text-white/70">
                Lade einen Werkstatt-Partner ein → +500 Tokens nach Onboarding.
              </p>
              <div
                className="mt-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80"
                data-testid="text-ref-link"
              >
                <span className="truncate flex-1">{refLink}</span>
              </div>
              <Button
                onClick={copyRef}
                className="mt-3 h-9 w-full bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-copy-ref"
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Link kopieren
              </Button>
            </Card>
          </div>

          {/* My Referrals */}
          {isAuthenticated && (
            <div className="mt-12">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Meine Referrals</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Wer über deinen Link beigetreten ist — und ob die Belohnung schon
                    ausgelöst wurde.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">
                    {refs?.totals.count ?? 0} insgesamt
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    +{refs?.totals.tokensEarned ?? 0} Tokens
                  </Badge>
                </div>
              </div>

              {(refs?.referrals?.length ?? 0) === 0 ? (
                <Card className="border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-white/30" />
                  <p className="text-sm text-white/60">
                    Noch keine Referrals. Teile deinen Link oben — Belohnung wird
                    automatisch nach dem ersten Auftrag des Eingeladenen freigegeben.
                  </p>
                </Card>
              ) : (
                <Card className="border-white/10 bg-white/[0.03] divide-y divide-white/5">
                  {refs!.referrals.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-4"
                      data-testid={`row-referral-${r.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {r.referredName || r.referredEmail || "Unbekannt"}
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {r.referredRole ?? "client"} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString("de-DE")}
                          {r.source ? ` · ${r.source}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === "rewarded" ? (
                          <Badge className="bg-emerald-600 text-white">
                            +{r.rewardTokens} Tokens
                          </Badge>
                        ) : r.status === "pending" ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                            wartet auf 1. Auftrag
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60">
                            {r.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* Earn catalog */}
          <div className="mt-12">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Wege Tokens zu verdienen</h2>
                <p className="mt-1 text-sm text-white/50">
                  Echte Wertschöpfung wird belohnt — nicht Spekulation.
                </p>
              </div>
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">
                {catalog?.catalog.length ?? 0} Wege
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(catalog?.catalog ?? []).map((item) => {
                const Icon = KIND_ICON[item.kind] ?? Sparkles;
                return (
                  <Card
                    key={item.kind}
                    className="border-white/10 bg-white/[0.03] p-4 hover-elevate"
                    data-testid={`card-earn-${item.kind}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10">
                        <Icon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white">
                            {KIND_LABEL[item.kind] ?? item.kind}
                          </h3>
                          <span className="shrink-0 text-sm font-extrabold text-emerald-400">
                            +{item.tokens}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/60">{item.desc}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">
                          {item.cap}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Penalties */}
          <div className="mt-12">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Penalties & Schutzregeln</h2>
                <p className="mt-1 text-sm text-white/50">
                  Schützen Partner-Zeit, verhindern Fake-Bookings, sichern Verlässlichkeit.
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                <AlertTriangle className="mr-1 h-3 w-3" /> Anti-Abuse
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(catalog?.penalties ?? []).map((p) => (
                <Card key={p.kind} className="border-amber-500/20 bg-amber-500/[0.04] p-4" data-testid={`card-penalty-${p.kind}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      {p.kind.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-extrabold text-amber-400">{p.tokens}</span>
                  </div>
                  <p className="mt-2 text-xs text-white/70">{p.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Escrow + Token math */}
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Appointment Escrow</h3>
              </div>
              <p className="mt-1 text-xs text-white/50">
                Termin-Slots werden mit einer kleinen Escrow-Reserve geschützt.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <Row label="Slot-Deposit" value={`${(catalog?.escrow.slotDepositCents ?? 1000) / 100}€`} />
                <Row
                  label="Wenn Slot wieder gefüllt"
                  value={`nur ${(catalog?.escrow.replacedFeeCents ?? 200) / 100}€ Bearbeitungsgebühr`}
                  positive
                />
                <Row
                  label="Wenn Slot leer bleibt"
                  value={`${(catalog?.escrow.emptyPenaltyCents ?? 1000) / 100}€ einbehalten`}
                  warn
                />
                <Row
                  label="Vorauszahlung-Rabatt"
                  value={`-${((catalog?.escrow.prepaymentDiscountBps ?? 300) / 100).toFixed(1)}%`}
                  positive
                />
              </ul>
            </Card>

            <Card className="border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-400" />
                <h3 className="text-base font-semibold text-white">Token Mathematics</h3>
              </div>
              <p className="mt-1 text-xs text-white/50">
                Kontrollierte Ausgabe + Burn-Mechaniken halten die Ökonomie nachhaltig.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <Row label="1 Token =" value={`${catalog?.tokenMath.utilityCreditEurPerToken ?? 1}€ Utility Credit`} />
                <Row label="Monthly Earn Cap" value={`${catalog?.tokenMath.monthlyEarnCapPerUser ?? 5000} Tokens`} />
                <Row
                  label="Burn bei EUR-Conversion"
                  value={`${((catalog?.tokenMath.burnFeeBps ?? 200) / 100).toFixed(1)}%`}
                  warn
                />
                <Row
                  label="Reward Pool aus Umsatz"
                  value={`bis ${((catalog?.tokenMath.rewardPoolMonthlyShareBps ?? 1500) / 100).toFixed(1)}%`}
                  positive
                />
              </ul>
            </Card>
          </div>

          {/* Future: Staking teaser */}
          <Card className="mt-12 border-white/10 bg-gradient-to-br from-zinc-900 via-black to-red-950/30 p-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <BrandLogo bg="red" size="md" />
                <div>
                  <Badge variant="outline" className="mb-2 border-white/15 bg-white/5 text-white/70">
                    Coming next
                  </Badge>
                  <h3 className="text-xl font-bold text-white">Staking & Reward Pools</h3>
                  <p className="mt-1 max-w-xl text-sm text-white/60">
                    Sperre Tokens in AI-Infra-, Partner-, Growth- oder Governance-Pools
                    und erhalte reduzierte Fees, Premium-Zugang und Revenue-Sharing.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation("/hub")}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                data-testid="button-staking-roadmap"
              >
                Roadmap ansehen <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Disclaimer */}
          <p className="mt-8 text-center text-xs text-white/40">
            Hub+1 Tokens sind Utility-Credits innerhalb des Ökosystems — keine
            Wertpapiere, keine Kryptowährung. Auszahlungen erfolgen ausschließlich
            in EUR über regulierte Zahlungsdienste.
          </p>
        </div>
      </section>
    </HubLayout>
  );
}

function Row({
  label,
  value,
  positive,
  warn,
}: {
  label: string;
  value: string;
  positive?: boolean;
  warn?: boolean;
}) {
  return (
    <li className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-white/60">{label}</span>
      <span
        className={`font-semibold ${
          positive ? "text-emerald-400" : warn ? "text-amber-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </li>
  );
}
