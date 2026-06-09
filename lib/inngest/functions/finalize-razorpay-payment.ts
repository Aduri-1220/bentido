import { recordAuditEvent } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { finalizeRazorpayCapturedPayment } from "@/lib/payment-finalize";
import { inngest, type RazorpayPaymentCapturedData } from "../client";

/**
 * Settles Razorpay payment capture asynchronously.
 *
 * Why a job and not inline in the webhook: the webhook handler must reply 2xx fast,
 * and our DB writes (payment + status + audit log) should be retried automatically
 * on transient failures. Inngest gives us automatic retries with exponential backoff
 * and a DLQ if all retries fail.
 *
 * Idempotency: `finalizeRazorpayCapturedPayment` itself is idempotent on
 * (providerOrderId, providerPaymentId), so retries are safe.
 */
export const finalizeRazorpayPayment = inngest.createFunction(
  {
    id: "finalize-razorpay-payment",
    name: "Finalize Razorpay captured payment",
    retries: 4,
    triggers: [{ event: "razorpay/payment.captured" }],
  },
  async ({ event, step }) => {
    const data = event.data as RazorpayPaymentCapturedData;

    const result = await step.run("finalize", () =>
      finalizeRazorpayCapturedPayment({
        agreementId: data.agreementId,
        providerOrderId: data.providerOrderId,
        providerPaymentId: data.providerPaymentId,
        amountPaise: data.amountPaise,
      }),
    );

    if (!result.ok) {
      logger.error("Razorpay finalize failed", undefined, {
        agreementId: data.agreementId,
        reason: result.reason,
      });
      throw new Error(`finalize failed: ${result.reason}`);
    }

    await step.run("audit", () =>
      recordAuditEvent({
        actorType: "SYSTEM",
        actorId: "system:razorpay-webhook",
        action: "payment.success",
        agreementId: data.agreementId,
        after: {
          providerOrderId: data.providerOrderId,
          providerPaymentId: data.providerPaymentId,
          amountPaise: data.amountPaise,
        },
        correlationId: data.eventId,
      }),
    );

    return { ok: true };
  },
);
