import { isAdminEmail } from "./admin";
import { prisma } from "./db";
import { isWorkerEmail } from "./worker";

/** May call staff agreement APIs (status, source-draft download, scanned PDF upload). */
export function hasStaffAgreementAccess(email: string | null | undefined): boolean {
  return isAdminEmail(email) || isWorkerEmail(email);
}

/** Server-only: resolves saved email before checking allowlists (avoids stale JWT email). */
export async function staffAgreementAccessForUserId(
  userId: string,
): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return hasStaffAgreementAccess(row?.email ?? null);
}
