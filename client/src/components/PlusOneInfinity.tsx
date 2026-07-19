import { motion } from "framer-motion";
import {
  Infinity as InfinityIcon,
  Rocket,
  Coins,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlusOneInfinityProps {
  onCtaClick?: () => void;
  language?: "ro" | "de" | "en";
}

const COPY = {
  ro: {
    eyebrow: "Filosofia Corion",
    slogan: "Fii acel +1.",
    sloganHighlight: "Construim Infinitul împreună.",
    intro:
      "Corion Hub nu este software. Este o mișcare. Un ecosistem care se hrănește din contribuția fiecărui +1 — partener, client, partener legal, investitor — și o transformă în creștere fără limite.",
    pillars: [
      {
        emoji: "🚀",
        icon: Rocket,
        title: "Productivitate Maximă",
        body: "AI-ul preia birocrația. Tu produci valoare reală.",
      },
      {
        emoji: "💶",
        icon: Coins,
        title: "Optimizare Fiscală & Tokenomics",
        body: "Economia HUB+1. Fără limite la creștere. Tu deții valoarea muncii tale.",
      },
      {
        emoji: "♾️",
        icon: InfinityIcon,
        title: "Evoluție Continuă",
        body: "Un ecosistem care nu se termină niciodată. Mai mult timp pentru viață, nu doar pentru business.",
      },
    ],
    cta: "[ +1 ] Intră în Ecosistem",
    ctaCaption: "Gratuit · 60 secunde · Fără card",
  },
  de: {
    eyebrow: "Die Corion Philosophie",
    slogan: "Sei dieses +1.",
    sloganHighlight: "Wir bauen die Unendlichkeit gemeinsam.",
    intro:
      "Corion Hub ist keine Software. Es ist eine Bewegung. Ein Ökosystem, das aus jedem +1 — Partner, Kunde, Anwalt, Investor — grenzenloses Wachstum schafft.",
    pillars: [
      {
        emoji: "🚀",
        icon: Rocket,
        title: "Maximale Produktivität",
        body: "Die KI übernimmt die Bürokratie. Du schaffst echten Wert.",
      },
      {
        emoji: "💶",
        icon: Coins,
        title: "Steuerliche Optimierung & Tokenomics",
        body: "Die HUB+1 Ökonomie. Grenzenloses Wachstum. Du besitzt den Wert deiner Arbeit.",
      },
      {
        emoji: "♾️",
        icon: InfinityIcon,
        title: "Kontinuierliche Evolution",
        body: "Ein Ökosystem, das niemals endet. Mehr Zeit für das Leben, nicht nur für das Geschäft.",
      },
    ],
    cta: "[ +1 ] Tritt dem Ökosystem bei",
    ctaCaption: "Kostenlos · 60 Sek. · Ohne Karte",
  },
  en: {
    eyebrow: "The Corion Philosophy",
    slogan: "Be that +1.",
    sloganHighlight: "We build Infinity together.",
    intro:
      "Corion Hub isn't software. It's a movement. An ecosystem that turns every +1 — partner, client, lawyer, investor — into growth without limits.",
    pillars: [
      {
        emoji: "🚀",
        icon: Rocket,
        title: "Maximum Productivity",
        body: "The AI handles the paperwork. You create real value.",
      },
      {
        emoji: "💶",
        icon: Coins,
        title: "Tax Optimization & Tokenomics",
        body: "The HUB+1 economy. No limits to growth. You own the value of your work.",
      },
      {
        emoji: "♾️",
        icon: InfinityIcon,
        title: "Continuous Evolution",
        body: "An ecosystem that never ends. More time for life, not just for business.",
      },
    ],
    cta: "[ +1 ] Enter the Ecosystem",
    ctaCaption: "Free · 60 seconds · No card",
  },
};

export default function PlusOneInfinity({
  onCtaClick,
  language = "ro",
}: PlusOneInfinityProps) {
  const t = COPY[language];

  return (
    <section
      className="relative overflow-hidden bg-black text-white"
      data-testid="section-plus-one-infinity"
    >
      {/* Background ambience */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(229,57,53,0.22),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(229,57,53,0.12),transparent_55%),radial-gradient(circle_at_85%_70%,rgba(229,57,53,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        {/* Eyebrow + slogan */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-[#E53935]/15 border border-[#E53935]/30 text-[#ff8a87]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold">
              {t.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05]"
            data-testid="text-slogan"
          >
            {t.slogan}{" "}
            <span className="text-[#E53935]">{t.sloganHighlight}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-4 text-sm sm:text-base text-white/65 max-w-2xl mx-auto"
          >
            {t.intro}
          </motion.p>
        </div>

        {/* The +1 → ∞ visual */}
        <PlusOneInfinityVisual />

        {/* 3-column ecosystem */}
        <div
          className="mt-16 grid md:grid-cols-3 gap-4 sm:gap-5"
          data-testid="grid-pillars"
        >
          {t.pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: 0.05 * i }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:border-[#E53935]/40 transition-colors"
                data-testid={`pillar-${i}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="w-9 h-9 rounded-md bg-[#E53935]/15 text-[#E53935] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">
                  {p.body}
                </p>
                <span
                  className="absolute top-4 right-4 text-[10px] font-mono text-white/30"
                  aria-hidden
                >
                  0{i + 1}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Massive glowing CTA */}
        <div className="mt-14 flex flex-col items-center">
          <GlowingCta label={t.cta} onClick={onCtaClick} />
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/40">
            {t.ctaCaption}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ----------- The morphing +1 ↔ ∞ visual ------------- */

function PlusOneInfinityVisual() {
  // Loop: phase A: show +1 (1.6s) → morph (1.2s) → phase B: show ∞ (1.6s) → morph back (1.2s)
  // We orchestrate two layered elements crossfading + scaling.
  const TOTAL = 5.6;

  return (
    <div
      aria-hidden
      className="relative mt-12 mx-auto w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] flex items-center justify-center"
    >
      {/* Outer glowing rings */}
      {[0, 0.6, 1.2].map((delay, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute rounded-full border border-[#E53935]/40"
          initial={{ width: 120, height: 120, opacity: 0 }}
          animate={{
            width: [120, 360],
            height: [120, 360],
            opacity: [0.55, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay,
          }}
        />
      ))}

      {/* Static halo */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(229,57,53,0.35),transparent_60%)] blur-2xl" />

      {/* Central token disc */}
      <motion.div
        className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full bg-gradient-to-br from-[#1a1a1a] via-black to-[#1a1a1a] border border-white/10 shadow-[0_0_60px_rgba(229,57,53,0.45)] flex items-center justify-center overflow-hidden"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {/* Counter-rotate the inner symbols so they stay upright */}
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {/* +1 layer */}
          <motion.span
            aria-hidden
            className="absolute font-extrabold tracking-tighter text-white text-[110px] sm:text-[140px] leading-none select-none"
            style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
            animate={{
              opacity: [1, 1, 0, 0, 0, 1, 1],
              scale: [1, 1, 0.6, 0.6, 0.6, 1, 1],
              filter: [
                "blur(0px)",
                "blur(0px)",
                "blur(8px)",
                "blur(8px)",
                "blur(8px)",
                "blur(0px)",
                "blur(0px)",
              ],
            }}
            transition={{
              duration: TOTAL,
              repeat: Infinity,
              times: [0, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
              ease: "easeInOut",
            }}
            data-testid="visual-plus-one"
          >
            <span className="text-[#E53935]">+</span>1
          </motion.span>

          {/* ∞ layer */}
          <motion.span
            aria-hidden
            className="absolute text-white"
            animate={{
              opacity: [0, 0, 1, 1, 1, 0, 0],
              scale: [0.6, 0.6, 1, 1, 1, 0.6, 0.6],
              filter: [
                "blur(8px)",
                "blur(8px)",
                "blur(0px)",
                "blur(0px)",
                "blur(0px)",
                "blur(8px)",
                "blur(8px)",
              ],
            }}
            transition={{
              duration: TOTAL,
              repeat: Infinity,
              times: [0, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
              ease: "easeInOut",
            }}
            data-testid="visual-infinity"
          >
            <InfinityIcon
              className="w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] drop-shadow-[0_0_20px_rgba(229,57,53,0.7)]"
              strokeWidth={1.5}
            />
          </motion.span>

          {/* Subtle red sweep across the disc */}
          <motion.span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(229,57,53,0.18)_50%,transparent_70%)]"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Floating orbital dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 145;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.span
            key={i}
            aria-hidden
            className="absolute w-1.5 h-1.5 rounded-full bg-[#E53935]"
            style={{ left: "50%", top: "50%", x, y }}
            animate={{
              opacity: [0.25, 1, 0.25],
              scale: [0.8, 1.4, 0.8],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.18,
            }}
          />
        );
      })}
    </div>
  );
}

/* ----------- Massive glowing CTA button ------------- */

function GlowingCta({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Outer pulsing glow rings */}
      {[0, 0.5, 1].map((delay, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#E53935]/30 blur-2xl"
          animate={{ opacity: [0.5, 0.2, 0.5], scale: [1, 1.08, 1] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
        />
      ))}

      <Button
        type="button"
        size="lg"
        onClick={onClick}
        className="relative h-16 px-8 sm:px-10 text-base sm:text-lg font-extrabold tracking-tight bg-[#E53935] hover:bg-[#E53935] text-white border-[#b71f1c] shadow-[0_0_40px_rgba(229,57,53,0.55),inset_0_0_20px_rgba(255,255,255,0.08)]"
        data-testid="button-enter-ecosystem"
      >
        {label}
        <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
}
