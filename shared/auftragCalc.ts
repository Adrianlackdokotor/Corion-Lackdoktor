// =====================================================================
// Pure calculation engine — runs on FE for live preview AND on BE through
// /api/auftrag/calc. Same code, identical numbers.
//
// Reference rules:
//   • Materiale proprii (isOwnMaterial=true) ⇒ bdePercent forțat la 0
//   • materialDeduction = labor × (bdePercent / 100)
//   • baseForSplit       = labor − materialDeduction
//   • partnerGrossShare  = baseForSplit × (partnerSharePercent / 100)
//   • corionGrossShare   = baseForSplit × (corionSharePercent  / 100)
//                          (corionSharePercent default = 100 − partnerShare)
//   • warrantyRetention  = partnerGrossShare × 0.05  (5% reținere garanție)
//                          + PLAFON 3.000 € pe partener — vezi mai jos.
//   • partnerPayoutNetto = partnerGrossShare − warrantyRetention
//
// Sicherheitseinbehalt (cap 3.000 €):
//   currentPartnerRetentionTotal = total reținut deja pentru partener (cenți).
//     • Dacă currentPartnerRetentionTotal ≥ 300_000 ⇒ warrantyRetention = 0.
//     • Altfel se reține min(partnerGrossShare × 5%, 300_000 − total).
//
// Client invoice rămâne neschimbat: Netto + TVA = Brutto.
// Toate calculele se fac în CENȚI (integer) ca să evităm erorile de
// rotunjire specifice float-ului în JavaScript.
// =====================================================================

export type PartnershipModel = "Model_A" | "Model_B" | "Model_C" | "Model_D";

export const PARTNERSHIP_MODELS: Record<
  PartnershipModel,
  { partnerShare: number; corionShare: number; label: string; recommended?: boolean }
> = {
  Model_A: { partnerShare: 80, corionShare: 20, label: "Model A — 80% / 20%" },
  Model_B: { partnerShare: 60, corionShare: 40, label: "Model B — 60% / 40%" },
  Model_C: { partnerShare: 40, corionShare: 60, label: "Model C — 40% / 60%", recommended: true },
  Model_D: { partnerShare: 70, corionShare: 30, label: "Model D — 70% / 30%" },
};

export const WARRANTY_RETENTION_PERCENT = 5;
/**
 * Plafonul total de Sicherheitseinbehalt pe partener: 3.000 €.
 * Stocat în cenți pentru a fi consistent cu restul motorului.
 */
export const WARRANTY_RETENTION_CAP_CENTS = 300_000;

export interface AuftragCalcInput {
  laborCents: number;
  partsCents: number;
  /** Preferred field name. Falls back to materialBdePercent if not provided. */
  bdePercent?: number;
  /** Legacy alias kept for backward compatibility. */
  materialBdePercent?: number;
  vatPercent?: number;
  partnerSharePercent?: number;
  corionSharePercent?: number;
  isOwnMaterial?: boolean;
  /**
   * Total acumulat (în cenți) al Sicherheitseinbehalt-ului reținut anterior
   * pentru acest partener. Folosit pentru aplicarea plafonului de 3.000 €.
   * Default 0 (calc fără istoric).
   */
  currentPartnerRetentionTotal?: number;
}

export interface AuftragCalcResult {
  client: {
    laborCents: number;
    partsCents: number;
    nettoCents: number;
    vatPercent: number;
    vatCents: number;
    bruttoCents: number;
  };
  partner: {
    laborCents: number;
    bdePercent: number;
    /** Alias kept for code that read the old name. */
    materialBdePercent: number;
    isOwnMaterial: boolean;
    materialDeductionCents: number;
    baseForSplitCents: number;
    partnerSharePercent: number;
    corionSharePercent: number;
    partnerGrossShareCents: number;
    corionGrossShareCents: number;
    warrantyRetentionPercent: number;
    warrantyRetentionCents: number;
    /** Plafonul global pe partener (cenți). Constant la 3.000 €. */
    warrantyRetentionCapCents: number;
    /** Cât avea partenerul reținut înainte de această comandă (cenți). */
    warrantyRetentionTotalBeforeCents: number;
    /** Cât are partenerul reținut DUPĂ această comandă (cenți). */
    warrantyRetentionTotalAfterCents: number;
    /** True dacă plafonul este complet atins după această comandă. */
    warrantyRetentionCapReached: boolean;
    partnerPayoutNetCents: number;
    /** Aliases kept for back-compat with the previous shape. */
    partnerShareCents: number;
    corionShareCents: number;
  };
}

export function calculateAuftrag(input: AuftragCalcInput): AuftragCalcResult {
  const labor = Math.max(0, Math.round(input.laborCents || 0));
  const parts = Math.max(0, Math.round(input.partsCents || 0));
  const vatPct = clampPct(input.vatPercent ?? 19);

  const isOwnMaterial = !!input.isOwnMaterial;
  const requestedBde = input.bdePercent ?? input.materialBdePercent ?? 20;
  // Materiale proprii ⇒ deducerea de materiale dispare.
  const bdePct = isOwnMaterial ? 0 : clampPct(requestedBde);

  const partnerPct = clampPct(input.partnerSharePercent ?? 40);
  // Dacă apelantul nu trimite explicit corionShare, completăm la 100.
  const corionPct =
    input.corionSharePercent != null ? clampPct(input.corionSharePercent) : 100 - partnerPct;

  // ---- Client invoice (NU se modifică) ----
  const netto = labor + parts;
  const vat = Math.round((netto * vatPct) / 100);
  const brutto = netto + vat;

  // ---- Partner split ----
  const materialDeduction = Math.round((labor * bdePct) / 100);
  const baseForSplit = Math.max(0, labor - materialDeduction);
  const partnerGrossShare = Math.round((baseForSplit * partnerPct) / 100);
  const corionGrossShare = Math.round((baseForSplit * corionPct) / 100);

  // ---- Sicherheitseinbehalt cu PLAFON 3.000 € ----
  // 1) Calculează 5% din partner gross.
  // 2) Aplică plafonul: dacă partenerul a atins deja 3.000 €, nu mai reținem.
  //    Altfel reținem doar până la diferența rămasă.
  const totalBefore = Math.max(0, Math.round(input.currentPartnerRetentionTotal ?? 0));
  let warrantyRetention = 0;
  if (totalBefore < WARRANTY_RETENTION_CAP_CENTS) {
    const rawRetention = Math.round(
      (partnerGrossShare * WARRANTY_RETENTION_PERCENT) / 100,
    );
    const remainingCap = WARRANTY_RETENTION_CAP_CENTS - totalBefore;
    warrantyRetention = Math.max(0, Math.min(rawRetention, remainingCap));
  }
  const totalAfter = totalBefore + warrantyRetention;
  const capReached = totalAfter >= WARRANTY_RETENTION_CAP_CENTS;
  const partnerPayoutNet = Math.max(0, partnerGrossShare - warrantyRetention);

  return {
    client: {
      laborCents: labor,
      partsCents: parts,
      nettoCents: netto,
      vatPercent: vatPct,
      vatCents: vat,
      bruttoCents: brutto,
    },
    partner: {
      laborCents: labor,
      bdePercent: bdePct,
      materialBdePercent: bdePct,
      isOwnMaterial,
      materialDeductionCents: materialDeduction,
      baseForSplitCents: baseForSplit,
      partnerSharePercent: partnerPct,
      corionSharePercent: corionPct,
      partnerGrossShareCents: partnerGrossShare,
      corionGrossShareCents: corionGrossShare,
      warrantyRetentionPercent: WARRANTY_RETENTION_PERCENT,
      warrantyRetentionCents: warrantyRetention,
      warrantyRetentionCapCents: WARRANTY_RETENTION_CAP_CENTS,
      warrantyRetentionTotalBeforeCents: totalBefore,
      warrantyRetentionTotalAfterCents: totalAfter,
      warrantyRetentionCapReached: capReached,
      partnerPayoutNetCents: partnerPayoutNet,
      // Back-compat aliases (cod vechi citea aceste nume).
      partnerShareCents: partnerGrossShare,
      corionShareCents: corionGrossShare,
    },
  };
}

function clampPct(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

// =====================================================================
// Multi-partner split — when an order is shared between several partners.
// Each partner gets `sharePercent` of the baseForSplit (labor − material
// deduction). Sum may not equal 100 — Corion absorbs the residual:
//   corionShare = max(0, baseForSplit − sum(partnerGrossShares))
// If sum > 100 the function caps each row's gross at the available pool
// proportionally so we never go negative.
// =====================================================================
export interface MultiPartnerSplitInput {
  laborCents: number;
  partsCents: number;
  vatPercent?: number;
  bdePercent?: number;
  isOwnMaterial?: boolean;
  partners: Array<{ partnerId: string; sharePercent: number; label?: string | null }>;
}

export interface MultiPartnerSplitResult {
  client: AuftragCalcResult["client"];
  baseForSplitCents: number;
  materialDeductionCents: number;
  bdePercent: number;
  totalPartnerSharePercent: number;
  partners: Array<{
    partnerId: string;
    label?: string | null;
    sharePercent: number;
    grossShareCents: number;
    warrantyRetentionCents: number;
    netPayoutCents: number;
  }>;
  corionShareCents: number;
}

export function calculateMultiPartnerSplit(input: MultiPartnerSplitInput): MultiPartnerSplitResult {
  const labor = Math.max(0, Math.round(input.laborCents || 0));
  const parts = Math.max(0, Math.round(input.partsCents || 0));
  const vatPct = clampPct(input.vatPercent ?? 19);
  const isOwn = !!input.isOwnMaterial;
  const bdePct = isOwn ? 0 : clampPct(input.bdePercent ?? 20);

  const netto = labor + parts;
  const vat = Math.round((netto * vatPct) / 100);
  const brutto = netto + vat;

  const materialDeduction = Math.round((labor * bdePct) / 100);
  const baseForSplit = Math.max(0, labor - materialDeduction);

  const sumPct = input.partners.reduce((a, p) => a + clampPct(p.sharePercent || 0), 0);
  // If the user assigned more than 100% across partners, scale proportionally.
  const scale = sumPct > 100 ? 100 / sumPct : 1;

  const partnersOut = input.partners.map((p) => {
    const pct = clampPct(p.sharePercent || 0) * scale;
    const gross = Math.round((baseForSplit * pct) / 100);
    const retention = Math.round((gross * WARRANTY_RETENTION_PERCENT) / 100);
    return {
      partnerId: p.partnerId,
      label: p.label ?? null,
      sharePercent: Math.round(pct * 100) / 100,
      grossShareCents: gross,
      warrantyRetentionCents: retention,
      netPayoutCents: Math.max(0, gross - retention),
    };
  });

  const totalPartnerGross = partnersOut.reduce((a, p) => a + p.grossShareCents, 0);
  const corionShare = Math.max(0, baseForSplit - totalPartnerGross);

  return {
    client: {
      laborCents: labor,
      partsCents: parts,
      nettoCents: netto,
      vatPercent: vatPct,
      vatCents: vat,
      bruttoCents: brutto,
    },
    baseForSplitCents: baseForSplit,
    materialDeductionCents: materialDeduction,
    bdePercent: bdePct,
    totalPartnerSharePercent: Math.round(sumPct * 100) / 100,
    partners: partnersOut,
    corionShareCents: corionShare,
  };
}

export function eurToCents(eur: number | string): number {
  const n = typeof eur === "string" ? parseFloat(eur) : eur;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToEur(cents: number): number {
  return Math.round(cents) / 100;
}
