import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Car,
  User as UserIcon,
  Calculator as CalcIcon,
  Camera,
  FileText,
  BrainCircuit,
  Coins,
  Save,
  FileOutput,
  CheckCircle2,
  Loader2,
  Search as SearchIcon,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  calculateAuftrag,
  eurToCents,
  PARTNERSHIP_MODELS,
  type PartnershipModel,
} from "@shared/auftragCalc";

type BusinessPartner = {
  id: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  status: "pending" | "active" | "suspended";
  defaultPartnershipModel: PartnershipModel;
  defaultPartnerShare: number;
  defaultBdePercent: number;
};

type TokensResponse = {
  balance: number;
  ledger: Array<{
    id: string;
    delta: number;
    balanceAfter: number;
    reason: string;
    createdAt: string;
  }>;
};

type AIExtractResponse = {
  balance: number;
  cost: number;
  extracted: {
    clientName: string;
    clientPhone: string;
    carMake: string;
    carVin: string;
    damageDesc: string;
    laborEur: number;
    partsEur: number;
    materialBdePercent: number;
  };
};

type SaveOrderResponse = {
  id: string;
  referenceNumber: string;
};

export default function AuftragCalculator() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) setLocation("/login?next=/hub/auftrag");
  }, [authLoading, user, setLocation]);

  // ---------- Server data ----------
  const tokensQuery = useQuery<TokensResponse>({
    queryKey: ["/api/auftrag/tokens"],
    enabled: !!user,
  });
  const partnersQuery = useQuery<BusinessPartner[]>({
    queryKey: ["/api/partners"],
    enabled: !!user,
  });

  // ---------- Form state ----------
  const [orderData, setOrderData] = useState({
    clientName: "",
    clientPhone: "",
    carMake: "",
    carVin: "",
    damageDesc: "",
  });
  const [finances, setFinances] = useState({
    labor: 0,
    parts: 0,
    materialPercent: 20,
  });
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [partnershipModel, setPartnershipModel] = useState<PartnershipModel>("Model_C");
  const [isOwnCustomer, setIsOwnCustomer] = useState(false);
  const [isOwnMaterial, setIsOwnMaterial] = useState(false);
  const [savedRef, setSavedRef] = useState<string | null>(null);

  const selectedPartner: BusinessPartner | undefined = useMemo(
    () => partnersQuery.data?.find((p) => p.id === selectedPartnerId),
    [partnersQuery.data, selectedPartnerId],
  );

  // Running Sicherheitseinbehalt total for the picked partner. Drives the
  // 3.000 € cap in the live preview so it matches the server math exactly.
  const partnerRetentionQuery = useQuery<{
    totalCents: number;
    totalEur: number;
    capCents: number;
    capEur: number;
    capReached: boolean;
    remainingCents: number;
    remainingEur: number;
  }>({
    queryKey: ["/api/auftrag/partners", selectedPartnerId, "retention"],
    enabled: !!user && !!selectedPartnerId,
  });
  const currentRetentionTotalCents = partnerRetentionQuery.data?.totalCents ?? 0;

  // When the picked partner changes, autofill model + BDE from its defaults.
  useEffect(() => {
    if (selectedPartner) {
      setPartnershipModel(selectedPartner.defaultPartnershipModel);
      setFinances((f) => ({ ...f, materialPercent: selectedPartner.defaultBdePercent }));
    }
  }, [selectedPartner]);

  // "Eigener Kunde" forces Model_B per Roadmap rules.
  useEffect(() => {
    if (isOwnCustomer) setPartnershipModel("Model_B");
  }, [isOwnCustomer]);

  // Filter partners by free-text search (name + city)
  const filteredPartners = useMemo(() => {
    const list = partnersQuery.data ?? [];
    if (!partnerSearch.trim()) return list;
    const s = partnerSearch.toLowerCase();
    return list.filter(
      (p) => p.name.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s),
    );
  }, [partnersQuery.data, partnerSearch]);

  // ---------- Live calculation (mirrors backend) ----------
  const modelMeta = PARTNERSHIP_MODELS[partnershipModel];
  const calc = useMemo(() => {
    return calculateAuftrag({
      laborCents: eurToCents(finances.labor || 0),
      partsCents: eurToCents(finances.parts || 0),
      bdePercent: Number(finances.materialPercent) || 0,
      partnerSharePercent: modelMeta.partnerShare,
      corionSharePercent: modelMeta.corionShare,
      isOwnMaterial,
      currentPartnerRetentionTotal: currentRetentionTotalCents,
    });
  }, [finances, modelMeta, isOwnMaterial, currentRetentionTotalCents]);

  const fmt = (cents: number) => (cents / 100).toFixed(2);

  // ---------- Mutations ----------
  const aiExtract = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auftrag/ai-extract", {});
      return (await res.json()) as AIExtractResponse;
    },
    onSuccess: (data) => {
      setOrderData({
        clientName: data.extracted.clientName,
        clientPhone: data.extracted.clientPhone,
        carMake: data.extracted.carMake,
        carVin: data.extracted.carVin,
        damageDesc: data.extracted.damageDesc,
      });
      setFinances({
        labor: data.extracted.laborEur,
        parts: data.extracted.partsEur,
        materialPercent: data.extracted.materialBdePercent,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auftrag/tokens"] });
      toast({
        title: "Date extrase",
        description: `${data.cost} Hub+1 consumați. Balanță: ${data.balance}`,
      });
    },
    onError: (err: any) => {
      const msg = String(err?.message || "");
      if (msg.includes("402") || msg.toLowerCase().includes("insuficien")) {
        toast({
          title: "Tokeni insuficienți",
          description: "Te rog reîncarcă balanța Hub+1 pentru a continua.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Eroare AI", description: msg, variant: "destructive" });
      }
    },
  });

  const saveOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auftrag/orders", {
        clientName: orderData.clientName,
        clientPhone: orderData.clientPhone,
        carMake: orderData.carMake,
        carVin: orderData.carVin,
        damageDesc: orderData.damageDesc,
        laborEur: Number(finances.labor) || 0,
        partsEur: Number(finances.parts) || 0,
        bdePercent: Number(finances.materialPercent) || 0,
        partnerId: selectedPartnerId || null,
        partnershipModel,
        partnerSharePercent: modelMeta.partnerShare,
        corionSharePercent: modelMeta.corionShare,
        isOwnCustomer,
        isOwnMaterial,
        status: "saved",
      });
      return (await res.json()) as SaveOrderResponse;
    },
    onSuccess: (data) => {
      setSavedRef(data.referenceNumber);
      queryClient.invalidateQueries({ queryKey: ["/api/auftrag/orders"] });
      // Refresh the per-partner Sicherheitseinbehalt total so the live
      // preview reflects the just-saved retention against the 3.000 € cap.
      if (selectedPartnerId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/auftrag/partners", selectedPartnerId, "retention"],
        });
      }
      toast({
        title: "Comandă salvată",
        description: `Referință: ${data.referenceNumber}`,
      });
      setTimeout(() => setSavedRef(null), 4000);
    },
    onError: (err: any) => {
      toast({
        title: "Eroare la salvare",
        description: String(err?.message || "Nu s-a putut salva comanda."),
        variant: "destructive",
      });
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const aiTokens = tokensQuery.data?.balance ?? 0;
  const refNumber = savedRef || "preview";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6" data-testid="page-auftrag-calculator">
      {/* HEADER & TOKEN WIDGET */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-red-600">+1</span> Corion Hub
          </h1>
          <p className="text-slate-400 text-sm">SaaS Order &amp; Calculation Management</p>
        </div>

        <div
          className="flex items-center gap-4 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl shadow-lg"
          data-testid="widget-tokens"
        >
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              Balanță AI
            </span>
            <span
              className="text-emerald-400 font-bold flex items-center gap-1"
              data-testid="text-token-balance"
            >
              <Coins size={16} /> {aiTokens} Hub+1
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-xs text-slate-500">1 Token = 1 €</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI ASSISTANT */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit size={100} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <BrainCircuit className="text-red-500" size={20} />
              Asistent AI Corion
            </h2>
            <p className="text-sm text-slate-400 mb-4 max-w-md">
              Încarcă o poză cu dauna sau cu certificatul de înmatriculare. Agentul nostru AI va
              extrage automat datele clientului și va estima costul reparației.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => aiExtract.mutate()}
                disabled={aiExtract.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                data-testid="button-ai-extract"
              >
                {aiExtract.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  <>
                    Extrage date din poză
                    <span className="text-red-200 text-xs ml-1">(-2 Hub+1)</span>
                  </>
                )}
              </button>
              <button
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                data-testid="button-upload-photo"
                type="button"
              >
                <Camera size={16} /> Încarcă Poză
              </button>
            </div>
          </div>

          {/* CLIENT/VEHICLE FORM */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Car className="text-slate-400" size={20} />
                Date Comandă (Auftrag)
              </h2>
              <span
                className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md font-mono border border-slate-700"
                data-testid="text-order-ref"
              >
                REF: #{refNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">Nume Client</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={orderData.clientName}
                    onChange={(e) => setOrderData({ ...orderData, clientName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                    placeholder="Ex: Ion Popescu"
                    data-testid="input-client-name"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">Telefon</label>
                <input
                  type="text"
                  value={orderData.clientPhone}
                  onChange={(e) => setOrderData({ ...orderData, clientPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                  placeholder="+49 ..."
                  data-testid="input-client-phone"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">Marcă/Model Auto</label>
                <input
                  type="text"
                  value={orderData.carMake}
                  onChange={(e) => setOrderData({ ...orderData, carMake: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                  placeholder="Ex: VW Golf 8"
                  data-testid="input-car-make"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">VIN (Serie Șasiu)</label>
                <input
                  type="text"
                  value={orderData.carVin}
                  onChange={(e) => setOrderData({ ...orderData, carVin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all uppercase font-mono"
                  placeholder="WVWZZZ..."
                  data-testid="input-car-vin"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase">Descriere Daună</label>
                <textarea
                  value={orderData.damageDesc}
                  onChange={(e) => setOrderData({ ...orderData, damageDesc: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                  placeholder="Descrieți reparațiile necesare..."
                  data-testid="input-damage-desc"
                />
              </div>
            </div>
          </div>

          {/* COST INPUT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
              <CalcIcon className="text-slate-400" size={20} />
              Introducere Costuri
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <label className="text-xs font-medium text-slate-400 uppercase block">
                  Manoperă (Total Netto)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                  <input
                    type="number"
                    value={finances.labor}
                    onChange={(e) =>
                      setFinances({ ...finances, labor: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-lg font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    data-testid="input-labor"
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <label className="text-xs font-medium text-slate-400 uppercase block">
                  Piese de schimb (Netto)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                  <input
                    type="number"
                    value={finances.parts}
                    onChange={(e) =>
                      setFinances({ ...finances, parts: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-lg font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    data-testid="input-parts"
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <label className="text-xs font-medium text-slate-400 uppercase block flex items-center justify-between gap-2">
                  <span>Materiale (BDE)</span>
                  <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                    Editabil
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={finances.materialPercent}
                    onChange={(e) =>
                      setFinances({
                        ...finances,
                        materialPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-lg font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    data-testid="input-material-percent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Procent reținut din manoperă pt. vopsea/consumabile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          {/* CLIENT INVOICE */}
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
            data-testid="card-client-invoice"
          >
            <div className="bg-slate-800/50 p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                Factură Client (Rechnung)
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <Row label="Total Manoperă Netto:" value={`${fmt(calc.client.laborCents)} €`} />
              <Row label="Total Piese Netto:" value={`${fmt(calc.client.partsCents)} €`} />
              <Divider />
              <Row
                label="Subtotal Netto:"
                value={`${fmt(calc.client.nettoCents)} €`}
                emphasis
                testId="text-client-netto"
              />
              <Row
                label={`TVA / MwSt (${calc.client.vatPercent}%):`}
                value={`+${fmt(calc.client.vatCents)} €`}
                muted
              />
              <Divider />
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-white">TOTAL BRUTTO:</span>
                <span
                  className="text-2xl font-bold text-blue-400"
                  data-testid="text-client-brutto"
                >
                  {fmt(calc.client.bruttoCents)} €
                </span>
              </div>
            </div>
          </div>

          {/* PARTNER PICKER + MODEL SELECTOR + FLAGS */}
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-5 space-y-4"
            data-testid="card-partner-picker"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SearchIcon size={16} className="text-amber-400" />
              Partener & Model
            </h3>

            {/* Search-as-you-type partner field */}
            <div className="relative">
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Caută Partener (nume sau oraș)
              </label>
              <div className="relative">
                <SearchIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={
                    selectedPartner
                      ? `${selectedPartner.name}${selectedPartner.city ? ` — ${selectedPartner.city}` : ""}`
                      : partnerSearch
                  }
                  onChange={(e) => {
                    setPartnerSearch(e.target.value);
                    setSelectedPartnerId("");
                    setShowPartnerDropdown(true);
                  }}
                  onFocus={() => setShowPartnerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPartnerDropdown(false), 150)}
                  placeholder="Hofheim, Frankfurt, Müller…"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:border-red-500 outline-none"
                  data-testid="input-partner-search"
                />
              </div>
              {showPartnerDropdown && filteredPartners.length > 0 && (
                <div
                  className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-950 border border-slate-700 rounded-lg shadow-xl"
                  data-testid="dropdown-partners"
                >
                  {filteredPartners.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedPartnerId(p.id);
                        setPartnerSearch("");
                        setShowPartnerDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center justify-between gap-2"
                      data-testid={`option-partner-${p.id}`}
                    >
                      <span className="truncate">
                        <span className="font-medium">{p.name}</span>
                        {p.city && <span className="text-slate-500"> · {p.city}</span>}
                      </span>
                      <span className="text-[10px] text-amber-400 shrink-0">
                        {p.defaultPartnershipModel.replace("Model_", "")} ·{" "}
                        {p.defaultPartnerShare}/{100 - p.defaultPartnerShare}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPartner && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPartnerId("");
                    setPartnerSearch("");
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 mt-1"
                  data-testid="button-clear-partner"
                >
                  Șterge selecția
                </button>
              )}
            </div>

            {/* Model selector — 4 cards */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">
                Model Parteneriat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PARTNERSHIP_MODELS) as PartnershipModel[]).map((key) => {
                  const m = PARTNERSHIP_MODELS[key];
                  const active = partnershipModel === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPartnershipModel(key)}
                      disabled={isOwnCustomer}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        active
                          ? "border-red-500 bg-red-500/10"
                          : "border-slate-700 bg-slate-950 hover:border-slate-500"
                      } ${isOwnCustomer && key !== "Model_B" ? "opacity-40 cursor-not-allowed" : ""}`}
                      data-testid={`button-model-${key}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {key.replace("Model_", "Model ")}
                        </span>
                        {m.recommended && (
                          <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold">
                            Recom.
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {m.partnerShare}% Partener / {m.corionShare}% Corion
                      </div>
                    </button>
                  );
                })}
              </div>
              {isOwnCustomer && (
                <p className="text-[10px] text-amber-400 mt-2">
                  Eigener Kunde forțează automat Modelul B (60/40).
                </p>
              )}
            </div>

            {/* Flags */}
            <div className="grid grid-cols-1 gap-2">
              <label
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer hover-elevate"
                data-testid="label-own-customer"
              >
                <input
                  type="checkbox"
                  checked={isOwnCustomer}
                  onChange={(e) => setIsOwnCustomer(e.target.checked)}
                  className="accent-red-500"
                  data-testid="checkbox-own-customer"
                />
                <span className="text-sm text-slate-200">Eigener Kunde</span>
                <span className="ml-auto text-[10px] text-slate-500">→ Model B</span>
              </label>
              <label
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer hover-elevate"
                data-testid="label-own-material"
              >
                <input
                  type="checkbox"
                  checked={isOwnMaterial}
                  onChange={(e) => setIsOwnMaterial(e.target.checked)}
                  className="accent-red-500"
                  data-testid="checkbox-own-material"
                />
                <span className="text-sm text-slate-200">Eigene Materiale</span>
                <span className="ml-auto text-[10px] text-slate-500">→ BDE 0%</span>
              </label>
            </div>
          </div>

          {/* PARTNER SPLIT (internal) */}
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg relative"
            data-testid="card-partner-decont"
          >
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
              <div className="absolute top-6 -right-6 bg-red-600 text-white text-[10px] font-bold py-1 px-8 rotate-45 text-center shadow-md">
                INTERN
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center justify-between pr-12">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Coins size={16} className="text-amber-400" />
                Partner Split — {partnershipModel.replace("Model_", "Model ")}
              </h3>
            </div>

            <div className="p-5">
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <Row label="Manoperă Brută (Netto):" value={`${fmt(calc.partner.laborCents)} €`} />
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>
                    − Deducere Materiale ({calc.partner.bdePercent}%
                    {isOwnMaterial ? " — Eigene Materiale" : ""}):
                  </span>
                  <span>−{fmt(calc.partner.materialDeductionCents)} €</span>
                </div>
                <Divider />
                <Row
                  label="Bază calcul pentru Split:"
                  value={`${fmt(calc.partner.baseForSplitCents)} €`}
                  emphasis
                  testId="text-base-split"
                />

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-3 text-center uppercase tracking-widest">
                    Împărțire Venituri
                  </p>
                  <div className="flex gap-2 h-12 rounded-lg overflow-hidden mb-3">
                    <div
                      className="bg-amber-500/20 border border-amber-500/50 flex items-center justify-center"
                      style={{ width: `${calc.partner.partnerSharePercent}%` }}
                    >
                      <span className="text-amber-400 font-bold">
                        {calc.partner.partnerSharePercent}%
                      </span>
                    </div>
                    <div
                      className="bg-red-500/20 border border-red-500/50 flex items-center justify-center"
                      style={{ width: `${calc.partner.corionSharePercent}%` }}
                    >
                      <span className="text-red-400 font-bold">
                        {calc.partner.corionSharePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 uppercase">
                        Partener Brut
                      </span>
                      <span
                        className="text-lg font-bold text-amber-400"
                        data-testid="text-partner-share"
                      >
                        {fmt(calc.partner.partnerGrossShareCents)} €
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 uppercase">
                        Corion GmbH
                      </span>
                      <span
                        className="text-lg font-bold text-red-400"
                        data-testid="text-corion-share"
                      >
                        {fmt(calc.partner.corionGrossShareCents)} €
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sicherheitseinbehalt + cap progress */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Shield size={12} className="text-sky-400" />
                      Sicherheitseinbehalt ({calc.partner.warrantyRetentionPercent}%)
                    </span>
                    <span
                      className="font-medium text-sky-400"
                      data-testid="text-warranty-retention"
                    >
                      −{fmt(calc.partner.warrantyRetentionCents)} €
                    </span>
                  </div>
                  {selectedPartnerId && (
                    <>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            calc.partner.warrantyRetentionCapReached
                              ? "bg-emerald-500"
                              : "bg-sky-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (calc.partner.warrantyRetentionTotalAfterCents /
                                calc.partner.warrantyRetentionCapCents) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span data-testid="text-retention-progress">
                          Acumulat: {fmt(calc.partner.warrantyRetentionTotalAfterCents)} € /{" "}
                          {fmt(calc.partner.warrantyRetentionCapCents)} €
                        </span>
                        {calc.partner.warrantyRetentionCapReached ? (
                          <span className="text-emerald-400 font-medium">
                            Plafon atins
                          </span>
                        ) : (
                          <span>
                            Rămas:{" "}
                            {fmt(
                              calc.partner.warrantyRetentionCapCents -
                                calc.partner.warrantyRetentionTotalAfterCents,
                            )}{" "}
                            €
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  <Divider />
                  <Row
                    label="Plată Partener (Net):"
                    value={`${fmt(calc.partner.partnerPayoutNetCents)} €`}
                    emphasis
                    testId="text-partner-payout-net"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mt-4 text-center">
                *Sumele afișate sunt sume nete ce vor fi facturate către Corion. Plafon garanție
                3.000 € per partener.
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={() => saveOrder.mutate()}
              disabled={saveOrder.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-60"
              data-testid="button-save-order"
            >
              {saveOrder.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Se salvează...
                </>
              ) : savedRef ? (
                <>
                  <CheckCircle2 size={20} /> Salvat ({savedRef})
                </>
              ) : (
                <>
                  <Save size={20} /> Salvează Comanda
                </>
              )}
            </button>
            <button
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              title="Exportă PDF"
              data-testid="button-export-pdf"
              type="button"
            >
              <FileOutput size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
  muted,
  testId,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
  testId?: string;
}) {
  return (
    <div className={`flex justify-between ${emphasis ? "font-medium" : "text-sm"}`}>
      <span className={emphasis ? "text-slate-300" : muted ? "text-slate-400" : "text-slate-400"}>
        {label}
      </span>
      <span
        className={emphasis ? "text-white" : muted ? "text-slate-400" : "text-slate-200"}
        data-testid={testId}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-slate-800 my-1" />;
}
