import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertClientSchema, insertClientInteractionSchema, insertOfferSchema, insertOfferLineItemSchema, insertPartnerTransactionSchema, insertAppointmentSchema } from "@shared/schema";

function isPartnerOrAdmin(req: any): boolean {
  return req.user?.role === "partner" || req.user?.role === "admin";
}

function isAdmin(req: any): boolean {
  return req.user?.role === "admin";
}

export function registerPartnerPortalRoutes(app: Express) {

  // ============== PARTNER APPOINTMENTS ==============

  app.get("/api/partner-portal/appointments", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = end ? new Date(end as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      const allAppointments = await storage.getAppointmentsInRange(startDate, endDate);
      if (isAdmin(req)) return res.json(allAppointments);

      const partnerLabel = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim().toLowerCase();
      const partnerAppointments = allAppointments.filter((appt: any) => {
        const haystack = `${appt.title || ''} ${appt.notes || ''}`.toLowerCase();
        return partnerLabel ? haystack.includes(partnerLabel) : false;
      });
      res.json(partnerAppointments);
    } catch (error) {
      console.error("Partner appointments error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Termine" });
    }
  });

  app.post("/api/partner-portal/appointments", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const validated = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validated);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Termins" });
    }
  });

  app.patch("/api/partner-portal/appointments/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { resourceId, orderId, ...safeData } = req.body;
      const updated = await storage.updateAppointment(req.params.id, safeData);
      if (!updated) return res.status(404).json({ message: "Termin nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Termins" });
    }
  });

  app.delete("/api/partner-portal/appointments/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      await storage.deleteAppointment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Termins" });
    }
  });

  // ============== CLIENTS (CRM) ==============

  app.get("/api/partner-portal/clients", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const clientsList = isAdmin(req)
        ? await storage.getAllClients()
        : await storage.getClientsByPartner(req.user.id);
      res.json(clientsList);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Kunden" });
    }
  });

  app.post("/api/partner-portal/clients", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { partnerId: _ignored, ...clientData } = req.body;
      const validated = insertClientSchema.parse({ ...clientData, partnerId: req.user.id });
      const client = await storage.createClient(validated);
      res.status(201).json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Kunden" });
    }
  });

  app.patch("/api/partner-portal/clients/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getClient(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) {
          return res.status(403).json({ message: "Zugriff verweigert" });
        }
      }
      const { partnerId: _ignored, ...safeData } = req.body;
      const updated = await storage.updateClient(req.params.id, safeData);
      if (!updated) return res.status(404).json({ message: "Kunde nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Kunden" });
    }
  });

  app.delete("/api/partner-portal/clients/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getClient(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) {
          return res.status(403).json({ message: "Zugriff verweigert" });
        }
      }
      await storage.deleteClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete client error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Kunden" });
    }
  });

  // Client interactions/notes
  app.get("/api/partner-portal/clients/:id/interactions", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getClient(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) {
          return res.status(403).json({ message: "Zugriff verweigert" });
        }
      }
      const interactions = await storage.getInteractionsByClient(req.params.id);
      res.json(interactions);
    } catch (error) {
      console.error("Get interactions error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Interaktionen" });
    }
  });

  app.post("/api/partner-portal/clients/:id/interactions", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getClient(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) {
          return res.status(403).json({ message: "Zugriff verweigert" });
        }
      }
      const validated = insertClientInteractionSchema.parse({ ...req.body, clientId: req.params.id, userId: req.user.id });
      const interaction = await storage.createClientInteraction(validated);
      res.status(201).json(interaction);
    } catch (error) {
      console.error("Create interaction error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Notiz" });
    }
  });

  // ============== OFFERS / QUOTATIONS ==============

  app.get("/api/partner-portal/offers", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const offersList = isAdmin(req)
        ? await storage.getAllOffers()
        : await storage.getOffersByPartner(req.user.id);
      res.json(offersList);
    } catch (error) {
      console.error("Get offers error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Angebote" });
    }
  });

  app.post("/api/partner-portal/offers", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { lineItems: items, partnerId: _ignored, ...offerData } = req.body;

      const partner = await storage.getUser(req.user.id);
      const partnerShare = partner?.partnerSharePercent || 40;
      const matPercent = partner?.materialPercent ?? 20;

      const totalNet = offerData.totalNetCents || 0;
      const materialCost = Math.round(totalNet * matPercent / 100);
      const netAfterMaterial = totalNet - materialCost;
      const partnerCommission = Math.round(netAfterMaterial * partnerShare / 100);
      const corionCommission = netAfterMaterial - partnerCommission;

      const validated = insertOfferSchema.parse({
        ...offerData,
        partnerId: req.user.id,
        materialPercent: matPercent,
        materialCostCents: materialCost,
        netAfterMaterialCents: netAfterMaterial,
        partnerSharePercent: partnerShare,
        partnerCommissionCents: partnerCommission,
        corionCommissionCents: corionCommission,
      });
      const offer = await storage.createOffer(validated);

      if (items && Array.isArray(items)) {
        for (const item of items) {
          const validatedItem = insertOfferLineItemSchema.parse({ ...item, offerId: offer.id });
          await storage.createOfferLineItem(validatedItem);
        }
      }

      const offerWithItems = await storage.getOffer(offer.id);
      const offerItems = await storage.getOfferLineItems(offer.id);
      res.status(201).json({ ...offerWithItems, lineItems: offerItems });
    } catch (error) {
      console.error("Create offer error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Angebots" });
    }
  });

  app.get("/api/partner-portal/offers/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const offer = await storage.getOffer(req.params.id);
      if (!offer) return res.status(404).json({ message: "Angebot nicht gefunden" });
      if (!isAdmin(req) && offer.partnerId !== req.user.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const items = await storage.getOfferLineItems(offer.id);
      res.json({ ...offer, lineItems: items });
    } catch (error) {
      console.error("Get offer error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Angebots" });
    }
  });

  app.patch("/api/partner-portal/offers/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const existing = await storage.getOffer(req.params.id);
      if (!existing) return res.status(404).json({ message: "Angebot nicht gefunden" });
      if (!isAdmin(req) && existing.partnerId !== req.user.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { lineItems: items, partnerId: _ignored, ...offerData } = req.body;

      if (offerData.totalNetCents !== undefined) {
        const partner = existing.partnerId ? await storage.getUser(existing.partnerId) : null;
        const partnerShare = partner?.partnerSharePercent || existing.partnerSharePercent || 40;
        const matPercent = offerData.materialPercent ?? existing.materialPercent ?? 20;
        const totalNet = offerData.totalNetCents;
        const materialCost = Math.round(totalNet * matPercent / 100);
        const netAfterMaterial = totalNet - materialCost;
        const partnerCommission = Math.round(netAfterMaterial * partnerShare / 100);
        const corionCommission = netAfterMaterial - partnerCommission;
        offerData.materialPercent = matPercent;
        offerData.materialCostCents = materialCost;
        offerData.netAfterMaterialCents = netAfterMaterial;
        offerData.partnerSharePercent = partnerShare;
        offerData.partnerCommissionCents = partnerCommission;
        offerData.corionCommissionCents = corionCommission;
      }

      const updated = await storage.updateOffer(req.params.id, offerData);

      if (items && Array.isArray(items)) {
        await storage.deleteOfferLineItemsByOffer(req.params.id);
        for (const item of items) {
          const validatedItem = insertOfferLineItemSchema.parse({ ...item, offerId: req.params.id });
          await storage.createOfferLineItem(validatedItem);
        }
      }

      const refreshedItems = await storage.getOfferLineItems(req.params.id);
      res.json({ ...updated, lineItems: refreshedItems });
    } catch (error) {
      console.error("Update offer error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Angebots" });
    }
  });

  app.delete("/api/partner-portal/offers/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const existing = await storage.getOffer(req.params.id);
      if (!existing) return res.status(404).json({ message: "Angebot nicht gefunden" });
      if (!isAdmin(req) && existing.partnerId !== req.user.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteOffer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete offer error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Angebots" });
    }
  });

  // ============== PARTNER REVENUE TRACKING ==============

  app.get("/api/partner-portal/transactions", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const transactions = isAdmin(req)
        ? await storage.getAllPartnerTransactions()
        : await storage.getPartnerTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Transaktionen" });
    }
  });

  app.post("/api/partner-portal/transactions", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const partnerId = isAdmin(req) && req.body.partnerId ? req.body.partnerId : req.user.id;
      const user = await storage.getUser(partnerId);
      const commissionPercent = user?.partnerSharePercent || 80;
      const revenueCents = req.body.revenueCents || 0;
      const commissionCents = Math.round(revenueCents * commissionPercent / 100);

      const validated = insertPartnerTransactionSchema.parse({
        ...req.body,
        partnerId,
        commissionPercent,
        commissionCents,
      });
      const transaction = await storage.createPartnerTransaction(validated);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Transaktion" });
    }
  });

  app.patch("/api/partner-portal/transactions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { partnerId: _ignored, ...safeData } = req.body;
      const updated = await storage.updatePartnerTransaction(req.params.id, safeData);
      if (!updated) return res.status(404).json({ message: "Transaktion nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren" });
    }
  });

  // ============== REVENUE SUMMARY ==============

  app.get("/api/partner-portal/revenue-summary", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const transactions = isAdmin(req)
        ? await storage.getAllPartnerTransactions()
        : await storage.getPartnerTransactions(req.user.id);

      const totalRevenue = transactions.reduce((s, t) => s + t.revenueCents, 0);
      const totalCommission = transactions.reduce((s, t) => s + t.commissionCents, 0);
      const pendingAmount = transactions.filter(t => t.status === "pending").reduce((s, t) => s + t.commissionCents, 0);
      const paidAmount = transactions.filter(t => t.status === "paid").reduce((s, t) => s + t.commissionCents, 0);
      const transactionCount = transactions.length;

      res.json({ totalRevenue, totalCommission, pendingAmount, paidAmount, transactionCount });
    } catch (error) {
      console.error("Revenue summary error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Umsatzübersicht" });
    }
  });

  // ============== RESOURCES (for appointment creation) ==============

  app.get("/api/partner-portal/resources", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const resourcesList = await storage.getAllResources();
      res.json(resourcesList);
    } catch (error) {
      console.error("Get resources error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Ressourcen" });
    }
  });
}
