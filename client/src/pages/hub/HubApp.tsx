import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Megaphone,
  MessageSquare,
  Wrench,
  Calculator,
  Camera,
  LayoutGrid,
  Wallet,
  Receipt,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HubLayout } from "@/components/hub/HubLayout";
import { useHubI18n } from "@/lib/hubI18n";
import { useAuth } from "@/hooks/use-auth";
import type { HubOnboardingState } from "./HubOnboarding";

const STORAGE_KEY = "hubplus.onboarding";

const RECOMMEND_MAP: Record<string, { icon: any; label: string; href: string }> =
  {
    calls: { icon: MessageSquare, label: "Customer Assistant", href: "/agent-hub" },
    quotes: { icon: Calculator, label: "Auftrag Calculator", href: "/hub/auftrag" },
    inspections: { icon: Camera, label: "Gutachter Funnel", href: "/gutachter-funnel" },
    bookkeeping: { icon: Receipt, label: "CFO Inbox", href: "/cfo-inbox" },
    marketing: { icon: Megaphone, label: "Marketing Assistant", href: "/agent-hub" },
  };

const TOOLS = [
  { icon: LayoutGrid, label: "Admin Dashboard", href: "/admin" },
  { icon: Wrench, label: "Partner Hub", href: "/partner-hub" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: Calculator, label: "Finanzen", href: "/finanzen" },
  { icon: Camera, label: "Reception", href: "/reception" },
  { icon: Receipt, label: "Aufträge", href: "/auftraege" },
];

export default function HubApp() {
  const { t } = useHubI18n();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [onb, setOnb] = useState<HubOnboardingState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setOnb(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const recommended = (onb?.timeConsumers ?? []).map((k) => RECOMMEND_MAP[k]).filter(
    Boolean
  );

  return (
    <HubLayout variant="minimal">
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(229,57,53,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">
                {t("app.welcome")}
              </p>
              <h1
                className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                data-testid="text-app-title"
              >
                {t("app.title")}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {isLoading
                  ? "…"
                  : user
                    ? user.email ?? user.id
                    : t("app.guest")}
              </p>
            </div>
            {onb?.businessType && (
              <Badge className="border-[#E53935]/30 bg-[#E53935]/10 text-[#E53935]">
                {onb.businessType}
              </Badge>
            )}
          </div>

          {!user && !isLoading && (
            <Card className="mt-8 border-[#E53935]/30 bg-[#E53935]/[0.06] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E53935]/15 ring-1 ring-[#E53935]/30">
                    <LogIn className="h-5 w-5 text-[#E53935]" />
                  </div>
                  <p className="text-sm text-white">{t("app.signin_required")}</p>
                </div>
                <Button
                  className="bg-[#E53935] text-white hover:bg-[#E53935]/90"
                  onClick={() => setLocation("/hub/portal")}
                  data-testid="button-app-signin"
                >
                  {t("app.go_signin")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {recommended.length > 0 && (
            <div className="mt-12">
              <p className="text-xs uppercase tracking-widest text-white/50">
                {t("app.based_on")}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((r) => (
                  <button
                    key={r.href + r.label}
                    onClick={() => setLocation(r.href)}
                    className="group flex items-center gap-4 rounded-md border border-[#E53935]/25 bg-gradient-to-br from-[#E53935]/[0.08] to-transparent p-5 text-left transition hover:border-[#E53935]/50"
                    data-testid={`card-recommend-${r.label}`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#E53935]/15 ring-1 ring-[#E53935]/30">
                      <r.icon className="h-5 w-5 text-[#E53935]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">
                        {r.label}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-[#E53935]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12">
            <p className="text-xs uppercase tracking-widest text-white/50">
              {t("app.tools")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {TOOLS.map((tool) => (
                <button
                  key={tool.href}
                  onClick={() => setLocation(tool.href)}
                  className="group flex flex-col items-start gap-3 rounded-md border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-white/25 hover:bg-white/[0.05]"
                  data-testid={`card-tool-${tool.label}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
                    <tool.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </HubLayout>
  );
}
