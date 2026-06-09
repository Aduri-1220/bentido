import { NextResponse } from "next/server";
import { WIZARD_ENTRY_UPLOAD_DRAFT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { validateUploadedDoc } from "@/lib/file-validation";
import { logger } from "@/lib/logger";
import { r2DeleteObject, r2KeyForSourceDraft, r2PutObject } from "@/lib/r2";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { uploadFastTrackStep1Schema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { buildUploadFastTrackPayload } from "@/lib/upload-fast-track";

const MAX_BYTES = 5 * 1024 * 1024;

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await enforceUserRateLimit({
    req,
    userId: user.id,
    prefix: "upload-fast-track",
    max: 30,
    windowSec: 3600,
  });
  if (limited) return limited;

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!agreement)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (agreement.wizardEntry !== WIZARD_ENTRY_UPLOAD_DRAFT) {
    return NextResponse.json(
      { error: "This endpoint is only for upload-draft agreements." },
      { status: 400 },
    );
  }

  const form = await req.formData();

  const parsedBody = uploadFastTrackStep1Schema.safeParse({
    city: str(form, "city"),
    state: str(form, "state"),
    propertyPincode: str(form, "propertyPincode"),
    uploadOverridesRequested: str(form, "uploadOverridesRequested") === "true",
    securityDeposit: Number(str(form, "securityDeposit")),
    stampValue: Number(str(form, "stampValue")),
    rentExcludingMaintenance: str(form, "rentExcludingMaintenance"),
    startDate: str(form, "startDate"),
    landlordFullName: str(form, "landlordFullName"),
    landlordEmail: str(form, "landlordEmail"),
    landlordPhone: str(form, "landlordPhone"),
    landlordAge: str(form, "landlordAge"),
    landlordGender: str(form, "landlordGender"),
    landlordAadhaarLast4: str(form, "landlordAadhaarLast4"),
    landlordPincode: str(form, "landlordPincode"),
    tenantFullName: str(form, "tenantFullName"),
    tenantEmail: str(form, "tenantEmail"),
    tenantPhone: str(form, "tenantPhone"),
    tenantAge: str(form, "tenantAge"),
    tenantGender: str(form, "tenantGender"),
    tenantAadhaarLast4: str(form, "tenantAadhaarLast4"),
    tenantPincode: str(form, "tenantPincode"),
  });

  if (!parsedBody.success) {
    const first = parsedBody.error.flatten().fieldErrors;
    const msg = Object.values(first).flat()[0] ?? "Invalid details";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const fileField = form.get("file");
  let newR2Key: string | null = null;
  let newMime: string | null = null;
  let newOriginalName: string | null = null;

  if (fileField instanceof File && fileField.size > 0) {
    const buf = Buffer.from(await fileField.arrayBuffer());
    const validation = await validateUploadedDoc({
      buffer: buf,
      originalName: fileField.name,
      declaredMime: fileField.type,
      maxBytes: MAX_BYTES,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }
    const doc = validation.doc;
    newR2Key = r2KeyForSourceDraft(params.id, doc.originalName);
    try {
      await r2PutObject({
        key: newR2Key,
        body: doc.buffer,
        contentType: doc.mime,
        contentDisposition: `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
      });
    } catch (err) {
      logger.error("R2 upload failed (fast-track)", err, {
        agreementId: params.id,
      });
      return NextResponse.json(
        { error: "Could not store file. Try again." },
        { status: 502 },
      );
    }
    newMime = doc.mime;
    newOriginalName = doc.originalName;
  } else if (!agreement.sourceDraftR2Key) {
    return NextResponse.json(
      { error: "Upload your PDF or DOCX to continue." },
      { status: 400 },
    );
  }

  const payload = buildUploadFastTrackPayload(parsedBody.data);
  const stampValue = parsedBody.data.stampValue;
  const previousKey = agreement.sourceDraftR2Key;

  await prisma.agreement.update({
    where: { id: params.id },
    data: {
      ...payload,
      stampValue,
      ...(newR2Key && newMime && newOriginalName
        ? {
            sourceDraftR2Key: newR2Key,
            sourceDraftMime: newMime,
            sourceDraftOriginalName: newOriginalName,
            sourceDraftSkipped: false,
          }
        : {}),
    },
  });

  if (newR2Key && previousKey && previousKey !== newR2Key) {
    try {
      await r2DeleteObject(previousKey);
    } catch {
      logger.warn("R2 delete of previous draft failed (fast-track)", {
        agreementId: params.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
