import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  ImageIcon,
  Sparkles,
  ShieldCheck,
  Building2,
  Hammer,
  ArrowRight,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import chatIconImage from "@assets/chat-icon_1761147332590.png";

type TriageChoice = "accident" | "leasing" | "private";

type Bubble =
  | {
      id: string;
      kind: "ai-text";
      text: string;
    }
  | {
      id: string;
      kind: "ai-photo-prompt";
    }
  | {
      id: string;
      kind: "ai-triage-chips";
    }
  | {
      id: string;
      kind: "ai-cta";
      text: string;
      ctaLabel: string;
      ctaHref: string;
      icon: "shield" | "building" | "hammer";
    }
  | {
      id: string;
      kind: "ai-contact-request";
    }
  | {
      id: string;
      kind: "ai-task-created";
      text: string;
    }
  | {
      id: string;
      kind: "user-photo";
      name?: string;
    }
  | {
      id: string;
      kind: "user-text";
      text: string;
    };

type Phase = "intro" | "awaiting-photo" | "analyzing" | "triage" | "awaiting-contact" | "creating-task" | "routed";

type Locale = "de" | "ro";

const COPY: Record<Locale, {
  introText: string;
  photoPrompt: string;
  uploadPhoto: string;
  pickFromGallery: string;
  triagePrompt: string;
  analyzing: string;
  assistantTitle: string;
  assistantSubtitle: string;
  online: string;
  gdprHint: string;
  contactPrompt: string;
  contactPlaceholder: string;
  contactSubmit: string;
  taskCreated: string;
  taskCreateError: string;
  openAria: string;
  closeAria: string;
  resetAria: string;
  dialogAria: string;
  uploadedPhotoName: string;
  uploadedSuccess: string;
  triageOptions: Array<{ value: TriageChoice; label: string; emoji: string; icon: typeof ShieldCheck; iconBg: string; iconColor: string }>;
  routing: Record<TriageChoice, { text: string; ctaLabel: string; ctaHref: string; icon: "shield" | "building" | "hammer" }>;
}> = {
  de: {
    introText: "Hallo, ich bin dein Corion Assistent. Schick mir einfach ein Foto vom Schaden und ich sage dir direkt, wie wir das schnell und sauber lösen können.",
    photoPrompt: "Lade ein klares Foto der betroffenen Stelle hoch. Das geht auch direkt vom Handy.",
    uploadPhoto: "Foto senden",
    pickFromGallery: "Aus Galerie wählen",
    triagePrompt: "Ich habe den Schaden grob eingeordnet. Damit ich dich richtig weiterleiten kann, wähle bitte kurz den Kontext aus:",
    analyzing: "Corion AI analysiert das Foto...",
    assistantTitle: "Corion Assistent",
    assistantSubtitle: "Schaden einschätzen · Intelligente Triage · DE/RO",
    online: "Online",
    gdprHint: "AI-Antworten sind orientierend · DSGVO-konform",
    contactPrompt: "Damit ein Mensch dir ein gutes, profitables und realistisches Angebot machen kann, brauche ich noch kurz deine Telefonnummer, WhatsApp oder E-Mail.",
    contactPlaceholder: "Telefon, WhatsApp oder E-Mail",
    contactSubmit: "Anfrage intern anlegen",
    taskCreated: "Perfekt. Ich habe intern eine Preisprüfungs-Aufgabe angelegt. Ein Mensch schaut sich den Fall an und meldet sich mit einer konkreten Einschätzung bei dir.",
    taskCreateError: "Das Anlegen der internen Anfrage hat gerade nicht geklappt. Bitte versuche es gleich nochmal.",
    openAria: "Corion Chat öffnen",
    closeAria: "Chat schließen",
    resetAria: "Gespräch neu starten",
    dialogAria: "Corion Triage Chat",
    uploadedPhotoName: "Schadenfoto.jpg",
    uploadedSuccess: "Erfolgreich hochgeladen",
    triageOptions: [
      { value: "accident", label: "Unfall / Versicherung / Nicht schuld", emoji: "🛡️", icon: ShieldCheck, iconBg: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
      { value: "leasing", label: "Leasing-Rückgabe", emoji: "🏢", icon: Building2, iconBg: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
      { value: "private", label: "Private Reparatur / Kratzer / Delle", emoji: "🔨", icon: Hammer, iconBg: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    ],
    routing: {
      accident: {
        text: "Du hast Anspruch auf einen unabhängigen Gutachter und oft auch auf einen Ersatzwagen. Ich leite dich in den passenden Gutachter-Prozess weiter.",
        ctaLabel: "Gutachter-Fall öffnen",
        ctaHref: "/gutachter-funnel",
        icon: "shield",
      },
      leasing: {
        text: "Bei Leasing-Rückgabe muss die Reparatur fachgerecht und möglichst unsichtbar sein. Dafür leiten wir dich gezielt an passende Partner weiter.",
        ctaLabel: "Leasing-Angebot anfragen",
        ctaHref: "/leistungen/leasingruecklaufer",
        icon: "building",
      },
      private: {
        text: "Für private Schäden schauen wir auf die beste Lösung zwischen Smart Repair, Lack und Aufbereitung, damit es sauber und wirtschaftlich bleibt.",
        ctaLabel: "Smart-Repair-Angebot anfragen",
        ctaHref: "/leistungen/smart-repair",
        icon: "hammer",
      },
    },
  },
  ro: {
    introText: "Bună! Sunt asistentul tău Corion. Trimite o poză cu dauna și îți spun imediat cum o rezolvăm, rapid și corect.",
    photoPrompt: "Atașează o poză clară cu zona afectată. Funcționează și direct de pe telefon.",
    uploadPhoto: "Trimite o poză",
    pickFromGallery: "Alege din galerie",
    triagePrompt: "Am analizat dauna. Pentru a te direcționa corect, alege te rog contextul reparației:",
    analyzing: "Corion AI analizează poza...",
    assistantTitle: "Corion Asistent",
    assistantSubtitle: "Estimare daună · Triaj inteligent · RO/DE",
    online: "Online",
    gdprHint: "Răspunsurile AI sunt orientative · GDPR-conform",
    contactPrompt: "Ca un om să îți poată face o ofertă bună și realistă, mai am nevoie rapid de numărul tău, WhatsApp sau e-mail.",
    contactPlaceholder: "Telefon, WhatsApp sau e-mail",
    contactSubmit: "Creează cererea internă",
    taskCreated: "Perfect. Am creat intern un task pentru ofertare. Un om va analiza cazul și va reveni cu o estimare concretă.",
    taskCreateError: "Crearea cererii interne nu a mers acum. Mai încearcă o dată imediat.",
    openAria: "Deschide chat-ul Corion AI",
    closeAria: "Închide chat-ul",
    resetAria: "Reîncepe conversația",
    dialogAria: "Corion AI Triage Chat",
    uploadedPhotoName: "Poză daună.jpg",
    uploadedSuccess: "Încărcată cu succes",
    triageOptions: [
      { value: "accident", label: "Accident (Asigurare / Nu sunt vinovat)", emoji: "🛡️", icon: ShieldCheck, iconBg: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
      { value: "leasing", label: "Predare Leasing (Leasingrückläufer)", emoji: "🏢", icon: Building2, iconBg: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
      { value: "private", label: "Reparație Privată (Zgârieturi / Îndoituri)", emoji: "🔨", icon: Hammer, iconBg: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    ],
    routing: {
      accident: {
        text: "Ai dreptul la un expert auto independent și, în multe cazuri, la mașină de schimb. Te trimit în fluxul potrivit de gutachter.",
        ctaLabel: "Deschide dosar gutachter",
        ctaHref: "/gutachter-funnel",
        icon: "shield",
      },
      leasing: {
        text: "Pentru leasing, reparația trebuie să fie corectă și cât mai invizibilă. Pentru asta te direcționăm către partenerii potriviți.",
        ctaLabel: "Cere ofertă leasing",
        ctaHref: "/leistungen/leasingruecklaufer",
        icon: "building",
      },
      private: {
        text: "Pentru daune private căutăm soluția cea mai bună între smart repair, vopsitorie și detailing, ca să iasă bine și eficient.",
        ctaLabel: "Cere ofertă smart repair",
        ctaHref: "/leistungen/smart-repair",
        icon: "hammer",
      },
    },
  },
};

function detectLocale(): Locale {
  // The public conversation always starts in German. Replies then follow
  // the language detected from the visitor's current free-form message.
  return "de";
}

let bubbleCounter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now()}-${(bubbleCounter += 1)}`;

export default function SmartTriageChat() {
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [locale] = useState<Locale>(() => detectLocale());
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [dismissedForPage, setDismissedForPage] = useState(false);
  const [contactValue, setContactValue] = useState("");
  const [freeMessage, setFreeMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const copy = COPY[locale];
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && bubbles.length === 0) {
      setBubbles([
        { id: nextId("intro"), kind: "ai-text", text: copy.introText },
        { id: nextId("photo-prompt"), kind: "ai-photo-prompt" },
      ]);
      setPhase("awaiting-photo");
    }
  }, [isOpen, bubbles.length, copy]);

  useEffect(() => {
    if (location !== "/anfrage") return;
    if (isOpen || hasAutoOpened || dismissedForPage) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [location, isOpen, hasAutoOpened, dismissedForPage]);

  useEffect(() => {
    setHasAutoOpened(false);
    setDismissedForPage(false);
  }, [location]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [bubbles, phase]);

  const handlePhotoSelected = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setSelectedPhoto(file);
    setBubbles((prev) => [
      ...prev,
      { id: nextId("user-photo"), kind: "user-photo", name: file.name },
    ]);
    setPhase("analyzing");

    window.setTimeout(() => {
      setBubbles((prev) => [
        ...prev,
        { id: nextId("triage-text"), kind: "ai-text", text: copy.triagePrompt },
        { id: nextId("triage-chips"), kind: "ai-triage-chips" },
      ]);
      setPhase("triage");
    }, 1400);
  };

  const handleChoose = (choice: TriageChoice) => {
    const option = copy.triageOptions.find((o) => o.value === choice)!;
    const route = copy.routing[choice];

    setBubbles((prev) => [
      ...prev.filter((b) => b.kind !== "ai-triage-chips"),
      {
        id: nextId("user-choice"),
        kind: "user-text",
        text: `${option.emoji} ${option.label}`,
      },
    ]);

    window.setTimeout(() => {
      if (choice === "private") {
        setBubbles((prev) => [
          ...prev,
          { id: nextId("contact-request"), kind: "ai-contact-request" },
        ]);
        setPhase("awaiting-contact");
        return;
      }

      setBubbles((prev) => [
        ...prev,
        {
          id: nextId("ai-route"),
          kind: "ai-cta",
          text: route.text,
          ctaLabel: route.ctaLabel,
          ctaHref: route.ctaHref,
          icon: route.icon,
        },
      ]);
      setPhase("routed");
    }, 700);
  };

  const handleReset = () => {
    setBubbles([]);
    setPhase("intro");
    setContactValue("");
    setSelectedPhoto(null);
  };

  const handleCTA = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };

  const handleClose = () => {
    setIsOpen(false);
    setDismissedForPage(true);
  };

  const triggerFilePick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleCreatePrivateEstimateTask = async () => {
    const trimmed = contactValue.trim();
    if (!trimmed) return;

    setBubbles((prev) => [
      ...prev,
      { id: nextId("user-contact"), kind: "user-text", text: trimmed },
    ]);
    setPhase("creating-task");

    try {
      const files = selectedPhoto
        ? [await new Promise<{ name: string; type: string; data: string; size: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(",")[1] || result;
              resolve({
                name: selectedPhoto.name,
                type: selectedPhoto.type || "image/jpeg",
                data: base64,
                size: selectedPhoto.size,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedPhoto);
          })]
        : [];

      const res = await fetch("/api/client/private-estimate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: trimmed,
          preferredContact: trimmed.includes("@") ? "email" : "phone",
          damageDescription: "Private Schaden aus Chat-Intake. Menschliche Preisprüfung gewünscht.",
          files,
        }),
      });

      if (!res.ok) throw new Error("task create failed");

      setBubbles((prev) => [
        ...prev,
        { id: nextId("task-created"), kind: "ai-task-created", text: copy.taskCreated },
      ]);
      setPhase("routed");
      setContactValue("");
    } catch {
      setBubbles((prev) => [
        ...prev,
        { id: nextId("task-create-error"), kind: "ai-text", text: copy.taskCreateError },
      ]);
      setPhase("awaiting-contact");
    }
  };

  const handleFreeMessage = async () => {
    const text = freeMessage.trim();
    if (!text || isReplying) return;

    setFreeMessage("");
    setIsReplying(true);
    setBubbles((prev) => [...prev, { id: nextId("user-message"), kind: "user-text", text }]);

    try {
      const conversationHistory = bubbles
        .filter((bubble): bubble is Extract<Bubble, { kind: "ai-text" | "user-text" }> =>
          bubble.kind === "ai-text" || bubble.kind === "user-text")
        .slice(-6)
        .map((bubble) => ({
          role: bubble.kind === "user-text" ? "user" as const : "assistant" as const,
          content: bubble.text,
        }));
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          agentType: "assistant",
          role: "client",
          conversationHistory,
        }),
      });
      if (!response.ok) throw new Error(`AI response failed (${response.status})`);
      const data = await response.json();
      if (!data?.reply || typeof data.reply !== "string") throw new Error("AI response has no reply");
      setBubbles((prev) => [...prev, { id: nextId("ai-reply"), kind: "ai-text", text: data.reply }]);
    } catch {
      setBubbles((prev) => [...prev, {
        id: nextId("ai-error"),
        kind: "ai-text",
        text: "Entschuldigung, ich kann gerade nicht antworten. Bitte senden Sie Ihre Reparaturanfrage über das Formular oder kontaktieren Sie uns direkt.",
      }]);
    } finally {
      setIsReplying(false);
    }
  };

  const renderBubble = (b: Bubble) => {
    if (b.kind === "ai-text") {
      return (
        <AIBubble key={b.id}>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-white/90">
            {b.text}
          </p>
        </AIBubble>
      );
    }

    if (b.kind === "ai-photo-prompt") {
      return (
        <AIBubble key={b.id}>
          <p className="text-sm text-slate-700 dark:text-white/80 mb-3">
            {copy.photoPrompt}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={triggerFilePick}
              className="bg-primary text-primary-foreground font-bold gap-2 min-h-12"
              data-testid="button-upload-photo"
            >
              <Camera className="w-4 h-4" />
              {copy.uploadPhoto}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={triggerFilePick}
              className="gap-2 min-h-12"
              data-testid="button-pick-from-gallery"
            >
              <ImageIcon className="w-4 h-4" />
              {copy.pickFromGallery}
            </Button>
          </div>
        </AIBubble>
      );
    }

    if (b.kind === "ai-triage-chips") {
      return (
        <AIBubble key={b.id}>
          <div className="flex flex-col gap-2" data-testid="triage-chip-list">
            {copy.triageOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleChoose(opt.value)}
                  className={`
                    group w-full flex items-center gap-3 rounded-md px-3 py-3
                    bg-white dark:bg-white/5
                    border border-slate-200 dark:border-white/10
                    hover-elevate active-elevate-2
                    text-left min-h-14
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    transition-shadow
                  `}
                  data-testid={`chip-triage-${opt.value}`}
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full ${opt.iconBg} ${opt.iconColor} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                      {opt.emoji} {opt.label}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        </AIBubble>
      );
    }

    if (b.kind === "ai-contact-request") {
      return (
        <AIBubble key={b.id}>
          <p className="text-sm text-slate-700 dark:text-white/80 mb-3">
            {copy.contactPrompt}
          </p>
          <div className="flex flex-col gap-2">
            <input
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={copy.contactPlaceholder}
              className="w-full h-11 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm"
            />
            <Button
              type="button"
              onClick={handleCreatePrivateEstimateTask}
              disabled={!contactValue.trim() || phase === "creating-task"}
              className="w-full bg-primary text-primary-foreground font-bold gap-2"
            >
              {phase === "creating-task" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {copy.contactSubmit}
            </Button>
          </div>
        </AIBubble>
      );
    }

    if (b.kind === "ai-task-created") {
      return (
        <AIBubble key={b.id}>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-white/90">
            {b.text}
          </p>
        </AIBubble>
      );
    }

    if (b.kind === "ai-cta") {
      const Icon =
        b.icon === "shield" ? ShieldCheck : b.icon === "building" ? Building2 : Hammer;
      return (
        <AIBubble key={b.id}>
          <div className="flex items-start gap-2 mb-3">
            <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-white/90 pt-1">
              {b.text}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => handleCTA(b.ctaHref)}
            className="w-full bg-primary text-primary-foreground font-bold gap-2 min-h-12"
            data-testid={`button-route-${b.icon}`}
          >
            <Icon className="w-4 h-4" />
            {b.ctaLabel}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </AIBubble>
      );
    }

    if (b.kind === "user-photo") {
      return (
        <UserBubble key={b.id}>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-md bg-white/15 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {b.name || copy.uploadedPhotoName}
              </span>
              <span className="text-[11px] text-white/70">{copy.uploadedSuccess}</span>
            </div>
          </div>
        </UserBubble>
      );
    }

    if (b.kind === "user-text") {
      return (
        <UserBubble key={b.id}>
          <p className="text-sm font-medium text-white">{b.text}</p>
        </UserBubble>
      );
    }

    return null;
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => setIsOpen(true)}
            className="
              fixed bottom-5 right-5 z-50
              w-14 h-14 rounded-full
              bg-primary text-primary-foreground
              shadow-xl shadow-red-900/40
              hover-elevate active-elevate-2
              flex items-center justify-center
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            "
            aria-label={copy.openAria}
            data-testid="button-open-triage-chat"
          >
            <img
              src={chatIconImage}
              alt=""
              className="w-7 h-7 object-contain"
              draggable={false}
            />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212] animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleClose}
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="
                fixed z-50
                inset-x-3 bottom-3 top-16
                sm:inset-x-auto sm:top-auto sm:bottom-5 sm:right-5
                sm:w-[400px] sm:h-[640px] sm:max-h-[85vh]
                bg-white dark:bg-[#0F0F0F]
                rounded-md
                ring-1 ring-slate-200 dark:ring-white/10
                shadow-2xl
                flex flex-col overflow-hidden
              "
              role="dialog"
              aria-label={copy.dialogAria}
              data-testid="panel-triage-chat"
            >
              {/* Header */}
              <div className="relative shrink-0 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#0d0d0d] text-white px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <Avatar className="w-10 h-10 ring-2 ring-primary/40">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-red-700 text-white font-extrabold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">
                      {copy.assistantTitle}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {copy.online}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 truncate">
                    {copy.assistantSubtitle}
                  </p>
                </div>
                {phase === "routed" || bubbles.length > 2 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleReset}
                    className="text-white/80"
                    aria-label={copy.resetAria}
                    data-testid="button-reset-chat"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleClose}
                  className="text-white/80"
                  aria-label={copy.closeAria}
                  data-testid="button-close-triage-chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50 dark:bg-[#121212]"
                data-testid="chat-messages"
              >
                <AnimatePresence initial={false}>
                  {bubbles.map((b) => renderBubble(b))}
                </AnimatePresence>

                {phase === "analyzing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 dark:text-white/60"
                    data-testid="status-analyzing"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {copy.analyzing}
                  </motion.div>
                )}
              </div>

              {/* Free-form customer conversation */}
              <div className="shrink-0 px-3 py-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F]">
                <div className="flex gap-2">
                  <input
                    value={freeMessage}
                    onChange={(event) => setFreeMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleFreeMessage();
                      }
                    }}
                    placeholder="Schreiben Sie Ihre Nachricht …"
                    aria-label="Nachricht an den Corion Assistenten"
                    className="min-w-0 flex-1 h-10 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm"
                    disabled={isReplying}
                    data-testid="input-triage-message"
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => void handleFreeMessage()}
                    disabled={!freeMessage.trim() || isReplying}
                    aria-label="Nachricht senden"
                    data-testid="button-send-triage-message"
                  >
                    {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Footer hint */}
              <div className="shrink-0 px-3 py-2 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F]">
                <p className="text-[10px] text-center text-slate-500 dark:text-white/40 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {copy.gdprHint}
                </p>
              </div>

              {/* Hidden file input — mock */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelected}
                className="hidden"
                data-testid="input-photo-mock"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function AIBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex items-end gap-2"
    >
      <Avatar className="w-7 h-7 shrink-0 mb-1">
        <AvatarFallback className="bg-gradient-to-br from-primary to-red-700 text-white text-[10px] font-extrabold">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[82%] rounded-md rounded-bl-sm bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 px-3 py-2.5 shadow-sm">
        {children}
      </div>
    </motion.div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex justify-end"
    >
      <div className="max-w-[82%] rounded-md rounded-br-sm bg-primary px-3 py-2.5 shadow-sm">
        {children}
      </div>
    </motion.div>
  );
}
