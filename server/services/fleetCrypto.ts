import crypto from "crypto";
import type { Request } from "express";

/**
 * Fleet API request signing (HMAC-SHA256).
 *
 * Inbound auth:
 *   X-Fleet-Key-Id:    public key identifier (lookup → fleet + secret hash)
 *   X-Fleet-Timestamp: ISO-8601 UTC; rejected if older than 5 min (anti-replay)
 *   X-Fleet-Nonce:     random unique string per request (DB unique index)
 *   X-Fleet-Signature: hex( HMAC_SHA256(secret, `${timestamp}.${nonce}.${method}.${path}.${sha256(body)}`) )
 *
 * Outbound webhooks use the same scheme but signed with the fleet's webhookSecret.
 */

export const FLEET_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export function generateApiKeyPair(): { keyId: string; secret: string } {
  const keyId = "fk_" + crypto.randomBytes(8).toString("hex");
  const secret = crypto.randomBytes(32).toString("hex"); // 64 char hex
  return { keyId, secret };
}

export function generateWebhookSecret(): string {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}

export function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export interface SignaturePayload {
  timestamp: string;
  nonce: string;
  method: string;
  path: string;
  body: string;
}

export function buildSigningString(p: SignaturePayload): string {
  const bodyHash = crypto.createHash("sha256").update(p.body || "").digest("hex");
  return `${p.timestamp}.${p.nonce}.${p.method.toUpperCase()}.${p.path}.${bodyHash}`;
}

export function signRequest(secret: string, p: SignaturePayload): string {
  return crypto.createHmac("sha256", secret).update(buildSigningString(p)).digest("hex");
}

export function verifySignature(
  secret: string,
  expected: string,
  p: SignaturePayload,
): boolean {
  const computed = signRequest(secret, p);
  return constantTimeEquals(computed, expected);
}

export function isTimestampFresh(timestamp: string, now: number = Date.now()): boolean {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return false;
  return Math.abs(now - t) <= FLEET_TIMESTAMP_TOLERANCE_MS;
}

export interface ParsedFleetHeaders {
  keyId: string;
  timestamp: string;
  nonce: string;
  signature: string;
}

export function parseFleetHeaders(req: Request): ParsedFleetHeaders | null {
  const keyId = String(req.header("x-fleet-key-id") || "");
  const timestamp = String(req.header("x-fleet-timestamp") || "");
  const nonce = String(req.header("x-fleet-nonce") || "");
  const signature = String(req.header("x-fleet-signature") || "");
  if (!keyId || !timestamp || !nonce || !signature) return null;
  return { keyId, timestamp, nonce, signature };
}
