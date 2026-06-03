import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { initiateKyc, digioGatewayUrl, DigiError } from "@/lib/digio";

const initiateSchema = z.object({
  party: z.enum(["OWNER", "TENANT"]),
  /** Full 12-digit Aadhaar — used only to derive mobile for Digio, never stored. */
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerMobile: z.string().regex(/^[6-9]\d{9}$/),
});

/** GET /api/agreements/[id]/kyc — returns KYC status rows for owner + tenant */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.kycVerification.findMany({
    where: { agreementId: params.id },
    select: {
      party: true,
      status: true,
      verifiedName: true,
      maskedAadhaar: true,
      verifiedAt: true,
    },
  });

  return NextResponse.json({ kyc: rows });
}

/** POST /api/agreements/[id]/kyc — initiate Aadhaar OTP KYC for a party */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = initiateSchema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { party, customerEmail, customerName, customerMobile } = body.data;
  const referenceId = `${params.id}_${party}`;

  // Upsert a KYC row (reset if previously initiated so user can retry)
  const existing = await prisma.kycVerification.findUnique({
    where: { agreementId_party: { agreementId: params.id, party } },
  });

  if (existing?.status === "VERIFIED") {
    return NextResponse.json(
      { error: "Aadhaar already verified for this party." },
      { status: 409 },
    );
  }

  try {
    const digioResp = await initiateKyc({
      customerEmail,
      customerName,
      customerMobile,
      referenceId,
    });

    await prisma.kycVerification.upsert({
      where: { agreementId_party: { agreementId: params.id, party } },
      create: {
        agreementId: params.id,
        party,
        digioKycId: digioResp.id,
        status: "INITIATED",
      },
      update: {
        digioKycId: digioResp.id,
        status: "INITIATED",
        verifiedName: null,
        maskedAadhaar: null,
        verifiedAt: null,
      },
    });

    const gatewayUrl = digioGatewayUrl(
      digioResp.id,
      digioResp.access_token,
      customerEmail,
    );

    return NextResponse.json({ kycId: digioResp.id, gatewayUrl });
  } catch (err) {
    if (err instanceof DigiError) {
      return NextResponse.json(
        { error: `Digio error: ${err.message}` },
        { status: 502 },
      );
    }
    throw err;
  }
}
