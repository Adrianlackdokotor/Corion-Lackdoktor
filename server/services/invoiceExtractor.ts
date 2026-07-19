import { GoogleGenAI } from "@google/genai";
import { db } from "../../db/index";
import { fileAttachments, supplierInvoices, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { logAudit } from "./auditLog";

/** Resolve partner_id from a free-text hint (name / company / email). Best-effort. */
async function resolvePartnerFromHint(hint: string | null | undefined): Promise<string | null> {
  if (!hint || typeof hint !== "string") return null;
  const trimmed = hint.trim();
  if (trimmed.length < 2) return null;
  try {
    const r: any = await db.execute(sql`
      SELECT id FROM users
      WHERE role IN ('partner','mechanic')
        AND (
          LOWER(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) LIKE LOWER(${'%' + trimmed + '%'})
          OR LOWER(COALESCE(company,'')) LIKE LOWER(${'%' + trimmed + '%'})
          OR LOWER(COALESCE(email,''))   LIKE LOWER(${'%' + trimmed + '%'})
        )
      LIMIT 1
    `);
    const row = (r?.rows ?? r ?? [])[0];
    return row?.id ?? null;
  } catch {
    return null;
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface ExtractedInvoice {
  supplier_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null; // YYYY-MM-DD
  total_cents?: number | null;
  vat_cents?: number | null;
  currency?: string | null;
  line_items?: Array<{ description?: string; quantity?: number; unit_price_cents?: number; total_cents?: number }> | null;
  /** AI-classified: true when invoice content is materials (paint, lacquer, parts, abrasives, body filler, consumables, etc.). */
  is_material?: boolean | null;
  /** Confidence 0..1 for is_material classification. */
  material_confidence?: number | null;
  /** Partner / mechanic / company hint extracted from invoice text. Used for partner attribution. */
  partner_hint?: string | null;
}

/**
 * Hook for tests to bypass the live Gemini call. When set, this function is
 * used instead of calling the API. Default is null (live).
 */
let extractorOverride: ((args: { mimeType: string; base64: string; filename: string }) => Promise<ExtractedInvoice>) | null = null;
export function __setExtractorOverrideForTests(fn: typeof extractorOverride) {
  extractorOverride = fn;
}

const PROMPT = `Du bist ein Rechnungs-Extraktor für eine Auto-Lackwerkstatt. Analysiere diese Lieferanten-Rechnung (Eingangsrechnung) und gib NUR ein valides JSON-Objekt zurück, ohne Markdown.

Schema:
{
  "supplier_name": string | null,            // Name des Lieferanten / Unternehmens das die Rechnung ausstellt
  "invoice_number": string | null,           // Rechnungsnummer
  "invoice_date": string | null,             // ISO Datum YYYY-MM-DD
  "total_cents": number | null,              // Bruttobetrag in CENTS (€100.50 -> 10050)
  "vat_cents": number | null,                // MwSt-Betrag in CENTS
  "currency": string | null,                 // ISO 4217, z.B. "EUR"
  "line_items": [{ "description": string, "quantity": number, "unit_price_cents": number, "total_cents": number }] | null,
  "is_material": boolean,                    // true wenn die Rechnung MATERIAL für Lackierarbeiten enthält:
                                              //   Lack, Klarlack, Grundierung, Härter, Verdünner, Spachtel,
                                              //   Schleifpapier, Polierpaste, Klebeband, Folie, Ersatzteile,
                                              //   Verbrauchsmaterial, Werkstattbedarf. false bei Miete, Strom,
                                              //   Telefon, Versicherung, Software, Beratung, Marketing.
  "material_confidence": number,             // 0..1 Konfidenz für is_material
  "partner_hint": string | null              // Name des Partners / Mechanikers / Werkstatt der diese Rechnung
                                              //   verursacht hat (oft als "Lieferung an", "Empfänger",
                                              //   "Kostenstelle" oder im Betreff). null wenn unklar.
}

Felder die nicht gefunden werden als null setzen. Beträge IMMER in Cents als integer.`;

async function callGemini(args: { mimeType: string; base64: string; filename: string }): Promise<ExtractedInvoice> {
  if (extractorOverride) return extractorOverride(args);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType: args.mimeType, data: args.base64 } },
      ],
    }],
    config: { maxOutputTokens: 2048 },
  });
  const raw = (response.text || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  if (!raw) throw new Error("empty_response");
  return JSON.parse(raw) as ExtractedInvoice;
}

/**
 * Read one supplier_invoice by file_attachment_id with raw SQL. Catches the
 * known neon-http parser bug on empty result sets.
 */
async function safeSelectInvoiceByAttachment(
  fileAttachmentId: string,
): Promise<{ id: string; status: string } | null> {
  try {
    const r: any = await db.execute(sql`
      SELECT id, status FROM supplier_invoices
      WHERE file_attachment_id = ${fileAttachmentId}
      LIMIT 1
    `);
    const row = (r?.rows ?? r ?? [])[0];
    return row ? { id: row.id, status: row.status } : null;
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const stack = String(err?.stack ?? "");
    if (
      msg.includes("Cannot read properties of null") &&
      msg.includes("'map'") &&
      stack.includes("@neondatabase/serverless") &&
      stack.includes("processQueryResult")
    ) {
      return null;
    }
    throw err;
  }
}

/**
 * Extract a supplier invoice from a file_attachments row and persist it.
 * Idempotent: if a supplier_invoices row already exists for this attachment,
 * returns it without re-extracting.
 */
export async function extractInvoiceFromAttachment(fileAttachmentId: string): Promise<{ id: string; status: string; reused: boolean }> {
  // Idempotency check via UNIQUE(file_attachment_id). Use raw SQL to dodge
  // the neon-http empty-result parser bug that `.select()` can hit.
  const existing = await safeSelectInvoiceByAttachment(fileAttachmentId);
  if (existing) {
    return { id: existing.id, status: existing.status, reused: true };
  }

  const [att] = await db
    .select()
    .from(fileAttachments)
    .where(eq(fileAttachments.id, fileAttachmentId))
    .limit(1);
  if (!att) throw new Error("file_attachment_not_found");

  let extracted: ExtractedInvoice = {};
  let extractionError: string | null = null;
  try {
    extracted = await callGemini({
      mimeType: att.mimeType,
      base64: att.data,
      filename: att.originalName,
    });
  } catch (err: any) {
    extractionError = err?.message ?? "unknown";
    console.error("[invoiceExtractor] extract failed", extractionError);
  }

  // Race-safe insert: if two parallel extractions race, the UNIQUE index lets
  // only one win; the loser falls back to selecting the existing row.
  let invoiceId: string;
  let status = "pending_approval";
  try {
    // CRITICAL: drizzle + neon-http binds JS `null` as the string "null" for
    // text/varchar columns (becomes empty string in DB) — must omit nullable
    // columns entirely instead of passing null. See replit.md Faza C notes.
    const values: Record<string, any> = {
      fileAttachmentId,
      currency: extracted.currency ?? "EUR",
      status: "pending_approval",
      extractedJson: extractionError ? { error: extractionError, partial: extracted } : (extracted as any),
    };
    if (att.workshopOrderId) values.workshopOrderId = att.workshopOrderId;
    if (extracted.supplier_name) values.supplierName = extracted.supplier_name;
    if (extracted.invoice_number) values.invoiceNumber = extracted.invoice_number;
    if (extracted.invoice_date) values.invoiceDate = extracted.invoice_date;
    if (typeof extracted.total_cents === "number") values.totalCents = Math.round(extracted.total_cents);
    if (typeof extracted.vat_cents === "number") values.vatCents = Math.round(extracted.vat_cents);
    if (extractionError) values.notes = `extraction_failed: ${extractionError}`;
    // Materials classification + partner attribution
    if (extracted.is_material === true) values.isMaterial = true;
    const resolvedPartner = await resolvePartnerFromHint(extracted.partner_hint);
    if (resolvedPartner) values.partnerId = resolvedPartner;
    const inserted = await db
      .insert(supplierInvoices)
      .values(values as any)
      .returning({ id: supplierInvoices.id });
    invoiceId = inserted[0]?.id ?? "";
    if (!invoiceId) {
      // neon-http RETURNING quirk fallback
      const [row] = await db
        .select({ id: supplierInvoices.id })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.fileAttachmentId, fileAttachmentId));
      invoiceId = row?.id ?? "";
    }
  } catch (err: any) {
    if (String(err?.message ?? "").includes("supplier_invoices_file_attachment_unique")) {
      const row = await safeSelectInvoiceByAttachment(fileAttachmentId);
      return { id: row?.id ?? "", status: row?.status ?? "pending_approval", reused: true };
    }
    throw err;
  }

  await logAudit({
    actorLabel: "system",
    action: extractionError ? "invoice.extract_failed" : "invoice.extract",
    entityType: "supplier_invoice",
    entityId: invoiceId,
    meta: {
      fileAttachmentId,
      supplierName: extracted.supplier_name ?? null,
      totalCents: extracted.total_cents ?? null,
      error: extractionError,
    },
  });

  return { id: invoiceId, status, reused: false };
}
