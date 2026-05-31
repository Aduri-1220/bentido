import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { initiateESign, digioGatewayUrl, getESignStatus, DigiError } from "@/lib/digio";
import { generateAgreementPdfCached, invalidatePdfCache } from "@/lib/pdf-cache";

/** GET /api/agreements/[id]/esign — returns eSign status for all parties */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.eSignRequest.findMany({
    where: { agreementId: params.id },
    select: {
      party: true,
      status: true,
      digioDocId: true,
      accessToken: true,
      signerEmail: true,
      signedAt: true,
    },
  });

  // If a doc exists, pull fresh status from Digio
  const docId = rows[0]?.digioDocId;
  let liveStatus: Awaited<ReturnType<typeof getESignStatus>> | null = null;
  if (docId) {
    try {
      liveStatus = await getESignStatus(docId);
    } catch {
      // Non-critical — return cached DB rows if Digio is unreachable
    }
  }

  return NextResponse.json({ esign: rows, liveStatus });
}

/**
 * POST /api/agreements/[id]/esign — upload agreement PDF to Digio and
 * create a multi-party Aadhaar eSign request.
 *
 * Allowed only when agreement.status === "E_SIGNING".
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreement = await prisma.agreement.findFirst({
    where: { id: params.id, userId: user.id },
    include: { eSignRequests: true },
  });
  if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (agreement.status !== "E_SIGNING") {
    return NextResponse.json(
      { error: "eSign can only be initiated when agreement is in E_SIGNING status." },
      { status: 409 },
    );
  }

  // Parse owner + tenant data for signer details
  let ownerData: { fullName?: string; email?: string; phone?: string } = {};
  let tenantData: { fullName?: string; email?: string; phone?: string } = {};
  try {
    if (agreement.ownerJson) ownerData = JSON.parse(agreement.ownerJson);
    if (agreement.tenantJson) tenantData = JSON.parse(agreement.tenantJson);
  } catch {
    return NextResponse.json({ error: "Agreement data incomplete." }, { status: 422 });
  }

  if (!ownerData.email || !tenantData.email) {
    return NextResponse.json(
      { error: "Owner and tenant emails are required to initiate eSign." },
      { status: 422 },
    );
  }

  // Generate or retrieve cached agreement PDF
  const pdfBase64 = await generateAgreementPdfCached(params.id);

  const signers = [
    {
      identifier: ownerData.email,
      name: ownerData.fullName ?? "Owner",
      reason: "Rental Agreement — Owner (First Party)",
    },
    {
      identifier: tenantData.email,
      name: tenantData.fullName ?? "Tenant",
      reason: "Rental Agreement — Tenant (Second Party)",
    },
  ];

  try {
    const digioResp = await initiateESign({
      fileName: `rental_agreement_${params.id}.pdf`,
      fileBase64: pdfBase64,
      signers,
      expireInDays: 7,
      referenceId: params.id,
    });

    // access_token is a document-level object returned when generate_access_token=true
    const accessTokenId = digioResp.access_token?.id ?? "";

    // Persist one row per signer
    const upserts = digioResp.signing_parties.map((sp, idx) => {
      const party = idx === 0 ? "OWNER" : "TENANT";
      return prisma.eSignRequest.upsert({
        where: { agreementId_party: { agreementId: params.id, party } },
        create: {
          agreementId: params.id,
          party,
          digioDocId: digioResp.id,
          accessToken: accessTokenId,
          signerEmail: sp.identifier,
          status: "INITIATED",
        },
        update: {
          digioDocId: digioResp.id,
          accessToken: accessTokenId,
          signerEmail: sp.identifier,
          status: "INITIATED",
          signedAt: null,
        },
      });
    });
    await prisma.$transaction(upserts);

    // Build per-signer gateway URLs for immediate redirect
    const signerLinks = digioResp.signing_parties.map((sp, idx) => ({
      party: idx === 0 ? "OWNER" : "TENANT",
      email: sp.identifier,
      gatewayUrl: digioGatewayUrl(digioResp.id, accessTokenId, sp.identifier),
    }));

    return NextResponse.json({ docId: digioResp.id, signerLinks });
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
