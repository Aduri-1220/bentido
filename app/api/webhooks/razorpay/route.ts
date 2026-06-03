import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { finalizeRazorpayCapturedPayment } from "@/lib/payment-finalize";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/db";

/**
 * Razorpay webhook — configure the same URL in the Razorpay dashboard
 * (Settings → Webhooks) with `payment.captured` enabled.
 *
 * Raw body is required for signature verification; do not parse as JSON first.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RAZORPAY_WEBHOOK_SECRET must be set in production");
    }
    return NextResponse.json({ error: "Not configured (dev mode)" }, { status: 503 });
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
  });
  if (!paymentRow) {
    console.warn("[webhook razorpay] unknown order", payEntity.order_id);
    return NextResponse.json({ ok: true });
  }

  const result = await finalizeRazorpayCapturedPayment({
    agreementId: paymentRow.agreementId,
    providerOrderId: payEntity.order_id,
    providerPaymentId: payEntity.id,
    amountPaise: payEntity.amount,
  });

  if (!result.ok) {
    console.error("[webhook razorpay] finalize failed:", result.reason);
  }

  return NextResponse.json({ ok: true });
}
