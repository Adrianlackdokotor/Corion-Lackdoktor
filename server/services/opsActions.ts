// General operational actions callable via the task bus.
//
// Handlers for:
//   drive_upload            — uploads a local file (e.g. from Telegram media inbox) to Drive
//   calendar_event_create   — creates a Google Calendar event
//   calendar_event_patch    — updates an existing event (description, location, attachments)
//   task_create             — creates a board_tasks row (visible in admin task board)
//   document_reference      — records a document reference (board task note or order annotation)
//
// All handlers are fail-explicit (throw on required-field errors) so the bus
// writes a useful error result rather than silently dropping data.

import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { getCalendarClientFromSavedOAuth, getDriveClientFromSavedOAuth } from '../lib/google-drive-oauth';
import { processAttachments, type AttachmentRef } from './mediaIngest';

// ── Drive file URL → fileId helper ─────────────────────────────────────────────
// Accepts: https://drive.google.com/file/d/FILE_ID/view  (or /edit)
//          https://drive.google.com/open?id=FILE_ID
// Returns the raw fileId, or the input unchanged if not parseable.
function extractDriveFileId(url: string): string {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : url;
}

// ── Shared helper ──────────────────────────────────────────────────────────────

async function resolveSystemUserId(): Promise<string | null> {
  const env = process.env.CORION_SYSTEM_USER_ID;
  if (env?.trim()) return env.trim();
  const admin = await storage.getUserByEmail('adrianlackdoktor@gmail.com');
  return admin?.id ?? null;
}

async function resolveUserId(name?: string | null, id?: string | null): Promise<string | null> {
  if (id) return id;
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower === 'adrian' || lower === 'admin') {
    return (await storage.getUserByEmail('adrianlackdoktor@gmail.com'))?.id ?? null;
  }
  const partners = await storage.getUsersByRole('partner');
  return partners.find((p) => p.firstName?.toLowerCase() === lower)?.id ?? null;
}

async function findWritableCalendar(calendar: any): Promise<string> {
  const list = await calendar.calendarList.list();
  const items: any[] = list.data.items ?? [];
  const preferred = items.find((c) => c.summary === 'Corion GmbH' || c.primary);
  return preferred?.id ?? items[0]?.id ?? 'primary';
}

// ── drive_upload ───────────────────────────────────────────────────────────────
// Uploads a local file to Google Drive. Designed for Telegram-inbound media:
// Cora can drop a task with the local media path; the result contains the Drive
// fileUrl and fileId needed for calendar_event_patch attachments.

export interface DriveUploadInput {
  localPath: string;                    // required — absolute local file path
  filename?: string | null;             // Drive display name (defaults to basename)
  mimeType?: string | null;             // defaults to image/jpeg
  description?: string | null;
  parentFolderId?: string | null;       // Drive folder ID (defaults to root)
  parentFolderUrl?: string | null;      // Drive folder URL, preferred over root uploads
}

export interface DriveUploadResult {
  fileId: string;
  filename: string;
  fileUrl: string;                      // webViewLink — use as fileUrl in attachments[]
  mimeType: string;
}

export async function driveUpload(input: DriveUploadInput): Promise<DriveUploadResult> {
  if (!input.localPath) throw new Error('drive_upload: localPath is required');
  if (!fs.existsSync(input.localPath)) {
    throw new Error(`drive_upload: file not found at ${input.localPath}`);
  }

  const drive = getDriveClientFromSavedOAuth();
  const filename = input.filename ?? path.basename(input.localPath);
  const mimeType = input.mimeType ?? 'image/jpeg';

  const meta: Record<string, unknown> = { name: filename, mimeType };
  if (input.description) meta.description = input.description;
  const resolvedParentFolderId = input.parentFolderId
    ?? (input.parentFolderUrl ? extractDriveFileId(input.parentFolderUrl) : null);
  if (resolvedParentFolderId) meta.parents = [resolvedParentFolderId];

  const res = await (drive as any).files.create({
    requestBody: meta,
    media: { mimeType, body: fs.createReadStream(input.localPath) },
    fields: 'id,name,webViewLink,mimeType',
  });

  return {
    fileId:   res.data.id,
    filename: res.data.name,
    fileUrl:  res.data.webViewLink,
    mimeType: res.data.mimeType,
  };
}

// ── calendar_event_create ──────────────────────────────────────────────────────

export interface CalendarAttachment {
  fileUrl: string;     // Google Drive file URL or direct fileId
  title?: string | null;
  mimeType?: string | null;
}

export interface CalendarEventInput {
  summary: string;                    // required — event title
  start: string;                      // required — ISO datetime with timezone e.g. "2026-05-19T09:00:00+02:00"
  end?: string | null;                // defaults to start + 1 hour
  location?: string | null;
  description?: string | null;
  notes?: string | null;              // appended to description
  colorId?: string | null;            // "1"–"11" (Google Calendar color)
  attachments?: CalendarAttachment[] | null;  // Drive files attached to the event
}

export interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
  summary: string;
  start: string;
  end: string;
  location: string | null;
  attachmentCount: number;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  if (!input.summary) throw new Error('calendar_event_create: summary is required');
  if (!input.start) throw new Error('calendar_event_create: start is required');

  const calendar = getCalendarClientFromSavedOAuth();
  const calendarId = await findWritableCalendar(calendar);

  // Default end: start + 1 hour
  let endTime = input.end;
  if (!endTime) {
    const s = new Date(input.start);
    s.setHours(s.getHours() + 1);
    endTime = s.toISOString();
  }

  const descParts = [input.description, input.notes].filter(Boolean);
  const attachments = (input.attachments ?? []).map((a) => ({
    fileUrl:  a.fileUrl,
    title:    a.title   ?? undefined,
    mimeType: a.mimeType ?? undefined,
  }));
  const hasAttachments = attachments.length > 0;

  const res = await calendar.events.insert({
    calendarId,
    supportsAttachments: hasAttachments || undefined,
    requestBody: {
      summary: input.summary,
      description: descParts.join('\n\n') || undefined,
      start: { dateTime: input.start, timeZone: 'Europe/Berlin' },
      end:   { dateTime: endTime,      timeZone: 'Europe/Berlin' },
      location: input.location ?? undefined,
      colorId: input.colorId ?? '1',
      attachments: hasAttachments ? attachments : undefined,
    },
  });

  return {
    eventId:         res.data.id!,
    htmlLink:        res.data.htmlLink!,
    summary:         res.data.summary!,
    start:           res.data.start?.dateTime ?? input.start,
    end:             res.data.end?.dateTime   ?? endTime,
    location:        input.location ?? null,
    attachmentCount: res.data.attachments?.length ?? 0,
  };
}

// ── calendar_event_patch ───────────────────────────────────────────────────────
// Updates an existing event: description, location, attachments, or any combo.
// Attachments are additive by default (merged with existing). Set replaceAttachments
// to true to overwrite the current attachment list entirely.

export interface CalendarEventPatchInput {
  eventId: string;                          // required — ID returned by calendar_event_create
  calendarId?: string | null;               // defaults to the primary writable calendar
  description?: string | null;              // replaces description if set
  location?: string | null;
  attachments?: CalendarAttachment[] | null;
  replaceAttachments?: boolean;             // false = merge with existing (default)
}

export interface CalendarEventPatchResult {
  eventId: string;
  htmlLink: string;
  attachmentCount: number;
  description: string | null;
}

export async function patchCalendarEvent(input: CalendarEventPatchInput): Promise<CalendarEventPatchResult> {
  if (!input.eventId) throw new Error('calendar_event_patch: eventId is required');

  const calendar = getCalendarClientFromSavedOAuth();
  const calendarId = input.calendarId ?? await findWritableCalendar(calendar);

  const newAttachments = (input.attachments ?? []).map((a) => ({
    fileUrl:  a.fileUrl,
    title:    a.title   ?? undefined,
    mimeType: a.mimeType ?? undefined,
  }));

  // Merge with existing unless caller wants full replace
  let finalAttachments: typeof newAttachments | undefined;
  if (newAttachments.length > 0 || input.replaceAttachments) {
    if (!input.replaceAttachments && newAttachments.length > 0) {
      const existing = await calendar.events.get({ calendarId, eventId: input.eventId });
      const existingAtt = (existing.data.attachments ?? []).map((a: any) => ({
        fileUrl:  a.fileUrl,
        title:    a.title,
        mimeType: a.mimeType,
      }));
      // Deduplicate by fileUrl
      const seen = new Set(existingAtt.map((a: any) => a.fileUrl));
      finalAttachments = [...existingAtt, ...newAttachments.filter((a) => !seen.has(a.fileUrl))];
    } else {
      finalAttachments = newAttachments;
    }
  }

  const body: Record<string, unknown> = {};
  if (input.description !== undefined) body.description = input.description ?? undefined;
  if (input.location    !== undefined) body.location    = input.location    ?? undefined;
  if (finalAttachments  !== undefined) body.attachments  = finalAttachments;

  const res = await calendar.events.patch({
    calendarId,
    eventId: input.eventId,
    supportsAttachments: true,
    requestBody: body,
  });

  return {
    eventId:         res.data.id!,
    htmlLink:        res.data.htmlLink!,
    attachmentCount: res.data.attachments?.length ?? 0,
    description:     res.data.description ?? null,
  };
}

// ── task_create ────────────────────────────────────────────────────────────────

export interface TaskCreateInput {
  title: string;                          // required
  description?: string | null;
  assignedToName?: string | null;         // e.g. "Adrian" — resolved to user UUID
  assignedToId?: string | null;           // direct UUID (takes precedence)
  dueDate?: string | null;                // ISO date or datetime
  priority?: 'routine' | 'normal' | 'high' | 'critical' | null;
  column?: 'todo' | 'in_progress' | 'review' | 'done' | null;
  relatedOrderId?: string | null;
  driveFolderUrl?: string | null;
  notes?: string | null;                  // appended to description
  source?: string | null;
}

export interface TaskCreateResult {
  taskId: string;
  title: string;
  column: string;
  assignedToId: string | null;
  dueDate: string | null;
}

export async function createTask(input: TaskCreateInput): Promise<TaskCreateResult> {
  if (!input.title) throw new Error('task_create: title is required');

  const createdBy = await resolveSystemUserId();
  const assignedTo = await resolveUserId(input.assignedToName, input.assignedToId);

  const descParts = [input.description, input.notes].filter(Boolean);

  const task = await storage.createBoardTask({
    title:         input.title,
    description:   descParts.join('\n\n') || null,
    column:        input.column ?? 'todo',
    priority:      input.priority ?? 'normal',
    assignedTo:    assignedTo,
    relatedOrderId: input.relatedOrderId ?? null,
    dueDate:       input.dueDate ? new Date(input.dueDate) : null,
    source:        input.source ?? 'telegram_cora',
    driveFolderUrl: input.driveFolderUrl ?? null,
    createdBy,
  });

  return {
    taskId:      task.id,
    title:       task.title,
    column:      task.column,
    assignedToId: task.assignedTo ?? null,
    dueDate:     task.dueDate?.toISOString() ?? null,
  };
}

// ── document_reference ─────────────────────────────────────────────────────────
//
// Records a document reference without requiring the physical file to be uploaded.
// If relatedOrderId is provided, the reference is appended to the order's
// repairProtocolJson.documentRefs array. Otherwise a board task is created to
// surface the reference in the admin task board.
//
// Limitation: physical file content / Drive upload requires a separate upload step.

export interface DocumentReferenceInput {
  title: string;                          // required — document name or description
  notes?: string | null;
  url?: string | null;                    // URL if available (Drive link, scan URL, etc.)
  filePath?: string | null;               // Local filesystem path if available
  relatedOrderId?: string | null;         // Link to a workshop order
  createTask?: boolean;                   // Always create a board task (default true)
  assignedToName?: string | null;
  assignedToId?: string | null;
  dueDate?: string | null;
}

export interface DocumentReferenceResult {
  noted: boolean;
  taskId: string | null;
  orderId: string | null;
  limitation: string;
}

export async function documentReference(input: DocumentReferenceInput): Promise<DocumentReferenceResult> {
  if (!input.title) throw new Error('document_reference: title is required');

  const refNote = [
    `Dokument: ${input.title}`,
    input.notes  ? `Notizen: ${input.notes}` : null,
    input.url    ? `URL: ${input.url}` : null,
    input.filePath ? `Pfad: ${input.filePath}` : null,
  ].filter(Boolean).join('\n');

  let orderId: string | null = null;

  // Append to order if linked
  if (input.relatedOrderId) {
    const order = await storage.getWorkshopOrder(input.relatedOrderId);
    if (order) {
      const proto = (order.repairProtocolJson as any) ?? {};
      const refs: unknown[] = Array.isArray(proto.documentRefs) ? proto.documentRefs : [];
      refs.push({
        title:    input.title,
        url:      input.url ?? null,
        filePath: input.filePath ?? null,
        notes:    input.notes ?? null,
        addedAt:  new Date().toISOString(),
        source:   'telegram_cora',
      });
      await storage.updateWorkshopOrder(input.relatedOrderId, {
        repairProtocolJson: { ...proto, documentRefs: refs },
      } as any);
      orderId = input.relatedOrderId;
    }
  }

  // Always create a board task (unless explicitly disabled)
  let taskId: string | null = null;
  if (input.createTask !== false) {
    const result = await createTask({
      title:          `Dokument: ${input.title}`,
      description:    refNote,
      assignedToName: input.assignedToName,
      assignedToId:   input.assignedToId,
      dueDate:        input.dueDate,
      relatedOrderId: input.relatedOrderId,
      source:         'telegram_cora',
    });
    taskId = result.taskId;
  }

  return {
    noted:    true,
    taskId,
    orderId,
    limitation: 'Reference stored as a board task note. Physical file upload to Drive requires a separate upload step.',
  };
}

// ── order_schedule ─────────────────────────────────────────────────────────────
// Closes the scheduling pending step for an existing workshop order.
//
// Typical use: intake created the order (no date yet) → customer confirms date
// via Telegram → Cora writes an order_schedule bus task.
//
// What it does:
//   1. Loads the existing order for vehicle/customer context
//   2. Creates a Google Calendar event with that context
//   3. Updates workshop_orders.scheduled_date
//   4. Merges calendarEventId + calendarEventLink back into repair_protocol_json
//
// Unlike calendar_event_create, this action is order-aware: the calendar event
// and the DB row stay in sync. No orphan calendar events.

export interface OrderScheduleInput {
  orderId: string;           // required — existing workshop_orders UUID
  scheduledStart: string;    // required — ISO datetime
  scheduledEnd: string;      // required — ISO datetime
  location?: string | null;
  notes?: string | null;
}

export interface OrderScheduleResult {
  orderId: string;
  referenceNumber: string | null;
  calendarEventId: string;
  calendarEventLink: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export async function scheduleOrder(input: OrderScheduleInput): Promise<OrderScheduleResult> {
  if (!input.orderId)        throw new Error('order_schedule: orderId is required');
  if (!input.scheduledStart) throw new Error('order_schedule: scheduledStart is required');
  if (!input.scheduledEnd)   throw new Error('order_schedule: scheduledEnd is required');

  // 1. Load existing order for context.
  const order = await storage.getWorkshopOrder(input.orderId);
  if (!order) throw new Error(`order_schedule: order not found: ${input.orderId}`);

  // 2. Build calendar summary + description from order fields.
  const vehiclePart = [order.vehicleMake, order.vehicleModel].filter(Boolean).join(' ');
  const proto = (order.repairProtocolJson as Record<string, unknown> | null) ?? {};
  const inferredPrice = typeof proto?.pricing === 'object' && proto?.pricing && 'netEur' in (proto.pricing as Record<string, unknown>)
    ? (proto.pricing as Record<string, unknown>).netEur
    : null;
  const totalNetEur = typeof order.totalAmountCents === 'number'
    ? Math.round(order.totalAmountCents / 100)
    : typeof inferredPrice === 'number'
      ? inferredPrice
      : null;
  const notesLower = input.notes?.toLowerCase() ?? '';
  const pricePart = totalNetEur
    ? notesLower.includes('+ mwst') || notesLower.includes('mwst')
      ? `${totalNetEur} EUR + MwSt`
      : notesLower.includes('netto')
        ? `${totalNetEur} EUR Netto`
        : `${totalNetEur} EUR`
    : 'Preis offen';
  const summary = [
    pricePart,
    vehiclePart || 'Fahrzeug',
    order.vehiclePlate ? `(${order.vehiclePlate})` : null,
    '—',
    order.customerName,
  ].filter(Boolean).join(' ');

  const descParts = [
    order.damageDescription   ?? null,
    order.referenceNumber     ? `Auftrag: ${order.referenceNumber}` : null,
    order.driveFolderUrl      ? `Drive: ${order.driveFolderUrl}`    : null,
    input.notes               ?? null,
  ].filter(Boolean);

  // 3. Create Google Calendar event.
  const calendar = getCalendarClientFromSavedOAuth();
  const calendarId = await findWritableCalendar(calendar);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description: descParts.join('\n') || undefined,
      location:    input.location ?? undefined,
      start:       { dateTime: input.scheduledStart, timeZone: 'Europe/Berlin' },
      end:         { dateTime: input.scheduledEnd,   timeZone: 'Europe/Berlin' },
      colorId:     '1',
    },
  });

  const calendarEventId   = res.data.id!;
  const calendarEventLink = res.data.htmlLink!;

  // 4. Update order: scheduledDate + merge calendar IDs into repairProtocolJson.
  const existingProtocol = (order.repairProtocolJson as Record<string, unknown> | null) ?? {};
  await storage.updateWorkshopOrder(input.orderId, {
    scheduledDate: new Date(input.scheduledStart),
    repairProtocolJson: {
      ...existingProtocol,
      calendarEventId,
      calendarEventLink,
      scheduledUpdatedAt: new Date().toISOString(),
    } as any,
  });

  return {
    orderId:          input.orderId,
    referenceNumber:  order.referenceNumber,
    calendarEventId,
    calendarEventLink,
    scheduledStart:   input.scheduledStart,
    scheduledEnd:     input.scheduledEnd,
  };
}

// ── media_attach ───────────────────────────────────────────────────────────────
// Attaches media to an existing workshop order without re-running intake.
// Typical use: photos arrive in a separate Telegram message after intake has
// already created the order. Cora writes a media_attach bus task with the
// orderId and the attachment refs.
//
// Resolves each ref (localPath / telegramFileId / driveLink) → uploads to
// Drive → creates canonical file_attachments rows.

export type { AttachmentRef };

export interface MediaAttachInput {
  orderId: string;                  // required — existing workshop_orders UUID
  attachments: AttachmentRef[];     // required — at least one ref
}

export interface MediaAttachResult {
  orderId: string;
  referenceNumber: string | null;
  created: number;
  failed: number;
}

export async function mediaAttach(input: MediaAttachInput): Promise<MediaAttachResult> {
  if (!input.orderId)           throw new Error('media_attach: orderId is required');
  if (!input.attachments?.length) throw new Error('media_attach: attachments array must not be empty');

  const order = await storage.getWorkshopOrder(input.orderId);
  if (!order) throw new Error(`media_attach: order not found: ${input.orderId}`);

  const systemUserId = await resolveSystemUserId();
  if (!systemUserId) throw new Error('media_attach: cannot resolve system user');

  const result = await processAttachments(
    input.orderId,
    input.attachments,
    order.driveFolderUrl ?? null,
    systemUserId,
  );

  return {
    orderId:         input.orderId,
    referenceNumber: order.referenceNumber,
    created:         result.created,
    failed:          result.failed,
  };
}
