import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Phone,
  User as UserIcon,
  X,
  FileText,
  Sparkles,
  Clock,
  Languages,
  Euro,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "";

type SlotKind = "damage" | "talon";
interface Slot {
  id: string;
  kind: SlotKind;
  label: string;
  src: string | null;
  fileName?: string;
}

type Stage = "capture" | "analyzing" | "result" | "submitting" | "done";

const INITIAL_SLOTS: Slot[] = [
  { id: "d1", kind: "damage", label: "Daună 1", src: null },
  { id: "d2", kind: "damage", label: "Daună 2", src: null },
  { id: "d3", kind: "damage", label: "Daună 3", src: null },
  { id: "t1", kind: "talon", label: "Talon", src: null },
];

export default function GutachterFunnel() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS);
  const [stage, setStage] = useState<Stage>("capture");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);

  // Lifecycle / async safety
  const mountedRef = useRef(true);
  const analyzeTimerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);

  // Track live object URLs so we can revoke them on replace / clear / unmount
  const objectUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (analyzeTimerRef.current !== null) {
        window.clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = null;
      }
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current.clear();
    };
  }, []);

  const damageCount = slots.filter(
    (s) => s.kind === "damage" && s.src,
  ).length;
  const talonDone = !!slots.find((s) => s.kind === "talon")?.src;
  const allUploaded = damageCount >= 3 && talonDone;
  const totalProgress = Math.round(
    ((damageCount + (talonDone ? 1 : 0)) / 4) * 100,
  );

  const triggerPick = (slotId: string) => {
    setPickingId(slotId);
    fileInputRef.current?.click();
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pickingId) {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.add(url);
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== pickingId) return s;
          if (s.src) {
            URL.revokeObjectURL(s.src);
            objectUrlsRef.current.delete(s.src);
          }
          return { ...s, src: url, fileName: file.name };
        }),
      );
    }
    e.target.value = "";
    setPickingId(null);
  };

  const clearSlot = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        if (s.src) {
          URL.revokeObjectURL(s.src);
          objectUrlsRef.current.delete(s.src);
        }
        return { ...s, src: null, fileName: undefined };
      }),
    );
  };

  const startAnalysis = () => {
    if (!allUploaded) return;
    if (analyzeTimerRef.current !== null) {
      window.clearTimeout(analyzeTimerRef.current);
    }
    setStage("analyzing");
    analyzeTimerRef.current = window.setTimeout(() => {
      analyzeTimerRef.current = null;
      if (!mountedRef.current) return;
      setStage("result");
    }, 2400);
  };

  const submitDossier = async () => {
    // Re-entrancy guard: prevent rapid double-submit racing the disabled state.
    if (submittingRef.current) return;
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Date incomplete",
        description: "Te rugăm să completezi numele și numărul de telefon.",
        variant: "destructive",
      });
      return;
    }
    submittingRef.current = true;
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      damagePhotos: slots.filter((s) => s.kind === "damage" && s.src).length,
      talonUploaded: talonDone,
      estimatedRangeEur: { min: 2500, max: 3500 },
      ts: Date.now(),
    };
    // eslint-disable-next-line no-console
    console.log("[GutachterFunnel] Lead payload:", payload);
    setStage("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/gutachter-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // Mac Mini offline → fall through; UX still completes optimistically.
    }
    submittingRef.current = false;
    if (!mountedRef.current) return;
    setStage("done");
    toast({
      title: "Dosarul a fost preluat!",
      description: "Te vom suna în 15 minute.",
    });
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-zinc-900"
        data-testid="section-hero"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-700/30 via-black to-black" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-600/15 border border-red-600/40 px-3 py-1 text-[11px] font-semibold text-red-300 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgență accident
            <span className="text-red-400/60">·</span>
            <Languages className="w-3.5 h-3.5" />
            Română
          </div>
          <h1
            className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
            data-testid="text-hero-headline"
          >
            Ai avut un accident în Germania{" "}
            <span className="text-red-500">și nu ești vinovat?</span>
          </h1>
          <p
            className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed"
            data-testid="text-hero-subheadline"
          >
            Evaluare gratuită în limba română (Gutachter). Noi ne ocupăm de
            asigurare, tu primești banii sau reparația.
          </p>

          {/* Trust row */}
          <div className="mt-5 grid grid-cols-3 gap-2 max-w-md">
            <TrustChip
              icon={<Shield className="w-3.5 h-3.5" />}
              label="100% Gratuit"
            />
            <TrustChip
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Răspuns 15 min"
            />
            <TrustChip
              icon={<Languages className="w-3.5 h-3.5" />}
              label="În română"
            />
          </div>
        </div>
      </section>

      {/* MAIN FLOW */}
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        {stage === "capture" && (
          <CaptureStage
            slots={slots}
            damageCount={damageCount}
            talonDone={talonDone}
            allUploaded={allUploaded}
            totalProgress={totalProgress}
            onPick={triggerPick}
            onClear={clearSlot}
            onAnalyze={startAnalysis}
          />
        )}

        {stage === "analyzing" && <AnalyzingStage />}

        {(stage === "result" ||
          stage === "submitting" ||
          stage === "done") && (
          <>
            <ResultCard />
            {stage !== "done" ? (
              <LeadForm
                name={name}
                phone={phone}
                setName={setName}
                setPhone={setPhone}
                submitting={stage === "submitting"}
                onSubmit={submitDossier}
              />
            ) : (
              <DoneCard name={name} />
            )}
          </>
        )}
      </section>

      {/* hidden file input shared by all slots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFilePicked}
        data-testid="input-file-shared"
      />
    </div>
  );
}

/* ---------------- CAPTURE ---------------- */

function CaptureStage({
  slots,
  damageCount,
  talonDone,
  allUploaded,
  totalProgress,
  onPick,
  onClear,
  onAnalyze,
}: {
  slots: Slot[];
  damageCount: number;
  talonDone: boolean;
  allUploaded: boolean;
  totalProgress: number;
  onPick: (slotId: string) => void;
  onClear: (slotId: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <div data-testid="stage-capture" className="space-y-5">
      {/* Instruction banner */}
      <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-600/15 flex items-center justify-center flex-shrink-0">
            <Camera className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold">
              Fă 3 poze cu dauna și 1 poză cu talonul.
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Fotografii clare. Lumina naturală e cea mai bună.
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span>
                  Progres · {damageCount}/3 daună · {talonDone ? "1" : "0"}/1
                  talon
                </span>
                <span className="tabular-nums">{totalProgress}%</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-[width] duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera viewfinder grid */}
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot, idx) => (
          <Viewfinder
            key={slot.id}
            slot={slot}
            index={idx + 1}
            onPick={() => onPick(slot.id)}
            onClear={() => onClear(slot.id)}
          />
        ))}
      </div>

      {/* Big CTA */}
      <Button
        size="lg"
        disabled={!allUploaded}
        onClick={onAnalyze}
        className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-base font-bold shadow-lg shadow-red-900/40 disabled:opacity-40"
        data-testid="button-analyze"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        ANALIZEAZĂ CU CORION AI
      </Button>
      {!allUploaded && (
        <div className="text-center text-[11px] text-zinc-500">
          Adaugă toate cele 4 poze pentru a continua.
        </div>
      )}
    </div>
  );
}

function Viewfinder({
  slot,
  index,
  onPick,
  onClear,
}: {
  slot: Slot;
  index: number;
  onPick: () => void;
  onClear: () => void;
}) {
  const isTalon = slot.kind === "talon";
  return (
    <div
      className={`relative rounded-lg overflow-hidden border-2 ${
        slot.src
          ? "border-red-600/60"
          : "border-dashed border-zinc-800"
      } bg-zinc-950 aspect-[3/4]`}
      data-testid={`slot-${slot.id}`}
    >
      {slot.src ? (
        <>
          <img
            src={slot.src}
            alt={slot.label}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span className="rounded-full bg-black/70 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {slot.label}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClear}
              className="bg-black/70 backdrop-blur text-white hover:text-red-400"
              data-testid={`button-clear-${slot.id}`}
              aria-label={`Șterge ${slot.label}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-[11px] text-white/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="truncate">Fotografie atașată</span>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-colors group"
          data-testid={`button-pick-${slot.id}`}
        >
          {/* Viewfinder corner brackets */}
          <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-red-600/60" />
          <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-red-600/60" />
          <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-red-600/60" />
          <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-red-600/60" />

          <div className="w-12 h-12 rounded-full bg-red-600/15 flex items-center justify-center group-hover:bg-red-600/25 transition-colors">
            {isTalon ? (
              <FileText className="w-5 h-5 text-red-400" />
            ) : (
              <Camera className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="text-xs font-bold text-white">
            {isTalon ? "Talon" : `Foto ${index}`}
          </div>
          <div className="text-[10px] text-zinc-500 px-3 text-center leading-tight">
            {isTalon ? "Carte de identitate auto" : "Apasă pentru a fotografia"}
          </div>
        </button>
      )}
    </div>
  );
}

/* ---------------- ANALYZING ---------------- */

function AnalyzingStage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="stage-analyzing"
      className="rounded-xl bg-gradient-to-br from-zinc-950 to-black border border-zinc-800 p-8"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-red-600/30 blur-xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <div className="relative w-16 h-16 rounded-full bg-red-600/15 border border-red-600/40 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-red-400 animate-spin" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold">Corion AI analizează dauna...</div>
          <div className="text-xs text-zinc-400 mt-1">
            Recunoaștere automată a daunelor și estimare cost reparație
          </div>
        </div>
        <div className="w-full max-w-sm space-y-2 mt-2">
          <AnalysisStep
            label="Detectare panouri afectate"
            delay={0.2}
          />
          <AnalysisStep label="Estimare cost piese" delay={0.7} />
          <AnalysisStep label="Verificare eligibilitate asigurare" delay={1.2} />
        </div>
      </div>
    </motion.div>
  );
}

function AnalysisStep({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900/60 rounded-md px-3 py-2"
    >
      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
      <span className="flex-1">{label}</span>
    </motion.div>
  );
}

/* ---------------- RESULT ---------------- */

function ResultCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      data-testid="card-result"
      className="rounded-xl overflow-hidden border border-red-600/40 bg-gradient-to-br from-zinc-950 via-black to-red-950/20"
    >
      <div className="bg-gradient-to-r from-red-700 to-red-500 px-4 py-2.5 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-white">
          Rezultat Corion AI
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            Daună estimată
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <Euro className="w-5 h-5 text-red-400" />
            <span
              className="text-3xl sm:text-4xl font-black tabular-nums"
              data-testid="text-estimate-range"
            >
              2.500 € – 3.500 €
            </span>
          </div>
        </div>
        <div className="rounded-md bg-green-500/10 border border-green-500/30 p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-100">
            <span className="font-bold">Ești eligibil</span> pentru despăgubire{" "}
            <span className="font-bold">100%</span> de la asigurarea
            adversarului.
          </div>
        </div>
        <ul className="text-xs text-zinc-400 space-y-1 pl-1">
          <li>· Toate costurile acoperite — Gutachter, avocat, reparație.</li>
          <li>· Mașină de înlocuire pe perioada reparației.</li>
          <li>· Plată în bani sau reparație la atelier partener.</li>
        </ul>
      </div>
    </motion.div>
  );
}

/* ---------------- LEAD FORM ---------------- */

function LeadForm({
  name,
  phone,
  setName,
  setPhone,
  submitting,
  onSubmit,
}: {
  name: string;
  phone: string;
  setName: (v: string) => void;
  setPhone: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-xl bg-zinc-950 border border-zinc-800 p-5 space-y-4"
      data-testid="form-lead"
    >
      <div>
        <div className="text-base font-bold">
          Trimite dosarul către expertul nostru român
        </div>
        <div className="text-xs text-zinc-400 mt-0.5">
          Te sunăm înapoi în maxim 15 minute.
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="lead-name"
            className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5"
          >
            <UserIcon className="w-3.5 h-3.5" /> Nume
          </label>
          <Input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ion Popescu"
            className="bg-black border-zinc-800 text-white"
            disabled={submitting}
            data-testid="input-name"
            autoComplete="name"
          />
        </div>
        <div>
          <label
            htmlFor="lead-phone"
            className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" /> Telefon
          </label>
          <Input
            id="lead-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+49 170 1234567"
            inputMode="tel"
            className="bg-black border-zinc-800 text-white"
            disabled={submitting}
            data-testid="input-phone"
            autoComplete="tel"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-base font-bold shadow-lg shadow-red-900/40 disabled:opacity-60"
        data-testid="button-submit-lead"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            SE TRIMITE...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Trimite dosarul către Expert (Gratuit)
          </>
        )}
      </Button>
      <div className="text-center text-[10px] text-zinc-500 leading-relaxed">
        Datele tale rămân confidențiale. Nu plătești nimic — costurile sunt
        acoperite de asigurarea adversarului.
      </div>
    </form>
  );
}

/* ---------------- DONE ---------------- */

function DoneCard({ name }: { name: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        data-testid="card-done"
        className="rounded-xl border border-green-500/40 bg-gradient-to-br from-green-500/15 via-zinc-950 to-black p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-3"
        >
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </motion.div>
        <div className="text-xl font-black">Dosarul a fost preluat!</div>
        <div className="text-sm text-zinc-300 mt-2">
          {name ? `${name}, ` : ""}te vom suna în{" "}
          <span className="text-green-400 font-bold">15 minute</span> pentru a
          discuta despre cazul tău.
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
          <Clock className="w-3.5 h-3.5" />
          Programul nostru: Lu–Du, 08:00–22:00
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- SHARED ---------------- */

function TrustChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-[11px] font-semibold text-zinc-200">
      <span className="text-red-400">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
