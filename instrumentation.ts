/**
 * Next.js runtime hook fired once per server process at startup.
 * Use it for boot-time invariants that should fail fast.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertPaymentProviderSafeForEnvironment } =
      await import("@/lib/payment-config");
    assertPaymentProviderSafeForEnvironment();

    if (process.env.SENTRY_DSN) {
      await import("./sentry.server.config");
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    if (process.env.SENTRY_DSN) {
      await import("./sentry.edge.config");
    }
  }
}
