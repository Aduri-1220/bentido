import { NextResponse } from "next/server";
import { z } from "zod";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import { hashInviteToken } from "@/lib/counterparty-invite";
import { prisma } from "@/lib/db";
import { notifyAgreementEvent } from "@/lib/notifications";

const bodySchema = z.object({
  comment: z
    .string()
    .min(5, "Please describe the changes")
    .max(2000, "Comment is too long"),
});

/**
 * Counterparty asks the owner to revise the draft. The status flips to
 * CHANGES_REQUESTED and the comment surfaces in the owner's preview screen.
 * Owner must then send a fresh invite (which rotates the token).
 */
export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  let json: unknown = null;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

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
    return NextResponse.json(
      { error: "You already approved this invite" },
      { status: 409 },
    );
  }
  if (agreement.counterpartyApprovalStatus === "CHANGES_REQUESTED") {
    return NextResponse.json({ ok: true });
  }

  await prisma.agreement.update({
    where: { id: agreement.id },
    data: {
      counterpartyApprovalStatus: "CHANGES_REQUESTED",
      counterpartyChangesComment: parsed.data.comment,
      counterpartyRespondedAt: new Date(),
    },
  });

  await notifyAgreementEvent("counterparty.changes_requested", agreement.id);

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "SYSTEM",
    actorId: "system:counterparty",
    action: "counterparty.changes_requested",
    agreementId: agreement.id,
    after: { commentLength: parsed.data.comment.length },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return NextResponse.json({ ok: true });
}
