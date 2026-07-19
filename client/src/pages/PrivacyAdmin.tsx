import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Briefcase,
  Lock,
  Unlock,
  EyeOff,
  Eye,
  Activity,
  Database,
  KeyRound,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Search,
  Download,
  Pause,
  Play,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";

type AccessLevel = "UNRESTRICTED" | "STRICT" | "LIMITED";

interface AgentProfile {
  id: string;
  emoji: string;
  icon: typeof Shield;
  name: string;
  subtitle: string;
  level: AccessLevel;
  canSee: string[];
  blocked: string[];
  scopeNote: string;
}

const AGENTS: AgentProfile[] = [
  {
    id: "partner-agent",
    emoji: "🛡️",
    icon: ShieldCheck,
    name: "Partner Agent (Adil/Adam)",
    subtitle: "Werkstatt-Partner · Mobile App",
    level: "LIMITED",
    canSee: ["Car Model", "Task", "Payout"],
    blocked: ["Client Address", "Gutachten PDF", "Margin"],
    scopeNote:
      "Scope is reduced to operational fields needed to complete the assigned job.",
  },
  {
    id: "legal-agent",
    emoji: "⚖️",
    icon: Scale,
    name: "Legal Agent (Unfall-Navi)",
    subtitle: "Schadenabwicklung · Gutachter API",
    level: "STRICT",
    canSee: ["Damage Photos", "Gutachten PDF", "Eckdaten"],
    blocked: ["Internal Chat", "Partner Payouts"],
    scopeNote:
      "Read-only access to the case file required for DAT submission. Internal commercials are masked.",
  },
  {
    id: "cfo-corina",
    emoji: "💼",
    icon: Briefcase,
    name: "CFO (Corina)",
    subtitle: "Finance · Compliance Officer",
    level: "UNRESTRICTED",
    canSee: ["ALL DATA"],
    blocked: [],
    scopeNote:
      "Full visibility, hardware-key MFA + immutable audit trail on every read.",
  },
];

const LEVEL_STYLES: Record<
  AccessLevel,
  { label: string; pill: string; ring: string; dot: string }
> = {
  UNRESTRICTED: {
    label: "Access: UNRESTRICTED",
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-400",
  },
  STRICT: {
    label: "Access: STRICT",
    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
  },
  LIMITED: {
    label: "Access: LIMITED",
    pill: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    ring: "ring-rose-500/30",
    dot: "bg-rose-400",
  },
};

type LogKind = "SYSTEM" | "IAM" | "ROUTING" | "ALERT" | "AUDIT";

interface LogEntry {
  ts: string;
  kind: LogKind;
  message: string;
}

const SEED_LOGS: LogEntry[] = [
  {
    ts: "2026-05-02 21:40:02",
    kind: "SYSTEM",
    message: "Cora AI saved Gutachten_DA-MP165E.pdf to secure storage.",
  },
  {
    ts: "2026-05-02 21:40:05",
    kind: "IAM",
    message: "Masked client address in Partner PDF.",
  },
  {
    ts: "2026-05-02 21:43:12",
    kind: "ROUTING",
    message: "Extracted Eckdaten sent to Unfall-Navi via secure API.",
  },
  {
    ts: "2026-05-02 21:44:01",
    kind: "AUDIT",
    message:
      "CFO Corina viewed margin column on order #DA-MP165E (MFA verified).",
  },
  {
    ts: "2026-05-02 21:45:18",
    kind: "IAM",
    message:
      "Partner Agent Adil requested 'client.email' — DENIED by IAM policy P-04.",
  },
  {
    ts: "2026-05-02 21:46:33",
    kind: "SYSTEM",
    message:
      "Encryption key rotation succeeded for tenant corion-hub-prod (KMS).",
  },
  {
    ts: "2026-05-02 21:48:09",
    kind: "ROUTING",
    message:
      "Damage photos forwarded to Legal Agent (Unfall-Navi) — 4 files, EXIF stripped.",
  },
  {
    ts: "2026-05-02 21:50:42",
    kind: "ALERT",
    message:
      "Anomaly: 3 failed logins for partner.adam@corion-hub.de — temporary lock applied.",
  },
  {
    ts: "2026-05-02 21:52:17",
    kind: "AUDIT",
    message:
      "GDPR export generated for client #C-2041 (zip · 12.4 MB · signed).",
  },
];

const LIVE_TEMPLATES: Array<Omit<LogEntry, "ts">> = [
  { kind: "IAM", message: "Masked partner_payout column for Legal Agent query." },
  { kind: "ROUTING", message: "Cora AI dispatched Eckdaten to DAT silo (200 OK)." },
  { kind: "SYSTEM", message: "Backup verified for tenant corion-hub-prod (sha256 ✓)." },
  { kind: "AUDIT", message: "CFO Corina exported P&L slice (last 30d) — signed." },
  { kind: "IAM", message: "Partner Agent Adam requested 'client.address' — DENIED." },
  { kind: "ROUTING", message: "Damage photos shared with Unfall-Navi (EXIF stripped)." },
  { kind: "ALERT", message: "Geo-anomaly login from 185.221.x.x — challenge issued." },
];

const KIND_STYLES: Record<LogKind, { label: string; tone: string }> = {
  SYSTEM: { label: "SYSTEM", tone: "text-sky-300" },
  IAM: { label: "IAM", tone: "text-rose-300" },
  ROUTING: { label: "ROUTING", tone: "text-emerald-300" },
  ALERT: { label: "ALERT", tone: "text-amber-300" },
  AUDIT: { label: "AUDIT", tone: "text-violet-300" },
};

function formatTs(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

interface ServerAuditEvent {
  id: string;
  actor_user_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  meta: any;
  ip: string | null;
  created_at: string;
}

function classifyAction(action: string): LogKind {
  if (action.startsWith("invoice.")) return "AUDIT";
  if (action.startsWith("document.")) return "ROUTING";
  if (action.startsWith("auth.") || action.startsWith("iam.")) return "IAM";
  if (action.startsWith("alert.") || action.includes("denied")) return "ALERT";
  return "SYSTEM";
}

function describeEvent(e: ServerAuditEvent): string {
  const who = e.actor_label ?? e.actor_user_id?.slice(0, 8) ?? "system";
  const meta = e.meta ?? {};
  if (e.action === "document.upload") {
    return `${who} uploaded ${meta.name ?? "file"} → ${meta.category ?? "doc"}`;
  }
  if (e.action === "invoice.extract") {
    return `Cora AI extracted invoice (supplier=${meta.supplierName ?? "?"}, total=${meta.totalCents ?? 0}c)`;
  }
  if (e.action === "invoice.extract_failed") {
    return `AI extract FAILED: ${meta.error ?? "unknown"}`;
  }
  if (e.action === "invoice.approve") {
    return `${who} APPROVED invoice (${meta.supplier ?? "?"}, ${meta.totalCents ?? 0}c)`;
  }
  if (e.action === "invoice.reject") {
    return `${who} REJECTED invoice (${meta.supplier ?? "?"}): ${meta.reason ?? ""}`;
  }
  return `${who} · ${e.action} · ${e.entity_type}${e.entity_id ? `#${e.entity_id.slice(0, 8)}` : ""}`;
}

function tsFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatTs(d);
}

export default function PrivacyAdmin() {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthorized = !!user && (user.role === "admin" || user.role === "cfo");

  const [streaming, setStreaming] = useState(true);
  const [filter, setFilter] = useState<LogKind | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [piiMasked, setPiiMasked] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  const auditQuery = useQuery<{ events: ServerAuditEvent[] }>({
    queryKey: ["/api/audit-logs", { limit: 100 }],
    queryFn: async () => {
      const res = await fetch("/api/audit-logs?limit=100", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: streaming ? 10_000 : false,
    enabled: isAuthorized,
  });

  if (authLoading) return null;
  if (!isAuthorized) return <Redirect to="/" />;

  const logs: LogEntry[] = useMemo(() => {
    const events = auditQuery.data?.events ?? [];
    if (events.length === 0) return SEED_LOGS;
    return events.map((e) => ({
      ts: tsFromIso(e.created_at),
      kind: classifyAction(e.action),
      message: describeEvent(e),
    }));
  }, [auditQuery.data]);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filter !== "ALL" && l.kind !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !l.message.toLowerCase().includes(q) &&
          !l.kind.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, filter, query]);

  const counts = useMemo(() => {
    return {
      iam: logs.filter((l) => l.kind === "IAM").length,
      routing: logs.filter((l) => l.kind === "ROUTING").length,
      alert: logs.filter((l) => l.kind === "ALERT").length,
      audit: logs.filter((l) => l.kind === "AUDIT").length,
      total: logs.length,
    };
  }, [logs]);

  const filterChips: Array<{ value: LogKind | "ALL"; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "SYSTEM", label: "System" },
    { value: "IAM", label: "IAM" },
    { value: "ROUTING", label: "Routing" },
    { value: "AUDIT", label: "Audit" },
    { value: "ALERT", label: "Alerts" },
  ];

  return (
    <div
      className="min-h-screen bg-[#0B0D10] text-white"
      data-testid="page-privacy-admin"
    >
      <Helmet>
        <title>Data Privacy & IAM · Corion Hub</title>
        <meta
          name="description"
          content="Corion Hub Identity Access Management — agent-level scopes, GDPR audit log, and live access enforcement."
        />
      </Helmet>

      {/* Top control-room band */}
      <div className="border-b border-white/5 bg-gradient-to-b from-[#15181D] to-[#0B0D10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-rose-400/80">
                <Shield className="w-3.5 h-3.5" />
                Restricted area · Tier 0
              </div>
              <h1
                className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
                data-testid="text-privacy-title"
              >
                CORION HUB - DATA PRIVACY & IAM (Identity Access Management)
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label="System Health"
                value="ALL GREEN"
                tone="emerald"
                icon={CheckCircle2}
              />
              <StatusPill
                label="GDPR"
                value="COMPLIANT"
                tone="emerald"
                icon={ShieldCheck}
              />
              <StatusPill
                label="Region"
                value="EU-WEST-1"
                tone="slate"
                icon={Server}
              />
              <StatusPill
                label="MFA"
                value="ENFORCED"
                tone="rose"
                icon={KeyRound}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <KpiTile
              icon={Lock}
              label="Active scopes"
              value="14"
              foot="across 3 agent classes"
            />
            <KpiTile
              icon={EyeOff}
              label="Fields masked / 24h"
              value="287"
              foot="PII + financial"
            />
            <KpiTile
              icon={Activity}
              label="Routed events / 24h"
              value="1 942"
              foot="mTLS + signed"
            />
            <KpiTile
              icon={AlertTriangle}
              label="Open incidents"
              value="0"
              foot="last alert 2h ago"
              tone="emerald"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section: Agent Sandbox */}
        <section data-testid="section-agent-sandbox">
          <SectionHeader
            eyebrow="Agent Sandbox"
            title="Active Access Levels"
            description="Live snapshot of what each AI agent and role can read inside the Corion data lake. Scopes are enforced by IAM policies, not by the UI."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Section: IAM Policy Toggles (read-only mock) */}
        <section data-testid="section-policy-toggles">
          <SectionHeader
            eyebrow="Policy Switches"
            title="Live IAM Guards"
            description="High-level guards enforced by the platform. Toggling here would normally schedule a signed change — disabled in this demo."
          />

          <Card className="mt-4 bg-[#101317] border-white/10 text-white p-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              <PolicyRow
                icon={EyeOff}
                title="Mask PII in agent prompts"
                detail="Names, emails, addresses redacted before LLM call."
                checked={piiMasked}
                onChange={setPiiMasked}
                testId="toggle-mask-pii"
              />
              <PolicyRow
                icon={Lock}
                title="Block partner export of Gutachten PDF"
                detail="Partners can preview, never download originals."
                checked
                disabled
                testId="toggle-block-gutachten"
              />
              <PolicyRow
                icon={Database}
                title="Encrypt-at-rest for damage photos"
                detail="AES-256 + per-tenant KMS keys, EU region."
                checked
                disabled
                testId="toggle-encrypt-photos"
              />
              <PolicyRow
                icon={Activity}
                title="Forward every read to immutable audit log"
                detail="Append-only, 7-year retention, hash-chained."
                checked
                disabled
                testId="toggle-audit-reads"
              />
            </div>
          </Card>
        </section>

        {/* Section: Audit Log Terminal */}
        <section data-testid="section-audit-log">
          <SectionHeader
            eyebrow="Audit Trail"
            title="Live Event Stream"
            description="Real-time feed of automated decisions taken by Cora AI and the IAM enforcer. Use this view to demonstrate GDPR compliance to auditors."
          />

          <Card className="mt-4 bg-black/70 border-white/10 text-white p-0 overflow-hidden">
            {/* Terminal chrome */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#0F1216]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[11px] font-mono text-white/60 truncate">
                  corion-hub://iam/audit-log · {counts.total} events
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      streaming ? "bg-emerald-400 animate-pulse" : "bg-white/30"
                    }`}
                  />
                  {streaming ? "LIVE" : "PAUSED"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter log…"
                    className="h-9 pl-7 w-44 bg-[#0B0D10] border-white/10 text-xs font-mono text-white placeholder:text-white/30"
                    data-testid="input-log-search"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStreaming((s) => !s)}
                  className="border-white/15 text-white gap-1.5"
                  data-testid="button-stream-toggle"
                >
                  {streaming ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Resume
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15 text-white gap-1.5"
                  data-testid="button-export-log"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="px-4 py-2 border-b border-white/10 bg-[#0B0D10] flex items-center gap-1.5 overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-white/40 shrink-0" />
              {filterChips.map((chip) => {
                const active = filter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setFilter(chip.value)}
                    className={`shrink-0 px-2.5 h-7 rounded-md text-[11px] font-semibold uppercase tracking-wider hover-elevate active-elevate-2 ${
                      active
                        ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
                        : "bg-white/5 text-white/60"
                    }`}
                    data-testid={`chip-filter-${chip.value.toLowerCase()}`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Terminal body */}
            <div
              ref={terminalRef}
              className="max-h-[460px] overflow-y-auto font-mono text-[12px] leading-relaxed bg-black/80"
              data-testid="terminal-log"
            >
              {filteredLogs.length === 0 ? (
                <div className="px-4 py-10 text-center text-white/40">
                  No events match your filter.
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  const tone = KIND_STYLES[log.kind];
                  return (
                    <motion.div
                      key={`${log.ts}-${idx}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className="grid grid-cols-[auto_auto_1fr] items-start gap-2 px-4 py-1.5 border-b border-white/5 hover:bg-white/[0.02]"
                      data-testid={`log-entry-${idx}`}
                    >
                      <span className="text-white/40 select-none">
                        [{log.ts}]
                      </span>
                      <span
                        className={`font-bold uppercase tracking-wider ${tone.tone}`}
                      >
                        {tone.label}:
                      </span>
                      <span className="text-white/85">{log.message}</span>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Terminal footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-[#0F1216] text-[10px] font-mono text-white/40 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Clock3 className="w-3 h-3" />
                Append-only · hash-chained · 7-year retention
              </span>
              <span>
                IAM:{counts.iam} · ROUTING:{counts.routing} · AUDIT:
                {counts.audit} · ALERT:{counts.alert}
              </span>
            </div>
          </Card>
        </section>

        <p className="text-center text-[11px] text-white/30 pt-4">
          Corion Hub IAM v1.0 · This view is read-only by design. Policy changes
          require dual-control approval.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-rose-400/80">
        <Zap className="w-3 h-3" />
        {eyebrow}
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-white/50 max-w-3xl">{description}</p>
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "slate";
  icon: typeof Shield;
}) {
  const tones = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    slate: "bg-white/5 text-white/70 border-white/10",
  } as const;
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 h-9 rounded-md border ${tones[tone]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] uppercase tracking-wider text-white/50">
        {label}
      </span>
      <span className="text-[11px] font-bold tracking-wider">{value}</span>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  foot,
  tone = "default",
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  foot: string;
  tone?: "default" | "emerald";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-[#101317] p-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-7 h-7 rounded-md flex items-center justify-center ${
            tone === "emerald"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-white/50">
          {label}
        </span>
      </div>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-[10px] text-white/40">{foot}</p>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentProfile }) {
  const Icon = agent.icon;
  const styles = LEVEL_STYLES[agent.level];
  const isUnrestricted = agent.level === "UNRESTRICTED";

  return (
    <Card
      className={`bg-[#101317] border-white/10 text-white p-5 flex flex-col gap-4 ring-1 ${styles.ring}`}
      data-testid={`card-agent-${agent.id}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`w-11 h-11 rounded-md flex items-center justify-center text-xl ${
            isUnrestricted
              ? "bg-emerald-500/15"
              : agent.level === "STRICT"
                ? "bg-amber-500/15"
                : "bg-rose-500/15"
          }`}
        >
          {agent.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{agent.name}</p>
          <p className="text-[11px] text-white/50 truncate">{agent.subtitle}</p>
        </div>
        <Icon className="w-4 h-4 text-white/40 shrink-0" />
      </div>

      <Badge
        variant="outline"
        className={`self-start ${styles.pill} text-[10px] tracking-[0.18em] font-bold`}
        data-testid={`badge-level-${agent.id}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`} />
        {styles.label}
      </Badge>

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-emerald-300/80">
            <Eye className="w-3 h-3" /> Can see
          </div>
          <div className="flex flex-wrap gap-1.5" data-testid={`list-allowed-${agent.id}`}>
            {agent.canSee.map((scope) => (
              <Badge
                key={scope}
                variant="outline"
                className="bg-emerald-500/10 text-emerald-200 border-emerald-500/25 text-[10px] font-mono"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {scope}
              </Badge>
            ))}
          </div>
        </div>

        {agent.blocked.length > 0 ? (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-rose-300/80">
              <EyeOff className="w-3 h-3" /> Blocked
            </div>
            <div className="flex flex-wrap gap-1.5" data-testid={`list-blocked-${agent.id}`}>
              {agent.blocked.map((scope) => (
                <Badge
                  key={scope}
                  variant="outline"
                  className="bg-rose-500/10 text-rose-200 border-rose-500/25 text-[10px] font-mono"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/90">
            <Unlock className="w-3.5 h-3.5" />
            No restrictions · audit-traced
          </div>
        )}
      </div>

      <div className="text-[11px] text-white/55 border-t border-white/5 pt-3 flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-white/40 mt-0.5 shrink-0" />
        <span>{agent.scopeNote}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-white/10 text-white/80 justify-between"
        data-testid={`button-inspect-${agent.id}`}
      >
        Inspect policy
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
}

function PolicyRow({
  icon: Icon,
  title,
  detail,
  checked,
  disabled,
  onChange,
  testId,
}: {
  icon: typeof Shield;
  title: string;
  detail: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-9 h-9 rounded-md bg-white/5 text-white/70 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-[11px] text-white/50">{detail}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        data-testid={testId}
      />
    </div>
  );
}
