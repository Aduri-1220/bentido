export function validateEnv() {
  const isProduction = process.env.NODE_ENV === "production";

  // Always required
  const required = ["NEXTAUTH_SECRET", "DATABASE_URL"];

  // Production-only required
  if (isProduction) {
    required.push(
      "RAZORPAY_WEBHOOK_SECRET",
      "NEXTAUTH_URL",
      "RESEND_API_KEY",
    );
  }

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Warn about optional but recommended in prod
  if (isProduction) {
    const recommended = [
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ];
    const notSet = recommended.filter((k) => !process.env[k]);
    if (notSet.length > 0) {
      console.warn(
        `⚠️  Recommended environment variables not set (rate limiting disabled): ${notSet.join(", ")}`,
      );
    }
  }
}

// Call at module load (before anything else runs)
validateEnv();
