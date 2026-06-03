"use client";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn, formatDate, formatINR, numberToWords } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/constants";
import { getPropertyTypeCategory } from "@/lib/property-type-category";
import type {
  ClausesData,
  OwnerData,
  PropertyData,
  TenantData,
  TermsData,
  WitnessesData,
} from "@/lib/schemas";

interface DraftDocumentProps {
  agreementId: string;
  property: PropertyData | null;
  owner: OwnerData | null;
  tenant: TenantData | null;
  terms: TermsData | null;
  clauses: ClausesData | null;
  witnesses: WitnessesData | null;
  showEditPencils?: boolean;
}

export function DraftDocument({
  agreementId,
  property,
  owner,
  tenant,
  terms,
  clauses,
  witnesses,
  showEditPencils = true,
}: DraftDocumentProps) {
  const stateLabel =
    INDIAN_STATES.find((s) => s.value === property?.state)?.label ?? "____";

  const scheduleCategory =
    property?.type && property.type.trim() !== ""
      ? getPropertyTypeCategory(property.type.trim())
      : "unknown";
  const scheduleResidentialLike =
    scheduleCategory === "residential" || scheduleCategory === "unknown";
  const restroomsScheduleLabel =
    scheduleResidentialLike
      ? "Bathrooms"
      : scheduleCategory === "commercial"
        ? "Restrooms / WCs"
        : "Toilets / restrooms";
  const furnishingScheduleLabel =
    scheduleCategory === "commercial" ? "Fit-out / furnishing" : "Furnishing";
  const areaScheduleLabel =
    scheduleCategory === "warehouse" ||
    scheduleCategory === "land_building"
      ? "Built-up / demised area"
      : scheduleCategory === "commercial"
        ? "Built-up / carpet area"
        : "Carpet area";

  return (
    <article className="print-page mx-auto w-full max-w-[820px] rounded-2xl border bg-white p-8 font-serif text-slate-900 shadow-xl md:p-14">
      <h1 className="text-center text-2xl font-bold uppercase tracking-wider">
        Rental Agreement
      </h1>
      <p className="mt-2 text-center text-xs uppercase tracking-widest text-slate-500">
        (Leave & License — {terms?.durationMonths ?? "__"} months)
      </p>
      <div className="mx-auto mt-3 h-px w-24 bg-slate-300" />

      <DraftSection
        title="Preamble"
        editHref={`/agreement/${agreementId}/property`}
        showPencil={showEditPencils}
      >
        <p className="leading-relaxed">
          THIS RENTAL AGREEMENT is made and executed on{" "}
          <Strong>{formatDate(terms?.startDate)}</Strong> at{" "}
          <Strong>{property?.city || "____"}</Strong>, {stateLabel}, by and
          between the parties hereinafter mentioned.
        </p>
      </DraftSection>

      <DraftSection
        title="Parties"
        editHref={`/agreement/${agreementId}/owner`}
        showPencil={showEditPencils}
      >
        <p className="leading-relaxed">
          <Strong>1. Mr./Ms. {owner?.fullName || "________"}</Strong>
          {owner?.fatherName && <>, S/o / D/o {owner.fatherName}</>}, aged about{" "}
          <Strong>{owner?.age || "__"}</Strong> years,{" "}
          {owner?.gender && (
            <>
              gender <Strong>{owner.gender}</Strong>,{" "}
            </>
          )}
          {owner?.occupation && <>occupation {owner.occupation}, </>}
          {owner?.phone && <>phone {owner.phone}, </>}
          {owner?.email && <>email {owner.email}, </>}
          {owner?.pan && <>PAN {owner.pan}, </>}
          {owner?.aadhaarLast4 && <>Aadhaar ending {owner.aadhaarLast4}, </>}
          residing at{" "}
          <Strong>
            {[owner?.addressLine1, owner?.city, owner?.pincode]
              .filter(Boolean)
              .join(", ") || "____________"}
          </Strong>
          , (hereinafter referred to as the &ldquo;<Strong>LICENSOR</Strong>
          &rdquo;, which expression shall include their heirs, executors and
          assigns) of the <Strong>FIRST PART</Strong>.
        </p>
        <p className="mt-3 text-center font-semibold">AND</p>
        <p className="leading-relaxed">
          <span className="invisible">_</span>
          <Strong>
            <span className="inline-block">
              2. Mr./Ms. {tenant?.fullName || "________"}
            </span>
          </Strong>
          {tenant?.fatherName && <>, S/o / D/o {tenant.fatherName}</>}, aged
          about <Strong>{tenant?.age || "__"}</Strong> years,{" "}
          {tenant?.gender && (
            <>
              gender <Strong>{tenant.gender}</Strong>,{" "}
            </>
          )}
          {tenant?.occupation && (
            <>
              occupation {tenant.occupation}
              {tenant?.employer && <> with {tenant.employer}</>},{" "}
            </>
          )}
          {tenant?.phone && <>phone {tenant.phone}, </>}
          {tenant?.email && <>email {tenant.email}, </>}
          {tenant?.pan && <>PAN {tenant.pan}, </>}
          {tenant?.aadhaarLast4 && <>Aadhaar ending {tenant.aadhaarLast4}, </>}
          residing at{" "}
          <Strong>
            {[tenant?.addressLine1, tenant?.city, tenant?.pincode]
              .filter(Boolean)
              .join(", ") || "____________"}
          </Strong>
          , (hereinafter referred to as the &ldquo;<Strong>LICENSEE</Strong>
          &rdquo;, which expression shall include their heirs, executors and
          assigns) of the <Strong>SECOND PART</Strong>.
        </p>
      </DraftSection>

      <DraftSection
        title="Schedule of Property"
        editHref={`/agreement/${agreementId}/property`}
        showPencil={showEditPencils}
      >
        <p className="leading-relaxed">
          The Owner is the absolute and lawful owner of the following property
          (the &ldquo;<Strong>Property</Strong>&rdquo;):
        </p>
        <div className="mt-3 rounded-md border border-slate-300 p-4 text-sm leading-7">
          <div>
            <em>Type:</em> {property?.type || "____"}
            {scheduleResidentialLike ? (
              <>
                {" "}
                — <em>Bedrooms:</em> {property?.bhk || "____"}
              </>
            ) : null}{" "}
            — <em>{restroomsScheduleLabel}:</em>{" "}
            {property?.bathrooms != null ? property.bathrooms : "____"}{" "}
            — <em>{furnishingScheduleLabel}:</em>{" "}
            {property?.furnishing || "____"}
          </div>
          <div>
            <em>{areaScheduleLabel}:</em> {property?.carpetArea || "____"}{" "}
            sq. ft.
          </div>
          <div>
            <em>Address:</em>{" "}
            {[
              [
                property?.flatNumber,
                property?.floorNumber && `${property.floorNumber} Floor`,
              ]
                .filter(Boolean)
                .join(", "),
              property?.buildingName,
              property?.addressLine1,
              property?.addressLine2,
              property?.locality,
              property?.city,
              stateLabel,
              property?.pincode,
            ]
              .filter(Boolean)
              .join(", ") || "____________"}
          </div>
          {property?.amenities && property.amenities.length > 0 && (
            <div>
              <em>Amenities:</em> {property.amenities.join(", ")}
            </div>
          )}
          {property?.customAmenities &&
            property.customAmenities.length > 0 && (
              <div>
                <em>Additional amenities:</em>{" "}
                {property.customAmenities
                  .map((c) => `${c.item} (×${c.units})`)
                  .join(", ")}
              </div>
            )}
        </div>
      </DraftSection>

      <DraftSection
        title="Term, Rent & Deposit"
        editHref={`/agreement/${agreementId}/terms`}
        showPencil={showEditPencils}
      >
        <ol className="list-decimal space-y-2.5 pl-5 leading-relaxed">
          <li>
            The tenancy shall be for a period of{" "}
            <Strong>{terms?.durationMonths || "__"} months</Strong> commencing
            from <Strong>{formatDate(terms?.startDate)}</Strong>.
          </li>
          <li>
            The monthly rent shall be{" "}
            <Strong>
              {terms?.monthlyRent ? formatINR(terms.monthlyRent) : "₹______"}
            </Strong>
            {terms?.monthlyRent && <> ({numberToWords(terms.monthlyRent)})</>}{" "}
            payable on or before the{" "}
            <Strong>{terms?.rentDueDay || "__"}</Strong> day of every calendar
            month via <Strong>{terms?.paymentMode || "____"}</Strong>. Society
            maintenance is{" "}
            <Strong>
              {terms
                ? terms.maintenanceIncluded
                  ? "included"
                  : "excluded"
                : "____"}
            </Strong>{" "}
            in the rent.
          </li>
          <li>
            The Tenant shall pay a refundable security deposit of{" "}
            <Strong>
              {terms?.securityDeposit
                ? formatINR(terms.securityDeposit)
                : "₹______"}
            </Strong>{" "}
            on or before the date of execution of this agreement. The deposit
            shall be refunded by the Owner at the end of the tenancy, after
            deducting any lawful dues.
          </li>
          <li>
            The rent shall increase by{" "}
            <Strong>{terms?.incrementPercent || "__"}%</Strong> upon every
            renewal of this agreement.
          </li>
          <li>
            Both parties agree to a lock-in period of{" "}
            <Strong>{terms?.lockInMonths ?? "__"} months</Strong> during which
            neither party shall terminate this agreement.
          </li>
          <li>
            Either party may terminate this agreement by giving the other party
            not less than{" "}
            <Strong>{terms?.noticePeriodMonths ?? "__"} month(s)</Strong>{" "}
            written notice.
          </li>
        </ol>
      </DraftSection>

      {tenant?.familyMembers && tenant.familyMembers.length > 0 && (
        <DraftSection
          title="Occupants"
          editHref={`/agreement/${agreementId}/tenant`}
          showPencil={showEditPencils}
        >
          <p className="leading-relaxed">
            The Property shall be occupied by the Tenant along with the
            following family members:
          </p>
          <ul className="mt-2 list-disc pl-6">
            {tenant.familyMembers.map((m, i) => (
              <li key={i}>
                {m.name} ({m.relation}, {m.age} years)
              </li>
            ))}
          </ul>
        </DraftSection>
      )}

      <DraftSection
        title="Covenants & Conditions"
        editHref={`/agreement/${agreementId}/clauses`}
        showPencil={showEditPencils}
      >
        <ol className="list-decimal space-y-2.5 pl-5 leading-relaxed">
          {clauses?.clauses
            ?.filter((c) => c.enabled)
            .map((c) => (
              <li key={c.id}>
                <Strong>{c.label}:</Strong> {c.text}
              </li>
            ))}
        </ol>
      </DraftSection>

      <DraftSection
        title="Execution"
        editHref={`/agreement/${agreementId}/witnesses`}
        showPencil={showEditPencils}
      >
        <p className="leading-relaxed">
          IN WITNESS WHEREOF, the parties hereto have set their hands on the
          date first above written.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <SignatureBlock label="OWNER" name={owner?.fullName} />
          <SignatureBlock label="TENANT" name={tenant?.fullName} />
        </div>

        {witnesses?.witnesses && witnesses.witnesses.length > 0 && (
          <>
            <div className="mt-10 font-semibold">Witnesses:</div>
            <div className="mt-3 grid gap-6 md:grid-cols-2">
              {witnesses.witnesses.map((w, i) => (
                <SignatureBlock
                  key={i}
                  label={`Witness ${i + 1}`}
                  name={w.fullName}
                  hint={w.address}
                />
              ))}
            </div>
          </>
        )}
      </DraftSection>

      {property?.furnitureSchedule && property.furnitureSchedule.length > 0 && (
        <DraftSection
          title="Schedule I — Furniture & Appliances"
          editHref={`/agreement/${agreementId}/property`}
          showPencil={showEditPencils}
        >
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-2 pr-3 font-semibold">Sr No.</th>
                <th className="py-2 pr-3 font-semibold">Item</th>
                <th className="py-2 pr-3 font-semibold">Units</th>
              </tr>
            </thead>
            <tbody>
              {property.furnitureSchedule.map((row, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-2 pr-3">{i + 1}</td>
                  <td className="py-2 pr-3">{row.item}</td>
                  <td className="py-2 pr-3">{row.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DraftSection>
      )}
    </article>
  );
}

function DraftSection({
  title,
  children,
  editHref,
  showPencil,
}: {
  title: string;
  children: React.ReactNode;
  editHref?: string;
  showPencil?: boolean;
}) {
  return (
    <section className="group relative mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-900">
          {title}
        </h2>
        {editHref && showPencil && (
          <Link
            href={editHref}
            className={cn(
              "no-print inline-flex items-center gap-1 rounded-md border border-dashed border-transparent px-2 py-1 text-xs font-medium text-brand-700 opacity-0 transition-all hover:border-brand-300 hover:bg-brand-50 group-hover:opacity-100",
            )}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
        )}
      </div>
      <div className="mt-2 text-[15px]">{children}</div>
    </section>
  );
}

function SignatureBlock({
  label,
  name,
  hint,
}: {
  label: string;
  name?: string | null;
  hint?: string;
}) {
  return (
    <div>
      <div className="h-12 border-b-2 border-slate-300" />
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="font-semibold">{name || "________________"}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-slate-900">{children}</span>;
}
