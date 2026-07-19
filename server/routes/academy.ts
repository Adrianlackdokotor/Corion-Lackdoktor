import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { academyResources, insertAcademyResourceSchema } from "@shared/schema";
import { db } from "../../db/index";
import { eq, ilike, or, desc, asc } from "drizzle-orm";

const askSchema = z.object({
  question: z.string().min(5),
});

export function registerAcademyRoutes(app: Express) {
  app.get("/api/academy/resources", async (req, res) => {
    try {
      const { category, type, search } = req.query;

      let query = db.select().from(academyResources);

      const conditions: any[] = [];
      if (category && category !== "all") {
        conditions.push(eq(academyResources.category, category as string));
      }
      if (type && type !== "all") {
        conditions.push(eq(academyResources.type, type as string));
      }

      let results;
      if (search) {
        const searchTerm = `%${search}%`;
        if (conditions.length > 0) {
          results = await db
            .select()
            .from(academyResources)
            .where(
              or(
                ilike(academyResources.title, searchTerm),
                ilike(academyResources.description, searchTerm)
              )
            )
            .orderBy(desc(academyResources.isFeatured), asc(academyResources.sortOrder));
        } else {
          results = await db
            .select()
            .from(academyResources)
            .where(
              or(
                ilike(academyResources.title, searchTerm),
                ilike(academyResources.description, searchTerm)
              )
            )
            .orderBy(desc(academyResources.isFeatured), asc(academyResources.sortOrder));
        }
      } else if (conditions.length === 1) {
        results = await db
          .select()
          .from(academyResources)
          .where(conditions[0])
          .orderBy(desc(academyResources.isFeatured), asc(academyResources.sortOrder));
      } else if (conditions.length === 2) {
        results = await db
          .select()
          .from(academyResources)
          .where(or(...conditions) as any)
          .orderBy(desc(academyResources.isFeatured), asc(academyResources.sortOrder));
      } else {
        results = await db
          .select()
          .from(academyResources)
          .orderBy(desc(academyResources.isFeatured), asc(academyResources.sortOrder));
      }

      res.json(results);
    } catch (error) {
      console.error("Academy resources fetch error:", error);
      res.status(500).json({ message: "Fehler beim Laden der Ressourcen" });
    }
  });

  app.post("/api/academy/resources", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nur Administratoren können Ressourcen erstellen" });
      }

      const data = insertAcademyResourceSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });

      const [resource] = await db.insert(academyResources).values(data).returning();
      res.json(resource);
    } catch (error) {
      console.error("Academy resource create error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Ressource" });
    }
  });

  app.delete("/api/academy/resources/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nur Administratoren können Ressourcen löschen" });
      }

      await db.delete(academyResources).where(eq(academyResources.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Academy resource delete error:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Ressource" });
    }
  });

  app.post("/api/academy/ask", async (req, res) => {
    try {
      const { question } = askSchema.parse(req.body);

      const allResources = await db
        .select()
        .from(academyResources)
        .orderBy(desc(academyResources.isFeatured));

      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.json({
          answer: "Der KI-Assistent ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.",
          sources: [],
        });
      }

      const resourceContext = allResources
        .map((r, i) => `[${i + 1}] ${r.type.toUpperCase()}: "${r.title}" (Kategorie: ${r.category})${r.description ? ` - ${r.description}` : ""}${r.duration ? ` | Dauer: ${r.duration}` : ""}`)
        .join("\n");

      const systemPrompt = `Du bist der Corion Academy KI-Tutor, ein Experte für Fahrzeuglackierung, Smart Repair, Karosseriearbeiten und Gutachten.

Verfügbare Kurse und Ressourcen in unserer Bibliothek:
${resourceContext || "Noch keine Ressourcen in der Bibliothek."}

Deine Aufgaben:
- Beantworte Fragen zu Lackiertechniken, Smart Repair, Karosserie, Gutachten und Fahrzeugaufbereitung
- Verweise auf passende Kurse/Ressourcen aus der Bibliothek, wenn relevant
- Gib praxisnahe, professionelle Tipps
- Antworte immer auf Deutsch
- Sei freundlich und ermutigend

Format deiner Antwort als JSON:
{
  "answer": "Deine ausführliche Antwort...",
  "sources": [{"title": "Kurstitel", "type": "video/audio/pdf", "relevance": "Warum relevant"}]
}`;

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          temperature: 0.6,
          max_tokens: 800,
        }),
      });

      if (!openaiResponse.ok) {
        console.error("OpenAI API error for Academy ask");
        return res.json({
          answer: "Der KI-Assistent konnte Ihre Frage leider nicht verarbeiten. Bitte versuchen Sie es erneut.",
          sources: [],
        });
      }

      const data = await openaiResponse.json();
      const content = data.choices?.[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(content);
        res.json({
          answer: parsed.answer || content,
          sources: parsed.sources || [],
        });
      } catch {
        res.json({
          answer: content,
          sources: [],
        });
      }
    } catch (error) {
      console.error("Academy ask error:", error);
      res.status(500).json({ message: "Fehler bei der KI-Analyse" });
    }
  });
}
