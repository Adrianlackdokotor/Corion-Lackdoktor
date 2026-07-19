import { useLocation } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Megaphone,
  MessageSquare,
  Wrench,
  Calculator,
  Camera,
  PhoneOff,
  AlertTriangle,
  FileWarning,
  Star as StarIcon,
  Phone,
  CalendarCheck,
  Receipt,
  Smile,
  Smartphone,
  Mic,
  WifiOff,
  Check,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HubLayout } from "@/components/hub/HubLayout";
import { useHubI18n } from "@/lib/hubI18n";
import EcosystemNetwork from "@/components/hub/EcosystemNetwork";
import MarketplaceVision from "@/components/hub/MarketplaceVision";

export default function HubLanding() {
  const { t, lang: rawLang } = useHubI18n() as any;
  const lang = (["de", "ro", "en"].includes(rawLang) ? rawLang : "de") as "de" | "ro" | "en";
  const [, setLocation] = useLocation();

  return (
    <HubLayout>
      <Hero
        t={t}
        onPrimary={() => setLocation("/hub/onboarding")}
        onSecondary={() => {
          const el = document.getElementById("workflow");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <AssistantsSection t={t} />
      <WorkflowSection t={t} />
      <BeforeAfterSection t={t} />
      <MobileSection t={t} />
      <EcosystemNetwork lang={lang} onCta={() => setLocation("/hub/onboarding")} />
      <MarketplaceVision lang={lang} onCta={() => setLocation("/hub/billing")} />
      <TestimonialsSection t={t} />
      <PricingSection t={t} onChoose={() => setLocation("/hub/onboarding")} />
      <FinalCTA
        t={t}
        onPrimary={() => setLocation("/hub/onboarding")}
        onSecondary={() => setLocation("/kontakt")}
      />
    </HubLayout>
  );
}

function Hero({
  t,
  onPrimary,
  onSecondary,
}: {
  t: (k: string) => string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(229,57,53,0.18),transparent_60%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <Badge className="mb-6 border-[#E53935]/30 bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935]/15">
          <Sparkles className="mr-1.5 h-3 w-3" /> {t("hero.eyebrow")}
        </Badge>
        <h1
          className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
          data-testid="text-hero-title"
        >
          {t("hero.title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-white/60 sm:text-xl">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-12 bg-[#E53935] px-7 text-base text-white hover:bg-[#E53935]/90"
            onClick={onPrimary}
            data-testid="button-hero-primary"
          >
            {t("hero.cta.primary")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white/15 bg-white/5 px-7 text-base text-white backdrop-blur hover:bg-white/10"
            onClick={onSecondary}
            data-testid="button-hero-secondary"
          >
            {t("hero.cta.secondary")}
          </Button>
        </div>
        <p className="mt-5 text-xs text-white/40">{t("hero.badge")}</p>
      </div>
    </section>
  );
}

function AssistantsSection({ t }: { t: (k: string) => string }) {
  const items = [
    {
      icon: Megaphone,
      title: t("assistants.marketing.title"),
      body: t("assistants.marketing.body"),
    },
    {
      icon: MessageSquare,
      title: t("assistants.customer.title"),
      body: t("assistants.customer.body"),
    },
    {
      icon: Wrench,
      title: t("assistants.workshop.title"),
      body: t("assistants.workshop.body"),
    },
    {
      icon: Calculator,
      title: t("assistants.finance.title"),
      body: t("assistants.finance.body"),
    },
    {
      icon: Camera,
      title: t("assistants.gutachter.title"),
      body: t("assistants.gutachter.body"),
    },
  ];
  return (
    <section
      id="assistants"
      className="border-t border-white/5 bg-black py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("assistants.title")} subtitle={t("assistants.subtitle")} />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card
              key={it.title}
              className="group border-white/10 bg-white/[0.02] p-6 backdrop-blur transition hover:border-[#E53935]/40 hover:bg-white/[0.04]"
              data-testid={`card-assistant-${it.title}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#E53935]/10 ring-1 ring-[#E53935]/30">
                <it.icon className="h-5 w-5 text-[#E53935]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{it.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection({ t }: { t: (k: string) => string }) {
  const steps = [
    { icon: Phone, title: t("workflow.s1.title"), body: t("workflow.s1.body") },
    {
      icon: CalendarCheck,
      title: t("workflow.s2.title"),
      body: t("workflow.s2.body"),
    },
    { icon: Receipt, title: t("workflow.s3.title"), body: t("workflow.s3.body") },
  ];
  return (
    <section
      id="features"
      className="relative border-t border-white/5 bg-gradient-to-b from-black to-[#0a0a0a] py-24 sm:py-32"
    >
      <div id="workflow" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t("workflow.title")}
          subtitle={t("workflow.subtitle")}
        />
        <div className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-md border border-white/10 bg-white/[0.02] p-7"
              data-testid={`card-workflow-step-${i}`}
            >
              <div className="absolute -top-3 left-7 rounded-md bg-[#E53935] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterSection({ t }: { t: (k: string) => string }) {
  const before = [
    { icon: PhoneOff, text: t("ba.before.l1") },
    { icon: AlertTriangle, text: t("ba.before.l2") },
    { icon: FileWarning, text: t("ba.before.l3") },
    { icon: StarIcon, text: t("ba.before.l4") },
  ];
  const after = [
    { icon: MessageSquare, text: t("ba.after.l1") },
    { icon: CalendarCheck, text: t("ba.after.l2") },
    { icon: Receipt, text: t("ba.after.l3") },
    { icon: Smile, text: t("ba.after.l4") },
  ];
  return (
    <section className="border-t border-white/5 bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("ba.title")} subtitle={t("ba.subtitle")} />
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BeforeAfterCard
            tone="before"
            label={t("ba.before.title")}
            items={before}
          />
          <BeforeAfterCard tone="after" label={t("ba.after.title")} items={after} />
        </div>
      </div>
    </section>
  );
}

function BeforeAfterCard({
  tone,
  label,
  items,
}: {
  tone: "before" | "after";
  label: string;
  items: { icon: any; text: string }[];
}) {
  const isAfter = tone === "after";
  return (
    <Card
      className={`relative overflow-hidden border ${
        isAfter
          ? "border-[#E53935]/30 bg-gradient-to-br from-[#E53935]/[0.07] to-transparent"
          : "border-white/10 bg-white/[0.02]"
      } p-8`}
      data-testid={`card-ba-${tone}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            isAfter ? "text-[#E53935]" : "text-white/40"
          }`}
        >
          {label}
        </span>
        {isAfter && (
          <Badge className="border-[#E53935]/30 bg-[#E53935]/10 text-[#E53935]">
            Hub+1
          </Badge>
        )}
      </div>
      <ul className="mt-6 space-y-4">
        {items.map((it) => (
          <li key={it.text} className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                isAfter
                  ? "bg-[#E53935]/15 ring-1 ring-[#E53935]/30"
                  : "bg-white/5 ring-1 ring-white/10"
              }`}
            >
              <it.icon
                className={`h-4 w-4 ${isAfter ? "text-[#E53935]" : "text-white/60"}`}
              />
            </div>
            <span
              className={`text-sm leading-relaxed ${
                isAfter ? "text-white" : "text-white/60 line-through decoration-white/20"
              }`}
            >
              {it.text}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MobileSection({ t }: { t: (k: string) => string }) {
  const bullets = [
    { icon: Mic, text: t("mobile.bullet1") },
    { icon: MessageSquare, text: t("mobile.bullet2") },
    { icon: Camera, text: t("mobile.bullet3") },
    { icon: WifiOff, text: t("mobile.bullet4") },
  ];
  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-black to-[#0a0a0a] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <Badge className="mb-5 border-white/15 bg-white/5 text-white/70">
            <Smartphone className="mr-1.5 h-3 w-3" /> Mobile + WhatsApp
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {t("mobile.title")}
          </h2>
          <p className="mt-4 text-lg text-white/60">{t("mobile.subtitle")}</p>
          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E53935]/10 ring-1 ring-[#E53935]/30">
                  <b.icon className="h-3.5 w-3.5 text-[#E53935]" />
                </div>
                <span className="text-sm text-white/80">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function PhoneMockup() {
  const bubbles = [
    { side: "in" as const, text: "Hallo, hab eine Schramme an der Tür 🚗" },
    { side: "out" as const, text: "Hi! Schick mir bitte ein Foto." },
    { side: "in" as const, text: "[Foto]" },
    {
      side: "out" as const,
      text: "Sieht nach Smart Repair aus. Preisspanne €120–€180. Termin morgen 10:00?",
    },
    { side: "in" as const, text: "Passt 👍" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(229,57,53,0.15),transparent_70%)]" />
      <div className="relative rounded-[2.5rem] border border-white/10 bg-[#111] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="rounded-[2rem] bg-black p-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#E53935]/20 ring-1 ring-[#E53935]/40" />
              <div>
                <div className="text-xs font-semibold text-white">Hub+1 Bot</div>
                <div className="text-[10px] text-emerald-400">online</div>
              </div>
            </div>
            <Phone className="h-4 w-4 text-white/40" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {bubbles.map((b, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-snug ${
                  b.side === "in"
                    ? "self-start bg-white/10 text-white"
                    : "self-end bg-[#E53935] text-white"
                }`}
              >
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection({ t }: { t: (k: string) => string }) {
  const items = [
    { q: t("testi.q1"), a: t("testi.q1.author") },
    { q: t("testi.q2"), a: t("testi.q2.author") },
    { q: t("testi.q3"), a: t("testi.q3.author") },
  ];
  return (
    <section className="border-t border-white/5 bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("testi.title")} />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((it) => (
            <Card
              key={it.a}
              className="border-white/10 bg-white/[0.02] p-7"
              data-testid={`card-testimonial-${it.a}`}
            >
              <Quote className="h-5 w-5 text-[#E53935]" />
              <p className="mt-4 text-base leading-relaxed text-white/85">
                "{it.q}"
              </p>
              <div className="mt-5 flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#E53935] to-[#7a1f1d] ring-1 ring-white/10" />
                <span className="text-xs text-white/50">{it.a}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({
  t,
  onChoose,
}: {
  t: (k: string) => string;
  onChoose: () => void;
}) {
  const tiers = [
    {
      name: t("pricing.starter.name"),
      price: t("pricing.starter.price"),
      per: t("pricing.starter.per"),
      body: t("pricing.starter.body"),
      highlight: false,
    },
    {
      name: t("pricing.pro.name"),
      price: t("pricing.pro.price"),
      per: t("pricing.pro.per"),
      body: t("pricing.pro.body"),
      highlight: true,
    },
    {
      name: t("pricing.studio.name"),
      price: t("pricing.studio.price"),
      per: t("pricing.studio.per"),
      body: t("pricing.studio.body"),
      highlight: false,
    },
  ];
  return (
    <section
      id="pricing"
      className="border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-black py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("pricing.title")} subtitle={t("pricing.subtitle")} />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative p-7 ${
                tier.highlight
                  ? "border-[#E53935]/40 bg-gradient-to-b from-[#E53935]/[0.08] to-transparent shadow-[0_0_60px_rgba(229,57,53,0.15)]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
              data-testid={`card-pricing-${tier.name.toLowerCase()}`}
            >
              {tier.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-[#E53935]/40 bg-[#E53935] text-white">
                  {t("pricing.most_popular")}
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-white/50">{tier.per}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {tier.body}
              </p>
              <Button
                className={`mt-7 w-full ${
                  tier.highlight
                    ? "bg-[#E53935] text-white hover:bg-[#E53935]/90"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
                onClick={onChoose}
                data-testid={`button-pricing-${tier.name.toLowerCase()}`}
              >
                {t("pricing.cta")}
              </Button>
              <ul className="mt-6 space-y-2 border-t border-white/10 pt-5 text-xs text-white/50">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#E53935]" /> WhatsApp Bot
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#E53935]" /> Pipeline + CRM
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#E53935]" /> AI Foto-Analyse
                </li>
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({
  t,
  onPrimary,
  onSecondary,
}: {
  t: (k: string) => string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-black py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(229,57,53,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
          {t("cta.subtitle")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-12 bg-[#E53935] px-7 text-base text-white hover:bg-[#E53935]/90"
            onClick={onPrimary}
            data-testid="button-final-cta-primary"
          >
            {t("cta.primary")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white/15 bg-white/5 px-7 text-base text-white hover:bg-white/10"
            onClick={onSecondary}
            data-testid="button-final-cta-secondary"
          >
            {t("cta.secondary")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-balance text-base text-white/60 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
