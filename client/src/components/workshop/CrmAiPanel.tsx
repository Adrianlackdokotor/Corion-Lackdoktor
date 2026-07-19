import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, ExternalLink, Copy, Trash2, Plus, Loader2, AlertTriangle, Clock, Check, X,
  Building2, Shield, Car, MessageSquare, Mail, FolderOpen, FileText, ListChecks, Globe, Tag,
} from "lucide-react";

const LINK_KINDS = [
  { value: "customer_crm", label: "Kunde (CRM)", icon: Building2 },
  { value: "insurance", label: "Versicherung", icon: Shield },
  { value: "leasing", label: "Leasing", icon: Car },
  { value: "whatsapp", label: "WhatsApp Chat", icon: MessageSquare },
  { value: "email", label: "E-Mail Thread", icon: Mail },
  { value: "drive", label: "Google Drive", icon: FolderOpen },
  { value: "gutachten", label: "Gutachten", icon: FileText },
  { value: "hub_task", label: "Hub Task", icon: ListChecks },
  { value: "partner_system", label: "Partner-System", icon: Globe },
  { value: "other", label: "Sonstiges", icon: Tag },
] as const;

const FU_REASONS = [
  { value: "waiting_customer", label: "Kunde antwortet nicht" },
  { value: "waiting_insurance", label: "Versicherung wartet auf Gutachten" },
  { value: "waiting_partner", label: "Partner hat Termin nicht bestätigt" },
  { value: "waiting_gutachter", label: "Gutachter prüft" },
  { value: "offer_followup", label: "Angebot gesendet, nicht geöffnet" },
  { value: "other", label: "Sonstiges" },
] as const;

const URGENCY_STYLE: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  normal: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  high: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  urgent: "bg-red-500/15 text-red-500 border-red-500/30",
};

function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function relative(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} h`;
  const days = Math.round(h / 24);
  return `vor ${days} Tagen`;
}

type CrmBundle = {
  links: any[];
  followUps: any[];
  insight: any | null;
  events: any[];
};

export default function CrmAiPanel({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const [linkDialog, setLinkDialog] = useState(false);
  const [fuDialog, setFuDialog] = useState(false);
  const [linkForm, setLinkForm] = useState({ kind: "insurance", label: "", url: "", notes: "" });
  const [fuForm, setFuForm] = useState({
    reason: "waiting_customer",
    message: "",
    dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });

  const crmKey = ["/api/workshop/orders", orderId, "crm"] as const;
  const { data, isLoading } = useQuery<CrmBundle>({ queryKey: crmKey, enabled: !!orderId });

  const refresh = () => queryClient.invalidateQueries({ queryKey: crmKey });

  const generateInsight = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", `/api/workshop/orders/${orderId}/crm/insights/generate`, {})).json(),
    onSuccess: (res: any) => {
      toast({
        title: "AI-Analyse aktualisiert",
        description: res.source === "ai" ? "GPT-4o-mini hat den Case bewertet." : "Heuristische Analyse (kein AI-Key).",
      });
      refresh();
    },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });
  const addLink = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", `/api/workshop/orders/${orderId}/crm/links`, linkForm)).json(),
    onSuccess: () => { setLinkDialog(false); setLinkForm({ kind: "insurance", label: "", url: "", notes: "" }); refresh(); },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });
  const removeLink = useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest("DELETE", `/api/workshop/orders/${orderId}/crm/links/${id}`)).json(),
    onSuccess: refresh,
    onError: (e: any) => toast({ title: "Löschen fehlgeschlagen", description: e?.message, variant: "destructive" }),
  });
  const addFu = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/workshop/orders/${orderId}/crm/follow-ups`, {
      ...fuForm, dueAt: new Date(fuForm.dueAt).toISOString(), source: "human", status: "open",
    })).json(),
    onSuccess: () => { setFuDialog(false); setFuForm({ reason: "waiting_customer", message: "", dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16) }); refresh(); },
    onError: (e: any) => toast({ title: "Fehler", description: e?.message, variant: "destructive" }),
  });
  const completeFu = useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest("PATCH", `/api/workshop/orders/${orderId}/crm/follow-ups/${id}`, { status: "done" })).json(),
    onSuccess: refresh,
    onError: (e: any) => toast({ title: "Aktualisierung fehlgeschlagen", description: e?.message, variant: "destructive" }),
  });
  const deleteFu = useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest("DELETE", `/api/workshop/orders/${orderId}/crm/follow-ups/${id}`)).json(),
    onSuccess: refresh,
    onError: (e: any) => toast({ title: "Löschen fehlgeschlagen", description: e?.message, variant: "destructive" }),
  });

  const insight = data?.insight;
  const links = data?.links ?? [];
  const followUps = data?.followUps ?? [];
  const events = data?.events ?? [];

  const overdueFu = useMemo(
    () => followUps.find((f: any) => f.status === "open" && new Date(f.dueAt) < new Date()),
    [followUps],
  );

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> CRM lädt…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="panel-crm-ai">
      {/* AI Summary — sticky on desktop */}
      <Card className="lg:col-span-1 lg:sticky lg:top-4 self-start">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Case Assistant</CardTitle>
          <Button size="sm" variant="outline" onClick={() => generateInsight.mutate()} disabled={generateInsight.isPending} data-testid="button-ai-generate">
            {generateInsight.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Neu analysieren"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {insight ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`border ${URGENCY_STYLE[insight.urgency] ?? URGENCY_STYLE.normal}`} data-testid="badge-urgency">
                  {insight.urgency.toUpperCase()}
                </Badge>
                <Badge variant="outline">Close-Wahrscheinlichkeit: {insight.closeProbability ?? "—"}%</Badge>
                <Badge variant="outline">Stimmung: {insight.sentiment}</Badge>
              </div>
              <p className="leading-relaxed" data-testid="text-ai-summary">{insight.summary}</p>
              {insight.nextAction && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="text-xs font-semibold text-primary mb-1">Nächster Schritt</div>
                  <div className="text-sm">{insight.nextAction}</div>
                </div>
              )}
              {insight.riskFlags?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold flex items-center gap-1 text-amber-500"><AlertTriangle className="h-3 w-3" /> Risiken</div>
                  {insight.riskFlags.map((f: string, i: number) => (
                    <div key={i} className="text-xs">• {f}</div>
                  ))}
                </div>
              )}
              {insight.missingInfo?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">Fehlende Informationen</div>
                  {insight.missingInfo.map((f: string, i: number) => (
                    <div key={i} className="text-xs">• {f}</div>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground pt-2 border-t">Aktualisiert {relative(insight.generatedAt)}</div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground space-y-3">
              <Sparkles className="h-8 w-8 mx-auto opacity-50" />
              <p className="text-sm">Noch keine AI-Analyse erstellt.</p>
              <Button size="sm" onClick={() => generateInsight.mutate()} disabled={generateInsight.isPending} data-testid="button-ai-first">
                <Sparkles className="h-3 w-3 mr-1" /> Jetzt analysieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right column — Links + Follow-Ups + Timeline */}
      <div className="lg:col-span-2 space-y-4">
        {/* CRM Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-base">CRM & Links ({links.length})</CardTitle>
            <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-add-link"><Plus className="h-3 w-3 mr-1" /> Link</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Neuen Link hinzufügen</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Typ</label>
                    <Select value={linkForm.kind} onValueChange={(v) => setLinkForm({ ...linkForm, kind: v })}>
                      <SelectTrigger data-testid="select-link-kind"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LINK_KINDS.map((k) => (<SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Bezeichnung</label>
                    <Input value={linkForm.label} onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                      placeholder="z.B. AXA Schadenmeldung #12345" data-testid="input-link-label" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">URL</label>
                    <Input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                      placeholder="https://…" data-testid="input-link-url" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notiz (optional)</label>
                    <Textarea value={linkForm.notes} onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                      rows={2} data-testid="input-link-notes" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => addLink.mutate()} disabled={!linkForm.label || !linkForm.url || addLink.isPending} data-testid="button-save-link">
                    {addLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {links.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">Keine Links hinterlegt.</div>}
            {links.map((l: any) => {
              const meta = LINK_KINDS.find((k) => k.value === l.kind) ?? LINK_KINDS[LINK_KINDS.length - 1];
              const Icon = meta.icon;
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-md border p-2.5 hover-elevate" data-testid={`link-${l.id}`}>
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{meta.label} · {l.url}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(l.url); toast({ title: "Kopiert" }); }} data-testid={`button-copy-${l.id}`}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" asChild data-testid={`button-open-${l.id}`}>
                    <a href={l.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeLink.mutate(l.id)} data-testid={`button-delete-link-${l.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Follow-Ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Follow-Up ({followUps.filter((f: any) => f.status === "open").length})
              {overdueFu && <Badge className="bg-red-500/15 text-red-500 border border-red-500/30">überfällig</Badge>}
            </CardTitle>
            <Dialog open={fuDialog} onOpenChange={setFuDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-add-followup"><Plus className="h-3 w-3 mr-1" /> Erinnerung</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Follow-Up planen</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Grund</label>
                    <Select value={fuForm.reason} onValueChange={(v) => setFuForm({ ...fuForm, reason: v })}>
                      <SelectTrigger data-testid="select-fu-reason"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FU_REASONS.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Nachricht</label>
                    <Textarea value={fuForm.message} onChange={(e) => setFuForm({ ...fuForm, message: e.target.value })}
                      rows={3} placeholder="Z.B. Kunde wegen Gutachten anrufen" data-testid="input-fu-message" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fällig am</label>
                    <Input type="datetime-local" value={fuForm.dueAt} onChange={(e) => setFuForm({ ...fuForm, dueAt: e.target.value })} data-testid="input-fu-due" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => addFu.mutate()} disabled={!fuForm.message || addFu.isPending} data-testid="button-save-fu">
                    {addFu.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUps.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">Keine Erinnerungen.</div>}
            {followUps.map((f: any) => {
              const overdue = f.status === "open" && new Date(f.dueAt) < new Date();
              return (
                <div key={f.id} className={`flex items-start gap-3 rounded-md border p-2.5 ${overdue ? "border-red-500/40 bg-red-500/5" : ""} ${f.status === "done" ? "opacity-60" : ""}`} data-testid={`followup-${f.id}`}>
                  <Clock className={`h-4 w-4 shrink-0 mt-0.5 ${overdue ? "text-red-500" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{f.message}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {FU_REASONS.find((r) => r.value === f.reason)?.label ?? f.reason} · fällig {fmtDateTime(f.dueAt)}
                      {f.source === "ai" && <Badge variant="outline" className="ml-2 text-[10px]">AI</Badge>}
                    </div>
                  </div>
                  {f.status === "open" && (
                    <Button size="icon" variant="ghost" onClick={() => completeFu.mutate(f.id)} data-testid={`button-complete-fu-${f.id}`}>
                      <Check className="h-4 w-4 text-emerald-500" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deleteFu.mutate(f.id)} data-testid={`button-delete-fu-${f.id}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Aktivitäts-Timeline</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground py-3 text-center">Noch keine Aktivität.</div>
            ) : (
              <div className="relative pl-5 space-y-3">
                <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-border" />
                {events.map((e: any) => (
                  <div key={e.id} className="relative" data-testid={`event-${e.id}`}>
                    <div className="absolute -left-3.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                    <div className="text-xs text-muted-foreground">{relative(e.createdAt)} · {e.actorLabel ?? "system"} · <span className="uppercase tracking-wide">{e.kind}</span></div>
                    <div className="text-sm font-medium">{e.title}</div>
                    {e.message && <div className="text-xs text-muted-foreground mt-0.5 break-words">{e.message}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
