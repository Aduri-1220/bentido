export interface LogContext {
  requestId?: string;
  userId?: string;
  agreementId?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV !== "production";

  private log(
    level: "INFO" | "WARN" | "ERROR",
    message: string,
    context?: LogContext,
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };

    if (this.isDev) {
      // Pretty print in dev
      const prefix = {
        INFO: "ℹ️ ",
        WARN: "⚠️  ",
        ERROR: "❌",
      }[level];
      console.log(prefix, message, context ? context : "");
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
