export type PaymentProviderKind = "MOCK" | "RAZORPAY";

export function getPaymentProvider(): PaymentProviderKind {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (raw === "razorpay") return "RAZORPAY";
  return "MOCK";
}

/** Mock simulate (success/failure) — never on in production unless explicitly enabled (e.g. E2E). */
export function isPaymentSimulateAllowed(): boolean {
  if (process.env.ENABLE_PAYMENT_SIMULATE === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function isMockCheckoutForbiddenInProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    getPaymentProvider() === "MOCK" &&
    process.env.ENABLE_PAYMENT_SIMULATE !== "true"
  );
}

/**
 * Hard boot guard: refuse to run with MOCK payment provider in production
 * unless an explicit override env var (ALLOW_MOCK_PAYMENTS_IN_PROD=true) is set.
 * Call once at process startup (instrumentation.ts).
 */
export function assertPaymentProviderSafeForEnvironment(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (getPaymentProvider() !== "MOCK") return;
  if (process.env.ALLOW_MOCK_PAYMENTS_IN_PROD === "true") {
    console.warn(
      "[payment-config] MOCK payment provider enabled in production via ALLOW_MOCK_PAYMENTS_IN_PROD=true. Staging only — never expose to real customers.",
    );
    return;
  }
  throw new Error(
    "Refusing to boot: PAYMENT_PROVIDER=mock is not allowed in production. Set PAYMENT_PROVIDER=razorpay with API keys, or ALLOW_MOCK_PAYMENTS_IN_PROD=true for staging.",
  );
}

/** Demo shortcut: owner can self-approve as tenant instead of waiting on the email link. */
export function isCounterpartySelfApproveAllowed(): boolean {
  if (process.env.ALLOW_SELF_APPROVE_TENANT_REVIEW === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function getRazorpayPublishableKey(): string | undefined {
  return process.env.RAZORPAY_KEY_ID?.trim() || undefined;
}

/** Key id + secret — required to create orders and verify client callbacks. */
export function assertRazorpayApiKeysConfigured(): void {
  if (!process.env.RAZORPAY_KEY_ID?.trim())
    throw new Error("RAZORPAY_KEY_ID is not set");
  if (!process.env.RAZORPAY_KEY_SECRET?.trim())
    throw new Error("RAZORPAY_KEY_SECRET is not set");
}

/** Full stack: API keys + webhook signing secret (needed only for `/api/webhooks/razorpay`). */
export function assertRazorpaySecretsConfigured(): void {
  assertRazorpayApiKeysConfigured();
  if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim())
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
}
