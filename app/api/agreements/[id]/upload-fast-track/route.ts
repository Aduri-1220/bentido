import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { WIZARD_ENTRY_UPLOAD_DRAFT } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { uploadFastTrackStep1Schema } from "@/lib/schemas";
import { buildUploadFastTrackPayload } from "@/lib/upload-fast-track";

const MAX_BYTES = 5 * 1024 * 1024;

function isAllowedDoc(file: File): boolean {
  const mime = file.type;
  if (
    mime === "application/pdf" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return true;
  }
  const n = file.name.toLowerCase();
  return n.endsWith(".pdf") || n.endsWith(".docx");
}

function inferMime(file: File): string {
  if (file.type) return file.type;
  return file.name.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

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
  let buf: Buffer | null = null;
  let mime: string | null = null;
  let originalName: string | null = null;

  if (fileField instanceof File && fileField.size > 0) {
    if (fileField.size > MAX_BYTES)
      return NextResponse.json(
        { error: "File too large (max 5 MB)" },
        { status: 400 },
      );
    if (!isAllowedDoc(fileField))
      return NextResponse.json(
        { error: "Only PDF or DOCX files are allowed" },
        { status: 400 },
      );
    buf = Buffer.from(await fileField.arrayBuffer());
    mime = inferMime(fileField);
    originalName = fileField.name;
  } else if (!agreement.sourceDraftBlob) {
    return NextResponse.json(
      { error: "Upload your PDF or DOCX to continue." },
      { status: 400 },
    );
  }

  const payload = buildUploadFastTrackPayload(parsedBody.data);
  const stampValue = parsedBody.data.stampValue;

  await prisma.agreement.update({
    where: { id: params.id },
    data: {
      ...payload,
      stampValue,
      ...(buf && mime && originalName
        ? {
            sourceDraftBlob: buf,
            sourceDraftMime: mime,
            sourceDraftOriginalName: originalName,
            sourceDraftSkipped: false,
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
