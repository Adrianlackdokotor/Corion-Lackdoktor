import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Bot, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type QuickActionKey = "D" | "L" | "B" | "iL";

interface OrderItem {
  id: string;
  actionKey: QuickActionKey;
  actionLabel: string;
  part: string;
  priceCents: number;
}

const QUICK_ACTIONS: {
  key: QuickActionKey;
  label: string;
  short: string;
  classes: string;
}[] = [
  {
    key: "D",
    label: "Delle",
    short: "D",
    classes:
      "border-blue-500 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25",
  },
  {
    key: "L",
    label: "Lackieren",
    short: "L",
    classes: "border-red-500 bg-red-500/15 text-red-300 hover:bg-red-500/25",
  },
  {
    key: "B",
    label: "Beilackieren",
    short: "B",
    classes:
      "border-yellow-400 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20",
  },
  {
    key: "iL",
    label: "Inst+Lack",
    short: "i+L",
    classes:
      "border-purple-500 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25",
  },
];

function fmtEur(cents: number): string {
  return (
    (cents / 100).toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function parseEurInput(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const eur = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(eur) || eur < 0) return null;
  return Math.round(eur * 100);
}

export default function ReceptionApp() {
  const { toast } = useToast();
  const [plate, setPlate] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fzScanInputRef = useRef<HTMLInputElement | null>(null);

  const tokensBalance = 0;

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + it.priceCents, 0),
    [items],
  );
  const safeDiscount = Math.min(100, Math.max(0, discountPercent || 0));
  const discountCents = Math.round((subtotalCents * safeDiscount) / 100);
  const nettoFinalCents = subtotalCents - discountCents;
  const mwstCents = Math.round(nettoFinalCents * 0.19);
  const totalBruttoCents = nettoFinalCents + mwstCents;

  const handleQuickAction = (
    key: QuickActionKey,
    label: string,
  ) => {
    // eslint-disable-next-line no-alert
    const part = window.prompt("Ce piesă?");
    if (part === null) return;
    const trimmedPart = part.trim();
    if (trimmedPart === "") {
      toast({
        variant: "destructive",
        title: "Piesă obligatorie",
        description: "Te rog introdu numele piesei.",
      });
      return;
    }
    // eslint-disable-next-line no-alert
    const priceRaw = window.prompt(`Preț manual (€) pentru "${trimmedPart}"`);
    const priceCents = parseEurInput(priceRaw);
    if (priceCents === null) {
      toast({
        variant: "destructive",
        title: "Preț invalid",
        description: "Introdu un preț numeric, ex: 120 sau 120,50.",
      });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actionKey: key,
        actionLabel: label,
        part: trimmedPart,
        priceCents,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPhotos((prev) => [...prev, ...files]);
      toast({
        title: "Foto adăugat",
        description: `${files.length} fișier(e) încărcat(e).`,
      });
    }
    e.target.value = "";
  };

  const handleScanFahrzeugschein = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "Fahrzeugschein gescannt",
        description: `${file.name} – wird (Mock) verarbeitet.`,
      });
    }
    e.target.value = "";
  };

  const canSubmit = plate.trim().length > 0 && items.length > 0;

  const handleSubmit = () => {
    if (!plate.trim()) {
      toast({
        variant: "destructive",
        title: "Kennzeichen fehlt",
        description: "Bitte Kennzeichen eingeben.",
      });
      return;
    }
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Keine Positionen",
        description: "Bitte mindestens eine Schadensposition hinzufügen.",
      });
      return;
    }
    const payload = {
      plate: plate.trim().toUpperCase(),
      phone: phone.trim(),
      photoCount: photos.length,
      items: items.map((it) => ({
        actionKey: it.actionKey,
        actionLabel: it.actionLabel,
        part: it.part,
        priceCents: it.priceCents,
      })),
      subtotalCents,
      discountPercent: safeDiscount,
      discountCents,
      nettoFinalCents,
      mwstCents,
      totalBruttoCents,
      submittedAt: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.log("[ReceptionApp] Auftrag payload:", payload);
    toast({
      title: "Auftrag trimis",
      description: "Auftrag trimis spre procesare!",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-black border-b-2 border-red-600">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
          <div className="font-bold tracking-wide text-base sm:text-lg">
            <span className="text-white">CORION</span>{" "}
            <span className="text-red-500">LACKDOKTOR</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:text-red-400"
            data-testid="button-ai-agent"
            aria-label="AI Agent"
          >
            <Bot className="w-5 h-5" />
          </Button>
        </div>
        <div
          className="px-4 pb-2 text-xs text-zinc-300"
          data-testid="text-tokens-banner"
        >
          HUB+1 Tokens:{" "}
          <span className="font-semibold text-white">
            {tokensBalance.toFixed(2)}
          </span>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5 max-w-xl mx-auto">
        {/* Fahrzeug & Kunde */}
        <section
          className="space-y-3"
          data-testid="section-fahrzeug-kunde"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Fahrzeug & Kunde
          </h2>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Kennzeichen</label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="F-AB 1234"
              className="bg-zinc-900 border-zinc-700 text-white uppercase tracking-wider"
              data-testid="input-plate"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Telefon</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 ..."
              type="tel"
              inputMode="tel"
              className="bg-zinc-900 border-zinc-700 text-white"
              data-testid="input-phone"
            />
          </div>
          <input
            ref={fzScanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanFahrzeugschein}
            data-testid="input-fahrzeugschein-file"
          />
          <Button
            variant="outline"
            size="lg"
            className="w-full border-zinc-600 bg-transparent text-white hover:bg-zinc-900"
            onClick={() => fzScanInputRef.current?.click()}
            data-testid="button-scan-fahrzeugschein"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Fahrzeugschein
          </Button>
        </section>

        {/* Photo Upload */}
        <section className="space-y-3" data-testid="section-photo-upload">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Foto Daună
          </h2>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
            data-testid="input-damage-photo-file"
          />
          <Button
            variant="outline"
            size="lg"
            className="w-full border-zinc-600 bg-transparent text-white hover:bg-zinc-900"
            onClick={() => photoInputRef.current?.click()}
            data-testid="button-upload-damage-photo"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Poză Daună (Încercuiește defectul)
          </Button>
          {photos.length > 0 && (
            <p
              className="text-xs text-zinc-400"
              data-testid="text-photo-count"
            >
              {photos.length} foto încărcată(e)
            </p>
          )}
        </section>

        {/* Quick Actions */}
        <section className="space-y-3" data-testid="section-quick-actions">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Schaden hinzufügen
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.key}
                type="button"
                onClick={() => handleQuickAction(qa.key, qa.label)}
                className={`rounded-md border-2 px-3 py-5 text-left font-semibold transition-colors ${qa.classes}`}
                data-testid={`button-quick-action-${qa.key}`}
              >
                <div className="text-2xl font-bold leading-none mb-1">
                  ({qa.short})
                </div>
                <div className="text-sm">{qa.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Order Summary */}
        <section className="space-y-3" data-testid="section-order-summary">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Auftrag Übersicht
          </h2>
          {items.length === 0 ? (
            <div
              className="rounded-md border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500"
              data-testid="text-no-items"
            >
              Noch keine Positionen
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                  data-testid={`order-item-${it.id}`}
                >
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-200">
                    {QUICK_ACTIONS.find((q) => q.key === it.actionKey)?.short}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      data-testid={`order-item-part-${it.id}`}
                    >
                      {it.part}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {it.actionLabel}
                    </div>
                  </div>
                  <div
                    className="text-sm font-semibold tabular-nums"
                    data-testid={`order-item-price-${it.id}`}
                  >
                    {fmtEur(it.priceCents)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(it.id)}
                    className="text-zinc-400 hover:text-red-400"
                    data-testid={`button-remove-item-${it.id}`}
                    aria-label="Position löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Totals */}
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Subtotal</span>
              <span
                className="font-semibold tabular-nums"
                data-testid="text-subtotal"
              >
                {fmtEur(subtotalCents)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <label className="text-zinc-400" htmlFor="reception-discount">
                Reducere Negociată (%)
              </label>
              <Input
                id="reception-discount"
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountPercent === 0 ? "" : discountPercent}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setDiscountPercent(Number.isNaN(v) ? 0 : v);
                }}
                placeholder="0"
                className="w-20 bg-zinc-900 border-zinc-700 text-white text-right"
                data-testid="input-discount-percent"
              />
            </div>
            {safeDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  Reducere ({safeDiscount}%)
                </span>
                <span
                  className="text-red-400 tabular-nums"
                  data-testid="text-discount-amount"
                >
                  -{fmtEur(discountCents)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Netto Final</span>
              <span
                className="font-semibold tabular-nums"
                data-testid="text-netto-final"
              >
                {fmtEur(nettoFinalCents)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">MwSt (19%)</span>
              <span
                className="tabular-nums"
                data-testid="text-mwst"
              >
                {fmtEur(mwstCents)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800 pt-2 mt-1">
              <span className="text-base font-bold">TOTAL BRUTTO</span>
              <span
                className="text-base font-bold tabular-nums text-red-400"
                data-testid="text-total-brutto"
              >
                {fmtEur(totalBruttoCents)}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Submit */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-t border-zinc-800 p-3">
        <div className="max-w-xl mx-auto">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-14 text-base font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-auftrag"
          >
            AUFTRAG ERSTELLEN
          </Button>
        </div>
      </div>
    </div>
  );
}
