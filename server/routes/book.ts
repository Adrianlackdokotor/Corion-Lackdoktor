import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';

const BOOK_DIR = '/Users/corionhub/.openclaw/workspace/Hub+1-Book';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLayout(title: string, body: string) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#0a0a0a; color:#f5f5f5; }
    .wrap { max-width: 920px; margin: 0 auto; padding: 24px 16px 64px; }
    a { color: #8ab4ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .card { background:#111; border:1px solid #262626; border-radius:16px; padding:16px; }
    h1,h2 { line-height:1.15; }
    .muted { color:#a1a1aa; }
    .list a { display:block; padding:10px 12px; border-radius:12px; background:#0f0f10; border:1px solid #232326; margin-bottom:10px; }
    pre { white-space: pre-wrap; word-break: break-word; font-family: ui-monospace,SFMono-Regular,Menlo,monospace; font-size: 14px; line-height: 1.55; }
    .top { margin-bottom: 18px; }
  </style>
</head>
<body>
  <div class="wrap">${body}</div>
</body>
</html>`;
}

export function registerBookRoutes(app: Express): void {
  app.get('/book', (_req: Request, res: Response) => {
    try {
      const files = fs.readdirSync(BOOK_DIR)
        .filter((f) => f.toLowerCase().endsWith('.md'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const items = files.map((file) => {
        const slug = encodeURIComponent(file);
        return `<a href="/book/${slug}">${esc(file.replace(/\.md$/i, ''))}</a>`;
      }).join('');

      res.type('html').send(renderLayout('Hub+1 Book', `
        <div class="top">
          <h1>Hub+1 Book</h1>
          <div class="muted">Telefon-taugliche Webansicht der Kapitel.</div>
        </div>
        <div class="card list">${items}</div>
      `));
    } catch (err: any) {
      res.status(500).type('html').send(renderLayout('Book error', `<div class="card"><h1>Fehler</h1><pre>${esc(err?.message || String(err))}</pre></div>`));
    }
  });

  app.get('/book/:file', (req: Request, res: Response) => {
    try {
      const file = path.basename(req.params.file);
      const full = path.join(BOOK_DIR, file);
      if (!full.startsWith(BOOK_DIR) || !fs.existsSync(full)) {
        return res.status(404).type('html').send(renderLayout('Nicht gefunden', '<div class="card"><h1>Nicht gefunden</h1></div>'));
      }
      const raw = fs.readFileSync(full, 'utf8');
      res.type('html').send(renderLayout(file, `
        <div class="top"><a href="/book">← Zur Übersicht</a></div>
        <div class="card">
          <h1>${esc(file.replace(/\.md$/i, ''))}</h1>
          <pre>${esc(raw)}</pre>
        </div>
      `));
    } catch (err: any) {
      res.status(500).type('html').send(renderLayout('Book error', `<div class="card"><h1>Fehler</h1><pre>${esc(err?.message || String(err))}</pre></div>`));
    }
  });
}
