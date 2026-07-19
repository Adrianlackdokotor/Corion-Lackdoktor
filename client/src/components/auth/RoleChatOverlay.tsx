import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export type ChatRole = "kunden" | "partner" | "admin";

interface ChatMessage {
  id: string;
  from: "ai" | "user";
  text: string;
}

interface CtaLink {
  label: string;
  href: string;
  primary?: boolean;
}

interface RoleConfig {
  title: string;
  subtitle: string;
  greeting: string;
  prompts: string[];
  ctas: CtaLink[];
}

const ROLE_CONFIG: Record<ChatRole, RoleConfig> = {
  kunden: {
    title: "Kunden AI",
    subtitle: "Dein persönlicher Reparatur-Concierge",
    greeting:
      "Hallo 👋 Ich bin dein Kunden AI. Möchtest du einen Schaden melden, ein Angebot erhalten oder deine Reparatur verfolgen?",
    prompts: [
      "Schaden melden",
      "Angebot erhalten",
      "Fotos hochladen",
      "Gutachten hochladen",
      "Termin anfragen",
    ],
    ctas: [
      { label: "Anfrage erstellen", href: "/anfrage", primary: true },
      { label: "Einloggen", href: "#login" },
      { label: "Registrieren", href: "#register" },
    ],
  },
  partner: {
    title: "Partner Hub AI",
    subtitle: "Aufträge, Provisionen, Kalender — alles in einem Chat",
    greeting:
      "Willkommen im Partner Hub 👋 Ich helfe dir mit Aufträgen, Provisionen, Kalender und Zusammenarbeit.",
    prompts: [
      "Partner werden",
      "Auftrag ansehen",
      "Provision berechnen",
      "Kalender öffnen",
      "Token verstehen",
    ],
    ctas: [
      { label: "Partner Login", href: "#login", primary: true },
      { label: "Partner Bewerbung", href: "/franchise" },
      { label: "Provisionen ansehen", href: "/partner-finance" },
    ],
  },
  admin: {
    title: "Hub+1 Control",
    subtitle: "Management · Finanzen · Tokens · Agents",
    greeting:
      "Hub+1 Control ist aktiv. Ich helfe bei Management, Finanzen, Token, Agents und Orchestrierung.",
    prompts: [
      "Dashboard öffnen",
      "Cashflow prüfen",
      "Token Verbrauch",
      "Agenten verwalten",
      "Reports erstellen",
    ],
    ctas: [
      { label: "Admin Login", href: "#login", primary: true },
      { label: "CFO Dashboard", href: "/finanzen" },
      { label: "Agent Hub", href: "/admin/agent-tasks" },
    ],
  },
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props {
  role: ChatRole;
  open: boolean;
  onClose: () => void;
}

export default function RoleChatOverlay({ role, open, onClose }: Props) {
  const cfg = ROLE_CONFIG[role];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<Element | null>(null);
  // Token guards in-flight requests; bumped on reset/unmount so stale replies are ignored.
  const sessionRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Reset thread when role changes / overlay reopens; abort any in-flight request.
  useEffect(() => {
    if (!open) return;
    sessionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([{ id: uid(), from: "ai", text: cfg.greeting }]);
    setInput("");
    setBusy(false);
    setHasAnswered(false);
  }, [open, role, cfg.greeting]);

  // On unmount: cancel any pending request.
  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  // Capture the element that opened us (for focus restore) and move focus into the dialog.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const t = setTimeout(() => composerRef.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      const el = triggerRef.current as HTMLElement | null;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  // Focus trap: keep Tab inside the dialog while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !cardRef.current) return;
      const focusables = cardRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter((el) => !el.hasAttribute("disabled"));
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages((m) => [...m, { id: uid(), from: "user", text: trimmed }]);
    setInput("");
    setBusy(true);

    // Guard against stale responses if the user closes / switches role mid-flight.
    const mySession = sessionRef.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeoutId = setTimeout(() => ctrl.abort(), 20000);

    const isStale = () => mySession !== sessionRef.current;
    const safePush = (msg: ChatMessage) => {
      if (isStale()) return;
      setMessages((m) => [...m, msg]);
      setHasAnswered(true);
    };

    try {
      // Reuses the same grounded /api/ai backend as the in-app assistant widget
      // (client/src/agents/CorionAgent.ts) instead of the separate, largely-stubbed
      // orchestrator that used to live behind /api/ai/chat.
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({
          prompt: trimmed,
          agentType: "assistant",
          role: role === "partner" ? "partner" : "client",
        }),
      });
      let reply = "";
      if (res.ok) {
        const data = await res.json();
        if (isStale()) return;
        reply =
          data.reply ||
          data.message ||
          data.answer ||
          data.text ||
          (typeof data === "string" ? data : "") ||
          "Ich bin gerade nicht ganz sicher — magst du mir mehr Details geben?";
      } else if (res.status === 503) {
        reply =
          "Mein AI-Modul ist gerade offline. Du kannst dich aber direkt unten einloggen oder registrieren — ich bin dann gleich für dich da.";
      } else {
        reply =
          "Hm, das hat nicht geklappt. Versuche es bitte gleich nochmal oder logge dich ein, um direkt loszulegen.";
      }
      safePush({ id: uid(), from: "ai", text: reply });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Either user-cancelled (stale) — drop silently — or real timeout — show fallback.
        if (!isStale()) {
          safePush({
            id: uid(),
            from: "ai",
            text:
              "Das hat etwas zu lange gedauert. Versuche es bitte gleich nochmal oder logge dich ein.",
          });
        }
      } else {
        safePush({
          id: uid(),
          from: "ai",
          text:
            "Verbindung gerade wackelig. Logge dich ein und ich helfe dir direkt im Hub weiter.",
        });
      }
    } finally {
      clearTimeout(timeoutId);
      if (!isStale()) setBusy(false);
    }
  };

  const handleCta = (href: string) => {
    if (href === "#login") {
      onClose();
      // Login form is already visible behind the overlay; just focus the email field.
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>('[data-testid="input-email"]');
        el?.focus();
      }, 50);
      return;
    }
    if (href === "#register") {
      onClose();
      setTimeout(() => {
        document.querySelector<HTMLButtonElement>('[data-testid="button-toggle-mode"]')?.click();
        document.querySelector<HTMLInputElement>('[data-testid="input-email"]')?.focus();
      }, 50);
      return;
    }
    window.location.href = href;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-2 pb-2 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
          data-testid="overlay-role-chat"
        >
          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-chat-title"
            aria-describedby="role-chat-subtitle"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-black/90 text-white shadow-[0_0_80px_rgba(229,57,53,0.25)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
            data-testid={`role-chat-${role}`}
          >
            {/* Header with animated infinity logo */}
            <div className="relative flex items-start gap-3 border-b border-white/10 bg-gradient-to-b from-red-500/15 to-transparent px-5 py-4">
              <AnimatedInfinityBadge />
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-widest text-red-300">
                  Hub+1
                </div>
                <h2
                  id="role-chat-title"
                  className="text-lg font-extrabold leading-tight"
                  data-testid="text-chat-title"
                >
                  {cfg.title}
                </h2>
                <p id="role-chat-subtitle" className="text-xs text-white/60">
                  {cfg.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className="rounded-full p-1.5 text-white/60 hover-elevate"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="max-h-[50vh] min-h-[200px] space-y-3 overflow-y-auto px-5 py-4"
              data-testid="chat-messages"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.from === "user"
                        ? "bg-red-600 text-white"
                        : "border border-white/10 bg-white/[0.04] text-white/90"
                    }`}
                    data-testid={`msg-${m.from}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">
                    <Loader2 className="h-3 w-3 animate-spin text-red-400" />
                    AI denkt nach…
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompt chips (hide once user has engaged) */}
            {messages.length <= 1 && !busy && (
              <div className="flex flex-wrap gap-2 px-5 pb-3" data-testid="quick-prompts">
                {cfg.prompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 hover-elevate"
                    data-testid={`chip-prompt-${p.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <Sparkles className="mr-1 inline h-3 w-3 text-red-400" />
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Contextual CTAs after first answer */}
            {hasAnswered && (
              <div className="flex flex-wrap gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3" data-testid="chat-ctas">
                {cfg.ctas.map((c) => (
                  <Button
                    key={c.label}
                    type="button"
                    size="sm"
                    variant={c.primary ? "default" : "outline"}
                    className={
                      c.primary
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "border-white/20 bg-white/[0.04] text-white"
                    }
                    onClick={() => handleCta(c.href)}
                    data-testid={`cta-${c.label.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {c.label}
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 bg-black/60 px-3 py-3"
            >
              <Input
                ref={composerRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Schreib mir, wobei ich helfen kann…"
                disabled={busy}
                aria-label="Nachricht an AI"
                className="h-10 flex-1 border-white/10 bg-white/[0.04] text-sm text-white placeholder-white/40 focus-visible:ring-red-500/50"
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || busy}
                className="bg-red-600 text-white hover:bg-red-700"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Animated infinity / +1 logo ──────────────────────────────────────────
function AnimatedInfinityBadge() {
  return (
    <div className="relative h-10 w-10 shrink-0">
      {/* Soft red glow halo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-red-500/30 blur-xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Outer breathing ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-red-500/50"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Core mark */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black ring-1 ring-red-500/60">
        <svg viewBox="0 0 32 16" className="h-4 w-7" aria-hidden>
          <motion.path
            d="M8 8 C 8 2, 0 2, 0 8 S 8 14, 8 8 C 8 2, 16 2, 16 8 S 24 14, 24 8 C 24 2, 32 2, 32 8 S 24 14, 24 8"
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: 0.3, opacity: 0.8 }}
            animate={{ pathLength: [0.3, 1, 0.3], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        {/* +1 floating overlay */}
        <motion.span
          className="absolute -right-1 -top-1 select-none rounded-full bg-red-600 px-1 text-[8px] font-extrabold leading-none text-white shadow"
          animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.8, 1] }}
        >
          +1
        </motion.span>
      </div>
    </div>
  );
}
