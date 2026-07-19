import { GoogleGenAI } from "@google/genai";
import type { WorkshopOrder, User } from "@shared/schema";

let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey: key });
  return aiClient;
}

const LANGUAGE_NAMES: Record<string, string> = {
  de: "German",
  ro: "Romanian",
  en: "English",
  es: "Spanish",
  tr: "Turkish",
  el: "Greek",
};

export function pickDamagePhotos(attachments: any[] = []) {
  const imageAttachments = attachments.filter((att) => att?.mimeType?.startsWith("image/"));
  const preferred = imageAttachments.filter((att) => {
    const name = String(att?.originalName || att?.filename || "").toLowerCase();
    const category = String(att?.category || "").toLowerCase();
    return category.includes("damage") || category.includes("auftrag") || category.includes("intake") || /(damage|schaden|delle|kratzer|hagel|beule|repair|repairorder|auftrag)/.test(name);
  });
  return (preferred.length > 0 ? preferred : imageAttachments).slice(0, 6);
}

export async function translateDescriptionForPartner(order: WorkshopOrder, partner: User | null | undefined): Promise<string> {
  const source = String(order.damageDescription || "").trim();
  if (!source) return "";

  const lang = partner?.preferredLanguage || "de";
  if (lang === "de") return source;

  const existing = ((order as any).partnerDescriptionTranslations || {}) as Record<string, string>;
  if (existing[lang]) return existing[lang];

  const ai = getAi();
  if (!ai) return source;

  try {
    const targetLanguage = LANGUAGE_NAMES[lang] || "German";
    const prompt = [
      `Translate this automotive repair damage description into ${targetLanguage}.`,
      "Keep it concise, practical, and workshop-friendly.",
      "Preserve exact damaged parts and repair meaning.",
      "Return only the translated text, no intro, no quotes.",
      "",
      source,
    ].join("\n");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = String(result.text || "").trim();
    return text || source;
  } catch {
    return source;
  }
}
