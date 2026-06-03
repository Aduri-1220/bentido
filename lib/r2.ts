/**
 * Cloudflare R2 client wrapper. R2 is S3-compatible, so we use @aws-sdk/client-s3
 * against R2's endpoint with zero-egress pricing.
 *
 * Required env vars (set in Vercel / production):
 *   - R2_ACCOUNT_ID
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *   - R2_BUCKET
 *
 * Object key convention:
 *   agreements/<agreementId>/source-draft/<original-or-uuid>.pdf
 *   agreements/<agreementId>/executed-copy/<original-or-uuid>.pdf
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cachedClient: S3Client | null = null;

function assertR2Configured(): {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
} {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.",
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim(),
  );
}

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const { accountId, accessKeyId, secretAccessKey } = assertR2Configured();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function safeNameSegment(raw: string): string {
  return (
    raw
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80) || "file"
  );
}

export function r2KeyForSourceDraft(
  agreementId: string,
  originalName: string,
): string {
  return `agreements/${agreementId}/source-draft/${Date.now()}-${safeNameSegment(originalName)}`;
}

export function r2KeyForExecutedCopy(
  agreementId: string,
  originalName: string,
): string {
  return `agreements/${agreementId}/executed-copy/${Date.now()}-${safeNameSegment(originalName)}`;
}

export async function r2PutObject(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  contentDisposition?: string;
}): Promise<void> {
  const { bucket } = assertR2Configured();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ContentDisposition: input.contentDisposition,
    }),
  );
}

export async function r2DeleteObject(key: string): Promise<void> {
  const { bucket } = assertR2Configured();
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
}

/**
 * Time-limited URL the browser can use to download the object directly from R2.
 * Default TTL: 5 minutes. Use shorter values for sensitive files.
 */
export async function r2PresignedGetUrl(
  key: string,
  expiresInSec = 300,
  responseHeaders?: { contentType?: string; contentDisposition?: string },
): Promise<string> {
  const { bucket } = assertR2Configured();
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: responseHeaders?.contentType,
    ResponseContentDisposition: responseHeaders?.contentDisposition,
  });
  return getSignedUrl(getR2Client(), cmd, { expiresIn: expiresInSec });
}

/**
 * Stream the object back through our server. Useful when we don't want to expose
 * R2 URLs (auth-gated downloads). Slower and uses bandwidth but keeps full control.
 */
export async function r2GetObjectBuffer(key: string): Promise<Buffer> {
  const { bucket } = assertR2Configured();
  const res = await getR2Client().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) throw new Error(`R2 object has no body: ${key}`);
  const stream = res.Body as unknown as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
