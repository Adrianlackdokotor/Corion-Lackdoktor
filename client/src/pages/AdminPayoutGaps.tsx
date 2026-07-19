import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  Euro,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Users,
} from "lucide-react";

interface PayoutGapOrder {
  id: string;
  referenceNumber: string | null;
  customerName: string;
  status: string;
  totalAmountCents: number;
  partnerPayoutNetCents: number;
  scheduledDate: string | null;
  createdDate: string;
  partnerName: string;
  partnerId: string;
}

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + " €";
}

// ── Inline payout editor row ───────────────────────────────────────────
function PayoutRow({
  order,
  onSaved,
}: {
  order: PayoutGapOrder;
  onSaved: () => void;
}) {
  const [rawInput, setRawInput] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const mutation = useMutation<{ ok: boolean; partnerPayoutNetCents: number }, Error, number>({
    mutationFn: async (cents) => {
      const res = await fetch(`/api/cfo/payout-gaps/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ partnerPayoutNetCents: cents }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      setSavedOk(true);
      setTimeout(() => { setSavedOk(false); onSaved(); }, 1500);
    },
  });

  function save() {
    const numeric = parseFloat(rawInput.replace(",", "."));
    if (isNaN(numeric) || numeric < 0) return;
    mutation.mutate(Math.round(numeric * 100));
  }

  const displayRef = order.referenceNumber ?? order.id.slice(0, 8);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-zinc-800 last:border-0 transition-colors ${
      savedOk ? "bg-emerald-500/5" : "hover:bg-zinc-800/30"
    }`}>
      {/* Order info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 font-mono">{displayRef}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700 uppercase tracking-wide">
            {order.status}
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-200 mt-0.5 truncate">{order.customerName}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-zinc-500">
            <Users className="w-3 h-3 inline mr-1 text-zinc-600" />
            {order.partnerName}
          </span>
          <span className="text-[11px] text-zinc-600">{order.createdDate}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex-shrink-0 w-28 text-right hidden sm:block">
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Auftragswert</p>
        <p className="text-sm font-bold text-zinc-300 tabular-nums">{fmtEur(order.totalAmountCents)}</p>
      </div>

      {/* Payout input + action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {savedOk ? (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Gesichert
          </div>
        ) : (
          <>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">€</span>
              <input
                type="text"
                inputMode="decimal"
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(); }}
                placeholder="0"
                disabled={mutation.isPending}
                className="w-28 pl-6 pr-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 disabled:opacity-40 tabular-nums text-right"
              />
            </div>
            <button
              onClick={save}
              disabled={!rawInput.trim() || mutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-lg text-xs text-primary font-semibold transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sichern"}
            </button>
          </>
        )}
        {mutation.isError && !savedOk && (
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export default function AdminPayoutGaps() {
  const qc = useQueryClient();

  const query = useQuery<PayoutGapOrder[]>({
    queryKey: ["/api/cfo/payout-gaps"],
    queryFn: () =>
      fetch("/api/cfo/payout-gaps", { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    staleTime: 60_000,
  });

  const orders = query.data ?? [];

  function onSaved() {
    qc.invalidateQueries({ queryKey: ["/api/cfo/payout-gaps"] });
    qc.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/finanzen"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Finance OS
          </Link>
          <span className="text-zinc-700">·</span>
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-violet-400" />
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Auszahlungslücken</h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">Fertige Partneraufträge ohne Auszahlungsbetrag</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {orders.length} offen
            </span>
          )}
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <RefreshCcw className={`w-3 h-3 ${query.isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Aktualisieren</span>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto space-y-4">

        {/* Context banner */}
        <div className="bg-zinc-900/60 border border-violet-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-zinc-300">Was hier steht</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Fertige Aufträge mit zugewiesenem Partner, bei denen der Auszahlungsbetrag
              noch nicht definiert wurde. Trage den Betrag direkt hier ein und klicke Sichern.
            </p>
          </div>
        </div>

        {/* Loading */}
        {query.isLoading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center py-12 gap-2 text-zinc-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Lade Aufträge…
          </div>
        )}

        {/* Error */}
        {query.isError && (
          <div className="bg-zinc-900 border border-rose-500/30 rounded-lg p-4">
            <p className="text-xs text-rose-400">Fehler beim Laden. Bitte neu laden.</p>
          </div>
        )}

        {/* Empty state */}
        {!query.isLoading && !query.isError && orders.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Keine Auszahlungslücken</p>
              <p className="text-xs text-zinc-600 mt-0.5">Alle fertigen Partneraufträge haben einen Auszahlungsbetrag.</p>
            </div>
          </div>
        )}

        {/* Order list */}
        {!query.isLoading && orders.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-950/40">
              <p className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Auftrag · Kunde</p>
              <p className="w-28 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Auftragswert</p>
              <p className="w-44 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Auszahlung setzen</p>
            </div>
            {orders.map(order => (
              <PayoutRow key={order.id} order={order} onSaved={onSaved} />
            ))}
          </div>
        )}

        {/* Footer links */}
        <div className="flex gap-3 flex-wrap text-[11px]">
          <Link href="/finanzen" className="text-zinc-600 hover:text-zinc-400 transition-colors">← Finance OS</Link>
          <Link href="/admin" className="text-zinc-600 hover:text-zinc-400 transition-colors">Admin Pipeline →</Link>
        </div>
      </div>
    </div>
  );
}
