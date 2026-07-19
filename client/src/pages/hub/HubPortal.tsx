import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Sparkles,
  ArrowRight,
  X,
  Send,
  Bot,
  Users,
  Wrench,
  Building2,
  Car,
  FileText,
  Calendar,
  Coins,
  ShieldCheck,
  Briefcase,
  Activity,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HubLayout } from "@/components/hub/HubLayout";
import { useHubI18n } from "@/lib/hubI18n";

type Lang = "de" | "ro" | "en";
type RoleKey = "kunden" | "partner" | "admin";

interface RoleConfig {
  key: RoleKey;
  glyph: "infinity" | "plus-infinity" | "infinity-plus";
  badge: Record<Lang, string>;
  title: Record<Lang, string>;
  subtitle: Record<Lang, string>;
  pitch: Record<Lang, string[]>;
  cta: Record<Lang, string>;
  greeting: Record<Lang, string>;
  prompts: Record<Lang, { label: string; icon: any }[]>;
  accent: string; // tailwind color
  borderGlow: string;
}

const ROLES: RoleConfig[] = [
  {
    key: "kunden",
    glyph: "infinity",
    badge: { de: "AI Agent", ro: "Agent AI", en: "AI Agent" },
    title: { de: "Kunden AI", ro: "Clienți AI", en: "Customer AI" },
    subtitle: {
      de: "Soforthilfe bei Unfall, Angebot & Reparatur",
      ro: "Ajutor instant: accident, ofertă & reparație",
      en: "Instant help for accident, quote & repair",
    },
    pitch: {
      de: ["Unfallanalyse", "Gutachten Hilfe", "Leasingrückgabe", "Angebotsanfrage"],
      ro: ["Analiză accident", "Suport expertiză", "Returnare leasing", "Solicitare ofertă"],
      en: ["Accident analysis", "Inspection help", "Lease return", "Get a quote"],
    },
    cta: {
      de: "Mit Kunden-Agent sprechen",
      ro: "Vorbește cu agentul Clienți",
      en: "Talk to Customer Agent",
    },
    greeting: {
      de: "Willkommen — wie kann ich helfen?",
      ro: "Bun venit — cu ce te ajut?",
      en: "Welcome — how can I help?",
    },
    prompts: {
      de: [
        { label: "Ich hatte einen Unfall", icon: Car },
        { label: "Angebot anfragen", icon: FileText },
        { label: "Schaden melden", icon: Activity },
        { label: "Leasingrückgabe", icon: Calendar },
        { label: "Gutachten Hilfe", icon: ShieldCheck },
      ],
      ro: [
        { label: "Am avut un accident", icon: Car },
        { label: "Solicit ofertă", icon: FileText },
        { label: "Raportez daună", icon: Activity },
        { label: "Returnare leasing", icon: Calendar },
        { label: "Suport expertiză", icon: ShieldCheck },
      ],
      en: [
        { label: "I had an accident", icon: Car },
        { label: "Request a quote", icon: FileText },
        { label: "Report damage", icon: Activity },
        { label: "Lease return", icon: Calendar },
        { label: "Inspection help", icon: ShieldCheck },
      ],
    },
    accent: "text-red-400",
    borderGlow: "shadow-[0_0_60px_rgba(229,57,53,0.18)] hover:shadow-[0_0_80px_rgba(229,57,53,0.35)]",
  },
  {
    key: "partner",
    glyph: "infinity",
    badge: { de: "AI Agent", ro: "Agent AI", en: "AI Agent" },
    title: { de: "Partner Hub AI", ro: "Partner Hub AI", en: "Partner Hub AI" },
    subtitle: {
      de: "Aufträge, Umsatz & Zusammenarbeit",
      ro: "Comenzi, venituri & colaborare",
      en: "Orders, revenue & collaboration",
    },
    pitch: {
      de: ["Aufträge erhalten", "Angebote erstellen", "Provisionen verstehen", "Kalender & Planung"],
      ro: ["Primește comenzi", "Creează oferte", "Înțelege comisioanele", "Calendar & planificare"],
      en: ["Receive orders", "Create quotes", "Understand commissions", "Calendar & planning"],
    },
    cta: {
      de: "Partner-Agent öffnen",
      ro: "Deschide agentul Partner",
      en: "Open Partner Agent",
    },
    greeting: {
      de: "Hi Partner — was möchtest du heute klären?",
      ro: "Salut Partener — ce vrei să clarifici azi?",
      en: "Hi Partner — what would you like to clarify today?",
    },
    prompts: {
      de: [
        { label: "Wie funktioniert die Provision?", icon: Coins },
        { label: "Aufträge ansehen", icon: Briefcase },
        { label: "Token Economy erklären", icon: Sparkles },
        { label: "Onboarding starten", icon: UserPlus },
        { label: "Kalender öffnen", icon: Calendar },
      ],
      ro: [
        { label: "Cum funcționează comisionul?", icon: Coins },
        { label: "Vezi comenzi", icon: Briefcase },
        { label: "Explică Token Economy", icon: Sparkles },
        { label: "Începe onboarding", icon: UserPlus },
        { label: "Deschide calendar", icon: Calendar },
      ],
      en: [
        { label: "How does the commission work?", icon: Coins },
        { label: "View orders", icon: Briefcase },
        { label: "Explain Token Economy", icon: Sparkles },
        { label: "Start onboarding", icon: UserPlus },
        { label: "Open calendar", icon: Calendar },
      ],
    },
    accent: "text-blue-400",
    borderGlow: "shadow-[0_0_60px_rgba(59,130,246,0.15)] hover:shadow-[0_0_80px_rgba(59,130,246,0.3)]",
  },
  {
    key: "admin",
    glyph: "plus-infinity",
    badge: { de: "AI Agent", ro: "Agent AI", en: "AI Agent" },
    title: { de: "Hub+1 Control AI", ro: "Hub+1 Control AI", en: "Hub+1 Control AI" },
    subtitle: {
      de: "Management, Finanzen & AI-Orchestrierung",
      ro: "Management, finanțe & orchestrare AI",
      en: "Management, finance & AI orchestration",
    },
    pitch: {
      de: ["AI Orchestration", "Finanzen", "Token Analytics", "Ecosystem Management"],
      ro: ["Orchestrare AI", "Finanțe", "Analitică Tokens", "Management ecosistem"],
      en: ["AI orchestration", "Finance", "Token analytics", "Ecosystem management"],
    },
    cta: {
      de: "Admin-Agent starten",
      ro: "Pornește agentul Admin",
      en: "Start Admin Agent",
    },
    greeting: {
      de: "Hub+1 Control bereit. Was steuern wir heute?",
      ro: "Hub+1 Control pregătit. Ce coordonăm azi?",
      en: "Hub+1 Control ready. What shall we steer today?",
    },
    prompts: {
      de: [
        { label: "Token-Verbrauch heute", icon: Coins },
        { label: "Aktive Aufträge", icon: Briefcase },
        { label: "AI-Agenten Status", icon: Bot },
        { label: "Finanzübersicht", icon: Activity },
        { label: "Ecosystem Health", icon: ShieldCheck },
      ],
      ro: [
        { label: "Consum tokens azi", icon: Coins },
        { label: "Comenzi active", icon: Briefcase },
        { label: "Status agenți AI", icon: Bot },
        { label: "Privire de ansamblu finanțe", icon: Activity },
        { label: "Sănătate ecosistem", icon: ShieldCheck },
      ],
      en: [
        { label: "Token usage today", icon: Coins },
        { label: "Active orders", icon: Briefcase },
        { label: "AI agents status", icon: Bot },
        { label: "Finance overview", icon: Activity },
        { label: "Ecosystem health", icon: ShieldCheck },
      ],
    },
    accent: "text-emerald-400",
    borderGlow: "shadow-[0_0_60px_rgba(16,185,129,0.15)] hover:shadow-[0_0_80px_rgba(16,185,129,0.3)]",
  },
];

const PORTAL_COPY: Record<Lang, {
  eyebrow: string;
  title: string;
  titleHl: string;
  subtitle: string;
  loginHint: string;
  signIn: string;
  create: string;
  classicLogin: string;
}> = {
  de: {
    eyebrow: "Hub+1 · AI Entry",
    title: "Wähle deinen",
    titleHl: "AI-Knoten",
    subtitle: "Jede Rolle hat ihren eigenen KI-Agenten. Sprich zuerst — anmelden später.",
    loginHint: "Du hast schon ein Konto?",
    signIn: "Anmelden",
    create: "Account erstellen",
    classicLogin: "Klassischer Login",
  },
  ro: {
    eyebrow: "Hub+1 · AI Entry",
    title: "Alege-ți",
    titleHl: "nodul AI",
    subtitle: "Fiecare rol are propriul agent AI. Vorbește mai întâi — autentificare după.",
    loginHint: "Ai deja cont?",
    signIn: "Autentificare",
    create: "Creează cont",
    classicLogin: "Login clasic",
  },
  en: {
    eyebrow: "Hub+1 · AI Entry",
    title: "Pick your",
    titleHl: "AI node",
    subtitle: "Every role has its own AI agent. Talk first — sign in later.",
    loginHint: "Already have an account?",
    signIn: "Sign in",
    create: "Create account",
    classicLogin: "Classic login",
  },
};

export default function HubPortal() {
  const { lang: rawLang } = useHubI18n() as any;
  const lang: Lang = (["de", "ro", "en"].includes(rawLang) ? rawLang : "de") as Lang;
  const [, setLocation] = useLocation();
  const [openRole, setOpenRole] = useState<RoleConfig | null>(null);
  const copy = PORTAL_COPY[lang];

  return (
    <HubLayout variant="minimal">
      <section className="relative overflow-hidden bg-black px-6 py-20 md:py-28">
        {/* Ambient backgrounds */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, rgba(229,57,53,0.18), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-5 border-red-500/40 bg-red-500/10 text-red-400"
              data-testid="badge-portal-eyebrow"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              {copy.eyebrow}
            </Badge>
            <h1
              className="text-balance text-4xl font-extrabold tracking-tight text-white md:text-6xl"
              data-testid="heading-portal"
            >
              {copy.title} <span className="text-red-500">{copy.titleHl}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/60 md:text-lg">
              {copy.subtitle}
            </p>
          </div>

          {/* Role cards */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {ROLES.map((role) => (
              <RoleCard
                key={role.key}
                role={role}
                lang={lang}
                onOpen={() => setOpenRole(role)}
              />
            ))}
          </div>

          {/* Classic login secondary */}
          <div className="mt-14 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-white/50">{copy.loginHint}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="h-10 border-white/15 bg-white/5 text-white hover:bg-white/10"
                data-testid="button-portal-signin"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {copy.signIn}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/login?mode=register")}
                className="h-10 border-white/15 bg-white/5 text-white hover:bg-white/10"
                data-testid="button-portal-create"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {copy.create}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Overlay */}
      {openRole && (
        <AIChatOverlay
          role={openRole}
          lang={lang}
          onClose={() => setOpenRole(null)}
          onSignIn={() => {
            setOpenRole(null);
            setLocation("/login");
          }}
          onOnboard={() => {
            setOpenRole(null);
            setLocation("/hub/onboarding");
          }}
        />
      )}
    </HubLayout>
  );
}

function GlyphMark({ kind, className = "" }: { kind: RoleConfig["glyph"]; className?: string }) {
  if (kind === "plus-infinity") {
    // Admin: +1 on top, ∞ below
    return (
      <div className={`flex flex-col items-center leading-none ${className}`}>
        <span className="text-base font-extrabold text-white">+1</span>
        <span className="-mt-0.5 text-xl font-extrabold text-red-500">∞</span>
      </div>
    );
  }
  if (kind === "infinity-plus") {
    // CFO: ∞ on top, +1 below
    return (
      <div className={`flex flex-col items-center leading-none ${className}`}>
        <span className="text-xl font-extrabold text-emerald-400">∞</span>
        <span className="-mt-0.5 text-base font-extrabold text-white">+1</span>
      </div>
    );
  }
  // AI agents: only ∞
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="text-2xl font-extrabold text-red-500 drop-shadow-[0_0_12px_rgba(229,57,53,0.6)]">∞</span>
    </div>
  );
}

function RoleCard({
  role,
  lang,
  onOpen,
}: {
  role: RoleConfig;
  lang: Lang;
  onOpen: () => void;
}) {
  return (
    <Card
      className={`group relative flex flex-col overflow-hidden border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all hover:border-white/25 ${role.borderGlow}`}
      data-testid={`card-role-${role.key}`}
    >
      {/* Animated subtle border glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(229,57,53,0.12), transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/60 shadow-inner">
          <GlyphMark kind={role.glyph} />
          {/* pulse ring */}
          <span className="absolute h-14 w-14 animate-ping rounded-full bg-red-500/10" />
        </div>
        <Badge variant="outline" className="border-white/15 bg-black/40 text-[10px] text-white/60">
          {role.badge[lang]}
        </Badge>
      </div>

      <h3 className="relative mt-5 text-2xl font-extrabold tracking-tight text-white">
        {role.title[lang]}
      </h3>
      <p className="relative mt-1 text-sm text-white/60">{role.subtitle[lang]}</p>

      <ul className="relative mt-5 flex flex-wrap gap-2">
        {role.pitch[lang].map((p) => (
          <li
            key={p}
            className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70"
          >
            {p}
          </li>
        ))}
      </ul>

      <Button
        onClick={onOpen}
        className="relative mt-7 h-11 w-full bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
        data-testid={`button-open-${role.key}`}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {role.cta[lang]}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}

function AIChatOverlay({
  role,
  lang,
  onClose,
  onSignIn,
  onOnboard,
}: {
  role: RoleConfig;
  lang: Lang;
  onClose: () => void;
  onSignIn: () => void;
  onOnboard: () => void;
}) {
  const [messages, setMessages] = useState<{ from: "ai" | "user"; text: string }[]>([
    { from: "ai", text: role.greeting[lang] },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const aiReply = (userText: string) => {
    const lower = userText.toLowerCase();
    const replies: Record<Lang, string> = {
      de: "Verstanden. Für die nächsten Schritte empfehle ich kurz dein Konto einzurichten — ich übernehme die Details.",
      ro: "Am înțeles. Pentru următorii pași îți recomand să-ți configurezi rapid contul — eu mă ocup de detalii.",
      en: "Got it. For the next steps I recommend a quick onboarding — I'll handle the details.",
    };
    if (lower.includes("unfall") || lower.includes("accident") || lower.includes("schaden") || lower.includes("daun")) {
      return lang === "de"
        ? "Bitte lade ein Foto des Schadens hoch — ich analysiere es sofort und schlage die nächsten Schritte vor."
        : lang === "ro"
        ? "Te rog încarcă o poză cu dauna — o analizez imediat și îți propun pașii următori."
        : "Please upload a photo of the damage — I'll analyze it instantly and suggest next steps.";
    }
    if (lower.includes("provision") || lower.includes("comision") || lower.includes("commission")) {
      return lang === "de"
        ? "Partner verdienen 60–75% pro Auftrag. Material & Sicherheitseinbehalt werden transparent abgezogen."
        : lang === "ro"
        ? "Partenerii câștigă 60–75% per comandă. Materialele și sigur. de gar. se deduc transparent."
        : "Partners earn 60–75% per order. Materials & retainer are deducted transparently.";
    }
    if (lower.includes("token")) {
      return lang === "de"
        ? "HUB+1 Tokens steuern AI-Nutzung, Belohnungen und Cash-Out. Ein Token = 1 EUR utility credit."
        : lang === "ro"
        ? "Tokenurile HUB+1 controlează utilizarea AI, recompensele și cash-out. Un token = 1 EUR credit utilitar."
        : "HUB+1 Tokens drive AI usage, rewards & cash-out. One token = 1 EUR utility credit.";
    }
    return replies[lang];
  };

  const send = (text: string) => {
    const v = text.trim();
    if (!v) return;
    setMessages((m) => [...m, { from: "user", text: v }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "ai", text: aiReply(v) }]);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      data-testid="overlay-ai-chat"
      onClick={onClose}
    >
      <Card
        className="relative flex w-full max-w-lg flex-col overflow-hidden border-white/10 bg-zinc-950/95 shadow-2xl"
        style={{ height: "min(640px, 90vh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/80">
              <GlyphMark kind={role.glyph} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{role.title[lang]}</h3>
              <p className="text-[11px] text-white/50">{role.subtitle[lang]}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white/60 hover:text-white"
            data-testid="button-close-chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.from === "user"
                    ? "bg-red-600 text-white"
                    : "border border-white/10 bg-white/[0.04] text-white/90"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick prompts */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
            {lang === "de" ? "Schnelle Aktionen" : lang === "ro" ? "Acțiuni rapide" : "Quick actions"}
          </p>
          <div className="flex flex-wrap gap-2">
            {role.prompts[lang].slice(0, 5).map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  onClick={() => send(p.label)}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/80 hover-elevate"
                  data-testid={`prompt-${role.key}-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Icon className="h-3 w-3 text-red-400" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-white/10 bg-black/40 px-3 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              lang === "de" ? "Nachricht eingeben…" : lang === "ro" ? "Scrie un mesaj…" : "Type a message…"
            }
            className="flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-red-500/50"
            data-testid="input-chat"
          />
          <Button type="submit" size="icon" className="bg-red-600 hover:bg-red-700" data-testid="button-send-chat">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Convert to onboarding / login */}
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-black/40 p-3">
          <Button
            variant="outline"
            onClick={onSignIn}
            className="border-white/15 bg-white/5 text-xs text-white hover:bg-white/10"
            data-testid="button-chat-signin"
          >
            <LogIn className="mr-1.5 h-3 w-3" />
            {lang === "de" ? "Anmelden" : lang === "ro" ? "Autentificare" : "Sign in"}
          </Button>
          <Button
            onClick={onOnboard}
            className="bg-red-600 text-xs text-white hover:bg-red-700"
            data-testid="button-chat-onboard"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            {lang === "de" ? "Konto einrichten" : lang === "ro" ? "Configurează cont" : "Set up account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
