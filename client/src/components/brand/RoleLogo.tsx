import { cn } from "@/lib/utils";

export type RoleLogoVariant = "admin" | "cfo" | "ai" | "partner" | "client";
export type RoleLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface RoleLogoProps {
  variant: RoleLogoVariant;
  size?: RoleLogoSize;
  className?: string;
  withRing?: boolean;
}

const SIZE_MAP: Record<RoleLogoSize, { box: string; top: string; bot: string; gap: string; only: string }> = {
  xs: { box: "h-7 w-7", top: "text-[10px]", bot: "text-[10px]", gap: "-mt-0.5", only: "text-base" },
  sm: { box: "h-9 w-9", top: "text-[11px]", bot: "text-[12px]", gap: "-mt-0.5", only: "text-lg" },
  md: { box: "h-11 w-11", top: "text-[13px]", bot: "text-base", gap: "-mt-0.5", only: "text-xl" },
  lg: { box: "h-14 w-14", top: "text-base", bot: "text-lg", gap: "-mt-1", only: "text-2xl" },
  xl: { box: "h-20 w-20", top: "text-xl", bot: "text-2xl", gap: "-mt-1", only: "text-4xl" },
};

const PALETTES: Record<
  RoleLogoVariant,
  { bg: string; ring: string; top: string; bot: string; only: string; glow: string }
> = {
  admin: {
    // +1 on top (white) · ∞ below (red) — control of the ecosystem hierarchy
    bg: "bg-gradient-to-br from-zinc-900 via-black to-zinc-950",
    ring: "ring-1 ring-red-500/40",
    top: "text-white",
    bot: "text-red-500 drop-shadow-[0_0_8px_rgba(229,57,53,0.55)]",
    only: "",
    glow: "shadow-[0_0_18px_rgba(229,57,53,0.35)]",
  },
  cfo: {
    // ∞ on top (emerald) · +1 below (white) — infinite financial growth
    bg: "bg-gradient-to-br from-emerald-950 via-black to-emerald-950",
    ring: "ring-1 ring-emerald-400/40",
    top: "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]",
    bot: "text-white",
    only: "",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.35)]",
  },
  ai: {
    bg: "bg-gradient-to-br from-zinc-900 via-black to-zinc-950",
    ring: "ring-1 ring-red-500/30",
    top: "",
    bot: "",
    only: "text-red-500 drop-shadow-[0_0_10px_rgba(229,57,53,0.6)]",
    glow: "shadow-[0_0_18px_rgba(229,57,53,0.3)]",
  },
  partner: {
    bg: "bg-gradient-to-br from-blue-950 via-black to-blue-950",
    ring: "ring-1 ring-blue-400/40",
    top: "text-white",
    bot: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    only: "",
    glow: "shadow-[0_0_18px_rgba(59,130,246,0.3)]",
  },
  client: {
    bg: "bg-gradient-to-br from-zinc-900 via-black to-zinc-950",
    ring: "ring-1 ring-white/15",
    top: "text-white",
    bot: "text-white/70",
    only: "",
    glow: "",
  },
};

/**
 * Brand identity glyph used for HUB+1 roles.
 *  - admin   : +1 on top, ∞ below  (red)
 *  - cfo     : ∞ on top, +1 below  (emerald)
 *  - ai      : ∞ only              (red, glowing)
 *  - partner : +1 on top, ∞ below  (blue)
 *  - client  : +1 / ∞ minimal      (neutral)
 */
export function RoleLogo({
  variant,
  size = "md",
  className,
  withRing = true,
}: RoleLogoProps) {
  const s = SIZE_MAP[size];
  const p = PALETTES[variant];

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        s.box,
        p.bg,
        withRing && p.ring,
        p.glow,
        className,
      )}
    >
      {variant === "ai" ? (
        <span className={cn("font-extrabold leading-none", s.only, p.only)}>∞</span>
      ) : variant === "cfo" ? (
        <span className="flex flex-col items-center leading-none">
          <span className={cn("font-extrabold", s.top, p.top)}>∞</span>
          <span className={cn("font-extrabold", s.gap, s.bot, p.bot)}>+1</span>
        </span>
      ) : (
        // admin / partner / client all use +1 over ∞
        <span className="flex flex-col items-center leading-none">
          <span className={cn("font-extrabold", s.top, p.top)}>+1</span>
          <span className={cn("font-extrabold", s.gap, s.bot, p.bot)}>∞</span>
        </span>
      )}
    </span>
  );
}

/**
 * Detect which logo variant best fits a free-text role label.
 *  - "Admin · CFO" → "admin" by default; CFO badge can be shown alongside.
 *  - bare "CFO" / "Finanz" → "cfo".
 */
export function detectRoleVariant(role: string | null | undefined): RoleLogoVariant {
  if (!role) return "client";
  const r = role.toLowerCase();
  if (r.includes("admin")) return "admin";
  if (r.includes("cfo") || r.includes("finanz") || r.includes("finance")) return "cfo";
  if (r.includes("partner")) return "partner";
  if (r.includes("kunde") || r.includes("client")) return "client";
  return "client";
}

/* ------------------------------------------------------------------ */
/*  CORION HUB master brand mark — ∞ + "+1" lock-up                    */
/* ------------------------------------------------------------------ */

export type BrandLogoBg = "red" | "black" | "transparent";
export type BrandLogoSize = "sm" | "md" | "lg" | "xl";

const BRAND_BOX: Record<BrandLogoSize, { box: string; inf: string; plus: string; gap: string }> = {
  sm: { box: "h-9 w-9",  inf: "text-xl",   plus: "text-[10px]", gap: "-mt-1" },
  md: { box: "h-12 w-12", inf: "text-2xl",  plus: "text-[11px]", gap: "-mt-1" },
  lg: { box: "h-16 w-16", inf: "text-4xl",  plus: "text-xs",     gap: "-mt-1.5" },
  xl: { box: "h-24 w-24", inf: "text-6xl",  plus: "text-sm",     gap: "-mt-2" },
};

/**
 * CORION HUB brand mark: a stylized ∞ with a small "+1" sub-superscript.
 * Two background variants for contrast use:
 *   - bg="red"   → red disc, white ∞ + black "+1" pill
 *   - bg="black" → black disc, red ∞  + white "+1" pill
 *   - bg="transparent" → adapts to surrounding (current text color)
 */
export function BrandLogo({
  bg = "black",
  size = "md",
  withRing = true,
  className,
}: {
  bg?: BrandLogoBg;
  size?: BrandLogoSize;
  withRing?: boolean;
  className?: string;
}) {
  const s = BRAND_BOX[size];

  const bgClass =
    bg === "red"
      ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700"
      : bg === "black"
        ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-950"
        : "bg-transparent";

  const ringClass =
    bg === "red"
      ? "ring-1 ring-white/30"
      : bg === "black"
        ? "ring-1 ring-red-500/40"
        : "";

  const glowClass =
    bg === "red"
      ? "shadow-[0_0_24px_rgba(229,57,53,0.45)]"
      : bg === "black"
        ? "shadow-[0_0_24px_rgba(229,57,53,0.30)]"
        : "";

  const infClass =
    bg === "red"
      ? "text-white"
      : bg === "black"
        ? "text-red-500 drop-shadow-[0_0_10px_rgba(229,57,53,0.6)]"
        : "text-current";

  const plusBg =
    bg === "red"
      ? "bg-black text-white"
      : bg === "black"
        ? "bg-red-600 text-white"
        : "bg-current text-background";

  return (
    <span
      aria-label="Corion Hub"
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        s.box,
        bgClass,
        withRing && ringClass,
        glowClass,
        className,
      )}
    >
      <span className={cn("font-extrabold leading-none", s.inf, infClass)}>∞</span>
      <span
        className={cn(
          "absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-extrabold leading-none ring-2",
          s.plus,
          plusBg,
          bg === "red" ? "ring-red-600" : "ring-black",
        )}
      >
        +1
      </span>
    </span>
  );
}

/**
 * Full "CORION HUB" wordmark with the brand glyph on the left.
 */
export function CorionHubWordmark({
  bg = "black",
  size = "md",
  className,
  tagline,
}: {
  bg?: BrandLogoBg;
  size?: BrandLogoSize;
  className?: string;
  tagline?: string;
}) {
  const wordSize =
    size === "xl" ? "text-3xl" : size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base";
  const tagSize =
    size === "xl" ? "text-xs" : size === "lg" ? "text-[11px]" : "text-[10px]";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <BrandLogo bg={bg} size={size} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-extrabold tracking-tight", wordSize)}>
          <span>CORION</span>
          <span className="text-red-500"> HUB</span>
        </span>
        {tagline && (
          <span className={cn("uppercase tracking-[0.18em] opacity-60", tagSize)}>
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}

export default RoleLogo;
