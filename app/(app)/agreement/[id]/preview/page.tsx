import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { loadAgreement, firstIncompleteWizardStep } from "@/lib/agreement";
import { DraftDocument } from "@/components/agreement/draft-document";
import { CounterpartyInviteCard } from "@/components/agreement/counterparty-invite-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WIZARD_ENTRY_UPLOAD_DRAFT } from "@/lib/constants";
import { isCounterpartySelfApproveAllowed } from "@/lib/payment-config";

export default async function PreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const parsed = await loadAgreement(params.id);
  const nextStep = firstIncompleteWizardStep(parsed);
  if (nextStep) {
    redirect(`/agreement/${params.id}/${nextStep}`);
  }

  const data = {
    property: parsed.property,
    owner: parsed.owner,
    tenant: parsed.tenant,
    terms: parsed.terms,
    clauses: parsed.clauses,
    witnesses: parsed.witnesses,
  };

  const isUploadDraftFlow =
    parsed.agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT;
  const previewBackHref = isUploadDraftFlow
    ? `/agreement/${params.id}/addons`
    : `/agreement/${params.id}/witnesses`;
  const continueLabel = isUploadDraftFlow
    ? "Continue to payment summary"
    : "Continue to add-ons";

  return (
    <div className="container py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={previewBackHref}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {isUploadDraftFlow ? "Back to payment summary" : "Back to wizard"}
            </Link>
            <Badge variant="brand">
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Review your agreement draft
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Hover over any section to edit it. Looks good? Continue to add-ons,
            delivery and payment.
          </p>
        </div>

        <Button asChild variant="brand" size="lg">
          <Link href={`/agreement/${params.id}/addons`}>
            {continueLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="no-print mb-6 grid gap-3 rounded-xl border bg-amber-50/60 p-4 text-sm text-amber-900 md:grid-cols-[auto_1fr]">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <Strong>This is a draft for your review.</Strong> Nothing has been
          stamped or signed yet. Stamp paper, e-sign and delivery happen after
          payment on the next steps.
        </div>
      </div>

      {parsed.agreement.sourceDraftR2Key ? (
        <div className="no-print mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-medium text-slate-900">
            Attached prior draft:{" "}
          </span>
          <Link
            href={`/api/agreements/${params.id}/source-draft`}
            className="font-semibold text-brand-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {parsed.agreement.sourceDraftOriginalName ?? "Download file"}
          </Link>
          <span className="block mt-1 text-xs text-slate-500">
            This is your uploaded file. The printable document below is built
            from the wizard fields.
          </span>
        </div>
      ) : null}

      <div className="mb-6">
        <CounterpartyInviteCard
          agreementId={params.id}
          status={
            (parsed.agreement.counterpartyApprovalStatus as
              | "PENDING"
              | "APPROVED"
              | "CHANGES_REQUESTED"
              | null) ?? "NONE"
          }
          tenantEmail={parsed.tenant?.email ?? null}
          inviteSentAt={
            parsed.agreement.counterpartyInviteSentAt?.toISOString() ?? null
          }
          changesComment={parsed.agreement.counterpartyChangesComment ?? null}
          selfApproveAllowed={isCounterpartySelfApproveAllowed()}
        />
      </div>

      <DraftDocument agreementId={params.id} {...data} />

      <div className="no-print mt-8 flex flex-wrap items-center justify-center gap-3 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Looks good? Lock it in with stamping, e-sign and delivery.
        </div>
        <Button asChild variant="brand" size="lg">
          <Link href={`/agreement/${params.id}/addons`}>
            {continueLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}
