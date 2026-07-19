import { useLocation } from "wouter";
import {
  Check,
  Sparkles,
  Coins,
  Zap,
  Building2,
  ArrowRight,
  Crown,
  Gift,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HubLayout } from "@/components/hub/HubLayout";
import { useHubI18n } from "@/lib/hubI18n";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "€49",
    period: "/Monat",
    tokens: 5000,
    icon: Sparkles,
    highlight: false,
    features: [
      { de: "5.000 HUB+1 Tokens / Monat", ro: "5.000 token HUB+1 / lună", en: "5,000 HUB+1 Tokens / month" },
      { de: "Customer & Marketing AI", ro: "Customer & Marketing AI", en: "Customer & Marketing AI" },
      { de: "WhatsApp + Mobile App", ro: "WhatsApp + App Mobil", en: "WhatsApp + Mobile App" },
      { de: "1 Workspace", ro: "1 Workspace", en: "1 Workspace" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "€129",
    period: "/Monat",
    tokens: 50000,
    icon: Crown,
    highlight: true,
    features: [
      { de: "50.000 HUB+1 Tokens / Monat", ro: "50.000 token HUB+1 / lună", en: "50,000 HUB+1 Tokens / month" },
      { de: "Alle 5 AI-Assistenten", ro: "Toți cei 5 asistenți AI", en: "All 5 AI Assistants" },
      { de: "Gutachter + OCR + Damage Detection", ro: "Expertiză + OCR + Detecție daune", en: "Inspector + OCR + Damage Detection" },
      { de: "Bis 5 Workspaces", ro: "Până la 5 Workspace-uri", en: "Up to 5 Workspaces" },
      { de: "Priority Support", ro: "Suport prioritar", en: "Priority Support" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    tokens: 0,
    icon: Building2,
    highlight: false,
    features: [
      { de: "Pooled Tokens (B2B / Insurance / Fleet)", ro: "Pool de Tokens (B2B / Asigurări / Fleet)", en: "Pooled Tokens (B2B / Insurance / Fleet)" },
      { de: "Unbegrenzte Workspaces & Agenten", ro: "Workspace-uri și agenți nelimitați", en: "Unlimited workspaces & agents" },
      { de: "Custom Onboarding & SLA", ro: "Onboarding custom & SLA", en: "Custom onboarding & SLA" },
      { de: "Dedicated Account Manager", ro: "Account Manager dedicat", en: "Dedicated Account Manager" },
      { de: "API & White-Label", ro: "API & White-Label", en: "API & White-Label" },
    ],
  },
];

const TOKEN_PACKS = [
  { tokens: 5000, price: "€10", bonus: 0 },
  { tokens: 25000, price: "€50", bonus: 1500 },
  { tokens: 100000, price: "€250", bonus: 10000 },
  { tokens: 500000, price: "€1.000", bonus: 75000 },
];

export default function HubBilling() {
  const { lang, t } = useHubI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleChoosePlan = (planId: string) => {
    toast({
      title: t("billing.requestSent") || "Request sent",
      description: t("billing.willContact") || "Our team will reach out within 1 business day to set up your plan.",
    });
    console.log("[HubBilling] Plan selected:", planId);
  };

  const handleBuyPack = (pack: typeof TOKEN_PACKS[number]) => {
    toast({
      title: t("billing.packQueued") || "Token pack queued",
      description: `${(pack.tokens + pack.bonus).toLocaleString("de-DE")} HUB+1 will be credited after payment.`,
    });
    console.log("[HubBilling] Pack:", pack);
  };

  return (
    <HubLayout>
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center">
          <Badge variant="outline" className="mb-4 border-red-500/40 bg-red-500/10 text-red-400">
            <Coins className="mr-1.5 h-3 w-3" />
            {t("billing.eyebrow") || "Plans & Tokens"}
          </Badge>
          <h1
            className="text-balance text-4xl font-extrabold tracking-tight text-white md:text-5xl"
            data-testid="heading-billing"
          >
            {t("billing.title") || "Skaliere ohne Überraschungen"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-white/60 md:text-lg">
            {t("billing.subtitle") || "Klare Pakete, faire Tokens, vorhersehbare Kosten. Kein Lock-in, jederzeit kündbar."}
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden p-8 ${
                  plan.highlight
                    ? "border-red-500/50 bg-gradient-to-b from-red-500/[0.08] to-transparent shadow-[0_0_60px_rgba(229,57,53,0.15)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {plan.highlight && (
                  <Badge className="absolute right-4 top-4 border-0 bg-red-600 text-white">
                    {t("billing.popular") || "Beliebt"}
                  </Badge>
                )}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-md ${plan.highlight ? "bg-red-500/15" : "bg-white/5"}`}>
                  <Icon className={`h-6 w-6 ${plan.highlight ? "text-red-400" : "text-white/70"}`} />
                </div>
                <h3 className="text-2xl font-extrabold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-white/50">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.en} className="flex items-start gap-2 text-sm text-white/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <span>{f[lang]}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleChoosePlan(plan.id)}
                  className={`mt-8 w-full ${
                    plan.highlight
                      ? "bg-red-600 hover:bg-red-700"
                      : "border border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                  data-testid={`button-choose-${plan.id}`}
                >
                  {plan.id === "enterprise"
                    ? t("billing.contactSales") || "Sales kontaktieren"
                    : t("billing.choose") || "Plan wählen"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Token packs */}
        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">
                {t("billing.packsTitle") || "Token Packs"}
              </h2>
              <p className="text-sm text-white/60">
                {t("billing.packsSub") || "One-off token top-ups. Stack with any plan."}
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Gift className="mr-1.5 h-3 w-3" />
              {t("billing.bonusUp") || "Bonus up to +15%"}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOKEN_PACKS.map((p) => (
              <Card
                key={p.tokens}
                className="border-white/10 bg-white/[0.03] p-5 hover-elevate"
                data-testid={`pack-${p.tokens}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Coins className="h-5 w-5 text-red-400" />
                  {p.bonus > 0 && (
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400">
                      +{p.bonus.toLocaleString("de-DE")} bonus
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {p.tokens.toLocaleString("de-DE")}
                </div>
                <div className="mt-1 text-xs text-white/50">HUB+1 Tokens</div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">{p.price}</span>
                  <Button
                    size="sm"
                    onClick={() => handleBuyPack(p)}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid={`button-buy-pack-${p.tokens}`}
                  >
                    Buy
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* B2B / Pooled */}
        <Card className="border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Badge variant="outline" className="mb-3 border-white/15 bg-black/40 text-white/70">
                <Building2 className="mr-1.5 h-3 w-3" />
                {t("billing.b2bEyebrow") || "Insurance · Fleet · EDV"}
              </Badge>
              <h3 className="text-2xl font-extrabold text-white">
                {t("billing.b2bTitle") || "Pooled Token Accounts"}
              </h3>
              <p className="mt-3 max-w-2xl text-white/65">
                {t("billing.b2bDesc") || "Insurance companies, leasing firms and partners share a central token pool. Predictable billing, per-employee analytics, scalable enterprise onboarding."}
              </p>
            </div>
            <Button
              onClick={() => setLocation("/kontakt")}
              variant="outline"
              size="lg"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              data-testid="button-b2b-contact"
            >
              <Zap className="mr-2 h-4 w-4" />
              {t("billing.b2bContact") || "Vertrieb kontaktieren"}
            </Button>
          </div>
        </Card>

        {/* Architecture note */}
        <Card className="border-white/10 bg-white/[0.02] p-6">
          <p className="text-center text-xs text-white/40">
            {t("billing.architectureNote") || "Hub+1 Tokens are a utility credit for AI compute, OCR, storage and automation execution. Fiscal events occur only on EUR conversion via the Wallet. Blockchain-/ICP-ready architecture; no on-chain settlement today."}
          </p>
        </Card>
      </div>
    </HubLayout>
  );
}
