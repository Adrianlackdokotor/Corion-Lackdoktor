import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Infinity as InfinityIcon,
  ArrowDownToLine,
  Send,
  Info,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet as WalletIcon,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Star,
  Bot,
  Wrench,
  Camera,
  Coins,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const TOKEN_BALANCE = 14_500;
const TOKEN_TO_EUR = 0.033; // 1 HUB+1 ≈ 0.033 EUR → 14 500 ≈ 478.50 EUR
const FIAT_BALANCE = TOKEN_BALANCE * TOKEN_TO_EUR;

interface Activity {
  id: string;
  kind: "in" | "out";
  amount: number;
  title: string;
  meta: string;
  icon: typeof Bot;
  when: string;
}

const ACTIVITY: Activity[] = [
  {
    id: "a1",
    kind: "in",
    amount: 50,
    title: "Bonus Calitate: 5 Stele de la Client (BMW)",
    meta: "M3 Touring · München · Comandă #2611",
    icon: Star,
    when: "Acum 12 min",
  },
  {
    id: "a2",
    kind: "out",
    amount: 2,
    title: "Folosire Meister AI (Procedură Vopsire)",
    meta: "Mercedes E-Klasse · Door panel",
    icon: Wrench,
    when: "Acum 38 min",
  },
  {
    id: "a3",
    kind: "in",
    amount: 15,
    title: "Royalties: Alt mecanic a folosit tutorialul tău video.",
    meta: "Tutorial: SMART Repair pe parbriz",
    icon: TrendingUp,
    when: "Acum 1 h",
  },
  {
    id: "a4",
    kind: "out",
    amount: 0.5,
    title: "Folosire Gutachter AI (Scanare Talon)",
    meta: "Audi A4 Avant · WIN scan",
    icon: Camera,
    when: "Acum 2 h",
  },
  {
    id: "a5",
    kind: "in",
    amount: 120,
    title: "Comandă finalizată #2611",
    meta: "VW Golf VIII · Frontschaden",
    icon: CheckCircle2,
    when: "Ieri",
  },
  {
    id: "a6",
    kind: "out",
    amount: 1,
    title: "Folosire Cora AI (Triaj foto-damage)",
    meta: "Porsche Taycan · Stoßstange",
    icon: Bot,
    when: "Ieri",
  },
];

export default function Wallet() {
  const [swapOpen, setSwapOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return ACTIVITY.filter((a) => {
      if (filter !== "all" && a.kind !== filter) return false;
      if (
        query &&
        !`${a.title} ${a.meta}`.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [filter, query]);

  const inSum = ACTIVITY.filter((a) => a.kind === "in").reduce(
    (s, a) => s + a.amount,
    0,
  );
  const outSum = ACTIVITY.filter((a) => a.kind === "out").reduce(
    (s, a) => s + a.amount,
    0,
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="min-h-screen bg-gradient-to-b from-black via-[#0b0b0d] to-black text-white"
        data-testid="page-wallet"
      >
        <Helmet>
          <title>HUB+1 Wallet · Corion Hub</title>
        </Helmet>

        {/* Page chrome */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                <WalletIcon className="w-4 h-4" />
              </span>
              <div className="leading-tight min-w-0">
                <p className="text-sm font-extrabold tracking-tight">
                  HUB<span className="text-[#10F0A8]">+1</span> Wallet
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Corion Token Vault
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-white/15 text-white/70 bg-white/5 text-[10px] tracking-wider"
              data-testid="badge-network"
            >
              <ShieldCheck className="w-3 h-3 mr-1 text-[#10F0A8]" />
              CORION L1 · Mainnet
            </Badge>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
          <BalanceCard
            onConvert={() => setSwapOpen(true)}
            onSend={() => setSendOpen(true)}
          />

          <StatsRow inSum={inSum} outSum={outSum} />

          <ActivityFeed
            items={filtered}
            filter={filter}
            onFilter={setFilter}
            query={query}
            onQuery={setQuery}
          />

          <FooterNote />
        </main>

        <SwapModal open={swapOpen} onClose={() => setSwapOpen(false)} />
        <SendModal open={sendOpen} onClose={() => setSendOpen(false)} />
      </div>
    </TooltipProvider>
  );
}

/* ----------------- Balance hero card ----------------- */

function BalanceCard({
  onConvert,
  onSend,
}: {
  onConvert: () => void;
  onSend: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0e0e10] via-black to-[#0e0e10] p-6 sm:p-10"
      data-testid="card-balance"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#10F0A8]/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[420px] h-[420px] rounded-full bg-[#E53935]/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/55 font-bold">
              Total HUB+1 Tokens
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-white/70 hover-elevate"
                  aria-label="Despre HUB+1"
                  data-testid="button-balance-tooltip"
                >
                  <Info className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs leading-relaxed">
                  HUB+1 este un token utilitar din economia Corion. Evenimentele
                  fiscale (impozite) apar doar la conversia în Fiat (EUR).
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <h1
              className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_28px_rgba(16,240,168,0.45)]"
              data-testid="text-token-balance"
            >
              <CountUp value={TOKEN_BALANCE} />
            </h1>
            <span
              className="inline-flex items-center gap-1 text-3xl sm:text-5xl font-extrabold text-[#10F0A8]"
              data-testid="text-token-symbol"
            >
              <InfinityIcon
                className="w-9 h-9 sm:w-12 sm:h-12 drop-shadow-[0_0_16px_rgba(16,240,168,0.7)]"
                strokeWidth={2}
              />
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-base sm:text-lg text-white/70">
            <span className="font-mono" data-testid="text-fiat-balance">
              ≈ {FIAT_BALANCE.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              EUR
            </span>
            <Badge
              variant="outline"
              className="border-[#10F0A8]/30 text-[#10F0A8] bg-[#10F0A8]/10 text-[10px] tracking-wider"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              +4.2 % vs. săpt. trecută
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
          <Button
            size="lg"
            onClick={onConvert}
            className="h-14 px-6 text-base font-extrabold bg-[#E53935] hover:bg-[#E53935] text-white border-[#b71f1c] shadow-[0_0_28px_rgba(229,57,53,0.45)]"
            data-testid="button-convert-eur"
          >
            <ArrowDownToLine className="w-5 h-5 mr-1" />
            Convert to EUR · Cash Out
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSend}
            className="h-14 px-6 text-base font-extrabold bg-white/5 backdrop-blur border-white/15 text-white hover:bg-white/10"
            data-testid="button-send-tokens"
          >
            <Send className="w-5 h-5 mr-1" />
            Send Tokens
          </Button>
        </div>
      </div>

      {/* mini ledger */}
      <div className="relative mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {[
          { k: "Wallet ID", v: "0xC0R10N…91Ab" },
          { k: "Network", v: "Corion L1" },
          { k: "Avg. APR", v: "11.3 %" },
          { k: "Last sync", v: "Acum 6 sec" },
        ].map((m) => (
          <div
            key={m.k}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/45">
              {m.k}
            </p>
            <p className="font-mono text-sm text-white">{m.v}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ----------------- Animated counter ----------------- */

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    Math.round(v).toLocaleString("de-DE"),
  );
  const [text, setText] = useState("0");
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.6, ease: "easeOut" });
    const unsub = display.on("change", (v) => setText(v));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{text}</span>;
}

/* ----------------- Stats row ----------------- */

function StatsRow({ inSum, outSum }: { inSum: number; outSum: number }) {
  const items = [
    {
      label: "Câștigat (24 h)",
      value: `+${inSum.toLocaleString("de-DE")} HUB`,
      tone: "in" as const,
      icon: ArrowDownLeft,
    },
    {
      label: "Cheltuit (24 h)",
      value: `-${outSum.toLocaleString("de-DE")} HUB`,
      tone: "out" as const,
      icon: ArrowUpRight,
    },
    {
      label: "Reward Tier",
      value: "Diamond +1",
      tone: "neutral" as const,
      icon: Star,
    },
    {
      label: "Royalties active",
      value: "3 tutoriale",
      tone: "neutral" as const,
      icon: Coins,
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        const tint =
          it.tone === "in"
            ? "text-[#10F0A8] bg-[#10F0A8]/10 border-[#10F0A8]/20"
            : it.tone === "out"
            ? "text-[#E53935] bg-[#E53935]/10 border-[#E53935]/20"
            : "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20";
        return (
          <div
            key={it.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            data-testid={`stat-${it.label.toLowerCase().split(" ")[0]}`}
          >
            <span
              className={`inline-flex w-8 h-8 rounded-md items-center justify-center border ${tint}`}
            >
              <Icon className="w-4 h-4" />
            </span>
            <p className="mt-3 text-lg font-extrabold tracking-tight">
              {it.value}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-white/45">
              {it.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------- Activity feed ----------------- */

function ActivityFeed({
  items,
  filter,
  onFilter,
  query,
  onQuery,
}: {
  items: Activity[];
  filter: "all" | "in" | "out";
  onFilter: (f: "all" | "in" | "out") => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  return (
    <section
      className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
      data-testid="section-activity"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-white/10">
        <div>
          <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10F0A8]" />
            AI Spending & Earnings
          </h2>
          <p className="text-xs text-white/50">
            Token-flow în timp real în ecosistemul Corion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Caută activitate…"
              className="pl-7 h-9 w-44 bg-white/5 border-white/10 text-white placeholder:text-white/35"
              data-testid="input-activity-search"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => onFilter(v as any)}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="all" data-testid="tab-all">
                <Filter className="w-3.5 h-3.5 mr-1" />
                Toate
              </TabsTrigger>
              <TabsTrigger value="in" data-testid="tab-in">
                <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                Intrate
              </TabsTrigger>
              <TabsTrigger value="out" data-testid="tab-out">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                Ieșite
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ul className="divide-y divide-white/5">
        <AnimatePresence initial={false}>
          {items.map((a) => {
            const Icon = a.icon;
            const isIn = a.kind === "in";
            return (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-5 py-4 hover-elevate"
                data-testid={`row-activity-${a.id}`}
              >
                <span
                  className={`inline-flex w-10 h-10 rounded-full items-center justify-center border ${
                    isIn
                      ? "bg-[#10F0A8]/10 text-[#10F0A8] border-[#10F0A8]/20"
                      : "bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex w-2 h-2 rounded-full ${
                        isIn ? "bg-[#10F0A8]" : "bg-[#E53935]"
                      }`}
                    />
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                  </div>
                  <p className="text-xs text-white/50 truncate">
                    {a.meta} · {a.when}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-base font-extrabold tabular-nums ${
                      isIn ? "text-[#10F0A8]" : "text-[#E53935]"
                    }`}
                    data-testid={`amount-${a.id}`}
                  >
                    {isIn ? "+" : "-"}
                    {a.amount.toFixed(2)} HUB
                  </p>
                  <p className="text-[11px] text-white/40 font-mono">
                    ≈ {(a.amount * TOKEN_TO_EUR).toFixed(2)} EUR
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-white/45">
            Nicio activitate pentru filtrul curent.
          </li>
        )}
      </ul>
    </section>
  );
}

function FooterNote() {
  return (
    <p className="text-center text-[11px] text-white/40 max-w-2xl mx-auto">
      HUB+1 este un token utilitar emis de Corion GmbH în cadrul ecosistemului
      Corion Hub. Tranzacțiile interne nu sunt impozabile; impozitarea apare la
      conversia în Fiat conform legislației DACH.
    </p>
  );
}

/* ----------------- Swap / cash-out modal ----------------- */

function SwapModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("500");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("500");
      setSubmitting(false);
      setDone(false);
    }
  }, [open]);

  const numAmount = Number(amount) || 0;
  const fiat = numAmount * TOKEN_TO_EUR;
  const taxEstimate = fiat * 0.19; // 19 % DE
  const netto = fiat - taxEstimate;

  const confirm = () => {
    if (numAmount <= 0) {
      toast({
        title: "Sumă invalidă",
        description: "Introdu un număr de tokens mai mare ca 0.",
        variant: "destructive",
      });
      return;
    }
    if (numAmount > TOKEN_BALANCE) {
      toast({
        title: "Fonduri insuficiente",
        description: `Maxim ${TOKEN_BALANCE.toLocaleString("de-DE")} HUB+1 disponibili.`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    // Spec requirement: trigger console.log on confirm
    console.log("[HUB+1 Wallet] Swap confirmed", {
      tokens: numAmount,
      fiatBrutto: fiat,
      taxEstimate,
      fiatNetto: netto,
      currency: "EUR",
      ts: new Date().toISOString(),
    });
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast({
        title: "Transfer inițiat!",
        description: "Banii ajung în contul tău bancar.",
      });
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="modal-swap">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-md bg-[#E53935] text-white flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#E53935] font-bold">
              Cash-Out · HUB+1 → EUR
            </span>
          </div>
          <DialogTitle data-testid="text-swap-title">
            Convertește HUB+1 în EUR
          </DialogTitle>
          <DialogDescription data-testid="text-swap-tax">
            Suma retrasă va fi impozitată conform legii. Corion GmbH îți va emite un Gutschrift oficial.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center space-y-3" data-testid="swap-success">
            <span className="inline-flex w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </span>
            <p className="font-bold">Transfer inițiat!</p>
            <p className="text-sm text-muted-foreground">
              Banii ajung în contul tău bancar în 1–2 zile lucrătoare. Vei primi
              un Gutschrift pe email.
            </p>
            <Button onClick={onClose} className="mt-1" data-testid="button-swap-close-success">
              Închide
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="swap-amount">Sumă (HUB+1)</Label>
              <div className="relative">
                <Input
                  id="swap-amount"
                  type="number"
                  min="0"
                  max={TOKEN_BALANCE}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16 font-mono text-lg"
                  data-testid="input-swap-amount"
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(TOKEN_BALANCE))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-bold text-[#E53935] hover-elevate px-2 h-7 rounded-md"
                  data-testid="button-swap-max"
                >
                  Max
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Disponibil: {TOKEN_BALANCE.toLocaleString("de-DE")} HUB+1
              </p>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brutto</span>
                <span className="font-mono font-semibold">
                  {fiat.toFixed(2)} EUR
                </span>
              </div>
              <div className="flex justify-between text-[#E53935]">
                <span>Estimare impozit (19 %)</span>
                <span className="font-mono font-semibold">
                  -{taxEstimate.toFixed(2)} EUR
                </span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-bold">
                <span>Netto în cont</span>
                <span className="font-mono">{netto.toFixed(2)} EUR</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-swap-cancel"
              >
                Anulează
              </Button>
              <Button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="bg-[#E53935] hover:bg-[#E53935] text-white border-[#b71f1c]"
                data-testid="button-swap-confirm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Se procesează…
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4 mr-1" />
                    Confirm Swap
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ----------------- Send tokens modal (mock) ----------------- */

function SendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (open) {
      setRecipient("");
      setAmount("");
      setMemo("");
    }
  }, [open]);

  const submit = () => {
    if (!recipient.trim() || !amount.trim() || Number(amount) <= 0) {
      toast({
        title: "Date incomplete",
        description: "Introdu destinatarul și o sumă validă.",
        variant: "destructive",
      });
      return;
    }
    console.log("[HUB+1 Wallet] Send initiated", {
      to: recipient,
      amount: Number(amount),
      memo,
      ts: new Date().toISOString(),
    });
    toast({
      title: "Tokens trimiși!",
      description: `${amount} HUB+1 → ${recipient}`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="modal-send">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-md bg-[#10F0A8] text-black flex items-center justify-center">
              <Send className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#10F0A8] font-bold">
              P2P Transfer · HUB+1
            </span>
          </div>
          <DialogTitle>Trimite Tokens</DialogTitle>
          <DialogDescription>
            Transferă HUB+1 către alt partener din ecosistem. Tranzacția este
            instant și nu are taxe interne.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="send-to">Destinatar (handle sau wallet ID)</Label>
            <Input
              id="send-to"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="@meister_hofheim sau 0xC0R10N…"
              data-testid="input-send-to"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="send-amount">Sumă (HUB+1)</Label>
            <Input
              id="send-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="font-mono"
              data-testid="input-send-amount"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="send-memo">Memo (opțional)</Label>
            <Input
              id="send-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Ex: bonus pentru tutorial"
              data-testid="input-send-memo"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="button-send-cancel"
          >
            Anulează
          </Button>
          <Button
            type="button"
            onClick={submit}
            className="bg-[#10F0A8] hover:bg-[#10F0A8] text-black border-[#10F0A8]/60"
            data-testid="button-send-confirm"
          >
            <Send className="w-4 h-4 mr-1" />
            Trimite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
