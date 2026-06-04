import { createHash, randomBytes } from "crypto";

/**
 * Counterparty invite token utilities. The token is a 32-byte hex string
 * delivered to the counterparty via email/WhatsApp. We persist only its
 * SHA-256 hash and the expiry so a leaked DB row cannot impersonate
 * the counterparty against the public review endpoints.
 */

export const INVITE_TTL_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function inviteExpiryFromNow(): Date {
  return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export type CounterpartyApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "CHANGES_REQUESTED";
