import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Send, LogOut } from "lucide-react";

// Mobile-first, full-screen, installable CORI surface — no dashboard chrome,
// no marketing widgets. Reuses the same /api/cori/* endpoints as the desktop
// CoriPanel in WorkshopWorkspace.tsx; this file only owns presentation +
// the PWA install metadata (manifest link, apple meta tags) for the /cori
// scope, injected on mount and removed on unmount so they never leak into
// other routes served by the same single-page app.

interface CoriSnapshot {
  active: number;
  todayCount: number;
  awaitingPickup: number;
  unpaidFinished: number;
  missingPartner: number;
  openTasks: number;
  nextScheduled: { customerName: string; vehiclePlate: string | null; scheduledDate: string } | null;
}

interface CoriResponse {
  answer: string;
  surface?: string | null;
  suggestions?: string[];
}

type Turn = { question: string; response: CoriResponse | null };

// ── PWA head tags, scoped to this route only ──────────────────────────────────

function usePwaHeadTags() {
  useEffect(() => {
    const created: HTMLElement[] = [];

    function addLink(rel: string, href: string, extra?: Record<string, string>) {
      const el = document.createElement("link");
      el.rel = rel;
      el.href = href;
      if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
      document.head.appendChild(el);
      created.push(el);
    }
    function addMeta(name: string, content: string) {
      const el = document.createElement("meta");
      el.name = name;
      el.content = content;
      document.head.appendChild(el);
      created.push(el);
    }

    const prevTitle = document.title;
    document.title = "CORI";

    addLink("manifest", "/cori-manifest.json");
    addLink("apple-touch-icon", "/cori-apple-touch-icon.png");
    addMeta("theme-color", "#E53935");
    addMeta("apple-mobile-web-app-capable", "yes");
    addMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    addMeta("apple-mobile-web-app-title", "CORI");
    addMeta("mobile-web-app-capable", "yes");

    return () => {
      created.forEach((el) => el.remove());
      document.title = prevTitle;
    };
  }, []);
}

// ── Inline login (no redirect to the desktop /login page) ─────────────────────

function MobileLoginGate() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => setError("Login fehlgeschlagen. E-Mail oder Passwort prüfen."),
  });

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <img src="/cori-avatar.png" alt="CORI" className="h-24 w-24 rounded-full object-cover ring-2 ring-[#E53935]/60 mb-6" />
      <h1 className="text-xl font-semibold mb-1">CORI</h1>
      <p className="text-sm text-white/50 mb-8">Corion AI Copilot</p>

      <form
        className="w-full max-w-xs space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          loginMutation.mutate();
        }}
      >
        <input
          type="email"
          autoComplete="username"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E53935]"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E53935]"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loginMutation.isPending || !email || !password}
          className="w-full rounded-xl bg-[#E53935] py-3 text-base font-medium disabled:opacity-40"
        >
          {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Anmelden"}
        </button>
      </form>
    </div>
  );
}

// ── Chat surface ───────────────────────────────────────────────────────────────

function defaultSuggestions(snapshot?: CoriSnapshot): string[] {
  const s: string[] = ["Was braucht heute meine Aufmerksamkeit?"];
  if ((snapshot?.unpaidFinished ?? 0) > 0) s.push(`${snapshot!.unpaidFinished} unbezahlte Aufträge — was tun?`);
  else if ((snapshot?.awaitingPickup ?? 0) > 0) s.push(`${snapshot!.awaitingPickup} Aufträge bereit zur Abholung`);
  s.push("Was ist mein nächster Termin?");
  return s.slice(0, 3);
}

function CoriMobileChat({ onLogout }: { onLogout: () => void }) {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: snapshot } = useQuery<CoriSnapshot>({
    queryKey: ["/api/cori/snapshot"],
    queryFn: () => apiRequest("GET", "/api/cori/snapshot").then((r) => r.json()),
  });

  const chatMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await apiRequest("POST", "/api/cori/chat", { question: q, snapshot });
      return res.json() as Promise<CoriResponse>;
    },
    onSuccess: (data, question) => {
      setTurns((t) => [...t, { question, response: data }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
  });

  function ask(q: string) {
    if (!q.trim() || chatMutation.isPending) return;
    setInput("");
    chatMutation.mutate(q);
  }

  const suggestions = turns.length === 0 ? defaultSuggestions(snapshot) : [];

  return (
    <div
      className="flex h-screen flex-col bg-black text-white"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <img src="/cori-avatar.png" alt="CORI" className="h-9 w-9 rounded-full object-cover ring-1 ring-[#E53935]/60" />
        <div className="flex-1">
          <div className="text-sm font-semibold">CORI</div>
          <div className="text-[11px] text-white/40">Corion AI Copilot</div>
        </div>
        <button onClick={onLogout} className="text-white/40 hover:text-white/80 p-2" aria-label="Abmelden">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {turns.length === 0 && snapshot && (
          <div className="text-sm text-white/60 leading-relaxed">
            Heute: <span className="text-white font-medium">{snapshot.active}</span> aktive Aufträge
            {snapshot.awaitingPickup > 0 && <>, <span className="text-amber-400">{snapshot.awaitingPickup} bereit zur Abholung</span></>}
            {snapshot.unpaidFinished > 0 && <>, <span className="text-red-400">{snapshot.unpaidFinished} unbezahlt</span></>}.
            <br />Was kann ich für dich tun?
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#E53935] px-4 py-2.5 text-[15px]">
              {t.question}
            </div>
            {t.response && (
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-2.5 text-[15px] whitespace-pre-line">
                {t.response.answer}
              </div>
            )}
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="mr-auto flex items-center gap-2 text-sm text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> CORI denkt nach…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => ask(s)}
              className="text-[13px] bg-white/10 active:bg-white/20 text-white/80 px-3 py-2 rounded-full"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* composer */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-white/10 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder="Frag CORI…"
          className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E53935]"
        />
        <button
          onClick={() => ask(input)}
          disabled={chatMutation.isPending || !input.trim()}
          className="h-12 w-12 shrink-0 rounded-xl bg-[#E53935] disabled:opacity-40 flex items-center justify-center"
          aria-label="Senden"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function CoriMobile() {
  usePwaHeadTags();
  const { user, isLoading, isAdmin, isPartner, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!user) {
    return <MobileLoginGate />;
  }

  if (!isAdmin && !isPartner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
        <img src="/cori-avatar.png" alt="CORI" className="h-16 w-16 rounded-full object-cover opacity-60" />
        <p className="text-sm text-white/60">CORI ist aktuell nur für Admin und Partner verfügbar.</p>
        <button onClick={logout} className="text-sm text-[#E53935] mt-2">Abmelden</button>
      </div>
    );
  }

  return <CoriMobileChat onLogout={logout} />;
}
