import { NextResponse } from "next/server";
import { recordAuditEvent, auditContextFromRequest } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { deliveryUsesExecutedCopyUpload } from "@/lib/delivery-executed-copy";
import { validateUploadedDoc } from "@/lib/file-validation";
import { logger } from "@/lib/logger";
import {
  r2DeleteObject,
  r2KeyForExecutedCopy,
  r2PresignedGetUrl,
  r2PutObject,
} from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user || !(await staffAgreementAccessForUserId(user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    logger.error("R2 presign failed (admin executed copy)", err, {
      agreementId: params.id,
    });
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 502 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user || !(await staffAgreementAccessForUserId(user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const delivery = await prisma.delivery.findUnique({
    where: { agreementId: params.id },
    select: { method: true, scannedCopyR2Key: true },
  });
  if (!delivery) {
    return NextResponse.json(
      { error: "No delivery record for this agreement" },
      { status: 400 },
    );
  }
  if (!deliveryUsesExecutedCopyUpload(delivery.method)) {
    return NextResponse.json(
      {
        error:
          "Customer did not choose digital delivery with team upload or online scanned copy. Change delivery under add-ons.",
      },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileField = form.get("file");
  if (!(fileField instanceof File) || fileField.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

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
  if (validation.doc.mime !== "application/pdf") {
    return NextResponse.json(
      { error: "Executed copy must be a PDF." },
      { status: 400 },
    );
  }

  const doc = validation.doc;
  const newKey = r2KeyForExecutedCopy(params.id, doc.originalName);
  try {
    await r2PutObject({
      key: newKey,
      body: doc.buffer,
      contentType: doc.mime,
      contentDisposition: `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
    });
  } catch (err) {
    logger.error("R2 upload failed (executed copy)", err, {
      agreementId: params.id,
    });
    return NextResponse.json(
      { error: "Could not store file. Try again." },
      { status: 502 },
    );
  }

  const previousKey = delivery.scannedCopyR2Key;

  await prisma.delivery.update({
    where: { agreementId: params.id },
    data: {
      scannedCopyR2Key: newKey,
      scannedCopyMime: doc.mime,
      scannedCopyOriginalName: doc.originalName,
      scannedCopyUploadedAt: new Date(),
    },
  });

  if (previousKey && previousKey !== newKey) {
    try {
      await r2DeleteObject(previousKey);
    } catch {
      logger.warn("R2 delete of previous executed copy failed", {
        agreementId: params.id,
      });
    }
  }

  const ctx = auditContextFromRequest(req);
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: user.id,
    action: "delivery.executed_copy_uploaded",
    agreementId: params.id,
    after: { originalName: doc.originalName, mime: doc.mime },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return NextResponse.json({ ok: true });
}
