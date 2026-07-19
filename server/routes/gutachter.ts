import type { Express } from "express";
import { z } from "zod";

const gutachterContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

const unfallAssistentSchema = z.object({
  description: z.string().min(10),
});

export function registerGutachterRoutes(app: Express) {
  app.post("/api/gutachter/contact", async (req, res) => {
    try {
      const validationResult = gutachterContactSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          status: "error",
          message: "Bitte füllen Sie alle Pflichtfelder aus.",
        });
      }

      const { name, email, phone, subject, message } = validationResult.data;

      let emailSent = false;
      try {
        if (process.env.RESEND_API_KEY) {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Corion Gutachter <onboarding@resend.dev>",
              to: ["coriongmbh@gmail.com"],
              subject: `Gutachter-Anfrage: ${subject}`,
              html: `
                <h2>Neue Gutachter-Anfrage</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>E-Mail:</strong> ${email}</p>
                <p><strong>Telefon:</strong> ${phone || "Nicht angegeben"}</p>
                <p><strong>Betreff:</strong> ${subject}</p>
                <p><strong>Nachricht:</strong></p>
                <p>${message.replace(/\n/g, "<br>")}</p>
              `,
            }),
          });
          emailSent = response.ok;
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
      }

      console.log(`Gutachter contact: ${name} (${email}) - ${subject}`);

      res.json({
        status: "success",
        message: "Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
        emailSent,
      });
    } catch (error) {
      console.error("Gutachter contact error:", error);
      res.status(500).json({
        status: "error",
        message: "Fehler beim Senden der Anfrage.",
      });
    }
  });

  app.post("/api/gutachter/unfall-assistent", async (req, res) => {
    try {
      const validationResult = unfallAssistentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          status: "error",
          message: "Bitte beschreiben Sie Ihren Unfall (mindestens 10 Zeichen).",
        });
      }

      const { description } = validationResult.data;
      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.json({
          result: getFallbackChecklist(description),
        });
      }

      const systemPrompt = `Du bist ein KI-Assistent für Corion Gutachter, ein Kfz-Sachverständigenbüro im Rhein-Main-Gebiet.

Der Nutzer beschreibt einen Unfall. Erstelle eine klare, strukturierte Checkliste mit Handlungsempfehlungen.

Antwort-Format (auf Deutsch):
1. Sofortmaßnahmen nach dem Unfall
2. Dokumentation & Beweissicherung
3. Versicherung & rechtliche Schritte
4. Gutachten & nächste Schritte
5. Empfehlung von Corion Gutachter

Wichtig:
- Antworte sachlich und professionell auf Deutsch
- Erwähne am Ende, dass Corion Gutachter kostenlose Erstberatung anbietet
- Telefon: +49 176 83458274
- Hinweis: Dies ist eine allgemeine Orientierung, keine Rechtsberatung
- Formatiere mit klaren Überschriften und Aufzählungspunkten`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Unfallbeschreibung: ${description}` },
      ];

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (!openaiResponse.ok) {
        console.error("OpenAI API error for Unfall-Assistent");
        return res.json({ result: getFallbackChecklist(description) });
      }

      const data = await openaiResponse.json();
      const result = data.choices?.[0]?.message?.content || getFallbackChecklist(description);

      res.json({ result });
    } catch (error) {
      console.error("Unfall-Assistent error:", error);
      res.status(500).json({
        status: "error",
        message: "Fehler bei der Analyse.",
      });
    }
  });
}

function getFallbackChecklist(description: string): string {
  return `Allgemeine Checkliste nach Ihrem Unfall:

1. SOFORTMASSNAHMEN
- Unfallstelle sichern (Warndreieck, Warnblinkanlage)
- Erste Hilfe leisten, wenn nötig
- Bei Personenschäden: Polizei und Rettungsdienst rufen (110/112)
- Bei reinen Sachschäden: Polizei ist optional, aber empfehlenswert

2. DOKUMENTATION & BEWEISSICHERUNG
- Fotos von allen Schäden an beiden Fahrzeugen machen
- Unfallstelle aus verschiedenen Winkeln fotografieren
- Kennzeichen aller beteiligten Fahrzeuge notieren
- Daten des Unfallgegners aufnehmen (Name, Anschrift, Versicherung, Versicherungsnummer)
- Zeugen ansprechen und Kontaktdaten notieren
- Europäischen Unfallbericht ausfüllen (falls vorhanden)

3. VERSICHERUNG & RECHTLICHE SCHRITTE
- Eigene Kfz-Versicherung informieren
- Gegnerische Haftpflichtversicherung kontaktieren
- Wichtig: Kein Schuldeingeständnis am Unfallort abgeben
- Bei unklarer Schuldfrage: Anwalt für Verkehrsrecht konsultieren

4. GUTACHTEN & NÄCHSTE SCHRITTE
- Bei unverschuldetem Unfall: Sie haben das Recht auf einen unabhängigen Gutachter Ihrer Wahl
- Die Kosten trägt die gegnerische Versicherung
- Lassen Sie sich keinen Gutachter der Gegenseite aufdrängen
- Ein Gutachten sichert Ihre Ansprüche (Reparaturkosten, Wertminderung, Nutzungsausfall)

5. EMPFEHLUNG VON CORION GUTACHTER
- Kostenlose Erstberatung verfügbar
- Schnelle Terminvergabe innerhalb 24 Stunden
- Erfahrene Kfz-Sachverständige im Rhein-Main-Gebiet
- Kontakt: +49 176 83458274 oder info@corion-gutachter.de

Hinweis: Diese Checkliste dient als allgemeine Orientierung und stellt keine Rechtsberatung dar.
Für eine professionelle Begutachtung Ihres Schadens kontaktieren Sie uns gerne.`;
}
