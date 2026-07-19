import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, RefreshCw, Trash2, Copy, Truck, KeyRound,
  Webhook, ShieldCheck, Activity, Eye, EyeOff,
} from "lucide-react";

interface Fleet {
  id: string;
  slug: string;
  name: string;
  contact_email: string | null;
  webhook_url: string | null;
  gdpr_allow_full_pii: boolean;
  gdpr_data_retention_days: number;
  is_active: boolean;
  active_keys: number;
  events_30d: number;
  created_at: string;
}

interface ApiKey {
  id: string;
  key_id: string;
  label: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface FleetEvent {
  id: string;
  direction: "inbound" | "outbound";
  event_type: string;
  method: string | null;
  path: string | null;
  status_code: number | null;
  error_message: string | null;
  repair_request_id: string | null;
  created_at: string;
}

interface Delivery {
  id: string;
  event_type: string;
  status: string;
  attempts: number;
  last_response_code: number | null;
  last_error: string | null;
  next_attempt_at: string;
  delivered_at: string | null;
  created_at: string;
}

export default function FleetAdmin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFleetId, setSelectedFleetId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [secretReveal, setSecretReveal] = useState<{ kind: "api" | "webhook"; keyId?: string; secret: string } | null>(null);

  const fleetsQ = useQuery<Fleet[]>({
    queryKey: ["/api/admin/fleet/partners"],
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "cfo"),
  });

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "cfo")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6"><p className="text-sm text-muted-foreground">Zugriff nur für Admin/CFO.</p></Card>
      </div>
    );
  }

  const fleets = fleetsQ.data ?? [];
  const selected = fleets.find((f) => f.id === selectedFleetId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/admin")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Fleet API · GDPR-konforme Schnittstelle</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fleetsQ.refetch()} data-testid="button-refresh">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Aktualisieren
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-fleet">
              <Plus className="w-3.5 h-3.5 mr-1" /> Neue Flotte
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4" /> Verbundene Flotten
              <Badge variant="outline" className="ml-auto">{fleets.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fleetsQ.isLoading && <Skeleton className="h-20 w-full" />}
            {!fleetsQ.isLoading && fleets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Noch keine Flotten verbunden.
              </p>
            )}
            {fleets.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFleetId(f.id)}
                className={`w-full text-left rounded-md border p-3 hover-elevate ${
                  selectedFleetId === f.id ? "border-primary bg-primary/5" : "border-border"
                }`}
                data-testid={`row-fleet-${f.slug}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{f.slug}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {f.is_active ? (
                      <Badge variant="default" className="text-[10px]">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Inaktiv</Badge>
                    )}
                    {f.gdpr_allow_full_pii && (
                      <Badge variant="outline" className="text-[10px]">Voll-PII</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>{f.active_keys} Keys</span>
                  <span>·</span>
                  <span>{f.events_30d} Events/30d</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Wähle eine Flotte links — oder lege eine neue an, um die GDPR-konforme Verbindung zu konfigurieren.
              </p>
            </Card>
          ) : (
            <FleetDetail fleet={selected} onSecretReveal={setSecretReveal} />
          )}
        </div>
      </main>

      <CreateFleetDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSecretReveal={setSecretReveal}
      />

      <Dialog open={!!secretReveal} onOpenChange={(o) => !o && setSecretReveal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              {secretReveal?.kind === "api" ? "API Key erzeugt" : "Webhook Secret erzeugt"}
            </DialogTitle>
            <DialogDescription>
              Dieses Secret wird <strong>nur einmal</strong> angezeigt. Speichere es sicher.
            </DialogDescription>
          </DialogHeader>
          {secretReveal?.keyId && (
            <div className="space-y-1">
              <Label className="text-xs">Key ID (öffentlich)</Label>
              <div className="font-mono text-xs bg-muted rounded p-2 break-all">{secretReveal.keyId}</div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Secret (geheim)</Label>
            <div className="flex gap-2">
              <code className="flex-1 font-mono text-xs bg-muted rounded p-2 break-all" data-testid="text-secret-reveal">
                {secretReveal?.secret}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (secretReveal?.secret) {
                    navigator.clipboard.writeText(secretReveal.secret);
                    toast({ title: "Kopiert" });
                  }
                }}
                data-testid="button-copy-secret"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretReveal(null)} data-testid="button-close-secret">Verstanden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FleetDetail({
  fleet,
  onSecretReveal,
}: {
  fleet: Fleet;
  onSecretReveal: (s: { kind: "api" | "webhook"; keyId?: string; secret: string }) => void;
}) {
  const { toast } = useToast();
  const keysQ = useQuery<ApiKey[]>({ queryKey: ["/api/admin/fleet/partners", fleet.id, "keys"] });
  const eventsQ = useQuery<FleetEvent[]>({ queryKey: ["/api/admin/fleet/partners", fleet.id, "events"] });
  const deliveriesQ = useQuery<Delivery[]>({ queryKey: ["/api/admin/fleet/partners", fleet.id, "deliveries"] });

  const [newKeyLabel, setNewKeyLabel] = useState("");

  const createKey = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/fleet/partners/${fleet.id}/keys`, {
        label: newKeyLabel || "default",
      });
      return res.json() as Promise<{ keyId: string; secret: string; label: string }>;
    },
    onSuccess: (data) => {
      onSecretReveal({ kind: "api", keyId: data.keyId, secret: data.secret });
      setNewKeyLabel("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fleet/partners", fleet.id, "keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fleet/partners"] });
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => apiRequest("POST", `/api/admin/fleet/keys/${keyId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fleet/partners", fleet.id, "keys"] });
      toast({ title: "Key widerrufen" });
    },
  });

  const rotateWebhook = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/fleet/partners/${fleet.id}/rotate-webhook`);
      return res.json() as Promise<{ webhookSecret: string }>;
    },
    onSuccess: (data) => onSecretReveal({ kind: "webhook", secret: data.webhookSecret }),
  });

  const updateFleet = useMutation({
    mutationFn: async (patch: Partial<Fleet>) =>
      apiRequest("PATCH", `/api/admin/fleet/partners/${fleet.id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fleet/partners"] });
      toast({ title: "Aktualisiert" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="flex-1">
          <CardTitle className="text-lg">{fleet.name}</CardTitle>
          <p className="text-xs text-muted-foreground font-mono mt-1">slug: {fleet.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="active" className="text-xs">Aktiv</Label>
          <Switch
            id="active"
            checked={fleet.is_active}
            onCheckedChange={(v) => updateFleet.mutate({ isActive: v } as any)}
            data-testid="switch-fleet-active"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="settings" data-testid="tab-settings"><ShieldCheck className="w-3.5 h-3.5 mr-1" />Einstellungen</TabsTrigger>
            <TabsTrigger value="keys" data-testid="tab-keys"><KeyRound className="w-3.5 h-3.5 mr-1" />API Keys</TabsTrigger>
            <TabsTrigger value="webhooks" data-testid="tab-webhooks"><Webhook className="w-3.5 h-3.5 mr-1" />Webhooks</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events"><Activity className="w-3.5 h-3.5 mr-1" />Events</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Webhook URL (outbound)</Label>
              <Input
                defaultValue={fleet.webhook_url ?? ""}
                placeholder="https://flotte.example.com/corion-webhook"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (fleet.webhook_url ?? "")) updateFleet.mutate({ webhookUrl: v || null } as any);
                }}
                data-testid="input-webhook-url"
              />
            </div>
            <div className="rounded-md border p-3 bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> GDPR — Volle PII übertragen
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wenn deaktiviert, werden Name/E-Mail/Telefon an diese Flotte pseudonymisiert übertragen.
                  </p>
                </div>
                <Switch
                  checked={fleet.gdpr_allow_full_pii}
                  onCheckedChange={(v) => updateFleet.mutate({ gdprAllowFullPii: v } as any)}
                  data-testid="switch-gdpr-full-pii"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Datenaufbewahrung:</span>
                <Input
                  type="number"
                  defaultValue={fleet.gdpr_data_retention_days}
                  className="h-7 w-24"
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n) && n !== fleet.gdpr_data_retention_days) {
                      updateFleet.mutate({ gdprDataRetentionDays: n } as any);
                    }
                  }}
                  data-testid="input-retention-days"
                />
                <span>Tage</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Key Bezeichnung (z.B. production-2026)"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                data-testid="input-new-key-label"
              />
              <Button
                onClick={() => createKey.mutate()}
                disabled={createKey.isPending}
                data-testid="button-create-key"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Key erzeugen
              </Button>
            </div>
            {keysQ.isLoading && <Skeleton className="h-16 w-full" />}
            <div className="space-y-2">
              {(keysQ.data ?? []).map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                  data-testid={`row-key-${k.key_id}`}
                >
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{k.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{k.key_id}</p>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    {k.last_used_at ? `Zuletzt: ${new Date(k.last_used_at).toLocaleString("de-DE")}` : "Nie genutzt"}
                  </div>
                  {k.revoked_at ? (
                    <Badge variant="secondary">Widerrufen</Badge>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => revokeKey.mutate(k.key_id)} data-testid={`button-revoke-${k.key_id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {(keysQ.data ?? []).length === 0 && !keysQ.isLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Keys.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-3 pt-4">
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Outbound Webhook Secret</p>
                  <p className="text-xs text-muted-foreground">
                    Für HMAC-Signatur ausgehender Events. Rotation alle 90 Tage empfohlen.
                  </p>
                </div>
                <Button size="sm" onClick={() => rotateWebhook.mutate()} disabled={rotateWebhook.isPending} data-testid="button-rotate-webhook">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Rotieren
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Letzte Lieferungen</p>
              {(deliveriesQ.data ?? []).map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-md border p-2.5 text-xs" data-testid={`row-delivery-${d.id}`}>
                  <DeliveryBadge status={d.status} />
                  <span className="font-mono">{d.event_type}</span>
                  <span className="ml-auto text-muted-foreground">
                    {d.attempts}× · {d.last_response_code ?? "—"} · {new Date(d.created_at).toLocaleString("de-DE")}
                  </span>
                </div>
              ))}
              {(deliveriesQ.data ?? []).length === 0 && !deliveriesQ.isLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">Noch keine Lieferungen.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-2 pt-4">
            {(eventsQ.data ?? []).map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-md border p-2.5 text-xs" data-testid={`row-event-${ev.id}`}>
                <Badge
                  variant={ev.direction === "inbound" ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {ev.direction === "inbound" ? "IN" : "OUT"}
                </Badge>
                <span className="font-mono">{ev.event_type}</span>
                {ev.method && <span className="text-muted-foreground">{ev.method} {ev.path}</span>}
                <span className="ml-auto text-muted-foreground">
                  {ev.status_code ?? "—"} · {new Date(ev.created_at).toLocaleString("de-DE")}
                </span>
              </div>
            ))}
            {(eventsQ.data ?? []).length === 0 && !eventsQ.isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">Noch keine Events.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DeliveryBadge({ status }: { status: string }) {
  if (status === "delivered") return <Badge className="bg-emerald-500 hover:bg-emerald-500 text-[10px]">Geliefert</Badge>;
  if (status === "dead") return <Badge variant="destructive" className="text-[10px]">Tot</Badge>;
  if (status === "sending") return <Badge variant="outline" className="text-[10px]">Sendet…</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Wartend</Badge>;
}

function CreateFleetDialog({
  open,
  onClose,
  onSecretReveal,
}: {
  open: boolean;
  onClose: () => void;
  onSecretReveal: (s: { kind: "api" | "webhook"; keyId?: string; secret: string }) => void;
}) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [gdprFull, setGdprFull] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/fleet/partners", {
        slug, name, contactEmail: contactEmail || undefined,
        webhookUrl: webhookUrl || undefined, gdprAllowFullPii: gdprFull,
      });
      return res.json() as Promise<{ webhookSecret: string | null }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fleet/partners"] });
      onClose();
      setSlug(""); setName(""); setContactEmail(""); setWebhookUrl(""); setGdprFull(false);
      if (data.webhookSecret) {
        onSecretReveal({ kind: "webhook", secret: data.webhookSecret });
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Flotte verbinden</DialogTitle>
          <DialogDescription>
            Erzeuge einen Mandanten für ein externes Flottensystem (Leasing, Telematik, Werkstatt-Hub).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Slug</Label>
            <Input
              placeholder="sixt-de"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              data-testid="input-fleet-slug"
            />
          </div>
          <div>
            <Label>Anzeigename</Label>
            <Input
              placeholder="Sixt Leasing GmbH"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-fleet-name"
            />
          </div>
          <div>
            <Label>Kontakt-E-Mail (optional)</Label>
            <Input
              type="email"
              placeholder="api-team@sixt.de"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              data-testid="input-fleet-email"
            />
          </div>
          <div>
            <Label>Webhook URL (optional)</Label>
            <Input
              placeholder="https://…/corion-webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              data-testid="input-fleet-webhook"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Volle PII übertragen</p>
              <p className="text-xs text-muted-foreground">Erfordert vertragliche Grundlage (Art. 6 GDPR).</p>
            </div>
            <Switch checked={gdprFull} onCheckedChange={setGdprFull} data-testid="switch-create-pii" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !slug || !name}
            data-testid="button-confirm-create-fleet"
          >
            {create.isPending ? "Erstelle…" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
