import { notFound } from "next/navigation";
import type { Agreement } from "@prisma/client";
import { prisma } from "./db";
import { requireUser } from "./session";
import {
  type PropertyData,
  type OwnerData,
  type TenantData,
  type TermsData,
  type ClausesData,
  type WitnessesData,
  type UploadFastTrackStep1Data,
} from "./schemas";
import {
  visibleWizardStepsForEntry,
  WIZARD_ENTRY_UPLOAD_DRAFT,
} from "./constants";

export interface ParsedAgreement {
  agreement: Agreement;
  property: PropertyData | null;
  owner: OwnerData | null;
  tenant: TenantData | null;
  terms: TermsData | null;
  clauses: ClausesData | null;
  witnesses: WitnessesData | null;
}

export async function loadAgreement(id: string): Promise<ParsedAgreement> {
  const user = await requireUser();
  const agreement = await prisma.agreement.findFirst({
    where: { id, userId: user.id },
  });
  if (!agreement) notFound();
  return {
    agreement,
    property: parseSafe<PropertyData>(agreement.propertyJson),
    owner: parseSafe<OwnerData>(agreement.ownerJson),
    tenant: parseSafe<TenantData>(agreement.tenantJson),
    terms: parseSafe<TermsData>(agreement.termsJson),
    clauses: parseSafe<ClausesData>(agreement.clausesJson),
    witnesses: parseSafe<WitnessesData>(agreement.witnessesJson),
  };
}

export function checkoutContactDisplayName(p: ParsedAgreement): string {
  return p.tenant?.fullName ?? "";
}

/** Upload-draft flow: file saved + checkout payload seeded (terms/property/parties). */
export function uploadDraftCheckoutReady(p: ParsedAgreement): boolean {
  return (
    p.agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT &&
    !!p.agreement.sourceDraftR2Key &&
    !!p.terms
  );
}

export function completedSteps(p: ParsedAgreement): Record<string, boolean> {
  const uploadDraft = p.agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT;
  const draftDone = uploadDraft
    ? !!(p.agreement.sourceDraftR2Key && p.terms)
    : !!p.agreement.sourceDraftR2Key ||
      p.agreement.sourceDraftSkipped === true ||
      !!p.property;
  return {
    draft: draftDone,
    property: !!p.property,
    owner: !!p.owner,
    tenant: !!p.tenant,
    terms: !!p.terms,
    clauses: !!p.clauses,
    witnesses: !!p.witnesses,
  };
}

/** First wizard step slug that is not yet complete, or `null` if the wizard is done. */
export function firstIncompleteWizardStep(p: ParsedAgreement): string | null {
  if (p.agreement.wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT) {
    if (!p.agreement.sourceDraftR2Key) return "draft";
    if (!p.terms) return "draft";
    return null;
  }
  const done = completedSteps(p);
  const steps = visibleWizardStepsForEntry(p.agreement.wizardEntry);
  for (const { id } of steps) {
    if (!done[id]) return id;
  }
  return null;
}

/** Pre-fill the upload checkout form when revisiting step 1 after saving once. */
export function uploadFastTrackFormDefaults(
  p: ParsedAgreement,
): Partial<UploadFastTrackStep1Data> | undefined {
  if (
    p.agreement.wizardEntry !== WIZARD_ENTRY_UPLOAD_DRAFT ||
    !p.terms ||
    !p.property ||
    !p.owner ||
    !p.tenant
  ) {
    return undefined;
  }
  return {
    city: p.property.city,
    state: p.property.state,
    uploadOverridesRequested: p.terms.uploadOverridesRequested ?? false,
    securityDeposit: p.terms.securityDeposit,
    stampValue: p.agreement.stampValue ?? 100,
    rentExcludingMaintenance: p.terms.maintenanceIncluded ? "no" : "yes",
    startDate: p.terms.startDate,
    landlordFullName: p.owner.fullName,
    landlordEmail: p.owner.email,
    landlordPhone: p.owner.phone,
    tenantFullName: p.tenant.fullName,
    tenantEmail: p.tenant.email,
    tenantPhone: p.tenant.phone,
  };
}

function parseSafe<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** Parse wizard JSON blobs without requiring the current user (e.g. admin views). */
export function parseAgreementJsonFields(agreement: {
  propertyJson: string | null;
  ownerJson: string | null;
  tenantJson: string | null;
  termsJson: string | null;
  clausesJson: string | null;
  witnessesJson: string | null;
}): Omit<ParsedAgreement, "agreement"> {
  return {
    property: parseSafe<PropertyData>(agreement.propertyJson),
    owner: parseSafe<OwnerData>(agreement.ownerJson),
    tenant: parseSafe<TenantData>(agreement.tenantJson),
    terms: parseSafe<TermsData>(agreement.termsJson),
    clauses: parseSafe<ClausesData>(agreement.clausesJson),
    witnesses: parseSafe<WitnessesData>(agreement.witnessesJson),
  };
}
