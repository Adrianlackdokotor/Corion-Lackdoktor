import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

app.use((req, res, next) => {
  if (req.hostname.toLowerCase() === "app.corion.app") {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  next();
});

const PUBLIC_INTAKE_ORIGINS = new Set([
  "https://corion.app",
  "https://www.corion.app",
]);

app.use("/api/client/submit-request", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && PUBLIC_INTAKE_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    return origin && PUBLIC_INTAKE_ORIGINS.has(origin)
      ? res.status(204).end()
      : res.status(403).end();
  }
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '100mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.get("/api/health/live", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get("/api/health/ready", (_req: Request, res: Response) => {
    const required = {
      database: !!process.env.DATABASE_URL,
      sessionSecret: !!process.env.SESSION_SECRET,
      canonicalBaseUrl: process.env.CORION_BASE_URL === "https://app.corion.app",
      productionBinding: process.env.HOST === "127.0.0.1" && process.env.PORT === "3001",
      systemUser: !!process.env.CORION_SYSTEM_USER_ID,
    };
    const optional = {
      googleOAuthClient: !!process.env.CORION_GOOGLE_OAUTH_CLIENT_JSON,
      googleOAuthRedirect: !!process.env.CORION_GOOGLE_OAUTH_REDIRECT_URI,
      telegramBot: !!process.env.TELEGRAM_BOT_TOKEN,
      telegramWebhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      telegramAllowedChats: !!process.env.TELEGRAM_ALLOWED_CHAT_IDS,
    };
    const ok = Object.values(required).every(Boolean);
    res.status(ok ? 200 : 503).json({ ok, required, optional });
  });

  app.get("/robots.txt", (req: Request, res: Response, next: NextFunction) => {
    if (req.hostname.toLowerCase() !== "app.corion.app") return next();
    res.type("text/plain").send("User-agent: *\nDisallow: /\n");
  });

  // Reject unknown /api/* paths with JSON 404 BEFORE Vite's HTML catch-all,
  // so missing endpoints don't masquerade as 200 HTML responses.
  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({ message: "API endpoint not found", path: req.originalUrl });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0");
  server.listen({
    port,
    host,
  }, () => {
    log(`serving on ${host}:${port}`);
  });
})();
