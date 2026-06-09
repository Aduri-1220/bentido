import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const patchSchema = z.object({
  step: z.enum([
    "property",
    "owner",
    "tenant",
    "terms",
    "clauses",
    "witnesses",
  ]),
  data: z.unknown(),
});

const COLUMN: Record<string, string> = {
  property: "propertyJson",
  owner: "ownerJson",
  tenant: "tenantJson",
  terms: "termsJson",
  clauses: "clausesJson",
  witnesses: "witnessesJson",
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    include: { addOns: true, delivery: true, payment: true },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ agreement });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
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

  const col = COLUMN[parsed.data.step];
  const json = JSON.stringify(parsed.data.data);
  const updated = await prisma.agreement.update({
    where: { id: params.id },
    data: { [col]: json },
  });
  return NextResponse.json({ agreement: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { status: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft agreements can be deleted." },
      { status: 403 },
    );
  }

  await prisma.agreement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
