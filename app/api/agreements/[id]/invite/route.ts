import { NextResponse } from "next/server";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiryFromNow,
} from "@/lib/counterparty-invite";
import { prisma } from "@/lib/db";
import { notifyCounterpartyInvited } from "@/lib/notifications";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

/**
 * Owner sends (or re-sends) the counterparty review invite. Rotates the
 * token, resets the approval status to PENDING and dispatches the magic
 * link to the tenant. Allowed only while the agreement is still in DRAFT
 * — once payment is taken the workflow takes over.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceUserRateLimit({
    req,
    userId: user.id,
    prefix: "counterparty-invite",
    max: 10,
    windowSec: 3600,
  });
  if (limited) return limited;

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: {
      id: true,
      status: true,
      tenantJson: true,
      counterpartyApprovalStatus: true,
    },
  });
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agreement.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Invites can only be sent before payment." },
      { status: 409 },
    );
  }
  if (!agreement.tenantJson) {
    return NextResponse.json(
      { error: "Add tenant details before inviting them to review." },
      { status: 400 },
    );
  }

  const plain = generateInviteToken();
  const tokenHash = hashInviteToken(plain);
  const expiresAt = inviteExpiryFromNow();

  await prisma.agreement.update({
    where: { id: params.id },
    data: {
      counterpartyApprovalStatus: "PENDING",
      counterpartyInviteTokenHash: tokenHash,
      counterpartyInviteSentAt: new Date(),
      counterpartyInviteExpiresAt: expiresAt,
      counterpartyChangesComment: null,
      counterpartyRespondedAt: null,
    },
  });

  await notifyCounterpartyInvited(params.id, plain);

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "USER",
    actorId: user.id,
    action: "counterparty.invited",
    agreementId: params.id,
    after: { expiresAt: expiresAt.toISOString() },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
