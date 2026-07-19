import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2, Edit3, Shield, Plus, FileImage, Film, Eye, Sparkles, Users as UsersIcon } from "lucide-react";

interface DocumentRow {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  fileType: string;
  templateKey?: string | null;
  language?: string | null;
  fields?: any;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface AccessRow {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  permission: string;
  grantedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  contract: "Verträge",
  inventory: "Inventar",
  form: "Formulare",
  photo: "Fotos",
  video: "Videos",
  other: "Sonstige",
};
const FILETYPE_ICON: Record<string, any> = {
  pdf: FileText, image: FileImage, video: Film, template: FileText, other: FileText,
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || "");
      resolve(r.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DocumentsLibrary() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [editing, setEditing] = useState<DocumentRow | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery<DocumentRow[]>({
    queryKey: ["/api/admin/documents"],
  });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { data: accessList = [] } = useQuery<AccessRow[]>({
    queryKey: ["/api/admin/document-access"],
    enabled: accessOpen,
  });

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (categoryFilter !== "__all__" && d.category !== categoryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!d.title.toLowerCase().includes(s) && !(d.description || "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [documents, search, categoryFilter]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Dokument gelöscht" });
    },
  });

  const handleDownload = (doc: DocumentRow) => {
    window.open(`/api/admin/documents/${doc.id}/file`, "_blank");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Dokumentenbibliothek
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Verträge, Formulare, Fotos, Videos und Inventar – zentral und KI-bearbeitbar.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setAccessOpen(true)} data-testid="button-manage-access">
              <Shield className="w-4 h-4 mr-1" /> Zugriff verwalten
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)} data-testid="button-upload-document">
              <Upload className="w-4 h-4 mr-1" /> Datei hochladen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
              data-testid="input-search-documents"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle Kategorien</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filtered.length} Einträge</Badge>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Lade Dokumente...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Dokumente gefunden.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((doc) => {
                const Icon = FILETYPE_ICON[doc.fileType] || FileText;
                const isTemplate = doc.fileType === "template";
                return (
                  <Card key={doc.id} className="hover-elevate" data-testid={`card-document-${doc.id}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[doc.category] || doc.category}</Badge>
                            {doc.language && <Badge variant="outline" className="text-[10px] uppercase">{doc.language}</Badge>}
                            {isTemplate && <Badge className="text-[10px] bg-blue-500/15 text-blue-500 border-blue-500/30">Template</Badge>}
                          </div>
                        </div>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                      )}
                      <div className="flex gap-1 pt-1 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc)} data-testid={`button-download-${doc.id}`}>
                          <Download className="w-3.5 h-3.5 mr-1" /> {isTemplate ? "PDF" : "Öffnen"}
                        </Button>
                        {(isTemplate || doc.fields) && (
                          <Button size="sm" variant="outline" onClick={() => setEditing(doc)} data-testid={`button-edit-${doc.id}`}>
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Felder
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`"${doc.title}" wirklich löschen?`)) deleteMut.mutate(doc.id);
                          }}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <DocumentFieldEditor
          doc={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <AccessManagementDialog open={accessOpen} onClose={() => setAccessOpen(false)} users={users} accessList={accessList} />
    </div>
  );
}

const CONTRACT_DEFAULT_FIELDS: Record<string, any> = {
  partnerCompany: "",
  partnerRepresentative: "",
  partnerAddress: "",
  partnerEmail: "",
  partnerPhone: "",
  partnerTaxNumber: "",
  model: "B",
  materialDeductionPct: 20,
  onboardingFeeEur: 300,
  paymentDays: 5,
  contractDate: new Date().toISOString().slice(0, 10),
  startDate: new Date().toISOString().slice(0, 10),
};

function DocumentFieldEditor({ doc, onClose }: { doc: DocumentRow; onClose: () => void }) {
  const { toast } = useToast();
  const initialFields =
    doc.templateKey === "contract_franchise_b_c"
      ? { ...CONTRACT_DEFAULT_FIELDS, ...(doc.fields || {}) }
      : (doc.fields || {});
  const [fields, setFields] = useState<Record<string, any>>(initialFields);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const saveMut = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", `/api/admin/documents/${doc.id}`, { fields }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Gespeichert" });
      onClose();
    },
  });

  const handleAiFill = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const res: any = await apiRequest("POST", "/api/ai/extract-fields", {
        text: aiPrompt,
        targetFields: Object.keys(fields),
      });
      const json = await res.json().catch(() => null);
      if (json?.fields) {
        setFields((prev) => ({ ...prev, ...json.fields }));
        toast({ title: "KI-Felder eingefügt" });
      } else {
        toast({ title: "Keine Felder erkannt", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "KI-Fehler", description: e?.message, variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  const fieldKeys = Object.keys(fields);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" /> {doc.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-blue-500/5 border-blue-500/30">
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-500" /> KI-Assistent
              </p>
              <Textarea
                placeholder="Text aus E-Mail, Visitenkarte oder Notiz einfügen, um Felder automatisch zu erkennen..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                data-testid="input-ai-prompt"
              />
              <Button size="sm" onClick={handleAiFill} disabled={aiBusy || !aiPrompt.trim()} data-testid="button-ai-fill">
                <Sparkles className="w-4 h-4 mr-1" /> {aiBusy ? "Analysiere..." : "Felder ausfüllen"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fieldKeys.map((key) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{key}</Label>
                <Input
                  value={fields[key] ?? ""}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      [key]: typeof fields[key] === "number" ? Number(e.target.value) : e.target.value,
                    }))
                  }
                  data-testid={`input-field-${key}`}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} data-testid="button-save-fields">
            {saveMut.isPending ? "Speichert..." : "Speichern"}
          </Button>
          <Button variant="default" onClick={() => window.open(`/api/admin/documents/${doc.id}/file`, "_blank")} data-testid="button-preview-pdf">
            <Eye className="w-4 h-4 mr-1" /> PDF Vorschau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setTitle(""); setDescription(""); setCategory("other"); setFile(null); };

  const handleUpload = async () => {
    if (!file || !title) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Datei zu groß (max. 20 MB)", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const fileContent = await fileToBase64(file);
      const fileType = file.type.startsWith("image/") ? "image"
        : file.type.startsWith("video/") ? "video"
        : file.type === "application/pdf" ? "pdf" : "other";
      await apiRequest("POST", "/api/admin/documents", {
        title, description, category, fileType,
        fileContent, fileName: file.name, mimeType: file.type,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Hochgeladen" });
      reset();
      onClose();
    } catch (e: any) {
      toast({ title: "Upload-Fehler", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); }}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Datei hochladen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-upload-title" />
          </div>
          <div>
            <Label className="text-xs">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} data-testid="input-upload-description" />
          </div>
          <div>
            <Label className="text-xs">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-upload-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Datei (max. 20 MB)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} data-testid="input-upload-file" />
            {file && <p className="text-xs text-muted-foreground mt-1">{file.name} – {(file.size / 1024).toFixed(1)} KB</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Abbrechen</Button>
          <Button onClick={handleUpload} disabled={busy || !file || !title} data-testid="button-confirm-upload">
            {busy ? "Lädt hoch..." : "Hochladen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccessManagementDialog({ open, onClose, users, accessList }: { open: boolean; onClose: () => void; users: any[]; accessList: AccessRow[] }) {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [permission, setPermission] = useState<string>("view");

  const grantedIds = new Set(accessList.map((a) => a.userId));
  const candidates = users.filter((u) => u.role !== "admin" && !grantedIds.has(u.id));

  const grantMut = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/admin/document-access", { userId: selectedUser, permission }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/document-access"] });
      toast({ title: "Zugriff gewährt" });
      setSelectedUser("");
    },
  });

  const revokeMut = useMutation({
    mutationFn: async (userId: string) =>
      apiRequest("DELETE", `/api/admin/document-access/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/document-access"] });
      toast({ title: "Zugriff entzogen" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Zugriff auf Dokumentenbibliothek
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Admins haben automatisch Zugriff. Hier können Sie weitere Benutzer einzeln berechtigen.
          </p>

          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-semibold">Neuen Benutzer berechtigen</p>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="flex-1 min-w-[200px]" data-testid="select-grant-user">
                    <SelectValue placeholder="Benutzer wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.length === 0 && <div className="text-xs text-muted-foreground p-2">Alle Nicht-Admins haben bereits Zugriff oder es gibt keine.</div>}
                    {candidates.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.email} ({u.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-32" data-testid="select-grant-permission"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Lesen</SelectItem>
                    <SelectItem value="edit">Bearbeiten</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => grantMut.mutate()} disabled={!selectedUser || grantMut.isPending} data-testid="button-grant-access">
                  <Plus className="w-4 h-4 mr-1" /> Hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1">
              <UsersIcon className="w-4 h-4" /> Berechtigte Benutzer ({accessList.length})
            </p>
            {accessList.length === 0 ? (
              <p className="text-xs text-muted-foreground">Noch keine zusätzlichen Berechtigungen.</p>
            ) : (
              <div className="space-y-1">
                {accessList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30" data-testid={`row-access-${a.userId}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.userName || a.userEmail}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.userEmail} – {a.userRole}</p>
                    </div>
                    <Badge variant={a.permission === "edit" ? "default" : "secondary"} className="mr-2">
                      {a.permission === "edit" ? "Bearbeiten" : "Lesen"}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => revokeMut.mutate(a.userId)} data-testid={`button-revoke-${a.userId}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
