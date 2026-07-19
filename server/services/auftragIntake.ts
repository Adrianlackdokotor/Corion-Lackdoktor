// Auftrag Intake Service
//
// Executes the full intake workflow for a new workshop order:
//   1. Local library folder structure
//   2. Google Drive folder structure (fail-soft)
//   3. Google Calendar event (fail-soft, only when slot is provided)
//   4. workshop_orders DB row (canonical spine — required)
//   5. Local CRM JSON update (fail-soft)
//
// Called from POST /api/supervisor/intake (bearer-authenticated).
// No browser session required — safe for Cora / Telegram-originated intake.

import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { getDriveAndCalendarFromSavedOAuth } from '../lib/google-drive-oauth';
import { processAttachments, type AttachmentRef } from './mediaIngest';

// ── Config ─────────────────────────────────────────────────────────────────────

const LIBRARY_BASE = process.env.CORION_LIBRARY_PATH
  ?? '/Users/corionhub/Desktop/CORA_DOCS/client_library/customers';

const CRM_JSON_PATH = process.env.CORION_CRM_JSON_PATH
  ?? '/Users/corionhub/Desktop/CORA_DOCS/corion_db.json';

const DRIVE_ROOT_NAME = '00_CORION_LACKDOKTOR';
const DRIVE_JOBS_FOLDER = '02_AUFTRAEGE_ACTIVE';

// ── Input / Output types ───────────────────────────────────────────────────────

export interface IntakeInput {
  customerName: string;
  customerAddress?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerType?: 'B2B' | 'B2C';

  vehicleMake: string;
  vehicleModel?: string | null;
  vehiclePlate: string;
  vehicleVin?: string | null;
  vehicleColor?: string | null;
  vehicleMileage?: string | null;

  damageDescription: string;

  totalAmountCents?: number | null;
  laborAmountCents?: number | null;
  partsAmountCents?: number | null;

  datReference?: string | null;

  partnerName?: string | null;
  partnerId?: string | null;

  // Both required together to create a calendar event.
  scheduledStart?: string | null; // ISO datetime e.g. "2026-05-22T09:00:00+02:00"
  scheduledEnd?: string | null;

  intakeDate?: string | null;   // ISO date, defaults to today
  intakeSource?: string | null;
  notes?: string | null;
  // Public landing conversations are retained on the canonical Auftrag so
  // reception/Cora can see the customer's original context without a shadow
  // chat store.
  conversationTranscript?: Array<{ role: 'assistant' | 'user'; content: string }> | null;

  // Optional media attachments — processed after the order is created.
  // Each ref can be a local path, a Telegram file_id, or an existing Drive link.
  attachments?: AttachmentRef[] | null;
}

export type { AttachmentRef };

export interface IntakeResult {
  orderId: string;
  referenceNumber: string;
  localFolderPath: string;
  driveFolderUrl: string | null;
  calendarEventId: string | null;
  calendarEventLink: string | null;
  partnerId: string | null;
  partnerName: string | null;
  attachmentsCreated: number;
  pendingSteps: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugifyPlate(plate: string): string {
  return plate.replace(/\s+/g, '').toUpperCase();
}

function slugifyName(name: string): string {
  return name
    .replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function slugifyFolder(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

function todayTag(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

interface Slugs {
  intakeDateTag: string;
  plateSlug: string;
  clientTag: string;
  driveFolderName: string;
  localFolderName: string;
  localFolderPath: string;
  clientId: string;
  jobId: string;
}

// Callers without a real plate yet (e.g. the landing-page "private estimate"
// chat) all pass the same "UNBEKANNT" placeholder. Without a per-intake
// tiebreaker every such submission resolves to the identical clientId, local
// folder, and (same-day) Drive folder — mixing different customers' photos
// and overwriting each other's contact info in the CRM JSON. A real plate
// still dedupes normally so repeat customers keep their job history grouped.
function resolvePlateSlug(vehiclePlate: string): string {
  const raw = (vehiclePlate ?? '').trim();
  const hasRealPlate = raw.length > 0 && raw.toUpperCase() !== 'UNBEKANNT';
  return hasRealPlate ? slugifyPlate(raw) : `ANON${Date.now().toString(36).toUpperCase()}`;
}

function computeSlugs(input: IntakeInput): Slugs {
  const intakeDateTag = input.intakeDate
    ? input.intakeDate.replace(/-/g, '')
    : todayTag();
  const plateSlug = resolvePlateSlug(input.vehiclePlate);
  const clientTag = slugifyName(input.customerName);
  const makeSafe = (input.vehicleMake ?? 'Unknown').replace(/[^a-zA-Z0-9]/g, '');

  return {
    intakeDateTag,
    plateSlug,
    clientTag,
    driveFolderName: `[${intakeDateTag}]_[${plateSlug}]_[${clientTag}]`,
    localFolderName: slugifyFolder(`${input.customerName} ${input.vehiclePlate}`),
    localFolderPath: path.join(LIBRARY_BASE, slugifyFolder(`${input.customerName} ${input.vehiclePlate}`)),
    clientId: `C-${clientTag}-${plateSlug}`,
    jobId: `JOB-${intakeDateTag.slice(0, 4)}-${intakeDateTag.slice(4, 6)}-${intakeDateTag.slice(6, 8)}-${makeSafe}-${plateSlug}-${clientTag}`,
  };
}

// ── Step 1: Local folders ──────────────────────────────────────────────────────

function createLocalFolders(folderPath: string): void {
  const subdirs = [
    '01_intake',
    '02_damage_photos',
    '03_repair_photos',
    '04_documents',
    '05_invoice',
    '06_internal',
  ];
  fs.mkdirSync(folderPath, { recursive: true });
  for (const sub of subdirs) {
    fs.mkdirSync(path.join(folderPath, sub), { recursive: true });
  }
}

// ── Step 2: Drive folders ──────────────────────────────────────────────────────

function q(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findFolder(drive: any, name: string, parentId: string | null): Promise<string | null> {
  const qStr = parentId
    ? `name='${q(name)}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${q(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await drive.files.list({ q: qStr, fields: 'files(id)', spaces: 'drive' });
  return res.data.files?.[0]?.id ?? null;
}

async function getOrCreateFolder(drive: any, name: string, parentId: string | null): Promise<string> {
  const existing = await findFolder(drive, name, parentId);
  if (existing) return existing;
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  });
  return created.data.id;
}

async function createDriveFolders(drive: any, folderName: string): Promise<string> {
  const rootId = await getOrCreateFolder(drive, DRIVE_ROOT_NAME, null);
  const jobsId = await getOrCreateFolder(drive, DRIVE_JOBS_FOLDER, rootId);
  const orderId = await getOrCreateFolder(drive, folderName, jobsId);
  await Promise.all([
    getOrCreateFolder(drive, '01_Documente_Client', orderId),
    getOrCreateFolder(drive, '02_Media_Daune', orderId),
    getOrCreateFolder(drive, '03_Expertiza_Tehnica', orderId),
    getOrCreateFolder(drive, '04_Comunicare_Asigurare', orderId),
  ]);
  return `https://drive.google.com/drive/folders/${orderId}`;
}

// ── Step 3: Calendar event ─────────────────────────────────────────────────────

async function findWritableCalendar(calendar: any): Promise<string> {
  const list = await calendar.calendarList.list();
  const items: any[] = list.data.items ?? [];
  const preferred = items.find((c) => c.summary === 'Corion GmbH' || c.primary);
  return preferred?.id ?? items[0]?.id ?? 'primary';
}

function formatCalendarPrice(input: IntakeInput): string {
  if (typeof input.totalAmountCents === 'number' && input.totalAmountCents > 0) {
    const eur = Math.round(input.totalAmountCents / 100);
    const notes = input.notes?.toLowerCase() ?? '';
    if (notes.includes('+ mwst') || notes.includes('mwst')) return `${eur} EUR + MwSt`;
    if (notes.includes('netto')) return `${eur} EUR Netto`;
    return `${eur} EUR`;
  }
  return 'Preis offen';
}

async function createCalendarEvent(
  calendar: any,
  input: IntakeInput,
  slugs: Slugs,
  driveFolderUrl: string | null,
): Promise<{ id: string; htmlLink: string }> {
  const calendarId = await findWritableCalendar(calendar);
  const vehicleLabel = `${input.vehicleMake}${input.vehicleModel ? ' ' + input.vehicleModel : ''}`.trim();
  const platePart = input.vehiclePlate ? `(${input.vehiclePlate})` : '';
  const priceLabel = formatCalendarPrice(input);
  const descLines = [
    `Kunde: ${input.customerName}`,
    input.customerAddress ? `Adresse: ${input.customerAddress}` : null,
    input.partnerName ? `Partner: ${input.partnerName}` : null,
    `Fahrzeug: ${vehicleLabel}${platePart ? ' ' + platePart : ''}`,
    `Schaden: ${input.damageDescription}`,
    input.datReference ? `DAT: ${input.datReference}` : null,
    driveFolderUrl ? `Drive: ${driveFolderUrl}` : null,
  ].filter(Boolean).join('\n');

  const summary = [priceLabel, vehicleLabel || 'Fahrzeug', platePart || null, '—', input.customerName]
    .filter(Boolean)
    .join(' ');

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description: descLines,
      start: { dateTime: input.scheduledStart!, timeZone: 'Europe/Berlin' },
      end: { dateTime: input.scheduledEnd!, timeZone: 'Europe/Berlin' },
      location: input.customerAddress ?? '',
      colorId: '9',
    },
  });
  return { id: res.data.id, htmlLink: res.data.htmlLink };
}

// ── Step 5: CRM JSON update ────────────────────────────────────────────────────

function updateLocalCrm(
  order: { id: string; referenceNumber: string | null },
  input: IntakeInput,
  slugs: Slugs,
  calendarEventLink: string | null,
  driveFolderUrl: string | null,
): void {
  if (!fs.existsSync(CRM_JSON_PATH)) {
    console.warn(`[intake] CRM JSON not found at ${CRM_JSON_PATH} — skipping`);
    return;
  }
  const db = JSON.parse(fs.readFileSync(CRM_JSON_PATH, 'utf8'));
  if (!db.clients) db.clients = {};
  if (!db.jobs) db.jobs = {};

  db.clients[slugs.clientId] = {
    name: input.customerName,
    phone: input.customerPhone ?? null,
    address: input.customerAddress ?? null,
    email: input.customerEmail ?? null,
    type: input.customerType ?? 'B2C',
    created_at: slugs.intakeDateTag,
    vehicles: [{
      make: `${input.vehicleMake}${input.vehicleModel ? ' ' + input.vehicleModel : ''}`,
      license_plate: input.vehiclePlate,
      vin: input.vehicleVin ?? null,
    }],
    lifetime_value_eur: input.totalAmountCents != null ? +(input.totalAmountCents / 100).toFixed(2) : null,
    job_history: Array.from(new Set([...(db.clients[slugs.clientId]?.job_history ?? []), slugs.jobId])),
  };

  db.jobs[slugs.jobId] = {
    job_id: slugs.jobId,
    order_id: order.id,
    reference_number: order.referenceNumber,
    client_id: slugs.clientId,
    vehicle: `${input.vehicleMake}${input.vehicleModel ? ' ' + input.vehicleModel : ''} (${input.vehiclePlate})`,
    vin: input.vehicleVin ?? null,
    partner: input.partnerName ?? null,
    tasks: input.damageDescription,
    dat_reference: input.datReference ?? null,
    price_net: input.totalAmountCents != null
      ? +((input.totalAmountCents / 100) / 1.19).toFixed(2)
      : null,
    price_brutto: input.totalAmountCents != null
      ? +(input.totalAmountCents / 100).toFixed(2)
      : null,
    currency: 'EUR',
    date_received: `${slugs.intakeDateTag.slice(0, 4)}-${slugs.intakeDateTag.slice(4, 6)}-${slugs.intakeDateTag.slice(6, 8)}`,
    date_due: null,
    status: 'open',
    drive_folder: driveFolderUrl,
    local_folder: slugs.localFolderPath,
    notes: [
      `Intake ${slugs.intakeDateTag.slice(0, 4)}-${slugs.intakeDateTag.slice(4, 6)}-${slugs.intakeDateTag.slice(6, 8)}.`,
      calendarEventLink ? `Calendar: ${calendarEventLink}.` : null,
      input.notes ?? null,
    ].filter(Boolean).join(' '),
    intake_source: input.intakeSource ?? 'telegram_cora',
  };

  fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(db, null, 2));
}

// ── Main ───────────────────────────────────────────────────────────────────────

export async function executeIntake(input: IntakeInput): Promise<IntakeResult> {
  // Resolve system user for createdBy (required FK).
  let systemUserId = process.env.CORION_SYSTEM_USER_ID ?? '';
  if (!systemUserId) {
    const adminUser = await storage.getUserByEmail('adrianlackdoktor@gmail.com');
    if (!adminUser) throw new Error('Cannot resolve system user for createdBy — set CORION_SYSTEM_USER_ID env var');
    systemUserId = adminUser.id;
  }

  // Resolve partner.
  let resolvedPartnerId: string | null = input.partnerId ?? null;
  let resolvedPartnerName: string | null = input.partnerName ?? null;

  if (!resolvedPartnerId && input.partnerName) {
    const partners = await storage.getUsersByRole('partner');
    const match = partners.find(
      (p) => p.firstName?.toLowerCase() === input.partnerName!.toLowerCase(),
    );
    if (match) {
      resolvedPartnerId = match.id;
      resolvedPartnerName = match.firstName ?? input.partnerName;
    }
  }

  const slugs = computeSlugs(input);
  const pendingSteps: string[] = [];

  // 1. Local folders — always succeeds.
  createLocalFolders(slugs.localFolderPath);

  // 2. Drive folders — fail-soft.
  let driveFolderUrl: string | null = null;
  try {
    const { drive } = getDriveAndCalendarFromSavedOAuth();
    driveFolderUrl = await createDriveFolders(drive, slugs.driveFolderName);
  } catch (err: any) {
    console.warn('[intake] Drive folder creation failed (non-fatal):', err?.message);
    pendingSteps.push('drive_folder');
  }

  // 3. Calendar event — fail-soft, only when slot provided.
  let calendarEventId: string | null = null;
  let calendarEventLink: string | null = null;
  if (input.scheduledStart && input.scheduledEnd) {
    try {
      const { calendar } = getDriveAndCalendarFromSavedOAuth();
      const event = await createCalendarEvent(calendar, input, slugs, driveFolderUrl);
      calendarEventId = event.id;
      calendarEventLink = event.htmlLink;
    } catch (err: any) {
      console.warn('[intake] Calendar event creation failed (non-fatal):', err?.message);
      pendingSteps.push('calendar_event');
    }
  } else {
    pendingSteps.push('scheduling');
  }

  // 4. DB insert — required.
  const order = await storage.createWorkshopOrder({
    orderDate: new Date(),
    customerName: input.customerName,
    customerAddress: input.customerAddress ?? null,
    customerPhone: input.customerPhone ?? null,
    customerEmail: input.customerEmail ?? null,
    vehicleMake: input.vehicleMake,
    vehicleModel: input.vehicleModel ?? null,
    vehiclePlate: input.vehiclePlate,
    vehicleVin: input.vehicleVin ?? null,
    vehicleColor: input.vehicleColor ?? null,
    vehicleMileage: input.vehicleMileage ?? null,
    damageDescription: input.damageDescription,
    partnerId: resolvedPartnerId,
    status: 'open',
    paymentStatus: 'offen',
    totalAmountCents: input.totalAmountCents ?? 0,
    laborAmountCents: input.laborAmountCents ?? 0,
    partsAmountCents: input.partsAmountCents ?? 0,
    driveFolderUrl,
    localFolderPath: slugs.localFolderPath,
    scheduledDate: input.scheduledStart ? new Date(input.scheduledStart) : null,
    repairProtocolJson: {
      jobId: slugs.jobId,
      clientId: slugs.clientId,
      datReference: input.datReference ?? null,
      calendarEventId,
      calendarEventLink,
      intakeDate: `${slugs.intakeDateTag.slice(0, 4)}-${slugs.intakeDateTag.slice(4, 6)}-${slugs.intakeDateTag.slice(6, 8)}`,
      intakeSource: input.intakeSource ?? 'telegram_cora',
      notes: input.notes ?? null,
      intakeConversation: input.conversationTranscript ?? null,
    },
    createdBy: systemUserId,
    // Computed fields — start at zero, set later via finance engine.
    partnerCommissionCentsCalc: 0,
    partnerPayoutNetCents: 0,
    corionShareCents: 0,
    materialDeductionCents: 0,
    warrantyRetentionCents: 0,
  });

  // 5. CRM JSON — fail-soft.
  try {
    updateLocalCrm(order, input, slugs, calendarEventLink, driveFolderUrl);
  } catch (err: any) {
    console.warn('[intake] CRM JSON update failed (non-fatal):', err?.message);
    pendingSteps.push('crm_update');
  }

  // 6. Attachments — fail-soft. Resolves localPath / telegramFileId / driveLink refs,
  //    uploads to Drive order folder, and creates canonical file_attachments rows.
  let attachmentsCreated = 0;
  if (input.attachments?.length) {
    try {
      const result = await processAttachments(
        order.id,
        input.attachments,
        driveFolderUrl,
        systemUserId,
      );
      attachmentsCreated = result.created;
      if (result.failed > 0) {
        pendingSteps.push(`media_upload_failed_${result.failed}`);
      }
    } catch (err: any) {
      console.warn('[intake] attachment processing failed (non-fatal):', err?.message);
      pendingSteps.push('media_upload');
    }
  }

  console.log(
    `[intake] complete — order ${order.id} (${order.referenceNumber}),` +
    ` attachments: ${attachmentsCreated}, pending: ${pendingSteps.join(', ') || 'none'}`,
  );

  return {
    orderId: order.id,
    referenceNumber: order.referenceNumber!,
    localFolderPath: slugs.localFolderPath,
    driveFolderUrl,
    calendarEventId,
    calendarEventLink,
    partnerId: resolvedPartnerId,
    partnerName: resolvedPartnerName,
    attachmentsCreated,
    pendingSteps,
  };
}
