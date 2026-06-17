import { NextResponse } from "next/server";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { isCounterpartySelfApproveAllowed } from "@/lib/payment-config";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

/**
 * Demo-only shortcut: owner approves on the tenant's behalf instead of
 * waiting on the emailed magic link. Gated by isCounterpartySelfApproveAllowed
 * (dev by default; ALLOW_SELF_APPROVE_TENANT_REVIEW=true to enable in prod).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isCounterpartySelfApproveAllowed()) {
    return NextResponse.json(
      { error: "Self-approve is disabled in this environment." },
      { status: 403 },
    );
  }

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await enforceUserRateLimit({
    req,
    userId: user.id,
    prefix: "approve-as-tenant",
    max: 20,
    windowSec: 60,
  });
  if (limited) return limited;

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, counterpartyApprovalStatus: true },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (agreement.counterpartyApprovalStatus !== "APPROVED") {
    await prisma.agreement.update({
      where: { id: agreement.id },
      data: {
        counterpartyApprovalStatus: "APPROVED",
        counterpartyRespondedAt: new Date(),
        counterpartyChangesComment: null,
      },
    });

    const ctx = auditContextFromRequest(req);
    await recordAuditEvent({
      actorType: "USER",
      actorId: user.id,
      action: "counterparty.approved",
      agreementId: agreement.id,
      after: { via: "self_approve_demo" },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return NextResponse.json({ ok: true });
}
