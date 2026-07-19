import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  Bot,
  ArrowLeft,
  Send,
  Sparkles,
  BarChart3,
  FolderSearch,
  Mail,
  TrendingDown,
  Zap,
  ShieldCheck,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";

type Role = "ai" | "user";

interface Message {
  id: string;
  role: Role;
  body: string;
  timestamp: string;
  cta?: { label: string; href: string };
}

interface QuickPrompt {
  id: string;
  icon: typeof BarChart3;
  label: string;
  prompt: string;
  reply: string;
  cta?: { label: string; href: string };
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "bwa",
    icon: BarChart3,
    label: "📊 Explică-mi BWA pe luna aceasta",
    prompt: "Explică-mi BWA pe luna aceasta",
    reply:
      "BWA aprilie 2026 · pe scurt:\n\n• Venituri: 48.320 € (+12% vs. martie)\n• Cheltuieli operaționale: 31.180 € (66% din venit)\n• EBITDA: 17.140 € · marjă 35,5%\n• Cash în cont: 62.450 € (acoperire 2,1 luni)\n\nTrei lucruri demne de atenție: marja s-a îmbunătățit cu 4 puncte față de luna trecută (mai puține cheltuieli cu vopsea), ai 2 facturi clienți restante (333 € și 1.190 €), iar buffer-ul fiscal pentru USt este pe target.",
    cta: { label: "Deschide BWA complet", href: "/finanzen" },
  },
  {
    id: "missing-docs",
    icon: FolderSearch,
    label: "📁 Ce documente lipsesc?",
    prompt: "Ce documente lipsesc?",
    reply:
      "Am verificat extrasul de cont și inbox-ul tău. Lipsesc:\n\n• 3 chitanțe de combustibil de la Aral (12.04, 18.04, 24.04 — total ≈ 247 €)\n• Factura de la Würth (livrare consumabile · 419,80 €)\n• Borderou casă din 28.04 (185 € numerar)\n\nVrei să le încarci acum sau să trimit reminder partenerului responsabil?",
    cta: { label: "Deschide CFO Inbox", href: "/cfo-inbox" },
  },
  {
    id: "steuerbuero",
    icon: Mail,
    label: "✉️ Draft e-mail către Steuerbüro",
    prompt: "Draft e-mail către Steuerbüro",
    reply:
      "Draft pregătit (DE):\n\nSubject: Unterlagen April 2026 – Corion Lackdoktor\n\nSehr geehrte Frau Steuerberaterin,\n\nanbei die vollständigen Unterlagen für April 2026:\n• 47 Eingangsrechnungen (ER)\n• 38 Ausgangsrechnungen (AR)\n• Kontoauszug 04/2026 (Sparkasse + N26)\n• Kassenbuch April abgestimmt\n\nDie BWA-Vorschau ergibt einen Gewinn von 17.140 €. Bitte um Freigabe für die USt-Voranmeldung bis zum 10.05.\n\nVielen Dank,\nCorina · Corion Lackdoktor",
  },
  {
    id: "skonto-tva",
    icon: TrendingDown,
    label: "📉 Optimizare fiscală (Skonto/TVA)",
    prompt: "Optimizare fiscală (Skonto/TVA)",
    reply:
      "Trei pârghii rapide pentru luna aceasta:\n\n1. Skonto activ: 4 facturi furnizori cu 2% Skonto dacă plătești în ≤7 zile → economie 187 €.\n2. USt-Splitting: 1.890 € din achizițiile de utilaje pot intra în Investitionsabzugsbetrag (§7g) → reducere TVA estimată 359 €.\n3. Reverse-Charge: 2 facturi UE (CZ + AT) sunt marcate greșit cu TVA — aplică reverse-charge și economisești 423 € cash-flow.\n\nTotal potențial luna asta: ~969 € → vrei să generez task-uri pentru Steuerbüro?",
    cta: { label: "Vezi alertele Skonto", href: "/cfo-inbox" },
  },
];

const formatTime = () =>
  new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-welcome",
    role: "ai",
    body:
      "Bună, Corina! Sunt Contabil AI. Am acces la BWA-ul tău, extrasele bancare conectate și inbox-ul de facturi. Întreabă-mă orice — sau apasă unul din prompt-urile rapide de mai jos.",
    timestamp: formatTime(),
  },
];

export default function ContabilAI() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const promptIndex = useMemo(() => {
    const map: Record<string, QuickPrompt> = {};
    QUICK_PROMPTS.forEach((p) => {
      map[p.prompt.toLowerCase()] = p;
    });
    return map;
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const findReplyFor = (text: string): { reply: string; cta?: Message["cta"] } => {
    const lower = text.toLowerCase().trim();
    const direct = promptIndex[lower];
    if (direct) return { reply: direct.reply, cta: direct.cta };

    const matched = QUICK_PROMPTS.find((p) =>
      lower.includes(p.prompt.toLowerCase().split(" ")[0]),
    );
    if (matched) return { reply: matched.reply, cta: matched.cta };

    return {
      reply:
        "Bună întrebare! Pentru moment am acces doar la prompt-urile rapide de mai jos. Apasă unul din chips-urile sugerate sau formulează întrebarea folosind unul dintre cuvintele-cheie: BWA, documente, Steuerbüro, Skonto.",
    };
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      body: trimmed,
      timestamp: formatTime(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    const { reply, cta } = findReplyFor(trimmed);
    window.setTimeout(() => {
      const aiMsg: Message = {
        id: `msg-${Date.now()}-a`,
        role: "ai",
        body: reply,
        timestamp: formatTime(),
        cta,
      };
      setMessages((m) => [...m, aiMsg]);
      setBusy(false);
    }, 650);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const onPromptClick = (p: QuickPrompt) => sendMessage(p.prompt);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title="Contabil AI · Corion Hub"
        description="AI-powered financial assistant for Corion Lackdoktor."
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/agent-hub">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Înapoi la Agent Hub"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
              aria-label="Online"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600 uppercase">
              Corion Hub · Financial Advisor
            </p>
            <h1
              className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight"
              data-testid="text-header-title"
            >
              Contabil AI — Corion Hub
            </h1>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold hidden sm:inline-flex"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Enterprise · GDPR
          </Badge>
        </div>
      </header>

      {/* Chat surface */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 gap-4 overflow-hidden">
        <ScrollArea className="flex-1 -mx-2" data-testid="region-messages">
          <div ref={scrollRef} className="px-2 space-y-4 pb-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {busy && (
              <div className="flex items-end gap-2" data-testid="indicator-typing">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick-prompt chips */}
        <div className="flex flex-wrap gap-2" data-testid="row-quick-prompts">
          {QUICK_PROMPTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPromptClick(p)}
                disabled={busy}
                className="
                  group inline-flex items-center gap-2
                  rounded-full border border-emerald-200 bg-white
                  px-3 py-2 text-xs font-semibold text-emerald-800
                  hover-elevate active-elevate-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                data-testid={`chip-prompt-${p.id}`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="
            bg-white border border-slate-200 rounded-2xl
            p-2 flex items-end gap-2
            shadow-sm
            focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100
            transition-colors
          "
          data-testid="form-composer"
        >
          <label htmlFor="contabil-ai-input" className="sr-only">
            Întrebare pentru Contabil AI
          </label>
          <Textarea
            id="contabil-ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Întreabă Contabil AI orice despre BWA, facturi, TVA, Skonto…"
            aria-label="Întrebare pentru Contabil AI"
            rows={1}
            className="
              resize-none border-0 bg-transparent
              focus-visible:ring-0 focus-visible:ring-offset-0
              text-sm leading-relaxed flex-1 min-h-[44px] max-h-32
            "
            data-testid="input-message"
          />
          <Button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label={busy ? "Se trimite întrebarea" : "Trimite întrebarea"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0"
            data-testid="button-send"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Send className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline">Trimite</span>
              </>
            )}
          </Button>
        </form>
        <p className="text-[11px] text-slate-400 text-center -mt-2 flex items-center justify-center gap-1">
          <Zap className="w-3 h-3 text-emerald-500" />
          Răspunsuri generate instant · datele tale rămân în Corion Hub
        </p>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`bubble-${message.role}-${message.id}`}
    >
      {!isUser && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`
          max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${
            isUser
              ? "bg-emerald-600 text-white rounded-br-sm shadow-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
          }
        `}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        {message.cta && (
          <Link href={message.cta.href}>
            <Button
              size="sm"
              variant={isUser ? "secondary" : "default"}
              className={
                isUser
                  ? "mt-3 bg-white text-emerald-700 hover:bg-emerald-50"
                  : "mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
              }
              data-testid={`button-cta-${message.id}`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {message.cta.label}
            </Button>
          </Link>
        )}
        <p
          className={`text-[10px] mt-2 ${
            isUser ? "text-emerald-100" : "text-slate-400"
          }`}
        >
          {message.timestamp}
        </p>
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-slate-200 text-slate-700">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
