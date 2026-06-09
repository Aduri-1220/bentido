import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";

// DPDPA right-to-erasure: soft-deletes user + all agreements.
// Hard deletion is handled offline by a scheduled admin job (data retention policy).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Fetch before-state for audit trail (non-sensitive fields only).
  const before = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  await prisma.$transaction([
    prisma.agreement.updateMany({
      where: { userId: user.id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: now },
    }),
  ]);

  const { ip, userAgent } = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "USER",
    actorId: user.id,
    action: "user.delete_requested",
    before,
    after: { deletedAt: now.toISOString() },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, deletedAt: now.toISOString() });
}
