import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deliveryUsesExecutedCopyUpload } from "@/lib/delivery-executed-copy";
import { getCurrentUser } from "@/lib/session";
import { staffAgreementAccessForUserId } from "@/lib/staff-agreement-access";

const MAX_BYTES = 15 * 1024 * 1024;

function inferMime(file: File): string {
  if (file.type) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

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
      scannedCopyBlob: { not: null },
    },
    select: {
      scannedCopyBlob: true,
      scannedCopyMime: true,
      scannedCopyOriginalName: true,
    },
  });
  if (!row?.scannedCopyBlob) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = row.scannedCopyOriginalName ?? "scanned-agreement.pdf";
  const mime = row.scannedCopyMime ?? "application/pdf";

  return new NextResponse(new Uint8Array(row.scannedCopyBlob), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
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
  if (fileField.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 15 MB)" },
      { status: 400 },
    );
  }

  const lower = fileField.name.toLowerCase();
  if (!lower.endsWith(".pdf") && fileField.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await fileField.arrayBuffer());
  const mime = inferMime(fileField);
  const originalName = fileField.name;

  await prisma.delivery.update({
    where: { agreementId: params.id },
    data: {
      scannedCopyBlob: buf,
      scannedCopyMime: mime,
      scannedCopyOriginalName: originalName,
      scannedCopyUploadedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
