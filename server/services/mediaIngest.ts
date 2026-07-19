// Media ingestion helper — shared by auftragIntake (step 6) and opsActions (media_attach bus task).
//
// Resolves attachment refs from three sources:
//   localPath      — absolute path on this machine (Cora's media inbox)
//   telegramFileId — Telegram Bot API file_id; downloaded on the fly via getFile + download
//   driveLink      — file already on Drive; skip upload, just create the DB row
//
// For each resolved ref:
//   1. Download / read buffer (if not driveLink-only)
//   2. Upload buffer to Drive order folder (fail-soft — still creates DB row on failure)
//   3. Create canonical file_attachments row linked to workshopOrderId
//
// All per-file errors are caught and counted; the caller decides whether to surface
// failures as pendingSteps.

import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { getDriveClientFromSavedOAuth } from '../lib/google-drive-oauth';

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

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AttachmentRef {
  localPath?: string | null;      // absolute path on this server (Cora inbox file)
  telegramFileId?: string | null; // Telegram Bot API file_id — resolved + downloaded here
  driveLink?: string | null;      // already on Drive — skip upload, just record in DB
  originalName?: string | null;
  mimeType?: string | null;
  category?: string | null;       // defaults to 'damage_photo'
}

export interface AttachProcessResult {
  created: number;
  failed: number;
}

// ── Telegram download ──────────────────────────────────────────────────────────

async function downloadTelegramFile(
  fileId: string,
): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[mediaIngest] TELEGRAM_BOT_TOKEN not set — cannot download file_id', fileId);
    return null;
  }

  try {
    const metaRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
    );
    if (!metaRes.ok) {
      console.warn(`[mediaIngest] getFile ${fileId} → HTTP ${metaRes.status}`);
      return null;
    }
    const meta = (await metaRes.json()) as any;
    const filePath: string | undefined = meta?.result?.file_path;
    if (!filePath) {
      console.warn(`[mediaIngest] getFile ${fileId}: no file_path in response`);
      return null;
    }

    const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!fileRes.ok) {
      console.warn(`[mediaIngest] file download ${filePath} → HTTP ${fileRes.status}`);
      return null;
    }

    const ab = await fileRes.arrayBuffer();
    const buffer = Buffer.from(ab);
    const ext = path.extname(filePath).toLowerCase() || '.jpg';
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.heic': 'image/heic',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return {
      buffer,
      mimeType: mimeMap[ext] ?? 'image/jpeg',
      filename: path.basename(filePath),
    };
  } catch (err: any) {
    console.warn(`[mediaIngest] Telegram download failed for ${fileId}:`, err?.message);
    return null;
  }
}

// ── Drive upload ───────────────────────────────────────────────────────────────

async function uploadBufferToDrive(
  drive: any,
  buffer: Buffer,
  filename: string,
  mimeType: string,
  parentFolderId: string | null,
): Promise<{ fileId: string; webViewLink: string } | null> {
  try {
    const { Readable } = await import('stream');
    const meta: Record<string, unknown> = { name: filename, mimeType };
    if (parentFolderId) meta.parents = [parentFolderId];
    const res = await drive.files.create({
      requestBody: meta,
      media: { mimeType, body: Readable.from(buffer) },
      fields: 'id,webViewLink',
    });
    return {
      fileId: res.data.id,
      webViewLink:
        res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
    };
  } catch (err: any) {
    console.warn('[mediaIngest] Drive upload failed:', err?.message);
    return null;
  }
}

function extractDriveFolderId(folderUrl: string | null): string | null {
  if (!folderUrl) return null;
  const m = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function categoryToSubfolder(category: string | null | undefined): string {
  switch (category) {
    case 'document':
      return '01_Documente_Client';
    case 'damage_photo':
      return '02_Media_Daune';
    default:
      return '02_Media_Daune';
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

export async function processAttachments(
  workshopOrderId: string,
  attachments: AttachmentRef[],
  driveFolderUrl: string | null,
  systemUserId: string,
): Promise<AttachProcessResult> {
  let created = 0;
  let failed = 0;

  const orderFolderId = extractDriveFolderId(driveFolderUrl);

  let drive: any | null = null;
  try {
    drive = getDriveClientFromSavedOAuth();
  } catch {
    // Drive unavailable — file_attachment rows still created; driveLink stays null
  }

  for (const ref of attachments) {
    try {
      let buffer: Buffer | null = null;
      let mimeType = ref.mimeType ?? 'image/jpeg';
      let filename = ref.originalName ?? `media_${Date.now()}.jpg`;
      let driveFileId: string | null = null;
      let driveLink: string | null = ref.driveLink ?? null;

      // ── Resolve source → buffer ──────────────────────────────────────────────
      if (ref.localPath) {
        try {
          buffer = fs.readFileSync(ref.localPath);
          filename = ref.originalName ?? path.basename(ref.localPath);
        } catch (err: any) {
          console.warn(`[mediaIngest] localPath read failed (${ref.localPath}):`, err?.message);
          failed++;
          continue;
        }
      } else if (ref.telegramFileId) {
        const downloaded = await downloadTelegramFile(ref.telegramFileId);
        if (!downloaded) {
          failed++;
          continue;
        }
        buffer = downloaded.buffer;
        mimeType = ref.mimeType ?? downloaded.mimeType;
        filename = ref.originalName ?? downloaded.filename;
      }
      // driveLink-only: buffer stays null, just record the existing link

      // ── Upload to Drive (skip when no buffer or Drive unavailable) ────────────
      if (buffer && drive) {
        const uploadName = `${Date.now()}-${filename}`;
        let targetFolderId = orderFolderId;
        if (orderFolderId) {
          const subfolder = categoryToSubfolder(ref.category);
          targetFolderId = await getOrCreateFolder(drive, subfolder, orderFolderId);
        }
        const uploaded = await uploadBufferToDrive(drive, buffer, uploadName, mimeType, targetFolderId);
        if (uploaded) {
          driveFileId = uploaded.fileId;
          driveLink = uploaded.webViewLink;
        }
      }

      // ── Create canonical file_attachment row ──────────────────────────────────
      // For driveLink-only refs (no local buffer): data = '' and size = 0.
      // The partner gallery and admin UI use driveLink when available, so they
      // won't call the file-serving endpoint for these rows.
      await storage.createFileAttachment({
        workshopOrderId,
        filename: `${Date.now()}-${filename}`,
        originalName: filename,
        mimeType,
        size: buffer ? buffer.length : 0,
        data: buffer ? buffer.toString('base64') : '',
        driveFileId,
        driveLink,
        uploadedBy: systemUserId,
        category: ref.category ?? 'damage_photo',
      });
      created++;
    } catch (err: any) {
      console.warn('[mediaIngest] attachment failed:', err?.message);
      failed++;
    }
  }

  return { created, failed };
}
