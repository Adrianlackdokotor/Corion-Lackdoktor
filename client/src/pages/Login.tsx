import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  Shield,
  Users,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CorionHubWordmark, BrandLogo, RoleLogo } from "@/components/brand/RoleLogo";
import RoleChatOverlay, { type ChatRole } from "@/components/auth/RoleChatOverlay";

type RoleKey = "kunden" | "partner" | "admin";

const ROLE_HINTS: Record<RoleKey, { icon: any; title: string; pitch: string; logoVariant: any }> = {
  kunden: {
    icon: Users,
    title: "Kunde",
    pitch: "Reparaturen verfolgen, Angebote erhalten, mit dem Team chatten.",
    logoVariant: "client",
  },
  partner: {
    icon: Briefcase,
    title: "Partner",
    pitch: "Aufträge annehmen, Provisionen sehen, Kalender steuern.",
    logoVariant: "partner",
  },
  admin: {
    icon: Shield,
    title: "Admin · CFO",
    pitch: "Ecosystem-Kontrolle: AI, Finanzen, Tokens & Workflows.",
    logoVariant: "admin",
  },
};

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openRole, setOpenRole] = useState<RoleKey | null>(null);
  const [chatRole, setChatRole] = useState<ChatRole | null>(null);

  // Capture ?ref= referral code from URL and persist for the register call.
  const referralCode = useMemo(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    if (fromUrl) {
      try { localStorage.setItem("hub.ref", fromUrl); } catch {}
      return fromUrl;
    }
    try { return localStorage.getItem("hub.ref"); } catch { return null; }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "partner") navigate("/partner");
      else navigate("/client");
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const body: any = { email, password };
      if (isRegistering && referralCode) body.referralCode = referralCode;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        if (isRegistering) {
          window.location.href = "/client";
          return;
        }
        const data = await response.json();
        const role = data.user?.role || data.role;
        if (role === "admin") window.location.href = "/admin";
        else if (role === "partner") window.location.href = "/partner";
        else window.location.href = "/client";
      } else {
        const error = await response.json();
        toast({
          title: isRegistering ? "Registrierung fehlgeschlagen" : "Login fehlgeschlagen",
          description: error.message || "Bitte überprüfe deine Eingaben.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte später erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-white/60">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <SEO
        title="Corion Hub · Anmelden"
        description="Anmelden im Corion Hub – das Hub+1 AI-Ökosystem für Kunden, Partner und Admins."
      />

      {/* Ambient backgrounds */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(229,57,53,0.20), transparent 60%)",
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

      {/* Top bar — back to landing */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          data-testid="link-back-website"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Website
        </Link>
        <Link
          href="/landing"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 hover-elevate"
          data-testid="link-landing"
        >
          <Sparkles className="h-3.5 w-3.5 text-red-400" />
          Hub+1 entdecken
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-5 pb-16 pt-4">
        {/* CORION HUB brandmark */}
        <CorionHubWordmark
          bg="black"
          size="lg"
          tagline="The +1 AI Hub"
          className="mb-6 text-white"
        />

        <h1
          className="text-balance text-center text-3xl font-extrabold tracking-tight md:text-4xl"
          data-testid="heading-portal"
        >
          Willkommen im <span className="text-red-500">Corion Hub</span>
        </h1>
        <p className="mt-3 text-center text-sm text-white/60">
          Eine Anmeldung — drei Erlebnisse. Wähle optional deine Rolle für
          eine schnellere Tour.
        </p>

        {/* Glass card */}
        <div className="mt-8 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md shadow-[0_0_60px_rgba(229,57,53,0.10)]">
          {/* Role chips — single expand on click */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ROLE_HINTS) as RoleKey[]).map((key) => {
              const r = ROLE_HINTS[key];
              const Icon = r.icon;
              const isOpen = openRole === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setOpenRole(key);
                    setChatRole(key as ChatRole);
                  }}
                  className={`group flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                    isOpen
                      ? "border-red-500/50 bg-red-500/10 ring-1 ring-red-500/40"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                  }`}
                  data-testid={`chip-role-${key}`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${isOpen ? "text-red-400" : "text-white/70"}`}
                  />
                  <span
                    className={`text-[11px] font-semibold ${isOpen ? "text-white" : "text-white/70"}`}
                  >
                    {r.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expanded pitch */}
          <AnimatePresence initial={false}>
            {openRole && (
              <motion.div
                key={openRole}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-black/40 p-3">
                  <RoleLogo variant={ROLE_HINTS[openRole].logoVariant} size="sm" />
                  <p className="text-xs text-white/80">
                    {ROLE_HINTS[openRole].pitch}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                E-Mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  placeholder="max@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-white/10 bg-black/40 pl-10 text-white placeholder-white/30 focus-visible:ring-red-500/50"
                  required
                  autoComplete="email"
                  inputMode="email"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                Passwort
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-white/10 bg-black/40 pl-10 pr-10 text-white placeholder-white/30 focus-visible:ring-red-500/50"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-red-600 text-base font-semibold text-white hover:bg-red-700"
              disabled={isSubmitting}
              data-testid={isRegistering ? "button-register" : "button-login"}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Wird verarbeitet..."
                : isRegistering
                  ? "Registrieren"
                  : "Anmelden"}
            </Button>
          </form>

          {isRegistering && referralCode && (
            <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-center text-xs text-emerald-300">
              Du wurdest eingeladen — dein Sponsor erhält Tokens nach deinem ersten Auftrag.
            </div>
          )}

          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              type="button"
              className="text-sm text-red-400 hover:underline"
              data-testid="button-toggle-mode"
            >
              {isRegistering ? "Hast du ein Konto? Anmelden" : "Noch kein Konto? Registrieren"}
            </button>
            {!isRegistering && (
              <Link
                href="/forgot-password"
                className="text-xs text-white/50 hover:text-white"
                data-testid="link-forgot-password"
              >
                Passwort vergessen?
              </Link>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[11px] text-white/40">
            <Shield className="h-3 w-3" />
            Sichere Authentifizierung · GDPR-konform
          </div>
        </div>

        {/* Reopen role chat */}
        {openRole && (
          <button
            type="button"
            onClick={() => setChatRole(openRole as ChatRole)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover-elevate"
            data-testid="button-reopen-chat"
          >
            <Sparkles className="h-3 w-3" />
            Wieder mit dem {ROLE_HINTS[openRole].title}-AI sprechen
          </button>
        )}

        {/* AI Portal teaser */}
        <Link
          href="/portal"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover-elevate"
          data-testid="link-ai-portal"
        >
          <BrandLogo bg="red" size="sm" withRing={false} className="h-5 w-5" />
          Lieber zuerst mit unseren AI-Agenten sprechen?
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Role-specific AI chat overlay (opens when a role chip is clicked) */}
      <RoleChatOverlay
        role={(chatRole ?? "kunden") as ChatRole}
        open={chatRole !== null}
        onClose={() => setChatRole(null)}
      />
    </div>
  );
}
