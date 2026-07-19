import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import { logAudit } from "./auditLog";

export const createPartnerAccountSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  taxNumber: z.string().trim().max(100).optional().nullable(),
  partnerSharePercent: z.coerce.number().int().min(0).max(100).default(40),
  materialPercent: z.coerce.number().int().min(0).max(100).default(20),
  partnerModel: z.enum(["A", "B", "C", "D"]).default("B"),
  preferredLanguage: z.enum(["de", "ro", "en"]).default("de"),
});

export type CreatePartnerAccountInput = z.input<typeof createPartnerAccountSchema>;

export async function createPartnerAccount(
  input: CreatePartnerAccountInput,
  actor?: { userId?: string | null; label?: string | null; ip?: string | null },
) {
  const data = createPartnerAccountSchema.parse(input);
  const existing = await storage.getUserByEmail(data.email);
  if (existing) {
    const error = new Error("PARTNER_ACCOUNT_EXISTS");
    (error as any).existingUserId = existing.id;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await storage.createUser({
    email: data.email,
    password: passwordHash,
    role: "partner",
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    phone: data.phone || null,
    company: data.company || null,
    address: data.address || null,
    city: data.city || null,
    postalCode: data.postalCode || null,
    taxNumber: data.taxNumber || null,
    partnerSharePercent: data.partnerSharePercent,
    materialPercent: data.materialPercent,
    partnerModel: data.partnerModel,
    preferredLanguage: data.preferredLanguage,
    emailVerified: true,
    isApproved: true,
  });

  await logAudit({
    actorUserId: actor?.userId ?? null,
    actorLabel: actor?.label ?? "partner-account-service",
    action: "partner_account.create",
    entityType: "user",
    entityId: user.id,
    meta: { email: user.email, role: user.role, source: "canonical_partner_account_service" },
    ip: actor?.ip ?? null,
  });

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function verifyPartnerCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await storage.getUserByEmail(normalizedEmail);
  if (!user?.password || user.role !== "partner" || !user.isApproved) {
    return { ok: false, user: null };
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { ok: false, user: null };
  const { password: _password, ...safeUser } = user;
  return { ok: true, user: safeUser };
}
