/**
 * Operations workers (non-financial portal) via WORKER_EMAILS (comma-separated,
 * case-insensitive). Separate from ADMIN_EMAILS — workers use /worker only.
 */
export function workerEmailSet(): Set<string> {
  // Prefer WORKER_EMAILS; accept lowercase typo some editors suggest.
  const raw =
    process.env.WORKER_EMAILS ??
    process.env.worker_emails ??
    process.env.worker_email ??
    "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isWorkerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return workerEmailSet().has(email.trim().toLowerCase());
}
