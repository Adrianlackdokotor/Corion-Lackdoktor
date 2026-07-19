import type { Express, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import {
  generateFranchiseContractPdf,
  DEFAULT_CONTRACT_FIELDS,
  type ContractFields,
  type ContractLanguage,
} from "../lib/contracts/franchiseContractBC";

const CONTRACT_TEMPLATE_KEY = "contract_franchise_b_c";
const LANGS: ContractLanguage[] = ["de", "en", "ro", "es"];
const TITLES: Record<ContractLanguage, string> = {
  de: "Franchise-Kooperationsvertrag (DE)",
  en: "Franchise Cooperation Agreement (EN)",
  ro: "Contract de Cooperare Franciza (RO)",
  es: "Contrato de Cooperacion de Franquicia (ES)",
};

function isAdmin(req: any) {
  return req.user?.role === "admin";
}

async function canAccess(req: any, requireEdit = false): Promise<boolean> {
  if (!req.user?.id) return false;
  return storage.hasDocumentAccess(req.user.id, requireEdit);
}

async function ensureContractTemplates(userId: string) {
  const existing = await storage.getAllDocuments({ templateKey: CONTRACT_TEMPLATE_KEY });
  const haveLangs = new Set(existing.map((d) => d.language));
  for (const lang of LANGS) {
    if (haveLangs.has(lang)) continue;
    await storage.createDocument({
      title: TITLES[lang],
      description: "Editierbarer Franchise-Vertrag (Modell B & C). Felder unten anpassen, dann PDF generieren.",
      category: "contract",
      fileType: "template",
      templateKey: CONTRACT_TEMPLATE_KEY,
      language: lang,
      fields: DEFAULT_CONTRACT_FIELDS as any,
      tags: ["franchise", "contract", lang],
      createdBy: userId,
      updatedBy: userId,
    });
  }
}

export function registerDocumentRoutes(app: Express) {
  // List documents (admin or designated user)
  app.get("/api/admin/documents", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req))) return res.status(403).json({ message: "Zugriff verweigert" });
      if (isAdmin(req)) await ensureContractTemplates(req.user.id);
      const { category, fileType, language, templateKey } = req.query;
      const docs = await storage.getAllDocuments({
        category: category as string | undefined,
        fileType: fileType as string | undefined,
        language: language as string | undefined,
        templateKey: templateKey as string | undefined,
      });
      // Strip large fileContent from list response
      res.json(docs.map(({ fileContent, ...rest }) => rest));
    } catch (e: any) {
      console.error("[documents] list error", e);
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  // Get single document (with content if requested)
  app.get("/api/admin/documents/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req))) return res.status(403).json({ message: "Zugriff verweigert" });
      const doc = await storage.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ message: "Nicht gefunden" });
      const { fileContent, ...rest } = doc;
      if (req.query.includeContent === "1") return res.json(doc);
      res.json(rest);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  // Create document (upload or manual entry); admin or edit access
  app.post("/api/admin/documents", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req, true))) return res.status(403).json({ message: "Bearbeitungsrecht erforderlich" });
      const body = req.body || {};
      const fileContent: string | undefined = body.fileContent;
      const fileSize = fileContent ? Math.floor((fileContent.length * 3) / 4) : undefined;
      if (fileSize && fileSize > 20 * 1024 * 1024) {
        return res.status(413).json({ message: "Datei zu groß (max. 20 MB)" });
      }
      const doc = await storage.createDocument({
        title: body.title,
        description: body.description ?? null,
        category: body.category || "other",
        fileType: body.fileType || "other",
        templateKey: body.templateKey ?? null,
        language: body.language ?? null,
        fields: body.fields ?? null,
        fileContent: fileContent ?? null,
        fileName: body.fileName ?? null,
        mimeType: body.mimeType ?? null,
        fileSize: fileSize ?? null,
        tags: body.tags ?? null,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      } as any);
      const { fileContent: _, ...rest } = doc;
      res.json(rest);
    } catch (e: any) {
      console.error("[documents] create error", e);
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  // Update document (fields, title, etc.)
  app.patch("/api/admin/documents/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req, true))) return res.status(403).json({ message: "Bearbeitungsrecht erforderlich" });
      const body = req.body || {};
      const update: any = { updatedBy: req.user.id };
      for (const k of ["title", "description", "category", "fileType", "language", "fields", "tags"]) {
        if (k in body) update[k] = body[k];
      }
      const doc = await storage.updateDocument(req.params.id, update);
      if (!doc) return res.status(404).json({ message: "Nicht gefunden" });
      const { fileContent: _, ...rest } = doc;
      res.json(rest);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  app.delete("/api/admin/documents/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Nur Admin" });
      await storage.deleteDocument(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  // Download/render: contract template -> generate PDF on demand; uploaded -> stream stored content
  app.get("/api/admin/documents/:id/file", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req))) return res.status(403).json({ message: "Zugriff verweigert" });
      const doc = await storage.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ message: "Nicht gefunden" });

      if (doc.templateKey === CONTRACT_TEMPLATE_KEY) {
        const lang = (doc.language || "de") as ContractLanguage;
        const fields = { ...DEFAULT_CONTRACT_FIELDS, ...((doc.fields as any) || {}) } as ContractFields;
        const pdf = generateFranchiseContractPdf(lang, fields);
        const fname = `${doc.title.replace(/[^a-z0-9]+/gi, "_")}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${fname}"`);
        return res.send(pdf);
      }

      if (doc.fileContent && doc.mimeType) {
        const buf = Buffer.from(doc.fileContent, "base64");
        res.setHeader("Content-Type", doc.mimeType);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${doc.fileName || doc.title}"`
        );
        return res.send(buf);
      }

      res.status(404).json({ message: "Keine Datei vorhanden" });
    } catch (e: any) {
      console.error("[documents] file error", e);
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  // AI agent edit endpoint: applies a partial fields update from an AI agent
  app.post("/api/admin/documents/:id/ai-update", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req, true))) return res.status(403).json({ message: "Bearbeitungsrecht erforderlich" });
      const doc = await storage.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ message: "Nicht gefunden" });
      const partial = req.body?.fields || {};
      const merged = { ...((doc.fields as any) || {}), ...partial };
      const updated = await storage.updateDocument(doc.id, { fields: merged, updatedBy: req.user.id } as any);
      const { fileContent: _, ...rest } = updated!;
      res.json(rest);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  // === AI helper: extract structured fields from free text ===
  app.post("/api/ai/extract-fields", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!(await canAccess(req, true))) return res.status(403).json({ message: "Bearbeitungsrecht erforderlich" });
      const { text, targetFields } = req.body || {};
      if (!text || !Array.isArray(targetFields) || targetFields.length === 0) {
        return res.status(400).json({ message: "text und targetFields erforderlich" });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ message: "Gemini API nicht konfiguriert" });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Du erhältst einen Text und musst daraus die folgenden Felder als JSON-Objekt extrahieren.
Felder: ${targetFields.join(", ")}
Antworte AUSSCHLIESSLICH mit reinem JSON in der Form { "fields": { "<key>": "<value>", ... } }.
Wenn ein Feld nicht im Text vorkommt, lasse es weg. Numerische Felder als Zahl, Datumsangaben als YYYY-MM-DD.

TEXT:
"""
${text}
"""`;
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const raw = (result.text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      let parsed: any = null;
      try { parsed = JSON.parse(raw); } catch { /* ignore */ }
      if (!parsed || typeof parsed !== "object") return res.json({ fields: {} });
      res.json({ fields: parsed.fields || parsed });
    } catch (e: any) {
      console.error("[ai/extract-fields]", e);
      res.status(500).json({ message: e?.message || "KI-Fehler" });
    }
  });

  // === Access management (admin only) ===
  app.get("/api/admin/document-access", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Nur Admin" });
      const rows = await storage.getAllDocumentAccess();
      res.json(rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        permission: r.permission,
        grantedAt: r.grantedAt,
        userEmail: r.user?.email,
        userName: [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || r.user?.email,
        userRole: r.user?.role,
      })));
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  app.post("/api/admin/document-access", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Nur Admin" });
      const { userId, permission } = req.body || {};
      if (!userId) return res.status(400).json({ message: "userId fehlt" });
      const target = await storage.getUser(userId);
      if (!target) return res.status(404).json({ message: "Benutzer nicht gefunden" });
      const row = await storage.grantDocumentAccess({
        userId,
        permission: permission === "edit" ? "edit" : "view",
        grantedBy: req.user.id,
      });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });

  app.delete("/api/admin/document-access/:userId", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ message: "Nur Admin" });
      await storage.revokeDocumentAccess(req.params.userId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Fehler" });
    }
  });
}
