import { NextResponse } from "next/server";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import { hashInviteToken } from "@/lib/counterparty-invite";
import { prisma } from "@/lib/db";
import { notifyAgreementEvent } from "@/lib/notifications";

/**
 * Counterparty approves the draft. Public route — auth is the unguessable
 * 32-byte token. Idempotent: a second approve on the same row is a no-op.
 */
export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const tokenHash = hashInviteToken(params.token);
  const agreement = await prisma.agreement.findUnique({
    where: { counterpartyInviteTokenHash: tokenHash },
    select: {
      id: true,
      counterpartyApprovalStatus: true,
      counterpartyInviteExpiresAt: true,
    },
  });
  if (!agreement) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (
    !agreement.counterpartyInviteExpiresAt ||
    agreement.counterpartyInviteExpiresAt < new Date()
  ) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }
  if (agreement.counterpartyApprovalStatus === "APPROVED") {
    return NextResponse.json({ ok: true });
  }
  if (agreement.counterpartyApprovalStatus === "CHANGES_REQUESTED") {
    return NextResponse.json(
      { error: "You already requested changes on this invite" },
      { status: 409 },
    );
  }

  await prisma.agreement.update({
    where: { id: agreement.id },
    data: {
      counterpartyApprovalStatus: "APPROVED",
      counterpartyRespondedAt: new Date(),
      counterpartyChangesComment: null,
    },
  });

  await notifyAgreementEvent("counterparty.approved", agreement.id);

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "SYSTEM",
    actorId: "system:counterparty",
    action: "counterparty.approved",
    agreementId: agreement.id,
    after: { via: "magic_link" },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return NextResponse.json({ ok: true });
}
