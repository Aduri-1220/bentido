import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  WIZARD_ENTRY_FULL_DETAILS,
  WIZARD_ENTRY_UPLOAD_DRAFT,
  type WizardEntryKind,
} from "@/lib/constants";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreements = await prisma.agreement.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { addOns: true, delivery: true, payment: true },
  });
  return NextResponse.json({ agreements });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await enforceUserRateLimit({
    req,
    userId: user.id,
    prefix: "agreement-create",
    max: 30,
    windowSec: 3600,
  });
  if (limited) return limited;

  let wizardEntry: WizardEntryKind | undefined;
  const ctype = req.headers.get("content-type") ?? "";
  if (ctype.includes("application/json")) {
    const raw = await req.json().catch(() => null);
    const v =
      raw &&
      typeof raw === "object" &&
      (raw as { wizardEntry?: unknown }).wizardEntry;
    if (v === WIZARD_ENTRY_FULL_DETAILS || v === WIZARD_ENTRY_UPLOAD_DRAFT) {
      wizardEntry = v;
    }
  }

  const agreement = await prisma.agreement.create({
    data: {
      userId: user.id,
      status: "DRAFT",
      ...(wizardEntry === WIZARD_ENTRY_FULL_DETAILS
        ? {
            wizardEntry: WIZARD_ENTRY_FULL_DETAILS,
            sourceDraftSkipped: true,
          }
        : wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT
          ? { wizardEntry: WIZARD_ENTRY_UPLOAD_DRAFT }
          : {}),
    },
  });
  return NextResponse.json({ id: agreement.id });
}
