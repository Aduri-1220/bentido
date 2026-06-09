import { Inngest } from "inngest";

/**
 * Event registry. Add new payload types here as we wire more provider webhooks.
 */
export type BentidoEventName = "razorpay/payment.captured";

export interface RazorpayPaymentCapturedData {
  agreementId: string;
  providerOrderId: string;
  providerPaymentId: string;
  amountPaise: number;
  /** Razorpay webhook event id (for correlation). */
  eventId: string | null;
}

export const inngest = new Inngest({ id: "bentido" });

export function isInngestConfigured(): boolean {
  if (process.env.NODE_ENV === "production") {
    return Boolean(process.env.INNGEST_EVENT_KEY?.trim());
  }
  return true;
}
