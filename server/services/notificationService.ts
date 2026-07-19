import { db } from "../../db/index";
import { appointmentReminders, type WorkshopOrder } from "@shared/schema";
import { storage } from "../storage";
import { sendEmail } from "../lib/resend";
import { and, isNull, lte, sql } from "drizzle-orm";

const APP_BASE_URL =
  process.env.APP_URL ||
  process.env.PUBLIC_BASE_URL ||
  "https://app.corion.app";

const REMINDER_24H_MS = 24 * 60 * 60 * 1000;
const REMINDER_2H_MS = 2 * 60 * 60 * 1000;
const SCHEDULER_TICK_MS = 5 * 60 * 1000;

function unwrapRows<T = any>(res: any): T[] {
  return (res?.rows ?? res ?? []) as T[];
}

/**
 * neon-http quirk: `db.execute(sql\`UPDATE ... RETURNING\`)` returns empty rows
 * even when the update succeeded. Use `rowCount` to detect a successful claim.
 */
function execRowCount(res: any): number {
  return Number(res?.rowCount ?? 0);
}

/**
 * neon-http + drizzle-orm round-trip drops fractional seconds and produces
 * `Invalid Date` for `timestamp without time zone` columns. We read those
 * fields via raw SQL to get a proper ISO string, then coerce to Date here.
 */
type OrderNotifSnapshot = {
  id: string;
  reference_number: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  partner_id: string | null;
  scheduled_date: Date | null;
  partner_notified_at: Date | null;
  appointment_notified_for: Date | null;
};

async function getOrderForNotif(orderId: string): Promise<OrderNotifSnapshot | null> {
  const res: any = await db.execute(sql`
    SELECT
      id,
      reference_number,
      customer_name,
      customer_email,
      customer_phone,
      vehicle_make,
      vehicle_model,
      vehicle_plate,
      partner_id,
      to_char(scheduled_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS scheduled_date_iso,
      to_char(partner_notified_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS partner_notified_at_iso,
      to_char(appointment_notified_for AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS appointment_notified_for_iso
    FROM workshop_orders
    WHERE id = ${orderId}
  `);
  const row: any = unwrapRows(res)[0];
  if (!row) return null;
  return {
    id: row.id,
    reference_number: row.reference_number,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    vehicle_make: row.vehicle_make,
    vehicle_model: row.vehicle_model,
    vehicle_plate: row.vehicle_plate,
    partner_id: row.partner_id,
    scheduled_date: row.scheduled_date_iso ? new Date(row.scheduled_date_iso) : null,
    partner_notified_at: row.partner_notified_at_iso ? new Date(row.partner_notified_at_iso) : null,
    appointment_notified_for: row.appointment_notified_for_iso
      ? new Date(row.appointment_notified_for_iso)
      : null,
  };
}

function orderUrl(orderId: string) {
  return `${APP_BASE_URL.replace(/\/$/, "")}/workshop/auftrag/${orderId}`;
}

function waLink(phone: string | null | undefined, message: string) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!cleaned) return null;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

function fmtDateDe(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

async function safeSendEmail(
  to: string | null | undefined,
  subject: string,
  text: string,
  html?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!to) return { ok: false, error: "no_recipient" };
  try {
    await sendEmail({ to, subject, text, html });
    return { ok: true };
  } catch (err: any) {
    console.error("[notificationService] sendEmail failed", err?.message ?? err);
    return { ok: false, error: err?.message ?? "send_failed" };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[char] ?? char);
}

/**
 * New public requests are operational events, not passive database rows.
 *
 * This notifies every internal admin through the existing in-app notification
 * channel and, when production e-mail is configured, via e-mail as well. The
 * canonical Auftrag remains the only case record; this function only creates
 * delivery/audit traces pointing back to it.
 */
export async function notifyAdminsOfNewPublicIntake(input: {
  orderId: string;
  referenceNumber: string | null | undefined;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehiclePlate?: string | null;
  damageDescription?: string | null;
  intakeSource: string;
  attachmentsCreated: number;
}): Promise<{ adminsNotified: number; emailsSent: number; emailFailures: number }> {
  const ref = input.referenceNumber ?? input.orderId.slice(0, 8);
  const vehicle = [input.vehicleMake, input.vehicleModel, input.vehiclePlate]
    .filter(Boolean)
    .join(" ") || "Fahrzeug noch nicht angegeben";
  const contact = [input.customerEmail, input.customerPhone].filter(Boolean).join(" · ") || "kein Kontakt";
  const summary = (input.damageDescription ?? "").replace(/\s+/g, " ").trim();
  const url = orderUrl(input.orderId);
  const subject = `[Corion] Neue öffentliche Anfrage — ${ref}`;
  const text = [
    "Neue Anfrage über corion.app",
    "",
    `Referenz: ${ref}`,
    `Kunde: ${input.customerName}`,
    `Kontakt: ${contact}`,
    `Fahrzeug: ${vehicle}`,
    `Kanal: ${input.intakeSource}`,
    `Dateien: ${input.attachmentsCreated}`,
    summary ? `Problem: ${summary}` : null,
    "",
    `Auftrag öffnen: ${url}`,
  ].filter(Boolean).join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2 style="color:#E53935;margin-bottom:4px">Neue öffentliche Anfrage</h2>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0"><b>Referenz</b></td><td>${escapeHtml(ref)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Kunde</b></td><td>${escapeHtml(input.customerName)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Kontakt</b></td><td>${escapeHtml(contact)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Fahrzeug</b></td><td>${escapeHtml(vehicle)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Kanal</b></td><td>${escapeHtml(input.intakeSource)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Dateien</b></td><td>${input.attachmentsCreated}</td></tr>
      </table>
      ${summary ? `<p><b>Problem:</b> ${escapeHtml(summary)}</p>` : ""}
      <p><a href="${url}" style="background:#E53935;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Auftrag öffnen</a></p>
    </div>
  `;

  let adminsNotified = 0;
  let emailsSent = 0;
  let emailFailures = 0;
  const admins = await storage.getUsersByRole("admin");

  for (const admin of admins) {
    try {
      await storage.createNotification({
        userId: admin.id,
        title: "Neue öffentliche Anfrage",
        message: `${ref} · ${input.customerName} · ${vehicle} · ${input.attachmentsCreated} Datei(en)`,
        type: "info",
        link: `/workshop/auftrag/${input.orderId}`,
      });
      adminsNotified++;
    } catch (err: any) {
      console.error("[notificationService] admin in-app notify failed", err?.message);
    }

    const emailResult = await safeSendEmail(admin.email, subject, text, html);
    if (emailResult.ok) emailsSent++;
    else emailFailures++;
  }

  await logTimeline(input.orderId, "intake", "Öffentliche Anfrage eingegangen", subject, {
    intakeSource: input.intakeSource,
    attachmentsCreated: input.attachmentsCreated,
    adminsNotified,
    emailsSent,
    emailFailures,
  });

  return { adminsNotified, emailsSent, emailFailures };
}

async function logTimeline(
  orderId: string,
  kind: string,
  title: string,
  message?: string,
  meta?: Record<string, any>,
) {
  try {
    await db.execute(sql`
      INSERT INTO order_timeline_events (workshop_order_id, kind, title, message, actor_label, meta_json)
      VALUES (${orderId}, ${kind}, ${title}, ${message ?? null}, 'System', ${meta ? JSON.stringify(meta) : null}::jsonb)
    `);
  } catch (err: any) {
    console.error("[notificationService] timeline log failed", err?.message);
  }
}

/**
 * B1 — Partner notification when assigned (NULL → X).
 * Idempotent via partner_notified_at flag on workshop_orders.
 */
export async function notifyPartnerAssigned(orderId: string): Promise<void> {
  const order = await getOrderForNotif(orderId);
  if (!order || !order.partner_id) return;
  if (order.partner_notified_at) return; // already sent

  const partner = await storage.getUser(order.partner_id);
  if (!partner) return;

  const url = orderUrl(orderId);
  const ref = order.reference_number ?? orderId.slice(0, 8);
  const partnerName = partner.firstName || partner.lastName
    ? `${partner.firstName ?? ""} ${partner.lastName ?? ""}`.trim()
    : partner.email ?? "Partner";

  const subject = `Neuer Auftrag zugewiesen — ${ref}`;
  const waMsg = `Hallo ${partnerName}, du hast einen neuen Corion-Auftrag (${ref}). Details: ${url}`;
  const wa = waLink(partner.phone, waMsg);

  const text = [
    `Hallo ${partnerName},`,
    ``,
    `Ein neuer Auftrag wurde dir zugewiesen.`,
    ``,
    `Auftrag: ${ref}`,
    `Kunde: ${order.customer_name}`,
    order.vehicle_make || order.vehicle_model
      ? `Fahrzeug: ${[order.vehicle_make, order.vehicle_model, order.vehicle_plate].filter(Boolean).join(" ")}`
      : "",
    order.scheduled_date ? `Geplant: ${fmtDateDe(order.scheduled_date)}` : "",
    ``,
    `Auftrag öffnen: ${url}`,
    wa ? `Per WhatsApp bestätigen: ${wa}` : "",
    ``,
    `+1 Corion Lackdoktor`,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2 style="color:#E53935;margin-bottom:4px">Neuer Auftrag zugewiesen</h2>
      <p>Hallo ${partnerName},</p>
      <p>Du hast einen neuen Corion-Auftrag erhalten.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0"><b>Auftrag</b></td><td>${ref}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Kunde</b></td><td>${order.customer_name}</td></tr>
        ${order.scheduled_date ? `<tr><td style="padding:4px 12px 4px 0"><b>Geplant</b></td><td>${fmtDateDe(order.scheduled_date)}</td></tr>` : ""}
      </table>
      <p>
        <a href="${url}" style="background:#E53935;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Auftrag öffnen</a>
        ${wa ? `&nbsp;<a href="${wa}" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Per WhatsApp bestätigen</a>` : ""}
      </p>
    </div>
  `;

  // Race-safe idempotency: claim the slot atomically AND bind to the partner
  // we read, so a concurrent partner-change can't burn the flag for the wrong
  // recipient.
  const claim: any = await db.execute(sql`
    UPDATE workshop_orders
    SET partner_notified_at = NOW()
    WHERE id = ${orderId}
      AND partner_notified_at IS NULL
      AND partner_id = ${order.partner_id}
  `);
  if (execRowCount(claim) === 0) return; // someone else already notified or partner changed

  const emailResult = await safeSendEmail(partner.email, subject, text, html);

  try {
    await storage.createNotification({
      userId: partner.id,
      title: "Neuer Auftrag zugewiesen",
      message: `${ref} — ${order.customer_name}`,
      type: "info",
      link: `/workshop/auftrag/${orderId}`,
    });
  } catch (err: any) {
    console.error("[notificationService] in-app notify failed", err?.message);
  }

  await logTimeline(orderId, "partner_assigned", "Partner benachrichtigt", subject, {
    partnerId: partner.id,
    email: emailResult.ok,
    emailError: emailResult.error,
    whatsappLink: wa,
  });
}

/**
 * B2 — Client confirmation when scheduled_date is set / changed.
 * Idempotent per scheduled_date value via appointment_notified_for.
 */
export async function notifyAppointmentScheduled(orderId: string): Promise<void> {
  const order = await getOrderForNotif(orderId);
  if (!order || !order.scheduled_date) return;
  const scheduled = order.scheduled_date;
  const lastNotified = order.appointment_notified_for;
  const isReschedule = !!lastNotified;
  if (lastNotified && lastNotified.getTime() === scheduled.getTime()) return;

  // Race-safe claim: stamp appointment_notified_for atomically AND bind to the
  // scheduled_date we read, so a concurrent reschedule can't be masked.
  const claim: any = await db.execute(sql`
    UPDATE workshop_orders
    SET appointment_notified_for = ${scheduled.toISOString()}::timestamp
    WHERE id = ${orderId}
      AND scheduled_date = ${scheduled.toISOString()}::timestamp
      AND (appointment_notified_for IS NULL OR appointment_notified_for <> ${scheduled.toISOString()}::timestamp)
  `);
  if (execRowCount(claim) === 0) {
    // Already at this date — still ensure reminders are aligned.
    await scheduleAppointmentReminders(orderId);
    return;
  }

  const ref = order.reference_number ?? orderId.slice(0, 8);
  const url = orderUrl(orderId);
  const dateLabel = fmtDateDe(scheduled);
  const subject = `Termin-Bestätigung — ${dateLabel}`;
  const waMsg = `Hallo ${order.customer_name}, Ihr Corion-Termin ist am ${dateLabel}. Auftrag: ${ref}`;
  const wa = waLink(order.customer_phone, waMsg);

  const text = [
    `Hallo ${order.customer_name},`,
    ``,
    `wir bestätigen Ihren Termin bei +1 Corion Lackdoktor.`,
    ``,
    `Termin: ${dateLabel}`,
    `Auftrag: ${ref}`,
    order.vehicle_make || order.vehicle_model
      ? `Fahrzeug: ${[order.vehicle_make, order.vehicle_model, order.vehicle_plate].filter(Boolean).join(" ")}`
      : "",
    ``,
    `Auftrag online ansehen: ${url}`,
    wa ? `Per WhatsApp bestätigen: ${wa}` : "",
    ``,
    `Vielen Dank — +1 Corion Lackdoktor`,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2 style="color:#E53935;margin-bottom:4px">Termin-Bestätigung</h2>
      <p>Hallo ${order.customer_name},</p>
      <p>wir bestätigen Ihren Termin bei <b>+1 Corion Lackdoktor</b>.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0"><b>Termin</b></td><td>${dateLabel}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Auftrag</b></td><td>${ref}</td></tr>
      </table>
      <p>
        <a href="${url}" style="background:#E53935;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Auftrag ansehen</a>
        ${wa ? `&nbsp;<a href="${wa}" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Per WhatsApp bestätigen</a>` : ""}
      </p>
    </div>
  `;

  const emailResult = await safeSendEmail(order.customer_email, subject, text, html);

  await logTimeline(orderId, "appointment", isReschedule ? "Termin verschoben" : "Termin bestätigt", dateLabel, {
    email: emailResult.ok,
    emailError: emailResult.error,
    whatsappLink: wa,
    scheduledFor: scheduled.toISOString(),
  });

  // Schedule reminders aligned with the new date
  await scheduleAppointmentReminders(orderId);
}

/**
 * B3 — Insert/refresh 24h + 2h reminders for an order's scheduled_date.
 * UNIQUE(workshop_order_id, kind) makes the upsert idempotent.
 * On reschedule, we update scheduled_for and reset sent_at.
 */
export async function scheduleAppointmentReminders(orderId: string): Promise<void> {
  const order = await getOrderForNotif(orderId);
  if (!order || !order.scheduled_date) return;
  const scheduled = order.scheduled_date.getTime();
  if (!Number.isFinite(scheduled)) return;

  const rem24 = new Date(scheduled - REMINDER_24H_MS).toISOString();
  const rem2 = new Date(scheduled - REMINDER_2H_MS).toISOString();

  await db.execute(sql`
    INSERT INTO appointment_reminders (workshop_order_id, kind, scheduled_for)
    VALUES
      (${orderId}, '24h', ${rem24}::timestamp),
      (${orderId}, '2h',  ${rem2}::timestamp)
    ON CONFLICT (workshop_order_id, kind) DO UPDATE
      SET scheduled_for = EXCLUDED.scheduled_for,
          sent_at = CASE
            WHEN appointment_reminders.scheduled_for <> EXCLUDED.scheduled_for THEN NULL
            ELSE appointment_reminders.sent_at
          END
  `);
}

/**
 * B3 — Process due reminders: send and mark sent_at.
 * Race-safe via single UPDATE that claims rows atomically.
 */
export async function runDueAppointmentReminders(now: Date = new Date()): Promise<number> {
  // neon-http: RETURNING from UPDATE via db.execute() yields empty rows.
  // Use SELECT candidates → per-row compare-and-swap UPDATE; rowCount tells us
  // who won the claim. This stays race-safe because the UPDATE re-checks
  // `sent_at IS NULL`.
  // neon-http has a bug where empty result sets sometimes come back with
  // `fields: null`, blowing up the parser. Catch that and treat as empty.
  let candidates: Array<{ id: string; workshop_order_id: string; kind: string }> = [];
  try {
    candidates = await db
      .select({
        id: appointmentReminders.id,
        workshop_order_id: appointmentReminders.workshopOrderId,
        kind: appointmentReminders.kind,
      })
      .from(appointmentReminders)
      .where(and(isNull(appointmentReminders.sentAt), lte(appointmentReminders.scheduledFor, now)))
      .orderBy(appointmentReminders.scheduledFor)
      .limit(100);
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const stack = String(err?.stack ?? "");
    // Narrow: only swallow the very specific neon-http parser bug
    // (`r.fields.map` blowing up because fields is null on empty results).
    const isNeonParserBug =
      msg.includes("Cannot read properties of null") &&
      msg.includes("'map'") &&
      stack.includes("@neondatabase/serverless") &&
      stack.includes("processQueryResult");
    if (isNeonParserBug) {
      // Benign: neon-http parser throws on empty result sets. Silently treat as 0 candidates.
      return 0;
    }
    throw err;
  }

  let sent = 0;
  for (const row of candidates) {
    const claim: any = await db.execute(sql`
      UPDATE appointment_reminders
      SET sent_at = NOW()
      WHERE id = ${row.id} AND sent_at IS NULL
    `);
    if (execRowCount(claim) === 0) continue; // lost the race
    try {
      await sendReminderEmail(row.workshop_order_id, row.kind);
      sent++;
    } catch (err: any) {
      console.error("[notificationService] reminder send failed", err?.message);
      // Roll back the claim so the next tick retries.
      await db.execute(sql`UPDATE appointment_reminders SET sent_at = NULL WHERE id = ${row.id}`);
    }
  }
  return sent;
}

async function sendReminderEmail(orderId: string, kind: string) {
  const order = await getOrderForNotif(orderId);
  if (!order || !order.scheduled_date) return;
  const ref = order.reference_number ?? orderId.slice(0, 8);
  const url = orderUrl(orderId);
  const dateLabel = fmtDateDe(order.scheduled_date);
  const window = kind === "2h" ? "in 2 Stunden" : "morgen";
  const subject = `Erinnerung: Termin ${window} — ${dateLabel}`;
  const waMsg = `Erinnerung: Ihr Corion-Termin ist ${window} (${dateLabel}). Auftrag: ${ref}`;
  const wa = waLink(order.customer_phone, waMsg);

  const text = [
    `Hallo ${order.customer_name},`,
    ``,
    `Erinnerung: Ihr Termin bei +1 Corion Lackdoktor ist ${window}.`,
    ``,
    `Termin: ${dateLabel}`,
    `Auftrag: ${ref}`,
    ``,
    `Auftrag ansehen: ${url}`,
    wa ? `Per WhatsApp antworten: ${wa}` : "",
    ``,
    `+1 Corion Lackdoktor`,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2 style="color:#E53935;margin-bottom:4px">Termin-Erinnerung</h2>
      <p>Hallo ${order.customer_name},</p>
      <p>Erinnerung: Ihr Termin bei <b>+1 Corion Lackdoktor</b> ist <b>${window}</b>.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0"><b>Termin</b></td><td>${dateLabel}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Auftrag</b></td><td>${ref}</td></tr>
      </table>
      <p>
        <a href="${url}" style="background:#E53935;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Auftrag ansehen</a>
        ${wa ? `&nbsp;<a href="${wa}" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Per WhatsApp antworten</a>` : ""}
      </p>
    </div>
  `;

  const emailResult = await safeSendEmail(order.customer_email, subject, text, html);
  await logTimeline(orderId, "appointment", `Erinnerung ${kind}`, subject, {
    kind,
    email: emailResult.ok,
    emailError: emailResult.error,
    whatsappLink: wa,
  });
}

let schedulerStarted = false;
export function startNotificationScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const tick = async () => {
    try {
      const n = await runDueAppointmentReminders();
      if (n > 0) console.log(`[notificationService] sent ${n} reminder(s)`);
    } catch (err: any) {
      console.error("[notificationService] scheduler tick failed", err?.message);
    }
  };
  setTimeout(tick, 30_000);
  setInterval(tick, SCHEDULER_TICK_MS);
  console.log("[notificationService] reminder scheduler started (5 min)");
}

/**
 * Hook entrypoint called from storage.updateWorkshopOrder when relevant fields change.
 * Fire-and-forget — never throws to the caller.
 */
export function dispatchOrderUpdateNotifications(
  before: WorkshopOrder | undefined,
  after: WorkshopOrder | undefined,
  beforeSnapshot?: { scheduled_date_iso: string | null; partner_id: string | null },
) {
  if (!after) return;
  setImmediate(async () => {
    try {
      const partnerJustAssigned =
        (beforeSnapshot ? !beforeSnapshot.partner_id : !before?.partnerId) && !!after.partnerId;

      // Drizzle returns Invalid Date for `timestamp` on neon-http, so string-
      // compare is unreliable. Read both before & after via raw SQL when
      // available (beforeSnapshot is taken in storage), otherwise fall back to
      // re-fetching after-state from raw SQL. notifyAppointmentScheduled is
      // itself idempotent at the DB-claim level — calling it on a no-op is safe.
      const afterSnap = await getOrderForNotif(after.id);
      const afterSchedIso = afterSnap?.scheduled_date?.toISOString() ?? null;
      const beforeSchedIso = beforeSnapshot?.scheduled_date_iso ?? null;
      const scheduledChanged = !!afterSchedIso && beforeSchedIso !== afterSchedIso;

      if (partnerJustAssigned) {
        await notifyPartnerAssigned(after.id).catch((err) =>
          console.error("[dispatch] notifyPartnerAssigned", err?.message),
        );
      }
      if (scheduledChanged) {
        await notifyAppointmentScheduled(after.id).catch((err) =>
          console.error("[dispatch] notifyAppointmentScheduled", err?.message),
        );
      }
    } catch (err: any) {
      console.error("[dispatchOrderUpdateNotifications] fatal", err?.message);
    }
  });
}

/** Read a minimal pre-update snapshot for the dispatcher (raw SQL → safe timestamps). */
export async function readOrderDispatchSnapshot(
  orderId: string,
): Promise<{ scheduled_date_iso: string | null; partner_id: string | null } | null> {
  const r: any = await db.execute(sql`
    SELECT
      partner_id,
      to_char(scheduled_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS scheduled_date_iso
    FROM workshop_orders WHERE id = ${orderId}
  `);
  const row: any = (r?.rows ?? r ?? [])[0];
  if (!row) return null;
  return {
    scheduled_date_iso: row.scheduled_date_iso ?? null,
    partner_id: row.partner_id ?? null,
  };
}
