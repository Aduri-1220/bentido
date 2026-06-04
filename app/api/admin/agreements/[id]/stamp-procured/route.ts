import { NextResponse } from "next/server";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { notifyAgreementEvent } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

/**
 * Admin marks a stamp paper as procured for an agreement. Advances the
 * workflow from E_STAMPING → E_SIGNING. Returns 409 if the agreement is
 * not currently in E_STAMPING.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user || !(await staffAgreementAccessForUserId(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agreement = await prisma.agreement.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agreement.status !== "E_STAMPING") {
    return NextResponse.json(
      { error: `Agreement is in ${agreement.status}, not E_STAMPING` },
      { status: 409 },
    );
  }

  const updated = await prisma.agreement.update({
    where: { id: params.id },
    data: { status: "E_SIGNING" },
  });

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: user.id,
    action: "stamp.procured",
    agreementId: params.id,
    before: { status: "E_STAMPING" },
    after: { status: "E_SIGNING" },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  await notifyAgreementEvent("stamp.procured", params.id);

  return NextResponse.json({ agreement: updated });
}
