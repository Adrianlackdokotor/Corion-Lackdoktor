// Workshop OS REST surface — Fixico-style operational endpoints.
// Mirrors the 6 pending-action tiles from the Fixico dashboard and the
// Auftragsdetail wizard. All endpoints are admin/partner protected.

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";
import {
  WORKSHOP_ACTIONS,
  buildWorkshopDashboard,
  dispatchWorkshopAction,
  timelineStep,
  type WorkshopAction,
} from "../services/workshopAgents";
import { generateOrderCrmInsight } from "../services/orderCrmAi";
import {
  computeAndPersistSplit,
  processPayoutOnPaid,
  releaseDueRetentions,
} from "../services/payoutEngine";
import {
  insertOrderCrmLinkSchema,
  insertOrderFollowUpSchema,
  insertOrderTimelineEventSchema,
} from "@shared/schema";
import { writeCoordMessage } from "../services/coordMessages";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ["angenommen", "cancelled"],
  angenommen: ["in_bearbeitung", "cancelled"],
  in_bearbeitung: ["fertig", "cancelled"],
  fertig: ["completed", "in_bearbeitung"],
  completed: [],
  cancelled: ["open"],
};

async function isAdmin(req: Request): Promise<boolean> {
  const u = (req as any).user;
  const id = u?.id ?? u?.claims?.sub ?? null;
  if (!id) return false;
  const full = await storage.getUser(id);
  return full?.role === "admin";
}

async function isAdminOrPartner(req: Request): Promise<{ ok: boolean; userId: string | null; role: string | null }> {
  const u = (req as any).user;
  const id = u?.id ?? u?.claims?.sub ?? null;
  if (!id) return { ok: false, userId: null, role: null };
  const full = await storage.getUser(id);
  const role = full?.role ?? null;
  return { ok: role === "admin" || role === "partner", userId: id, role };
}

export function registerWorkshopRoutes(app: Express) {
  // Dashboard tiles + recent orders for the Workshop OS shell.
  app.get("/api/workshop/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    const { ok } = await isAdminOrPartner(req);
    if (!ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    try {
      const auth2 = await isAdminOrPartner(req);
      const data = await buildWorkshopDashboard({ role: auth2.role ?? "partner", userId: auth2.userId ?? "" });
      res.json(data);
    } catch (err: any) {
      console.error("[workshop] dashboard error", err);
      res.status(500).json({ message: "Dashboard konnte nicht geladen werden", error: err?.message });
    }
  });

  // Single Auftrag with timeline step + counts (for the detail page).
  app.get("/api/workshop/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    try {
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (auth.role !== "admin" && order.partnerId !== auth.userId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const files = await storage.getFileAttachmentsByOrder(order.id).catch(() => [] as any[]);
      const allowedNext = STATUS_TRANSITIONS[order.status] ?? [];
      res.json({
        order,
        timelineStep: timelineStep(order.status),
        allowedNext,
        files,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Fehler beim Laden", error: err?.message });
    }
  });

  // Status transition with whitelisted edges + audit + downstream agent fire.
  app.post("/api/workshop/orders/:id/transition", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const schema = z.object({ to: z.string().min(1), note: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    try {
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (auth.role !== "admin" && order.partnerId !== auth.userId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const allowed = STATUS_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(parsed.data.to)) {
        return res.status(400).json({
          message: `Übergang nicht erlaubt: ${order.status} → ${parsed.data.to}`,
          allowedNext: allowed,
        });
      }
      const updated = await storage.updateWorkshopOrder(order.id, { status: parsed.data.to });

      // Write status change to the order's coordination room (fire-and-forget)
      writeCoordMessage({
        channel:        `order:${order.id}`,
        authorSlug:     "system",
        authorRole:     "agent",
        body:           `Status: ${order.status} → ${parsed.data.to}`,
        intent:         "status",
        relatedOrderId: order.id,
      }).catch(() => {});

      // Faza A — A1: la trecerea în `fertig` calculăm și persistăm split-ul.
      if (parsed.data.to === "fertig") {
        try {
          await computeAndPersistSplit(order.id);
        } catch (e: any) {
          console.error("[workshop] split persist failed", e?.message);
        }
      }
      // Faza A — A2: la `completed`, dacă orderul e deja bezahlt, mintăm tokens.
      if (parsed.data.to === "completed" && order.paymentStatus === "bezahlt") {
        processPayoutOnPaid(order.id).catch((e) =>
          console.error("[workshop] payout-on-completed failed", e?.message),
        );
      }

      // Trigger the matching agent on key transitions (fire-and-forget).
      const triggerMap: Record<string, WorkshopAction | undefined> = {
        angenommen: "annahme",
        fertig: "rueckgabe",
        completed: "rechnung",
      };
      const action = triggerMap[parsed.data.to];
      if (action) {
        dispatchWorkshopAction({
          action,
          orderId: order.id,
          note: parsed.data.note ?? `Auto-Trigger nach Statuswechsel → ${parsed.data.to}`,
          createdById: auth.userId,
        })
          .then((result) => {
            if (result.ok) {
              writeCoordMessage({
                channel:        `order:${order.id}`,
                authorSlug:     "system",
                authorRole:     "agent",
                body:           `🤖 ${WORKSHOP_ACTIONS[action!].titleDe} → ${result.agent}`,
                intent:         "status",
                relatedOrderId: order.id,
              }).catch(() => {});
            }
          })
          .catch((e) => console.error("[workshop] post-transition dispatch failed", e));
      }

      res.json({
        order: updated,
        timelineStep: timelineStep(updated?.status ?? order.status),
        allowedNext: STATUS_TRANSITIONS[updated?.status ?? order.status] ?? [],
        triggeredAgent: action ? WORKSHOP_ACTIONS[action].agent : null,
      });
    } catch (err: any) {
      console.error("[workshop] transition error", err);
      res.status(500).json({ message: "Übergang fehlgeschlagen", error: err?.message });
    }
  });

  // List approved partners (for the Auftrag Partner dropdown / split picker).
  app.get("/api/workshop/partners", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Nur für Admin" });
    try {
      // Use raw SQL — drizzle 0.39.1 + neon-http misreads boolean columns
      // ordered late in the users table (e.g. is_approved). Raw query is safe
      // and matches the COALESCE pattern used elsewhere (cfo cashflow).
      const result = await db.execute(sql`
        SELECT id, first_name AS "firstName", last_name AS "lastName", email,
               company, partner_share_percent AS "partnerSharePercent",
               material_percent AS "materialPercent"
          FROM users
         WHERE role = 'partner' AND is_approved = true
         ORDER BY COALESCE(NULLIF(TRIM(company), ''), email)
      `);
      res.json(result.rows ?? []);
    } catch (err: any) {
      console.error("[workshop] partners error", err);
      res.status(500).json({ message: "Partner konnten nicht geladen werden", error: err?.message });
    }
  });

  // PATCH /api/workshop/orders/:id — full editable Auftrag (admin only).
  // Recomputes split immediately so the Rechnungsdaten card stays in sync.
  app.patch("/api/workshop/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Nur für Admin" });
    const partnerSplitSchema = z.object({
      partnerId: z.string().min(1),
      sharePercent: z.number().min(0).max(200),
      label: z.string().nullable().optional(),
    });
    const schema = z.object({
      customerName: z.string().optional(),
      customerPhone: z.string().nullable().optional(),
      customerEmail: z.string().nullable().optional(),
      customerAddress: z.string().nullable().optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      vehiclePlate: z.string().nullable().optional(),
      vehicleVin: z.string().nullable().optional(),
      vehicleColor: z.string().nullable().optional(),
      vehicleMileage: z.string().nullable().optional(),
      damageDescription: z.string().nullable().optional(),
      priorDamage: z.string().nullable().optional(),
      internalNote: z.string().nullable().optional(),
      status: z.string().optional(),
      scheduledDate: z.string().nullable().optional(),
      deliveryDate: z.string().nullable().optional(),
      pickupDate: z.string().nullable().optional(),
      laborAmountCents: z.number().int().nonnegative().optional(),
      partsAmountCents: z.number().int().nonnegative().optional(),
      partnerId: z.string().nullable().optional(),
      partnerSplitsJson: z.array(partnerSplitSchema).nullable().optional(),
      materialsBilledSeparately: z.boolean().optional(),
      materialBdePercentOverride: z.number().int().min(0).max(100).nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    try {
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      const patch: any = { ...parsed.data };
      // Keep totalAmountCents in sync = labor + parts (gross client price net is labor+parts; VAT applied at render).
      const newLabor = patch.laborAmountCents ?? order.laborAmountCents ?? 0;
      const newParts = patch.partsAmountCents ?? order.partsAmountCents ?? 0;
      patch.totalAmountCents = newLabor + newParts;
      // Convert date strings to Date objects for Drizzle timestamp columns.
      for (const field of ["scheduledDate", "deliveryDate", "pickupDate"] as const) {
        if (patch[field] === null) {
          // explicit null → clear the field
        } else if (typeof patch[field] === "string" && patch[field]) {
          patch[field] = new Date(patch[field]);
        } else if (patch[field] !== undefined) {
          delete patch[field];
        }
      }
      // Merge internalNote into repairProtocolJson rather than its own column.
      if (patch.internalNote !== undefined) {
        const existingMeta = (order.repairProtocolJson as any) || {};
        patch.repairProtocolJson = { ...existingMeta, internalNote: patch.internalNote ?? "" };
        delete patch.internalNote;
      }
      // Drizzle 0.39.1 + neon-http misserializes the 3 "extras" columns
      // (boolean / nullable int / jsonb) — write them via raw SQL only.
      const extrasMatSep = patch.materialsBilledSeparately;
      const extrasBdeOverride = patch.materialBdePercentOverride;
      const extrasSplitsRaw = patch.partnerSplitsJson;
      delete patch.materialsBilledSeparately;
      delete patch.materialBdePercentOverride;
      delete patch.partnerSplitsJson;
      const updated = await storage.updateWorkshopOrder(order.id, patch);
      // Apply the 3 extras directly via raw SQL (one statement per touched field
      // so we don't accidentally clobber values the caller didn't send).
      if (extrasMatSep !== undefined) {
        await db.execute(sql`
          UPDATE workshop_orders SET materials_billed_separately = ${!!extrasMatSep}
          WHERE id = ${order.id}
        `);
      }
      if (extrasBdeOverride !== undefined) {
        if (extrasBdeOverride === null) {
          await db.execute(sql`
            UPDATE workshop_orders SET material_bde_percent_override = NULL
            WHERE id = ${order.id}
          `);
        } else {
          await db.execute(sql`
            UPDATE workshop_orders SET material_bde_percent_override = ${Number(extrasBdeOverride)}
            WHERE id = ${order.id}
          `);
        }
      }
      if (extrasSplitsRaw !== undefined) {
        const splits = extrasSplitsRaw === null ? [] : extrasSplitsRaw;
        await db.execute(sql`
          UPDATE workshop_orders SET partner_splits_json = ${JSON.stringify(splits)}::jsonb
          WHERE id = ${order.id}
        `);
      }
      // Recompute split right away so the panel shows fresh numbers.
      // Pass the just-written extras explicitly — drizzle 0.39.1 + neon-http
      // misreads boolean/jsonb columns on the very next SELECT, so a re-read
      // would see stale/wrong values.
      let splitCalc: any = null;
      try {
        const r = await computeAndPersistSplit(order.id, {
          materialsBilledSeparately: extrasMatSep,
          materialBdePercentOverride: extrasBdeOverride,
          partnerSplitsJson:
            extrasSplitsRaw === null ? [] : (extrasSplitsRaw as any),
        });
        splitCalc = r?.calc ?? null;
      } catch (e: any) {
        console.error("[workshop] PATCH split recompute failed", e?.message);
      }
      const fresh = await storage.getWorkshopOrder(order.id);
      res.json({ order: fresh ?? updated, splitCalc });
    } catch (err: any) {
      console.error("[workshop] PATCH order error", err);
      res.status(500).json({ message: "Speichern fehlgeschlagen", error: err?.message });
    }
  });

  // Faza A — A2: PATCH payment status. When flipping to `bezahlt`, mints
  // tokens (1 token = 1 €) and creates the workshop_payouts row.
  app.patch("/api/workshop/orders/:id/payment", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    if (auth.role !== "admin") return res.status(403).json({ message: "Nur für Admin" });
    const schema = z.object({
      paymentStatus: z.enum(["offen", "teilweise", "bezahlt", "storniert"]),
      paidAmountCents: z.number().int().nonnegative().optional(),
      paymentMethod: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    try {
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      const patch: any = { paymentStatus: parsed.data.paymentStatus };
      if (parsed.data.paidAmountCents != null) patch.paidAmountCents = parsed.data.paidAmountCents;
      if (parsed.data.paymentMethod) patch.paymentMethod = parsed.data.paymentMethod;
      const updated = await storage.updateWorkshopOrder(order.id, patch);
      let payout = null as any;
      if (parsed.data.paymentStatus === "bezahlt") {
        payout = await processPayoutOnPaid(order.id).catch((e) => {
          console.error("[workshop] payout failed", e?.message);
          return null;
        });
      }
      res.json({ order: updated, payout });
    } catch (err: any) {
      res.status(500).json({ message: "Payment-Update fehlgeschlagen", error: err?.message });
    }
  });

  // Faza A — A3: Admin-trigger pentru jobul de eliberare a Sicherheitseinbehalt.
  app.post("/api/workshop/admin/release-retentions", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Nur für Admin" });
    try {
      const result = await releaseDueRetentions();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      res.status(500).json({ message: "Release fehlgeschlagen", error: err?.message });
    }
  });

  // Single AI dispatcher endpoint — one of the 6 Fixico actions.
  app.post("/api/workshop/ai/:action", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const action = req.params.action as WorkshopAction;
    if (!WORKSHOP_ACTIONS[action]) {
      return res.status(400).json({ message: `Unbekannte Aktion: ${action}` });
    }
    const schema = z.object({
      orderId: z.string().optional(),
      note: z.string().optional(),
      payload: z.record(z.any()).optional(),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    try {
      if (parsed.data.orderId && auth.role !== "admin") {
        const order = await storage.getWorkshopOrder(parsed.data.orderId).catch(() => null);
        if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
        if (order.partnerId !== auth.userId && order.createdBy !== auth.userId) {
          return res.status(403).json({ message: "Zugriff verweigert" });
        }
      }
      const result = await dispatchWorkshopAction({
        action,
        orderId: parsed.data.orderId,
        note: parsed.data.note,
        payload: parsed.data.payload,
        createdById: auth.userId,
      });
      res.json(result);
    } catch (err: any) {
      console.error("[workshop] ai dispatch error", err);
      res.status(500).json({ message: "AI-Aktion fehlgeschlagen", error: err?.message });
    }
  });

  // ============== CRM & AI panel (Salesforce-style) ==============
  // Bundle endpoint — returns links + follow-ups + insight + timeline in one shot.
  app.get("/api/workshop/orders/:id/crm", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    try {
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (auth.role !== "admin" && order.partnerId !== auth.userId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const [links, followUps, insight, events] = await Promise.all([
        storage.listOrderCrmLinks(order.id),
        storage.listOrderFollowUps(order.id),
        storage.getOrderAiInsight(order.id),
        storage.listOrderTimelineEvents(order.id, 50),
      ]);
      res.json({ links, followUps, insight: insight ?? null, events });
    } catch (err: any) {
      console.error("[workshop] crm bundle error", err);
      res.status(500).json({ message: "CRM konnte nicht geladen werden", error: err?.message });
    }
  });

  // Links
  app.post("/api/workshop/orders/:id/crm/links", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    const parsed = insertOrderCrmLinkSchema.safeParse({
      ...req.body, workshopOrderId: order.id, createdBy: auth.userId ?? null,
    });
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    try {
      const link = await storage.createOrderCrmLink(parsed.data);
      await storage.createOrderTimelineEvent({
        workshopOrderId: order.id, kind: "note", title: `Link hinzugefügt: ${link.label}`,
        message: link.url, actorId: auth.userId ?? null, actorLabel: auth.role ?? "user", metaJson: { kind: link.kind },
      });
      res.json(link);
    } catch (e: any) { res.status(500).json({ message: "Speichern fehlgeschlagen", error: e?.message }); }
  });
  app.delete("/api/workshop/orders/:id/crm/links/:linkId", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    const all = await storage.listOrderCrmLinks(order.id);
    if (!all.some((l) => l.id === req.params.linkId)) return res.status(404).json({ message: "Link gehört nicht zu diesem Auftrag" });
    await storage.deleteOrderCrmLink(req.params.linkId);
    res.json({ ok: true });
  });

  // Follow-ups
  app.post("/api/workshop/orders/:id/crm/follow-ups", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    const body = { ...req.body, workshopOrderId: order.id, createdBy: auth.userId ?? null };
    if (typeof body.dueAt === "string") body.dueAt = new Date(body.dueAt);
    const parsed = insertOrderFollowUpSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    try {
      const fu = await storage.createOrderFollowUp(parsed.data);
      await storage.createOrderTimelineEvent({
        workshopOrderId: order.id, kind: "follow_up",
        title: `Follow-Up: ${fu.message.slice(0, 60)}`, message: `Fällig: ${fu.dueAt.toISOString()}`,
        actorId: auth.userId ?? null, actorLabel: auth.role ?? "user", metaJson: { reason: fu.reason },
      });
      res.json(fu);
    } catch (e: any) { res.status(500).json({ message: "Speichern fehlgeschlagen", error: e?.message }); }
  });
  app.patch("/api/workshop/orders/:id/crm/follow-ups/:fid", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    const all = await storage.listOrderFollowUps(order.id);
    if (!all.some((f) => f.id === req.params.fid)) return res.status(404).json({ message: "Follow-Up gehört nicht zu diesem Auftrag" });
    const patch: any = { ...req.body };
    if (typeof patch.dueAt === "string") patch.dueAt = new Date(patch.dueAt);
    const updated = await storage.updateOrderFollowUp(req.params.fid, patch);
    res.json(updated);
  });
  app.delete("/api/workshop/orders/:id/crm/follow-ups/:fid", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    const all = await storage.listOrderFollowUps(order.id);
    if (!all.some((f) => f.id === req.params.fid)) return res.status(404).json({ message: "Follow-Up gehört nicht zu diesem Auftrag" });
    await storage.deleteOrderFollowUp(req.params.fid);
    res.json({ ok: true });
  });

  // Manual timeline note
  app.post("/api/workshop/orders/:id/crm/events", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    const parsed = insertOrderTimelineEventSchema.safeParse({
      ...req.body, workshopOrderId: order.id, actorId: auth.userId ?? null, actorLabel: auth.role ?? "user",
    });
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe", issues: parsed.error.issues });
    const ev = await storage.createOrderTimelineEvent(parsed.data);
    res.json(ev);
  });

  // AI Case Assistant — generate / refresh insight
  app.post("/api/workshop/orders/:id/crm/insights/generate", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    const order = await storage.getWorkshopOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
    if (auth.role !== "admin" && order.partnerId !== auth.userId) return res.status(403).json({ message: "Zugriff verweigert" });
    try {
      const [files, links, followUps, events] = await Promise.all([
        storage.getFileAttachmentsByOrder(order.id).catch(() => [] as any[]),
        storage.listOrderCrmLinks(order.id),
        storage.listOrderFollowUps(order.id),
        storage.listOrderTimelineEvents(order.id, 30),
      ]);
      const draft = await generateOrderCrmInsight({ order, files, links, followUps, events });
      const saved = await storage.upsertOrderAiInsight({
        workshopOrderId: order.id,
        summary: draft.summary,
        nextAction: draft.nextAction,
        urgency: draft.urgency,
        sentiment: draft.sentiment,
        closeProbability: draft.closeProbability,
        riskFlags: draft.riskFlags,
        missingInfo: draft.missingInfo,
        extraJson: draft.extra ?? null,
        generatedBy: auth.userId ?? null,
      });
      await storage.createOrderTimelineEvent({
        workshopOrderId: order.id, kind: "ai_action", title: "AI Case-Summary aktualisiert",
        message: draft.summary.slice(0, 240), actorId: auth.userId ?? null, actorLabel: "AI Case Assistant",
        metaJson: { urgency: draft.urgency, source: draft.source },
      });
      res.json({ insight: saved, source: draft.source });
    } catch (e: any) {
      console.error("[workshop] crm insight error", e);
      res.status(500).json({ message: "AI-Analyse fehlgeschlagen", error: e?.message });
    }
  });

  // Server-side print PDF (admin or owning partner).
  app.get("/api/workshop/orders/:id/print", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    try {
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (auth.role !== "admin" && order.partnerId !== auth.userId && order.createdBy !== auth.userId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { renderAuftragPdf } = await import("../services/workshopPdf");
      const pdf = await renderAuftragPdf(order);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="Auftrag-${order.referenceNumber ?? order.id.slice(0, 8)}.pdf"`,
      );
      res.send(pdf);
    } catch (err: any) {
      console.error("[workshop] print error", err);
      res.status(500).json({ message: "PDF konnte nicht erstellt werden", error: err?.message });
    }
  });
}
