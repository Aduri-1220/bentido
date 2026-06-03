import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { agreementStatusAllowsExecutedCopyDownload } from "@/lib/delivery-executed-copy";
import { logger } from "@/lib/logger";
import { r2PresignedGetUrl } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!agreementStatusAllowsExecutedCopyDownload(agreement.status)) {
    return NextResponse.json(
      {
        error:
          "Executed PDF is available from Out for Delivery onward, once e-stamping and e-signing are complete.",
      },
      { status: 403 },
    );
  }

  const row = await prisma.delivery.findFirst({
    where: {
      agreementId: params.id,
      method: { in: ["DIGITAL", "SCANNED_ONLINE"] },
      scannedCopyR2Key: { not: null },
    },
    select: {
      scannedCopyR2Key: true,
      scannedCopyMime: true,
      scannedCopyOriginalName: true,
    },
  });
  if (!row?.scannedCopyR2Key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = row.scannedCopyOriginalName ?? "scanned-agreement.pdf";
  const mime = row.scannedCopyMime ?? "application/pdf";

  try {
    const url = await r2PresignedGetUrl(row.scannedCopyR2Key, 300, {
      contentType: mime,
      contentDisposition: `attachment; filename="${encodeURIComponent(name)}"`,
    });
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    logger.error("R2 presign failed (executed copy)", err, {
      agreementId: params.id,
    });
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 502 },
    );
  }
}
