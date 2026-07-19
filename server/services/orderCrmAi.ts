// AI Case Assistant — generates a Salesforce-style summary for a workshop order.
// Uses gpt-4o-mini when an API key is available; falls back to a deterministic
// heuristic so the panel still works in dev/offline environments.

import type {
  WorkshopOrder, FileAttachment, OrderCrmLink, OrderFollowUp, OrderTimelineEvent,
} from "@shared/schema";

export type CrmInsightDraft = {
  summary: string;
  nextAction: string;
  urgency: "low" | "normal" | "high" | "urgent";
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  closeProbability: number;
  riskFlags: string[];
  missingInfo: string[];
  extra?: Record<string, unknown>;
  source: "ai" | "heuristic";
};

const OPENAI_KEY = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

function eur(c: number | null | undefined) {
  return ((c ?? 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function buildContext(input: {
  order: WorkshopOrder;
  files: Pick<FileAttachment, "originalName" | "mimeType" | "createdAt">[];
  links: OrderCrmLink[];
  followUps: OrderFollowUp[];
  events: OrderTimelineEvent[];
}) {
  const { order, files, links, followUps, events } = input;
  const photos = files.filter((f) => /image\//.test(f.mimeType ?? "")).length;
  const docs = files.filter((f) => !/image\//.test(f.mimeType ?? "")).length;
  const openFollowUps = followUps.filter((f) => f.status === "open").length;
  return {
    order: {
      ref: order.referenceNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      vehicle: `${order.vehicleMake ?? ""} ${order.vehicleModel ?? ""} ${order.vehiclePlate ?? ""}`.trim(),
      customer: order.customerName,
      damage: order.damageDescription,
      total: eur(order.totalAmountCents),
      scheduledDate: order.scheduledDate,
      createdAt: order.createdAt,
    },
    counts: { photos, docs, links: links.length, openFollowUps, events: events.length },
    linkKinds: links.map((l) => l.kind),
    recentEvents: events.slice(0, 8).map((e) => ({ kind: e.kind, title: e.title, at: e.createdAt })),
  };
}

function heuristicDraft(input: Parameters<typeof buildContext>[0]): CrmInsightDraft {
  const { order, files, links, followUps } = input;
  const photos = files.filter((f) => /image\//.test(f.mimeType ?? "")).length;
  const missing: string[] = [];
  if (!order.customerEmail) missing.push("Kunden-E-Mail fehlt");
  if (!order.customerPhone) missing.push("Telefonnummer fehlt");
  if (!order.vehicleVin) missing.push("FIN/VIN fehlt");
  if (photos === 0) missing.push("Keine Schadensfotos vorhanden");
  if (!links.find((l) => l.kind === "insurance")) missing.push("Kein Versicherungs-Link hinterlegt");

  const flags: string[] = [];
  const overdue = followUps.find((f) => f.status === "open" && new Date(f.dueAt) < new Date());
  if (overdue) flags.push(`Follow-Up überfällig: ${overdue.message}`);
  if (order.paymentStatus !== "bezahlt" && order.status === "completed") flags.push("Auftrag abgeschlossen, aber unbezahlt");

  const urgency: CrmInsightDraft["urgency"] = overdue ? "high" : order.status === "open" ? "normal" : "low";
  const closeProb = order.status === "completed" ? 95 : order.status === "in_bearbeitung" ? 70 : photos > 0 ? 45 : 25;

  let next = "Kunden kontaktieren und nächsten Schritt klären";
  if (missing.length) next = `Fehlende Daten ergänzen: ${missing[0]}`;
  else if (order.status === "open") next = "Termin bestätigen und Annahme einplanen";
  else if (order.status === "in_bearbeitung") next = "Reparatur-Fortschritt prüfen, Kunde informieren";
  else if (order.status === "fertig") next = "Rückgabe-Termin vereinbaren";
  else if (order.status === "completed" && order.paymentStatus !== "bezahlt") next = "Zahlung anstoßen / mahnen";

  return {
    summary: `Auftrag ${order.referenceNumber ?? order.id.slice(0, 8)} (${order.vehicleMake ?? ""} ${order.vehicleModel ?? ""}) für ${order.customerName}. Status: ${order.status}. ${photos} Fotos, ${links.length} CRM-Links, ${followUps.filter((f) => f.status === "open").length} offene Follow-Ups.`,
    nextAction: next,
    urgency,
    sentiment: "unknown",
    closeProbability: closeProb,
    riskFlags: flags,
    missingInfo: missing,
    extra: { repairProbability: closeProb, insuranceLinked: links.some((l) => l.kind === "insurance") },
    source: "heuristic",
  };
}

export async function generateOrderCrmInsight(input: Parameters<typeof buildContext>[0]): Promise<CrmInsightDraft> {
  const fallback = heuristicDraft(input);
  if (!OPENAI_KEY) return fallback;

  const ctx = buildContext(input);
  const systemPrompt = `Du bist der CORION Case-Assistant — ein Salesforce-style CRM Analyst für Karosserie-/Lackschaden-Aufträge.
Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Schema:
{ "summary": string, "nextAction": string, "urgency": "low|normal|high|urgent",
  "sentiment": "positive|neutral|negative|unknown", "closeProbability": number (0-100),
  "riskFlags": string[], "missingInfo": string[],
  "extra": { "insuranceSituation": string, "repairProbability": number } }
Sprache: Deutsch. Knapp, faktisch, ohne Floskeln.`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Kontext für Case-Analyse:\n\n${JSON.stringify(ctx, null, 2)}` },
        ],
      }),
    });
    if (!r.ok) {
      console.warn("[orderCrmAi] openai non-ok", r.status, await r.text().catch(() => ""));
      return fallback;
    }
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    return {
      summary: String(parsed.summary ?? fallback.summary),
      nextAction: String(parsed.nextAction ?? fallback.nextAction),
      urgency: ["low", "normal", "high", "urgent"].includes(parsed.urgency) ? parsed.urgency : fallback.urgency,
      sentiment: ["positive", "neutral", "negative", "unknown"].includes(parsed.sentiment) ? parsed.sentiment : "unknown",
      closeProbability: typeof parsed.closeProbability === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.closeProbability)))
        : fallback.closeProbability,
      riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.map(String).slice(0, 10) : fallback.riskFlags,
      missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo.map(String).slice(0, 10) : fallback.missingInfo,
      extra: typeof parsed.extra === "object" && parsed.extra ? parsed.extra : fallback.extra,
      source: "ai",
    };
  } catch (e) {
    console.warn("[orderCrmAi] openai call failed, using heuristic", (e as any)?.message);
    return fallback;
  }
}
