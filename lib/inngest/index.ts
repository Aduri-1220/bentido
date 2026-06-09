export { inngest, isInngestConfigured } from "./client";
export type {
  BentidoEventName,
  RazorpayPaymentCapturedData,
} from "./client";

import { finalizeRazorpayPayment } from "./functions/finalize-razorpay-payment";

export const inngestFunctions = [finalizeRazorpayPayment];
