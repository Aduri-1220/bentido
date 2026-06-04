import { redirect } from "next/navigation";
import {
  loadAgreement,
  firstIncompleteWizardStep,
  checkoutContactDisplayName,
  completedSteps,
} from "@/lib/agreement";
import { INDIAN_STATES, WIZARD_ENTRY_UPLOAD_DRAFT } from "@/lib/constants";
import { computeStampDuty } from "@/lib/stamp-duty";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { AddOnsClient } from "./addons-client";

export default async function AddonsPage({
  params,
}: {
  params: { id: string };
}) {
  const parsed = await loadAgreement(params.id);
  const nextStep = firstIncompleteWizardStep(parsed);
  if (nextStep) {
    redirect(`/agreement/${params.id}/${nextStep}`);
  }
  if (!parsed.property || !parsed.terms) {
    redirect(`/agreement/${params.id}/property`);
  }
  const stateInfo = INDIAN_STATES.find(
    (s) => s.value === parsed.property?.state,
  );
  const stamp = computeStampDuty({
    state: parsed.property?.state ?? "",
    durationMonths: parsed.terms?.durationMonths ?? 0,
    monthlyRent: parsed.terms?.monthlyRent ?? 0,
    securityDeposit: parsed.terms?.securityDeposit ?? 0,
  });

  const isUploadDraft =
    parsed.agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT;

  const client = (
    <AddOnsClient
      agreementId={params.id}
      defaultStampDuty={stamp.stampValue}
      stateLabel={stateInfo?.label ?? "your state"}
      tenantFullName={checkoutContactDisplayName(parsed)}
      city={parsed.property?.city ?? ""}
      currentStampValue={stamp.stampValue}
      stampFormula={stamp.formula}
      summaryBackHref={
        isUploadDraft
          ? `/agreement/${params.id}/draft`
          : `/agreement/${params.id}/preview`
      }
      pageSubtitle={
        isUploadDraft
          ? "Choose stamping, e-sign and delivery. Totals update as you go."
          : "Pick what you need. The order summary on the right updates live."
      }
      pageTitle={isUploadDraft ? "Payment summary" : "Add-ons & delivery"}
    />
  );

  if (isUploadDraft) {
    return (
      <WizardShell
        agreementId={params.id}
        wizardEntry={WIZARD_ENTRY_UPLOAD_DRAFT}
        currentStep="addons"
        completed={completedSteps(parsed)}
        hideShellHeader
        title=""
        description=""
      >
        {client}
      </WizardShell>
    );
  }

  return client;
}
