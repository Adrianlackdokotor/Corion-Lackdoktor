import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";

// Roadmap step 3: full CRUD for business-entity partners.
// All write operations are admin-only. Reads are available to any logged-in
// user (forms across the app need the partner directory).

const PARTNERSHIP_MODELS = ["Model_A", "Model_B", "Model_C", "Model_D"] as const;
const STATUSES = ["pending", "active", "suspended"] as const;

const partnerCreateSchema = z.object({
  name: z.string().trim().min(1, "Numele este obligatoriu"),
  email: z.string().trim().email().or(z.literal("")).default(""),
  phone: z.string().trim().default(""),
  city: z.string().trim().default(""),
  address: z.string().trim().default(""),
  zip: z.string().trim().default(""),
  country: z.string().trim().default("DE"),
  contactPerson: z.string().trim().default(""),
  status: z.enum(STATUSES).default("pending"),
  defaultPartnershipModel: z.enum(PARTNERSHIP_MODELS).default("Model_C"),
  defaultPartnerShare: z.coerce.number().int().min(0).max(100).default(40),
  defaultBdePercent: z.coerce.number().int().min(0).max(100).default(20),
  dailyCapacity: z.coerce.number().int().min(0).default(0),
  notes: z.string().default(""),
});

const partnerUpdateSchema = partnerCreateSchema.partial();

function getUserId(req: Request): string | null {
  const u = (req as any).user;
  return u?.id ?? u?.claims?.sub ?? null;
}

async function isAdmin(req: Request): Promise<boolean> {
  const id = getUserId(req);
  if (!id) return false;
  const u = await storage.getUser(id);
  return u?.role === "admin";
}

export function registerPartnersRoutes(app: Express) {
  // List partners (any authenticated user can read; supports ?status= filter).
  app.get("/api/partners", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const list = await storage.getPartners(status ? { status } : undefined);
      res.json(list);
    } catch (err: any) {
      console.error("[partners] list error", err);
      res.status(500).json({ message: "Failed to list partners" });
    }
  });

  app.get("/api/partners/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const p = await storage.getPartner(req.params.id);
      if (!p) return res.status(404).json({ message: "Partner not found" });
      res.json(p);
    } catch (err: any) {
      console.error("[partners] get error", err);
      res.status(500).json({ message: "Failed to load partner" });
    }
  });

  app.post("/api/partners", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    const parsed = partnerCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid partner", errors: parsed.error.flatten() });
    }
    try {
      const created = await storage.createPartner(parsed.data);
      res.status(201).json(created);
    } catch (err: any) {
      console.error("[partners] create error", err);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.patch("/api/partners/:id", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    const parsed = partnerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid partner", errors: parsed.error.flatten() });
    }
    try {
      const updated = await storage.updatePartner(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Partner not found" });
      res.json(updated);
    } catch (err: any) {
      console.error("[partners] update error", err);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", isAuthenticated, async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden — admin only" });
    try {
      await storage.deletePartner(req.params.id);
      res.status(204).send();
    } catch (err: any) {
      console.error("[partners] delete error", err);
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });
}
