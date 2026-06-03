import { NextResponse } from "next/server";
import { WIZARD_ENTRY_UPLOAD_DRAFT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { validateUploadedDoc } from "@/lib/file-validation";
import { logger } from "@/lib/logger";
import {
  r2DeleteObject,
  r2KeyForSourceDraft,
  r2PutObject,
} from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, wizardEntry: true, sourceDraftR2Key: true },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ctype = req.headers.get("content-type") ?? "";

  if (ctype.includes("application/json")) {
    const raw = await req.json().catch(() => null);
    const skip =
      raw &&
      typeof raw === "object" &&
      (raw as { skip?: unknown }).skip === true;
    if (!skip)
      return NextResponse.json(
        { error: "Expected { skip: true }" },
        { status: 400 },
      );

    if (agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT) {
      return NextResponse.json(
        {
          error:
            "This agreement was started with an upload. Please attach your PDF or DOCX before continuing.",
        },
        { status: 400 },
      );
    }

    if (agreement.sourceDraftR2Key) {
      try {
        await r2DeleteObject(agreement.sourceDraftR2Key);
      } catch (err) {
        logger.warn("R2 delete failed on skip", { agreementId: params.id });
      }
    }

    await prisma.agreement.update({
      where: { id: params.id },
      data: {
        sourceDraftSkipped: true,
        sourceDraftR2Key: null,
        sourceDraftMime: null,
        sourceDraftOriginalName: null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const validation = await validateUploadedDoc({
    buffer: buf,
    originalName: file.name,
    declaredMime: file.type,
    maxBytes: MAX_BYTES,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }
  const doc = validation.doc;

  const newKey = r2KeyForSourceDraft(params.id, doc.originalName);
  try {
    await r2PutObject({
      key: newKey,
      body: doc.buffer,
      contentType: doc.mime,
      contentDisposition: `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
    });
  } catch (err) {
    logger.error("R2 upload failed", err, { agreementId: params.id });
    return NextResponse.json(
      { error: "Could not store file. Try again." },
      { status: 502 },
    );
  }

  // Best-effort delete of the previous object so we don't accumulate orphans.
  const previousKey = agreement.sourceDraftR2Key;

  await prisma.agreement.update({
    where: { id: params.id },
    data: {
      sourceDraftR2Key: newKey,
      sourceDraftMime: doc.mime,
      sourceDraftOriginalName: doc.originalName,
      sourceDraftSkipped: false,
    },
  });

  if (previousKey && previousKey !== newKey) {
    try {
      await r2DeleteObject(previousKey);
    } catch {
      logger.warn("R2 delete of previous draft failed", {
        agreementId: params.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
