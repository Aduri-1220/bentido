import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

export async function rateLimitIdentity(
  prefix: string,
  identity: string,
  maxPerWindow: number,
  windowSeconds: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production (rate limiting required)",
      );
    }
    // In dev, allow requests without rate limiting
    return { ok: true };
  }

  const redis = new Redis({
    url,
    token,
  });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxPerWindow, `${windowSeconds} s`),
    analytics: false,
    prefix: `webroker:${prefix}`,
  });

  const { success, reset } = await limiter.limit(identity);
  if (success) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { ok: false, retryAfterSec };
}
