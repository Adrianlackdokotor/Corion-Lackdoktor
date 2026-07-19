import type { Express, Response } from "express";
import path from "path";
import { z } from "zod";
import { storage } from "../storage";
import { pickDamagePhotos, translateDescriptionForPartner } from "../services/partnerOrderLocalization";
import { isAuthenticated } from "../auth";
import { insertDailyFinancialEntrySchema, insertFixedCostItemSchema, insertWorkshopOrderSchema, insertPartnerFinancialEntrySchema, insertPartnerFixedCostSchema, insertBoardTaskSchema } from "@shared/schema";
import { uploadToGoogleDrive } from "../lib/google-drive";
import { writeCoordMessage } from "../services/coordMessages";

async function tryUploadToDrive(filename: string, originalName: string, mimeType: string, base64Data: string, orderRef?: string): Promise<{ driveFileId?: string; driveLink?: string }> {
  try {
    const result = await uploadToGoogleDrive(filename, mimeType, base64Data, orderRef);
    return { driveFileId: result.fileId, driveLink: result.webViewLink };
  } catch (err: any) {
    console.warn("Google Drive upload skipped (not connected or error):", err?.message || err);
    return {};
  }
}

const ALLOWED_EXTENSIONS = /jpg|jpeg|png|webp|heic|gif|bmp|tiff|tif|pdf|doc|docx|xls|xlsx|csv|txt|zip|rar|7z|ppt|pptx|odt|ods/i;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).replace(".", "");
  return ALLOWED_EXTENSIONS.test(ext);
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    heic: "image/heic", gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff", tif: "image/tiff",
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv", txt: "text/plain",
    zip: "application/zip", rar: "application/x-rar-compressed", "7z": "application/x-7z-compressed",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text", ods: "application/vnd.oasis.opendocument.spreadsheet",
  };
  return mimeMap[ext] || "application/octet-stream";
}

interface Base64File {
  name: string;
  type?: string;
  data: string;
  size?: number;
}

function isAdmin(req: any): boolean {
  return req.user?.role === "admin";
}

function isPartnerOrAdmin(req: any): boolean {
  return req.user?.role === "partner" || req.user?.role === "admin";
}

export function registerAdminFinanceRoutes(app: Express) {

  // ============== DAILY FINANCIAL ENTRIES ==============

  app.get("/api/admin/finance/entries", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { year, month, partnerId } = req.query;
      const y = parseInt(year as string) || new Date().getFullYear();
      const m = parseInt(month as string) || new Date().getMonth() + 1;
      
      if (isAdmin(req) && partnerId) {
        const entries = await storage.getDailyFinancialEntriesByPartner(partnerId as string, y, m);
        return res.json(entries);
      } else if (isAdmin(req)) {
        const entries = await storage.getAllDailyFinancialEntries(y, m);
        return res.json(entries);
      } else {
        const entries = await storage.getDailyFinancialEntriesByPartner(req.user.id, y, m);
        return res.json(entries);
      }
    } catch (error) {
      console.error("Get financial entries error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Einträge" });
    }
  });

  app.post("/api/admin/finance/entries", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const partnerId = isAdmin(req) && req.body.partnerId ? req.body.partnerId : req.user.id;
      const body = { ...req.body, partnerId };
      if (body.entryDate && typeof body.entryDate === "string") body.entryDate = new Date(body.entryDate);
      const validated = insertDailyFinancialEntrySchema.parse(body);
      const entry = await storage.createDailyFinancialEntry(validated);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Create financial entry error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Eintrags" });
    }
  });

  app.patch("/api/admin/finance/entries/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getDailyFinancialEntryById(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { partnerId: _ignored, ...safeData } = req.body;
      const updated = await storage.updateDailyFinancialEntry(req.params.id, safeData);
      if (!updated) return res.status(404).json({ message: "Eintrag nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update financial entry error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren" });
    }
  });

  app.delete("/api/admin/finance/entries/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getDailyFinancialEntryById(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteDailyFinancialEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete financial entry error:", error);
      res.status(500).json({ message: "Fehler beim Löschen" });
    }
  });

  // ============== FIXED COST ITEMS ==============

  app.get("/api/admin/finance/fixed-costs", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const partnerId = isAdmin(req) && req.query.partnerId ? req.query.partnerId as string : req.user.id;
      const items = await storage.getFixedCostItemsByPartner(partnerId);
      res.json(items);
    } catch (error) {
      console.error("Get fixed costs error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Fixkosten" });
    }
  });

  app.post("/api/admin/finance/fixed-costs", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const partnerId = isAdmin(req) && req.body.partnerId ? req.body.partnerId : req.user.id;
      const validated = insertFixedCostItemSchema.parse({ ...req.body, partnerId });
      const item = await storage.createFixedCostItem(validated);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create fixed cost error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen" });
    }
  });

  app.patch("/api/admin/finance/fixed-costs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getFixedCostItemById(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { partnerId: _ignored, ...safeData } = req.body;
      const updated = await storage.updateFixedCostItem(req.params.id, safeData);
      if (!updated) return res.status(404).json({ message: "Nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update fixed cost error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren" });
    }
  });

  app.delete("/api/admin/finance/fixed-costs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      if (!isAdmin(req)) {
        const existing = await storage.getFixedCostItemById(req.params.id);
        if (!existing || existing.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteFixedCostItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete fixed cost error:", error);
      res.status(500).json({ message: "Fehler beim Löschen" });
    }
  });

  // ============== CENTRAL DOCUMENT UPLOAD (Auto-Create Workshop Order) ==============

  app.post("/api/upload-center/create-order", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { files: uploadFiles, customerName, damageDescription, vehicleMake, vehicleModel, vehiclePlate, assignToPartnerId } = req.body;

      const fileArray: Base64File[] = uploadFiles || [];
      if (fileArray.length === 0) return res.status(400).json({ message: "Bitte laden Sie mindestens eine Datei hoch." });

      for (const f of fileArray) {
        if (!validateFileExtension(f.name)) return res.status(400).json({ message: `Dateityp von "${f.name}" nicht erlaubt.` });
        const sizeBytes = Math.ceil((f.data.length * 3) / 4);
        if (sizeBytes > MAX_FILE_SIZE) return res.status(413).json({ message: `"${f.name}" ist zu groß. Max: 20 MB.` });
      }

      const partnerId = isAdmin(req) && assignToPartnerId ? assignToPartnerId : (req.user.role === "partner" ? req.user.id : null);

      const order = await storage.createWorkshopOrder({
        orderDate: new Date(),
        customerName: customerName || "Dokumenten-Upload",
        damageDescription: damageDescription || `Upload von ${fileArray.length} Datei(en)`,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || null,
        vehiclePlate: vehiclePlate || null,
        partnerId: partnerId,
        status: "open",
        paymentStatus: "offen",
        paidAmountCents: 0,
        totalAmountCents: 0,
        attachments: [],
        createdBy: req.user.id,
      });

      writeCoordMessage({
        channel:        `order:${order.id}`,
        authorSlug:     "system",
        authorRole:     "agent",
        body:           `Auftrag erstellt via Dokument-Upload: ${order.customerName}${order.vehicleMake ? ` · ${order.vehicleMake} ${order.vehicleModel ?? ""}`.trimEnd() : ""}`,
        intent:         "status",
        relatedOrderId: order.id,
      }).catch(() => {});

      for (const f of fileArray) {
        const mimeType = f.type || getMimeType(f.name);
        const sizeBytes = Math.ceil((f.data.length * 3) / 4);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(f.name)}`;
        const driveInfo = await tryUploadToDrive(uniqueName, f.name, mimeType, f.data, order.id);
        await storage.createFileAttachment({
          workshopOrderId: order.id,
          filename: uniqueName,
          originalName: f.name,
          mimeType,
          size: sizeBytes,
          data: f.data,
          uploadedBy: req.user.id,
          driveFileId: driveInfo.driveFileId || null,
          driveLink: driveInfo.driveLink || null,
        });
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Upload center create order error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Auftrags" });
    }
  });

  // Get unassigned orders (for admin to assign to partners)
  app.get("/api/admin/workshop-orders/unassigned", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const allOrders = await storage.getAllWorkshopOrders();
      const unassigned = allOrders.filter(o => !o.partnerId);
      res.json(unassigned);
    } catch (error) {
      console.error("Get unassigned orders error:", error);
      res.status(500).json({ message: "Fehler" });
    }
  });

  // Assign workshop order to partner
  app.patch("/api/admin/workshop-orders/:id/assign", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { partnerId } = req.body;
      if (!partnerId) return res.status(400).json({ message: "Partner-ID erforderlich" });
      const partner = await storage.getUser(partnerId);
      if (!partner || partner.role !== "partner") return res.status(400).json({ message: "Ungültiger Partner" });
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      const translatedDescription = await translateDescriptionForPartner(order, partner);
      const currentTranslations = ((order as any).partnerDescriptionTranslations || {}) as Record<string, string>;
      const nextTranslations = {
        ...currentTranslations,
        [partner.preferredLanguage || "de"]: translatedDescription,
      };
      const updated = await storage.updateWorkshopOrder(req.params.id, {
        partnerId,
        partnerDescriptionTranslations: nextTranslations,
      } as any);
      if (!updated) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Assign order error:", error);
      res.status(500).json({ message: "Fehler beim Zuweisen" });
    }
  });

  // Get available partners (for assignment dropdown)
  app.get("/api/admin/partners-list", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const partners = await storage.getUsersByRole("partner");
      const safePartners = partners.map(({ password, ...p }) => p);
      res.json(safePartners);
    } catch (error) {
      console.error("Get partners list error:", error);
      res.status(500).json({ message: "Fehler" });
    }
  });

  // ============== WORKSHOP ORDERS (Werkstatt Auftrag) ==============

  app.get("/api/admin/workshop-orders", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const baseOrders = isAdmin(req)
        ? await storage.getAllWorkshopOrders()
        : await storage.getWorkshopOrdersByPartner(req.user.id);

      const orders = await Promise.all(
        baseOrders.map(async (order) => ({
          ...order,
          attachments: await storage.getFileAttachmentsByOrder(order.id),
        })),
      );

      return res.json(orders);
    } catch (error) {
      console.error("Get workshop orders error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Aufträge" });
    }
  });

  app.get("/api/admin/workshop-orders/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (!isAdmin(req) && order.partnerId !== req.user.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const attachments = await storage.getFileAttachmentsByOrder(req.params.id);
      res.json({ ...order, attachments });
    } catch (error) {
      console.error("Get workshop order error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Auftrags" });
    }
  });

  app.post("/api/admin/workshop-orders", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const body = { ...req.body, createdBy: req.user.id };
      if (body.orderDate && typeof body.orderDate === "string") body.orderDate = new Date(body.orderDate);
      if (body.deliveryDate && typeof body.deliveryDate === "string") body.deliveryDate = new Date(body.deliveryDate);
      if (body.pickupDate && typeof body.pickupDate === "string") body.pickupDate = new Date(body.pickupDate);
      if (body.scheduledDate && typeof body.scheduledDate === "string") body.scheduledDate = new Date(body.scheduledDate);
      const validated = insertWorkshopOrderSchema.parse(body);
      const order = await storage.createWorkshopOrder(validated);

      writeCoordMessage({
        channel:        `order:${order.id}`,
        authorSlug:     "system",
        authorRole:     "agent",
        body:           `Auftrag erstellt: ${order.customerName}${order.vehicleMake ? ` · ${order.vehicleMake} ${order.vehicleModel ?? ""}`.trimEnd() : ""}${order.damageDescription ? ` — ${order.damageDescription.slice(0, 60)}` : ""}`,
        intent:         "status",
        relatedOrderId: order.id,
      }).catch(() => {});

      try {
        await storage.createBoardTask({
          title: `Neuer Auftrag: ${order.customerName} - ${order.vehicleMake || ""} ${order.vehicleModel || ""}`.trim(),
          description: `Auftrag ${order.referenceNumber} prüfen und Partner zuweisen. Schaden: ${order.damageDescription || "Keine Angabe"}`,
          column: "todo",
          priority: order.totalAmountCents > 200000 ? "high" : "normal",
          assignedTo: order.partnerId || null,
          relatedOrderId: order.id,
          source: "auto_order",
          createdBy: req.user.id,
        });
      } catch (taskErr) {
        console.error("Auto-task creation error:", taskErr);
      }

      if (order.customerEmail && order.referenceNumber) {
        try {
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          const trackingLink = `${baseUrl}/auftrag/${order.referenceNumber}`;
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Corion Lackdoktor <onboarding@resend.dev>",
            to: order.customerEmail,
            subject: `Ihr Auftrag ${order.referenceNumber} - Corion Lackdoktor`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #E53935;">Corion Lackdoktor</h2>
                <p>Sehr geehrte/r ${order.customerName},</p>
                <p>Ihr Werkstatt-Auftrag wurde erfolgreich erstellt.</p>
                <p><strong>Referenznummer:</strong> ${order.referenceNumber}</p>
                <p><strong>Fahrzeug:</strong> ${order.vehicleMake || ""} ${order.vehicleModel || ""} ${order.vehiclePlate ? `(${order.vehiclePlate})` : ""}</p>
                <p><strong>Schaden:</strong> ${order.damageDescription}</p>
                <p>Sie können den Status Ihres Auftrags jederzeit einsehen:</p>
                <a href="${trackingLink}" style="display: inline-block; background-color: #E53935; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Auftrag ansehen</a>
                <p style="color: #666; font-size: 12px; margin-top: 24px;">Mit freundlichen Gr&uuml;&szlig;en,<br/>Ihr Corion Lackdoktor Team</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error("Email notification error:", emailErr);
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Create workshop order error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Auftrags" });
    }
  });

  app.patch("/api/admin/workshop-orders/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { createdBy: _ignored, ...safeData } = req.body;
      if (safeData.orderDate && typeof safeData.orderDate === "string") safeData.orderDate = new Date(safeData.orderDate);
      if (safeData.deliveryDate && typeof safeData.deliveryDate === "string") safeData.deliveryDate = new Date(safeData.deliveryDate);
      if (safeData.pickupDate && typeof safeData.pickupDate === "string") safeData.pickupDate = new Date(safeData.pickupDate);
      if (safeData.scheduledDate && typeof safeData.scheduledDate === "string") safeData.scheduledDate = new Date(safeData.scheduledDate);
      const updated = await storage.updateWorkshopOrder(req.params.id, safeData);
      if (!updated) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update workshop order error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren" });
    }
  });

  app.patch("/api/admin/workshop-orders/:id/partner-status", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (!isAdmin(req) && order.partnerId !== req.user.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { status } = req.body;
      const allowedStatuses = ["angenommen", "in_bearbeitung", "fertig"];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Ungültiger Status. Erlaubt: " + allowedStatuses.join(", ") });
      }
      const statusFlow: Record<string, string> = {
        "open": "angenommen",
        "angenommen": "in_bearbeitung",
        "in_bearbeitung": "fertig",
      };
      const currentStatus = order.status || "open";
      if (!isAdmin(req) && statusFlow[currentStatus] !== status) {
        const nextAllowed = statusFlow[currentStatus];
        return res.status(400).json({ 
          message: nextAllowed 
            ? `Status kann nur zu "${nextAllowed}" geändert werden (aktuell: "${currentStatus}")` 
            : `Auftrag ist bereits abgeschlossen`
        });
      }
      // Photo guard: partners must upload at least one file before marking fertig.
      if (status === "fertig" && !isAdmin(req)) {
        const attachments = await storage.getFileAttachmentsByOrder(req.params.id);
        if (!attachments || attachments.length === 0) {
          return res.status(400).json({
            message: "Fotos erforderlich — bitte mindestens ein Foto hochladen bevor der Auftrag abgeschlossen wird",
          });
        }
      }

      const updated = await storage.updateWorkshopOrder(req.params.id, { status });
      if (!updated) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Partner status update error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Status" });
    }
  });

  // Admin-only quick status PATCH used by the Aufträge Pipeline drag-and-drop UI.
  // Bypasses the linear flow constraints applied to partners.
  app.patch("/api/admin/workshop-orders/:id/status", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Nur für Admins" });
      // Aligned with canonical statuses used across the codebase
      // (OrderPipeline.tsx, partner status PATCH, statusLabels in AdminDashboard).
      const allowed = [
        "open",
        "angenommen",
        "in_bearbeitung",
        "fertig",
        "completed",
        "cancelled",
      ] as const;
      const schema = z.object({ status: z.enum(allowed) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Ungültiger Status", issues: parsed.error.issues });
      }
      const updated = await storage.updateWorkshopOrder(req.params.id, { status: parsed.data.status });
      if (!updated) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Admin status update error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Status" });
    }
  });

  app.get("/api/admin/workshop-orders/:id/files", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (!isAdmin(req) && order.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });
      const files = await storage.getFileAttachmentsByOrder(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Fehler" });
    }
  });

  app.post("/api/admin/workshop-orders/:id/attachments", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (!isAdmin(req) && order.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });

      const { files: uploadFiles } = req.body;
      const fileArray: Base64File[] = uploadFiles || [];
      if (fileArray.length === 0) return res.status(400).json({ message: "Keine Dateien hochgeladen" });

      for (const f of fileArray) {
        if (!validateFileExtension(f.name)) return res.status(400).json({ message: `Dateityp von "${f.name}" nicht erlaubt.` });
        const sizeBytes = Math.ceil((f.data.length * 3) / 4);
        if (sizeBytes > MAX_FILE_SIZE) return res.status(413).json({ message: `"${f.name}" ist zu groß. Max: 20 MB.` });
      }

      const created = [];
      for (const f of fileArray) {
        const mimeType = f.type || getMimeType(f.name);
        const sizeBytes = Math.ceil((f.data.length * 3) / 4);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(f.name)}`;
        const driveInfo = await tryUploadToDrive(uniqueName, f.name, mimeType, f.data, req.params.id);
        const att = await storage.createFileAttachment({
          workshopOrderId: req.params.id,
          filename: uniqueName,
          originalName: f.name,
          mimeType,
          size: sizeBytes,
          data: f.data,
          uploadedBy: req.user.id,
          driveFileId: driveInfo.driveFileId || null,
          driveLink: driveInfo.driveLink || null,
        });
        created.push({ id: att.id, filename: att.filename, originalName: att.originalName, mimeType: att.mimeType, size: att.size, driveLink: att.driveLink, createdAt: att.createdAt });
      }
      res.json({ files: created });
    } catch (error) {
      console.error("Upload attachment error:", error);
      res.status(500).json({ message: "Fehler beim Hochladen" });
    }
  });

  app.delete("/api/admin/workshop-orders/:orderId/attachments/:attachmentId", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      await storage.deleteFileAttachment(req.params.attachmentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete attachment error:", error);
      res.status(500).json({ message: "Fehler beim Löschen" });
    }
  });

  app.get("/api/admin/workshop-orders/files/:fileId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const file = await storage.getFileAttachment(req.params.fileId);
      if (!file) return res.status(404).json({ message: "Datei nicht gefunden" });
      if (!file.workshopOrderId) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      const order = await storage.getWorkshopOrder(file.workshopOrderId);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (isAdmin(req)) {
        // admin can access all files
      } else if (req.user?.role === "partner" && order.partnerId === req.user.id) {
        // partner can access their own order files
      } else if (req.user?.role === "client" && order.clientUserId === req.user.id) {
        // client can access their own order files
      } else {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const buffer = Buffer.from(file.data, "base64");
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${file.originalName}"`);
      res.setHeader("Content-Length", buffer.length.toString());
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Fehler" });
    }
  });

  app.delete("/api/admin/workshop-orders/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      await storage.deleteWorkshopOrder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete workshop order error:", error);
      res.status(500).json({ message: "Fehler beim Löschen" });
    }
  });

  app.post("/api/admin/workshop-orders/:id/extract-document", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { fileId } = req.body;
      if (!fileId) return res.status(400).json({ message: "fileId erforderlich" });

      const file = await storage.getFileAttachment(fileId);
      if (!file) return res.status(404).json({ message: "Datei nicht gefunden" });

      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(503).json({ message: "KI-Dienst nicht verfügbar. API-Key fehlt." });
      }

      const isImage = file.mimeType.startsWith("image/");
      const isPdf = file.mimeType === "application/pdf";

      if (!isImage && !isPdf) {
        return res.status(400).json({ message: "Nur Bilder und PDFs können analysiert werden." });
      }

      const messages: any[] = [
        {
          role: "system",
          content: `Du bist ein KI-Assistent der Daten aus Kfz-Dokumenten extrahiert. Analysiere das Dokument und extrahiere alle relevanten Daten.
Erkenne den Dokumenttyp automatisch: Gutachten, Kostenvoranschlag/Angebot, Fahrzeugschein, Reparaturrechnung, oder Schadensmeldung.
Extrahiere folgende Felder wenn vorhanden und gib sie als JSON zurück:
{
  "documentType": "gutachten|angebot|fahrzeugschein|rechnung|schadensmeldung|sonstiges",
  "customerName": "",
  "customerAddress": "",
  "customerPhone": "",
  "customerEmail": "",
  "vehicleMake": "",
  "vehicleModel": "",
  "vehiclePlate": "",
  "vehicleVin": "",
  "vehicleColor": "",
  "vehicleMileage": "",
  "damageDescription": "",
  "priorDamage": "",
  "totalAmountCents": null,
  "additionalNotes": ""
}
Gib NUR gültiges JSON zurück, keine Erklärungen. Felder die nicht erkannt werden als leeren String lassen. totalAmountCents als Ganzzahl in Cent (z.B. 150000 für 1500.00 EUR).`,
        },
      ];

      if (isImage) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: "Extrahiere die Daten aus diesem Kfz-Dokument:" },
            { type: "image_url", image_url: { url: `data:${file.mimeType};base64,${file.data}` } },
          ],
        });
      } else {
        messages.push({
          role: "user",
          content: `Extrahiere die Daten aus diesem Dokument. Dateiname: ${file.originalName}. Der Inhalt ist ein PDF - extrahiere was du aus dem Dateinamen und Kontext ableiten kannst.`,
        });
      }

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 1000,
          temperature: 0.1,
        }),
      });

      if (!openaiRes.ok) {
        console.error("OpenAI extraction error:", await openaiRes.text());
        return res.status(500).json({ message: "KI-Analyse fehlgeschlagen" });
      }

      const data = await openaiRes.json();
      const content = data.choices?.[0]?.message?.content || "{}";

      let extracted;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        extracted = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        extracted = {};
      }

      res.json({ extracted, documentType: extracted.documentType || "sonstiges" });
    } catch (error) {
      console.error("Document extraction error:", error);
      res.status(500).json({ message: "Fehler bei der Dokumentenanalyse" });
    }
  });

  app.post("/api/admin/workshop-orders/:id/apply-extraction", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (!isAdmin(req) && order.partnerId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });

      const { extracted } = req.body;
      if (!extracted) return res.status(400).json({ message: "Keine extrahierten Daten" });

      const updateData: any = {};
      if (extracted.customerName && !order.customerName?.trim()) updateData.customerName = extracted.customerName;
      if (extracted.customerName && order.customerName?.trim()) updateData.customerName = extracted.customerName;
      if (extracted.customerAddress) updateData.customerAddress = extracted.customerAddress;
      if (extracted.customerPhone) updateData.customerPhone = extracted.customerPhone;
      if (extracted.customerEmail) updateData.customerEmail = extracted.customerEmail;
      if (extracted.vehicleMake) updateData.vehicleMake = extracted.vehicleMake;
      if (extracted.vehicleModel) updateData.vehicleModel = extracted.vehicleModel;
      if (extracted.vehiclePlate) updateData.vehiclePlate = extracted.vehiclePlate;
      if (extracted.vehicleVin) updateData.vehicleVin = extracted.vehicleVin;
      if (extracted.vehicleColor) updateData.vehicleColor = extracted.vehicleColor;
      if (extracted.vehicleMileage) updateData.vehicleMileage = extracted.vehicleMileage;
      if (extracted.damageDescription) updateData.damageDescription = extracted.damageDescription;
      if (extracted.priorDamage) updateData.priorDamage = extracted.priorDamage;
      if (extracted.totalAmountCents) updateData.totalAmountCents = extracted.totalAmountCents;

      if (Object.keys(updateData).length === 0) {
        return res.json({ message: "Keine neuen Daten zum Übernehmen", order });
      }

      const updated = await storage.updateWorkshopOrder(req.params.id, updateData);
      res.json({ message: "Daten übernommen", order: updated, appliedFields: Object.keys(updateData) });
    } catch (error) {
      console.error("Apply extraction error:", error);
      res.status(500).json({ message: "Fehler beim Übernehmen der Daten" });
    }
  });

  // ============== PARTNER BREAK-EVEN CALCULATOR ==============

  app.get("/api/admin/partner/:partnerId/financial-entries", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ message: "month und year sind erforderlich" });
      const entries = await storage.getPartnerFinancialEntries(req.params.partnerId, parseInt(month), parseInt(year));
      res.json(entries);
    } catch (error) {
      console.error("Get partner financial entries error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Einträge" });
    }
  });

  app.get("/api/admin/partner/:partnerId/financial-entries/year", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { year } = req.query;
      if (!year) return res.status(400).json({ message: "year ist erforderlich" });
      const entries = await storage.getAllPartnerFinancialEntries(req.params.partnerId, parseInt(year as string));
      res.json(entries);
    } catch (error) {
      console.error("Get all partner financial entries error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Einträge" });
    }
  });

  app.post("/api/admin/partner/:partnerId/financial-entries", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const data = {
        ...req.body,
        partnerId: req.params.partnerId,
        entryDate: new Date(req.body.entryDate),
      };
      const parsed = insertPartnerFinancialEntrySchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Ungültige Daten", errors: parsed.error.flatten() });
      const entry = await storage.createPartnerFinancialEntry(parsed.data);
      res.json(entry);
    } catch (error) {
      console.error("Create partner financial entry error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Eintrags" });
    }
  });

  app.patch("/api/admin/partner/:partnerId/financial-entries/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const data = { ...req.body };
      if (data.entryDate) data.entryDate = new Date(data.entryDate);
      const partial = insertPartnerFinancialEntrySchema.partial().safeParse(data);
      if (!partial.success) return res.status(400).json({ message: "Ungültige Daten", errors: partial.error.flatten() });
      const updated = await storage.updatePartnerFinancialEntry(req.params.id, partial.data);
      if (!updated) return res.status(404).json({ message: "Eintrag nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update partner financial entry error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Eintrags" });
    }
  });

  app.delete("/api/admin/partner/:partnerId/financial-entries/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      await storage.deletePartnerFinancialEntry(req.params.id);
      res.json({ message: "Eintrag gelöscht" });
    } catch (error) {
      console.error("Delete partner financial entry error:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Eintrags" });
    }
  });

  // Partner fixed costs
  app.get("/api/admin/partner/:partnerId/fixed-costs", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const costs = await storage.getPartnerFixedCosts(req.params.partnerId);
      res.json(costs);
    } catch (error) {
      console.error("Get partner fixed costs error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Fixkosten" });
    }
  });

  app.post("/api/admin/partner/:partnerId/fixed-costs", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const data = { ...req.body, partnerId: req.params.partnerId };
      const parsed = insertPartnerFixedCostSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Ungültige Daten", errors: parsed.error.flatten() });
      const cost = await storage.createPartnerFixedCost(parsed.data);
      res.json(cost);
    } catch (error) {
      console.error("Create partner fixed cost error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Fixkosten" });
    }
  });

  app.patch("/api/admin/partner/:partnerId/fixed-costs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const partial = insertPartnerFixedCostSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Ungültige Daten", errors: partial.error.flatten() });
      const updated = await storage.updatePartnerFixedCost(req.params.id, partial.data);
      if (!updated) return res.status(404).json({ message: "Fixkosten nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update partner fixed cost error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Fixkosten" });
    }
  });

  app.delete("/api/admin/partner/:partnerId/fixed-costs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      await storage.deletePartnerFixedCost(req.params.id);
      res.json({ message: "Fixkosten gelöscht" });
    } catch (error) {
      console.error("Delete partner fixed cost error:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Fixkosten" });
    }
  });

  // ============== TASK BOARD (Trello-style) ==============

  app.get("/api/admin/tasks", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const tasks = await storage.getAllBoardTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Aufgaben" });
    }
  });

  app.post("/api/admin/tasks", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const data = { ...req.body, createdBy: req.user.id };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      const parsed = insertBoardTaskSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Ungültige Daten", errors: parsed.error.flatten() });
      const task = await storage.createBoardTask(parsed.data);
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Aufgabe" });
    }
  });

  app.patch("/api/admin/tasks/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const data = { ...req.body };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      const updated = await storage.updateBoardTask(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Aufgabe nicht gefunden" });
      res.json(updated);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Aufgabe" });
    }
  });

  app.delete("/api/admin/tasks/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      await storage.deleteBoardTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Aufgabe" });
    }
  });

  // ============== PARTNER DASHBOARD ORDERS (Fixico-style) ==============

  function calcCommission(laborCents: number, materialPct: number, sharePct: number): number {
    return Math.round(laborCents * (1 - materialPct / 100) * (sharePct / 100));
  }

  app.get("/api/partner/my-orders", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "partner") return res.status(403).json({ message: "Nur für Partner" });
      const orders = await storage.getWorkshopOrdersByPartner(req.user.id);
      const partner = await storage.getUser(req.user.id);
      const matPct = partner?.materialPercent ?? 20;
      const sharePct = partner?.partnerSharePercent ?? 40;
      const enriched = await Promise.all(orders.map(async (o) => {
        const attachments = await storage.getFileAttachmentsByOrder(o.id);
        const translatedDescription = await translateDescriptionForPartner(o as any, partner);
        const currentTranslations = ((o as any).partnerDescriptionTranslations || {}) as Record<string, string>;
        const lang = partner?.preferredLanguage || "de";
        if (translatedDescription && currentTranslations[lang] !== translatedDescription) {
          void storage.updateWorkshopOrder(o.id, {
            partnerDescriptionTranslations: {
              ...currentTranslations,
              [lang]: translatedDescription,
            },
          } as any).catch(() => {});
        }
        return {
          ...o,
          attachments,
          damagePhotos: pickDamagePhotos(attachments).map((att: any) => ({
            ...att,
            // Prefer internal binary serve when data is stored locally (size > 0).
            // Drive view URLs are not renderable as <img src> — they return HTML.
            serveUrl: (att.id && att.size > 0)
              ? `/api/admin/workshop-orders/files/${att.id}`
              : (att.driveLink ?? null),
          })),
          partnerVisibleDescription: translatedDescription || o.damageDescription,
          partnerCommissionCalc: calcCommission(o.laborAmountCents, matPct, sharePct),
          partnerModel: partner?.partnerModel ?? "B",
          driveFolderUrl: (o as any).driveFolderUrl ?? null,
          localFolderPath: (o as any).localFolderPath ?? null,
          libraryKey: (o as any).libraryKey ?? null,
          appointmentId: (o as any).appointmentId ?? null,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Partner my-orders error:", error);
      res.status(500).json({ message: "Fehler" });
    }
  });

  app.get("/api/client/my-orders", isAuthenticated, async (req: any, res: Response) => {
    try {
      const orders = await storage.getWorkshopOrdersByClient(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Client my-orders error:", error);
      res.status(500).json({ message: "Fehler" });
    }
  });

  // Seed Adil Lackdoktor partner account (idempotent)
  app.post("/api/admin/seed-adil", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Nur Admins" });
      const existing = await storage.getUserByEmail("adil@corion-lackdoktor.de");
      if (existing) return res.json({ message: "Bereits vorhanden", user: { ...existing, password: undefined } });
      const bcrypt = await import("bcrypt");
      const hashed = await bcrypt.hash("Adil2024!", 10);
      const user = await storage.createUser({
        email: "adil@corion-lackdoktor.de",
        password: hashed,
        role: "partner",
        firstName: "Adil",
        lastName: "Lackdoktor",
        company: "Corion Lackdoktor – Adil",
        partnerSharePercent: 40,
        materialPercent: 20,
        partnerModel: "C",
        emailVerified: true,
        isApproved: true,
      });
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      console.error("Seed Adil error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen" });
    }
  });

  // Commission preview for a given labor amount + partner
  app.get("/api/admin/commission-preview", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const { partnerId, laborCents } = req.query;
      if (!partnerId || !laborCents) return res.status(400).json({ message: "partnerId und laborCents erforderlich" });
      const partner = await storage.getUser(String(partnerId));
      if (!partner) return res.status(404).json({ message: "Partner nicht gefunden" });
      const matPct = partner.materialPercent ?? 20;
      const sharePct = partner.partnerSharePercent ?? 40;
      const labor = parseInt(String(laborCents));
      const commission = calcCommission(labor, matPct, sharePct);
      res.json({
        laborCents: labor,
        materialDeductionCents: Math.round(labor * matPct / 100),
        laborAfterMaterialCents: Math.round(labor * (1 - matPct / 100)),
        partnerSharePercent: sharePct,
        commissionCents: commission,
        partnerModel: partner.partnerModel,
      });
    } catch (error) {
      res.status(500).json({ message: "Fehler" });
    }
  });
}
