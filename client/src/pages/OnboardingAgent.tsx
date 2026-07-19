import { useEffect, useRef, useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Send,
  Bot,
  Sparkles,
  Coins,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";

type Sender = "ai" | "user";
type Style = "instagram" | "chat";

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

const STYLE_LABELS: Record<Style, string> = {
  instagram: "Stil Instagram (poze mari)",
  chat: "Doar Chat / Voce",
};

export default function OnboardingAgent() {
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [chosenStyle, setChosenStyle] = useState<Style | null>(null);
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState(false);

  // Mount: AI greeting + question with typing delays.
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    setAiTyping(true);
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setMessages((m) => [
          ...m,
          {
            id: "ai-1",
            sender: "ai",
            text:
              "Salut! Bine ai venit în echipa Corion Hub. Eu sunt asistentul tău personal. Ca să îți pregătesc aplicația exact așa cum îți place, răspunde-mi la câteva întrebări simple.",
          },
        ]);
        setAiTyping(false);
      }, 900),
    );

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setAiTyping(true);
      }, 1700),
    );

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setMessages((m) => [
          ...m,
          {
            id: "ai-2",
            sender: "ai",
            text:
              "Cum preferi să folosești aplicația pe telefon?\n\nA) Vreau ecrane mari cu poze (ca pe Instagram)\nB) Vreau un Chat simplu (ca pe WhatsApp) unde doar dictez ce am de făcut",
          },
        ]);
        setAiTyping(false);
      }, 2900),
    );

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Auto-scroll to bottom on new message / typing change.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, aiTyping, done]);

  const finalizeWithStyle = (style: Style, userBubbleText: string) => {
    if (chosenStyle) return;
    setChosenStyle(style);
    setMessages((m) => [
      ...m,
      { id: `user-${Date.now()}`, sender: "user", text: userBubbleText },
    ]);
    setDraft("");

    setTimeout(() => setAiTyping(true), 350);
    setTimeout(() => {
      setAiTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: `ai-final-${Date.now()}`,
          sender: "ai",
          text: `Perfect! Am configurat totul pe stilul ${STYLE_LABELS[style]}. Apropo, contul tău a fost încărcat cu 1000 HUB+1 Tokens gratuiți pentru funcțiile automate. Apasă butonul de mai jos ca să intrăm în aplicație!`,
        },
      ]);
      setDone(true);
    }, 1600);
  };

  const handleChip = (style: Style) => {
    const label = style === "instagram" ? "A — Stil Instagram / poze" : "B — Doar chat / voce";
    finalizeWithStyle(style, label);
  };

  const inferStyleFromText = (raw: string): Style | null => {
    const t = raw.trim().toLowerCase();
    if (!t) return null;
    if (
      t === "a" ||
      t.startsWith("a)") ||
      t.startsWith("a.") ||
      t.includes("instagram") ||
      t.includes("poze") ||
      t.includes("poz")
    ) {
      return "instagram";
    }
    if (
      t === "b" ||
      t.startsWith("b)") ||
      t.startsWith("b.") ||
      t.includes("chat") ||
      t.includes("voce") ||
      t.includes("dictez") ||
      t.includes("whatsapp")
    ) {
      return "chat";
    }
    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value || chosenStyle) return;

    const inferred = inferStyleFromText(value);
    if (inferred) {
      finalizeWithStyle(inferred, value);
      return;
    }
    // Fallback: treat any free-text answer as "chat" style preference.
    finalizeWithStyle("chat", value);
  };

  const handleEnter = () => {
    navigate("/partner");
  };

  const inputDisabled = chosenStyle !== null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <SEO
        title="Corion AI Setup | Onboarding"
        description="Bine ai venit în Corion Hub — configurăm aplicația împreună."
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-slate-900 truncate"
              data-testid="text-header-title"
            >
              Corion AI Setup
            </p>
            <p className="text-xs text-emerald-600 flex items-center gap-1" data-testid="text-online-status">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              online · răspunde acum
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-slate-400" />
        </div>
      </header>

      {/* Chat thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        data-testid="container-chat"
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <div className="flex justify-center">
            <span className="text-[11px] font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              Conversație securizată · Astăzi
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`bubble-${m.sender}-${m.id}`}
              >
                {m.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-sm shrink-0 mr-2 mt-auto">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    m.sender === "user"
                      ? "bg-emerald-500 text-white rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}

            {aiTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
                data-testid="indicator-typing"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-sm shrink-0 mr-2 mt-auto">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  </div>
                </div>
              </motion.div>
            )}

            {done && (
              <motion.div
                key="hub-cta"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                className="pt-4 flex flex-col items-center gap-3"
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full"
                >
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700" data-testid="text-tokens-grant">
                    +1000 HUB+1 Tokens creditate
                  </span>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.55, type: "spring", stiffness: 220, damping: 18 }}
                  className="w-full"
                >
                  <Button
                    onClick={handleEnter}
                    size="lg"
                    className="
                      w-full h-16 text-base font-extrabold tracking-wide
                      bg-gradient-to-r from-red-600 via-red-500 to-red-600
                      text-white border-0
                      shadow-[0_0_0_0_rgba(229,57,53,0.4)]
                      animate-[pulse_2.4s_ease-in-out_infinite]
                      ring-2 ring-red-500/30 hover:ring-red-500/50
                    "
                    data-testid="button-enter-hub"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    INTRĂ ÎN CORION HUB 🚀
                  </Button>
                </motion.div>

                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Setup complet · Stil aplicat: {chosenStyle ? STYLE_LABELS[chosenStyle] : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick-reply chips + input bar */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-3 py-3 space-y-2">
          {!chosenStyle && messages.some((m) => m.id === "ai-2") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap gap-2"
            >
              <Button
                variant="outline"
                onClick={() => handleChip("instagram")}
                className="rounded-full border-slate-300 text-slate-800 bg-slate-50 font-medium"
                data-testid="chip-style-instagram"
              >
                A · Stil Instagram / poze
              </Button>
              <Button
                variant="outline"
                onClick={() => handleChip("chat")}
                className="rounded-full border-slate-300 text-slate-800 bg-slate-50 font-medium"
                data-testid="chip-style-chat"
              >
                B · Doar chat / voce
              </Button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={inputDisabled}
              className="text-slate-500 shrink-0"
              data-testid="button-mic"
              aria-label="Vorbește"
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                inputDisabled
                  ? "Conversație finalizată"
                  : "Scrie un mesaj sau alege A / B…"
              }
              disabled={inputDisabled}
              className="flex-1 h-11 rounded-full bg-slate-100 border-slate-200 px-4 text-sm focus-visible:ring-red-500"
              data-testid="input-chat"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={inputDisabled || draft.trim().length === 0}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full shrink-0 disabled:opacity-50"
              data-testid="button-send"
              aria-label="Trimite"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
