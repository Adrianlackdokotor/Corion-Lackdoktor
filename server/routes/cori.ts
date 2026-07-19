// CORI — Corion OS AI Copilot backend.
// /api/cori/snapshot  — live operational context (counts + next appointment)
// /api/cori/chat      — Gemini-grounded question/answer over snapshot context

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { buildLanguageInstruction } from "../lib/agentLanguage";
import { storage } from "../storage";
import { buildAgentSystemPrompt } from "../ai-skills/agent-constitution";
import { recordAgentUsage } from "../services/agentUsage";

async function isAdminOrPartner(req: Request): Promise<{ ok: boolean; role: string | null; userId: string | null }> {
  const u = (req as any).user;
  const id = u?.id ?? u?.claims?.sub ?? null;
  if (!id) return { ok: false, role: null, userId: null };
  const full = await storage.getUser(id).catch(() => null);
  const role = full?.role ?? null;
  return { ok: role === "admin" || role === "partner", role, userId: id };
}

async function safeCount(query: any): Promise<number> {
  try {
    const r: any = await db.execute(query);
    const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
    return parseInt(String(rows[0]?.cnt ?? rows[0]?.count ?? "0"), 10) || 0;
  } catch {
    return 0;
  }
}

export function registerCoriRoutes(app: Express) {
  // Live snapshot — counts that give CORI grounded context.
  app.get("/api/cori/snapshot", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });
    try {
      const [active, todayCount, awaitingPickup, unpaidFinished, missingPartner, openTasks] =
        await Promise.all([
          safeCount(
            sql`SELECT COUNT(*) as cnt FROM workshop_orders WHERE status IN ('open','angenommen','in_bearbeitung')`,
          ),
          safeCount(
            sql`SELECT COUNT(*) as cnt FROM workshop_orders WHERE scheduled_date::date = CURRENT_DATE AND status NOT IN ('cancelled')`,
          ),
          safeCount(
            sql`SELECT COUNT(*) as cnt FROM workshop_orders WHERE status = 'fertig'`,
          ),
          safeCount(
            sql`SELECT COUNT(*) as cnt FROM workshop_orders WHERE status IN ('fertig','completed') AND COALESCE(payment_status,'offen') NOT IN ('bezahlt','paid')`,
          ),
          safeCount(
            sql`SELECT COUNT(*) as cnt FROM workshop_orders WHERE status IN ('open','angenommen','in_bearbeitung') AND partner_id IS NULL`,
          ),
          safeCount(
            sql`SELECT COUNT(*) as cnt FROM task_board_tasks WHERE column IN ('todo','in_progress')`,
          ),
        ]);

      let nextScheduled: any = null;
      try {
        const r: any = await db.execute(sql`
          SELECT customer_name  AS "customerName",
                 vehicle_plate  AS "vehiclePlate",
                 scheduled_date AS "scheduledDate",
                 status
          FROM workshop_orders
          WHERE scheduled_date > NOW()
            AND status NOT IN ('cancelled','completed')
          ORDER BY scheduled_date ASC
          LIMIT 1
        `);
        const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
        if (rows[0]) nextScheduled = rows[0];
      } catch {
        // non-fatal
      }

      res.json({ active, todayCount, awaitingPickup, unpaidFinished, missingPartner, openTasks, nextScheduled });
    } catch (err: any) {
      console.error("[cori/snapshot]", err?.message);
      res.status(500).json({ message: "Snapshot-Fehler", error: err?.message });
    }
  });

  // Gemini-grounded CORI chat.
  app.post("/api/cori/chat", isAuthenticated, async (req: Request, res: Response) => {
    const auth = await isAdminOrPartner(req);
    if (!auth.ok) return res.status(403).json({ message: "Nur für Admin/Partner" });

    const { question, snapshot } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: "Frage fehlt" });

    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (key) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const langInstruction = buildLanguageInstruction(question, "de");

        const snapshotText = snapshot
          ? `\nAktuelle Live-Daten aus Corion OS (Stand jetzt):\n` +
            `- Aktive Aufträge (in Arbeit): ${snapshot.active}\n` +
            `- Aufträge heute terminiert: ${snapshot.todayCount}\n` +
            `- Rückgabebereit (fertig, wartet auf Abholung): ${snapshot.awaitingPickup}\n` +
            `- Unbezahlte abgeschlossene Aufträge: ${snapshot.unpaidFinished}\n` +
            `- Aufträge ohne Partnerzuweisung: ${snapshot.missingPartner}\n` +
            `- Offene Tasks im Task Board: ${snapshot.openTasks}\n` +
            (snapshot.nextScheduled
              ? `- Nächster Termin: ${snapshot.nextScheduled.customerName}, KFZ ${snapshot.nextScheduled.vehiclePlate ?? "—"}, ` +
                `${new Date(snapshot.nextScheduled.scheduledDate).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}\n`
              : `- Kein weiterer Termin in der DB gefunden\n`)
          : "Keine Live-Daten übergeben.";

        const systemPrompt =
          buildAgentSystemPrompt(auth.role === "admin" ? "ADMIN_CORA" : "FRONT_DESK") +
          `\n\nDu bist CORI, der intelligente lokale Copilot der Corion OS Plattform (Corion Lackdoktor).` +
          ` Du kennst die App-Struktur, Workflows und Live-Betriebsdaten.` +
          ` Antworte präzise, hilfreich und ohne unnötige Wiederholungen.` +
          ` Nenne konkrete Routen wenn die Frage nach Navigation fragt.\n\n` +
          `Wichtige App-Routen:\n` +
          `- /admin           → Hauptauftragsboard, Pipeline\n` +
          `- /admin/calendar  → Terminplanung\n` +
          `- /tasks           → Task Board\n` +
          `- /admin/agent-tasks → Agent Delegation\n` +
          `- /admin/agents    → Agent Activity Feed\n` +
          `- /partner/dashboard → Partner Shell\n` +
          `- /finanzen        → Finance OS (KPI, Cashflow, Attention)\n` +
          `- /finanzen/detail → Legacy Finance Detail\n` +
          `- /admin/partner-payouts → Partnervergütungen\n` +
          `- /cfo-inbox       → CFO Eingangsrechnungen\n` +
          `- /workshop        → Corion OS (diese Seite)\n\n` +
          snapshotText +
          `\n${langInstruction}`;

        const resp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: question }] }],
          config: { systemInstruction: systemPrompt, temperature: 0.3 },
        });

        const answer = resp.text?.trim() ?? "Keine Antwort erhalten.";

        const KNOWN_ROUTES = [
          "/admin/partner-payouts",
          "/admin/calendar",
          "/admin/agent-tasks",
          "/admin/agents",
          "/admin",
          "/tasks",
          "/finanzen/detail",
          "/finanzen",
          "/cfo-inbox",
          "/partner/dashboard",
        ];
        const surface = KNOWN_ROUTES.find((r) => answer.includes(r)) ?? null;

        recordAgentUsage({
          agentSlug: auth.role === "admin" ? "admin-cora" : "partner-cori",
          agentKey: auth.role === "admin" ? "ADMIN_CORA" : "FRONT_DESK",
          ownerUserId: auth.userId,
          beneficiaryUserId: auth.userId,
          surface: "app",
          operation: "grounded_chat",
          units: 1,
          model: "gemini-2.5-flash",
          provider: "google",
          billable: false,
          debitCredits: false,
        }).catch(() => {});
        return res.json({ answer, surface, suggestions: buildSuggestions(snapshot), source: "gemini" });
      } catch (err: any) {
        console.warn("[cori/chat] gemini failed, using heuristic:", err?.message);
      }
    }

    const answer = buildHeuristicAnswer(question, snapshot);
    res.json({ answer, surface: null, suggestions: buildSuggestions(snapshot), source: "heuristic" });
  });
}

function buildSuggestions(snapshot: any): string[] {
  const s: string[] = [];
  if ((snapshot?.unpaidFinished ?? 0) > 0)
    s.push(`${snapshot.unpaidFinished} unbezahlte Aufträge — was tun?`);
  if ((snapshot?.awaitingPickup ?? 0) > 0)
    s.push(`${snapshot.awaitingPickup} Aufträge bereit zur Abholung`);
  if ((snapshot?.missingPartner ?? 0) > 0)
    s.push(`${snapshot.missingPartner} Aufträge ohne Partner`);
  s.push("Was braucht heute meine Aufmerksamkeit?");
  if (s.length < 4) s.push("Wo finde ich Finance OS?");
  return s.slice(0, 4);
}

function buildHeuristicAnswer(question: string, snapshot: any): string {
  const lower = question.toLowerCase();
  if (
    lower.includes("aufmerksamkeit") ||
    lower.includes("heute") ||
    lower.includes("attention") ||
    lower.includes("was fehlt") ||
    lower.includes("dringend")
  ) {
    const items: string[] = [];
    if ((snapshot?.unpaidFinished ?? 0) > 0)
      items.push(`${snapshot.unpaidFinished} abgeschlossene Aufträge unbezahlt → /admin`);
    if ((snapshot?.awaitingPickup ?? 0) > 0)
      items.push(`${snapshot.awaitingPickup} Aufträge bereit zur Abholung → Status prüfen`);
    if ((snapshot?.missingPartner ?? 0) > 0)
      items.push(`${snapshot.missingPartner} Aufträge ohne Partnerzuweisung → /admin`);
    if (items.length === 0) return "Alles im Griff – keine dringenden Punkte gefunden.";
    return "Heute zu beachten:\n" + items.map((i) => "· " + i).join("\n");
  }
  if (lower.includes("auftrag") || lower.includes("order")) {
    return `Aktive Aufträge: ${snapshot?.active ?? "?"}, heute terminiert: ${snapshot?.todayCount ?? "?"}. Alle Aufträge findest du in /admin.`;
  }
  if (lower.includes("finance") || lower.includes("finanzen") || lower.includes("geld")) {
    return "Finance OS findest du unter /finanzen. KPI-Übersicht, Cashflow-Trend und Attention Signals sind dort live.";
  }
  if (lower.includes("task") || lower.includes("aufgabe")) {
    return `Offene Tasks: ${snapshot?.openTasks ?? "?"}. Task Board ist unter /tasks.`;
  }
  if (lower.includes("partner") || lower.includes("payout") || lower.includes("auszahl")) {
    return "Für Partnervergütungen: /admin/partner-payouts. Dort kannst du fehlende Payout-Beträge direkt erfassen.";
  }
  if (lower.includes("agent") || lower.includes("deleg")) {
    return "Agent-Delegation: /admin/agent-tasks. Activity Feed: /admin/agents.";
  }
  return "Ich bin CORI, dein Corion OS Copilot. Frag mich nach Aufträgen, Terminen, Finance oder Navigation – ich kenne die aktuellen Live-Daten.";
}
