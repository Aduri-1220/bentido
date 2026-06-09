export interface LogContext {
  requestId?: string;
  userId?: string;
  agreementId?: string;
  [key: string]: any;
}

/**
 * Keys whose values may carry PII or secrets. Matched case-insensitively as
 * substrings — e.g. "phoneNumber", "userEmail", "accessToken" all redact.
 */
const REDACT_KEY_PATTERNS = [
  "password",
  "passwordhash",
  "secret",
  "token",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "email",
  "phone",
  "aadhaar",
  "pan",
  "otp",
];

function shouldRedactKey(key: string): boolean {
  const k = key.toLowerCase();
  // Always allow these correlation keys through.
  if (k === "userid" || k === "agreementid" || k === "requestid") return false;
  return REDACT_KEY_PATTERNS.some((p) => k.includes(p));
}

function scrub(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = shouldRedactKey(k) ? "[redacted]" : scrub(v, depth + 1);
    }
    return out;
  }
  return value;
}

class Logger {
  private isDev = process.env.NODE_ENV !== "production";

  private log(
    level: "INFO" | "WARN" | "ERROR",
    message: string,
    context?: LogContext,
  ) {
    const scrubbed = context ? (scrub(context) as LogContext) : undefined;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(scrubbed && Object.keys(scrubbed).length > 0
        ? { context: scrubbed }
        : {}),
    };

    if (this.isDev) {
      // Pretty print in dev
      const prefix = {
        INFO: "ℹ️ ",
        WARN: "⚠️  ",
        ERROR: "❌",
      }[level];
      console.log(prefix, message, scrubbed ? scrubbed : "");
    } else {
      // JSON format in production for log aggregation
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, context?: LogContext) {
    this.log("INFO", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("WARN", message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const fullContext = {
      ...context,
      ...(error instanceof Error
        ? { errorMessage: error.message, errorStack: error.stack }
        : error
          ? { error: String(error) }
          : {}),
    };
    this.log("ERROR", message, fullContext);
  }
}

export const logger = new Logger();

/**
 * Extract the request id set by `middleware.ts` (header X-Request-ID).
 * Use in route handlers so logs and audit rows can be correlated end-to-end.
 *   const reqId = requestIdFromHeaders(req.headers);
 *   logger.info("agreement created", { requestId: reqId, agreementId });
 */
export function requestIdFromHeaders(
  headers: Headers | Request["headers"],
): string | undefined {
  const h = headers as Headers;
  return h.get("x-request-id") ?? undefined;
}
