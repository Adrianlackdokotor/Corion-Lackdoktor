import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins } from "lucide-react";

const STORAGE_KEY = "corion.hubTokens.balance";
const LEDGER_KEY = "corion.hubTokens.ledger";
const LEDGER_MAX = 500;
const SEED_BALANCE = 247.5;
const EVENT_NAME = "corion:hub-tokens-deduct";

interface DeductDetail {
  amount: number;
  reason?: string;
}

interface LedgerEntry {
  ts: number;
  amount: number;
  reason?: string;
}

function readLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLedger(entry: LedgerEntry) {
  if (typeof window === "undefined") return;
  try {
    const merged = [...readLedger(), entry];
    // Truncation strategy: never drop entries from the current month so that
    // `spentMonth` stays accurate. We only trim entries older than the current
    // month, and keep the most recent ones up to LEDGER_MAX in total.
    const monthStart = startOfMonthMs();
    const currentMonth = merged.filter((e) => e.ts >= monthStart);
    const older = merged.filter((e) => e.ts < monthStart);
    const olderRoom = Math.max(0, LEDGER_MAX - currentMonth.length);
    const trimmedOlder = older.slice(-olderRoom);
    const next = [...trimmedOlder, ...currentMonth];
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("corion:hub-tokens-ledger-update"));
  } catch {
    /* ignore quota errors */
  }
}

function spentSince(ledger: LedgerEntry[], sinceMs: number): number {
  return ledger
    .filter((e) => e.ts >= sinceMs)
    .reduce((sum, e) => sum + e.amount, 0);
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonthMs(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Imperatively trigger a Hub+1 token deduction with floating animation.
 * This is a frontend-only mock so it doesn't touch the real `userTokens` ledger.
 */
export function deductHubTokens(amount: number, reason?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<DeductDetail>(EVENT_NAME, {
      detail: { amount, reason },
    }),
  );
}

interface FloatingDeduction {
  id: number;
  amount: number;
}

function safeReadBalance(): number {
  if (typeof window === "undefined") return SEED_BALANCE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = parseFloat(stored);
      if (!Number.isNaN(n)) return n;
    }
    window.localStorage.setItem(STORAGE_KEY, SEED_BALANCE.toFixed(2));
  } catch {
    /* localStorage may throw in private mode / over quota — fall through */
  }
  return SEED_BALANCE;
}

export default function HubTokensCounter() {
  const [balance, setBalance] = useState<number>(safeReadBalance);
  const [ledger, setLedger] = useState<LedgerEntry[]>(readLedger);
  const [floats, setFloats] = useState<FloatingDeduction[]>([]);
  const idCounter = useRef(0);
  const mountedRef = useRef(true);
  const timeoutsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    const handler = (evt: Event) => {
      if (!mountedRef.current) return;
      const e = evt as CustomEvent<DeductDetail>;
      const amount = Number(e.detail?.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;
      idCounter.current += 1;
      const id = idCounter.current;
      setFloats((prev) => [...prev, { id, amount }]);
      setBalance((prev) => {
        const next = Math.max(0, +(prev - amount).toFixed(2));
        try {
          window.localStorage.setItem(STORAGE_KEY, next.toFixed(2));
        } catch {
          /* ignore quota / privacy errors */
        }
        return next;
      });
      appendLedger({ ts: Date.now(), amount, reason: e.detail?.reason });
      const timerId = window.setTimeout(() => {
        timeoutsRef.current.delete(timerId);
        if (!mountedRef.current) return;
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 1400);
      timeoutsRef.current.add(timerId);
    };
    const ledgerHandler = () => {
      if (!mountedRef.current) return;
      setLedger(readLedger());
    };
    window.addEventListener(EVENT_NAME, handler as EventListener);
    window.addEventListener("corion:hub-tokens-ledger-update", ledgerHandler);
    window.addEventListener("storage", ledgerHandler);
    return () => {
      mountedRef.current = false;
      window.removeEventListener(EVENT_NAME, handler as EventListener);
      window.removeEventListener("corion:hub-tokens-ledger-update", ledgerHandler);
      window.removeEventListener("storage", ledgerHandler);
      // Clear any in-flight float-fade timers so they cannot fire post-unmount.
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current.clear();
    };
  }, []);

  const { spentToday, spentMonth } = useMemo(() => {
    const today = startOfTodayMs();
    const month = startOfMonthMs();
    return {
      spentToday: spentSince(ledger, today),
      spentMonth: spentSince(ledger, month),
    };
  }, [ledger]);

  const tooltip = `Astăzi: -${spentToday.toFixed(2)} TKN · Luna: -${spentMonth.toFixed(2)} TKN`;

  return (
    <div
      className="relative flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 hover-elevate"
      data-testid="counter-hub-tokens"
      aria-label={`Hub+1 Token-Saldo: ${balance.toFixed(2)} Tokens. ${tooltip}`}
      title={tooltip}
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
        <Coins className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex items-baseline gap-1 leading-none">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
          aria-hidden
        >
          HUB+1
        </span>
        <motion.span
          key={balance}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="text-sm font-bold tabular-nums text-white"
          data-testid="text-hub-tokens-balance"
        >
          {balance.toFixed(2)}
        </motion.span>
        <span className="text-[10px] font-semibold text-zinc-500" aria-hidden>
          TKN
        </span>
      </div>
      <div className="hidden sm:flex flex-col leading-tight pl-2 ml-1 border-l border-zinc-800">
        <span
          className="text-[9px] tabular-nums text-zinc-500"
          data-testid="text-hub-tokens-spent-today"
        >
          24h <span className="text-red-400 font-semibold">-{spentToday.toFixed(2)}</span>
        </span>
        <span
          className="text-[9px] tabular-nums text-zinc-500"
          data-testid="text-hub-tokens-spent-month"
        >
          Mo. <span className="text-red-400 font-semibold">-{spentMonth.toFixed(2)}</span>
        </span>
      </div>

      <AnimatePresence>
        {floats.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -22 }}
            exit={{ opacity: 0, y: -34 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute right-2 top-0 text-[11px] font-bold text-red-400 pointer-events-none select-none"
            data-testid="text-token-deduction"
          >
            -{f.amount.toFixed(2)} TKN
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
