import { NextResponse } from "next/server";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { notifyAgreementEvent } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

/**
 * Staff (admin or worker) sets/clears the courier tracking ID on a delivery
 * record. Tracking IDs are typed in manually after booking the shipment with
 * whichever courier the operator picked.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user || !(await staffAgreementAccessForUserId(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { trackingId?: string | null } = {};
  try {
    body = (await req.json()) as { trackingId?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.trackingId;
  const next =
    typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
  if (next !== null && next.length > 64) {
    return NextResponse.json(
      { error: "Tracking ID is too long (max 64 chars)" },
      { status: 400 },
    );
  }

  const delivery = await prisma.delivery.findUnique({
    where: { agreementId: params.id },
    select: { id: true, trackingId: true },
  });
  if (!delivery) {
    return NextResponse.json(
      { error: "No delivery record for this agreement" },
      { status: 404 },
    );
  }

  if (delivery.trackingId === next) {
    return NextResponse.json({ ok: true, trackingId: next });
  }

  await prisma.delivery.update({
    where: { agreementId: params.id },
    data: { trackingId: next },
  });

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: user.id,
    action: "delivery.tracking_id_updated",
    agreementId: params.id,
    before: { trackingId: delivery.trackingId },
    after: { trackingId: next },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  if (next) {
    await notifyAgreementEvent("delivery.tracking_set", params.id);
  }

  return NextResponse.json({ ok: true, trackingId: next });
}
