/**
 * Digio API client — Aadhaar OTP KYC and Aadhaar eSign.
 *
 * Sandbox base: https://ext.digio.in:444
 * Production base: https://api.digio.in
 *
 * Auth: HTTP Basic  base64(DIGIO_CLIENT_ID:DIGIO_CLIENT_SECRET)
 *
 * Docs: https://docs.digio.in
 */

const BASE_URL =
  process.env.DIGIO_BASE_URL ?? "https://ext.digio.in:444";

const CLIENT_ID = process.env.DIGIO_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET ?? "";

function basicAuth() {
  return (
    "Basic " +
    Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
  );
}

async function digioFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new DigiError(res.status, body, path);
  }

  return res.json() as Promise<T>;
}

export class DigiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string,
  ) {
    super(`Digio ${status} on ${path}: ${body.slice(0, 200)}`);
    this.name = "DigiError";
  }
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export interface KycInitiateParams {
  /** Customer email — used as the Digio "customer_identifier". */
  customerEmail: string;
  customerName: string;
  /** 10-digit Indian mobile linked to Aadhaar. */
  customerMobile: string;
  /** Your unique reference (e.g. `${agreementId}_OWNER`). */
  referenceId: string;
}

export interface KycInitiateResponse {
  id: string; // KID...
  access_token: string;
  customer_identifier: string;
  created_at: string;
  expire_at: string;
}

/**
 * Initiate an Aadhaar OTP KYC request.
 * Redirect the user to the Digio gateway URL returned by `digioGatewayUrl`.
 */
export async function initiateKyc(
  params: KycInitiateParams,
): Promise<KycInitiateResponse> {
  return digioFetch<KycInitiateResponse>("/v2/client/kyc/request", {
    method: "POST",
    body: JSON.stringify({
      customer_identifier: params.customerEmail,
      customer_name: params.customerName,
      customer_mobile: params.customerMobile,
      reference_id: params.referenceId,
      service_type: "aadhaar_kyc",
    }),
  });
}

export interface KycStatusResponse {
  id: string;
  status: "initiated" | "completed" | "failed" | string;
  customer_identifier: string;
  customer_name?: string;
  /** Masked Aadhaar like XXXX XXXX 1234 */
  masked_aadhaar?: string;
  reference_id?: string;
}

export async function getKycStatus(kycId: string): Promise<KycStatusResponse> {
  return digioFetch<KycStatusResponse>(`/v2/client/kyc/request/${kycId}`);
}

// ─── eSign ─────────────────────────────────────────────────────────────────────

export interface ESignSigner {
  /** Signer's email or mobile — Digio uses this as their identifier. */
  identifier: string;
  name: string;
  /** Optional: reason shown on the signature panel. */
  reason?: string;
}

export interface ESignInitiateParams {
  /** Filename shown in the Digio UI (e.g. "rental_agreement_AB123.pdf"). */
  fileName: string;
  /** Base64-encoded PDF content. */
  fileBase64: string;
  signers: ESignSigner[];
  /** Days before the signing link expires (default 10, max 90). */
  expireInDays?: number;
  /** Your reference id (agreementId). */
  referenceId?: string;
}

export interface ESignPartyResponse {
  identifier: string;
  name: string;
  status: "requested" | "signed" | "expired" | "cancelled" | "failed" | string;
}

export interface ESignAccessToken {
  entityId: string;
  id: string;
  validTill: string;
  createdAt: string;
}

export interface ESignInitiateResponse {
  /** Digio document ID — pass to digioGatewayUrl. */
  id: string;
  agreement_status: "draft" | "requested" | "completed" | "expired" | "failed" | string;
  file_name: string;
  created_at: string;
  signing_parties: ESignPartyResponse[];
  /** Per-signer access token (present when generate_access_token=true). */
  access_token?: ESignAccessToken;
}

/**
 * Upload the agreement PDF to Digio and create a multi-party Aadhaar eSign request.
 * Uses the JSON endpoint (base64 PDF) — POST /v2/client/document/uploadpdf.
 */
export async function initiateESign(
  params: ESignInitiateParams,
): Promise<ESignInitiateResponse> {
  return digioFetch<ESignInitiateResponse>("/v2/client/document/uploadpdf", {
    method: "POST",
    body: JSON.stringify({
      file_name: params.fileName,
      file_data: params.fileBase64,
      signers: params.signers.map((s) => ({
        identifier: s.identifier,
        name: s.name,
        sign_type: "aadhaar",
        reason: s.reason ?? "Rental Agreement — Aadhaar eSign",
      })),
      expire_in_days: params.expireInDays ?? 10,
      display_on_page: "last",
      notify_signers: true,
      send_sign_link: true,
      generate_access_token: true,
      sequential: false,
      ...(params.referenceId ? { reference_id: params.referenceId } : {}),
    }),
  });
}

export interface ESignStatusResponse {
  id: string;
  agreement_status: "draft" | "requested" | "completed" | "expired" | "failed" | string;
  file_name: string;
  signing_parties: ESignPartyResponse[];
}

export async function getESignStatus(
  docId: string,
): Promise<ESignStatusResponse> {
  return digioFetch<ESignStatusResponse>(`/v2/client/document/${docId}`);
}

/** Download the signed PDF as a Buffer (only available when agreement_status === "completed"). */
export async function downloadSignedDocument(docId: string): Promise<Buffer> {
  const url = `${BASE_URL}/v2/client/document/${docId}/download`;
  const res = await fetch(url, {
    headers: { Authorization: basicAuth(), Accept: "application/pdf" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new DigiError(res.status, body, `/v2/client/document/${docId}/download`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build the Digio gateway URL to redirect a user for KYC or signing.
 *
 * KYC:   digioGatewayUrl(kycId,   accessToken, customerEmail)
 * eSign: digioGatewayUrl(docId,   accessToken, signerEmail)
 */
export function digioGatewayUrl(
  id: string,
  accessToken: string,
  customerIdentifier: string,
): string {
  return `https://app.digio.in/#/gateway/login/${id}/${accessToken}/${encodeURIComponent(customerIdentifier)}`;
}

/**
 * Verify a Digio webhook signature.
 * Digio sends `X-Digio-Signature` = HMAC-SHA256(raw body, DIGIO_WEBHOOK_SECRET).
 */
export async function verifyDigioWebhook(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env.DIGIO_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification in dev when secret not set

  const { createHmac } = await import("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}
