// POST /api/supervisor/intake — Telegram-originated Auftrag intake.
//
// Accepts structured intake data from a trusted non-browser caller (Cora).
// Executes the full workflow synchronously:
//   1. Local library folder structure
//   2. Google Drive folder structure (fail-soft)
//   3. Google Calendar event (fail-soft, only when slot provided)
//   4. workshop_orders DB insert (canonical spine)
//   5. Local CRM JSON update (fail-soft)
//
// Returns the full result including orderId, referenceNumber, driveFolderUrl,
// calendarEventId, and pendingSteps for anything that couldn't be completed.
//
// Auth: same AGENT_TASK_SERVICE_TOKEN bearer path as supervisor/delegate.
//       Admin session cookie is also accepted for browser-side tooling.

import { timingSafeEqual } from 'crypto';
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { executeIntake } from '../services/auftragIntake';
import { isAuthenticated } from '../auth';

function ensureIntakeAuth(req: Request, res: Response): boolean {
  const sessionUser = (req as any).user;
  if (sessionUser?.role === 'admin') return true;

  const expected = process.env.AGENT_TASK_SERVICE_TOKEN;
  if (!expected) {
    res.status(503).json({ message: 'Intake endpoint not configured — AGENT_TASK_SERVICE_TOKEN not set' });
    return false;
  }

  const authHeader = req.headers.authorization ?? '';
  const candidate = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(expected);

  if (
    candidate.length > 0 &&
    candidateBuf.length === expectedBuf.length &&
    timingSafeEqual(candidateBuf, expectedBuf)
  ) {
    return true;
  }

  res.status(401).json({ message: 'Auth required' });
  return false;
}

const intakeSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerAddress: z.string().max(300).nullish(),
  customerPhone: z.string().max(50).nullish(),
  customerEmail: z.string().email().nullish(),
  customerType: z.enum(['B2B', 'B2C']).default('B2C'),

  vehicleMake: z.string().min(1).max(100),
  vehicleModel: z.string().max(100).nullish(),
  vehiclePlate: z.string().min(1).max(20),
  vehicleVin: z.string().max(17).nullish(),
  vehicleColor: z.string().max(50).nullish(),
  vehicleMileage: z.string().max(20).nullish(),

  damageDescription: z.string().min(1).max(2000),

  totalAmountCents: z.number().int().min(0).nullish(),
  laborAmountCents: z.number().int().min(0).nullish(),
  partsAmountCents: z.number().int().min(0).nullish(),

  datReference: z.string().max(50).nullish(),

  partnerName: z.string().max(100).nullish(),
  partnerId: z.string().uuid().nullish(),

  // Both required together to trigger calendar event creation.
  scheduledStart: z.string().nullish(), // ISO datetime with timezone
  scheduledEnd: z.string().nullish(),

  intakeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  intakeSource: z.string().max(50).default('telegram_cora'),
  notes: z.string().max(1000).nullish(),

  // Optional media attachment refs — processed after order creation.
  // Each item supplies exactly one of: localPath, telegramFileId, or driveLink.
  attachments: z.array(z.object({
    localPath:       z.string().nullish(),
    telegramFileId:  z.string().nullish(),
    driveLink:       z.string().url().nullish(),
    originalName:    z.string().max(255).nullish(),
    mimeType:        z.string().max(100).nullish(),
    category:        z.enum(['damage_photo', 'document', 'generic']).nullish(),
  })).max(20).nullish(),
});

// Minimal schema for partner-initiated intake (limited fields, no finance access).
const partnerIntakeSchema = z.object({
  customerName:      z.string().min(1).max(200),
  customerPhone:     z.string().max(50).nullish(),
  vehicleMake:       z.string().min(1).max(100),
  vehicleModel:      z.string().max(100).nullish(),
  vehiclePlate:      z.string().min(1).max(20),
  vehicleColor:      z.string().max(50).nullish(),
  vehicleMileage:    z.string().max(20).nullish(),
  damageDescription: z.string().min(1).max(2000),
  scheduledStart:    z.string().nullish(),
  scheduledEnd:      z.string().nullish(),
  notes:             z.string().max(500).nullish(),
});

export function registerIntakeRoutes(app: Express): void {
  app.post('/api/supervisor/intake', async (req: Request, res: Response) => {
    if (!ensureIntakeAuth(req, res)) return;

    const parsed = intakeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request', issues: parsed.error.issues });
    }

    try {
      const result = await executeIntake(parsed.data);
      res.status(201).json(result);
    } catch (err: any) {
      console.error('[intake route] error:', err?.message);
      res.status(500).json({
        message: 'Intake execution failed',
        error: err?.message ?? String(err),
      });
    }
  });

  // Admin browser-session intake — same executeIntake path as Telegram/Cora.
  app.post('/api/admin/intake', isAuthenticated, async (req: Request, res: Response) => {
    if ((req as any).user?.role !== 'admin') {
      return res.status(403).json({ message: 'Nur für Admins' });
    }
    const parsed = intakeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request', issues: parsed.error.issues });
    }
    try {
      const result = await executeIntake({ ...parsed.data, intakeSource: parsed.data.intakeSource ?? 'admin_manual' });
      res.status(201).json(result);
    } catch (err: any) {
      console.error('[admin/intake] error:', err?.message);
      res.status(500).json({ message: 'Intake execution failed', error: err?.message ?? String(err) });
    }
  });

  // Partner browser-session intake — limited schema, partner pre-assigned, admin reviews.
  app.post('/api/partner/intake', isAuthenticated, async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user?.role !== 'partner') {
      return res.status(403).json({ message: 'Nur für Partner' });
    }
    const parsed = partnerIntakeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request', issues: parsed.error.issues });
    }
    try {
      const result = await executeIntake({
        ...parsed.data,
        partnerId: user.id,
        intakeSource: 'partner_initiated',
      });
      res.status(201).json(result);
    } catch (err: any) {
      console.error('[partner/intake] error:', err?.message);
      res.status(500).json({ message: 'Intake fehlgeschlagen', error: err?.message ?? String(err) });
    }
  });
}
