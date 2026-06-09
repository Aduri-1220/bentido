import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { logger } from "@/lib/logger";
import { finalizeRazorpayCapturedPayment } from "@/lib/payment-finalize";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook — configure the same URL in the Razorpay dashboard
 * (Settings → Webhooks) with `payment.captured` enabled.
 *
 * Flow:
 *   1. Verify HMAC signature against raw body.
 *   2. Dedup by x-razorpay-event-id (PaymentWebhookEvent unique index).
 *   3. Hand off to Inngest for async finalization with retries.
 *      In dev without Inngest, fall back to inline finalization.
 *   4. Always reply 2xx fast so Razorpay doesn't retry.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RAZORPAY_WEBHOOK_SECRET must be set in production");
    }
    return NextResponse.json(
      { error: "Not configured (dev mode)" },
      { status: 503 },
    );
  }

  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  if (!verifyRazorpayWebhookSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const eventId = req.headers.get("x-razorpay-event-id");
  if (eventId) {
    try {
      await prisma.paymentWebhookEvent.create({
        data: { provider: "RAZORPAY", eventId },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      throw e;
    }
  }

  let parsed: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string | null;
          amount?: number;
          status?: string;
        };
      };
    };
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (parsed.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const payEntity = parsed.payload?.payment?.entity;
  if (!payEntity?.id || !payEntity.order_id || payEntity.amount === undefined) {
    return NextResponse.json({ ok: true });
  }

  const paymentRow = await prisma.payment.findFirst({
    where: { providerOrderId: payEntity.order_id },
    select: { agreementId: true },
  });
  if (!paymentRow) {
    logger.warn("razorpay webhook: unknown order", {
      orderId: payEntity.order_id,
    });
    return NextResponse.json({ ok: true });
  }

  const inngestKeyConfigured = Boolean(process.env.INNGEST_EVENT_KEY?.trim());

  if (inngestKeyConfigured) {
    await inngest.send({
      name: "razorpay/payment.captured",
      data: {
        agreementId: paymentRow.agreementId,
        providerOrderId: payEntity.order_id,
        providerPaymentId: payEntity.id,
        amountPaise: payEntity.amount,
        eventId,
      },
    });
    return NextResponse.json({ ok: true, async: true });
  }

  // Dev / staging without Inngest: finalize inline, audit inline.
  const result = await finalizeRazorpayCapturedPayment({
    agreementId: paymentRow.agreementId,
    providerOrderId: payEntity.order_id,
    providerPaymentId: payEntity.id,
    amountPaise: payEntity.amount,
  });
  if (!result.ok) {
    logger.error("razorpay inline finalize failed", undefined, {
      agreementId: paymentRow.agreementId,
      reason: result.reason,
    });
  } else {
    await recordAuditEvent({
      actorType: "SYSTEM",
      actorId: "system:razorpay-webhook",
      action: "payment.success",
      agreementId: paymentRow.agreementId,
      after: {
        providerOrderId: payEntity.order_id,
        providerPaymentId: payEntity.id,
        amountPaise: payEntity.amount,
      },
      correlationId: eventId,
    });
  }

  return NextResponse.json({ ok: true, async: false });
}
