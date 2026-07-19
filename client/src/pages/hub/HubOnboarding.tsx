import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HubLayout } from "@/components/hub/HubLayout";
import { useHubI18n } from "@/lib/hubI18n";

const STORAGE_KEY = "hubplus.onboarding";

export type HubOnboardingState = {
  businessType: string | null;
  timeConsumers: string[];
  completedAt: string | null;
};

export default function HubOnboarding() {
  const { t } = useHubI18n();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [timeConsumers, setTimeConsumers] = useState<string[]>([]);
  const [configIdx, setConfigIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw) as HubOnboardingState;
        if (s.businessType) setBusinessType(s.businessType);
        if (s.timeConsumers) setTimeConsumers(s.timeConsumers);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    setConfigIdx(0);
    const id = setInterval(() => {
      setConfigIdx((i) => {
        if (i >= 4) {
          clearInterval(id);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                businessType,
                timeConsumers,
                completedAt: new Date().toISOString(),
              } satisfies HubOnboardingState)
            );
          }
          return 5;
        }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [step, businessType, timeConsumers]);

  const businessOptions = [
    { value: "lackdoktor", label: t("onb.step1.opt1") },
    { value: "karosserie", label: t("onb.step1.opt2") },
    { value: "smart_repair", label: t("onb.step1.opt3") },
    { value: "detailing", label: t("onb.step1.opt4") },
  ];

  const timeOptions = [
    { value: "calls", label: t("onb.step2.opt1") },
    { value: "quotes", label: t("onb.step2.opt2") },
    { value: "inspections", label: t("onb.step2.opt3") },
    { value: "bookkeeping", label: t("onb.step2.opt4") },
    { value: "marketing", label: t("onb.step2.opt5") },
  ];

  const configSteps = [
    t("onb.step3.s1"),
    t("onb.step3.s2"),
    t("onb.step3.s3"),
    t("onb.step3.s4"),
  ];

  const toggleTime = (v: string) => {
    setTimeConsumers((arr) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
    );
  };

  return (
    <HubLayout variant="minimal">
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(229,57,53,0.15),transparent_60%)]" />

        <div className="relative mx-auto max-w-2xl">
          <div className="text-center">
            <h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              data-testid="text-onboarding-title"
            >
              {t("onb.title")}
            </h1>
            <p className="mt-2 text-sm text-white/60">{t("onb.subtitle")}</p>
          </div>

          <ProgressBar step={step} total={3} />

          <Card className="mt-8 border-white/10 bg-white/[0.03] p-8 backdrop-blur">
            {step === 1 && (
              <Step1
                question={t("onb.step1.q")}
                options={businessOptions}
                value={businessType}
                onChange={setBusinessType}
              />
            )}
            {step === 2 && (
              <Step2
                question={t("onb.step2.q")}
                hint={t("onb.step2.hint")}
                options={timeOptions}
                value={timeConsumers}
                onToggle={toggleTime}
              />
            )}
            {step === 3 && (
              <Step3
                title={t("onb.step3.title")}
                done={t("onb.step3.done")}
                steps={configSteps}
                idx={configIdx}
              />
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                disabled={step === 1 || (step === 3 && configIdx < 5)}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="text-white/60 hover:text-white"
                data-testid="button-onb-back"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("onb.back")}
              </Button>
              {step < 3 ? (
                <Button
                  className="bg-[#E53935] text-white hover:bg-[#E53935]/90"
                  disabled={
                    (step === 1 && !businessType) ||
                    (step === 2 && timeConsumers.length === 0)
                  }
                  onClick={() => setStep((s) => s + 1)}
                  data-testid="button-onb-next"
                >
                  {t("onb.next")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="bg-[#E53935] text-white hover:bg-[#E53935]/90"
                  disabled={configIdx < 5}
                  onClick={() => setLocation("/hub/app")}
                  data-testid="button-onb-finish"
                >
                  {t("onb.finish")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </section>
    </HubLayout>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mx-auto mt-8 flex max-w-md items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < step ? "bg-[#E53935]" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function Step1({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{question}</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`group rounded-md border p-5 text-left transition ${
                active
                  ? "border-[#E53935] bg-[#E53935]/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
              }`}
              data-testid={`button-step1-${o.value}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{o.label}</span>
                {active && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E53935]">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step2({
  question,
  hint,
  options,
  value,
  onToggle,
}: {
  question: string;
  hint: string;
  options: { value: string; label: string }[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{question}</h2>
      <p className="mt-1 text-xs text-white/50">{hint}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              onClick={() => onToggle(o.value)}
              className={`rounded-md border px-4 py-2.5 text-sm transition ${
                active
                  ? "border-[#E53935] bg-[#E53935]/15 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:bg-white/[0.05]"
              }`}
              data-testid={`button-step2-${o.value}`}
            >
              {active && <Check className="mr-1 inline h-3 w-3 text-[#E53935]" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step3({
  title,
  done,
  steps,
  idx,
}: {
  title: string;
  done: string;
  steps: string[];
  idx: number;
}) {
  const finished = idx >= 5;
  return (
    <div>
      <div className="flex items-center gap-3">
        {finished ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E53935]/15 ring-1 ring-[#E53935]/30">
            <Sparkles className="h-5 w-5 text-[#E53935]" />
          </div>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-[#E53935]" />
        )}
        <h2 className="text-xl font-semibold text-white">
          {finished ? done : title}
        </h2>
      </div>
      <ul className="mt-6 space-y-3">
        {steps.map((s, i) => {
          const state = i < idx ? "done" : i === idx ? "active" : "todo";
          return (
            <li
              key={s}
              className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-4 py-3"
              data-testid={`step3-row-${i}`}
            >
              {state === "done" && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E53935]">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {state === "active" && (
                <Loader2 className="h-5 w-5 animate-spin text-[#E53935]" />
              )}
              {state === "todo" && (
                <div className="h-5 w-5 rounded-full border border-white/15" />
              )}
              <span
                className={`text-sm ${
                  state === "todo" ? "text-white/40" : "text-white"
                }`}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
