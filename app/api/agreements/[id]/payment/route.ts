import { NextResponse } from "next/server";
import { z } from "zod";
import {
  agreementStatusAfterSuccessfulPayment,
  parseAgreementStatus,
} from "@/lib/agreement-status";
import { getAgreementPriceBreakdownForOwner } from "@/lib/agreement-pricing";
import { prisma } from "@/lib/db";
import {
  assertRazorpayApiKeysConfigured,
  getPaymentProvider,
  isMockCheckoutForbiddenInProduction,
  isPaymentSimulateAllowed,
} from "@/lib/payment-config";
import { razorpayCreateOrder } from "@/lib/razorpay";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

const mockBodySchema = z.object({
  simulate: z.enum(["success", "failure"]).default("success"),
  method: z.enum(["UPI", "CARD", "NETBANKING"]).optional(),
});

const razorpayIntentBodySchema = z.object({
  method: z.enum(["UPI", "CARD", "NETBANKING"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    include: { payment: true },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const p = agreement.payment;
  return NextResponse.json({
    payment: p
      ? {
          status: p.status,
          provider: p.provider,
          amount: p.amount,
          providerOrderId: p.providerOrderId,
          hasProviderPaymentId: Boolean(p.providerPaymentId),
        }
      : null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await enforceUserRateLimit({
    req,
    userId: user.id,
    prefix: "payment-intent",
    max: 20,
    windowSec: 600,
  });
  if (limited) return limited;

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    include: { payment: true },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    agreement.payment?.status !== "SUCCESS" &&
    agreement.counterpartyApprovalStatus !== "APPROVED"
  ) {
    return NextResponse.json(
      {
        error:
          "Tenant approval is required before payment. Send the review invite from the preview screen.",
        code: "COUNTERPARTY_NOT_APPROVED",
      },
      { status: 409 },
    );
  }

  if (agreement.payment?.status === "SUCCESS") {
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      payment: {
        status: agreement.payment.status,
        provider: agreement.payment.provider,
        amount: agreement.payment.amount,
        providerOrderId: agreement.payment.providerOrderId,
      },
    });
  }

  const pricing = await getAgreementPriceBreakdownForOwner(params.id, user.id);
  if (!pricing.ok) {
    return NextResponse.json(
      { error: pricing.error },
      { status: pricing.status },
    );
  }
  const expectedRupees = pricing.breakdown.total;
  const expectedPaise = expectedRupees * 100;

  const provider = getPaymentProvider();

  if (provider === "RAZORPAY") {
    const json = await req.json().catch(() => null);
    const parsed = razorpayIntentBodySchema.safeParse(json ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    try {
      assertRazorpayApiKeysConfigured();
    } catch (e) {
      logger.error("[payment] Razorpay keys missing", e);
      return NextResponse.json(
        {
          error:
            "Razorpay API keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.",
        },
        { status: 503 },
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID!.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();

    let order: { id: string; currency?: string };
    try {
      order = await razorpayCreateOrder({
        keyId,
        keySecret,
        amountPaise: expectedPaise,
        receipt: `wb_${params.id.replace(/-/g, "").slice(0, 28)}`,
        notes: { agreementId: params.id, userId: user.id },
      });
    } catch (e) {
      logger.error("[payment] razorpay order creation failed", e);
      return NextResponse.json(
        { error: "Could not start checkout. Try again later." },
        { status: 502 },
      );
    }

    const payment = await prisma.payment.upsert({
      where: { agreementId: params.id },
      create: {
        agreementId: params.id,
        amount: expectedRupees,
        status: "PENDING",
        provider: "RAZORPAY",
        providerOrderId: order.id,
        ...(parsed.data.method ? { method: parsed.data.method } : {}),
      },
      update: {
        amount: expectedRupees,
        status: "PENDING",
        provider: "RAZORPAY",
        providerOrderId: order.id,
        providerPaymentId: null,
        mockTxnId: null,
        ...(parsed.data.method ? { method: parsed.data.method } : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      mode: "razorpay",
      keyId,
      orderId: order.id,
      amountPaise: expectedPaise,
      currency: order.currency ?? "INR",
      payment,
    });
  }

  if (isMockCheckoutForbiddenInProduction()) {
    return NextResponse.json(
      {
        error:
          "Demo checkout is disabled in production. Set PAYMENT_PROVIDER=razorpay and configure Razorpay keys.",
      },
      { status: 501 },
    );
  }

  if (!isPaymentSimulateAllowed()) {
    return NextResponse.json(
      { error: "Payment simulation is not allowed in this environment." },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = mockBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const success = parsed.data.simulate === "success";
  const mockTxnId = `WB_MOCK_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

  const payment = await prisma.payment.upsert({
    where: { agreementId: params.id },
    create: {
      agreementId: params.id,
      amount: expectedRupees,
      status: success ? "SUCCESS" : "FAILED",
      provider: "MOCK",
      mockTxnId: success ? mockTxnId : null,
      ...(parsed.data.method ? { method: parsed.data.method } : {}),
    },
    update: {
      amount: expectedRupees,
      status: success ? "SUCCESS" : "FAILED",
      provider: "MOCK",
      providerOrderId: null,
      providerPaymentId: null,
      mockTxnId: success ? mockTxnId : null,
      ...(parsed.data.method ? { method: parsed.data.method } : {}),
    },
  });

  if (success) {
    const current = parseAgreementStatus(agreement.status);
    if (!current)
      return NextResponse.json(
        { error: "Invalid agreement state" },
        { status: 500 },
      );
    const nextAgreementStatus = agreementStatusAfterSuccessfulPayment(current);
    if (nextAgreementStatus === "PAID") {
      await prisma.agreement.update({
        where: { id: params.id },
        data: { status: "PAID" },
      });
    }
  }

  return NextResponse.json({ ok: success, mode: "mock", payment });
}
