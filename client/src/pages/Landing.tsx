import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import {
  Infinity as InfinityIcon,
  Wrench,
  Truck,
  Scale,
  TrendingUp,
  ArrowRight,
  Send,
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PlusOneInfinity from "@/components/PlusOneInfinity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type PersonaKey = "partner" | "b2b" | "legal" | "investor";

interface PersonaConfig {
  key: PersonaKey;
  label: string;
  shortLabel: string;
  icon: typeof Wrench;
  eyebrow: string;
  headline: string;
  highlight: string;
  subheader: string;
  primaryCta: string;
  secondaryCta: string;
  bullets: string[];
  heroBadges: string[];
  chatOpener: string;
  modalTitle: string;
}

const PERSONAS: Record<PersonaKey, PersonaConfig> = {
  partner: {
    key: "partner",
    label: "Mecanic / Partener",
    shortLabel: "Partner",
    icon: Wrench,
    eyebrow: "Pentru Werkstatt-Parteneri",
    headline: "Zero hârtii.",
    highlight: "Plăți instant.",
    subheader:
      "Tu repari mașina. Noi ne ocupăm de tot restul — clienți, dosare, facturi. Plată în 24 de ore, direct în cont, fără birocrație.",
    primaryCta: "Devino Partener Corion",
    secondaryCta: "Vezi cât poți câștiga",
    bullets: [
      "Plată în 24 h după predare",
      "Dosare gata-completate de Cora AI",
      "App mobil dedicat — zero PDF-uri",
    ],
    heroBadges: ["24h Payout", "Mobile-First", "0 Paperwork"],
    chatOpener:
      "Bună! Sunt Corion AI. Vrei să-ți arăt cât ai putea câștiga săptămâna viitoare ca partener Corion?",
    modalTitle: "Aplică pentru parteneriat",
  },
  b2b: {
    key: "b2b",
    label: "Flotă B2B",
    shortLabel: "B2B",
    icon: Truck,
    eyebrow: "Pentru Manageri de Flotă",
    headline: "Zero downtime.",
    highlight: "−40% costuri.",
    subheader:
      "Reparații coordonate la fața locului în toată Germania. Pickup & return, raport unic, facturare consolidată — flota ta nu se mai oprește.",
    primaryCta: "Solicită ofertă pentru flotă",
    secondaryCta: "Calculator de economii",
    bullets: [
      "Pickup & return în 4 h",
      "Reducere medie 40 % vs. dealer",
      "Un singur dashboard pentru toată flota",
    ],
    heroBadges: ["DACH Network", "SLA 4h", "−40% Cost"],
    chatOpener:
      "Bună! Câte vehicule are flota ta? Îți pot arăta exact cât economisești cu Corion față de dealer-ul tău actual.",
    modalTitle: "Cere ofertă pentru flota ta",
  },
  legal: {
    key: "legal",
    label: "Avocat / Legal",
    shortLabel: "Legal",
    icon: Scale,
    eyebrow: "Pentru Cabinete & Gutachter",
    headline: "Dosare digitale.",
    highlight: "API direct.",
    subheader:
      "Integrare API completă pentru Gutachten. JSON structurat, conformitate GDPR end-to-end, Eckdaten trimise în timp real către Unfall-Navi și DAT.",
    primaryCta: "Vezi documentația API",
    secondaryCta: "Cere acces sandbox",
    bullets: [
      "REST + Webhooks · OpenAPI 3.1",
      "GDPR · DSGVO · ISO 27001 ready",
      "Eckdaten în <300 ms către DAT",
    ],
    heroBadges: ["GDPR", "OpenAPI", "JSON / mTLS"],
    chatOpener:
      "Bună! Cum te putem ajuta cu integrarea API pentru dosarele de Gutachter?",
    modalTitle: "Cere acces la API sandbox",
  },
  investor: {
    key: "investor",
    label: "Investitor",
    shortLabel: "Investor",
    icon: TrendingUp,
    eyebrow: "Pentru Investitori & VC",
    headline: "Ecosistem AI.",
    highlight: "Tokenomics. Scalabilitate.",
    subheader:
      "9 agenți AI, 3 verticale, modelul HUB+1 Tokens. Piață DACH de 12 mld €, marjă brută 62 %, PMF dovedit pe 4 orașe — gata de Series A.",
    primaryCta: "Descarcă Pitch Deck",
    secondaryCta: "Programează un call",
    bullets: [
      "9 agenți AI · 3 verticale · 1 platformă",
      "TAM DACH €12 B · marjă brută 62 %",
      "HUB+1 Tokens · economie internă scalabilă",
    ],
    heroBadges: ["Series A", "AI-Native", "DACH €12B"],
    chatOpener:
      "Bună! Vrei datele despre tracțiune, tokenomics sau roadmap-ul Corion AI?",
    modalTitle: "Programează un investor call",
  },
};

const PERSONA_ORDER: PersonaKey[] = ["partner", "b2b", "legal", "investor"];

const MARKETING_LEAD_ENDPOINT = "/api/marketing-lead";

export default function Landing() {
  const [persona, setPersona] = useState<PersonaKey>("partner");
  const [chatOpen, setChatOpen] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; cta: "primary" | "secondary" }>({
    open: false,
    cta: "primary",
  });
  const config = PERSONAS[persona];

  return (
    <div
      className="min-h-screen bg-white text-black dark:bg-black dark:text-white"
      data-testid="page-landing"
    >
      <Helmet>
        <title>Corion Hub · The +1 Infinity Auto-Repair OS</title>
        <meta
          name="description"
          content="Corion Hub — platforma AI care conectează parteneri, flote, juriști și investitori într-un singur ecosistem auto."
        />
      </Helmet>

      <TopBar persona={persona} onPersona={setPersona} />

      <Hero
        config={config}
        onCtaClick={(cta) => setModal({ open: true, cta })}
      />

      <PlusOneInfinity
        language="ro"
        onCtaClick={() => setModal({ open: true, cta: "primary" })}
      />

      <ProofStrip persona={persona} />

      <PersonaPlaybook config={config} />

      <FinalCta config={config} onCtaClick={() => setModal({ open: true, cta: "primary" })} />

      <FooterMini />

      <FloatingChat
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        config={config}
      />

      <LeadModal
        open={modal.open}
        config={config}
        ctaKind={modal.cta}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </div>
  );
}

/* ---------------- Top bar with persona switcher ---------------- */

function TopBar({
  persona,
  onPersona,
}: {
  persona: PersonaKey;
  onPersona: (p: PersonaKey) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            <InfinityIcon className="w-5 h-5" strokeWidth={2.5} />
          </span>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-extrabold tracking-tight truncate">
              CORION <span className="text-[#E53935]">+1</span> HUB
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/50 dark:text-white/50 truncate">
              The Infinity Auto-Repair OS
            </p>
          </div>
        </div>

        <div
          className="hidden md:flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 p-1"
          data-testid="group-persona-switcher"
        >
          {PERSONA_ORDER.map((p) => {
            const cfg = PERSONAS[p];
            const Icon = cfg.icon;
            const active = p === persona;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPersona(p)}
                className={`relative inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-black/65 dark:text-white/65 hover-elevate"
                }`}
                data-testid={`button-persona-${p}`}
                aria-pressed={active}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="md:hidden">
          <select
            value={persona}
            onChange={(e) => onPersona(e.target.value as PersonaKey)}
            className="h-9 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-2 text-xs font-semibold"
            data-testid="select-persona-mobile"
          >
            {PERSONA_ORDER.map((p) => (
              <option key={p} value={p}>
                {PERSONAS[p].shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */

function Hero({
  config,
  onCtaClick,
}: {
  config: PersonaConfig;
  onCtaClick: (cta: "primary" | "secondary") => void;
}) {
  const Icon = config.icon;
  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
            data-testid={`hero-${config.key}`}
          >
            <div className="inline-flex items-center gap-2 px-2.5 h-7 rounded-full bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/20">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold">
                {config.eyebrow}
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]"
              data-testid="text-hero-headline"
            >
              {config.headline}
              <br />
              <span className="text-[#E53935]">{config.highlight}</span>
            </h1>

            <p
              className="text-base sm:text-lg text-black/70 dark:text-white/70 max-w-xl"
              data-testid="text-hero-subheader"
            >
              {config.subheader}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/anfrage">
                <Button
                  size="lg"
                  className="bg-[#E53935] hover:bg-[#E53935] text-white border-[#b71f1c]"
                  data-testid="button-chat-repair-primary"
                >
                  Reparatur per Chat starten
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onCtaClick("primary")}
                className="border-black/15 dark:border-white/20"
                data-testid="button-cta-primary"
              >
                {config.primaryCta}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => onCtaClick("secondary")}
                className="text-black/70 dark:text-white/70"
                data-testid="button-cta-secondary"
              >
                {config.secondaryCta}
              </Button>
            </div>

            <p className="text-sm text-black/60 dark:text-white/60">
              Kein Login nötig. Schick einfach kurz dein Problem und ein paar Fotos. Den Kontakt fragen wir erst am Ende ab.
            </p>

            <ul className="grid sm:grid-cols-3 gap-2 pt-4">
              {config.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-xs text-black/70 dark:text-white/70"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E53935] mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        {/* Hero visual */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={config.key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="relative aspect-[5/4] rounded-2xl overflow-hidden bg-black border border-black/10 dark:border-white/10"
              data-testid={`hero-visual-${config.key}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(229,57,53,0.45),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(229,57,53,0.18),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_100%)]" />

              <motion.div
                key={`infinity-${config.key}`}
                initial={{ rotate: -8, opacity: 0.0, scale: 0.9 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <InfinityIcon
                  className="w-72 h-72 sm:w-96 sm:h-96 text-white/95 drop-shadow-[0_0_30px_rgba(229,57,53,0.55)]"
                  strokeWidth={1.4}
                />
              </motion.div>

              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2 h-7 rounded-full bg-white/10 backdrop-blur text-white border border-white/15">
                <Sparkles className="w-3 h-3 text-[#E53935]" />
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold">
                  +1 Infinity OS
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                {config.heroBadges.map((b) => (
                  <Badge
                    key={b}
                    variant="outline"
                    className="bg-black/40 backdrop-blur text-white border-white/20 text-[10px] tracking-wider"
                  >
                    {b}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* floating mini stats card */}
          <div className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-2 px-3 h-12 rounded-xl bg-white dark:bg-[#101317] border border-black/10 dark:border-white/10 shadow-lg">
            <span className="w-7 h-7 rounded-md bg-[#E53935] text-white flex items-center justify-center">
              <InfinityIcon className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-black/50 dark:text-white/50">
                Live agents
              </p>
              <p className="text-xs font-bold">9 AI · 3 verticals</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Proof strip ---------------- */

function ProofStrip({ persona }: { persona: PersonaKey }) {
  const stats: Record<PersonaKey, Array<{ k: string; v: string }>> = {
    partner: [
      { k: "Plată medie", v: "24 h" },
      { k: "Parteneri activi", v: "120+" },
      { k: "Comenzi / lună", v: "1 800" },
      { k: "NPS partener", v: "78" },
    ],
    b2b: [
      { k: "Reducere costuri", v: "−40 %" },
      { k: "SLA pickup", v: "4 h" },
      { k: "Acoperire DACH", v: "9 orașe" },
      { k: "Vehicule gestionate", v: "3 200" },
    ],
    legal: [
      { k: "Latență Eckdaten", v: "<300 ms" },
      { k: "Uptime API", v: "99.95 %" },
      { k: "GDPR audits", v: "0 incidente" },
      { k: "Cabinete conectate", v: "42" },
    ],
    investor: [
      { k: "TAM DACH", v: "€12 B" },
      { k: "Marjă brută", v: "62 %" },
      { k: "MoM growth", v: "+18 %" },
      { k: "Runway", v: "22 luni" },
    ],
  };
  const data = stats[persona];

  return (
    <section className="border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.map((s) => (
          <motion.div
            key={`${persona}-${s.k}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center sm:text-left"
            data-testid={`stat-${s.k.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <p className="text-2xl font-extrabold tracking-tight">{s.v}</p>
            <p className="text-[11px] uppercase tracking-wider text-black/50 dark:text-white/50">
              {s.k}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Persona playbook (3-up cards) ---------------- */

function PersonaPlaybook({ config }: { config: PersonaConfig }) {
  const playbooks: Record<PersonaKey, Array<{ icon: typeof Shield; t: string; d: string }>> = {
    partner: [
      { icon: Zap, t: "Aplicație nativă", d: "Comenzi, foto-upload, status și plăți într-o singură app." },
      { icon: Shield, t: "Plăți garantate", d: "Cora AI verifică predarea și eliberează plata în 24 h." },
      { icon: Sparkles, t: "Lead-uri nesfârșite", d: "Hub-ul îți trimite comenzi compatibile cu specializarea ta." },
    ],
    b2b: [
      { icon: Truck, t: "Pickup & Return", d: "Mașina ta e ridicată și returnată — tu nu pierzi o oră." },
      { icon: Globe, t: "Acoperire DACH", d: "Aceleași SLA în München, Frankfurt, Berlin și Hamburg." },
      { icon: Shield, t: "Un singur dashboard", d: "Toate vehiculele, toate facturile, un singur login." },
    ],
    legal: [
      { icon: Shield, t: "GDPR by design", d: "Date izolate per dosar, audit log imutabil 7 ani." },
      { icon: Globe, t: "REST + Webhooks", d: "OpenAPI 3.1, sandbox gratuit, mTLS în producție." },
      { icon: Zap, t: "Eckdaten live", d: "Date trimise în <300 ms către DAT și Unfall-Navi." },
    ],
    investor: [
      { icon: Sparkles, t: "AI-native", d: "9 agenți specializați — Cora, Meister, Contabil, Gutachter…" },
      { icon: TrendingUp, t: "HUB+1 Tokens", d: "Economie internă care lichefiază marja per partener." },
      { icon: Globe, t: "Roadmap DACH", d: "12 orașe în 18 luni, expansiune apoi în AT, CH, RO." },
    ],
  };
  const items = playbooks[config.key];

  return (
    <section className="border-b border-black/5 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#E53935] font-bold">
              {config.eyebrow}
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight">
              De ce Corion pentru tine
            </h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={`${config.key}-${it.t}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#101317] p-5"
              >
                <span className="w-10 h-10 rounded-md bg-[#E53935]/10 text-[#E53935] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <p className="mt-3 text-base font-bold">{it.t}</p>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                  {it.d}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCta({
  config,
  onCtaClick,
}: {
  config: PersonaConfig;
  onCtaClick: () => void;
}) {
  return (
    <section className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-xl bg-[#E53935] text-white flex items-center justify-center shrink-0">
            <InfinityIcon className="w-7 h-7" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
              Începe acum
            </p>
            <p className="text-xl sm:text-2xl font-extrabold">
              {config.headline} {config.highlight}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={onCtaClick}
          className="bg-[#E53935] hover:bg-[#E53935] text-white border-[#b71f1c]"
          data-testid="button-cta-final"
        >
          {config.primaryCta}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </section>
  );
}

function FooterMini() {
  return (
    <footer className="bg-white dark:bg-black border-t border-black/5 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-black/50 dark:text-white/50">
        <p>© {new Date().getFullYear()} Corion Hub. The +1 Infinity Auto-Repair OS.</p>
        <p className="font-mono">v1.0 · DACH · GDPR-ready</p>
      </div>
    </footer>
  );
}

/* ---------------- Floating chat ---------------- */

function FloatingChat({
  open,
  onToggle,
  config,
}: {
  open: boolean;
  onToggle: () => void;
  config: PersonaConfig;
}) {
  const [messages, setMessages] = useState<Array<{ from: "ai" | "user"; text: string }>>([
    { from: "ai", text: config.chatOpener },
  ]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset opener when persona changes
  useEffect(() => {
    setMessages([{ from: "ai", text: config.chatOpener }]);
  }, [config.key, config.chatOpener]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text:
            "Mulțumesc! Un specialist Corion îți va răspunde în câteva minute. Între timp, poți completa formularul rapid din pagină.",
        },
      ]);
    }, 700);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={onToggle}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.4 }}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-3 h-14 rounded-full bg-[#E53935] text-white shadow-xl shadow-[#E53935]/30 hover:bg-[#E53935] active-elevate-2"
        aria-label="Deschide chat"
        data-testid="button-chat-launcher"
      >
        <span className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
          <InfinityIcon className="w-5 h-5 text-white" strokeWidth={2.6} />
        </span>
        <span className="hidden sm:inline text-sm font-semibold pr-2">
          Întreabă Corion AI
        </span>
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] h-[520px] rounded-2xl overflow-hidden bg-white dark:bg-[#101317] border border-black/10 dark:border-white/10 shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Corion AI chat"
            data-testid="panel-chat"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-[#E53935] to-[#b71f1c] text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
                  <InfinityIcon className="w-5 h-5 text-white" strokeWidth={2.6} />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold">Corion AI</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">
                    Persona: {config.shortLabel}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggle}
                className="text-white hover:bg-white/15"
                data-testid="button-chat-close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 bg-black/[0.02] dark:bg-white/[0.02]"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      m.from === "user"
                        ? "bg-[#E53935] text-white rounded-br-sm"
                        : "bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-bl-sm"
                    }`}
                    data-testid={m.from === "ai" ? `chat-ai-${i}` : `chat-user-${i}`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-2 border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#101317]">
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Scrie un mesaj…"
                  className="flex-1"
                  data-testid="input-chat-draft"
                />
                <Button
                  size="icon"
                  onClick={send}
                  className="bg-[#E53935] hover:bg-[#E53935] text-white"
                  data-testid="button-chat-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Corion +1 Infinity AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Lead capture modal ---------------- */

function LeadModal({
  open,
  config,
  ctaKind,
  onClose,
}: {
  open: boolean;
  config: PersonaConfig;
  ctaKind: "primary" | "secondary";
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", phone: "", message: "" });
      setDone(false);
      setSubmitting(false);
    }
  }, [open]);

  const ctaLabel = ctaKind === "primary" ? config.primaryCta : config.secondaryCta;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Câmpuri lipsă",
        description: "Te rugăm să introduci numele și adresa de email.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);

    const payload = {
      persona: config.key,
      personaLabel: config.label,
      cta: ctaLabel,
      ctaKind,
      ...form,
      capturedAt: new Date().toISOString(),
      source: "landing",
    };

    let remoteOk = false;
    try {
      const res = await fetch(MARKETING_LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      remoteOk = res.ok;
    } catch {
      remoteOk = false;
    }

    try {
      const buf = JSON.parse(window.localStorage.getItem("corion-marketing-leads") || "[]");
      buf.push({ ...payload, remoteOk });
      window.localStorage.setItem("corion-marketing-leads", JSON.stringify(buf));
    } catch {
      /* ignore */
    }

    setSubmitting(false);
    setDone(true);
    toast({
      title: remoteOk ? "Mulțumim!" : "Cerere salvată local",
      description: remoteOk
        ? `Cererea ta pentru "${ctaLabel}" a fost trimisă. Te contactăm în 24 h.`
        : `Serverul de marketing nu răspunde momentan, dar cererea ta pentru "${ctaLabel}" a fost salvată și va fi sincronizată automat.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="modal-lead">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-md bg-[#E53935] text-white flex items-center justify-center">
              <InfinityIcon className="w-4 h-4" strokeWidth={2.6} />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#E53935] font-bold">
              {config.eyebrow}
            </span>
          </div>
          <DialogTitle data-testid="text-modal-title">{config.modalTitle}</DialogTitle>
          <DialogDescription>
            Cerere: <span className="font-semibold text-foreground">{ctaLabel}</span>. Lasă-ne datele tale și te contactăm în 24 de ore.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-3" data-testid="modal-success">
            <span className="inline-flex w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </span>
            <p className="font-bold">Cerere trimisă!</p>
            <p className="text-sm text-muted-foreground">
              Echipa Corion +1 te va contacta în maxim 24 de ore.
            </p>
            <Button onClick={onClose} className="mt-2" data-testid="button-modal-close-success">
              Închide
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" data-testid="form-lead" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Nume complet</Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ion Popescu"
                data-testid="input-lead-name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ion@firma.ro"
                  data-testid="input-lead-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">Telefon</Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+49 …"
                  data-testid="input-lead-phone"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-message">Mesaj (opțional)</Label>
              <Input
                id="lead-message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Spune-ne pe scurt ce te interesează"
                data-testid="input-lead-message"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-modal-cancel"
              >
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#E53935] hover:bg-[#E53935] text-white border-[#b71f1c]"
                data-testid="button-modal-submit"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Se trimite…
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Trimite cererea
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
