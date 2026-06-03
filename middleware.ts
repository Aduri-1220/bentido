import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitIdentity } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Security headers are set globally in next.config.mjs `headers()`.

const RATE: Record<string, { prefix: string; max: number; windowSec: number }> =
  {
    "/api/sign-up": { prefix: "signup", max: 20, windowSec: 3600 },
    "/api/auth/forgot-password": { prefix: "forgot", max: 8, windowSec: 3600 },
    "/api/auth/resend-verification": {
      prefix: "resend",
      max: 12,
      windowSec: 3600,
    },
    "/api/auth/reset-password": { prefix: "reset", max: 30, windowSec: 3600 },
    "/api/auth/verify-email": {
      prefix: "verify-get",
      max: 60,
      windowSec: 3600,
    },
  };

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const rule = RATE[path];

  if (rule) {
    const ip = clientIp(req);
    const r = await rateLimitIdentity(
      rule.prefix,
      `${rule.prefix}:${ip}`,
      rule.max,
      rule.windowSec,
    );
    if (!r.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(r.retryAfterSec) },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/sign-up",
    "/api/auth/forgot-password",
    "/api/auth/resend-verification",
    "/api/auth/reset-password",
    "/api/auth/verify-email",
  ],
};
