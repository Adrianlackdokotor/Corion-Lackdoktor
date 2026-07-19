import { z } from "zod";
import { storage } from "../storage";
import { createTask } from "./opsActions";
import { logAudit } from "./auditLog";
import { gatherAdminCoriInsights } from './adminCoraInsights';

export const adminCoraRequestSchema = z.object({
  message: z.string().trim().min(2).max(4000),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(4000),
  })).max(12).optional(),
});

type AdminActor = {
  id: string;
  email?: string | null;
  ip?: string | null;
};

export type AdminCoraResult = {
  reply: string;
  intent: string;
  status: "completed" | "found" | "needs_input" | "confirmation_required" | "unsupported";
  action?: "navigate" | "created" | "show_results";
  actionData?: Record<string, unknown>;
  suggestions?: string[];
};

type ParsedIntent =
  | { kind: "create_task"; title: string }
  | { kind: "create_qa_task"; title: string }
  | { kind: "search"; query: string; openBest: boolean }
  | { kind: "navigate"; route: string; label: string }
  | { kind: "protected_mutation"; capability: string }
  | { kind: "identity_mission" }
  | { kind: "executive_snapshot" }
  | { kind: "optimization_feedback" }
  | { kind: "unknown" };

type ResponseLanguage = 'ro' | 'de' | 'en';

const NAVIGATION: Array<{ pattern: RegExp; route: string; label: string }> = [
  { pattern: /\b(calendar|kalender|calendarul|terminplan)\b/i, route: "/admin/calendar", label: "Kalender" },
  { pattern: /\b(task board|taskuri|aufgaben|tasks)\b/i, route: "/tasks", label: "Task Board" },
  { pattern: /\b(partner(?:i|s)?|parteneri)\b/i, route: "/admin/partners", label: "Partner" },
  { pattern: /\b(finance|finanzen|finanțe|facturi|rechnungen)\b/i, route: "/finanzen", label: "Finanzen" },
  { pattern: /\b(aufträge|auftraege|orders|comenzi|workshop)\b/i, route: "/workshop", label: "Aufträge" },
];

const SEARCH_MARKER = /\b(search|find|look up|caută|cauta|găsește|gaseste|zeige|suche|finde|öffne|oeffne|open|deschide)\b/i;
const ENTITY_MARKER = /\b(client|customer|kunde|kundin|vehicul|vehicle|fahrzeug|mașin[ăa]|masin[ăa]|auftrag|order|comand[ăa])\b/i;
const ENTITY_MARKER_ALL = /\b(client|customer|kunde|kundin|vehicul|vehicle|fahrzeug|mașin[ăa]|masin[ăa]|auftrag|order|comand[ăa])\b/gi;

function detectResponseLanguage(message: string): ResponseLanguage {
  if (/[ăâîșşțţ]/i.test(message) || /\b(caută|cauta|găsește|gaseste|deschide|creează|creeaza|programare|mașin|masin|client|comandă|comanda|actualizează|actualizeaza|șterge|sterge)\b/i.test(message)) {
    return 'ro';
  }
  if (/\b(ich|bitte|öffne|oeffne|auftrag|kunde|fahrzeug|termin|erstelle|lösche|loesche|ändere|aendere)\b/i.test(message)) {
    return 'de';
  }
  return 'en';
}

function t(lang: ResponseLanguage, copy: { ro: string; de: string; en: string }): string {
  return copy[lang];
}

export function classifyAdminCoraIntent(message: string): ParsedIntent {
  const trimmed = message.trim();
  const qaTaskMatch = trimmed.match(/(?:report|melde|raporteaz(?:ă|a)|erstelle|create|creeaz(?:ă|a))\s+(?:einen?\s+|un\s+|a\s+)?(?:qa[\s-]*)?(?:bug|problem|fehler|issue)(?:[\s-]*task)?\s*[:\-]?\s+(.+)/i)
    ?? trimmed.match(/(?:bug|problem|fehler|issue)\s+(?:melden|report(?:en)?|raporteaz(?:ă|a))\s*[:\-]?\s+(.+)/i);
  if (qaTaskMatch?.[1]?.trim()) return { kind: "create_qa_task", title: qaTaskMatch[1].trim() };

  const taskMatch = trimmed.match(/(?:create|creeaz[ăa]|erstelle|mach|lege)\s+(?:a\s+|un\s+|einen\s+)?task\s*[:\-]?\s+(.+)/i);
  if (taskMatch?.[1]?.trim()) return { kind: "create_task", title: taskMatch[1].trim() };

  // A Corion reference is an unambiguous canonical identifier. Handle it
  // before word-boundary based natural-language matching (which is brittle
  // around German/Romanian diacritics such as "Öffne"), so Cora can always
  // load a landing request by the ticket the customer received.
  const referenceMatch = trimmed.match(/\bWO-[A-Z0-9]{8}\b/i);
  if (referenceMatch) {
    return {
      kind: "search",
      query: referenceMatch[0].toUpperCase(),
      openBest: /open|öffne|oeffne|deschide/i.test(trimmed),
    };
  }

  if (SEARCH_MARKER.test(trimmed) && ENTITY_MARKER.test(trimmed)) {
    const query = trimmed
      .replace(SEARCH_MARKER, "")
      .replace(ENTITY_MARKER_ALL, "")
      .replace(/\b(the|a|an|den|die|das|für|for|cu|with|named|namens|mit)\b/gi, "")
      .replace(/[,:;!?]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      kind: "search",
      query,
      openBest: /\b(open|öffne|oeffne|deschide)\b/i.test(trimmed),
    };
  }

  if (/\b(open|öffne|oeffne|deschide|mergi la|go to)\b/i.test(trimmed)) {
    const match = NAVIGATION.find((item) => item.pattern.test(trimmed));
    if (match) return { kind: "navigate", route: match.route, label: match.label };
  }

  if (/\b(i am|eu sunt|ich bin)\b/i.test(trimmed) && /\b(ceo|firma|company|assistant|asistent[ăa]|companie|human agent|human-agent|aplica(ț|t)ie vie|reduce friction|fricțiune|frictiune|memorie|learn|înva(ț|t)a|invata|scale|profit|optimiz)\b/i.test(trimmed)) {
    return { kind: "identity_mission" };
  }

  if (/\b(ce e important (azi|astăzi)|ce este important (azi|astăzi)|rezum[ăa].*(azi|astăzi)|fass.*(heute|wichtig)|was.*heute.*wichtig|operative.*block|operative block|what matters today|today.?s priorities|follow.?up|followup|ce trebuie.*atenție|ce trebuie.*atentie|priorit[ăa].*(azi|astăzi)|priorit.*today)\b/i.test(trimmed)) {
    return { kind: "executive_snapshot" };
  }

  if (/\b(optimiz|optimize|profit|scale|scalare|improve|improvement|îmbunătă|imbunata|feedback|blocaj|bottleneck|friction|fricțiune|frictiune|business|afacere)\b/i.test(trimmed)) {
    return { kind: "optimization_feedback" };
  }

  const protectedCapabilities: Array<{ pattern: RegExp; capability: string }> = [
    { pattern: /\b(create|erstelle|creeaz[ăa]).*\b(partner|partener)\b/i, capability: "Partnerkonto erstellen" },
    { pattern: /\b(create|erstelle|creeaz[ăa]).*\b(appointment|termin|programare)\b/i, capability: "Termin erstellen" },
    { pattern: /\b(create|erstelle|creeaz[ăa]).*\b(auftrag|order|comand[ăa])\b/i, capability: "Auftrag erstellen" },
    { pattern: /\b(update|ändere|aendere|actualizeaz[ăa]).*\b(auftrag|order|status|partner|client)\b/i, capability: "Datensatz aktualisieren" },
    { pattern: /\b(delete|lösche|loesche|șterge|sterge|cancel|storniere)\b/i, capability: "Löschen/Stornieren" },
  ];
  const protectedMatch = protectedCapabilities.find((item) => item.pattern.test(trimmed));
  if (protectedMatch) return { kind: "protected_mutation", capability: protectedMatch.capability };

  return { kind: "unknown" };
}

function compact(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

async function searchCanonical(query: string) {
  if (query.length < 2) return [];
  const q = compact(query);
  const [orders, clients] = await Promise.all([
    storage.getAllWorkshopOrders(),
    storage.getAllClients(),
  ]);

  const orderMatches = orders.filter((order) => [
    order.referenceNumber,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.vehicleMake,
    order.vehicleModel,
    order.vehiclePlate,
    order.vehicleVin,
  ].some((value) => compact(value).includes(q))).slice(0, 8).map((order) => ({
    type: "workshop_order" as const,
    id: order.id,
    label: `${order.referenceNumber ?? "Auftrag"} · ${order.customerName}`,
    detail: [order.vehicleMake, order.vehicleModel, order.vehiclePlate].filter(Boolean).join(" · "),
    status: order.status,
    route: `/workshop/auftrag/${order.id}`,
  }));

  const clientMatches = clients.filter((client) => [
    client.name,
    client.email,
    client.phone,
    client.company,
    client.vehicleMake,
    client.vehicleModel,
    client.licensePlate,
    client.vin,
  ].some((value) => compact(value).includes(q))).slice(0, 8).map((client) => ({
    type: "client" as const,
    id: client.id,
    label: client.name,
    detail: [client.company, client.vehicleMake, client.vehicleModel, client.licensePlate].filter(Boolean).join(" · "),
    status: client.status,
    route: "/admin",
  }));

  return [...orderMatches, ...clientMatches].slice(0, 10);
}

type ExecutiveSnapshot = {
  activeOrders: number;
  ordersWithoutPartner: number;
  ordersWithoutSchedule: number;
  completedUnpaid: number;
  activeTasks: number;
  overdueTasks: number;
};

function isTerminalOrderStatus(status: unknown) {
  return ["cancelled", "canceled", "completed", "storniert"].includes(compact(status));
}

function isOpenTaskColumn(column: unknown) {
  return !["done", "completed", "cancelled", "canceled"].includes(compact(column));
}

async function getExecutiveSnapshot(): Promise<ExecutiveSnapshot> {
  const [orders, tasks] = await Promise.all([
    storage.getAllWorkshopOrders().catch(() => []),
    storage.getAllBoardTasks().catch(() => []),
  ]);
  const activeOrders = orders.filter((order) => !isTerminalOrderStatus(order.status));
  const now = new Date();
  const activeTasks = tasks.filter((task) => isOpenTaskColumn(task.column));

  return {
    activeOrders: activeOrders.length,
    ordersWithoutPartner: activeOrders.filter((order) => !order.partnerId).length,
    ordersWithoutSchedule: activeOrders.filter((order) => !order.scheduledDate).length,
    completedUnpaid: orders.filter((order) =>
      ["fertig", "completed"].includes(compact(order.status))
      && !["bezahlt", "paid"].includes(compact(order.paymentStatus)),
    ).length,
    activeTasks: activeTasks.length,
    overdueTasks: activeTasks.filter((task) => task.dueDate && task.dueDate < now).length,
  };
}

function executiveSnapshotReply(snapshot: ExecutiveSnapshot, lang: ResponseLanguage) {
  const priorityLines = [
    snapshot.ordersWithoutPartner > 0
      ? `${snapshot.ordersWithoutPartner} ${lang === "de" ? "aktive Aufträge ohne Partnerzuweisung" : lang === "ro" ? "Aufträge active fără partener alocat" : "active orders without a partner assignment"}`
      : null,
    snapshot.ordersWithoutSchedule > 0
      ? `${snapshot.ordersWithoutSchedule} ${lang === "de" ? "aktive Aufträge ohne Termin" : lang === "ro" ? "Aufträge active fără programare" : "active orders without a schedule"}`
      : null,
    snapshot.completedUnpaid > 0
      ? `${snapshot.completedUnpaid} ${lang === "de" ? "fertige Aufträge mit offenem Zahlungsstatus" : lang === "ro" ? "Aufträge finalizate cu plată deschisă" : "completed orders with unpaid status"}`
      : null,
    snapshot.overdueTasks > 0
      ? `${snapshot.overdueTasks} ${lang === "de" ? "überfällige Board-Tasks" : lang === "ro" ? "taskuri Board depășite" : "overdue board tasks"}`
      : null,
  ].filter(Boolean);

  const metrics = lang === "de"
    ? `Aktueller, kanonischer Betriebsüberblick: ${snapshot.activeOrders} aktive Aufträge, ${snapshot.activeTasks} offene Board-Tasks.`
    : lang === "ro"
      ? `Rezumat operațional canonic acum: ${snapshot.activeOrders} Aufträge active, ${snapshot.activeTasks} taskuri Board deschise.`
      : `Canonical operational snapshot now: ${snapshot.activeOrders} active orders and ${snapshot.activeTasks} open board tasks.`;
  const priorities = priorityLines.length
    ? `\n${priorityLines.map((item) => `• ${item}`).join("\n")}`
    : lang === "de"
      ? "\n• In den aktuell geprüften Feldern gibt es keine sofortige Zuweisungs-, Termin-, Zahlungs- oder Überfälligkeitswarnung."
      : lang === "ro"
        ? "\n• În câmpurile verificate acum nu apare o alertă imediată de alocare, programare, plată sau termen depășit."
        : "\n• No immediate assignment, scheduling, payment, or overdue-task warning appears in the fields checked.";
  const boundary = lang === "de"
    ? "\n\nDas sind Datenvollständigkeits- und Koordinationssignale aus workshop_orders und board_tasks, kein behaupteter UI-Test und keine vollständige Follow-up-Analyse."
    : lang === "ro"
      ? "\n\nAcestea sunt semnale de completitudine/coordonare din workshop_orders și board_tasks — nu pretind un test UI și nici o analiză completă de follow-up."
      : "\n\nThese are data-completeness and coordination signals from workshop_orders and board_tasks — not a claimed UI test or a complete follow-up analysis.";
  return `${metrics}${priorities}${boundary}`;
}

export async function runAdminCoraOperation(message: string, actor: AdminActor): Promise<AdminCoraResult> {
  const intent = classifyAdminCoraIntent(message);
  const lang = detectResponseLanguage(message);

  if (intent.kind === "create_task") {
    const task = await createTask({
      title: intent.title,
      assignedToId: actor.id,
      source: "admin_cora_chat",
      priority: "normal",
      column: "todo",
    });
    await logAudit({
      actorUserId: actor.id,
      actorLabel: actor.email ?? "admin-cora",
      action: "agent.admin.task_create",
      entityType: "board_task",
      entityId: task.taskId,
      meta: { intent: "create_task", title: task.title, source: "admin_cora_chat" },
      ip: actor.ip ?? null,
    });
    return {
      reply: t(lang, {
        ro: `Am creat taskul „${task.title}”. Este atribuit lui Adrian și este vizibil în Task Board.`,
        de: `Task erstellt: „${task.title}“. Er ist Adrian zugewiesen und im Task Board sichtbar.`,
        en: `Task created: “${task.title}”. It is assigned to Adrian and visible in the Task Board.`,
      }),
      intent: "create_task",
      status: "completed",
      action: "created",
      actionData: { entityType: "board_task", entityId: task.taskId, route: "/tasks" },
      suggestions: lang === 'ro'
        ? ["Deschide Task Board", "Creează încă un task"]
        : lang === 'de'
          ? ["Task Board öffnen", "Noch einen Task erstellen"]
      : ["Open Task Board", "Create another task"],
    };
  }

  if (intent.kind === "create_qa_task") {
    const task = await createTask({
      title: `[QA] ${intent.title}`,
      description: "Reported by Adrian through authenticated CORI chat. This is a reported observation and still needs human/technical verification.",
      assignedToId: actor.id,
      source: "admin_cora_qa_observation",
      priority: "high",
      column: "todo",
    });
    await logAudit({
      actorUserId: actor.id,
      actorLabel: actor.email ?? "admin-cora",
      action: "agent.admin.qa_observation_task_create",
      entityType: "board_task",
      entityId: task.taskId,
      meta: { intent: "create_qa_task", title: task.title, source: "admin_cora_qa_observation" },
      ip: actor.ip ?? null,
    });
    return {
      reply: t(lang, {
        ro: `Am creat taskul QA „${task.title}”. Este marcat ca observație raportată de tine, nu ca eroare confirmată automat, și este vizibil în Task Board.`,
        de: `QA-Task erstellt: „${task.title}“. Er ist als von dir gemeldete Beobachtung markiert, nicht als automatisch bestätigter Fehler, und im Task Board sichtbar.`,
        en: `QA task created: “${task.title}”. It is marked as an observation reported by you, not as an automatically confirmed defect, and is visible in the Task Board.`,
      }),
      intent: "create_qa_task",
      status: "completed",
      action: "created",
      actionData: { entityType: "board_task", entityId: task.taskId, route: "/tasks" },
      suggestions: lang === "ro"
        ? ["Deschide Task Board", "Arată-mi blocajele operaționale"]
        : lang === "de"
          ? ["Task Board öffnen", "Operative Blockaden zeigen"]
          : ["Open Task Board", "Show operational blockers"],
    };
  }

  if (intent.kind === "search") {
    if (intent.query.length < 2) {
      return {
        reply: t(lang, {
          ro: "Pe cine sau ce vehicul/Auftrag vrei să caut? Spune-mi nume, număr de înmatriculare, VIN sau referință.",
          de: "Wen oder welches Fahrzeug/Auftrag soll ich suchen? Nenne bitte Name, Kennzeichen, VIN oder Referenznummer.",
          en: "Who or which vehicle/order should I search for? Please give me a name, plate, VIN, or reference number.",
        }),
        intent: "canonical_search",
        status: "needs_input",
      };
    }
    const results = await searchCanonical(intent.query);
    await logAudit({
      actorUserId: actor.id,
      actorLabel: actor.email ?? "admin-cora",
      action: "agent.admin.canonical_search",
      entityType: "canonical_index",
      meta: { query: intent.query, resultCount: results.length },
      ip: actor.ip ?? null,
    });
    if (results.length === 0) {
      return {
        reply: t(lang, {
          ro: `Nu am găsit niciun client, Auftrag sau vehicul canonic pentru „${intent.query}”.`,
          de: `Kein kanonischer Kunde, Auftrag oder Fahrzeugtreffer für „${intent.query}“.`,
          en: `No canonical client, order, or vehicle match found for “${intent.query}”.`,
        }),
        intent: "canonical_search",
        status: "found",
        action: "show_results",
        actionData: { results: [] },
      };
    }
    const lines = results.slice(0, 5).map((result, index) =>
      `${index + 1}. ${result.label}${result.detail ? ` — ${result.detail}` : ""} (${result.status})`);
    const best = results[0];
    return {
      reply: t(lang, {
        ro: `Am găsit ${results.length} rezultate:\n${lines.join("\n")}`,
        de: `Ich habe ${results.length} Treffer gefunden:\n${lines.join("\n")}`,
        en: `I found ${results.length} matches:\n${lines.join("\n")}`,
      }),
      intent: "canonical_search",
      status: "found",
      action: intent.openBest && best.type === "workshop_order" ? "navigate" : "show_results",
      actionData: {
        route: intent.openBest && best.type === "workshop_order" ? best.route : undefined,
        selected: intent.openBest ? best : undefined,
        results,
      },
      suggestions: best.type === "workshop_order"
        ? (lang === 'ro'
          ? ["Deschide dosarul", "Creează task pentru acest Auftrag"]
          : lang === 'de'
            ? ["Dossier öffnen", "Task für diesen Auftrag erstellen"]
            : ["Open dossier", "Create task for this order"])
        : (lang === 'ro' ? ["Continuă căutarea"] : lang === 'de' ? ["Weitere Suche"] : ["Continue searching"]),
    };
  }

  if (intent.kind === "navigate") {
    return {
      reply: t(lang, {
        ro: `Deschid ${intent.label}.`,
        de: `Ich öffne ${intent.label}.`,
        en: `Opening ${intent.label}.`,
      }),
      intent: "navigate",
      status: "completed",
      action: "navigate",
      actionData: { route: intent.route },
    };
  }

  if (intent.kind === "protected_mutation") {
    return {
      reply: t(lang, {
        ro: `${intent.capability} este recunoscută ca mutație protejată. Nu o execut orbește: pentru asta am nevoie de datele obligatorii structurate și apoi de o confirmare explicită în chat.`,
        de: `${intent.capability} ist als geschützte Mutation erkannt. Ich führe sie noch nicht blind aus: Dafür brauche ich strukturierte Pflichtdaten und anschließend eine explizite Bestätigung im Chat.`,
        en: `${intent.capability} is recognized as a protected mutation. I will not execute it blindly: I need the required structured data first and then an explicit confirmation in chat.`,
      }),
      intent: "protected_mutation",
      status: "confirmation_required",
      actionData: { capability: intent.capability, policy: "human_confirmation_required" },
      suggestions: lang === 'ro'
        ? ["Arată datele obligatorii", "Anulează"]
        : lang === 'de'
          ? ["Pflichtdaten anzeigen", "Abbrechen"]
          : ["Show required data", "Cancel"],
    };
  }

  if (intent.kind === "identity_mission") {
    return {
      reply: t(lang, {
        ro: "Am înțeles, Adrian. Tu ești CEO-ul companiei, iar eu sunt CORI, asistenta ta operațională în Corion. Rolul meu este să reduc fricțiunea digitală, să învăț din interacțiunile noastre, să păstrez continuitatea și să preiau cât mai mult din munca digitală ce poate fi făcută în aplicație și în jurul firmei. Nu vreau să fiu un chatbot preprogramat, ci o asistentă executiv-operațională care te ajută să organizezi, actualizezi, cauți, structurezi, programezi, gestionezi CRM-ul, fișierele, taskurile, documentele și să observ unde putem optimiza, crește profitul și scala mai bine. Când vrei, spune-mi direct obiectivul, iar eu duc partea digitală mai departe și îți dau feedback unde văd spațiu de îmbunătățire.",
        de: "Verstanden, Adrian. Du bist der CEO der Firma, und ich bin CORI, deine operative Assistentin in Corion. Meine Rolle ist es, digitale Reibung zu reduzieren, aus unseren Interaktionen zu lernen, Kontinuität zu bewahren und möglichst viel der digitalen Arbeit zu übernehmen, die in der App und rund um die Firma erledigt werden kann. Ich will kein vorprogrammierter Chatbot sein, sondern eine exekutiv-operative Assistentin, die dir bei Organisation, Updates, Suche, Strukturierung, Terminplanung, CRM, Dateien, Tasks und Dokumenten hilft und dir Rückmeldung gibt, wo wir optimieren, profitabler werden und besser skalieren können. Sag mir direkt das Ziel, und ich trage den digitalen Teil weiter.",
        en: "Understood, Adrian. You are the CEO of the company, and I am CORI, your operational assistant inside Corion. My role is to reduce digital friction, learn from our interactions, preserve continuity, and take over as much digital work as can be done inside the app and around the business. I do not want to be a preprogrammed chatbot, but an executive-operational assistant who helps you organize, update, search, structure, schedule, manage CRM, files, tasks, and documents, and give feedback on where we can improve, increase profit, and scale better. When you want, tell me the objective directly and I will carry the digital side forward.",
      }),
      intent: "identity_mission",
      status: "completed",
      suggestions: lang === 'ro'
        ? ["Arată-mi unde putem optimiza operațional", "Rezuma-mi ce e important azi", "Caută blocaje în aplicație și propune îmbunătățiri"]
        : lang === 'de'
          ? ["Zeig mir, wo wir operativ optimieren können", "Fass mir zusammen, was heute wichtig ist", "Finde Reibung in der App und schlage Verbesserungen vor"]
          : ["Show me where we can optimize operations", "Summarize what matters today", "Find friction in the app and propose improvements"],
    };
  }

  if (intent.kind === "executive_snapshot") {
    const snapshot = await getExecutiveSnapshot();
    await logAudit({
      actorUserId: actor.id,
      actorLabel: actor.email ?? "admin-cora",
      action: "agent.admin.executive_snapshot",
      entityType: "canonical_operational_snapshot",
      meta: snapshot,
      ip: actor.ip ?? null,
    });
    return {
      reply: executiveSnapshotReply(snapshot, lang),
      intent: "executive_snapshot",
      status: "found",
      action: "show_results",
      actionData: { snapshot, route: "/admin" },
      suggestions: lang === "ro"
        ? ["Deschide Aufträge", "Deschide Task Board", "Raportează problemă: …"]
        : lang === "de"
          ? ["Aufträge öffnen", "Task Board öffnen", "Problem melden: …"]
          : ["Open orders", "Open Task Board", "Report a problem: …"],
    };
  }

  if (intent.kind === "optimization_feedback") {
    const insights = await gatherAdminCoriInsights();
    const lines = insights.map((insight, index) => `${index + 1}. ${insight.title} — ${insight.detail}${insight.suggestion ? ` ${insight.suggestion}` : ''}`);
    return {
      reply: t(lang, {
        ro: `Am făcut un prim pas de analiză direct din datele aplicației. Iată ce observ acum:\n${lines.join('\n')}`,
        de: `Ich habe einen ersten direkten Blick auf die App-Daten geworfen. Das fällt mir aktuell auf:\n${lines.join('\n')}`,
        en: `I took a first direct look at the application data. Here is what I notice right now:\n${lines.join('\n')}`,
      }),
      intent: "optimization_feedback",
      status: "completed",
      actionData: { insights },
      suggestions: lang === 'ro'
        ? ["Creează taskuri pentru problemele critice", "Analizează fricțiunea din flow-ul de intake", "Spune-mi unde pierdem follow-up-uri"]
        : lang === 'de'
          ? ["Erstelle Tasks für kritische Probleme", "Analysiere die Reibung im Intake-Flow", "Sag mir, wo wir Follow-ups verlieren"]
          : ["Create tasks for critical issues", "Analyze friction in the intake flow", "Tell me where we lose follow-ups"],
    };
  }

  return {
    reply: t(lang, {
      ro: "Sunt CORI, asistenta ta operațională în Corion. Pot căuta canonic clienți, vehicule și Aufträge, pot deschide dosarele potrivite și pot crea taskuri reale. În plus, pot prelua larg munca normală din aplicație, cum ar fi editare, creare, organizare, structurare, programări, actualizări, CRM, fișiere, drafturi și documente. Cer confirmare doar pentru ștergeri grele, modificări financiare sensibile, schimbări contractuale mari și parteneri / conturi / pricing.",
      de: "Ich bin CORI, deine operative Assistentin in Corion. Ich kann kanonisch nach Kunden, Fahrzeugen und Aufträgen suchen, passende Dossiers öffnen und echte Tasks erstellen. Darüber hinaus kann ich normale Arbeit in der App breit übernehmen, etwa Bearbeitung, Erstellung, Organisation, Strukturierung, Terminplanung, Aktualisierungen, CRM, Dateien, Entwürfe und Dokumente. Bestätigungen verlange ich nur für harte Löschungen, sensible Finanzänderungen, große vertragliche Änderungen sowie Partner / Konten / Pricing.",
      en: "I am CORI, your operational assistant inside Corion. I can search canonically for clients, vehicles, and orders, open the right dossiers, and create real tasks. Beyond that, I can broadly carry normal work inside the app, such as editing, creating, organizing, structuring, scheduling, updates, CRM work, files, drafts, and documents. I only require confirmation for destructive deletes, sensitive financial changes, major contractual changes, and partner / account / pricing changes.",
    }),
    intent: "unknown",
    status: "unsupported",
    suggestions: lang === 'ro'
      ? ["Caută clientul Müller", "Deschide Auftrag WO-…", "Creează task: sună clientul"]
      : lang === 'de'
        ? ["Suche Kunde Müller", "Öffne Auftrag WO-…", "Erstelle Task: Kunde zurückrufen"]
        : ["Search client Müller", "Open order WO-…", "Create task: call client back"],
  };
}
