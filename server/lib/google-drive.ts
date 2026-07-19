import fs from 'fs';
import { google } from 'googleapis';
import { getDriveClientFromSavedOAuth, hasSavedGoogleOAuthToken } from './google-drive-oauth';

let connectionSettings: any;

const CORION_FOLDER_NAME = 'Corion Lackdoktor - Dateien';
const DEFAULT_LOCAL_CREDS = '/Users/corionhub/Downloads/hidden-bond-494818-p8-e3ee31c415c6.json';

type DriveLike = ReturnType<typeof google.drive>;

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getLocalServiceAccountPath(): string | null {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.CORION_GOOGLE_SERVICE_ACCOUNT_JSON,
    DEFAULT_LOCAL_CREDS,
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function getAccessTokenFromReplitConnector() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error('Replit connector auth not available');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected via Replit connector');
  }
  return accessToken;
}

async function getDriveClientFromLocalServiceAccount(): Promise<DriveLike> {
  const credsPath = getLocalServiceAccountPath();
  if (!credsPath) {
    throw new Error('No local Google service-account credentials found');
  }

  const credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

async function getDriveClientFromReplitConnector(): Promise<DriveLike> {
  const accessToken = await getAccessTokenFromReplitConnector();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Prefer saved user OAuth token when available, then local service-account auth, then Replit connector.
export async function getUncachableGoogleDriveClient(): Promise<DriveLike> {
  try {
    if (hasSavedGoogleOAuthToken()) {
      return getDriveClientFromSavedOAuth();
    }
  } catch (oauthErr: any) {
    console.warn('Saved Google OAuth token unavailable:', oauthErr?.message || oauthErr);
  }

  try {
    return await getDriveClientFromLocalServiceAccount();
  } catch (localErr: any) {
    try {
      return await getDriveClientFromReplitConnector();
    } catch (connectorErr: any) {
      throw new Error(
        `Google Drive auth unavailable. local=${localErr?.message || localErr}; connector=${connectorErr?.message || connectorErr}`,
      );
    }
  }
}

async function getOrCreateFolder(drive: DriveLike, folderName: string, parentId?: string): Promise<string> {
  const safeName = escapeDriveQuery(folderName);
  const query = parentId
    ? `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const existing = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });
  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id as string;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  });

  return folder.data.id as string;
}

export async function createAuftragDriveFolders(orderRef: string): Promise<{
  rootFolderId: string;
  orderFolderId: string;
  subfolders: Record<string, string>;
}> {
  const drive = await getUncachableGoogleDriveClient();
  const rootFolderId = await getOrCreateFolder(drive, CORION_FOLDER_NAME);
  const orderFolderName = `Auftrag ${orderRef}`;
  const orderFolderId = await getOrCreateFolder(drive, orderFolderName, rootFolderId);

  const names = ['01_Auftrag', '02_Talon', '03_Schadenfotos', '04_Rechnung', '05_Intern'];
  const subfolders: Record<string, string> = {};
  for (const name of names) {
    subfolders[name] = await getOrCreateFolder(drive, name, orderFolderId);
  }

  return { rootFolderId, orderFolderId, subfolders };
}

export async function uploadToGoogleDrive(
  filename: string,
  mimeType: string,
  base64Data: string,
  orderRef?: string,
  subfolderName?: '01_Auftrag' | '02_Talon' | '03_Schadenfotos' | '04_Rechnung' | '05_Intern'
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = await getUncachableGoogleDriveClient();
  const rootFolderId = await getOrCreateFolder(drive, CORION_FOLDER_NAME);

  let targetFolderId = rootFolderId;
  if (orderRef) {
    const orderFolderId = await getOrCreateFolder(drive, `Auftrag ${orderRef}`, rootFolderId);
    targetFolderId = subfolderName
      ? await getOrCreateFolder(drive, subfolderName, orderFolderId)
      : orderFolderId;
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const { Readable } = await import('stream');
  const stream = Readable.from(buffer);

  const file: any = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [targetFolderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
  };
}

export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  const drive = await getUncachableGoogleDriveClient();
  await drive.files.delete({ fileId });
}

export async function listGoogleDriveFiles(orderRef?: string): Promise<any[]> {
  const drive = await getUncachableGoogleDriveClient();
  const rootFolderId = await getOrCreateFolder(drive, CORION_FOLDER_NAME);

  let targetFolderId = rootFolderId;
  if (orderRef) {
    targetFolderId = await getOrCreateFolder(drive, `Auftrag ${orderRef}`, rootFolderId);
  }

  const res = await drive.files.list({
    q: `'${targetFolderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
    orderBy: 'createdTime desc',
  });

  return res.data.files || [];
}
