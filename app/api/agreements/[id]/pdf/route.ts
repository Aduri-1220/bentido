import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAgreementPdfCached } from "@/lib/pdf-cache";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

/**
 * GET /api/agreements/:id/pdf
 *
 * Returns the server-rendered agreement PDF as application/pdf with an
 * attachment disposition so the browser actually downloads a file (instead
 * of the customer manually using "Save as PDF" from the preview page).
 *
 * Authorisation: agreement owner OR staff (ADMIN / WORKER).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agreement = await prisma.agreement.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owns = agreement.userId === user.id;
  const isStaff = owns
    ? false
    : await staffAgreementAccessForUserId(user.id);
  if (!owns && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base64 = await generateAgreementPdfCached(params.id);
  const pdf = Buffer.from(base64, "base64");

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rental-agreement-${params.id.slice(0, 8)}.pdf"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
