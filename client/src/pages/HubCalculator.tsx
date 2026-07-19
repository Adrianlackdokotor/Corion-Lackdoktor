import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Calculator,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Briefcase,
  User,
  Save,
  RefreshCw,
} from "lucide-react";

interface FinancialProfile {
  id: string;
  name: string;
  role: string;
  company: string | null;
  userId: string | null;
  ownershipPercent: number | null;
  profitSharePercent: number;
  investmentSharePercent: number;
  isActive: boolean;
  createdAt: string;
}

interface BwaEntry {
  id: string;
  profileId: string;
  period: string;
  revenue: number;
  materialCosts: number;
  externalServices: number;
  personnelCosts: number;
  rentCosts: number;
  taxInsurance: number;
  vehicleCosts: number;
  marketingCosts: number;
  miscCosts: number;
  otherExpenses: number;
  notes: string | null;
}

const roleLabels: Record<string, string> = {
  owner: "Inhaber",
  partner: "Partner",
  investor: "Investor",
  manager: "Manager",
};

const roleIcons: Record<string, typeof Building2> = {
  owner: Building2,
  partner: Briefcase,
  investor: TrendingUp,
  manager: User,
};

const costLabels: { key: keyof BwaEntry; label: string; category: string }[] = [
  { key: "materialCosts", label: "Material/Wareneinkauf", category: "VARIABEL" },
  { key: "externalServices", label: "Fremdleistungen", category: "VARIABEL" },
  { key: "personnelCosts", label: "Personalkosten", category: "FIX" },
  { key: "rentCosts", label: "Raumkosten (Miete)", category: "FIX" },
  { key: "taxInsurance", label: "Steuern/Versicherungen", category: "FIX" },
  { key: "vehicleCosts", label: "Fahrzeugkosten", category: "FIX" },
  { key: "marketingCosts", label: "Werbe-/Reisekosten", category: "FIX" },
  { key: "miscCosts", label: "Verschiedene Kosten", category: "FIX" },
  { key: "otherExpenses", label: "Sonstige Aufwendungen", category: "FIX" },
];

function formatEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function ProfileForm({
  profile,
  onSave,
  isPending,
}: {
  profile?: FinancialProfile;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(profile?.name || "");
  const [role, setRole] = useState(profile?.role || "partner");
  const [company, setCompany] = useState(profile?.company || "");
  const [ownershipPercent, setOwnershipPercent] = useState(
    profile?.ownershipPercent?.toString() || ""
  );
  const [profitSharePercent, setProfitSharePercent] = useState(
    profile?.profitSharePercent?.toString() || "15"
  );
  const [investmentSharePercent, setInvestmentSharePercent] = useState(
    profile?.investmentSharePercent?.toString() || "15"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      role,
      company: company || null,
      ownershipPercent: ownershipPercent ? parseInt(ownershipPercent) : null,
      profitSharePercent: parseInt(profitSharePercent) || 15,
      investmentSharePercent: parseInt(investmentSharePercent) || 15,
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name *</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Adrian Corion"
            required
            data-testid="input-profile-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-role">Rolle</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger data-testid="select-profile-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Inhaber</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-company">Unternehmen</Label>
          <Input
            id="profile-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="z.B. Corion GmbH"
            data-testid="input-profile-company"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-ownership">Anteil (%)</Label>
          <Input
            id="profile-ownership"
            type="number"
            min="0"
            max="100"
            value={ownershipPercent}
            onChange={(e) => setOwnershipPercent(e.target.value)}
            placeholder="z.B. 100"
            data-testid="input-profile-ownership"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-profit">Profit-Ziel (%)</Label>
          <Input
            id="profile-profit"
            type="number"
            min="0"
            max="50"
            value={profitSharePercent}
            onChange={(e) => setProfitSharePercent(e.target.value)}
            data-testid="input-profile-profit"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-investment">Investitions-Ziel (%)</Label>
          <Input
            id="profile-investment"
            type="number"
            min="0"
            max="50"
            value={investmentSharePercent}
            onChange={(e) => setInvestmentSharePercent(e.target.value)}
            data-testid="input-profile-investment"
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending || !name} data-testid="button-save-profile">
        <Save className="w-4 h-4 mr-2" />
        {profile ? "Aktualisieren" : "Profil erstellen"}
      </Button>
    </form>
  );
}

function BwaForm({
  profileId,
  entry,
  onSave,
  isPending,
}: {
  profileId: string;
  entry?: BwaEntry;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [period, setPeriod] = useState(entry?.period || defaultPeriod);
  const [revenue, setRevenue] = useState(entry?.revenue?.toString() || "");
  const [costs, setCosts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    costLabels.forEach((c) => {
      initial[c.key] = entry ? ((entry as any)[c.key] || 0).toString() : "";
    });
    return initial;
  });
  const [notes, setNotes] = useState(entry?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      profileId,
      period,
      revenue: Math.round(parseFloat(revenue || "0") * 100),
      notes: notes || null,
    };
    costLabels.forEach((c) => {
      data[c.key] = Math.round(parseFloat(costs[c.key] || "0") * 100);
    });
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bwa-period">Zeitraum (JJJJ-MM)</Label>
          <Input
            id="bwa-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="2025-11"
            required
            data-testid="input-bwa-period"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bwa-revenue" className="text-green-600 dark:text-green-400 font-bold">
            Umsatz (Netto in EUR) *
          </Label>
          <Input
            id="bwa-revenue"
            type="number"
            step="0.01"
            min="0"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="z.B. 127052.46"
            required
            data-testid="input-bwa-revenue"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
          Kostenstruktur (in EUR)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {costLabels.map((c) => (
            <div key={c.key} className="space-y-1">
              <Label htmlFor={`bwa-${c.key}`} className="text-xs">
                {c.label}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {c.category}
                </Badge>
              </Label>
              <Input
                id={`bwa-${c.key}`}
                type="number"
                step="0.01"
                min="0"
                value={costs[c.key]}
                onChange={(e) =>
                  setCosts((prev) => ({ ...prev, [c.key]: e.target.value }))
                }
                placeholder="0.00"
                data-testid={`input-bwa-${c.key}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bwa-notes">Notizen</Label>
        <Textarea
          id="bwa-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optionale Anmerkungen zur Periode..."
          data-testid="input-bwa-notes"
        />
      </div>

      <Button type="submit" disabled={isPending || !revenue} data-testid="button-save-bwa">
        <Save className="w-4 h-4 mr-2" />
        {entry ? "Aktualisieren" : "BWA-Daten speichern"}
      </Button>
    </form>
  );
}

function GapAnalysis({
  entry,
  profile,
}: {
  entry: BwaEntry;
  profile: FinancialProfile;
}) {
  const revenue = entry.revenue;
  const profitTarget = revenue * (profile.profitSharePercent / 100);
  const investTarget = revenue * (profile.investmentSharePercent / 100);
  const totalCosts =
    entry.materialCosts +
    entry.externalServices +
    entry.personnelCosts +
    entry.rentCosts +
    entry.taxInsurance +
    entry.vehicleCosts +
    entry.marketingCosts +
    entry.miscCosts +
    entry.otherExpenses;

  const operationalBudget = revenue - profitTarget - investTarget;
  const gap = operationalBudget - totalCosts;
  const gapPercent = revenue > 0 ? gap / revenue : 0;
  const isPositive = gap >= 0;

  const variableCosts = entry.materialCosts + entry.externalServices;
  const fixedCosts = totalCosts - variableCosts;

  const segments = [
    { label: "Profit-Ziel", value: profitTarget, color: "bg-green-500", pct: profile.profitSharePercent / 100 },
    { label: "Investition-Ziel", value: investTarget, color: "bg-blue-500", pct: profile.investmentSharePercent / 100 },
    { label: "Material (Variabel)", value: entry.materialCosts, color: "bg-orange-500", pct: revenue > 0 ? entry.materialCosts / revenue : 0 },
    { label: "Fremdleistungen", value: entry.externalServices, color: "bg-orange-400", pct: revenue > 0 ? entry.externalServices / revenue : 0 },
    { label: "Personal", value: entry.personnelCosts, color: "bg-purple-500", pct: revenue > 0 ? entry.personnelCosts / revenue : 0 },
    { label: "Raumkosten", value: entry.rentCosts, color: "bg-red-400", pct: revenue > 0 ? entry.rentCosts / revenue : 0 },
    { label: "Steuern/Versicherungen", value: entry.taxInsurance, color: "bg-red-500", pct: revenue > 0 ? entry.taxInsurance / revenue : 0 },
    { label: "Fahrzeug", value: entry.vehicleCosts, color: "bg-yellow-500", pct: revenue > 0 ? entry.vehicleCosts / revenue : 0 },
    { label: "Marketing", value: entry.marketingCosts, color: "bg-pink-500", pct: revenue > 0 ? entry.marketingCosts / revenue : 0 },
    { label: "Diverse", value: entry.miscCosts, color: "bg-gray-500", pct: revenue > 0 ? entry.miscCosts / revenue : 0 },
    { label: "Sonstige", value: entry.otherExpenses, color: "bg-gray-400", pct: revenue > 0 ? entry.otherExpenses / revenue : 0 },
  ].filter((s) => s.value > 0);

  const totalAllocated = segments.reduce((sum, s) => sum + s.value, 0);
  const unallocated = revenue - totalAllocated;

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card data-testid="card-kpi-revenue">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Umsatz</span>
            </div>
            <p className="text-lg font-bold">{formatEuro(revenue)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-profit">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Profit ({profile.profitSharePercent}%)</span>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatEuro(profitTarget)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-investment">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Investition ({profile.investmentSharePercent}%)</span>
            </div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatEuro(investTarget)}</p>
          </CardContent>
        </Card>
        <Card className={isPositive ? "" : "border-destructive"} data-testid="card-kpi-gap">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {isPositive ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Gap ({formatPercent(gapPercent)})</span>
            </div>
            <p className={`text-lg font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {formatEuro(gap)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Bar Visualization */}
      <Card data-testid="card-budget-bar">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Budgetverteilung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-8 rounded-md overflow-hidden flex" data-testid="bar-budget">
            {segments.map((s, i) => {
              const widthPct = Math.max(s.pct * 100, 0.5);
              return (
                <div
                  key={i}
                  className={`${s.color} relative group`}
                  style={{ width: `${widthPct}%` }}
                  title={`${s.label}: ${formatEuro(s.value)} (${formatPercent(s.pct)})`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {widthPct > 5 && (
                      <span className="text-[10px] text-white font-bold truncate px-1">
                        {formatPercent(s.pct)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {unallocated > 0 && (
              <div
                className="bg-emerald-200 dark:bg-emerald-800"
                style={{ width: `${(unallocated / revenue) * 100}%` }}
                title={`Frei: ${formatEuro(unallocated)}`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {segments.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${s.color}`} />
                <span className="truncate">{s.label}</span>
                <span className="text-muted-foreground ml-auto">{formatPercent(s.pct)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown Table */}
      <Card data-testid="card-breakdown">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Profit-First Analyse ({entry.period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Kategorie</th>
                  <th className="text-right p-2 font-semibold">Betrag</th>
                  <th className="text-right p-2 font-semibold">% v. Umsatz</th>
                  <th className="text-left p-2 font-semibold">Typ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-green-50 dark:bg-green-950/30">
                  <td className="p-2 font-bold">1. UMSATZ (Netto)</td>
                  <td className="p-2 text-right font-bold text-green-600 dark:text-green-400">{formatEuro(revenue)}</td>
                  <td className="p-2 text-right">100%</td>
                  <td className="p-2"><Badge variant="outline">Input</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">2. TARGET: Profit ({profile.profitSharePercent}%)</td>
                  <td className="p-2 text-right text-green-600 dark:text-green-400">-{formatEuro(profitTarget)}</td>
                  <td className="p-2 text-right">{profile.profitSharePercent}%</td>
                  <td className="p-2"><Badge className="bg-green-500 text-white">Regel</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">3. TARGET: Investition ({profile.investmentSharePercent}%)</td>
                  <td className="p-2 text-right text-blue-600 dark:text-blue-400">-{formatEuro(investTarget)}</td>
                  <td className="p-2 text-right">{profile.investmentSharePercent}%</td>
                  <td className="p-2"><Badge className="bg-blue-500 text-white">Regel</Badge></td>
                </tr>
                {costLabels.map((c) => {
                  const val = (entry as any)[c.key] as number;
                  if (val === 0) return null;
                  const pct = revenue > 0 ? val / revenue : 0;
                  return (
                    <tr key={c.key} className="border-b">
                      <td className="p-2">4. {c.label}</td>
                      <td className="p-2 text-right text-destructive">-{formatEuro(val)}</td>
                      <td className="p-2 text-right">{formatPercent(pct)}</td>
                      <td className="p-2"><Badge variant="outline">{c.category}</Badge></td>
                    </tr>
                  );
                })}
                <tr className={`font-bold ${isPositive ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                  <td className="p-2">5. ERGEBNIS (Gap Analysis)</td>
                  <td className={`p-2 text-right ${isPositive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {formatEuro(gap)}
                  </td>
                  <td className="p-2 text-right">{formatPercent(gapPercent)}</td>
                  <td className="p-2"><Badge variant={isPositive ? "default" : "destructive"}>Berechnet</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>

          {!isPositive && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span>
                  <strong>Achtung:</strong> Die Betriebskosten ({formatPercent(revenue > 0 ? totalCosts / revenue : 0)}) 
                  {" "}übersteigen das verfügbare Budget ({formatPercent((100 - profile.profitSharePercent - profile.investmentSharePercent) / 100)}).
                  {" "}Empfehlung: Preise erhohen oder Materialkosten senken.
                </span>
              </p>
            </div>
          )}

          {isPositive && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>
                  <strong>Positiv:</strong> Nach Abzug von Profit, Investition und allen Kosten 
                  bleibt ein Puffer von {formatEuro(gap)} ({formatPercent(gapPercent)}).
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <Card data-testid="card-summary">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Variable Kosten:</span>
              <span className="font-medium">{formatEuro(variableCosts)} ({formatPercent(revenue > 0 ? variableCosts / revenue : 0)})</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Fixe Kosten:</span>
              <span className="font-medium">{formatEuro(fixedCosts)} ({formatPercent(revenue > 0 ? fixedCosts / revenue : 0)})</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Gesamtkosten:</span>
              <span className="font-medium">{formatEuro(totalCosts)} ({formatPercent(revenue > 0 ? totalCosts / revenue : 0)})</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Op. Budget ({100 - profile.profitSharePercent - profile.investmentSharePercent}%):</span>
              <span className="font-medium">{formatEuro(operationalBudget)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HubCalculator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showBwaForm, setShowBwaForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FinancialProfile | null>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<FinancialProfile[]>({
    queryKey: ["/api/hub/financial-profiles"],
  });

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) || null;

  const { data: bwaEntries = [], isLoading: bwaLoading } = useQuery<BwaEntry[]>({
    queryKey: ["/api/hub/financial-profiles", selectedProfileId, "bwa"],
    enabled: !!selectedProfileId,
    queryFn: async () => {
      const res = await fetch(`/api/hub/financial-profiles/${selectedProfileId}/bwa`);
      if (!res.ok) throw new Error("Failed to load BWA data");
      return res.json();
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/hub/financial-profiles", data);
      return res.json();
    },
    onSuccess: (newProfile: FinancialProfile) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/financial-profiles"] });
      setShowProfileForm(false);
      setSelectedProfileId(newProfile.id);
      toast({ title: "Profil erstellt" });
    },
    onError: () => toast({ title: "Fehler", description: "Profil konnte nicht erstellt werden", variant: "destructive" }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/hub/financial-profiles/${editingProfile!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/financial-profiles"] });
      setEditingProfile(null);
      toast({ title: "Profil aktualisiert" });
    },
    onError: () => toast({ title: "Fehler", variant: "destructive" }),
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hub/financial-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/financial-profiles"] });
      if (selectedProfileId) setSelectedProfileId(null);
      toast({ title: "Profil geloscht" });
    },
    onError: () => toast({ title: "Fehler", variant: "destructive" }),
  });

  const createBwaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/hub/financial-profiles/${selectedProfileId}/bwa`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/financial-profiles", selectedProfileId, "bwa"] });
      setShowBwaForm(false);
      toast({ title: "BWA-Daten gespeichert" });
    },
    onError: () => toast({ title: "Fehler", variant: "destructive" }),
  });

  const deleteBwaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hub/bwa/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/financial-profiles", selectedProfileId, "bwa"] });
      toast({ title: "BWA-Eintrag geloscht" });
    },
    onError: () => toast({ title: "Fehler", variant: "destructive" }),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Anmeldung erforderlich</h2>
          <p className="text-muted-foreground mb-4">Bitte melden Sie sich an, um den Finanzrechner zu nutzen.</p>
          <Link href="/login">
            <Button data-testid="button-login-redirect">Anmelden</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Finanzrechner | Corion Hub"
        description="BWA-basierter Finanzrechner mit Profit-First Methode. Gap-Analyse und Budgetplanung."
      />

      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/hub">
                <Button variant="ghost" size="icon" data-testid="button-back-hub">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold font-heading flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Corion Finanzrechner
                </h1>
                <p className="text-xs text-muted-foreground">BWA-Analyse | Profit First (15% + 15%)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingProfile(null);
                  setShowProfileForm(true);
                }}
                data-testid="button-add-profile"
              >
                <Plus className="w-4 h-4 mr-2" />
                Neues Profil
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile List */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Stakeholder Profile
            </h3>

            {profilesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <Card className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Noch keine Profile erstellt.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowProfileForm(true)}
                  data-testid="button-first-profile"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Profil erstellen
                </Button>
              </Card>
            ) : (
              profiles.map((profile) => {
                const isSelected = selectedProfileId === profile.id;
                const RoleIcon = roleIcons[profile.role] || User;
                return (
                  <Card
                    key={profile.id}
                    className={`p-3 cursor-pointer transition-colors ${isSelected ? "ring-2 ring-primary" : "hover-elevate"}`}
                    onClick={() => setSelectedProfileId(profile.id)}
                    data-testid={`card-profile-${profile.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <RoleIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {roleLabels[profile.role] || profile.role}
                            {profile.company && ` - ${profile.company}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProfile(profile);
                          }}
                          data-testid={`button-edit-profile-${profile.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Profil und alle BWA-Daten loschen?")) {
                              deleteProfileMutation.mutate(profile.id);
                            }
                          }}
                          data-testid={`button-delete-profile-${profile.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Profit {profile.profitSharePercent}%
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Invest {profile.investmentSharePercent}%
                      </Badge>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Profile Form Dialog */}
            {(showProfileForm || editingProfile) && (
              <Card data-testid="card-profile-form">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {editingProfile ? "Profil bearbeiten" : "Neues Stakeholder-Profil"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowProfileForm(false); setEditingProfile(null); }}
                      data-testid="button-cancel-profile"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    profile={editingProfile || undefined}
                    onSave={editingProfile ? updateProfileMutation.mutate : createProfileMutation.mutate}
                    isPending={createProfileMutation.isPending || updateProfileMutation.isPending}
                  />
                </CardContent>
              </Card>
            )}

            {/* No Profile Selected */}
            {!selectedProfile && !showProfileForm && !editingProfile && (
              <Card className="p-12 text-center">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">Corion Finanzrechner</h2>
                <p className="text-muted-foreground mb-1">
                  BWA-basierte Analyse mit Profit-First Methode
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Wahlen Sie ein Stakeholder-Profil oder erstellen Sie ein neues.
                </p>
                <Button onClick={() => setShowProfileForm(true)} data-testid="button-get-started">
                  <Plus className="w-4 h-4 mr-2" />
                  Los geht's - Profil erstellen
                </Button>
              </Card>
            )}

            {/* Selected Profile Content */}
            {selectedProfile && (
              <>
                {/* Profile Info Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold" data-testid="text-selected-profile-name">
                      {selectedProfile.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {roleLabels[selectedProfile.role]} 
                      {selectedProfile.company && ` | ${selectedProfile.company}`}
                      {" | "} Profit {selectedProfile.profitSharePercent}% + Invest {selectedProfile.investmentSharePercent}%
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowBwaForm(!showBwaForm)}
                    data-testid="button-add-bwa"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    BWA-Daten erfassen
                  </Button>
                </div>

                {/* BWA Entry Form */}
                {showBwaForm && (
                  <Card data-testid="card-bwa-form">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">BWA-Daten erfassen</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBwaForm(false)}
                          data-testid="button-cancel-bwa"
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BwaForm
                        profileId={selectedProfile.id}
                        onSave={createBwaMutation.mutate}
                        isPending={createBwaMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* BWA Entries & Analysis */}
                {bwaLoading ? (
                  <Card className="p-8 text-center animate-pulse">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">Daten werden geladen...</p>
                  </Card>
                ) : bwaEntries.length === 0 ? (
                  <Card className="p-8 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-bold mb-1">Keine BWA-Daten</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Erfassen Sie Ihre erste BWA um die Profit-First Analyse zu starten.
                    </p>
                    <Button onClick={() => setShowBwaForm(true)} variant="outline" data-testid="button-first-bwa">
                      <Plus className="w-4 h-4 mr-2" />
                      Erste BWA erfassen
                    </Button>
                  </Card>
                ) : (
                  <>
                    {/* Period Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                      {bwaEntries.map((entry) => (
                        <Badge
                          key={entry.id}
                          variant="outline"
                          className="cursor-pointer whitespace-nowrap"
                          data-testid={`badge-period-${entry.period}`}
                        >
                          {entry.period}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("BWA-Eintrag loschen?")) {
                                deleteBwaMutation.mutate(entry.id);
                              }
                            }}
                            data-testid={`button-delete-bwa-${entry.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>

                    {/* Show analysis for the latest (first) entry */}
                    <GapAnalysis entry={bwaEntries[0]} profile={selectedProfile} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
