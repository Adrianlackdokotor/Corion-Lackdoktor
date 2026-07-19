import type { Express, Request, Response } from "express";
import path from "path";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { uploadToGoogleDrive } from "../lib/google-drive";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED = /jpg|jpeg|png|webp|heic|gif|bmp|tiff|tif|pdf|doc|docx|xls|xlsx|csv|txt|zip|ppt|pptx|odt|ods/i;

const fileSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().optional(),
  data: z.string().min(1),
});

const uploadSchema = z.object({
  category: z.enum(["cfo_inbox", "partner_post", "document", "generic"]).default("generic"),
  workshopOrderId: z.string().uuid().optional(),
  files: z.array(fileSchema).min(1).max(10),
});

function getMime(name: string, hint?: string): string {
  if (hint) return hint;
  const ext = path.extname(name).toLowerCase().replace(".", "");
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    heic: "image/heic", gif: "image/gif", bmp: "image/bmp",
    pdf: "application/pdf", csv: "text/csv", txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] || "application/octet-stream";
}

async function tryDrive(filename: string, mime: string, base64: string, ref?: string) {
  try {
    const r = await uploadToGoogleDrive(filename, mime, base64, ref);
    return { driveFileId: r.fileId, driveLink: r.webViewLink };
  } catch (e: any) {
    console.warn("[uploads] drive skipped:", e?.message || e);
    return { driveFileId: null, driveLink: null };
  }
}

const CATEGORY_ROLES: Record<string, string[]> = {
  cfo_inbox: ["admin"],
  partner_post: ["admin", "partner"],
  document: ["admin", "partner"],
  generic: ["admin", "partner", "client"],
};

export function registerUploadRoutes(app: Express) {
  app.post("/api/uploads", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const body = uploadSchema.parse(req.body);
      const user = req.user as any;
      const userId = user?.id ?? null;
      const role = user?.role ?? "client";

      const allowed = CATEGORY_ROLES[body.category] ?? [];
      if (!allowed.includes(role)) {
        return res.status(403).json({ message: `Kategorie "${body.category}" für Rolle "${role}" nicht erlaubt.` });
      }

      // Ownership check: when attaching to an existing order, the user must
      // either be admin, the partner assigned to it, or its creator.
      if (body.workshopOrderId) {
        let order: any = null;
        try { order = await storage.getWorkshopOrder?.(body.workshopOrderId); } catch { order = null; }
        if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden." });
        const isOwner =
          role === "admin" ||
          order.partnerId === userId ||
          order.createdBy === userId;
        if (!isOwner) return res.status(403).json({ message: "Kein Zugriff auf diesen Auftrag." });
      }

      const stored: any[] = [];
      for (const f of body.files) {
        const ext = path.extname(f.name).replace(".", "");
        if (ext && !ALLOWED.test(ext)) {
          return res.status(400).json({ message: `Dateityp "${ext}" nicht erlaubt.` });
        }
        const sizeBytes = Math.ceil((f.data.length * 3) / 4);
        if (sizeBytes > MAX_FILE_SIZE) {
          return res.status(413).json({ message: `"${f.name}" ist zu groß (max. 25 MB).` });
        }
        const mime = getMime(f.name, f.type);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(f.name)}`;
        const drive = await tryDrive(uniqueName, mime, f.data, body.workshopOrderId);
        const baseAtt: any = {
          filename: uniqueName,
          originalName: f.name,
          mimeType: mime,
          size: sizeBytes,
          data: f.data,
          uploadedBy: userId,
          driveFileId: drive.driveFileId,
          driveLink: drive.driveLink,
          category: body.category,
        };
        if (body.workshopOrderId) baseAtt.workshopOrderId = body.workshopOrderId;
        const att = await storage.createFileAttachment(baseAtt);
        stored.push({
          id: att.id,
          name: att.originalName,
          size: att.size,
          mimeType: att.mimeType,
          driveLink: att.driveLink,
          category: body.category,
          createdAt: att.createdAt,
        });
      }
      // Audit each uploaded file (fire-and-forget).
      try {
        const { logAudit } = await import("../services/auditLog");
        for (const s of stored) {
          void logAudit({
            actorUserId: userId,
            actorLabel: user?.email ?? role,
            action: "document.upload",
            entityType: "file_attachment",
            entityId: s.id,
            meta: { name: s.name, size: s.size, category: body.category, workshopOrderId: body.workshopOrderId ?? null },
            ip: req.ip,
          });
        }
      } catch (e) {
        console.warn("[uploads] audit hook failed:", (e as any)?.message);
      }

      // Best-effort: surface CFO uploads as a Task Board item so the CFO Agent
      // can pick them up. Failure here must NOT break the upload itself.
      const skipAutoExtract = req.headers["x-e2e-no-auto-extract"] === "1";
      if (body.category === "cfo_inbox") {
        try {
          const { autoCreateBoardTask } = await import("../services/taskAutoCreate");
          await autoCreateBoardTask({
            title: `CFO Inbox: ${stored.length} Datei(en) hochgeladen`,
            description: stored.map((s) => s.name).join(", ").slice(0, 500),
            sourceType: "upload",
            createdById: userId,
            payload: { uploadIds: stored.map((s) => s.id) },
          });
        } catch (e) {
          console.warn("[uploads] task hook failed:", (e as any)?.message);
        }

        // Fire-and-forget AI invoice extraction for each uploaded file.
        // Using setImmediate so we never block the upload response.
        // E2E tests pass `x-e2e-no-auto-extract: 1` to keep extraction in their own process.
        if (!skipAutoExtract) {
          for (const s of stored) {
            setImmediate(async () => {
              try {
                const { extractInvoiceFromAttachment } = await import("../services/invoiceExtractor");
                await extractInvoiceFromAttachment(s.id);
              } catch (e) {
                console.error("[uploads] invoice extract failed:", (e as any)?.message);
              }
            });
          }
        }
      }
      res.status(201).json({ uploads: stored });
    } catch (err: any) {
      if (err?.issues) return res.status(400).json({ message: "Ungültige Daten", issues: err.issues });
      console.error("[uploads] error:", err);
      res.status(500).json({ message: "Upload fehlgeschlagen" });
    }
  });
}
