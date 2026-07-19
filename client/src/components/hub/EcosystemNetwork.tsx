import { motion } from "framer-motion";
import {
  Sparkles,
  Bot,
  Wallet,
  Users,
  Wrench,
  ShieldCheck,
  Megaphone,
  Building2,
  GraduationCap,
  FileText,
  Home,
  Network,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Lang = "de" | "ro" | "en";

const NODES = [
  { key: "ai", icon: Bot, color: "#E53935", labels: { de: "KI-Agenten", ro: "Agenți AI", en: "AI Agents" } },
  { key: "fin", icon: Wallet, color: "#10B981", labels: { de: "Finance", ro: "Finanțe", en: "Finance" } },
  { key: "crm", icon: Users, color: "#3B82F6", labels: { de: "CRM", ro: "CRM", en: "CRM" } },
  { key: "ws", icon: Wrench, color: "#F59E0B", labels: { de: "Workshop", ro: "Atelier", en: "Workshop" } },
  { key: "gut", icon: ShieldCheck, color: "#8B5CF6", labels: { de: "Gutachter", ro: "Expertiză", en: "Inspector" } },
  { key: "mkt", icon: Megaphone, color: "#EC4899", labels: { de: "Marketing", ro: "Marketing", en: "Marketing" } },
  { key: "imo", icon: Building2, color: "#06B6D4", labels: { de: "Immobilien", ro: "Imobiliare", en: "Real Estate" } },
  { key: "edu", icon: GraduationCap, color: "#F97316", labels: { de: "Academy", ro: "Academie", en: "Academy" } },
  { key: "wal", icon: Wallet, color: "#22C55E", labels: { de: "Wallet", ro: "Portofel", en: "Wallet" } },
  { key: "doc", icon: FileText, color: "#A855F7", labels: { de: "Dokumente", ro: "Documente", en: "Documents" } },
  { key: "smt", icon: Home, color: "#0EA5E9", labels: { de: "Smart Home", ro: "Smart Home", en: "Smart Home" } },
  { key: "net", icon: Network, color: "#FBBF24", labels: { de: "Marketplace", ro: "Marketplace", en: "Marketplace" } },
];

const COPY: Record<Lang, { eyebrow: string; title: string; titleHl: string; subtitle: string; cta: string; coreLabel: string }> = {
  de: {
    eyebrow: "Hub+1 · Ökosystem",
    title: "Ein dezentrales Ökosystem",
    titleHl: "für unendliches Wachstum",
    subtitle: "Hub+1 verbindet Unternehmen, Menschen, KI-Agenten und digitale Prozesse in einem offenen Netzwerk. Jeder neue Knoten fügt dem System +1 Wert hinzu.",
    cta: "Explore the Ecosystem",
    coreLabel: "Hub+1 Infinity Core",
  },
  ro: {
    eyebrow: "Hub+1 · Ecosistem",
    title: "Un ecosistem descentralizat",
    titleHl: "pentru creștere infinită",
    subtitle: "Hub+1 conectează companii, oameni, agenți AI și procese digitale într-o rețea deschisă. Fiecare nod nou adaugă +1 valoare sistemului.",
    cta: "Explorează Ecosistemul",
    coreLabel: "Hub+1 Infinity Core",
  },
  en: {
    eyebrow: "Hub+1 · Ecosystem",
    title: "A decentralized ecosystem",
    titleHl: "for infinite growth",
    subtitle: "Hub+1 connects companies, people, AI agents and digital processes in an open network. Every new node adds +1 value to the system.",
    cta: "Explore the Ecosystem",
    coreLabel: "Hub+1 Infinity Core",
  },
};

interface Props {
  lang?: Lang;
  onCta?: () => void;
}

export default function EcosystemNetwork({ lang = "de", onCta }: Props) {
  const copy = COPY[lang];
  const radius = 220;
  const cx = 320;
  const cy = 320;

  return (
    <section
      id="ecosystem"
      className="relative overflow-hidden bg-black py-24 md:py-32"
      data-testid="section-ecosystem"
    >
      {/* Ambient red radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(229,57,53,0.18), transparent 55%)",
        }}
      />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-red-500/40 bg-red-500/10 text-red-400"
            data-testid="badge-ecosystem-eyebrow"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            {copy.eyebrow}
          </Badge>
          <h2
            className="text-balance text-4xl font-extrabold tracking-tight text-white md:text-6xl"
            data-testid="heading-ecosystem"
          >
            {copy.title}
            <br />
            <span className="text-red-500">{copy.titleHl}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/60 md:text-lg">
            {copy.subtitle}
          </p>
        </div>

        {/* Network visualization */}
        <div className="relative mx-auto mt-16 aspect-square w-full max-w-2xl" aria-hidden>
          <svg
            viewBox="0 0 640 640"
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E53935" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#7f1d1d" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E53935" stopOpacity="0.0" />
                <stop offset="50%" stopColor="#E53935" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#E53935" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Concentric pulse rings */}
            {[140, 200, 260].map((r, i) => (
              <motion.circle
                key={r}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#E53935"
                strokeOpacity={0.15}
                strokeWidth={1}
                initial={{ opacity: 0.15, scale: 0.96 }}
                animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.96, 1.04, 0.96] }}
                transition={{ duration: 6 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            ))}

            {/* Connection lines */}
            {NODES.map((_, i) => {
              const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * radius;
              const y = cy + Math.sin(angle) * radius;
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="url(#lineGradient)"
                  strokeWidth={1.2}
                  initial={{ opacity: 0.25 }}
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.18 }}
                />
              );
            })}

            {/* Core glow */}
            <circle cx={cx} cy={cy} r={120} fill="url(#coreGradient)" />
          </svg>

          {/* Central core */}
          <motion.div
            className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500/40 bg-black/80 shadow-[0_0_60px_rgba(229,57,53,0.5)] backdrop-blur-sm"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-900 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-3xl font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                ∞
              </span>
            </motion.div>
          </motion.div>

          {/* Orbital nodes */}
          {NODES.map((node, i) => {
            const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
            const xPct = 50 + (Math.cos(angle) * radius * 100) / 640;
            const yPct = 50 + (Math.sin(angle) * radius * 100) / 640;
            const Icon = node.icon;
            return (
              <motion.div
                key={node.key}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.06 }}
              >
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/90 backdrop-blur-sm md:h-14 md:w-14"
                  style={{
                    boxShadow: `0 0 18px ${node.color}55`,
                  }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3 + (i % 4) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                >
                  <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: node.color }} />
                </motion.div>
                <span className="whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm md:text-xs">
                  {node.labels[lang]}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onCta}
            className="h-14 rounded-full bg-red-600 px-8 text-base font-semibold text-white shadow-[0_0_40px_rgba(229,57,53,0.4)] hover:bg-red-700"
            data-testid="button-explore-ecosystem"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {copy.cta}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-white/40">{copy.coreLabel}</p>
        </div>
      </div>
    </section>
  );
}
