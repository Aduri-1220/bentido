import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { deliveryUsesExecutedCopyUpload } from "@/lib/delivery-executed-copy";
import { computeTotal, PRICING, type DeliveryMethod } from "@/lib/pricing";

const bodySchema = z.object({
  esignSignatories: z.number().int().min(0).max(8),
  notary: z.boolean(),
  extraCopies: z.number().int().min(0).max(20),
  delivery: z.enum([
    "DIGITAL",
    "SCANNED_ONLINE",
    "STANDARD",
    "EXPRESS",
  ]),
  deliveryAddress: z.string().optional(),
  stampValue: z.number().int().min(50),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const d = parsed.data;
  const breakdown = computeTotal({
    esignSignatories: d.esignSignatories,
    notary: d.notary,
    extraCopies: d.extraCopies,
    delivery: d.delivery as DeliveryMethod,
    stampDuty: d.stampValue,
  });

  const noCourierAddress =
    d.delivery === "DIGITAL" || d.delivery === "SCANNED_ONLINE";

  await prisma.$transaction(async (tx) => {
    await tx.addOn.deleteMany({ where: { agreementId: params.id } });
    if (d.esignSignatories > 0) {
      await tx.addOn.create({
        data: {
          agreementId: params.id,
          kind: "ESIGN",
          qty: d.esignSignatories,
          unitPrice: PRICING.esignPerSignatory,
        },
      });
    }
    if (d.notary) {
      await tx.addOn.create({
        data: {
          agreementId: params.id,
          kind: "NOTARY",
          qty: 1,
          unitPrice: PRICING.notary,
        },
      });
    }
    if (d.extraCopies > 0) {
      await tx.addOn.create({
        data: {
          agreementId: params.id,
          kind: "EXTRA_COPY",
          qty: d.extraCopies,
          unitPrice: PRICING.extraCopy,
        },
      });
    }
    await tx.delivery.upsert({
      where: { agreementId: params.id },
      create: {
        agreementId: params.id,
        method: d.delivery,
        address: noCourierAddress ? null : d.deliveryAddress,
      },
      update: {
        method: d.delivery,
        address: noCourierAddress ? null : d.deliveryAddress,
        ...(deliveryUsesExecutedCopyUpload(d.delivery)
          ? {}
          : {
              scannedCopyR2Key: null,
              scannedCopyMime: null,
              scannedCopyOriginalName: null,
              scannedCopyUploadedAt: null,
            }),
      },
    });
    await tx.agreement.update({
      where: { id: params.id },
      data: { stampValue: d.stampValue },
    });
  });

  return NextResponse.json({ ok: true, total: breakdown.total });
}
