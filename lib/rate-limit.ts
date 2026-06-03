import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

let warnedMissingRedis = false;

export async function rateLimitIdentity(
  prefix: string,
  identity: string,
  maxPerWindow: number,
  windowSeconds: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    if (!warnedMissingRedis) {
      warnedMissingRedis = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting is disabled.",
      );
    }
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

/**
 * Rate-limit a server action keyed by user id, with IP fallback for anonymous calls.
 * Returns a 429 NextResponse when the limit is exceeded; null when the caller may proceed.
 */
export async function enforceUserRateLimit(input: {
  req: Request;
  userId: string | null;
  prefix: string;
  max: number;
  windowSec: number;
}): Promise<NextResponse | null> {
  const identity = input.userId
    ? `u:${input.userId}`
    : `ip:${clientIpFromRequest(input.req)}`;
  const r = await rateLimitIdentity(
    input.prefix,
    `${input.prefix}:${identity}`,
    input.max,
    input.windowSec,
  );
  if (r.ok) return null;
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
  );
}

function clientIpFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
