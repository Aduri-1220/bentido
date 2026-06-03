import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    select: {
      sourceDraftR2Key: true,
      sourceDraftMime: true,
      sourceDraftOriginalName: true,
    },
  });
  if (!agreement?.sourceDraftR2Key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = agreement.sourceDraftOriginalName ?? "rental-draft.pdf";
  const mime = agreement.sourceDraftMime ?? "application/octet-stream";

  try {
    const url = await r2PresignedGetUrl(agreement.sourceDraftR2Key, 300, {
      contentType: mime,
      contentDisposition: `attachment; filename="${encodeURIComponent(name)}"`,
    });
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    logger.error("R2 presign failed", err, { agreementId: params.id });
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 502 },
    );
  }
}
