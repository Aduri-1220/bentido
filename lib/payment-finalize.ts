import {
  agreementStatusAfterSuccessfulPayment,
  parseAgreementStatus,
} from "@/lib/agreement-status";
import { prisma } from "@/lib/db";
import { notifyAgreementEvent } from "@/lib/notifications";

/**
 * Mark a Razorpay payment captured for an agreement after signature / webhook checks.
 * Idempotent if already SUCCESS with the same providerPaymentId.
 */
export async function finalizeRazorpayCapturedPayment(input: {
  agreementId: string;
  providerOrderId: string;
  providerPaymentId: string;
  amountPaise: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const agreement = await prisma.agreement.findUnique({
    where: { id: input.agreementId },
    include: { payment: true },
  });
  if (!agreement?.payment) return { ok: false, reason: "Payment not found" };
  const pay = agreement.payment;
  if (pay.provider !== "RAZORPAY")
    return { ok: false, reason: "Unexpected provider" };
  if (pay.providerOrderId !== input.providerOrderId)
    return { ok: false, reason: "Order mismatch" };
  const expectedPaise = pay.amount * 100;
  if (input.amountPaise !== expectedPaise)
    return { ok: false, reason: "Amount mismatch" };

  if (pay.status === "SUCCESS") {
    if (pay.providerPaymentId === input.providerPaymentId) return { ok: true };
    return { ok: false, reason: "Already paid with a different payment id" };
  }

  const current = parseAgreementStatus(agreement.status);
  if (!current) return { ok: false, reason: "Invalid agreement state" };
  const nextAgreementStatus = agreementStatusAfterSuccessfulPayment(current);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { agreementId: input.agreementId },
      data: {
        status: "SUCCESS",
        providerPaymentId: input.providerPaymentId,
        mockTxnId: null,
      },
    });
    if (nextAgreementStatus === "PAID") {
      await tx.agreement.update({
        where: { id: input.agreementId },
        data: { status: "PAID" },
      });
    }
  });

  if (nextAgreementStatus === "PAID") {
    await notifyAgreementEvent("payment.succeeded", input.agreementId);
  }

  return { ok: true };
}
