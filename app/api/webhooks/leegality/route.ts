import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { verifyLeegalityWebhook } from "@/lib/leegality";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/leegality
 *
 * Receives Leegality eSign lifecycle events. Configure two URLs in the
 * Leegality dashboard → Webhooks:
 *   - Success URL: https://YOUR_DOMAIN/api/webhooks/leegality
 *   - Error URL:   https://YOUR_DOMAIN/api/webhooks/leegality
 *
 * Both hit this route; the payload's eventType (and signer status) tells
 * us which lifecycle moment it is.
 *
 * Signature verification: Leegality includes `mac` in the JSON body:
 *   mac = HMAC-SHA1(documentId, LEEGALITY_WEBHOOK_SECRET)
 *
 * Documents are looked up via the agreement's eSignRequest rows. During the
 * Digio → Leegality transition we reuse the digioDocId column to hold the
 * Leegality documentId — it's just a string. When Digio is removed, rename
 * the column to providerDocId.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const documentId = String(payload.documentId ?? "");
  const mac = String(payload.mac ?? "");

  const valid = await verifyLeegalityWebhook(documentId, mac);
  if (!valid) {
    logger.warn("Leegality webhook signature mismatch", { documentId });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  const eventType = String(payload.eventType ?? payload.event ?? "");
  const signerEmail = String(payload.email ?? payload.signerEmail ?? "");
  // Leegality echoes IRN back as the agreementId we set on send.
  const irn = String(payload.irn ?? "");

  // ── Individual signer completed ───────────────────────────────────────────
  if (eventType === "SIGNER_SIGNS_DOCUMENT" || eventType === "signer_signed") {
    if (signerEmail) {
      await prisma.eSignRequest.updateMany({
        where: { digioDocId: documentId, signerEmail },
        data: { status: "SIGNED", signedAt: new Date() },
      });
    }

    // Determine if the whole document is now complete (all parties signed).
    const remaining = await prisma.eSignRequest.count({
      where: { digioDocId: documentId, status: { not: "SIGNED" } },
    });
    if (remaining === 0) {
      await advanceAgreementToDelivery(documentId, irn, "leegality:signer_signed");
    }
    return NextResponse.json({ ok: true });
  }

  // ── Reviewer approved (treat as informational; no status change) ──────────
  if (eventType === "REVIEWER_APPROVES_DOCUMENT") {
    return NextResponse.json({ ok: true });
  }

  // ── Failure / rejection / expiry → mark eSign failed, leave status as-is ─
  if (
    eventType === "SIGNER_REJECTS_DOCUMENT" ||
    eventType === "DOCUMENT_EXPIRED" ||
    eventType === "CERTIFICATE_VERIFICATION_FAILED" ||
    eventType === "REVIEWER_REJECTS_DOCUMENT"
  ) {
    await prisma.eSignRequest.updateMany({
      where: { digioDocId: documentId },
      data: { status: "FAILED" },
    });

    const agreementId = irn || (await resolveAgreementFromDoc(documentId));
    if (agreementId) {
      await recordAuditEvent({
        actorType: "SYSTEM",
        actorId: "system:leegality-webhook",
        action: "esign.failed",
        agreementId,
        after: { documentId, eventType },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Unknown event — acknowledge so Leegality doesn't retry.
  logger.info("Leegality webhook unrecognised event", { eventType, documentId });
  return NextResponse.json({ ok: true, event: eventType });
}

async function advanceAgreementToDelivery(
  documentId: string,
  irn: string,
  source: string,
) {
  const agreementId = irn || (await resolveAgreementFromDoc(documentId));
  if (!agreementId) return;

  await prisma.$transaction([
    prisma.eSignRequest.updateMany({
      where: { digioDocId: documentId },
      data: { status: "SIGNED", signedAt: new Date() },
    }),
    prisma.agreement.updateMany({
      where: { id: agreementId, status: "E_SIGNING" },
      data: { status: "DELIVERY" },
    }),
  ]);

  await recordAuditEvent({
    actorType: "SYSTEM",
    actorId: "system:leegality-webhook",
    action: "esign.completed",
    agreementId,
    after: { documentId, source },
  });
}

async function resolveAgreementFromDoc(docId: string): Promise<string | null> {
  const row = await prisma.eSignRequest.findFirst({
    where: { digioDocId: docId },
    select: { agreementId: true },
  });
  return row?.agreementId ?? null;
}
