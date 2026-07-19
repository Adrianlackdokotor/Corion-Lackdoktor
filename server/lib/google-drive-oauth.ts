import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const OAUTH_CLIENT_PATH = process.env.CORION_GOOGLE_OAUTH_CLIENT_JSON
  || '/Users/corionhub/Downloads/client_secret_1071950188592-8o7fptksn128stqehmeuaqcttehdl8m5.apps.googleusercontent.com.json';

const OAUTH_TOKEN_PATH = process.env.CORION_GOOGLE_OAUTH_TOKEN_JSON
  || path.resolve(process.cwd(), '.local/google-drive-oauth-token.json');

const DEFAULT_APP_URL = process.env.NODE_ENV === 'production'
  ? 'https://app.corion.app'
  : 'http://localhost:3000';

const REDIRECT_URI = process.env.CORION_GOOGLE_OAUTH_REDIRECT_URI
  || `${process.env.CORION_PUBLIC_APP_URL || DEFAULT_APP_URL}/api/google/oauth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar',
];

type InstalledCreds = {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris?: string[];
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris?: string[];
  };
};

function getOAuthClient() {
  if (!fs.existsSync(OAUTH_CLIENT_PATH)) {
    throw new Error(`OAuth client JSON not found at ${OAUTH_CLIENT_PATH}`);
  }

  const raw = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH, 'utf8')) as InstalledCreds;
  const cfg = raw.web || raw.installed;
  if (!cfg?.client_id || !cfg?.client_secret) {
    throw new Error('OAuth client JSON missing client_id/client_secret');
  }

  return new google.auth.OAuth2(cfg.client_id, cfg.client_secret, REDIRECT_URI);
}

export function getGoogleOAuthAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function saveGoogleOAuthTokenFromCode(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  fs.mkdirSync(path.dirname(OAUTH_TOKEN_PATH), { recursive: true });
  fs.writeFileSync(OAUTH_TOKEN_PATH, JSON.stringify(tokens, null, 2));
  client.setCredentials(tokens);
  return tokens;
}

export function hasSavedGoogleOAuthToken() {
  return fs.existsSync(OAUTH_TOKEN_PATH);
}

export function getDriveClientFromSavedOAuth() {
  if (!fs.existsSync(OAUTH_TOKEN_PATH)) {
    throw new Error(`OAuth token JSON not found at ${OAUTH_TOKEN_PATH}`);
  }
  const client = getOAuthClient();
  const tokens = JSON.parse(fs.readFileSync(OAUTH_TOKEN_PATH, 'utf8'));
  client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: client });
}

export function getCalendarClientFromSavedOAuth() {
  if (!fs.existsSync(OAUTH_TOKEN_PATH)) {
    throw new Error(`OAuth token JSON not found at ${OAUTH_TOKEN_PATH}`);
  }
  const client = getOAuthClient();
  const tokens = JSON.parse(fs.readFileSync(OAUTH_TOKEN_PATH, 'utf8'));
  client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: client });
}

export function getDriveAndCalendarFromSavedOAuth() {
  if (!fs.existsSync(OAUTH_TOKEN_PATH)) {
    throw new Error(`OAuth token JSON not found at ${OAUTH_TOKEN_PATH}`);
  }
  const client = getOAuthClient();
  const tokens = JSON.parse(fs.readFileSync(OAUTH_TOKEN_PATH, 'utf8'));
  client.setCredentials(tokens);
  return {
    drive: google.drive({ version: 'v3', auth: client }),
    calendar: google.calendar({ version: 'v3', auth: client }),
  };
}
