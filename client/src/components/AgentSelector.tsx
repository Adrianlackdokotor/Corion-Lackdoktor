import { useState } from "react";
import { useLocation } from "wouter";
import {
  Wrench,
  BarChart3,
  ClipboardCheck,
  Home as HomeIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface AgentDefinition {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "soon";
  route?: string;
  ringFrom: string;
  ringTo: string;
  iconBg: string;
  iconText: string;
  pillBg: string;
  pillText: string;
  highlights: string[];
}

const AGENTS: AgentDefinition[] = [
  {
    id: "meister",
    name: "Meister AI",
    emoji: "🛠️",
    tagline: "Training & Tech",
    description:
      "Coach tehnic pentru parteneri și ucenici. Curriculum smart-repair, ghiduri pas-cu-pas, asistență live pe atelier.",
    icon: Wrench,
    status: "available",
    route: "/partner",
    ringFrom: "from-orange-500",
    ringTo: "to-rose-600",
    iconBg: "bg-orange-100",
    iconText: "text-orange-700",
    pillBg: "bg-orange-50",
    pillText: "text-orange-700",
    highlights: ["Training video", "Smart-repair playbook", "Sales scripts"],
  },
  {
    id: "contabil",
    name: "Contabil AI",
    emoji: "📊",
    tagline: "Finance",
    description:
      "Financial advisor 24/7. BWA pe înțelesul tău, alerte Mahnung & Skonto, draft-uri către Steuerbüro într-un singur click.",
    icon: BarChart3,
    status: "available",
    route: "/contabil-ai",
    ringFrom: "from-emerald-500",
    ringTo: "to-emerald-700",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    highlights: ["BWA & cash-flow", "Mahnung & Skonto", "TVA optimizat"],
  },
  {
    id: "gutachter",
    name: "Gutachter AI",
    emoji: "📋",
    tagline: "Damage Assessment",
    description:
      "Expertize daune auto generate din foto: estimează costuri, completează formular AT/Allianz, redirecționează cazurile spre rețea.",
    icon: ClipboardCheck,
    status: "available",
    route: "/gutachter-funnel",
    ringFrom: "from-sky-500",
    ringTo: "to-blue-700",
    iconBg: "bg-sky-100",
    iconText: "text-sky-700",
    pillBg: "bg-sky-50",
    pillText: "text-sky-700",
    highlights: ["Foto-analiză", "Cost estimation", "Lead routing"],
  },
  {
    id: "haus",
    name: "Corion Haus AI",
    emoji: "🏠",
    tagline: "Real Estate",
    description:
      "Acquisition & investment radar pentru proprietăți comerciale: scanează listinguri, calculează ROI, sincronizează cu portofoliul Corion.",
    icon: HomeIcon,
    status: "soon",
    ringFrom: "from-violet-500",
    ringTo: "to-purple-700",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
    pillBg: "bg-violet-50",
    pillText: "text-violet-700",
    highlights: ["Listing radar", "ROI scoring", "Deal pipeline"],
  },
];

export default function AgentSelector() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleSelect = (agent: AgentDefinition) => {
    if (connectingId) return;

    if (agent.status === "soon") {
      toast({
        title: `${agent.name} · în curând`,
        description:
          "Acest agent este în beta privată. Te anunțăm când devine disponibil.",
      });
      return;
    }

    setConnectingId(agent.id);
    toast({
      title: `Connecting to ${agent.name}…`,
      description: agent.tagline,
    });

    if (agent.route) {
      const target = agent.route;
      window.setTimeout(() => {
        navigate(target);
        setConnectingId(null);
      }, 600);
    } else {
      window.setTimeout(() => setConnectingId(null), 800);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <SEO
        title="Corion Hub · AI Agent Hub"
        description="Choose an AI agent: Meister, Contabil, Gutachter or Corion Haus."
      />

      {/* Background glow */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none opacity-60"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18) 0%, rgba(2,6,23,0) 60%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <Badge
            variant="outline"
            className="bg-white/5 border-white/15 text-emerald-300 font-semibold mb-4"
            data-testid="badge-hero-eyebrow"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            CORION HUB · AI AGENT HUB
          </Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3"
            data-testid="text-hero-title"
          >
            Alege agentul potrivit pentru job
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Patru agenți AI specializați, antrenați pe operațiunea Corion. Selectează unul
            pentru a începe — sau lasă-i pe toți să lucreze în background.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enterprise-grade · GDPR-compliant · datele rămân în Corion Hub</span>
          </div>
        </div>

        {/* Agent grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          data-testid="grid-agents"
        >
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isConnecting = connectingId === agent.id;
            const disabled = connectingId !== null && !isConnecting;

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => handleSelect(agent)}
                disabled={disabled}
                className={`
                  group relative text-left
                  rounded-2xl p-[1px]
                  bg-gradient-to-br ${agent.ringFrom} ${agent.ringTo}
                  transition-transform duration-200
                  ${disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1 active:translate-y-0"}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                `}
                data-testid={`card-agent-${agent.id}`}
                aria-label={`Pornește ${agent.name}`}
              >
                <div className="relative h-full bg-slate-950 rounded-2xl p-5 sm:p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${agent.iconBg} ${agent.iconText} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {agent.status === "soon" ? (
                      <Badge
                        variant="outline"
                        className="bg-white/5 border-white/15 text-amber-300 text-[10px] font-semibold tracking-wider"
                      >
                        SOON
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`${agent.pillBg} ${agent.pillText} border-transparent text-[10px] font-semibold tracking-wider`}
                      >
                        LIVE
                      </Badge>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase mb-1">
                      <span className="mr-1" aria-hidden="true">{agent.emoji}</span>
                      {agent.tagline}
                    </p>
                    <h3
                      className="text-xl font-extrabold text-white"
                      data-testid={`text-agent-name-${agent.id}`}
                    >
                      {agent.name}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
                    {agent.description}
                  </p>

                  <ul className="space-y-1 mb-5">
                    {agent.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400"
                      >
                        <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                      {isConnecting
                        ? "Connecting…"
                        : agent.status === "soon"
                          ? "Notify-me"
                          : "Open chat"}
                    </span>
                    <span
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        bg-white/10 group-hover:bg-white/20 transition-colors
                      `}
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-white" />
                      )}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer chrome */}
        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-500">
          <Button
            variant="outline"
            className="bg-transparent border-white/15 text-slate-200 hover:bg-white/5 font-semibold"
            onClick={() => navigate("/admin")}
            data-testid="button-back-admin"
          >
            ← Înapoi la dashboard
          </Button>
          <span className="hidden sm:inline">·</span>
          <span>Versiune 1.0 · ultimii 30 zile: 1.847 conversații procesate</span>
        </div>
      </div>
    </div>
  );
}
