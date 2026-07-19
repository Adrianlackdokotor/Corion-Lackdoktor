// Resend email client integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@corion-lackdoktor.de',
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Email not configured — set RESEND_API_KEY for production');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'noreply@corion-lackdoktor.de'
  };
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string;
}) {
  const { client, fromEmail } = await getResendClient();
  
  const result = await client.emails.send({
    from: fromEmail,
    to: options.to,
    cc: options.cc,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  
  return result;
}
