import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageCircle,
  Camera,
  Wallet,
  User,
  Heart,
  Star,
  Send,
  Upload,
  X,
  Check,
  Trophy,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "";

type Tab = "feed" | "messages" | "upload" | "wallet" | "profile";

interface FeedJob {
  id: string;
  car: string;
  plate: string;
  task: string;
  damage: string;
  payoutEur: number;
  imageUrl: string;
  client: string;
  postedAgo: string;
  status: "open" | "done";
}

interface ChatThread {
  id: string;
  with: string;
  role: "Manager" | "Client";
  lastMessage: string;
  unread: number;
  avatarSeed: string;
  messages: { from: "me" | "them"; text: string; time: string }[];
}

interface CompletedJob {
  id: string;
  car: string;
  plate: string;
  date: string;
  payoutEur: number;
}

interface Review {
  id: string;
  client: string;
  stars: number;
  text: string;
  date: string;
}

const MOCK_FEED: FeedJob[] = [
  {
    id: "J-2031",
    car: "BMW 3er Touring",
    plate: "MTK-AB 123",
    task: "Lackieren + Beilackieren",
    damage: "Heckklappe + Stoßstange links",
    payoutEur: 420,
    imageUrl:
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=900&q=70&auto=format&fit=crop",
    client: "Andreas Meier",
    postedAgo: "vor 12 Min",
    status: "open",
  },
  {
    id: "J-2032",
    car: "Audi A4 Avant",
    plate: "F-XY 789",
    task: "Delle entfernen",
    damage: "Tür hinten rechts",
    payoutEur: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=900&q=70&auto=format&fit=crop",
    client: "Sabine Klein",
    postedAgo: "vor 1 Std",
    status: "open",
  },
  {
    id: "J-2033",
    car: "Mercedes C-Klasse",
    plate: "WI-LD 456",
    task: "Inst+Lack Kotflügel",
    damage: "Front links — Parkrempler",
    payoutEur: 540,
    imageUrl:
      "https://images.unsplash.com/photo-1519440042763-ba7d502aedea?w=900&q=70&auto=format&fit=crop",
    client: "Markus Hofmann",
    postedAgo: "vor 3 Std",
    status: "open",
  },
];

const MOCK_THREADS: ChatThread[] = [
  {
    id: "T-1",
    with: "Manager Adrian",
    role: "Manager",
    lastMessage: "Sehr gut! Foto vom A4 schon hochgeladen?",
    unread: 2,
    avatarSeed: "AD",
    messages: [
      { from: "them", text: "Hi Adil — Auftrag J-2031 ist dir zugewiesen.", time: "09:12" },
      { from: "me", text: "Alles klar, fange gleich an.", time: "09:14" },
      { from: "them", text: "Sehr gut! Foto vom A4 schon hochgeladen?", time: "11:02" },
    ],
  },
  {
    id: "T-2",
    with: "Andreas Meier",
    role: "Client",
    lastMessage: "Wann kann ich das Auto abholen?",
    unread: 1,
    avatarSeed: "AM",
    messages: [
      { from: "them", text: "Wann kann ich das Auto abholen?", time: "10:45" },
    ],
  },
  {
    id: "T-3",
    with: "Sabine Klein",
    role: "Client",
    lastMessage: "Vielen Dank!",
    unread: 0,
    avatarSeed: "SK",
    messages: [
      { from: "me", text: "Delle ist raus, sieht aus wie neu.", time: "Gestern" },
      { from: "them", text: "Vielen Dank!", time: "Gestern" },
    ],
  },
];

const MOCK_COMPLETED: CompletedJob[] = [
  { id: "J-2028", car: "VW Golf", plate: "F-AB 1010", date: "30.04.2026", payoutEur: 320 },
  { id: "J-2027", car: "BMW X3", plate: "MTK-CD 222", date: "29.04.2026", payoutEur: 580 },
  { id: "J-2026", car: "Skoda Octavia", plate: "WI-EF 333", date: "28.04.2026", payoutEur: 240 },
  { id: "J-2025", car: "Audi Q5", plate: "F-GH 444", date: "27.04.2026", payoutEur: 690 },
  { id: "J-2024", car: "Mercedes E", plate: "MTK-IJ 555", date: "26.04.2026", payoutEur: 410 },
];

const MOCK_REVIEWS: Review[] = [
  { id: "R-1", client: "Andreas M.", stars: 5, text: "Top Arbeit, schnell und präzise!", date: "vor 3 Tagen" },
  { id: "R-2", client: "Sabine K.", stars: 5, text: "Delle komplett weg. Sehr empfehlenswert.", date: "vor 1 Woche" },
  { id: "R-3", client: "Markus H.", stars: 4, text: "Gute Qualität, etwas später als geplant.", date: "vor 2 Wochen" },
];

function fmtEur(eur: number): string {
  return (
    eur.toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " €"
  );
}

async function postPartnerAction(
  action: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/partner-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data, ts: Date.now() }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export default function PartnerHub() {
  const [tab, setTab] = useState<Tab>("feed");
  const [feed, setFeed] = useState<FeedJob[]>(MOCK_FEED);
  const [completed, setCompleted] = useState<CompletedJob[]>(MOCK_COMPLETED);
  const [signatureFor, setSignatureFor] = useState<FeedJob | null>(null);

  const onJobDone = (job: FeedJob) => {
    setSignatureFor(job);
  };

  const onSignatureSaved = async (job: FeedJob, signatureDataUrl: string) => {
    setSignatureFor(null);
    setFeed((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: "done" } : j)),
    );
    setCompleted((prev) => [
      {
        id: job.id,
        car: job.car,
        plate: job.plate,
        date: new Date().toLocaleDateString("de-DE"),
        payoutEur: job.payoutEur,
      },
      ...prev,
    ]);
    void postPartnerAction("complete_job", {
      jobId: job.id,
      payoutEur: job.payoutEur,
      signatureLength: signatureDataUrl.length,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "feed" && <FeedView feed={feed} onJobDone={onJobDone} />}
            {tab === "messages" && <MessagesView />}
            {tab === "upload" && <UploadView />}
            {tab === "wallet" && <WalletView completed={completed} />}
            {tab === "profile" && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Signature modal */}
      <SignatureModal
        job={signatureFor}
        onClose={() => setSignatureFor(null)}
        onSave={onSignatureSaved}
      />

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur border-t border-zinc-900"
        data-testid="nav-bottom"
      >
        <div className="max-w-xl mx-auto grid grid-cols-5">
          <NavBtn
            id="feed"
            icon={<Home className="w-6 h-6" />}
            label="Feed"
            active={tab === "feed"}
            onClick={() => setTab("feed")}
          />
          <NavBtn
            id="messages"
            icon={<MessageCircle className="w-6 h-6" />}
            label="Chat"
            active={tab === "messages"}
            onClick={() => setTab("messages")}
            badge={MOCK_THREADS.reduce((s, t) => s + t.unread, 0)}
          />
          <NavBtn
            id="upload"
            icon={<Camera className="w-6 h-6" />}
            label="Upload"
            active={tab === "upload"}
            onClick={() => setTab("upload")}
          />
          <NavBtn
            id="wallet"
            icon={<Wallet className="w-6 h-6" />}
            label="Wallet"
            active={tab === "wallet"}
            onClick={() => setTab("wallet")}
          />
          <NavBtn
            id="profile"
            icon={<User className="w-6 h-6" />}
            label="Profil"
            active={tab === "profile"}
            onClick={() => setTab("profile")}
          />
        </div>
      </nav>
    </div>
  );
}

function NavBtn({
  id,
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
        active ? "text-red-500" : "text-zinc-500 hover:text-zinc-300"
      }`}
      data-testid={`nav-${id}`}
      aria-current={active ? "page" : undefined}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-full"
        />
      )}
    </button>
  );
}

/* ---------------- FEED ---------------- */

function FeedView({
  feed,
  onJobDone,
}: {
  feed: FeedJob[];
  onJobDone: (job: FeedJob) => void;
}) {
  return (
    <div data-testid="view-feed">
      <Header title="Feed" subtitle="Deine offenen Aufträge" />
      <div className="px-3 space-y-4">
        {feed.filter((j) => j.status === "open").length === 0 && (
          <div
            className="rounded-md border border-dashed border-zinc-800 px-4 py-12 text-center text-sm text-zinc-500"
            data-testid="state-feed-empty"
          >
            Alle Aufträge erledigt — gute Arbeit!
          </div>
        )}
        {feed
          .filter((j) => j.status === "open")
          .map((job) => (
            <FeedCard key={job.id} job={job} onJobDone={onJobDone} />
          ))}
      </div>
    </div>
  );
}

function FeedCard({
  job,
  onJobDone,
}: {
  job: FeedJob;
  onJobDone: (job: FeedJob) => void;
}) {
  const [hearts, setHearts] = useState<number[]>([]);
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  const handleImageTap = () => {
    const now = Date.now();
    const id = now;
    if (now - lastTapRef.current < 350) {
      // double tap → cancel pending single-tap toast, then trigger done flow
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      setHearts((prev) => [...prev, id]);
      window.setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h !== id));
      }, 900);
      onJobDone(job);
      lastTapRef.current = 0;
    } else {
      // single tap → small heart pop, no completion (toast scheduled, cancellable)
      setHearts((prev) => [...prev, id]);
      singleTapTimerRef.current = window.setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h !== id));
        toast({
          title: "Doppel-Tippen zum Abschließen",
          description: "Tippe zweimal schnell, um den Auftrag zu erledigen.",
        });
        singleTapTimerRef.current = null;
      }, 600);
      lastTapRef.current = now;
    }
  };

  const handleImageKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onJobDone(job);
    }
  };

  return (
    <article
      className="bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden"
      data-testid={`feed-card-${job.id}`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-red-600/20 text-red-400 text-xs font-bold">
            {job.client
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{job.client}</div>
          <div className="text-[11px] text-zinc-500">
            {job.plate} · {job.postedAgo}
          </div>
        </div>
        <span className="text-xs font-bold text-red-400 tabular-nums">
          {fmtEur(job.payoutEur)}
        </span>
      </div>

      {/* Image with double-tap */}
      <div
        className="relative w-full aspect-square bg-zinc-900 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        onClick={handleImageTap}
        onKeyDown={handleImageKey}
        role="button"
        tabIndex={0}
        aria-label={`Auftrag ${job.car} ${job.plate} — doppelt tippen zum Abschließen`}
        data-testid={`feed-image-${job.id}`}
      >
        <img
          src={job.imageUrl}
          alt={job.task}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-3 right-3 pointer-events-none">
          <div className="text-base font-bold drop-shadow">{job.car}</div>
          <div className="text-xs text-zinc-200 drop-shadow">{job.damage}</div>
        </div>
        {/* Heart pops */}
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.div
              key={h}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart
                className="w-28 h-28 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                fill="currentColor"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Task + actions */}
      <div className="p-3 space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">
            Task
          </div>
          <div className="text-sm font-semibold">{job.task}</div>
        </div>

        <div className="text-[11px] text-zinc-500 text-center">
          💡 Doppel-Tippen auf Foto = Auftrag abschließen
        </div>

        <Button
          size="lg"
          onClick={() => onJobDone(job)}
          className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-base font-bold shadow-lg shadow-red-900/40"
          data-testid={`button-done-${job.id}`}
        >
          <Check className="w-5 h-5 mr-2" />
          JOB DONE
        </Button>
      </div>
    </article>
  );
}

/* ---------------- MESSAGES ---------------- */

function MessagesView() {
  const [active, setActive] = useState<ChatThread | null>(null);
  const [draft, setDraft] = useState("");
  const { toast } = useToast();

  if (active) {
    return (
      <div data-testid="view-chat-thread">
        <Header
          title={active.with}
          subtitle={active.role}
          onBack={() => setActive(null)}
        />
        <div className="px-3 pb-3 space-y-2">
          {active.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "me"
                    ? "bg-red-600 text-white rounded-br-sm"
                    : "bg-zinc-900 text-zinc-100 rounded-bl-sm"
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    m.from === "me" ? "text-red-200" : "text-zinc-500"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="fixed bottom-16 left-0 right-0 bg-black border-t border-zinc-900 p-2">
          <div className="max-w-xl mx-auto flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nachricht…"
              className="bg-zinc-900 border-zinc-800 text-white"
              data-testid="input-chat-draft"
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  void postPartnerAction("send_message", {
                    threadId: active.id,
                    to: active.with,
                    text: draft.trim(),
                  });
                  toast({
                    title: "Nachricht gesendet",
                    description: `An ${active.with}`,
                  });
                  setDraft("");
                }
              }}
            />
            <Button
              size="icon"
              disabled={!draft.trim()}
              onClick={() => {
                if (!draft.trim()) return;
                void postPartnerAction("send_message", {
                  threadId: active.id,
                  to: active.with,
                  text: draft.trim(),
                });
                toast({
                  title: "Nachricht gesendet",
                  description: `An ${active.with}`,
                });
                setDraft("");
              }}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-send-message"
              aria-label="Senden"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="view-messages">
      <Header title="Chat" subtitle="Manager · Kunden" />
      <div className="px-3 space-y-2">
        {MOCK_THREADS.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setActive(t)}
            className="w-full flex items-center gap-3 bg-zinc-950 border border-zinc-900 rounded-lg p-3 text-left hover-elevate active-elevate-2"
            data-testid={`thread-${t.id}`}
          >
            <Avatar className="w-12 h-12">
              <AvatarFallback
                className={`text-sm font-bold ${
                  t.role === "Manager"
                    ? "bg-red-600/20 text-red-400"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {t.avatarSeed}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">
                  {t.with}
                </span>
                <span className="text-[10px] text-zinc-500">{t.role}</span>
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {t.lastMessage}
              </div>
            </div>
            {t.unread > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                {t.unread}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- UPLOAD ---------------- */

function UploadView() {
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const beforeRef = useRef<HTMLInputElement | null>(null);
  const afterRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Track all live object URLs so we can revoke them on replace / clear / unmount
  // and avoid blob: URL memory leaks.
  const beforeUrlRef = useRef<string | null>(null);
  const afterUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (beforeUrlRef.current) URL.revokeObjectURL(beforeUrlRef.current);
      if (afterUrlRef.current) URL.revokeObjectURL(afterUrlRef.current);
    };
  }, []);

  const setSlot = (
    set: (v: string | null) => void,
    urlRef: React.MutableRefObject<string | null>,
    next: string | null,
  ) => {
    if (urlRef.current && urlRef.current !== next) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = next;
    set(next);
  };

  const onPick = (
    e: React.ChangeEvent<HTMLInputElement>,
    set: (v: string | null) => void,
    urlRef: React.MutableRefObject<string | null>,
    label: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSlot(set, urlRef, url);
      void postPartnerAction("upload_photo", {
        kind: label,
        filename: file.name,
        size: file.size,
      });
      toast({ title: `${label} hochgeladen`, description: file.name });
    }
    e.target.value = "";
  };

  return (
    <div data-testid="view-upload">
      <Header title="Upload" subtitle="Vorher / Nachher Foto" />
      <div className="px-3 space-y-4">
        <UploadSlot
          label="Vorher"
          src={before}
          onPick={() => beforeRef.current?.click()}
          onClear={() => setSlot(setBefore, beforeUrlRef, null)}
          testId="upload-before"
        />
        <UploadSlot
          label="Nachher"
          src={after}
          onPick={() => afterRef.current?.click()}
          onClear={() => setSlot(setAfter, afterUrlRef, null)}
          testId="upload-after"
        />

        <input
          ref={beforeRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e, setBefore, beforeUrlRef, "Vorher")}
          data-testid="input-file-before"
        />
        <input
          ref={afterRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e, setAfter, afterUrlRef, "Nachher")}
          data-testid="input-file-after"
        />

        {before && after && (
          <Button
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 text-white text-base font-bold"
            onClick={() => {
              void postPartnerAction("submit_before_after", {
                hasBefore: true,
                hasAfter: true,
              });
              toast({
                title: "Vorher/Nachher gesendet",
                description: "Beide Fotos eingereicht.",
              });
            }}
            data-testid="button-submit-photos"
          >
            <Upload className="w-5 h-5 mr-2" />
            EINREICHEN
          </Button>
        )}
      </div>
    </div>
  );
}

function UploadSlot({
  label,
  src,
  onPick,
  onClear,
  testId,
}: {
  label: string;
  src: string | null;
  onPick: () => void;
  onClear: () => void;
  testId: string;
}) {
  return (
    <div
      className="rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-950 overflow-hidden"
      data-testid={`slot-${testId}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        {src && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onClear}
            className="text-zinc-400 hover:text-red-400"
            data-testid={`button-clear-${testId}`}
            aria-label="Foto entfernen"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {src ? (
        <button
          type="button"
          onClick={onPick}
          className="block w-full"
          data-testid={`button-replace-${testId}`}
        >
          <img
            src={src}
            alt={label}
            className="w-full aspect-square object-cover"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className="w-full aspect-square flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          data-testid={`button-pick-${testId}`}
        >
          <Camera className="w-10 h-10" />
          <span className="text-sm">Foto aufnehmen</span>
        </button>
      )}
    </div>
  );
}

/* ---------------- WALLET ---------------- */

function WalletView({ completed }: { completed: CompletedJob[] }) {
  const month = completed.reduce((s, j) => s + j.payoutEur, 0);
  return (
    <div data-testid="view-wallet">
      <Header title="Wallet" subtitle="Verdienst & Auszahlungen" />
      <div className="px-3 space-y-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-700 via-red-600 to-red-500 p-5 shadow-xl">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_right,white,transparent_60%)]" />
          <div className="relative">
            <div className="text-xs uppercase tracking-wider text-red-100/80 font-semibold">
              Total Earned · Mai 2026
            </div>
            <div
              className="text-5xl font-black tabular-nums mt-1"
              data-testid="text-month-total"
            >
              {fmtEur(month)}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-red-100">
              <TrendingUp className="w-4 h-4" />
              +18 % vs. letzter Monat
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
            Letzte Auszahlungen
          </div>
          {completed.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 rounded-lg p-3"
              data-testid={`wallet-row-${j.id}`}
            >
              <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{j.car}</div>
                <div className="text-[11px] text-zinc-500">
                  {j.plate} · {j.date}
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums text-green-400">
                +{fmtEur(j.payoutEur)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- PROFILE ---------------- */

function ProfileView() {
  const partnerName = "Adil Yilmaz";
  const level = "Master Painter";
  const xpProgress = 72;
  const totalJobs = 184;
  const avgStars = 4.9;

  return (
    <div data-testid="view-profile">
      <Header title="Profil" subtitle="Reputation & Level" />
      <div className="px-3 space-y-4">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 ring-2 ring-red-600">
              <AvatarImage src="" alt={partnerName} />
              <AvatarFallback className="bg-red-600/30 text-red-300 text-xl font-bold">
                AY
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div
                className="text-lg font-bold truncate"
                data-testid="text-partner-name"
              >
                {partnerName}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span
                  className="text-sm font-semibold text-yellow-400"
                  data-testid="text-partner-level"
                >
                  {level}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Stars value={avgStars} />
                <span className="text-xs text-zinc-400 ml-1">
                  {avgStars.toFixed(1)} · {totalJobs} Jobs
                </span>
              </div>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>Fortschritt zum Grand Master</span>
              <span className="tabular-nums">{xpProgress}%</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-yellow-400"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Jobs" value={totalJobs.toString()} />
          <StatTile label="Rating" value={avgStars.toFixed(1)} />
          <StatTile label="Streak" value="12🔥" />
        </div>

        {/* Reviews */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
            Bewertungen
          </div>
          {MOCK_REVIEWS.map((r) => (
            <div
              key={r.id}
              className="bg-zinc-950 border border-zinc-900 rounded-lg p-3"
              data-testid={`review-${r.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{r.client}</span>
                <span className="text-[10px] text-zinc-500">{r.date}</span>
              </div>
              <Stars value={r.stars} small />
              <div className="text-sm text-zinc-300 mt-1">{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 text-center">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function Stars({ value, small }: { value: number; small?: boolean }) {
  const size = small ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= Math.round(value)
              ? "text-yellow-400 fill-yellow-400"
              : "text-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

/* ---------------- SHARED ---------------- */

function Header({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-black border-b border-zinc-900 px-3 py-3 flex items-center gap-2">
      {onBack && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onBack}
          className="text-white hover:text-red-400"
          data-testid="button-header-back"
          aria-label="Zurück"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold truncate" data-testid="text-header-title">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-zinc-500 truncate">{subtitle}</div>
        )}
      </div>
    </header>
  );
}

/* ---------------- SIGNATURE MODAL ---------------- */

function SignatureModal({
  job,
  onClose,
  onSave,
}: {
  job: FeedJob | null;
  onClose: () => void;
  onSave: (job: FeedJob, dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (!job) return;
    setHasInk(false);
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.clearRect(0, 0, c.width, c.height);
  }, [job]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const save = () => {
    if (!job || !canvasRef.current || !hasInk) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(job, dataUrl);
  };

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md bg-zinc-950 border-zinc-800 text-white"
        data-testid="dialog-signature"
      >
        <DialogHeader>
          <DialogTitle>Unterschrift Kunde</DialogTitle>
        </DialogHeader>
        {job && (
          <div className="space-y-2">
            <div className="text-sm text-zinc-400">
              {job.car} · {job.plate} · {job.client}
            </div>
            <div className="rounded-md border border-zinc-800 bg-black">
              <canvas
                ref={canvasRef}
                className="w-full h-48 touch-none"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                data-testid="canvas-signature"
              />
            </div>
            <div className="text-[11px] text-zinc-500 text-center">
              Hier mit dem Finger unterschreiben
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-2 flex-row">
          <Button
            variant="outline"
            onClick={clear}
            className="flex-1 border-zinc-700 bg-transparent text-zinc-200"
            data-testid="button-signature-clear"
          >
            Löschen
          </Button>
          <Button
            onClick={save}
            disabled={!hasInk}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            data-testid="button-signature-save"
          >
            <Check className="w-4 h-4 mr-2" />
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
