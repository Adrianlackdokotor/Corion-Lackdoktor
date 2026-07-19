import type { Express, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { GoogleGenAI } from "@google/genai";
import { writeCoordMessage } from "../services/coordMessages";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const MEISTER_OLLAMA_MODEL = process.env.MEISTER_OLLAMA_MODEL || "gemma4:latest";

function isPartnerOrAdmin(req: any): boolean {
  return req.user?.role === "partner" || req.user?.role === "admin";
}

const prepareOfferSchema = z.object({
  customerName: z.string().min(1),
  vehicleInfo: z.string().min(1),
  damageDescription: z.string().min(1),
  estimatedAmount: z.number().min(0),
  serviceType: z.string().optional(),
  urgency: z.string().optional(),
});

const battlecardSchema = z.object({
  clientId: z.string().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  vehicleInfo: z.string().optional(),
  previousInteractions: z.string().optional(),
  objective: z.string().optional(),
});

const auftragAssistSchema = z.object({
  orderId: z.string().min(1),
  userMessage: z.string().optional(),
});

let gemmaClient: GoogleGenAI | null = null;
function getGemma() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;
  if (!gemmaClient) gemmaClient = new GoogleGenAI({ apiKey: key });
  return gemmaClient;
}

function getPartnerLanguageLabel(lang?: string | null) {
  switch (lang) {
    case "ro": return "Romanian";
    case "en": return "English";
    case "es": return "Spanish";
    case "tr": return "Turkish";
    case "el": return "Greek";
    default: return "German";
  }
}

export function registerMeisterAIRoutes(app: Express) {

  app.post("/api/meister-ai/sales/prepare-offer", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });

      const data = prepareOfferSchema.parse(req.body);
      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(503).json({ message: "KI-Dienst momentan nicht verfügbar" });
      }

      let partnerContext = "";
      try {
        const offers = await storage.getOffersByPartner(req.user.id);
        const acceptedCount = offers.filter((o: any) => o.status === "accepted").length;
        const totalCount = offers.length;
        partnerContext = `\nPartner-Statistik: ${totalCount} Angebote gesamt, ${acceptedCount} akzeptiert (${totalCount > 0 ? Math.round(acceptedCount / totalCount * 100) : 0}% Erfolgsquote).`;
      } catch {}

      const systemPrompt = `Du bist der Corion Meister AI Sales-Experte. Du hilfst Partnern der Corion Lackdoktor Werkstatt, professionelle und überzeugende Angebote zu erstellen.

Dein Stil:
- Professionell, vertrauenserweckend, kundenorientiert
- Betone Qualität, Erfahrung und Garantie
- Erkläre den Wert der Dienstleistung (warum es den Preis wert ist)
- Nenne konkrete Vorteile: Original-Lackmaterialien, zertifizierte Techniker, Garantie
- Verwende eine klare Struktur: Betreff, Anrede, Beschreibung, Leistungen, Preis, Garantie, Abschluss
- Alles auf Deutsch

Corion Lackdoktor Alleinstellungsmerkmale:
- Über 20 Jahre Erfahrung in der Fahrzeuglackierung
- Zertifizierte Techniker mit Meisterbrief
- Original-Lackmaterialien (SATA, Spies Hecker)
- 2 Jahre Garantie auf alle Arbeiten
- Kostenloser Hol- und Bringservice
- Standorte in Hofheim-Wallau, Mainz-Kastel, Wiesbaden
${partnerContext}

Antworte NUR als JSON:
{
  "subject": "Betreff-Zeile für E-Mail/Brief",
  "greeting": "Persönliche Anrede",
  "body": "Haupttext des Angebots (mit Absätzen, detailliert)",
  "services": ["Liste der enthaltenen Leistungen"],
  "priceBreakdown": "Preisaufschlüsselung (inkl. MwSt)",
  "guarantee": "Garantie-Hinweis",
  "closing": "Abschluss mit Call-to-Action",
  "tips": ["Verkaufstipps für den Partner (intern, nicht für den Kunden)"]
}`;

      const userPrompt = `Erstelle ein professionelles Angebot für:
- Kunde: ${data.customerName}
- Fahrzeug: ${data.vehicleInfo}
- Schadensbeschreibung: ${data.damageDescription}
- Geschätzter Betrag: ${data.estimatedAmount.toLocaleString("de-DE")} €
${data.serviceType ? `- Serviceart: ${data.serviceType}` : ""}
${data.urgency ? `- Dringlichkeit: ${data.urgency}` : ""}

Erstelle ein überzeugendes Angebot, das dem Kunden erklärt, warum die Reparatur bei Corion Lackdoktor den Preis wert ist.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error for prepare-offer");
        return res.status(502).json({ message: "KI konnte das Angebot nicht generieren" });
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(content);
        res.json({ type: "offer", ...parsed });
      } catch {
        res.json({ type: "offer", body: content, tips: [] });
      }
    } catch (error: any) {
      console.error("Meister AI prepare-offer error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      res.status(500).json({ message: "Fehler bei der Angebotserstellung" });
    }
  });

  app.post("/api/meister-ai/sales/battlecard", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });

      const data = battlecardSchema.parse(req.body);
      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(503).json({ message: "KI-Dienst momentan nicht verfügbar" });
      }

      let clientHistory = "";
      if (data.clientId) {
        try {
          const client = await storage.getClient(data.clientId);
          if (client && (req.user.role === "admin" || client.partnerId === req.user.id)) {
            clientHistory += `\nKundenstatus: ${client.status}`;
            if (client.notes) clientHistory += `\nNotizen: ${client.notes}`;

            const interactions = await storage.getInteractionsByClient(data.clientId);
            if (interactions.length > 0) {
              clientHistory += `\nLetzte ${Math.min(interactions.length, 5)} Interaktionen:`;
              interactions.slice(0, 5).forEach((i: any) => {
                clientHistory += `\n- ${i.type}: ${i.notes || "Keine Details"} (${new Date(i.createdAt).toLocaleDateString("de-DE")})`;
              });
            }
          }
        } catch {}
      }

      const systemPrompt = `Du bist der Corion Meister AI Sales-Coach. Du erstellst "Battlecards" (Kundenvorbereitung) für Verkaufsgespräche.

Eine Battlecard hilft dem Partner:
- Den Kunden besser zu verstehen
- Das Gespräch vorzubereiten
- Die richtigen Argumente parat zu haben
- Einwände zu entkräften
- Den Abschluss zu erzielen

Corion Lackdoktor Stärken:
- Über 20 Jahre Erfahrung
- Zertifizierte Meisterbetrieb-Qualität
- Original-Lackmaterialien
- 2 Jahre Garantie
- Mehrere Standorte (Hofheim-Wallau, Mainz-Kastel, Wiesbaden)
- Kostenloser Hol- und Bringservice
- Smart Repair Spezialist

Antworte NUR als JSON:
{
  "customerProfile": "Kurzes Kundenprofil",
  "objective": "Gesprächsziel",
  "openingLine": "Empfohlener Gesprächseinstieg",
  "keyArguments": ["Hauptargumente für den Verkauf"],
  "objectionHandling": [{"objection": "Möglicher Einwand", "response": "Empfohlene Antwort"}],
  "upsellOpportunities": ["Mögliche Zusatzverkäufe"],
  "closingStrategy": "Empfohlene Abschlussstrategie",
  "followUpPlan": "Nachfass-Plan"
}`;

      const userPrompt = `Erstelle eine Battlecard für folgendes Kundengespräch:
- Kundenname: ${data.customerName}
${data.customerPhone ? `- Telefon: ${data.customerPhone}` : ""}
${data.customerEmail ? `- E-Mail: ${data.customerEmail}` : ""}
${data.vehicleInfo ? `- Fahrzeug: ${data.vehicleInfo}` : ""}
${data.objective ? `- Gesprächsziel: ${data.objective}` : "- Gesprächsziel: Neukunde gewinnen"}
${data.previousInteractions ? `- Bisherige Kontakte: ${data.previousInteractions}` : ""}
${clientHistory ? `\nKundenhistorie aus CRM:${clientHistory}` : ""}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error for battlecard");
        return res.status(502).json({ message: "KI konnte die Battlecard nicht generieren" });
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(content);
        res.json({ type: "battlecard", ...parsed });
      } catch {
        res.json({ type: "battlecard", customerProfile: content, keyArguments: [], objectionHandling: [] });
      }
    } catch (error: any) {
      console.error("Meister AI battlecard error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      res.status(500).json({ message: "Fehler bei der Battlecard-Erstellung" });
    }
  });

  app.post("/api/meister-ai/sales/pipeline", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });

      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(503).json({ message: "KI-Dienst momentan nicht verfügbar" });
      }

      const isAdmin = req.user.role === "admin";
      const offers = isAdmin
        ? await storage.getAllOffers()
        : await storage.getOffersByPartner(req.user.id);

      const clients = isAdmin
        ? await storage.getAllClients()
        : await storage.getClientsByPartner(req.user.id);

      const transactions = isAdmin
        ? await storage.getAllPartnerTransactions()
        : await storage.getPartnerTransactions(req.user.id);

      const pipelineStats = {
        totalOffers: offers.length,
        draftOffers: offers.filter((o: any) => o.status === "draft").length,
        sentOffers: offers.filter((o: any) => o.status === "sent").length,
        acceptedOffers: offers.filter((o: any) => o.status === "accepted").length,
        rejectedOffers: offers.filter((o: any) => o.status === "rejected").length,
        conversionRate: offers.length > 0 ? Math.round(offers.filter((o: any) => o.status === "accepted").length / offers.length * 100) : 0,
        totalClients: clients.length,
        activeClients: clients.filter((c: any) => c.status === "active").length,
        leadClients: clients.filter((c: any) => c.status === "lead").length,
        lostClients: clients.filter((c: any) => c.status === "lost").length,
        totalRevenueCents: transactions.reduce((s: number, t: any) => s + (t.revenueCents || 0), 0),
        avgOfferValueCents: offers.length > 0 ? Math.round(offers.reduce((s: number, o: any) => s + (o.totalCents || 0), 0) / offers.length) : 0,
      };

      const systemPrompt = `Du bist der Corion Meister AI Sales-Analyst. Analysiere die Vertriebspipeline und gib konkrete, umsetzbare Empfehlungen.

Antworte NUR als JSON:
{
  "summary": "Kurze Zusammenfassung der Pipeline-Situation",
  "strengths": ["Stärken der aktuellen Pipeline"],
  "weaknesses": ["Schwächen und Risiken"],
  "recommendations": [{"priority": "hoch/mittel/niedrig", "action": "Konkrete Handlungsempfehlung", "expectedImpact": "Erwarteter Effekt"}],
  "kpis": {"conversionRate": "Bewertung", "avgDealSize": "Bewertung", "pipelineHealth": "gut/mittel/kritisch"},
  "nextSteps": ["Sofort umzusetzende nächste Schritte"]
}`;

      const userPrompt = `Analysiere diese Vertriebspipeline:

Pipeline-Statistiken:
- Angebote gesamt: ${pipelineStats.totalOffers}
  - Entwürfe: ${pipelineStats.draftOffers}
  - Versendet: ${pipelineStats.sentOffers}
  - Akzeptiert: ${pipelineStats.acceptedOffers}
  - Abgelehnt: ${pipelineStats.rejectedOffers}
- Konversionsrate: ${pipelineStats.conversionRate}%
- Durchschn. Angebotswert: ${(pipelineStats.avgOfferValueCents / 100).toLocaleString("de-DE")} €

Kundenstatistiken:
- Kunden gesamt: ${pipelineStats.totalClients}
  - Aktiv: ${pipelineStats.activeClients}
  - Leads: ${pipelineStats.leadClients}
  - Verloren: ${pipelineStats.lostClients}

Umsatz:
- Gesamtumsatz: ${(pipelineStats.totalRevenueCents / 100).toLocaleString("de-DE")} €

Gib konkrete, umsetzbare Empfehlungen für die Verbesserung der Verkaufsleistung.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error for pipeline");
        return res.status(502).json({ message: "KI konnte die Pipeline nicht analysieren" });
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(content);
        res.json({ type: "pipeline", stats: pipelineStats, ...parsed });
      } catch {
        res.json({ type: "pipeline", stats: pipelineStats, summary: content, recommendations: [] });
      }
    } catch (error) {
      console.error("Meister AI pipeline error:", error);
      res.status(500).json({ message: "Fehler bei der Pipeline-Analyse" });
    }
  });

  app.post("/api/meister-ai/auftrag-assist", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });
      const data = auftragAssistSchema.parse(req.body);
      const order = await storage.getWorkshopOrder(data.orderId);
      if (!order) return res.status(404).json({ message: "Auftrag nicht gefunden" });
      if (req.user.role === "partner" && order.partnerId !== req.user.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      const partnerLang = req.user?.preferredLanguage || "de";
      const targetLanguage = getPartnerLanguageLabel(partnerLang);
      const ai = getGemma();
      const translated = ((order as any).partnerDescriptionTranslations || {})[partnerLang] || order.damageDescription;
      const userMessage = String(data.userMessage || "").trim();
      const attachments = await storage.getFileAttachmentsByOrder(order.id);
      const imageLinks = attachments
        .filter((att: any) => att?.mimeType?.startsWith("image/"))
        .slice(0, 6)
        .map((att: any) => att?.driveLink || att?.url || att?.filename)
        .filter(Boolean);
      const fallback = {
        agent: "Meister",
        model: MEISTER_OLLAMA_MODEL,
        translatedDescription: translated,
        workAdvice: "Verifică atent zona afectată și piesele implicate înainte să începi.",
        riskNotes: ["Verifică diferențele de nuanță", "Confirmă dacă trebuie polish sau beilackieren"],
        suggestedNextStep: "Începe cu inspecția vizuală și documentarea completă.",
      };

      const prompt = `You are Meister, a practical workshop AI assistant for auto repair partners.
Always answer SHORT in Romanian.
Stay strictly focused on this single repair order.
Use the damage description and image references to reason about the case.
Respond only as JSON.
Return JSON with keys: translatedDescription, workAdvice, riskNotes, suggestedNextStep, replyMessage.
For translatedDescription, always translate the repair description as a CLEAR ROMANIAN LIST.
For each damaged part, write one bullet-like line in this exact style:
- <part> — <repair type>
Examples of repair type: reparație, vopsire, polish, beilackieren, înlocuire, pregătire, verificare.
If multiple parts are mentioned, enumerate each separately.
Do not use markdown tables. Keep it brief and workshop-practical.

Vehicle: ${order.vehicleMake || ""} ${order.vehicleModel || ""} ${order.vehiclePlate ? `(${order.vehiclePlate})` : ""}
Damage description: ${order.damageDescription}
Current translated description: ${translated}
Image references:\n${imageLinks.map((link, i) => `${i + 1}. ${link}`).join("\n") || "none"}
Partner message: ${userMessage || "Analizează lucrarea și spune pe scurt ce piese necesită reparație și ce tip de reparație trebuie făcut."}`;

      try {
        const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MEISTER_OLLAMA_MODEL,
            prompt,
            stream: false,
            format: "json",
          }),
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          let parsed: any = null;
          try {
            parsed = JSON.parse(String(ollamaData?.response || "{}"));
          } catch {
            parsed = null;
          }

          if (parsed) {
            const payload = {
              agent: "Meister",
              model: MEISTER_OLLAMA_MODEL,
              translatedDescription: parsed?.translatedDescription || translated,
              workAdvice: parsed?.workAdvice || translated,
              riskNotes: Array.isArray(parsed?.riskNotes) ? parsed.riskNotes : [],
              suggestedNextStep: parsed?.suggestedNextStep || "",
              replyMessage: parsed?.replyMessage || parsed?.workAdvice || translated,
            };
            await storage.updateWorkshopOrder(order.id, {
              meisterSnapshotJson: {
                translatedDescription: payload.translatedDescription,
                workAdvice: payload.workAdvice,
                riskNotes: payload.riskNotes,
                suggestedNextStep: payload.suggestedNextStep,
                analyzedAt: new Date().toISOString(),
                model: payload.model,
              },
            } as any);
            const channel = `order:${order.id}`;
            if (userMessage) {
              await writeCoordMessage({
                channel,
                authorSlug: req.user?.email || req.user?.firstName || "partner",
                authorRole: "human",
                body: userMessage,
                relatedOrderId: order.id,
                intent: "question",
              });
            }
            await writeCoordMessage({
              channel,
              authorSlug: "meister",
              authorRole: "agent",
              body: payload.replyMessage,
              relatedOrderId: order.id,
              intent: "note",
            });
            return res.json(payload);
          }
        }
      } catch (ollamaError) {
        console.warn("Meister AI Ollama fallback to Gemini:", ollamaError);
      }

      if (!ai) {
        await storage.updateWorkshopOrder(order.id, {
          meisterSnapshotJson: {
            translatedDescription: fallback.translatedDescription,
            workAdvice: fallback.workAdvice,
            riskNotes: fallback.riskNotes,
            suggestedNextStep: fallback.suggestedNextStep,
            analyzedAt: new Date().toISOString(),
            model: fallback.model,
          },
        } as any);
        const channel = `order:${order.id}`;
        if (userMessage) {
          await writeCoordMessage({
            channel,
            authorSlug: req.user?.email || req.user?.firstName || "partner",
            authorRole: "human",
            body: userMessage,
            relatedOrderId: order.id,
            intent: "question",
          });
        }
        await writeCoordMessage({
          channel,
          authorSlug: "meister",
          authorRole: "agent",
          body: fallback.workAdvice,
          relatedOrderId: order.id,
          intent: "note",
        });
        return res.json({ ...fallback, replyMessage: fallback.workAdvice });
      }

      const result = await ai.models.generateContent({
        model: "gemma-3-27b-it",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
      });

      let parsed: any = null;
      try {
        parsed = JSON.parse(String(result.text || "{}"));
      } catch {
        parsed = null;
      }

      const payload = {
        agent: "Meister",
        model: "gemma-3-27b-it",
        translatedDescription: parsed?.translatedDescription || translated,
        workAdvice: parsed?.workAdvice || translated,
        riskNotes: Array.isArray(parsed?.riskNotes) ? parsed.riskNotes : [],
        suggestedNextStep: parsed?.suggestedNextStep || "",
        replyMessage: parsed?.replyMessage || parsed?.workAdvice || translated,
      };
      await storage.updateWorkshopOrder(order.id, {
        meisterSnapshotJson: {
          translatedDescription: payload.translatedDescription,
          workAdvice: payload.workAdvice,
          riskNotes: payload.riskNotes,
          suggestedNextStep: payload.suggestedNextStep,
          analyzedAt: new Date().toISOString(),
          model: payload.model,
        },
      } as any);
      const channel = `order:${order.id}`;
      if (userMessage) {
        await writeCoordMessage({
          channel,
          authorSlug: req.user?.email || req.user?.firstName || "partner",
          authorRole: "human",
          body: userMessage,
          relatedOrderId: order.id,
          intent: "question",
        });
      }
      await writeCoordMessage({
        channel,
        authorSlug: "meister",
        authorRole: "agent",
        body: payload.replyMessage,
        relatedOrderId: order.id,
        intent: "note",
      });
      return res.json(payload);
    } catch (error: any) {
      console.error("Meister AI auftrag-assist error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      res.status(500).json({ message: "Fehler bei der Meister-Auftragshilfe" });
    }
  });

  app.get("/api/meister-ai/commands", isAuthenticated, async (req: any, res: Response) => {
    if (!isPartnerOrAdmin(req)) return res.status(403).json({ message: "Zugriff verweigert" });

    res.json([
      {
        command: "/sales:prepare-offer",
        label: "Angebot vorbereiten",
        description: "KI erstellt ein professionelles Angebot mit Verkaufsargumenten",
        icon: "FileText",
        fields: [
          { name: "customerName", label: "Kundenname", type: "text", required: true },
          { name: "vehicleInfo", label: "Fahrzeug (Marke, Modell, Jahr)", type: "text", required: true },
          { name: "damageDescription", label: "Schadensbeschreibung", type: "textarea", required: true },
          { name: "estimatedAmount", label: "Geschätzter Betrag (€)", type: "number", required: true },
          { name: "serviceType", label: "Serviceart", type: "select", options: ["Lackierung", "Smart Repair", "Karosserie", "Gutachten", "Unfallreparatur", "Fahrzeugaufbereitung"], required: false },
          { name: "urgency", label: "Dringlichkeit", type: "select", options: ["Normal", "Hoch", "Dringend"], required: false },
        ],
      },
      {
        command: "/sales:battlecard",
        label: "Battlecard erstellen",
        description: "KI bereitet eine Gesprächsvorbereitung mit Verkaufsargumenten und Einwandbehandlung vor",
        icon: "Target",
        fields: [
          { name: "customerName", label: "Kundenname", type: "text", required: true },
          { name: "customerPhone", label: "Telefon", type: "text", required: false },
          { name: "customerEmail", label: "E-Mail", type: "text", required: false },
          { name: "vehicleInfo", label: "Fahrzeug", type: "text", required: false },
          { name: "objective", label: "Gesprächsziel", type: "select", options: ["Neukunde gewinnen", "Angebot nachfassen", "Upselling", "Reklamation lösen", "Termin vereinbaren"], required: false },
          { name: "previousInteractions", label: "Bisherige Kontakte/Notizen", type: "textarea", required: false },
        ],
      },
      {
        command: "/sales:pipeline",
        label: "Pipeline analysieren",
        description: "KI analysiert Ihre Vertriebspipeline und gibt Handlungsempfehlungen",
        icon: "TrendingUp",
        fields: [],
      },
    ]);
  });
}
