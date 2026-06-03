import { NextResponse } from "next/server";
import { z } from "zod";
import {
  agreementStatusSchema,
  parseAgreementStatus,
  paymentQualifiesForWorkflow,
  validateUserHttpStatusTransition,
} from "@/lib/agreement-status";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

const bodySchema = z.object({
  status: agreementStatusSchema,
});

/**
 * Advance agreement workflow for any customer — staff (`ADMIN_EMAILS` or `WORKER_EMAILS`).
 * Same transition rules as POST /api/agreements/:id/status (linear, payment required).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user || !(await staffAgreementAccessForUserId(user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const agreement = await prisma.agreement.findUnique({
    where: { id: params.id },
    include: { payment: true },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = parseAgreementStatus(agreement.status);
  if (!current)
    return NextResponse.json(
      { error: "Invalid agreement state" },
      { status: 500 },
    );

  const workflowPaymentOk = paymentQualifiesForWorkflow(agreement.payment);
  const transition = validateUserHttpStatusTransition(
    current,
    parsed.data.status,
    workflowPaymentOk,
  );
  if (!transition.ok)
    return NextResponse.json(
      { error: transition.message, code: transition.code },
      { status: 409 },
    );

  const updated = await prisma.agreement.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ agreement: updated });
}
