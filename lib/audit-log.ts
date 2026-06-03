/**
 * Append-only audit trail. Every state-mutating action that touches an
 * agreement, a payment, or a workflow transition should write one row here.
 *
 * Writes are best-effort: a failure here must never block a primary mutation,
 * but we do log to the structured logger so missing rows are noticed.
 */

import { prisma } from "./db";
import { logger } from "./logger";

export type AuditActorType = "USER" | "ADMIN" | "WORKER" | "SYSTEM";

export interface RecordAuditEventInput {
  actorType: AuditActorType;
  /** User id, or sentinel like "system:razorpay-webhook" / "system:inngest". */
  actorId: string;
  /** Stable verb.namespace, e.g. "agreement.create", "payment.success". */
  action: string;
  agreementId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

function safeJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function recordAuditEvent(
  input: RecordAuditEventInput,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        agreementId: input.agreementId ?? null,
        before: safeJson(input.before),
        after: safeJson(input.after),
        ip: input.ip ?? null,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
        correlationId: input.correlationId ?? null,
      },
    });
  } catch (err) {
    // Audit write failures must never block the calling mutation.
    logger.error("audit log write failed", err, {
      action: input.action,
      agreementId: input.agreementId ?? undefined,
    });
  }
}

/** Pulls IP + UA from a Request for use in route handlers. */
export function auditContextFromRequest(req: Request): {
  ip: string;
  userAgent: string | null;
} {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return { ip, userAgent: req.headers.get("user-agent") };
}
