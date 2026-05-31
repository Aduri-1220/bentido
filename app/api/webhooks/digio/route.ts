import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyDigioWebhook } from "@/lib/digio";

/**
 * POST /api/webhooks/digio
 *
 * Receives event notifications from Digio for:
 *   - KYC completion / failure  (event_type: "kyc_completed" | "kyc_failed")
 *   - eSign completion          (event_type: "sign_done" | "esign_document_completed")
 *
 * Configure this URL in the Digio developer dashboard:
 *   https://YOUR_DOMAIN/api/webhooks/digio
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-digio-signature") ?? "";

  const valid = await verifyDigioWebhook(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const eventType = String(payload.event_type ?? "");
  const id = String(payload.id ?? "");
  const referenceId = String(payload.reference_id ?? "");

  // ── KYC completed ──────────────────────────────────────────────────────────
  if (eventType === "kyc_completed") {
    const maskedAadhaar = String(payload.masked_aadhaar ?? "");
    const verifiedName = String(payload.customer_name ?? "");

    const row = await prisma.kycVerification.findUnique({
      where: { digioKycId: id },
    });
    if (row) {
      await prisma.kycVerification.update({
        where: { digioKycId: id },
        data: {
          status: "VERIFIED",
          verifiedName: verifiedName || null,
          maskedAadhaar: maskedAadhaar || null,
          verifiedAt: new Date(),
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // ── KYC failed ─────────────────────────────────────────────────────────────
  if (eventType === "kyc_failed") {
    await prisma.kycVerification.updateMany({
      where: { digioKycId: id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ ok: true });
  }

  // ── eSign: individual signer completed ────────────────────────────────────
  if (eventType === "sign_done" || eventType === "esign_sign_done") {
    const signerEmail = String(payload.customer_identifier ?? "");

    if (signerEmail) {
      await prisma.eSignRequest.updateMany({
        where: { digioDocId: id, signerEmail },
        data: { status: "SIGNED", signedAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // ── eSign: all parties signed → advance agreement to DELIVERY ─────────────
  if (
    eventType === "esign_document_completed" ||
    eventType === "sign_completion"
  ) {
    // referenceId was set to agreementId when initiating
    const agreementId = referenceId || (await resolveAgreementFromDoc(id));

    if (agreementId) {
      await prisma.$transaction([
        prisma.eSignRequest.updateMany({
          where: { digioDocId: id },
          data: { status: "SIGNED", signedAt: new Date() },
        }),
        prisma.agreement.updateMany({
          where: { id: agreementId, status: "E_SIGNING" },
          data: { status: "DELIVERY" },
        }),
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  // Unknown event — acknowledge so Digio doesn't retry
  return NextResponse.json({ ok: true, event: eventType });
}

async function resolveAgreementFromDoc(docId: string): Promise<string | null> {
  const row = await prisma.eSignRequest.findFirst({
    where: { digioDocId: docId },
    select: { agreementId: true },
  });
  return row?.agreementId ?? null;
}
