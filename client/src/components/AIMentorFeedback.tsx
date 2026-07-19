import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Calculator,
  Wrench,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type AIMentorAgent = "contabil" | "meister" | "master";

export interface AIMentorAction {
  label: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

export interface AIMentorNotice {
  id: string;
  agent: AIMentorAgent;
  message: ReactNode;
  durationMs?: number;
  actions?: AIMentorAction[];
}

interface AgentTheme {
  name: string;
  icon: LucideIcon;
  badge: string;
  gradient: string;
  glowRing: string;
  glowShadow: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  primaryButton: string;
}

const AGENT_THEMES: Record<AIMentorAgent, AgentTheme> = {
  contabil: {
    name: "Contabil AI 📊",
    icon: Calculator,
    badge: "FINANCE",
    gradient: "from-emerald-500 to-emerald-700",
    glowRing: "ring-emerald-400/40",
    glowShadow: "shadow-[0_0_28px_-4px_rgba(16,185,129,0.55)]",
    accentText: "text-emerald-700 dark:text-emerald-400",
    accentBg: "bg-emerald-50 dark:bg-emerald-950/40",
    accentBorder: "border-emerald-200 dark:border-emerald-800",
    primaryButton: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  meister: {
    name: "Meister AI 🛠️",
    icon: Wrench,
    badge: "WORKSHOP",
    gradient: "from-orange-500 to-red-600",
    glowRing: "ring-orange-400/40",
    glowShadow: "shadow-[0_0_28px_-4px_rgba(249,115,22,0.6)]",
    accentText: "text-orange-700 dark:text-orange-400",
    accentBg: "bg-orange-50 dark:bg-orange-950/40",
    accentBorder: "border-orange-200 dark:border-orange-800",
    primaryButton: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  master: {
    name: "Master AI 📈",
    icon: TrendingUp,
    badge: "STRATEGY",
    gradient: "from-indigo-500 via-violet-600 to-blue-700",
    glowRing: "ring-violet-400/40",
    glowShadow: "shadow-[0_0_28px_-4px_rgba(139,92,246,0.6)]",
    accentText: "text-violet-700 dark:text-violet-400",
    accentBg: "bg-violet-50 dark:bg-violet-950/40",
    accentBorder: "border-violet-200 dark:border-violet-800",
    primaryButton: "bg-violet-600 hover:bg-violet-700 text-white",
  },
};

// ---------- Singleton subscribable store ----------

type Listener = (notices: AIMentorNotice[]) => void;

const store = {
  notices: [] as AIMentorNotice[],
  listeners: new Set<Listener>(),
};

function emit() {
  const snapshot = store.notices;
  store.listeners.forEach((l) => l(snapshot));
}

function subscribe(listener: Listener): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

function getSnapshot(): AIMentorNotice[] {
  return store.notices;
}

function getServerSnapshot(): AIMentorNotice[] {
  return [];
}

function pushNotice(notice: AIMentorNotice) {
  store.notices = [...store.notices, notice].slice(-4);
  emit();
}

function dismissNotice(id: string) {
  store.notices = store.notices.filter((n) => n.id !== id);
  emit();
}

// ---------- Public API ----------

export function notifyMentor(opts: {
  agent: AIMentorAgent;
  message: ReactNode;
  durationMs?: number;
  actions?: AIMentorAction[];
}): string {
  const id = `mentor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pushNotice({
    id,
    agent: opts.agent,
    message: opts.message,
    durationMs: opts.durationMs ?? 9000,
    actions: opts.actions,
  });
  return id;
}

export const notifyContabil = (
  message: ReactNode,
  opts?: Omit<Parameters<typeof notifyMentor>[0], "agent" | "message">,
) => notifyMentor({ agent: "contabil", message, ...opts });

export const notifyMeister = (
  message: ReactNode,
  opts?: Omit<Parameters<typeof notifyMentor>[0], "agent" | "message">,
) => notifyMentor({ agent: "meister", message, ...opts });

export const notifyMaster = (
  message: ReactNode,
  opts?: Omit<Parameters<typeof notifyMentor>[0], "agent" | "message">,
) => notifyMentor({ agent: "master", message, ...opts });

export function dismissMentorNotice(id: string) {
  dismissNotice(id);
}

// ---------- Single notification card ----------

function NoticeCard({ notice }: { notice: AIMentorNotice }) {
  const theme = AGENT_THEMES[notice.agent];
  const Icon = theme.icon;
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const elapsedBeforePause = useRef<number>(0);
  const total = notice.durationMs ?? 9000;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      if (!paused) {
        const elapsed = elapsedBeforePause.current + (Date.now() - startedAt.current);
        const remaining = Math.max(0, total - elapsed);
        const pct = Math.max(0, (remaining / total) * 100);
        setProgress(pct);
        if (remaining <= 0) {
          dismissNotice(notice.id);
          return;
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [paused, total, notice.id]);

  const handleMouseEnter = () => {
    if (paused) return;
    elapsedBeforePause.current += Date.now() - startedAt.current;
    setPaused(true);
  };
  const handleMouseLeave = () => {
    if (!paused) return;
    startedAt.current = Date.now();
    setPaused(false);
  };

  const handleAction = (a: AIMentorAction) => {
    a.onClick?.();
    dismissNotice(notice.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)]
        bg-white dark:bg-zinc-900
        border border-slate-200 dark:border-zinc-800
        rounded-2xl overflow-hidden
        ring-1 ${theme.glowRing} ${theme.glowShadow}
      `}
      data-testid={`mentor-notice-${notice.agent}`}
      role="status"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-md`}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center`}
            >
              <Icon className={`w-2.5 h-2.5 ${theme.accentText}`} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`text-sm font-bold ${theme.accentText} truncate`}
                data-testid={`mentor-name-${notice.agent}`}
              >
                {theme.name}
              </p>
              <span
                className={`text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded ${theme.accentBg} ${theme.accentText}`}
              >
                {theme.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              AI Mentor · just now
            </p>
          </div>

          <button
            type="button"
            onClick={() => dismissNotice(notice.id)}
            className="shrink-0 -mr-1 -mt-1 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover-elevate"
            aria-label="Închide"
            data-testid={`mentor-dismiss-${notice.agent}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-zinc-100 whitespace-pre-line">
          {notice.message}
        </div>

        {notice.actions && notice.actions.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {notice.actions.map((a, i) => (
              <Button
                key={i}
                size="sm"
                onClick={() => handleAction(a)}
                className={
                  a.variant === "secondary"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-100"
                    : theme.primaryButton
                }
                data-testid={`mentor-action-${notice.agent}-${i}`}
              >
                {a.variant !== "secondary" && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="h-1 w-full bg-slate-100 dark:bg-zinc-800">
        <div
          className={`h-full bg-gradient-to-r ${theme.gradient} transition-[width] duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// ---------- Toaster (mount once at app root) ----------

export function AIMentorToaster() {
  const notices = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      className="
        pointer-events-none fixed z-[9999]
        bottom-4 right-4
        flex flex-col items-end gap-3
        max-w-full
      "
      data-testid="mentor-toaster"
    >
      <AnimatePresence initial={false}>
        {notices.map((n) => (
          <NoticeCard key={n.id} notice={n} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------- Hidden dev panel for visual QA ----------

const SCENARIOS: Array<{
  label: string;
  agent: AIMentorAgent;
  testId: string;
  fire: () => void;
}> = [
  {
    label: "1 · Contabil — Factură",
    agent: "contabil",
    testId: "mentor-demo-contabil",
    fire: () =>
      notifyContabil(
        "Excelent! Ai încărcat factura de materiale. Tocmai ai dedus 19€ la MwSt și ai optimizat baza de impozitare pentru acest trimestru. Cashflow-ul tău e în siguranță! 💸",
        { durationMs: 11000 },
      ),
  },
  {
    label: "2 · Meister — Job done",
    agent: "meister",
    testId: "mentor-demo-meister",
    fire: () =>
      notifyMeister(
        "Lucrare excepțională pe acel BMW! Ai finalizat cu 15 minute mai repede decât estimarea. Experiența ta adaugă valoare rețelei noastre. Ai primit +25 HUB Tokens! 🏆",
        { durationMs: 11000 },
      ),
  },
  {
    label: "3 · Master — Strategie",
    agent: "master",
    testId: "mentor-demo-master",
    fire: () =>
      notifyMaster(
        "Profitul brut a crescut cu 12% luna aceasta la filiala Wallau. Recomand alocarea a 100€ în campania de Google Ads pentru a dubla rezultatul. Apeși Aprobă? 📈",
        {
          durationMs: 14000,
          actions: [
            {
              label: "Aprobă 100€ Google Ads",
              onClick: () =>
                notifyContabil(
                  "Bugetul de 100€ a fost rezervat pentru campania Google Ads. Te țin la curent cu rezultatele săptămânal.",
                  { durationMs: 8000 },
                ),
            },
            { label: "Mai târziu", variant: "secondary" },
          ],
        },
      ),
  },
];

export function AIMentorDevPanel() {
  const [open, setOpen] = useState(false);

  // Strict compile-time guard: this panel and its handlers must NEVER ship
  // to a production bundle. Vite's `import.meta.env.DEV` is statically
  // replaced at build time, so this entire component tree is dead-code-
  // eliminated in `vite build`.
  if (!import.meta.env.DEV) return null;

  return (
    <div
      className="fixed z-[9998] bottom-4 left-4 flex flex-col items-start gap-2"
      data-testid="mentor-dev-panel"
    >
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 flex flex-col gap-1.5 min-w-[220px]"
        >
          <p className="text-[10px] font-semibold tracking-wider text-slate-500 px-2 pt-1">
            AI MENTOR · DEMO SCENARIOS
          </p>
          {SCENARIOS.map((s) => (
            <Button
              key={s.testId}
              size="sm"
              variant="ghost"
              onClick={s.fire}
              className="justify-start text-xs"
              data-testid={s.testId}
            >
              <Bot className="w-3.5 h-3.5 mr-2" />
              {s.label}
            </Button>
          ))}
        </motion.div>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-slate-300 dark:border-zinc-700 shadow-md"
        data-testid="mentor-demo-toggle"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        AI Mentor Demo
      </Button>
    </div>
  );
}
