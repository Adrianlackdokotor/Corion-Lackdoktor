import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  MapPin,
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PARTNERSHIP_MODELS, type PartnershipModel } from "@shared/auftragCalc";

type Partner = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  zip: string;
  country: string;
  contactPerson: string;
  status: "pending" | "active" | "suspended";
  defaultPartnershipModel: PartnershipModel;
  defaultPartnerShare: number;
  defaultBdePercent: number;
  dailyCapacity: number;
  notes: string;
  createdAt: string;
};

const STATUS_LABELS: Record<Partner["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-500/20 text-amber-300 border border-amber-500/40" },
  active: { label: "Activ", cls: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" },
  suspended: { label: "Suspendat", cls: "bg-red-500/20 text-red-300 border border-red-500/40" },
};

export default function AdminPartners() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  // Admin gate
  if (!authLoading && (!user || (user as any).role !== "admin")) {
    setLocation("/login?next=/admin/partners");
  }

  const partnersQuery = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    enabled: !!user && (user as any).role === "admin",
  });

  const filtered = useMemo(() => {
    const list = partnersQuery.data ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.city?.toLowerCase().includes(s) ||
        p.email?.toLowerCase().includes(s),
    );
  }, [partnersQuery.data, search]);

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partener șters" });
    },
    onError: (e: any) =>
      toast({ title: "Eroare", description: String(e?.message), variant: "destructive" }),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6"
      data-testid="page-admin-partners"
    >
      {/* HEADER */}
      <header className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/admin/dashboard")}
            className="text-slate-400 hover:text-white p-2"
            data-testid="button-back-admin"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="text-red-500" size={22} />
              Management Parteneri
            </h1>
            <p className="text-slate-400 text-sm">
              Entitățile business cu care lucrăm — modele de cooperare și split financiar.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-900/20"
          data-testid="button-new-partner"
          type="button"
        >
          <Plus size={16} /> Partener Nou
        </button>
      </header>

      {/* SEARCH */}
      <div className="mb-4 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Caută după nume, oraș sau email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
          data-testid="input-search-partners"
        />
      </div>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-partners">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Partener</th>
                <th className="px-4 py-3 text-left">Locație</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Split</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {partnersQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </td>
                </tr>
              )}
              {!partnersQuery.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {search
                      ? "Nu există parteneri care corespund căutării."
                      : "Niciun partener încă. Apasă „Partener Nou\" pentru a începe."}
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const model = PARTNERSHIP_MODELS[p.defaultPartnershipModel];
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/40 transition-colors"
                    data-testid={`row-partner-${p.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white" data-testid={`text-name-${p.id}`}>
                        {p.name}
                      </div>
                      {p.contactPerson && (
                        <div className="text-xs text-slate-500">{p.contactPerson}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {p.city ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <MapPin size={12} className="text-slate-500" />
                          {p.city}
                          {p.country && p.country !== "DE" ? `, ${p.country}` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 space-y-0.5">
                      {p.email && (
                        <div className="flex items-center gap-1">
                          <Mail size={11} /> {p.email}
                        </div>
                      )}
                      {p.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={11} /> {p.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-300 font-medium">
                        {model?.label.split("—")[0].trim() || p.defaultPartnershipModel}
                      </span>
                      {model?.recommended && (
                        <span className="ml-1 text-[9px] uppercase text-emerald-400">★ rec</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <span className="text-amber-400 font-bold">{p.defaultPartnerShare}%</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-red-400 font-bold">{100 - p.defaultPartnerShare}%</span>
                      <div className="text-[10px] text-slate-500">
                        BDE: {p.defaultBdePercent}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_LABELS[p.status].cls}`}
                      >
                        {STATUS_LABELS[p.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Ștergi partenerul „${p.name}"?`)) deletePartner.mutate(p.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        data-testid={`button-delete-${p.id}`}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {creating && (
        <CreatePartnerModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
          }}
        />
      )}
    </div>
  );
}

// ============== Create modal ==============
function CreatePartnerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    zip: "",
    country: "DE",
    contactPerson: "",
    status: "pending" as Partner["status"],
    defaultPartnershipModel: "Model_C" as PartnershipModel,
    defaultPartnerShare: 40,
    defaultBdePercent: 20,
    dailyCapacity: 0,
    notes: "",
  });

  // When user picks a model, sync the partner share to the model's preset.
  const setModel = (m: PartnershipModel) => {
    setForm((f) => ({
      ...f,
      defaultPartnershipModel: m,
      defaultPartnerShare: PARTNERSHIP_MODELS[m].partnerShare,
    }));
  };

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/partners", form);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Partener creat" });
      onCreated();
    },
    onError: (e: any) =>
      toast({
        title: "Eroare la creare",
        description: String(e?.message),
        variant: "destructive",
      }),
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      data-testid="modal-create-partner"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Adaugă Partener Nou</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            data-testid="button-close-modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nume / Denumire *" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="cf-input"
              data-testid="input-partner-name"
            />
          </Field>
          <Field label="Persoană contact">
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="cf-input"
              data-testid="input-partner-contact-person"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="cf-input"
              data-testid="input-partner-email"
            />
          </Field>
          <Field label="Telefon">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="cf-input"
              data-testid="input-partner-phone"
            />
          </Field>
          <Field label="Oraș">
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="cf-input"
              data-testid="input-partner-city"
            />
          </Field>
          <Field label="Cod poștal">
            <input
              type="text"
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className="cf-input"
              data-testid="input-partner-zip"
            />
          </Field>
          <Field label="Adresă" cols={2}>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="cf-input"
              data-testid="input-partner-address"
            />
          </Field>
          <Field label="Țară">
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="cf-input"
              data-testid="input-partner-country"
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Partner["status"] })
              }
              className="cf-input"
              data-testid="select-partner-status"
            >
              <option value="pending">Pending</option>
              <option value="active">Activ</option>
              <option value="suspended">Suspendat</option>
            </select>
          </Field>

          {/* PARTNERSHIP MODEL */}
          <div className="sm:col-span-2 border-t border-slate-800 pt-4">
            <label className="text-xs font-medium text-slate-400 uppercase block mb-2">
              Model de cooperare
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(PARTNERSHIP_MODELS) as PartnershipModel[]).map((m) => {
                const meta = PARTNERSHIP_MODELS[m];
                const active = form.defaultPartnershipModel === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      active
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                    data-testid={`button-model-${m}`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between gap-1">
                      {m.replace("_", " ")}
                      {meta.recommended && (
                        <span className="text-[9px] text-emerald-400">★</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {meta.partnerShare}% / {meta.corionShare}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Cota partener (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={form.defaultPartnerShare}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultPartnerShare: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                })
              }
              className="cf-input"
              data-testid="input-partner-share"
            />
          </Field>
          <Field label="BDE Materiale (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={form.defaultBdePercent}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultBdePercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                })
              }
              className="cf-input"
              data-testid="input-partner-bde"
            />
          </Field>
          <Field label="Capacitate zilnică (mașini)">
            <input
              type="number"
              min={0}
              value={form.dailyCapacity}
              onChange={(e) =>
                setForm({ ...form, dailyCapacity: Math.max(0, Number(e.target.value) || 0) })
              }
              className="cf-input"
              data-testid="input-partner-capacity"
            />
          </Field>
          <Field label="Notițe" cols={2}>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="cf-input resize-none"
              data-testid="input-partner-notes"
            />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white"
            data-testid="button-cancel-create"
            type="button"
          >
            Anulează
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.name.trim() || create.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            data-testid="button-submit-create"
            type="button"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Salvează Partener
          </button>
        </div>

        {/* Inline class definition reused in inputs (kept local to avoid global CSS bloat) */}
        <style>{`.cf-input{width:100%;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px 10px;font-size:14px;color:#e2e8f0;outline:none;}
        .cf-input:focus{border-color:#ef4444;box-shadow:0 0 0 1px #ef4444;}`}</style>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  cols,
  children,
}: {
  label: string;
  required?: boolean;
  cols?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${cols === 2 ? "sm:col-span-2" : ""}`}>
      <label className="text-xs font-medium text-slate-400 uppercase block">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}
