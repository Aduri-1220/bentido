import { NextResponse } from "next/server";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

/**
 * Admin records that the off-platform notary visit for a NOTARY add-on is
 * done. Stamps `AddOn.completedAt` and emits an audit event. Does not change
 * the agreement's main status (notary is an opt-in side-quest).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user || !(await staffAgreementAccessForUserId(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const addon = await prisma.addOn.findUnique({
    where: { id: params.id },
    select: { id: true, kind: true, agreementId: true, completedAt: true },
  });
  if (!addon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (addon.kind !== "NOTARY") {
    return NextResponse.json(
      { error: "Add-on is not a notary item" },
      { status: 400 },
    );
  }
  if (addon.completedAt) {
    return NextResponse.json(
      { error: "Already marked notarised" },
      { status: 409 },
    );
  }

  const now = new Date();
  await prisma.addOn.update({
    where: { id: params.id },
    data: { completedAt: now },
  });

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: user.id,
    action: "notary.completed",
    agreementId: addon.agreementId,
    after: { addOnId: addon.id, completedAt: now.toISOString() },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return NextResponse.json({ ok: true });
}
