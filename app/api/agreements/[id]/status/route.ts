import { NextResponse } from "next/server";
import { z } from "zod";
import {
  agreementStatusSchema,
  parseAgreementStatus,
  paymentQualifiesForWorkflow,
  validateUserHttpStatusTransition,
} from "@/lib/agreement-status";
import { prisma } from "@/lib/db";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

const bodySchema = z.object({
  status: agreementStatusSchema,
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (process.env.DISABLE_PUBLIC_AGREEMENT_STATUS_ADVANCE === "true") {
    return NextResponse.json(
      {
        error:
          "Public workflow advances are disabled. Use provider callbacks or admin tools.",
      },
      { status: 403 },
    );
  }

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await enforceUserRateLimit({
    req,
    userId: user.id,
    prefix: "agreement-status",
    max: 60,
    windowSec: 3600,
  });
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
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
