import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { auditContextFromRequest, recordAuditEvent } from "@/lib/audit-log";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser, agreements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        state: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.agreement.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        wizardEntry: true,
        propertyJson: true,
        ownerJson: true,
        tenantJson: true,
        termsJson: true,
        clausesJson: true,
        witnessesJson: true,
        stampValue: true,
        createdAt: true,
        updatedAt: true,
        addOns: {
          select: {
            id: true,
            kind: true,
            qty: true,
            unitPrice: true,
            completedAt: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            provider: true,
            method: true,
            createdAt: true,
          },
        },
        delivery: {
          select: { id: true, method: true, address: true, trackingId: true },
        },
      },
    }),
  ]);

  const { ip, userAgent } = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "USER",
    actorId: user.id,
    action: "user.data_export",
    ip,
    userAgent,
  });

  return NextResponse.json(
    { exportedAt: new Date().toISOString(), user: dbUser, agreements },
    {
      headers: {
        "Content-Disposition": `attachment; filename="bentido-data-export-${user.id}.json"`,
        "Content-Type": "application/json",
      },
    },
  );
}
