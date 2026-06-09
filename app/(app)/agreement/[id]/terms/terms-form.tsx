"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IndianRupee, CalendarDays, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/wizard/field";
import { NavButtons } from "@/components/wizard/nav-buttons";
import { persistStep } from "@/components/wizard/persist";
import { termsSchema, type TermsData } from "@/lib/schemas";
import { formatINR, numberToWords } from "@/lib/utils";

const PAYMENT_MODES = ["Bank transfer (NEFT/IMPS)", "UPI", "Cheque", "Cash"];

export function TermsForm({
  agreementId,
  initial,
}: {
  agreementId: string;
  initial: TermsData | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<TermsData>({
    resolver: zodResolver(termsSchema),
    defaultValues: initial ?? {
      monthlyRent: 0,
      maintenanceIncluded: true,
      securityDeposit: 0,
      durationMonths: 11,
      lockInMonths: 6,
      noticePeriodMonths: 1,
      startDate: "",
      incrementPercent: 5,
      rentDueDay: 5,
      paymentMode: PAYMENT_MODES[0],
      acknowledgesNoRegistration: false,
    },
  });

  useUnsavedChangesWarning(isDirty);

  const rent = Number(watch("monthlyRent") || 0);
  const deposit = Number(watch("securityDeposit") || 0);
  const maintenanceIncluded = !!watch("maintenanceIncluded");
  const durationMonths = Number(watch("durationMonths") || 0);
  const requiresRegistrationAck = durationMonths > 11;

  async function onSubmit(data: TermsData) {
    setSubmitting(true);
    const ok = await persistStep(agreementId, "terms", data);
    setSubmitting(false);
    if (ok) {
      reset(data);
      toast.success("Terms saved");
      router.push(`/agreement/${agreementId}/clauses`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Monthly rent (₹)"
          htmlFor="monthlyRent"
          required
          error={errors.monthlyRent}
          hint={
            rent > 0 ? `${formatINR(rent)} — ${numberToWords(rent)}` : undefined
          }
        >
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="monthlyRent"
              type="number"
              className="pl-9"
              placeholder="e.g. 25000"
              {...register("monthlyRent")}
            />
          </div>
        </Field>
        <Field
          label="Security deposit (₹)"
          htmlFor="securityDeposit"
          required
          error={errors.securityDeposit}
          hint={
            deposit > 0
              ? `${formatINR(deposit)} — refundable at end of tenancy`
              : "Usually 1–3 months of rent."
          }
        >
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="securityDeposit"
              type="number"
              className="pl-9"
              placeholder="e.g. 75000"
              {...register("securityDeposit")}
            />
          </div>
        </Field>

        <Field
          label="Lease duration (months)"
          htmlFor="durationMonths"
          required
          error={errors.durationMonths}
          hint="11 months is most common (avoids mandatory registration)."
        >
          <Input
            id="durationMonths"
            type="number"
            min={1}
            max={120}
            {...register("durationMonths")}
          />
        </Field>
        {requiresRegistrationAck ? (
          <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">
                  Leases of 12 months or more are not registered at the SRO.
                </p>
                <p className="mt-1 text-amber-900/90">
                  bentido will stamp the agreement under the applicable State
                  Stamp Act and have all parties sign it with Aadhaar eSign. We
                  do not register the agreement at the Sub-Registrar Office. The
                  agreement remains valid and binding between parties and is
                  admissible for collateral purposes in court. If you need
                  registration for full enforcement, you can pursue it
                  separately at your local SRO.
                </p>
                <label className="mt-3 flex items-start gap-2 text-amber-900">
                  <input
                    type="checkbox"
                    {...register("acknowledgesNoRegistration")}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                  />
                  <span className="text-sm">
                    I understand this agreement will not be registered at the
                    Sub-Registrar Office.
                  </span>
                </label>
                {errors.acknowledgesNoRegistration ? (
                  <p className="mt-1 text-xs text-red-700">
                    {errors.acknowledgesNoRegistration.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        <Field
          label="Lock-in period (months)"
          htmlFor="lockInMonths"
          required
          error={errors.lockInMonths}
          hint="Neither party can terminate during lock-in."
        >
          <Input
            id="lockInMonths"
            type="number"
            min={0}
            max={120}
            {...register("lockInMonths")}
          />
        </Field>

        <Field
          label="Notice period (months)"
          htmlFor="noticePeriodMonths"
          required
          error={errors.noticePeriodMonths}
          hint="Either party must give this much written notice to vacate."
        >
          <Input
            id="noticePeriodMonths"
            type="number"
            min={1}
            max={12}
            {...register("noticePeriodMonths")}
          />
        </Field>

        <Field
          label="Tenancy start date"
          htmlFor="startDate"
          required
          error={errors.startDate}
        >
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="startDate"
              type="date"
              className="pl-9"
              {...register("startDate")}
            />
          </div>
        </Field>
        <Field
          label="Annual rent increment (%)"
          htmlFor="incrementPercent"
          required
          error={errors.incrementPercent}
          hint="Typically 5–10%."
        >
          <Input
            id="incrementPercent"
            type="number"
            step="0.5"
            min={0}
            max={100}
            {...register("incrementPercent")}
          />
        </Field>

        <Field
          label="Rent due on day of month"
          htmlFor="rentDueDay"
          required
          error={errors.rentDueDay}
        >
          <Input
            id="rentDueDay"
            type="number"
            min={1}
            max={31}
            {...register("rentDueDay")}
          />
        </Field>
        <Field
          label="Payment mode"
          htmlFor="paymentMode"
          required
          error={errors.paymentMode}
        >
          <Controller
            name="paymentMode"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="paymentMode">
                  <SelectValue placeholder="Payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border bg-slate-50 p-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Society maintenance is{" "}
            {maintenanceIncluded ? "included" : "excluded"} in the rent
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Toggle off if the Tenant pays society maintenance separately on top
            of the rent.
          </p>
        </div>
        <Controller
          name="maintenanceIncluded"
          control={control}
          render={({ field }) => (
            <Switch
              checked={!!field.value}
              onCheckedChange={field.onChange}
              aria-label="Maintenance included in rent"
            />
          )}
        />
      </div>

      <NavButtons
        backHref={`/agreement/${agreementId}/tenant`}
        submitting={submitting}
        unsavedChanges={isDirty}
      />
    </form>
  );
}
