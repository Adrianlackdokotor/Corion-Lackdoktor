import crypto from "crypto";

/**
 * GDPR helpers for Fleet API.
 *
 * Two scopes of payload:
 *  - "pii_full": fleet has explicit consent → return real PII
 *  - "pii_basic" (default): pseudonymize PII before transmitting
 *
 * Pseudonymization is deterministic per fleet so the same client maps to the
 * same opaque token across messages, but is NOT reversible without the salt.
 */

export interface ClientPii {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface RepairRequestForFleet {
  externalRef: string;
  status: string;
  vehicleVin?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  damageType?: string | null;
  description: string;
  estimatedCostCents?: number | null;
  finalCostCents?: number | null;
  client?: ClientPii;
  createdAt?: string;
  updatedAt?: string;
}

export function pseudonymize(value: string | null | undefined, fleetSalt: string): string | null {
  if (!value) return null;
  const h = crypto.createHmac("sha256", fleetSalt).update(value).digest("hex");
  return "pseu_" + h.slice(0, 16);
}

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!user || !domain) return null;
  const masked = user.length <= 2 ? "*".repeat(user.length) : user[0] + "***" + user[user.length - 1];
  return `${masked}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return "***" + digits.slice(-3);
}

export interface GdprPolicy {
  allowFullPii: boolean;
  fleetId: string;
}

/**
 * Apply GDPR data minimization to outbound payload. Idempotent and never
 * mutates the input.
 */
export function applyGdprPolicy(
  data: RepairRequestForFleet,
  policy: GdprPolicy,
): RepairRequestForFleet {
  if (!data.client) return data;
  if (policy.allowFullPii) return data;
  const salt = "fleet:" + policy.fleetId; // stable per fleet
  return {
    ...data,
    client: {
      name: data.client.name ? pseudonymize(data.client.name, salt) : null,
      email: maskEmail(data.client.email),
      phone: maskPhone(data.client.phone),
      address: null, // never share address without full consent
    },
  };
}
