import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import * as Sentry from "@sentry/nextjs";

const REDACTED = "[Filtered]";

const SENSITIVE_BODY_KEYS = new Set([
  "email",
  "phone",
  "password",
  "token",
  "secret",
  "pan",
  "aadhaar",
  "aadhaarLast4",
  "authorization",
]);

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (
      SENSITIVE_BODY_KEYS.has(lower) ||
      lower.startsWith("aadhaar") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("password")
    ) {
      out[k] = REDACTED;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function scrubEvent(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.request) {
    if (event.request.headers) {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.request.headers)) {
        headers[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) ? REDACTED : v;
      }
      event.request.headers = headers;
    }
    if (event.request.cookies) {
      event.request.cookies =
        REDACTED as unknown as typeof event.request.cookies;
    }
    if (event.request.data && typeof event.request.data === "object") {
      event.request.data = scrubObject(
        event.request.data as Record<string, unknown>,
      );
    }
  }
  if (event.extra && typeof event.extra === "object") {
    event.extra = scrubObject(event.extra as Record<string, unknown>);
  }
  return event;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.SENTRY_DSN),
  beforeSend: scrubEvent,
});
