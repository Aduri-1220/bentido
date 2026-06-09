import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimitIdentity } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Security headers are set globally in next.config.mjs. This helper adds request ID.
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function addRequestId(res: NextResponse, requestId: string): NextResponse {
  res.headers.set("X-Request-ID", requestId);
  return res;
}

const RATE: Record<string, { prefix: string; max: number; windowSec: number }> =
  {
    "/api/sign-up": { prefix: "signup", max: 20, windowSec: 3600 },
    "/api/auth/callback/credentials": {
      prefix: "signin",
      max: 10,
      windowSec: 900,
    },
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
  const requestId = generateRequestId();
  const path = req.nextUrl.pathname;

  /** Staff should not remain on customer onboarding (JWT carries isWorker / isAdmin). */
  if (path === "/onboarding" || path.startsWith("/onboarding/")) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) {
      const token = (await getToken({
        req,
        secret,
      })) as { isWorker?: boolean; isAdmin?: boolean } | null;
      if (token?.isWorker === true) {
        const url = req.nextUrl.clone();
        url.pathname = "/worker";
        url.search = "";
        return addRequestId(NextResponse.redirect(url), requestId);
      }
      if (token?.isAdmin === true) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return addRequestId(NextResponse.redirect(url), requestId);
      }
    }
  }

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
      const res = NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(r.retryAfterSec) },
        },
      );
      return addRequestId(res, requestId);
    }
  }

  const res = NextResponse.next();
  return addRequestId(res, requestId);
}

export const config = {
  matcher: [
    "/onboarding",
    "/onboarding/:path*",
    "/api/sign-up",
    "/api/auth/callback/credentials",
    "/api/auth/forgot-password",
    "/api/auth/resend-verification",
    "/api/auth/reset-password",
    "/api/auth/verify-email",
  ],
};
