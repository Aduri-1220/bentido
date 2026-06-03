import { redirect } from "next/navigation";
import Link from "next/link";
import { loadAgreement } from "@/lib/agreement";
import { prisma } from "@/lib/db";
import { ESignClient } from "./esign-client";

export default async function ESignPage({
  params,
}: {
  params: { id: string };
}) {
  const parsed = await loadAgreement(params.id);
  const { agreement, owner, tenant } = parsed;

  if (agreement.status !== "E_SIGNING") {
    redirect(`/agreement/${agreement.id}`);
  }

  const eSignRows = await prisma.eSignRequest.findMany({
    where: { agreementId: agreement.id },
    select: {
      party: true,
      status: true,
      signerEmail: true,
      accessToken: true,
      digioDocId: true,
      signedAt: true,
    },
  });

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <Link
          href={`/agreement/${agreement.id}`}
          className="text-sm text-slate-500 hover:text-brand-700"
        >
          ← Back to agreement
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Aadhaar eSign
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          All parties must sign the agreement using their Aadhaar-linked mobile
          OTP. Each signer will receive a link via email.
        </p>
      </div>

      <ESignClient
        agreementId={agreement.id}
        owner={{ name: owner?.fullName ?? "", email: owner?.email ?? "" }}
        tenant={{ name: tenant?.fullName ?? "", email: tenant?.email ?? "" }}
        existingRows={eSignRows}
      />
    </div>
  );
}
