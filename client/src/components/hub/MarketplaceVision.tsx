import { Bot, Coins, Boxes, Sparkles, Lock, Network, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Lang = "de" | "ro" | "en";

const COPY: Record<Lang, {
  eyebrow: string;
  title: string;
  titleHl: string;
  subtitle: string;
  cards: { icon: any; title: string; desc: string; tag: string }[];
  ctaLine: string;
  ctaBtn: string;
}> = {
  de: {
    eyebrow: "Roadmap",
    title: "AI Marketplace &",
    titleHl: "Agent Economy",
    subtitle: "Hub+1 ist plugin-ready. Bald kannst du KI-Agenten kaufen, verkaufen, monetarisieren und Workflows als Module im Netzwerk teilen.",
    cards: [
      { icon: Bot, title: "Downloadable Agents", desc: "Spezialisierte KI-Agenten installieren wie Apps. Von Gutachter bis Marketing.", tag: "Vision" },
      { icon: Boxes, title: "Plugin System", desc: "Branchen-Module für Lackdoktor, Karosserie, Smart Home, Immobilien & mehr.", tag: "Coming next" },
      { icon: Coins, title: "Tokenized Services", desc: "Workflows monetarisieren mit Hub+1 Tokens. Faire Revenue-Sharing-Modelle.", tag: "Future-ready" },
      { icon: Network, title: "AI-to-AI Communication", desc: "Agenten orchestrieren sich selbst. Decentralized Autonomous Business Operations.", tag: "Roadmap" },
      { icon: Lock, title: "Decentralized Identity", desc: "Eigene KI-Modelle besitzen. Auf Wunsch blockchain- & ICP-ready.", tag: "Vision" },
      { icon: Sparkles, title: "Smart Glasses Interface", desc: "Hub+1 sehen — Workshop-AR mit Live-Damage-Detection direkt im Sichtfeld.", tag: "Vision" },
    ],
    ctaLine: "Werde Teil des Ecosystems — sichere dir früh deinen +1 Knoten.",
    ctaBtn: "Auf die Roadmap",
  },
  ro: {
    eyebrow: "Roadmap",
    title: "AI Marketplace &",
    titleHl: "Economie de Agenți",
    subtitle: "Hub+1 e plugin-ready. În curând vei putea cumpăra, vinde și monetiza agenți AI, partajând workflow-uri ca module în rețea.",
    cards: [
      { icon: Bot, title: "Agenți Descărcabili", desc: "Instalează agenți AI specializați ca aplicații. De la Expert la Marketing.", tag: "Vision" },
      { icon: Boxes, title: "Sistem Plugin", desc: "Module pe industrii: Lackdoktor, Carosserie, Smart Home, Imobiliare și altele.", tag: "Curând" },
      { icon: Coins, title: "Servicii Tokenizate", desc: "Monetizează workflow-uri cu token Hub+1. Revenue-sharing corect.", tag: "Future-ready" },
      { icon: Network, title: "Comunicare AI-to-AI", desc: "Agenții se orchestrează singuri. Operațiuni autonome descentralizate.", tag: "Roadmap" },
      { icon: Lock, title: "Identitate Descentralizată", desc: "Deține propriile modele AI. Opțional blockchain- & ICP-ready.", tag: "Vision" },
      { icon: Sparkles, title: "Smart Glasses", desc: "Vezi Hub+1 — AR atelier cu detecție live de daune direct în câmp vizual.", tag: "Vision" },
    ],
    ctaLine: "Devino parte din ecosistem — rezervă-ți devreme nodul tău +1.",
    ctaBtn: "Vezi Roadmap-ul",
  },
  en: {
    eyebrow: "Roadmap",
    title: "AI Marketplace &",
    titleHl: "Agent Economy",
    subtitle: "Hub+1 is plugin-ready. Soon you'll be able to buy, sell, monetize AI agents and share workflows as modules across the network.",
    cards: [
      { icon: Bot, title: "Downloadable Agents", desc: "Install specialized AI agents like apps. From inspector to marketing.", tag: "Vision" },
      { icon: Boxes, title: "Plugin System", desc: "Industry modules for body shops, smart home, real estate and more.", tag: "Coming next" },
      { icon: Coins, title: "Tokenized Services", desc: "Monetize workflows with Hub+1 tokens. Fair revenue-sharing built in.", tag: "Future-ready" },
      { icon: Network, title: "AI-to-AI Communication", desc: "Agents orchestrate themselves. Decentralized autonomous business operations.", tag: "Roadmap" },
      { icon: Lock, title: "Decentralized Identity", desc: "Own your AI models. Blockchain- & ICP-ready when you choose.", tag: "Vision" },
      { icon: Sparkles, title: "Smart Glasses Interface", desc: "See Hub+1 — workshop AR with live damage detection in your field of view.", tag: "Vision" },
    ],
    ctaLine: "Join the ecosystem — secure your +1 node early.",
    ctaBtn: "View Roadmap",
  },
};

interface Props {
  lang?: Lang;
  onCta?: () => void;
}

export default function MarketplaceVision({ lang = "de", onCta }: Props) {
  const copy = COPY[lang];
  return (
    <section className="relative overflow-hidden bg-black py-24 md:py-32" data-testid="section-marketplace">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 80% 20%, rgba(229,57,53,0.08), transparent 50%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-white/20 bg-white/5 text-white/70"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            {copy.eyebrow}
          </Badge>
          <h2 className="text-balance text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {copy.title} <span className="text-red-500">{copy.titleHl}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/60 md:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {copy.cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card
                key={c.title}
                className="group relative overflow-hidden border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm hover-elevate"
                data-testid={`card-vision-${c.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10">
                    <Icon className="h-5 w-5 text-red-400" />
                  </div>
                  <Badge variant="outline" className="border-white/15 bg-black/40 text-[10px] text-white/60">
                    {c.tag}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{c.desc}</p>
              </Card>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-balance text-base text-white/70">{copy.ctaLine}</p>
          <Button
            size="lg"
            variant="outline"
            onClick={onCta}
            className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white/10"
            data-testid="button-marketplace-roadmap"
          >
            {copy.ctaBtn}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
