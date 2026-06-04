/**
 * Leegality API client — Aadhaar eSign (unified with KYC via aadhaarConfig).
 *
 * Sandbox base: https://sandbox.leegality.com/api
 * Production base: https://app1.leegality.com/api
 *
 * Auth: X-Auth-Token header.
 *
 * Quirks (handle carefully):
 *  - Endpoint versions are mixed: /v3.0 for sign/request, /v3.1 for fetchDocument,
 *    /v3.3 for document/details. Hardcoded per endpoint, NOT a single base version.
 *  - Errors come back with HTTP 200 + JSON { status: 0, messages: [...] }. Caller
 *    must inspect `status`, not just HTTP status.
 *  - Webhook signature is HMAC-SHA1 of the `documentId` (not body), and the
 *    signature arrives in the payload as `mac`, not as an HTTP header.
 *
 * Docs: https://knowledge.leegality.com/document-execution/api/document-execution-api
 */

const BASE_URL =
  process.env.LEEGALITY_BASE_URL ?? "https://sandbox.leegality.com/api";

const AUTH_TOKEN = process.env.LEEGALITY_AUTH_TOKEN ?? "";

export class LeegalityError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string,
  ) {
    super(`Leegality ${status} on ${path}: ${body.slice(0, 200)}`);
    this.name = "LeegalityError";
  }
}

interface LeegalityEnvelope<T> {
  status: 0 | 1;
  messages: Array<{ code: string; message: string }>;
  data: T;
}

async function leegalityFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "X-Auth-Token": AUTH_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LeegalityError(res.status, body, path);
  }

  const envelope = (await res.json()) as LeegalityEnvelope<T>;
  if (envelope.status !== 1) {
    const msg = envelope.messages?.[0]?.message ?? "unknown error";
    throw new LeegalityError(200, JSON.stringify(envelope.messages), path + ` — ${msg}`);
  }
  return envelope.data;
}

// ─── Send for signature (creates document + invitations) ──────────────────────

export interface LeegalityAadhaarConfig {
  /** Last 4 digits of the signer's Aadhaar — UIDAI verifies at sign time. */
  verifyTitle?: string;
  /** 4-digit year of birth */
  verifyYob?: string;
  verifyName?: boolean;
  /** Full state name (e.g. "Telangana") */
  verifyState?: string;
  verifyPincode?: string;
  /** "M" | "F" */
  verifyGender?: "M" | "F";
}

export interface LeegalityInvitee {
  name: string;
  /** Either email or phone is required. */
  email?: string;
  /** 10-digit Indian mobile. */
  phone?: string;
  defaultLanguageSelect?:
    | "ENGLISH"
    | "HINDI"
    | "TELUGU"
    | "TAMIL"
    | "KANNADA"
    | "MALAYALAM";
  /** Aadhaar verification config — turns the signature into KYC+eSign. */
  aadhaarConfig?: LeegalityAadhaarConfig;
}

export interface SendForSignatureParams {
  /** Workflow / Profile ID from the Leegality dashboard (e.g. "7WMVrYf"). */
  profileId: string;
  fileName: string;
  /** Base64-encoded PDF (no data URL prefix). Max 15 MB pre-encoding. */
  fileBase64: string;
  invitees: LeegalityInvitee[];
  /** Internal Reference Number — pass agreementId so webhooks can correlate. */
  irn?: string;
}

export interface SendForSignatureResponse {
  documentId: string;
  irn?: string;
  invitees: Array<{
    name: string;
    email?: string;
    phone?: string;
    signUrl: string;
    active: boolean;
    expiryDate: string;
  }>;
}

export async function sendForSignature(
  params: SendForSignatureParams,
): Promise<SendForSignatureResponse> {
  return leegalityFetch<SendForSignatureResponse>("/v3.0/sign/request", {
    method: "POST",
    body: JSON.stringify({
      profileId: params.profileId,
      file: {
        name: params.fileName,
        file: params.fileBase64,
      },
      invitees: params.invitees,
      ...(params.irn ? { irn: params.irn } : {}),
    }),
  });
}

// ─── Check document status ────────────────────────────────────────────────────

export type LeegalityDocumentStatus = "DRAFT" | "SENT" | "COMPLETED";

export interface LeegalityInvitationStatus {
  active: boolean;
  signed: boolean;
  rejected: boolean;
  expired: boolean;
}

export interface DocumentDetailsResponse {
  documentId: string;
  documentStatus: LeegalityDocumentStatus;
  /** Short-lived CDN URL (15 sec) — use fetchDocument for stable downloads. */
  file?: string;
  auditTrail?: string;
  invitations: Array<{
    name: string;
    email?: string;
    phone?: string;
    invitationStatus: LeegalityInvitationStatus;
    signDate?: string;
  }>;
  creationDate: string;
  completionDate?: string;
}

export async function getDocumentStatus(
  documentId: string,
): Promise<DocumentDetailsResponse> {
  return leegalityFetch<DocumentDetailsResponse>(
    `/v3.3/document/details?documentId=${encodeURIComponent(documentId)}`,
  );
}

// ─── Fetch document binary (signed PDF or audit trail) ────────────────────────

export type DocumentDownloadType =
  | "DOCUMENT"
  | "AUDIT_TRAIL"
  | "ATTACHMENT"
  | "SUPPORTING_DOCUMENT";

/**
 * Returns the raw PDF bytes. Note: errors still come back as HTTP 200 with
 * JSON body; we detect that by Content-Type and throw.
 */
export async function fetchDocument(
  documentId: string,
  downloadType: DocumentDownloadType = "DOCUMENT",
): Promise<Buffer> {
  const url =
    `${BASE_URL}/v3.1/document/fetchDocument` +
    `?documentId=${encodeURIComponent(documentId)}` +
    `&documentDownloadType=${downloadType}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": AUTH_TOKEN, Accept: "application/pdf" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LeegalityError(res.status, body, "/v3.1/document/fetchDocument");
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await res.text();
    throw new LeegalityError(200, body, "/v3.1/document/fetchDocument");
  }
  return Buffer.from(await res.arrayBuffer());
}

// ─── Webhook signature verification ───────────────────────────────────────────

/**
 * Verify a Leegality webhook payload.
 *
 * Leegality includes `mac` in the JSON body where:
 *   mac = HMAC-SHA1(documentId, LEEGALITY_WEBHOOK_SECRET).digest("hex")
 *
 * Pass both values from the parsed webhook body.
 */
export async function verifyLeegalityWebhook(
  documentId: string,
  mac: string,
): Promise<boolean> {
  const secret = process.env.LEEGALITY_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification in dev when secret not set
  if (!documentId || !mac) return false;

  const { createHmac } = await import("crypto");
  const expected = createHmac("sha1", secret).update(documentId).digest("hex");
  return expected.toLowerCase() === mac.toLowerCase();
}

// ─── Config check ─────────────────────────────────────────────────────────────

export function isLeegalityConfigured(): boolean {
  return Boolean(
    process.env.LEEGALITY_AUTH_TOKEN?.trim() &&
      process.env.LEEGALITY_BASE_URL?.trim() &&
      process.env.LEEGALITY_PROFILE_ID?.trim(),
  );
}
