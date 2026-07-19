import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "";

type AuftragStatus = "In Lucru" | "Finalizat" | "Anulat" | string;

interface Auftrag {
  id: string;
  kennzeichen: string;
  client: string;
  partner: string;
  date: string;
  total: number;
  status: AuftragStatus;
}

const MOCK_AUFTRAEGE: Auftrag[] = [
  {
    id: "A-001",
    kennzeichen: "MTK AB 123",
    client: "Andreas Meier",
    partner: "Adil",
    date: "02.05.2026",
    total: 1785,
    status: "In Lucru",
  },
  {
    id: "A-002",
    kennzeichen: "F-XY 789",
    client: "Sabine Klein",
    partner: "Wallau",
    date: "01.05.2026",
    total: 642,
    status: "In Lucru",
  },
  {
    id: "A-003",
    kennzeichen: "WI-LD 456",
    client: "Markus Hofmann",
    partner: "Mainz-Kastel",
    date: "30.04.2026",
    total: 2310,
    status: "In Lucru",
  },
];

function fmtEur(eur: number): string {
  return (
    eur.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function statusVariant(status: AuftragStatus): {
  label: string;
  classes: string;
} {
  switch (status) {
    case "Finalizat":
      return {
        label: "Finalizat",
        classes: "bg-green-500/15 text-green-300 border-green-500/40",
      };
    case "Anulat":
      return {
        label: "Anulat",
        classes: "bg-zinc-700/40 text-zinc-300 border-zinc-600",
      };
    case "In Lucru":
    default:
      return {
        label: status || "In Lucru",
        classes: "bg-amber-500/15 text-amber-300 border-amber-500/40",
      };
  }
}

export default function AuftragsListe() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Auftrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightFinalizeRef = useRef<Set<string>>(new Set());

  const loadOrders = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auftraege`, {
        method: "GET",
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Auftrag[];
      if (!Array.isArray(data)) throw new Error("Bad payload");
      if (!mountedRef.current) return;
      setOrders(data);
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return;
      if (!mountedRef.current) return;
      // Mac Mini API not reachable yet — fall back to mock data so the UI is usable.
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setOrders(MOCK_AUFTRAEGE);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinalize = async (order: Auftrag) => {
    // Handler-level idempotency: block re-entry before showing confirm or POSTing.
    if (
      order.status === "Finalizat" ||
      busyId !== null ||
      inFlightFinalizeRef.current.has(order.id)
    ) {
      return;
    }
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `Confirm finalizarea și calculul decontului pentru ${order.partner}?`,
    );
    if (!ok) return;
    inFlightFinalizeRef.current.add(order.id);
    setBusyId(order.id);
    try {
      const res = await fetch(`${API_BASE}/api/auftrag-finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!mountedRef.current) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: "Finalizat" } : o,
        ),
      );
      toast({
        title: "Finalizat",
        description: `Auftrag ${order.id} finalizat. Decont calculat pentru ${order.partner}.`,
      });
    } catch (e) {
      if (!mountedRef.current) return;
      // Mac Mini offline → optimistic UI update so the workflow stays usable.
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: "Finalizat" } : o,
        ),
      );
      const message = e instanceof Error ? e.message : String(e);
      toast({
        title: "Finalizat (offline)",
        description: `Auftrag ${order.id} marcat ca finalizat local. API: ${message}`,
      });
    } finally {
      inFlightFinalizeRef.current.delete(order.id);
      if (mountedRef.current) setBusyId(null);
    }
  };

  const handlePdf = (order: Auftrag, kind: "client" | "partner") => {
    toast({
      title: `PDF ${kind === "client" ? "Client" : "Partner"}`,
      description: `Generare PDF pentru ${order.id} (${order.kennzeichen}) — în curând.`,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-black border-b-2 border-red-600">
        <div className="px-4 py-3 flex items-center gap-2 max-w-3xl mx-auto">
          <Link href="/reception">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-red-400"
              data-testid="button-back"
              aria-label="Zurück"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-bold tracking-wide text-sm sm:text-base truncate">
              <span className="text-white">CORION</span>{" "}
              <span className="text-red-500">- ACTIVE AUFTRÄGE</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Manager · Decont Partner
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => loadOrders()}
            disabled={loading}
            className="text-white hover:text-red-400"
            data-testid="button-refresh"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-3">
        {error && (
          <div
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
            data-testid="text-api-warning"
          >
            Mac Mini API offline ({error}). Werte zeigen Mock-Daten.
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div
            className="flex items-center justify-center py-20 text-zinc-500"
            data-testid="state-loading"
          >
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Lade Aufträge…
          </div>
        ) : orders.length === 0 ? (
          <div
            className="rounded-md border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500"
            data-testid="state-empty"
          >
            Keine Aufträge
          </div>
        ) : (
          orders.map((order) => {
            const sv = statusVariant(order.status);
            const isFinalized = order.status === "Finalizat";
            return (
              <Card
                key={order.id}
                className="bg-zinc-950 border-zinc-800 p-4 space-y-3"
                data-testid={`card-order-${order.id}`}
              >
                {/* Header row: ID + status + partner */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-mono text-zinc-500"
                      data-testid={`text-order-id-${order.id}`}
                    >
                      {order.id}
                    </span>
                    <Badge
                      className={`${sv.classes} no-default-hover-elevate no-default-active-elevate`}
                      variant="outline"
                      data-testid={`badge-status-${order.id}`}
                    >
                      {sv.label}
                    </Badge>
                  </div>
                  <Badge
                    className="bg-red-600/15 text-red-300 border-red-600/40 no-default-hover-elevate no-default-active-elevate"
                    variant="outline"
                    data-testid={`badge-partner-${order.id}`}
                  >
                    {order.partner}
                  </Badge>
                </div>

                {/* Body: car / client / total */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                      Fahrzeug
                    </div>
                    <div
                      className="text-base font-semibold tracking-wide"
                      data-testid={`text-kennzeichen-${order.id}`}
                    >
                      {order.kennzeichen}
                    </div>
                    <div className="text-xs text-zinc-500">{order.date}</div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                      Kunde
                    </div>
                    <div
                      className="text-sm font-medium truncate"
                      data-testid={`text-client-${order.id}`}
                    >
                      {order.client}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-end justify-between border-t border-zinc-800 pt-3">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                      Total
                    </span>
                    <span
                      className="text-xl font-bold tabular-nums text-red-400"
                      data-testid={`text-total-${order.id}`}
                    >
                      {fmtEur(order.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePdf(order, "client")}
                    className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
                    data-testid={`button-pdf-client-${order.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF Client
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePdf(order, "partner")}
                    className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
                    data-testid={`button-pdf-partner-${order.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF Partner
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleFinalize(order)}
                    disabled={isFinalized || busyId === order.id}
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                    data-testid={`button-finalize-${order.id}`}
                  >
                    {busyId === order.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {isFinalized
                      ? "Finalizat"
                      : busyId === order.id
                        ? "Finalizare..."
                        : "Finalizează"}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
