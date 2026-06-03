import { redirect } from "next/navigation";
import {
  loadAgreement,
  completedSteps,
  uploadFastTrackFormDefaults,
} from "@/lib/agreement";
import {
  WIZARD_ENTRY_FULL_DETAILS,
  WIZARD_ENTRY_UPLOAD_DRAFT,
} from "@/lib/constants";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { DraftStepForm } from "./draft-step-form";

export default async function DraftStepPage({
  params,
}: {
  params: { id: string };
}) {
  const parsed = await loadAgreement(params.id);
  if (parsed.agreement.wizardEntry === WIZARD_ENTRY_FULL_DETAILS) {
    redirect(`/agreement/${params.id}/property`);
  }

  const uploadRequired =
    parsed.agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT;
  const hasUploadedDraft = !!parsed.agreement.sourceDraftR2Key;

  return (
    <WizardShell
      agreementId={params.id}
      wizardEntry={parsed.agreement.wizardEntry}
      currentStep="draft"
      completed={completedSteps(parsed)}
      title="Upload & contact"
      description={
        uploadRequired
          ? "Attach your PDF or DOCX and tell us whether you are the tenant or owner. Next you will review stamping, e-sign and delivery."
          : "Attach a previous rental agreement if you have one—PDF or DOCX, up to 5 MB—or skip and build everything from scratch in the following steps."
      }
    >
      <DraftStepForm
        agreementId={params.id}
        existingFileName={parsed.agreement.sourceDraftOriginalName}
        draftStepComplete={completedSteps(parsed).draft}
        uploadRequired={uploadRequired}
        hasUploadedDraft={hasUploadedDraft}
        uploadFastTrackDefaults={uploadFastTrackFormDefaults(parsed)}
      />
    </WizardShell>
  );
}
