import { NextResponse } from "next/server";
import { z } from "zod";
import { finalizeRazorpayCapturedPayment } from "@/lib/payment-finalize";
import {
  razorpayFetchPayment,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payment not configured" },
      { status: 503 },
    );
  }

  const sigOk = verifyRazorpayPaymentSignature({
    orderId: parsed.data.razorpay_order_id,
    paymentId: parsed.data.razorpay_payment_id,
    signature: parsed.data.razorpay_signature,
    keySecret,
  });
  if (!sigOk) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    include: { payment: true },
  });
  if (!agreement?.payment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (agreement.payment.providerOrderId !== parsed.data.razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  let entity;
  try {
    entity = await razorpayFetchPayment({
      paymentId: parsed.data.razorpay_payment_id,
      keyId,
      keySecret,
    });
  } catch (e) {
    logger.error("[payment/verify] razorpay fetch failed", e);
    return NextResponse.json(
      { error: "Could not verify payment" },
      { status: 502 },
    );
  }

  const normalizedStatus = (entity.status ?? "").toLowerCase();
  if (normalizedStatus !== "authorized" && normalizedStatus !== "captured") {
    return NextResponse.json(
      { error: `Payment not complete (${entity.status})` },
      { status: 409 },
    );
  }

  if (String(entity.order_id ?? "") !== parsed.data.razorpay_order_id) {
    return NextResponse.json(
      { error: "Payment order mismatch" },
      { status: 400 },
    );
  }

  const amountPaise = Number(entity.amount);
  if (!Number.isFinite(amountPaise)) {
    return NextResponse.json(
      { error: "Invalid payment amount from provider" },
      { status: 502 },
    );
  }

  const result = await finalizeRazorpayCapturedPayment({
    agreementId: params.id,
    providerOrderId: parsed.data.razorpay_order_id,
    providerPaymentId: parsed.data.razorpay_payment_id,
    amountPaise,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
