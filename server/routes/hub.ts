import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../auth";
import { onAuftragStatusChange } from "../services/reputationEngine";
import {
  placeEscrow,
  releaseEscrow,
  forfeitEscrow,
  refundEscrow,
  onCancellation as onEscrowCancellation,
} from "../services/escrowEngine";
import {
  POOL_CATALOG,
  calculateAccruedRewards,
  stake as stakeTokens,
  unstake as unstakeTokens,
  type PoolKey,
} from "../services/stakingEngine";
import { z } from "zod";
import { insertOrderSchema, insertVehicleSchema, insertResourceSchema, insertAppointmentSchema, insertFinancialProfileSchema, insertBwaEntrySchema, insertExpenseCategorySchema, insertFinancialTransactionSchema, insertAppointmentWaitlistSchema } from "@shared/schema";
import type { User } from "@shared/schema";

function getUser(req: Request): User {
  return req.user as User;
}

export function registerHubRoutes(app: Express) {
  // ============== TOKEN GOVERNANCE ==============

  // Get current user's HUB+1 token balance + plan included + used this period
  app.get("/api/hub/tokens", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const balance = await storage.ensureUserTokenBalance(user.id, 5000);
      const ledger = await storage.getTokenLedger(user.id, 500);
      // "Used this period" = sum of debits in current calendar month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const used = ledger
        .filter((e: any) => e.delta < 0 && new Date(e.createdAt) >= monthStart)
        .reduce((s: number, e: any) => s + Math.abs(e.delta), 0);
      res.json({
        balance,
        monthlyIncluded: 5000,
        used,
      });
    } catch (error) {
      console.error("Tokens fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Tokens" });
    }
  });

  // Get token ledger entries (recent activity)
  app.get("/api/hub/ledger", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
      const entries = await storage.getTokenLedger(user.id, limit);
      res.json({ entries });
    } catch (error) {
      console.error("Ledger fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Ledgers" });
    }
  });

  // ============== CONTRIBUTION ECONOMY (architectural stubs) ==============
  // Read-only endpoints powering the /hub/earn page. Earn-event recording,
  // escrow holds, waitlist matching and staking are future engines that hook
  // into existing creditTokens/debitTokens via typed kinds.

  // Earn catalog — canonical list of token-earning ways. Static for now;
  // values are conservative and meant as utility credit, NOT speculation.
  app.get("/api/hub/economy/earn-catalog", async (_req: Request, res: Response) => {
    res.json({
      catalog: [
        { kind: "referral",            tokens: 250,  cap: "per active partner",    desc: "Bring a partner who completes onboarding." },
        { kind: "referred_customer",   tokens: 25,   cap: "per booked Auftrag",    desc: "Refer a customer who books a real repair." },
        { kind: "review",              tokens: 30,   cap: "1× per Auftrag",        desc: "Verified Google / portal review after repair." },
        { kind: "workflow_use",        tokens: 5,    cap: "per external use",      desc: "Build an AI workflow others reuse." },
        { kind: "template",            tokens: 80,   cap: "per accepted template", desc: "Submit document / message templates that get adopted." },
        { kind: "training_ai",         tokens: 15,   cap: "per validated batch",   desc: "Label damage photos / correct AI extractions." },
        { kind: "content",             tokens: 120,  cap: "per published piece",   desc: "Educational content (article / video / case study)." },
        { kind: "doc_improvement",     tokens: 25,   cap: "per merged change",     desc: "Improve documentation or translation." },
        { kind: "bug_fix",             tokens: 200,  cap: "per accepted PR",       desc: "Fix a bug in the Hub+1 codebase." },
        { kind: "onboarding_partner",  tokens: 500,  cap: "per signed partner",    desc: "Recruit and shepherd a new workshop into the network." },
        { kind: "social_growth",       tokens: 50,   cap: "per 100 reach",         desc: "Genuine social reach driving qualified traffic." },
        { kind: "community_answer",    tokens: 10,   cap: "per accepted answer",   desc: "Answer questions in community / partner forum." },
      ],
      penalties: [
        { kind: "late_cancel",  tokens: -100, desc: "Cancel < 24h before slot, slot stays empty." },
        { kind: "no_show",      tokens: -250, desc: "No-show on confirmed appointment." },
        { kind: "fake_booking", tokens: -500, desc: "Booking proven fake (after dispute)." },
        { kind: "spam_review",  tokens: -50,  desc: "Review removed for spam / policy." },
      ],
      escrow: {
        slotDepositCents: 1000, // 10€ default per Auftrag slot
        replacedFeeCents: 200,  // 2€ processing if slot is auto-refilled
        emptyPenaltyCents: 1000, // 10€ kept if slot stays empty
        prepaymentDiscountBps: 300, // 3% off when fully prepaid
      },
      tokenMath: {
        utilityCreditEurPerToken: 1,
        monthlyEarnCapPerUser: 5000,   // anti-farm
        burnFeeBps: 200,                // 2% burned on EUR-conversion
        rewardPoolMonthlyShareBps: 1500, // up to 15% of revenue routed back
      },
    });
  });

  // Reputation snapshot for current user. Lazily creates a row at score=500.
  app.get("/api/hub/economy/reputation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const row = await storage.ensureReputation(user.id).catch(() => null);
      const score = row?.score ?? 500;
      const level =
        score >= 900 ? "Hub Pioneer" :
        score >= 750 ? "Trusted Partner" :
        score >= 600 ? "Builder" :
        score >= 400 ? "Member" : "New";
      res.json({
        score,
        level,
        completedJobs: row?.completedJobs ?? 0,
        cancellations: row?.cancellations ?? 0,
        noShows: row?.noShows ?? 0,
        reviewsAvg: row ? row.reviewsAvgX10 / 10 : 0,
        reviewsCount: row?.reviewsCount ?? 0,
        // benefits unlocked at this tier
        perks:
          score >= 750
            ? ["Priority scheduling", "Reduced escrow", "Premium AI access", "Higher earn caps"]
            : score >= 600
              ? ["Reduced escrow", "Earn cap +20%"]
              : ["Standard"],
      });
    } catch (error) {
      console.error("Reputation fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Reputation" });
    }
  });

  // Earnings summary for the current user — derives from existing tokenLedger.
  app.get("/api/hub/economy/earnings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const ledger = await storage.getTokenLedger(user.id, 500);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const credits = ledger.filter((e: any) => e.delta > 0);
      const monthEarned = credits
        .filter((e: any) => new Date(e.createdAt) >= monthStart)
        .reduce((s: number, e: any) => s + e.delta, 0);
      const lifetimeEarned = credits.reduce((s: number, e: any) => s + e.delta, 0);
      const byKind: Record<string, number> = {};
      for (const e of credits as any[]) {
        byKind[e.reason] = (byKind[e.reason] ?? 0) + e.delta;
      }
      res.json({ monthEarned, lifetimeEarned, byKind });
    } catch (error) {
      console.error("Earnings fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Earnings" });
    }
  });

  // Escrow holds for current user — list + summary by status.
  app.get("/api/hub/economy/escrow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const holds = await storage.getEscrowsByUser(user.id, status);
      const summary = holds.reduce(
        (acc, h) => {
          acc.byStatus[h.status] = (acc.byStatus[h.status] ?? 0) + 1;
          if (h.status === "held") acc.heldCents += h.amountCents;
          if (h.status === "forfeited") acc.forfeitedCents += h.amountCents;
          if (h.status === "refunded") acc.refundedCents += h.amountCents;
          return acc;
        },
        { byStatus: {} as Record<string, number>, heldCents: 0, forfeitedCents: 0, refundedCents: 0 },
      );
      res.json({ holds, summary });
    } catch (error) {
      console.error("Escrow fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Escrow-Holds" });
    }
  });

  // List of referrals attributed to current user.
  app.get("/api/hub/economy/referrals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const list = await storage.getReferralsByReferrer(user.id);
      // Resolve referred user names for nicer UI.
      const enriched = await Promise.all(
        list.slice(0, 100).map(async (r) => {
          const u = await storage.getUser(r.referredUserId).catch(() => null);
          return {
            id: r.id,
            status: r.status,
            rewardTokens: r.rewardTokens,
            source: r.source,
            createdAt: r.createdAt,
            rewardedAt: r.rewardedAt,
            referredEmail: u?.email ?? null,
            referredName:
              [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null,
            referredRole: u?.role ?? null,
          };
        }),
      );
      const totals = {
        count: list.length,
        active: list.filter((r) => r.status !== "pending" && r.status !== "revoked").length,
        rewarded: list.filter((r) => r.status === "rewarded").length,
        tokensEarned: list.reduce((s, r) => s + (r.rewardTokens || 0), 0),
      };
      res.json({ referrals: enriched, totals });
    } catch (error) {
      console.error("Referrals fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Referrals" });
    }
  });

  // ============== WAITLIST (Hub+1 standby queue) ==============

  // Join the waitlist. Body: locationId?, preferredFrom?, preferredTo?,
  //                         serviceKind?, autoAccept?, contactPref?
  app.post("/api/hub/economy/waitlist", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const body: any = { ...(req.body ?? {}), userId: user.id };
      if (typeof body.preferredFrom === "string") body.preferredFrom = new Date(body.preferredFrom);
      if (typeof body.preferredTo === "string") body.preferredTo = new Date(body.preferredTo);
      const data = insertAppointmentWaitlistSchema.parse(body);
      const entry = await storage.createWaitlistEntry(data);
      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Waitlist join error:", error);
      const code = error?.name === "ZodError" ? 400 : 500;
      res.status(code).json({ message: "Fehler beim Eintragen in die Warteliste", error: error?.message });
    }
  });

  // List my waitlist entries.
  app.get("/api/hub/economy/waitlist", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const entries = await storage.getWaitlistByUser(user.id);
      res.json({ entries, count: entries.length });
    } catch (error) {
      console.error("Waitlist fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Warteliste" });
    }
  });

  // Cancel my waitlist entry.
  app.patch("/api/hub/economy/waitlist/:id/cancel", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const entry = await storage.getWaitlistEntry(req.params.id);
      if (!entry) return res.status(404).json({ message: "Eintrag nicht gefunden" });
      if (entry.userId !== user.id) return res.status(403).json({ message: "Nicht berechtigt" });
      const updated = await storage.updateWaitlistEntry(req.params.id, { status: "cancelled" });
      res.json(updated);
    } catch (error) {
      console.error("Waitlist cancel error:", error);
      res.status(500).json({ message: "Fehler beim Abbrechen" });
    }
  });

  // ============== STAKING (Hub+1 pools) ==============

  const stakeBodySchema = z.object({
    pool: z.enum(["ai_infra", "partner_pool", "growth", "governance"]),
    amount: z.number().int().positive(),
    lockDays: z.number().int().min(0).max(3650),
  });

  // Catalog + my positions (with live accrued rewards) + global pool totals.
  app.get("/api/hub/economy/staking", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const [positions, totals] = await Promise.all([
        storage.getStakingPositionsByUser(user.id),
        storage.getPoolTotals(),
      ]);
      const now = new Date();
      const enriched = positions.map((p) => {
        const accrued = p.status === "active" ? calculateAccruedRewards(p, now) : 0;
        const unlocked = !p.lockUntil || new Date(p.lockUntil).getTime() <= now.getTime();
        return { ...p, accruedRewards: accrued, unlocked };
      });
      res.json({
        catalog: POOL_CATALOG,
        positions: enriched,
        poolTotals: totals,
      });
    } catch (error) {
      console.error("Staking fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Staking-Daten" });
    }
  });

  // Stake tokens into a pool.
  app.post("/api/hub/economy/staking", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const data = stakeBodySchema.parse(req.body);
      const result = await stakeTokens({
        userId: user.id,
        pool: data.pool as PoolKey,
        amount: data.amount,
        lockDays: data.lockDays,
      });
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Staking error:", error);
      const msg = String(error?.message || error);
      if (msg === "INSUFFICIENT_TOKENS") return res.status(400).json({ message: "Nicht genug Tokens", code: msg });
      if (msg === "AMOUNT_BELOW_MIN") return res.status(400).json({ message: "Betrag unter Mindeststake", code: msg });
      if (msg === "INVALID_LOCK_DURATION") return res.status(400).json({ message: "Ungültige Sperrfrist", code: msg });
      if (msg === "UNKNOWN_POOL") return res.status(400).json({ message: "Unbekannter Pool", code: msg });
      const code = error?.name === "ZodError" ? 400 : 500;
      res.status(code).json({ message: "Fehler beim Staking", error: msg });
    }
  });

  // Unstake (after lockUntil). Credits principal + accrued rewards.
  app.post("/api/hub/economy/staking/:id/unstake", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const result = await unstakeTokens({ userId: user.id, positionId: req.params.id });
      res.json(result);
    } catch (error: any) {
      console.error("Unstake error:", error);
      const msg = String(error?.message || error);
      if (msg === "POSITION_NOT_FOUND") return res.status(404).json({ message: "Position nicht gefunden", code: msg });
      if (msg === "FORBIDDEN") return res.status(403).json({ message: "Nicht berechtigt", code: msg });
      if (msg === "STILL_LOCKED") return res.status(400).json({ message: "Noch gesperrt", code: msg });
      if (msg === "POSITION_NOT_ACTIVE") return res.status(400).json({ message: "Position nicht aktiv", code: msg });
      if (msg === "WITHDRAW_RACE") return res.status(409).json({ message: "Bereits abgehoben", code: msg });
      if (msg === "INVALID_TOTAL_CREDIT") return res.status(500).json({ message: "Ungültiger Auszahlungsbetrag", code: msg });
      res.status(500).json({ message: "Fehler beim Unstake", error: msg });
    }
  });

  // ============== DASHBOARD ==============
  
  // Get dashboard stats (Mission Control)
  app.get("/api/hub/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      const recentOrders = await storage.getAllOrders();
      const resources = await storage.getAllResources();
      
      res.json({
        stats,
        recentOrders: recentOrders.slice(0, 10),
        resources,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Dashboards" });
    }
  });

  // ============== VEHICLES ==============

  app.get("/api/hub/vehicles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Vehicles error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Fahrzeuge" });
    }
  });

  app.post("/api/hub/vehicles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validated = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validated);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Create vehicle error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Fahrzeugs" });
    }
  });

  app.get("/api/hub/vehicles/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: "Fahrzeug nicht gefunden" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Get vehicle error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Fahrzeugs" });
    }
  });

  // ============== RESOURCES ==============

  app.get("/api/hub/resources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      let resources;
      if (type && typeof type === 'string') {
        resources = await storage.getResourcesByType(type);
      } else {
        resources = await storage.getAllResources();
      }
      res.json(resources);
    } catch (error) {
      console.error("Resources error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Ressourcen" });
    }
  });

  app.post("/api/hub/resources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validated = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validated);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Ressource" });
    }
  });

  // ============== ORDERS ==============

  app.get("/api/hub/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      let orders;
      if (status && typeof status === 'string') {
        orders = await storage.getOrdersByStatus(status);
      } else {
        orders = await storage.getAllOrders();
      }
      res.json(orders);
    } catch (error) {
      console.error("Orders error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Aufträge" });
    }
  });

  app.post("/api/hub/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validated = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validated);
      // Auto-create reception triage task on the AI Agent Task Board.
      // Strictly best-effort: a task-board failure must NEVER fail the order POST.
      try {
        const { autoCreateBoardTask } = await import("../services/taskAutoCreate");
        const userId = (req.user as any)?.id ?? null;
        const impactCents = Number((order as any).totalGrossCents ?? (order as any).totalNetCents ?? 0);
        const refNum = (order as any).referenceNumber ?? order.id.slice(0, 8);
        await autoCreateBoardTask({
          title: `Triage neuer Auftrag #${refNum}`,
          description: (order as any).damageDescription ?? undefined,
          sourceType: "auftrag",
          sourceId: order.id,
          impactValueCents: impactCents,
          createdById: userId,
          payload: { orderId: order.id },
        });
      } catch (e) {
        console.warn("[hub.orders] task-board auto-create failed (non-fatal):", String(e));
      }
      // Best-effort scheduler analysis when order has effort estimate.
      if ((order as any).estimatedWorkMinutes && (order as any).estimatedWorkMinutes > 0) {
        setImmediate(async () => {
          try {
            const { analyzeWindow, emitSuggestionTasks } = await import("../services/schedulerAgent");
            const from = new Date();
            const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
            const result = await analyzeWindow(from, to);
            if (result.suggestions.length > 0) await emitSuggestionTasks(result.suggestions, (req.user as any)?.id ?? null);
          } catch (e) {
            console.warn("[hub.orders] scheduler analyze failed (non-fatal):", String(e));
          }
        });
      }
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Auftrags" });
    }
  });

  app.get("/api/hub/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Auftrag nicht gefunden" });
      }
      
      // Get related data
      const lineItems = await storage.getLineItemsByOrder(req.params.id);
      const mediaFiles = await storage.getMediaFilesByOrder(req.params.id);
      
      res.json({ ...order, lineItems, mediaFiles });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Auftrags" });
    }
  });

  app.patch("/api/hub/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Auftrag nicht gefunden" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Auftrags" });
    }
  });

  app.patch("/api/hub/orders/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const updateData: any = { status };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      const prev = await storage.getOrder(req.params.id).catch(() => null);
      if (!prev) {
        return res.status(404).json({ message: "Auftrag nicht gefunden" });
      }

      // ── Authorization: only admin OR the assigned partner OR the order's client.
      // Prevents arbitrary authenticated users from forcing terminal status to farm reputation.
      const actor = req.user as any;
      const actorId: string | null = actor?.id ?? null;
      const actorRole: string = actor?.role ?? "";
      const isOwnerClient = !!actorId && (prev as any).clientId === actorId;
      let assignedPartnerUserId: string | null = null;
      const resourceId = (prev as any).assignedResourceId as string | null;
      if (resourceId) {
        const resource = await storage.getResource(resourceId).catch(() => null);
        assignedPartnerUserId = (resource as any)?.userId ?? null;
      }
      const isAssignedPartner = !!actorId && !!assignedPartnerUserId && assignedPartnerUserId === actorId;
      const isPrivileged = actorRole === "admin" || actorRole === "manager";
      if (!isPrivileged && !isOwnerClient && !isAssignedPartner) {
        return res.status(403).json({ message: "Keine Berechtigung" });
      }

      await storage.updateOrder(req.params.id, updateData);
      // Re-fetch authoritative row (neon-http returning() can be flaky on UPDATE).
      const order = (await storage.getOrder(req.params.id).catch(() => null)) ?? {
        ...prev,
        ...updateData,
      };

      // Hub+1 Reputation Engine — fire-and-forget terminal-status hook.
      // Per-order idempotency: if prev.completedAt already set, skip credit.
      const alreadyCredited = !!(prev as any).completedAt;
      console.log(`[Reputation] hook fire: ${prev.status} → ${status} actor=${actorId} partner=${assignedPartnerUserId} alreadyCredited=${alreadyCredited}`);
      onAuftragStatusChange(prev.status ?? "draft", status, {
        actorId,
        partnerId: assignedPartnerUserId,
        clientId: (prev as any).clientId ?? null,
        alreadyCredited,
      }).catch((e) => console.error("[Reputation] hook error:", e));

      // Hub+1 Escrow — release on terminal completion, late/early cancel routing on cancellation.
      const TERMINAL = new Set(["completed", "paid", "invoiced"]);
      if (TERMINAL.has(status) && !TERMINAL.has(prev.status ?? "")) {
        releaseEscrow(req.params.id).catch((e) => console.error("[Escrow] release hook error:", e));
      } else if (status === "cancelled" && prev.status !== "cancelled") {
        // Use raw SQL to bypass neon-http timestamp parsing issue when reading start_time.
        (async () => {
          let start: Date | null = null;
          try {
            const rows: any = await db.execute(sql`
              SELECT start_time FROM appointments
              WHERE order_id = ${req.params.id} AND status <> 'cancelled'
              ORDER BY start_time ASC LIMIT 1
            `);
            const list = (rows as any).rows ?? rows;
            const t = list?.[0]?.start_time;
            if (t) start = new Date(t);
          } catch (e) { console.error("[Escrow] apptStart lookup err:", e); }
          // Pass null filters: waitlist matcher will broaden match when location/service unknown.
          await onEscrowCancellation({
            auftragId: req.params.id,
            appointmentStart: start,
            locationId: null,
            serviceKind: null,
          });
        })().catch((e) => console.error("[Escrow] cancel hook error:", e));
      }

      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Status" });
    }
  });

  // ============== APPOINTMENTS (Calendar) ==============

  app.get("/api/hub/appointments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { start, end, resourceId } = req.query;
      
      let appointments;
      if (start && end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        
        if (resourceId && typeof resourceId === 'string') {
          appointments = await storage.getAppointmentsByResource(resourceId, startDate, endDate);
        } else {
          appointments = await storage.getAppointmentsInRange(startDate, endDate);
        }
      } else {
        // Get appointments for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        appointments = await storage.getAppointmentsInRange(startOfMonth, endOfMonth);
      }
      
      res.json(appointments);
    } catch (error) {
      console.error("Appointments error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Termine" });
    }
  });

  app.post("/api/hub/appointments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Coerce ISO date strings → Date for zod (frontend sends JSON strings).
      const body = { ...req.body };
      if (typeof body.startTime === "string") body.startTime = new Date(body.startTime);
      if (typeof body.endTime === "string") body.endTime = new Date(body.endTime);
      // Extract workshopOrderId before schema parse — it's not an appointments column.
      const workshopOrderId: string | undefined = typeof body.workshopOrderId === "string" ? body.workshopOrderId : undefined;
      delete body.workshopOrderId;
      const validated = insertAppointmentSchema.parse(body);
      const appointment = await storage.createAppointment(validated);

      // Write the canonical back-link: workshop_orders.appointment_id → new appointment.
      if (workshopOrderId) {
        storage.updateWorkshopOrder(workshopOrderId, { appointmentId: appointment.id }).catch((e) =>
          console.error("[hub] appointment_id write-back failed for workshop order", workshopOrderId, e),
        );
      }

      // Hub+1 Escrow — place a deposit hold on the order linked to this appointment.
      if (appointment.orderId) {
        const order = await storage.getOrder(appointment.orderId).catch(() => null);
        const userId = (order as any)?.clientId ?? (req.user as any)?.id ?? null;
        let partnerId: string | null = null;
        if ((order as any)?.assignedResourceId) {
          const r = await storage.getResource((order as any).assignedResourceId).catch(() => null);
          partnerId = (r as any)?.userId ?? null;
        }
        if (userId) {
          placeEscrow({
            userId,
            auftragId: appointment.orderId,
            partnerId,
            reason: "appointment_deposit",
          }).catch((e) => console.error("[Escrow] place hook error:", e));
        }
      }

      res.status(201).json(appointment);
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Termins" });
    }
  });

  app.patch("/api/hub/appointments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const prev = await storage.getAppointment(req.params.id).catch(() => null);
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ message: "Termin nicht gefunden" });
      }
      // Hub+1 Escrow — appointment marked as no_show forfeits the deposit.
      if (
        prev && prev.status !== "no_show" && (appointment.status === "no_show" || req.body?.status === "no_show") &&
        appointment.orderId
      ) {
        forfeitEscrow(appointment.orderId, "no_show").catch((e) =>
          console.error("[Escrow] no_show hook error:", e),
        );
      }
      res.json(appointment);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Termins" });
    }
  });

  app.delete("/api/hub/appointments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Termins" });
    }
  });

  // ============== LINE ITEMS ==============

  app.post("/api/hub/orders/:orderId/line-items", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const lineItem = await storage.createLineItem({
        ...req.body,
        orderId: req.params.orderId,
      });
      res.status(201).json(lineItem);
    } catch (error) {
      console.error("Create line item error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Position" });
    }
  });

  app.delete("/api/hub/line-items/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteLineItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete line item error:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Position" });
    }
  });

  // ============== SEED DATA (Development) ==============

  app.post("/api/hub/seed", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Create resources (Technicians and Equipment)
      const alex = await storage.createResource({
        name: "Alex (Vopsitor)",
        type: "technician",
        color: "#3B82F6",
        skills: ["lackierung", "spot-repair"],
        hourlyRate: 4500,
      });

      const victor = await storage.createResource({
        name: "Victor (Pregătire)",
        type: "technician", 
        color: "#10B981",
        skills: ["vorbereitung", "schleifen", "spachteln"],
        hourlyRate: 3500,
      });

      const cabin1 = await storage.createResource({
        name: "Cabina de Vopsit 1",
        type: "paint_booth",
        color: "#8B5CF6",
      });

      // Create sample vehicles
      const golf = await storage.createVehicle({
        make: "Volkswagen",
        model: "Golf",
        year: 2019,
        licensePlate: "WI-AB 1234",
        color: "Grau",
        vin: "WVWZZZ1KZBW055093",
      });

      const bmw = await storage.createVehicle({
        make: "BMW",
        model: "318",
        year: 2020,
        licensePlate: "MZ-CD 5678",
        color: "Schwarz",
      });

      // Create sample orders
      const order1 = await storage.createOrder({
        vehicleId: golf.id,
        status: "pending_review",
        priority: "normal",
        damageDescription: "Heckklappe: Delle (klein) ohne Lackschaden",
        damageLocation: "Heckklappe",
        postalCode: "55129",
      });

      const order2 = await storage.createOrder({
        vehicleId: bmw.id,
        status: "in_repair",
        priority: "high",
        damageDescription: "Stoßstange vorne: Kratzer und Lackabplatzer",
        damageLocation: "Stoßstange vorne",
        postalCode: "65719",
        assignedResourceId: alex.id,
        totalNetCents: 107600,
        totalGrossCents: 128044,
        estimatedDays: 3,
      });

      // Create appointment for order2
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      const appointmentEnd = new Date(tomorrow);
      appointmentEnd.setHours(17, 0, 0, 0);

      await storage.createAppointment({
        orderId: order2.id,
        resourceId: alex.id,
        title: `BMW 318 - Stoßstange`,
        startTime: tomorrow,
        endTime: appointmentEnd,
        status: "scheduled",
      });

      res.json({
        message: "Seed-Daten erfolgreich erstellt",
        resources: [alex, victor, cabin1],
        vehicles: [golf, bmw],
        orders: [order1, order2],
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Seed-Daten" });
    }
  });

  // ============== FINANCIAL PROFILES ==============

  app.get("/api/hub/financial-profiles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUser(req).id;
      const user = await storage.getUser(userId);
      const profiles = user?.role === 'admin'
        ? await storage.getAllFinancialProfiles()
        : await storage.getFinancialProfilesByUser(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Financial profiles error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Profile" });
    }
  });

  app.post("/api/hub/financial-profiles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validated = insertFinancialProfileSchema.parse({
        ...req.body,
        userId: getUser(req).id,
      });
      const profile = await storage.createFinancialProfile(validated);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Create financial profile error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Profils" });
    }
  });

  app.get("/api/hub/financial-profiles/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getFinancialProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && profile.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Get financial profile error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Profils" });
    }
  });

  app.patch("/api/hub/financial-profiles/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getFinancialProfile(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && existing.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      const validated = insertFinancialProfileSchema.partial().parse(req.body);
      const profile = await storage.updateFinancialProfile(req.params.id, validated);
      res.json(profile);
    } catch (error) {
      console.error("Update financial profile error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Profils" });
    }
  });

  app.delete("/api/hub/financial-profiles/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getFinancialProfile(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && existing.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      await storage.deleteFinancialProfile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete financial profile error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Profils" });
    }
  });

  // ============== BWA ENTRIES ==============

  app.get("/api/hub/financial-profiles/:profileId/bwa", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getFinancialProfile(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && profile.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      const entries = await storage.getBwaEntriesByProfile(req.params.profileId);
      res.json(entries);
    } catch (error) {
      console.error("BWA entries error:", error);
      res.status(500).json({ message: "Fehler beim Laden der BWA-Daten" });
    }
  });

  app.post("/api/hub/financial-profiles/:profileId/bwa", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getFinancialProfile(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && profile.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      const validated = insertBwaEntrySchema.parse({
        ...req.body,
        profileId: req.params.profileId,
      });
      const entry = await storage.createBwaEntry(validated);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Create BWA entry error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des BWA-Eintrags" });
    }
  });

  app.patch("/api/hub/bwa/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getBwaEntry(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "BWA-Eintrag nicht gefunden" });
      }
      const profile = await storage.getFinancialProfile(existing.profileId);
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && profile?.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      const validated = insertBwaEntrySchema.partial().parse(req.body);
      const entry = await storage.updateBwaEntry(req.params.id, validated);
      res.json(entry);
    } catch (error) {
      console.error("Update BWA entry error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des BWA-Eintrags" });
    }
  });

  app.delete("/api/hub/bwa/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getBwaEntry(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "BWA-Eintrag nicht gefunden" });
      }
      const profile = await storage.getFinancialProfile(existing.profileId);
      const user = await storage.getUser(getUser(req).id);
      if (user?.role !== 'admin' && profile?.userId !== getUser(req).id) {
        return res.status(403).json({ message: "Kein Zugriff" });
      }
      await storage.deleteBwaEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete BWA entry error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des BWA-Eintrags" });
    }
  });

  // ============== FINANCE DASHBOARD ==============

  app.get("/api/hub/finance/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getExpenseCategoriesByUser(getUser(req).id);
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Kategorien" });
    }
  });

  app.post("/api/hub/finance/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validated = insertExpenseCategorySchema.parse({ ...req.body, userId: getUser(req).id });
      const category = await storage.createExpenseCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Kategorie" });
    }
  });

  app.patch("/api/hub/finance/categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userCats = await storage.getExpenseCategoriesByUser(getUser(req).id);
      const owned = userCats.find(c => c.id === req.params.id);
      if (!owned) return res.status(404).json({ message: "Kategorie nicht gefunden" });
      const { userId, ...rest } = insertExpenseCategorySchema.partial().parse(req.body);
      const category = await storage.updateExpenseCategory(req.params.id, rest);
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Kategorie" });
    }
  });

  app.delete("/api/hub/finance/categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userCats = await storage.getExpenseCategoriesByUser(getUser(req).id);
      const owned = userCats.find(c => c.id === req.params.id);
      if (!owned) return res.status(404).json({ message: "Kategorie nicht gefunden" });
      await storage.deleteExpenseCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Kategorie" });
    }
  });

  app.post("/api/hub/finance/categories/seed", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getExpenseCategoriesByUser(getUser(req).id);
      if (existing.length > 0) {
        return res.json({ message: "Kategorien bereits vorhanden", categories: existing });
      }
      const defaults = [
        { name: "Materiale Vopsitorie", type: "variable", targetGuwPercent: 0, isDefault: true },
        { name: "Piese Auto / Ersatzteile", type: "variable", targetGuwPercent: 10, isDefault: true },
        { name: "Subcontractori / Manopera Externa", type: "variable", targetGuwPercent: 0, isDefault: true },
        { name: "Salarii / Personal", type: "fixed", targetGuwPercent: 0, isDefault: true },
        { name: "Chirie & Utilitati", type: "fixed", targetGuwPercent: 0, isDefault: true },
        { name: "Marketing & Soft", type: "fixed", targetGuwPercent: 0, isDefault: true },
      ];
      const created = [];
      for (const cat of defaults) {
        const c = await storage.createExpenseCategory({ ...cat, userId: getUser(req).id, isActive: true });
        created.push(c);
      }
      res.status(201).json(created);
    } catch (error) {
      console.error("Seed categories error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Standard-Kategorien" });
    }
  });

  app.get("/api/hub/finance/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getFinancialTransactionsByUser(getUser(req).id);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Transaktionen" });
    }
  });

  app.post("/api/hub/finance/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const body = { ...req.body, userId: getUser(req).id };
      if (typeof body.date === "string") body.date = new Date(body.date);
      const validated = insertFinancialTransactionSchema.parse(body);
      const transaction = await storage.createFinancialTransaction(validated);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Transaktion" });
    }
  });

  app.patch("/api/hub/finance/transactions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userTxs = await storage.getFinancialTransactionsByUser(getUser(req).id);
      const owned = userTxs.find(t => t.id === req.params.id);
      if (!owned) return res.status(404).json({ message: "Transaktion nicht gefunden" });
      const { userId, ...rest } = insertFinancialTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateFinancialTransaction(req.params.id, rest);
      res.json(transaction);
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Transaktion" });
    }
  });

  app.delete("/api/hub/finance/transactions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userTxs = await storage.getFinancialTransactionsByUser(getUser(req).id);
      const owned = userTxs.find(t => t.id === req.params.id);
      if (!owned) return res.status(404).json({ message: "Transaktion nicht gefunden" });
      await storage.deleteFinancialTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Transaktion" });
    }
  });
}
