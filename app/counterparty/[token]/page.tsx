import { notFound } from "next/navigation";
import { hashInviteToken } from "@/lib/counterparty-invite";
import { prisma } from "@/lib/db";
import { parseAgreementJsonFields } from "@/lib/agreement";
import { DraftDocument } from "@/components/agreement/draft-document";
import { CounterpartyActions } from "./counterparty-actions";

export const dynamic = "force-dynamic";

/**
 * Public, token-gated review page for the counterparty (tenant when owner
 * initiates). No login. Token is matched by its SHA-256 hash; on expiry or
 * after a final response the page is dead and the counterparty must ask
 * the owner for a fresh invite.
 */
export default async function CounterpartyReviewPage({
  params,
}: {
  params: { token: string };
}) {
  const tokenHash = hashInviteToken(params.token);
  const agreement = await prisma.agreement.findUnique({
    where: { counterpartyInviteTokenHash: tokenHash },
    select: {
      id: true,
      counterpartyApprovalStatus: true,
      counterpartyInviteExpiresAt: true,
      counterpartyChangesComment: true,
      counterpartyRespondedAt: true,
      propertyJson: true,
      ownerJson: true,
      tenantJson: true,
      termsJson: true,
      clausesJson: true,
      witnessesJson: true,
      user: { select: { name: true } },
    },
  });
  if (!agreement) notFound();

  const expired =
    !agreement.counterpartyInviteExpiresAt ||
    agreement.counterpartyInviteExpiresAt < new Date();

  const parsed = parseAgreementJsonFields(agreement);
  const status = agreement.counterpartyApprovalStatus ?? "PENDING";
  const ownerName = agreement.user.name ?? "the landlord";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Review your rental agreement
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {ownerName} has shared this draft with you. Read it through, then
          approve it or request changes.
        </p>
      </header>

      <StatusBanner
        status={status}
        expired={expired}
        changesComment={agreement.counterpartyChangesComment}
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <DraftDocument
          agreementId={agreement.id}
          property={parsed.property}
          owner={parsed.owner}
          tenant={parsed.tenant}
          terms={parsed.terms}
          clauses={parsed.clauses}
          witnesses={parsed.witnesses}
          showEditPencils={false}
        />
      </section>

      {status === "PENDING" && !expired ? (
        <div className="mt-6">
          <CounterpartyActions token={params.token} />
        </div>
      ) : null}
    </main>
  );
}

function StatusBanner({
  status,
  expired,
  changesComment,
}: {
  status: string;
  expired: boolean;
  changesComment: string | null;
}) {
  if (expired && status === "PENDING") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        This review link has expired. Please ask the landlord to send a fresh
        invite.
      </div>
    );
  }
  if (status === "APPROVED") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        You've approved this agreement. The landlord will proceed to payment
        and you'll receive the Aadhaar e-sign link once it's ready.
      </div>
    );
  }
  if (status === "CHANGES_REQUESTED") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
        <div className="font-medium text-slate-900">
          You requested changes — waiting on the landlord to revise.
        </div>
        {changesComment ? (
          <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-slate-700">
            {changesComment}
          </blockquote>
        ) : null}
      </div>
    );
  }
  return null;
}
