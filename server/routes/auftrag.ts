import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import {
  calculateAuftrag,
  eurToCents,
  centsToEur,
  PARTNERSHIP_MODELS,
  type AuftragCalcResult,
  type PartnershipModel,
} from "@shared/auftragCalc";

const DEFAULT_TOKEN_BOOTSTRAP = 150;
const AI_EXTRACT_COST = 2;

const PARTNERSHIP_MODEL_VALUES = ["Model_A", "Model_B", "Model_C", "Model_D"] as const;

const saveOrderSchema = z.object({
  clientName: z.string().default(""),
  clientPhone: z.string().default(""),
  carMake: z.string().default(""),
  carVin: z.string().default(""),
  damageDesc: z.string().default(""),
  laborEur: z.coerce.number().min(0).default(0),
  partsEur: z.coerce.number().min(0).default(0),
  // New split fields (Roadmap step 3)
  partnerId: z.string().nullable().optional(),
  partnershipModel: z.enum(PARTNERSHIP_MODEL_VALUES).optional(),
  partnerSharePercent: z.coerce.number().min(0).max(100).optional(),
  corionSharePercent: z.coerce.number().min(0).max(100).optional(),
  bdePercent: z.coerce.number().min(0).max(100).optional(),
  isOwnCustomer: z.coerce.boolean().default(false),
  isOwnMaterial: z.coerce.boolean().default(false),
  // Legacy / back-compat
  materialBdePercent: z.coerce.number().min(0).max(100).optional(),
  assignedPartnerId: z.string().nullable().optional(),
  status: z.string().optional(),
});

const calcSchema = z.object({
  laborEur: z.coerce.number().min(0).default(0),
  partsEur: z.coerce.number().min(0).default(0),
  bdePercent: z.coerce.number().min(0).max(100).optional(),
  materialBdePercent: z.coerce.number().min(0).max(100).optional(),
  partnerSharePercent: z.coerce.number().min(0).max(100).default(40),
  corionSharePercent: z.coerce.number().min(0).max(100).optional(),
  vatPercent: z.coerce.number().min(0).max(100).default(19),
  isOwnCustomer: z.coerce.boolean().default(false),
  isOwnMaterial: z.coerce.boolean().default(false),
  partnershipModel: z.enum(PARTNERSHIP_MODEL_VALUES).optional(),
  // Optional: client passes the partner so we can fetch the running
  // Sicherheitseinbehalt total and apply the 3.000 € cap server-side.
  partnerId: z.string().nullable().optional(),
});

/**
 * Roadmap step 5 rules:
 *  - If partnershipModel is provided → its shares win.
 *  - Otherwise if isOwnCustomer → force Model B (60/40).
 *  - Otherwise fall back to explicit shares or sane defaults.
 *  - bdePercent defaults to 20 unless caller overrides (isOwnMaterial=true ⇒
 *    the calc engine forces it to 0 anyway).
 */
function resolveSplit(input: {
  partnershipModel?: PartnershipModel | null;
  isOwnCustomer?: boolean;
  partnerSharePercent?: number | null;
  corionSharePercent?: number | null;
  bdePercent?: number | null;
}) {
  let model: PartnershipModel | null = input.partnershipModel ?? null;
  if (!model && input.isOwnCustomer) model = "Model_B";

  let partnerPct: number;
  let corionPct: number;
  if (model && PARTNERSHIP_MODELS[model]) {
    partnerPct = PARTNERSHIP_MODELS[model].partnerShare;
    corionPct = PARTNERSHIP_MODELS[model].corionShare;
  } else {
    partnerPct = input.partnerSharePercent ?? 40;
    corionPct = input.corionSharePercent ?? 100 - partnerPct;
  }

  const bdePct = input.bdePercent ?? 20;
  return {
    partnershipModel: model,
    partnerSharePercent: partnerPct,
    corionSharePercent: corionPct,
    bdePercent: bdePct,
  };
}

const topupSchema = z.object({
  userId: z.string().optional(),
  amount: z.coerce.number().int().positive(),
  reason: z.string().default("topup"),
});

function getUserId(req: Request): string | null {
  const u = (req as any).user;
  return u?.id ?? u?.claims?.sub ?? null;
}

async function isAdmin(req: Request): Promise<boolean> {
  const id = getUserId(req);
  if (!id) return false;
  const u = await storage.getUser(id);
  return u?.role === "admin";
}

/**
 * Per-partner application-level mutex for serializing the
 * SUM(retention) → compute → INSERT sequence in /api/auftrag/orders.
 *
 * neon-http is a stateless HTTP driver and does not support multi-statement
 * transactions or row-level locking, so we serialize concurrent writes for the
 * same partner inside this Node process. Good enough as long as the API runs
 * single-process; for multi-instance deployments swap this for a Postgres
 * advisory lock or a Redis lock.
 */
const partnerSaveLocks = new Map<string, Promise<unknown>>();
async function withPartnerLock<T>(partnerId: string, fn: () => Promise<T>): Promise<T> {
  const prev = partnerSaveLocks.get(partnerId) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  partnerSaveLocks.set(
    partnerId,
    prev.then(() => next),
  );
  try {
    await prev;
    return await fn();
  } finally {
    release();
    // Best-effort cleanup so the map doesn't grow unbounded.
    if (partnerSaveLocks.get(partnerId) === next) {
      partnerSaveLocks.delete(partnerId);
    }
  }
}

function serializeOrder(o: any, calc: AuftragCalcResult, exposeRetention = false) {
  return {
    id: o.id,
    referenceNumber: o.referenceNumber,
    clientName: o.clientName,
    clientPhone: o.clientPhone,
    carMake: o.carMake,
    carVin: o.carVin,
    damageDesc: o.damageDesc,
    laborEur: centsToEur(o.laborNetCents),
    partsEur: centsToEur(o.partsNetCents),
    // New split fields
    partnerId: o.partnerId ?? null,
    partnershipModel: o.partnershipModel ?? null,
    partnerSharePercent: o.partnerSharePercent ?? calc.partner.partnerSharePercent,
    corionSharePercent: o.corionSharePercent ?? calc.partner.corionSharePercent,
    bdePercent: o.bdePercent ?? calc.partner.bdePercent,
    isOwnCustomer: !!o.isOwnCustomer,
    isOwnMaterial: !!o.isOwnMaterial,
    // Legacy fields kept for back-compat
    materialBdePercent: o.materialBdePercent,
    assignedPartnerId: o.assignedPartnerId,
    status: o.status,
    createdById: o.createdById,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    calc: {
      client: {
        labor: centsToEur(calc.client.laborCents),
        parts: centsToEur(calc.client.partsCents),
        netto: centsToEur(calc.client.nettoCents),
        vatPercent: calc.client.vatPercent,
        vat: centsToEur(calc.client.vatCents),
        brutto: centsToEur(calc.client.bruttoCents),
      },
      partner: {
        labor: centsToEur(calc.partner.laborCents),
        bdePercent: calc.partner.bdePercent,
        isOwnMaterial: calc.partner.isOwnMaterial,
        materialBdePercent: calc.partner.materialBdePercent, // alias
        materialDeduction: centsToEur(calc.partner.materialDeductionCents),
        baseForSplit: centsToEur(calc.partner.baseForSplitCents),
        partnerSharePercent: calc.partner.partnerSharePercent,
        corionSharePercent: calc.partner.corionSharePercent,
        partnerGrossShare: centsToEur(calc.partner.partnerGrossShareCents),
        corionGrossShare: centsToEur(calc.partner.corionGrossShareCents),
        warrantyRetentionPercent: calc.partner.warrantyRetentionPercent,
        warrantyRetention: centsToEur(calc.partner.warrantyRetentionCents),
        // Partner-aggregate cap fields are sensitive (reveal a partner's
        // total retained balance) — only expose to admins. The cap itself is
        // always enforced server-side at INSERT inside withPartnerLock,
        // regardless of what the caller sees in the response.
        warrantyRetentionCap: exposeRetention
          ? centsToEur(calc.partner.warrantyRetentionCapCents)
          : null,
        warrantyRetentionTotalBefore: exposeRetention
          ? centsToEur(calc.partner.warrantyRetentionTotalBeforeCents)
          : null,
        warrantyRetentionTotalAfter: exposeRetention
          ? centsToEur(calc.partner.warrantyRetentionTotalAfterCents)
          : null,
        warrantyRetentionCapReached: exposeRetention
          ? calc.partner.warrantyRetentionCapReached
          : null,
        partnerPayoutNet: centsToEur(calc.partner.partnerPayoutNetCents),
        // Aliases for back-compat
        partnerShare: centsToEur(calc.partner.partnerShareCents),
        corionShare: centsToEur(calc.partner.corionShareCents),
      },
    },
  };
}

/**
 * Compute the calc result for a stored order. Resolves partnership defaults
 * from the linked business-entity partner when the order didn't capture them
 * explicitly (older rows).
 */
async function calcForOrder(o: any): Promise<AuftragCalcResult> {
  let partnerSharePercent: number | null = o.partnerSharePercent ?? null;
  let corionSharePercent: number | null = o.corionSharePercent ?? null;
  let bdePercent: number | null = o.bdePercent ?? o.materialBdePercent ?? null;
  let model: PartnershipModel | null = (o.partnershipModel as PartnershipModel) ?? null;

  if (!model && (partnerSharePercent == null || corionSharePercent == null) && o.partnerId) {
    const partner = await storage.getPartner(o.partnerId);
    if (partner) {
      model = (partner.defaultPartnershipModel as PartnershipModel) ?? null;
      if (partnerSharePercent == null) partnerSharePercent = partner.defaultPartnerShare ?? null;
      if (bdePercent == null) bdePercent = partner.defaultBdePercent ?? null;
    }
  }

  const resolved = resolveSplit({
    partnershipModel: model,
    isOwnCustomer: !!o.isOwnCustomer,
    partnerSharePercent,
    corionSharePercent,
    bdePercent,
  });

  // Compute the running Sicherheitseinbehalt total for this partner so the
  // 3.000 € cap is respected, while excluding THIS order so re-serializing a
  // saved order doesn't double-count its own retention.
  let currentPartnerRetentionTotal = 0;
  if (o.partnerId) {
    try {
      currentPartnerRetentionTotal = await storage.getPartnerRetentionTotalCents(
        o.partnerId,
        o.id,
      );
    } catch (err) {
      console.error("[auftrag] retention total error", err);
    }
  }

  return calculateAuftrag({
    laborCents: o.laborNetCents,
    partsCents: o.partsNetCents,
    bdePercent: resolved.bdePercent,
    partnerSharePercent: resolved.partnerSharePercent,
    corionSharePercent: resolved.corionSharePercent,
    isOwnMaterial: !!o.isOwnMaterial,
    currentPartnerRetentionTotal,
  });
}

export function registerAuftragRoutes(app: Express) {
  // ---------- Calculation helper (no DB write) ----------
  app.post("/api/auftrag/calc", isAuthenticated, async (req: Request, res: Response) => {
    const parsed = calcSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }
    const d = parsed.data;
    const callerIsAdmin = await isAdmin(req);
    const resolved = resolveSplit({
      partnershipModel: d.partnershipModel ?? null,
      isOwnCustomer: d.isOwnCustomer,
      partnerSharePercent: d.partnerSharePercent,
      corionSharePercent: d.corionSharePercent ?? null,
      bdePercent: d.bdePercent ?? d.materialBdePercent ?? null,
    });
    // Pull running Sicherheitseinbehalt total for the partner so the live
    // preview reflects the 3.000 € cap. Restricted to admins to avoid
    // leaking partner-aggregate retention to unauthorized callers; non-admins
    // get a preview without cap enforcement (the cap is still enforced
    // server-side at INSERT inside withPartnerLock).
    let currentPartnerRetentionTotal = 0;
    if (d.partnerId && callerIsAdmin) {
      try {
        currentPartnerRetentionTotal =
          await storage.getPartnerRetentionTotalCents(d.partnerId);
      } catch (err) {
        console.error("[auftrag] retention total error", err);
      }
    }
    const calc = calculateAuftrag({
      laborCents: eurToCents(d.laborEur),
      partsCents: eurToCents(d.partsEur),
      bdePercent: resolved.bdePercent,
      partnerSharePercent: resolved.partnerSharePercent,
      corionSharePercent: resolved.corionSharePercent,
      vatPercent: d.vatPercent,
      isOwnMaterial: d.isOwnMaterial,
      currentPartnerRetentionTotal,
    });
    res.json({
      partnershipModel: resolved.partnershipModel,
      partnerSharePercent: resolved.partnerSharePercent,
      corionSharePercent: resolved.corionSharePercent,
      bdePercent: resolved.bdePercent,
      isOwnCustomer: d.isOwnCustomer,
      isOwnMaterial: d.isOwnMaterial,
      client: {
        labor: centsToEur(calc.client.laborCents),
        parts: centsToEur(calc.client.partsCents),
        netto: centsToEur(calc.client.nettoCents),
        vatPercent: calc.client.vatPercent,
        vat: centsToEur(calc.client.vatCents),
        brutto: centsToEur(calc.client.bruttoCents),
      },
      partner: {
        labor: centsToEur(calc.partner.laborCents),
        bdePercent: calc.partner.bdePercent,
        isOwnMaterial: calc.partner.isOwnMaterial,
        materialBdePercent: calc.partner.materialBdePercent,
        materialDeduction: centsToEur(calc.partner.materialDeductionCents),
        baseForSplit: centsToEur(calc.partner.baseForSplitCents),
        partnerSharePercent: calc.partner.partnerSharePercent,
        corionSharePercent: calc.partner.corionSharePercent,
        partnerGrossShare: centsToEur(calc.partner.partnerGrossShareCents),
        corionGrossShare: centsToEur(calc.partner.corionGrossShareCents),
        warrantyRetentionPercent: calc.partner.warrantyRetentionPercent,
        warrantyRetention: centsToEur(calc.partner.warrantyRetentionCents),
        partnerPayoutNet: centsToEur(calc.partner.partnerPayoutNetCents),
        partnerShare: centsToEur(calc.partner.partnerShareCents),
        corionShare: centsToEur(calc.partner.corionShareCents),
      },
    });
  });

  // ---------- Running Sicherheitseinbehalt total per partner ----------
  // Used by the FE live preview to mirror the server-side 3.000 € cap.
  // Restricted to admin only — partner-aggregate retention is sensitive
  // financial data and the partners table currently has no FK to users
  // so there is no reliable "owner" to grant self-access to.
  app.get(
    "/api/auftrag/partners/:id/retention",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        if (!(await isAdmin(req))) {
          return res.status(403).json({ message: "Forbidden" });
        }
        const totalCents = await storage.getPartnerRetentionTotalCents(req.params.id);
        res.json({
          partnerId: req.params.id,
          totalCents,
          totalEur: centsToEur(totalCents),
          capCents: 300_000,
          capEur: 3000,
          capReached: totalCents >= 300_000,
          remainingCents: Math.max(0, 300_000 - totalCents),
          remainingEur: centsToEur(Math.max(0, 300_000 - totalCents)),
        });
      } catch (err: any) {
        console.error("[auftrag] partner retention error", err);
        res.status(500).json({ message: "Failed to load retention total" });
      }
    },
  );

  // ---------- Partner directory (for assignment dropdown) ----------
  app.get("/api/auftrag/partners", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const partners = await storage.getUsersByRole("partner");
      res.json(
        partners.map((p) => ({
          id: p.id,
          name:
            [p.firstName, p.lastName].filter(Boolean).join(" ") ||
            p.email ||
            "Partner",
          email: p.email,
          partnerModel: p.partnerModel || null, // 'A' | 'B' | 'C'
          materialPercent: p.materialPercent ?? 20,
          materialKpiTargetPercent: p.materialKpiTargetPercent ?? 40,
          partnerSharePercent: p.partnerSharePercent ?? 40,
          city: p.city || null,
        })),
      );
    } catch (err: any) {
      console.error("[auftrag] partners error", err);
      res.status(500).json({ message: "Failed to load partners" });
    }
  });

  // ---------- Token economy ----------
  app.get("/api/auftrag/tokens", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const balance = await storage.ensureUserTokenBalance(userId, DEFAULT_TOKEN_BOOTSTRAP);
      const ledger = await storage.getTokenLedger(userId, 25);
      res.json({ balance, ledger });
    } catch (err: any) {
      console.error("[auftrag] tokens error", err);
      res.status(500).json({ message: "Failed to load tokens" });
    }
  });

  // Admin-only: minting Hub+1 tokens is a financial operation (1 Token = 1 EUR).
  // A self-service top-up endpoint would let any logged-in user mint unlimited
  // tokens, defeating the AI debit controls. Real payment flow lives elsewhere.
  app.post("/api/auftrag/tokens/topup", isAuthenticated, async (req: Request, res: Response) => {
    const requesterId = getUserId(req);
    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const requester = await storage.getUser(requesterId);
    if (requester?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden — admin only" });
    }
    const parsed = topupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }
    const targetId = parsed.data.userId || requesterId;
    try {
      const balance = await storage.creditTokens(
        targetId,
        parsed.data.amount,
        parsed.data.reason,
      );
      res.json({ balance });
    } catch (err: any) {
      console.error("[auftrag] topup error", err);
      res.status(500).json({ message: "Failed to top up tokens" });
    }
  });

  // ---------- AI Extract (debits 2 tokens, returns mock data) ----------
  app.post("/api/auftrag/ai-extract", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.ensureUserTokenBalance(userId, DEFAULT_TOKEN_BOOTSTRAP);
      const newBalance = await storage.debitTokens(userId, AI_EXTRACT_COST, "ai_extract");
      // Mock extraction payload (matches simulateAIExtract from the supplied component).
      const sample = {
        clientName: "Ion Popescu",
        clientPhone: "+49 176 1234567",
        carMake: "BMW Seria 5 (G30)",
        carVin: "WBAJF51080XXXXXXX",
        damageDesc:
          "Zgârietură profundă aripă stânga spate și bară protecție. Necesită revopsire parțială.",
        laborEur: 450,
        partsEur: 0,
        materialBdePercent: 20,
      };
      res.json({ balance: newBalance, extracted: sample, cost: AI_EXTRACT_COST });
    } catch (err: any) {
      if (err?.message === "INSUFFICIENT_TOKENS") {
        return res.status(402).json({ message: "Tokeni insuficienți", code: "INSUFFICIENT_TOKENS" });
      }
      console.error("[auftrag] ai-extract error", err);
      res.status(500).json({ message: "AI extraction failed" });
    }
  });

  // ---------- Orders CRUD ----------
  app.post("/api/auftrag/orders", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const parsed = saveOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid order", errors: parsed.error.flatten() });
    }
    try {
      const d = parsed.data;
      const callerIsAdmin = await isAdmin(req);

      // Only admins may bind an order to an arbitrary partner. Non-admin
      // requests are coerced to partnerId=null so they cannot consume or
      // mutate any partner's 3.000 € warranty-retention cap by passing a
      // partnerId they don't own. (The partners table has no users FK so
      // there is currently no per-user partner-ownership concept.)
      const effectivePartnerId = callerIsAdmin ? (d.partnerId ?? null) : null;

      // Resolve split fields, optionally pulling defaults from the linked partner
      let basePartnerSharePercent: number | null = d.partnerSharePercent ?? null;
      let baseCorionSharePercent: number | null = d.corionSharePercent ?? null;
      let baseBdePercent: number | null = d.bdePercent ?? d.materialBdePercent ?? null;
      let baseModel: PartnershipModel | null = d.partnershipModel ?? null;

      if (effectivePartnerId) {
        const partner = await storage.getPartner(effectivePartnerId);
        if (partner) {
          if (!baseModel) baseModel = (partner.defaultPartnershipModel as PartnershipModel) ?? null;
          if (basePartnerSharePercent == null) basePartnerSharePercent = partner.defaultPartnerShare ?? null;
          if (baseBdePercent == null) baseBdePercent = partner.defaultBdePercent ?? null;
        }
        // Fallback: if still no BDE, pull the user's Material-KPI target. This
        // makes the partner's Material-KPI directly drive the deduction % on
        // every new auftrag (per user request — KPI influences split).
        if (baseBdePercent == null) {
          const partnerUser = await storage.getUser(effectivePartnerId);
          if (partnerUser?.materialKpiTargetPercent != null) {
            baseBdePercent = partnerUser.materialKpiTargetPercent;
          }
        }
      }

      const resolved = resolveSplit({
        partnershipModel: baseModel,
        isOwnCustomer: d.isOwnCustomer,
        partnerSharePercent: basePartnerSharePercent,
        corionSharePercent: baseCorionSharePercent,
        bdePercent: baseBdePercent,
      });

      // Pre-compute Sicherheitseinbehalt and PERSIST it on the order row so
      // SUM() across orders enforces the 3.000 € per-partner cap. The
      // SUM → calc → INSERT sequence must be atomic per partner — we use an
      // in-process mutex (see withPartnerLock above) because neon-http does
      // not support multi-statement transactions.
      const persistOrder = async () => {
        const retentionTotalBefore = effectivePartnerId
          ? await storage.getPartnerRetentionTotalCents(effectivePartnerId)
          : 0;
        const preCalc = calculateAuftrag({
          laborCents: eurToCents(d.laborEur),
          partsCents: eurToCents(d.partsEur),
          bdePercent: resolved.bdePercent,
          partnerSharePercent: resolved.partnerSharePercent,
          corionSharePercent: resolved.corionSharePercent,
          isOwnMaterial: d.isOwnMaterial,
          currentPartnerRetentionTotal: retentionTotalBefore,
        });

        // Retry on rare ref-collision (UNIQUE constraint on reference_number).
        let created: Awaited<ReturnType<typeof storage.createAuftragOrder>> | null = null;
        let lastErr: any = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const ref = `COR-${10000 + Math.floor(Math.random() * 89999)}`;
          try {
            created = await storage.createAuftragOrder({
              referenceNumber: ref,
              clientName: d.clientName,
              clientPhone: d.clientPhone,
              carMake: d.carMake,
              carVin: d.carVin,
              damageDesc: d.damageDesc,
              laborNetCents: eurToCents(d.laborEur),
              partsNetCents: eurToCents(d.partsEur),
              // New split fields
              partnerId: effectivePartnerId,
              partnershipModel: resolved.partnershipModel,
              partnerSharePercent: Math.round(resolved.partnerSharePercent),
              corionSharePercent: Math.round(resolved.corionSharePercent),
              bdePercent: Math.round(resolved.bdePercent),
              isOwnCustomer: d.isOwnCustomer,
              isOwnMaterial: d.isOwnMaterial,
              warrantyRetentionCents: preCalc.partner.warrantyRetentionCents,
              // Legacy back-compat
              materialBdePercent: Math.round(resolved.bdePercent),
              assignedPartnerId: d.assignedPartnerId || null,
              status: d.status || "saved",
              createdById: userId,
            });
            break;
          } catch (e: any) {
            lastErr = e;
            const msg = String(e?.message || "");
            if (!/duplicate key|unique constraint/i.test(msg)) throw e;
          }
        }
        return { created, lastErr };
      };

      const { created, lastErr } = effectivePartnerId
        ? await withPartnerLock(effectivePartnerId, persistOrder)
        : await persistOrder();
      if (!created) throw lastErr || new Error("Failed to allocate reference number");

      // Hub+1 Contribution Economy: reward referrer on referred user's first
      // value-creating action. Fire-and-forget — never blocks the response.
      void import("../services/referralRewards").then(({ tryRewardReferral }) =>
        tryRewardReferral(userId, created!.id),
      );

      const calc = await calcForOrder(created);
      res.status(201).json(serializeOrder(created, calc, callerIsAdmin));
    } catch (err: any) {
      console.error("[auftrag] create order error", err);
      res.status(500).json({ message: "Failed to save order" });
    }
  });

  app.get("/api/auftrag/orders", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const requester = await storage.getUser(userId);
      const callerIsAdmin = requester?.role === "admin";
      const orders = callerIsAdmin
        ? await storage.getAllAuftragOrders()
        : await storage.getAuftragOrdersForUser(userId);

      const items = await Promise.all(
        orders.map(async (o) => {
          const calc = await calcForOrder(o);
          return serializeOrder(o, calc, callerIsAdmin);
        }),
      );
      res.json(items);
    } catch (err: any) {
      console.error("[auftrag] list orders error", err);
      res.status(500).json({ message: "Failed to list orders" });
    }
  });

  app.get("/api/auftrag/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const o = await storage.getAuftragOrder(req.params.id);
      if (!o) return res.status(404).json({ message: "Not found" });

      const requester = await storage.getUser(userId);
      const isOwner = o.createdById === userId;
      const isPartner = o.assignedPartnerId === userId;
      if (requester?.role !== "admin" && !isOwner && !isPartner) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const calc = await calcForOrder(o);
      const callerIsAdmin = requester?.role === "admin";
      res.json(serializeOrder(o, calc, callerIsAdmin));
    } catch (err: any) {
      console.error("[auftrag] get order error", err);
      res.status(500).json({ message: "Failed to load order" });
    }
  });
}
