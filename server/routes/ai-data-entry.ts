import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { isAuthenticated } from "../auth";
import { sendEmail } from "../lib/resend";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export function registerAIDataEntryRoutes(app: Express) {

  app.post("/api/ai/extract-partner-data", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      const { text, imageBase64 } = req.body;
      if (!text && !imageBase64) {
        return res.status(400).json({ message: "Text oder Bild erforderlich" });
      }

      const contents: any[] = [];

      if (imageBase64) {
        contents.push({
          role: "user",
          parts: [
            {
              text: `Analysiere dieses Dokument (Visitenkarte, Rechnung, Vertrag, etc.) und extrahiere die folgenden Partnerdaten im JSON-Format. Gib NUR ein valides JSON-Objekt zurück, ohne Markdown-Formatierung oder Code-Blöcke.

Erwartetes Format:
{
  "firstName": "Vorname",
  "lastName": "Nachname",
  "email": "email@example.com",
  "phone": "Telefonnummer",
  "company": "Firmenname",
  "address": "Straße und Hausnummer",
  "city": "Stadt",
  "postalCode": "PLZ",
  "taxNumber": "Steuernummer oder USt-IdNr",
  "partnerSharePercent": null
}

Felder die nicht gefunden werden als null setzen.`,
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        });
      } else {
        contents.push({
          role: "user",
          parts: [
            {
              text: `Analysiere den folgenden Text und extrahiere Partnerdaten im JSON-Format. Gib NUR ein valides JSON-Objekt zurück, ohne Markdown-Formatierung oder Code-Blöcke.

Text: "${text}"

Erwartetes Format:
{
  "firstName": "Vorname",
  "lastName": "Nachname",
  "email": "email@example.com",
  "phone": "Telefonnummer",
  "company": "Firmenname",
  "address": "Straße und Hausnummer",
  "city": "Stadt",
  "postalCode": "PLZ",
  "taxNumber": "Steuernummer oder USt-IdNr",
  "partnerSharePercent": null
}

Felder die nicht gefunden werden als null setzen.`,
            },
          ],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { maxOutputTokens: 2048 },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        res.json({ success: true, data: parsed });
      } catch {
        res.json({ success: false, rawText: responseText, message: "KI-Antwort konnte nicht als JSON geparst werden" });
      }
    } catch (error) {
      console.error("AI partner data extraction error:", error);
      res.status(500).json({ message: "KI-Extraktion fehlgeschlagen" });
    }
  });

  app.post("/api/ai/extract-order-data", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "partner") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      const { text, imageBase64 } = req.body;
      if (!text && !imageBase64) {
        return res.status(400).json({ message: "Text oder Bild erforderlich" });
      }

      const contents: any[] = [];

      const prompt = `Analysiere ${imageBase64 ? "dieses Dokument/Bild" : "den folgenden Text"} und extrahiere Werkstattauftragsdaten im JSON-Format. Gib NUR ein valides JSON-Objekt zurück, ohne Markdown-Formatierung oder Code-Blöcke.

${!imageBase64 ? `Text: "${text}"` : ""}

Erwartetes Format:
{
  "customerName": "Kundenname",
  "customerAddress": "Adresse",
  "customerPhone": "Telefon",
  "customerEmail": "E-Mail",
  "vehicleMake": "Fahrzeugmarke (z.B. BMW, Mercedes)",
  "vehicleModel": "Fahrzeugmodell",
  "vehiclePlate": "Kennzeichen",
  "vehicleVin": "Fahrgestellnummer/FIN",
  "vehicleColor": "Fahrzeugfarbe",
  "vehicleMileage": "Kilometerstand",
  "damageDescription": "Schadensbeschreibung",
  "totalAmountCents": null
}

Felder die nicht gefunden werden als null setzen. Betrag in Cent wenn gefunden (z.B. 1500.00 EUR = 150000).`;

      if (imageBase64) {
        contents.push({
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        });
      } else {
        contents.push({
          role: "user",
          parts: [{ text: prompt }],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { maxOutputTokens: 2048 },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        res.json({ success: true, data: parsed });
      } catch {
        res.json({ success: false, rawText: responseText, message: "KI-Antwort konnte nicht als JSON geparst werden" });
      }
    } catch (error) {
      console.error("AI order data extraction error:", error);
      res.status(500).json({ message: "KI-Extraktion fehlgeschlagen" });
    }
  });

  app.post("/api/ai/smart-fill", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "partner") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      const { freeText, context } = req.body;
      if (!freeText) {
        return res.status(400).json({ message: "Text erforderlich" });
      }

      const contextStr = context || "partner";
      const isPartner = contextStr === "partner";

      const prompt = `Du bist ein Datenassistent für eine Kfz-Werkstatt (Corion Lackdoktor). 
Der Benutzer gibt Freitext ein und du extrahierst strukturierte Daten daraus.
Gib NUR ein valides JSON-Objekt zurück, ohne Markdown-Formatierung oder Code-Blöcke.

Freitext: "${freeText}"

${isPartner ? `Erwartetes Format (Partnerdaten):
{
  "firstName": "Vorname",
  "lastName": "Nachname",
  "email": "E-Mail",
  "phone": "Telefon",
  "company": "Firma",
  "address": "Straße",
  "city": "Stadt",
  "postalCode": "PLZ",
  "taxNumber": "Steuernummer",
  "partnerSharePercent": null
}` : `Erwartetes Format (Auftragsdaten):
{
  "customerName": "Kundenname",
  "customerPhone": "Telefon",
  "customerEmail": "E-Mail",
  "vehicleMake": "Marke",
  "vehicleModel": "Modell",
  "vehiclePlate": "Kennzeichen",
  "vehicleVin": "FIN",
  "vehicleColor": "Farbe",
  "damageDescription": "Schadensbeschreibung",
  "totalAmountCents": null
}`}

Felder die nicht gefunden werden als null setzen.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        res.json({ success: true, data: parsed });
      } catch {
        res.json({ success: false, rawText: responseText, message: "KI-Antwort konnte nicht als JSON geparst werden" });
      }
    } catch (error) {
      console.error("AI smart-fill error:", error);
      res.status(500).json({ message: "KI Smart-Fill fehlgeschlagen" });
    }
  });

  // ── KFZ / Fahrzeugschein OCR ────────────────────────────────────────────
  app.post("/api/ai/extract-vehicle-registration", async (req: any, res: Response) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) return res.status(400).json({ message: "Bild erforderlich" });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: (mimeType as string) || "image/jpeg",
                },
              },
              {
                text: `Analysiere diesen Kfz-Schein oder Fahrzeugausweis (Zulassungsbescheinigung Teil I oder II, oder ausländisches Äquivalent) und extrahiere die Fahrzeugdaten.
Gib NUR ein valides JSON-Objekt zurück, ohne Markdown-Formatierung oder Code-Blöcke:

{
  "vehicleMake": "Fahrzeughersteller/Marke (z.B. BMW, Volkswagen, Mercedes-Benz)",
  "vehicleModel": "Modell/Typ (z.B. 320i, Golf 7, C220d)",
  "vehiclePlate": "Amtliches Kennzeichen (z.B. MTK-AB 1234)",
  "vehicleVin": "Fahrgestellnummer/FIN (17 Zeichen)",
  "vehicleColor": "Farbe (z.B. Schwarz, Silber, Weiß)",
  "vehicleYear": "Erstzulassungsjahr oder Baujahr",
  "vehicleMileage": null,
  "customerName": "Name des Halters/Eigentümers (Vor- und Nachname)",
  "customerAddress": "Vollständige Adresse des Halters"
}

Felder die nicht erkennbar sind als null setzen.`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 1024 },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        res.json({ success: true, data: parsed });
      } catch {
        res.json({ success: false, rawText: responseText, message: "KI konnte Fahrzeugdaten nicht extrahieren" });
      }
    } catch (error) {
      console.error("Vehicle registration OCR error:", error);
      res.status(500).json({ message: "KI-Extraktion fehlgeschlagen" });
    }
  });

  // ── Send repair order via Email ─────────────────────────────────────────
  app.post("/api/repair-order/send-email", async (req: any, res: Response) => {
    try {
      const { to, subject, htmlContent, mode } = req.body;
      if (!to || !htmlContent) return res.status(400).json({ message: "Empfänger und Inhalt erforderlich" });

      await sendEmail({
        to,
        subject: subject || `Reparaturauftrag – Corion Lackdoktor`,
        html: htmlContent,
        text: `Reparaturauftrag von Corion Lackdoktor. Bitte öffnen Sie diese E-Mail in einem HTML-fähigen E-Mail-Client.`,
        cc: mode === "client" ? "adrianlackdoktor@gmail.com" : undefined,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Send repair order email error:", error);
      res.status(500).json({ message: "E-Mail konnte nicht gesendet werden" });
    }
  });
}
