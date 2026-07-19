import type { Express, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { z } from "zod";
import { storage } from "../storage";
import { executeIntake } from "../services/auftragIntake";
import { createTask } from "../services/opsActions";
import { autoCreateBoardTask } from "../services/taskAutoCreate";
import { notifyAdminsOfNewPublicIntake } from "../services/notificationService";

const ALLOWED_EXTENSIONS = /jpg|jpeg|png|webp|heic|gif|bmp|tiff|tif|pdf|doc|docx|xls|xlsx|csv|txt|zip|rar|7z/i;
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const PUBLIC_INTAKE_WINDOW_MS = 60 * 60 * 1000;
const PUBLIC_INTAKE_MAX_REQUESTS = 5;
const publicIntakeAttempts = new Map<string, number[]>();

const publicFileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().max(100).optional(),
  data: z.string().min(1),
  size: z.number().int().nonnegative().optional(),
});

const publicConversationTurnSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().trim().min(1).max(1000),
});

const publicIntakeSchema = z.object({
  customerName: z.string().trim().min(1).max(200).default("Unbekannt"),
  customerEmail: z.string().trim().email().max(254).optional(),
  customerPhone: z.string().trim().min(3).max(50).optional(),
  damageDescription: z.string().trim().min(5).max(2000),
  vehicleMake: z.string().trim().max(100).optional(),
  vehicleModel: z.string().trim().max(100).optional(),
  vehiclePlate: z.string().trim().max(20).optional(),
  vehicleColor: z.string().trim().max(50).optional(),
  journeyType: z.string().trim().max(50).optional(),
  customerPriority: z.string().trim().max(50).optional(),
  preferredContact: z.enum(["whatsapp", "phone", "email"]).optional(),
  desiredTiming: z.string().trim().max(200).optional(),
  conversationTranscript: z.array(publicConversationTurnSchema).max(24).optional(),
  files: z.array(publicFileSchema).max(MAX_FILES).default([]),
}).refine((value) => Boolean(value.customerEmail || value.customerPhone), {
  message: "E-Mail oder Telefon/WhatsApp ist erforderlich.",
  path: ["customerPhone"],
});

function allowPublicIntake(ip: string): boolean {
  const now = Date.now();
  const recent = (publicIntakeAttempts.get(ip) || [])
    .filter((timestamp) => now - timestamp < PUBLIC_INTAKE_WINDOW_MS);
  if (recent.length >= PUBLIC_INTAKE_MAX_REQUESTS) {
    publicIntakeAttempts.set(ip, recent);
    return false;
  }
  recent.push(now);
  publicIntakeAttempts.set(ip, recent);
  return true;
}

function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).replace(".", "");
  return new RegExp(`^(?:${ALLOWED_EXTENSIONS.source})$`, "i").test(ext);
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
  };
  return mimeMap[ext] || "application/octet-stream";
}

interface Base64File {
  name: string;
  type?: string;
  data: string;
  size?: number;
}

export function registerClientSubmissionRoutes(app: Express) {

  app.post("/api/client/private-estimate-task", async (req: any, res: Response) => {
    try {
      const { contact, preferredContact, damageDescription, files: uploadFiles } = req.body;

      if (!contact || !damageDescription) {
        return res.status(400).json({ message: "Kontakt und Beschreibung sind erforderlich." });
      }

      const fileArray: Base64File[] = uploadFiles || [];
      for (const f of fileArray) {
        if (!validateFileExtension(f.name)) return res.status(400).json({ message: `Dateityp von "${f.name}" nicht erlaubt.` });
        const sizeBytes = Math.ceil((f.data.length * 3) / 4);
        if (sizeBytes > MAX_FILE_SIZE) return res.status(413).json({ message: `"${f.name}" ist zu groß. Max: 20 MB.` });
      }

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "corion-private-estimate-"));
      const tempFiles = fileArray.map((f) => {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(f.name)}`;
        const absPath = path.join(tempDir, filename);
        fs.writeFileSync(absPath, Buffer.from(f.data, "base64"));
        return { absPath, originalName: f.name, mimeType: f.type || getMimeType(f.name) };
      });

      let intakeResult: Awaited<ReturnType<typeof executeIntake>> | null = null;
      let order: Awaited<ReturnType<typeof storage.getWorkshopOrder>>;
      try {
        intakeResult = await executeIntake({
          customerName: "Unbekannt",
          customerEmail: preferredContact === "email" ? contact : null,
          customerPhone: preferredContact !== "email" ? contact : null,
          customerType: "B2C",
          vehicleMake: "Unbekannt",
          vehicleModel: null,
          vehiclePlate: "UNBEKANNT",
          vehicleColor: null,
          damageDescription: [
            "Journey-Type: private_chat_estimate",
            preferredContact ? `Preferred-Contact: ${preferredContact}` : null,
            `Kontakt: ${contact}`,
            "Ziel: Menschliche Preisprüfung + profit-orientiertes Angebot",
            "",
            damageDescription,
          ].filter(Boolean).join("\n"),
          intakeSource: "landing_chat_private_estimate",
          attachments: tempFiles.map((f) => ({
            localPath: f.absPath,
            originalName: f.originalName,
            mimeType: f.mimeType,
            category: "damage_photo" as const,
          })),
          notes: `Kontakt: ${contact}`,
        });
        order = await storage.getWorkshopOrder(intakeResult.orderId);
      } finally {
        for (const tempPath of tempFiles.map((f) => f.absPath)) {
          try { fs.unlinkSync(tempPath); } catch {}
        }
        try { fs.rmdirSync(tempDir); } catch {}
      }

      const task = await createTask({
        title: `Privatanfrage Preisprüfung`,
        description: [
          `Kontakt: ${contact}`,
          preferredContact ? `Bevorzugter Kontakt: ${preferredContact}` : null,
          `Kontext: Private Schadenanfrage aus Landing-Chat`,
          `Ziel: Menschliche Preisprüfung + profit-orientiertes Angebot`,
          intakeResult?.referenceNumber ? `Auftrag: ${intakeResult.referenceNumber}` : null,
          '',
          damageDescription,
        ].filter(Boolean).join("\n"),
        priority: "high",
        column: "todo",
        source: "landing_chat_private_estimate",
        relatedOrderId: intakeResult?.orderId ?? null,
        driveFolderUrl: order?.driveFolderUrl ?? null,
      });

      return res.status(201).json({ ok: true, taskId: task.taskId, orderId: intakeResult?.orderId ?? null, referenceNumber: intakeResult?.referenceNumber ?? null, driveFolderUrl: order?.driveFolderUrl ?? null });
    } catch (error) {
      console.error("Private estimate task error:", error);
      return res.status(500).json({ message: "Fehler beim Anlegen der internen Anfrage." });
    }
  });

  app.post("/api/client/submit-request", async (req: any, res: Response) => {
    try {
      if (!allowPublicIntake(req.ip || req.socket?.remoteAddress || "unknown")) {
        return res.status(429).json({ message: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." });
      }
      const parsed = publicIntakeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message || "Ungültige Anfrage.",
          issues: parsed.error.issues,
        });
      }

      const { customerName, customerEmail, customerPhone, damageDescription, vehicleMake, vehicleModel, vehiclePlate, vehicleColor, journeyType, customerPriority, preferredContact, desiredTiming, conversationTranscript, files: uploadFiles } = parsed.data;

      const fileArray: Base64File[] = uploadFiles || [];

      if (fileArray.length > MAX_FILES) {
        return res.status(413).json({ message: `Maximal ${MAX_FILES} Dateien erlaubt.` });
      }

      let totalSizeBytes = 0;

      for (const f of fileArray) {
        if (!validateFileExtension(f.name)) return res.status(400).json({ message: `Dateityp von "${f.name}" nicht erlaubt.` });
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(f.data) || f.data.length % 4 !== 0) {
          return res.status(400).json({ message: `Datei "${f.name}" enthält ungültige Daten.` });
        }
        const sizeBytes = Buffer.from(f.data, "base64").length;
        if (sizeBytes > MAX_FILE_SIZE) return res.status(413).json({ message: `"${f.name}" ist zu groß. Max: 10 MB.` });
        totalSizeBytes += sizeBytes;
      }

      if (totalSizeBytes > MAX_TOTAL_SIZE) {
        return res.status(413).json({ message: "Alle Dateien zusammen dürfen maximal 50 MB gross sein." });
      }

      const canonicalDescription = [
        journeyType ? `Journey-Type: ${journeyType}` : null,
        customerPriority ? `Customer-Priority: ${customerPriority}` : null,
        preferredContact ? `Preferred-Contact: ${preferredContact}` : null,
        desiredTiming ? `Desired-Timing: ${desiredTiming}` : null,
        "",
        damageDescription,
      ].filter(Boolean).join("\n");

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "corion-client-submit-"));
      const tempFiles = fileArray.map((f) => {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(f.name)}`;
        const absPath = path.join(tempDir, filename);
        fs.writeFileSync(absPath, Buffer.from(f.data, "base64"));
        return absPath;
      });

      let intakeResult: Awaited<ReturnType<typeof executeIntake>>;
      try {
        intakeResult = await executeIntake({
          customerName,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          customerType: "B2C",
          vehicleMake: vehicleMake || "Unbekannt",
          vehicleModel: vehicleModel || null,
          vehiclePlate: vehiclePlate || "UNBEKANNT",
          vehicleColor: vehicleColor || null,
          damageDescription: canonicalDescription,
          intakeSource: "client_submission",
          conversationTranscript: conversationTranscript ?? null,
          attachments: fileArray.map((f, index) => ({
            localPath: tempFiles[index],
            originalName: f.name,
            mimeType: f.type || getMimeType(f.name),
            category: (f.type || getMimeType(f.name)).startsWith("image/") ? "damage_photo" as const : "document" as const,
          })),
          notes: [
            customerEmail ? `Customer-Email: ${customerEmail}` : null,
          ].filter(Boolean).join("\n") || null,
        });
      } finally {
        for (const tempPath of tempFiles) {
          try {
            fs.unlinkSync(tempPath);
          } catch {}
        }
        try {
          fs.rmdirSync(tempDir);
        } catch {}
      }

      const order = await storage.getWorkshopOrder(intakeResult.orderId);
      const attachmentsIncomplete = fileArray.length > intakeResult.attachmentsCreated;

      // A public request becomes an active internal work item, while keeping
      // workshop_orders as the only canonical case record. Reception is the
      // existing internal triage role; client-facing work always requires
      // review and cannot be auto-completed by an agent.
      const referenceNumber = order?.referenceNumber ?? intakeResult.referenceNumber;
      const vehicle = [order?.vehicleMake, order?.vehicleModel, order?.vehiclePlate]
        .filter(Boolean)
        .join(" ") || "Fahrzeug noch nicht angegeben";
      const handoffTask = await autoCreateBoardTask({
        title: `Neue Landing-Anfrage · ${referenceNumber}`,
        description: [
          `Referenz: ${referenceNumber}`,
          `Kunde: ${order?.customerName ?? customerName}`,
          `Kontakt: ${[order?.customerEmail, order?.customerPhone].filter(Boolean).join(" · ") || "kein Kontakt"}`,
          `Fahrzeug: ${vehicle}`,
          "Kanal: corion.app / client_submission",
          `Dateien: ${intakeResult.attachmentsCreated} von ${fileArray.length} persistiert`,
          "Nächster Schritt: Auftrag prüfen, Daten strukturieren und eine passende Kundenantwort bzw. Angebotsfolge vorbereiten.",
        ].join("\n"),
        sourceType: "auftrag",
        sourceId: intakeResult.orderId,
        clientFacing: true,
        forcedAgent: "reception",
        createdById: order?.createdBy ?? null,
        payload: {
          action: "landing_intake_triage",
          intakeSource: "client_submission",
          referenceNumber,
          orderId: intakeResult.orderId,
          requestedFiles: fileArray.length,
          attachmentsCreated: intakeResult.attachmentsCreated,
          attachmentPersistenceComplete: !attachmentsIncomplete,
        },
      });

      if (!handoffTask) {
        console.error(`[client-submission] operational handoff task failed for ${referenceNumber}`);
      }

      // Delivery failures must never roll back the canonical order. They are
      // recorded in its timeline; the in-app notification is the primary
      // operational alert and e-mail is an additional configured channel.
      await notifyAdminsOfNewPublicIntake({
        orderId: intakeResult.orderId,
        referenceNumber,
        customerName: order?.customerName ?? customerName,
        customerEmail: order?.customerEmail ?? customerEmail,
        customerPhone: order?.customerPhone ?? customerPhone,
        vehicleMake: order?.vehicleMake ?? vehicleMake,
        vehicleModel: order?.vehicleModel ?? vehicleModel,
        vehiclePlate: order?.vehiclePlate ?? vehiclePlate,
        damageDescription: canonicalDescription,
        intakeSource: "client_submission",
        attachmentsCreated: intakeResult.attachmentsCreated,
      }).catch((error) => {
        console.error(`[client-submission] admin notification failed for ${referenceNumber}`, error);
      });

      // The Auftrag is canonical once executeIntake returns. A public visitor
      // must nevertheless not get an all-clear when some selected files were
      // not persisted. Return the real reference for recovery, but mark the
      // response as partial so the landing cannot render a false success.
      res.status(attachmentsIncomplete ? 409 : 201).json({
        order,
        intakeResult,
        partial: attachmentsIncomplete,
        message: attachmentsIncomplete
          ? `Auftrag ${order?.referenceNumber ?? intakeResult.referenceNumber} wurde erstellt, aber nicht alle Dateien konnten verarbeitet werden.`
          : `Auftrag ${order?.referenceNumber ?? intakeResult.referenceNumber} erfolgreich erstellt.`,
      });
    } catch (error) {
      console.error("Client submission error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Anfrage. Bitte versuchen Sie es erneut." });
    }
  });

  app.post("/api/client/orders/:id/attachments", async (req: any, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Nicht angemeldet" });
      }
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (order.clientUserId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });

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
        const att = await storage.createFileAttachment({
          workshopOrderId: req.params.id,
          filename: `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(f.name)}`,
          originalName: f.name,
          mimeType,
          size: sizeBytes,
          data: f.data,
          uploadedBy: req.user.id,
        });
        created.push({ id: att.id, filename: att.filename, originalName: att.originalName, mimeType: att.mimeType, size: att.size, createdAt: att.createdAt });
      }
      res.json({ files: created });
    } catch (error) {
      console.error("Client attachment upload error:", error);
      res.status(500).json({ message: "Fehler beim Hochladen" });
    }
  });

  app.get("/api/client/orders/:id/files", async (req: any, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Nicht angemeldet" });
      }
      const order = await storage.getWorkshopOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (order.clientUserId !== req.user.id) return res.status(403).json({ message: "Zugriff verweigert" });
      const files = await storage.getFileAttachmentsByOrder(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Fehler" });
    }
  });

  app.get("/api/client/my-orders", async (req: any, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Nicht angemeldet" });
      }
      const orders = await storage.getWorkshopOrdersByClient(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Get client orders error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Aufträge" });
    }
  });

  app.get("/api/client/my-offers", async (req: any, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Nicht angemeldet" });
      }
      const offersList = await storage.getOffersByClientUser(req.user.id);
      res.json(offersList);
    } catch (error) {
      console.error("Get client offers error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Angebote" });
    }
  });

  app.get("/api/client/my-appointments", async (req: any, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Nicht angemeldet" });
      }
      const orders = await storage.getWorkshopOrdersByClient(req.user.id);
      const scheduledOrders = orders.filter(o => o.scheduledDate);
      res.json(scheduledOrders.map(o => ({
        id: o.id,
        title: `Auftrag ${o.referenceNumber} - ${o.customerName}`,
        scheduledDate: o.scheduledDate,
        status: o.status,
        vehicleInfo: [o.vehicleMake, o.vehicleModel].filter(Boolean).join(" "),
        licensePlate: o.vehiclePlate,
      })));
    } catch (error) {
      console.error("Get client appointments error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Termine" });
    }
  });
}
