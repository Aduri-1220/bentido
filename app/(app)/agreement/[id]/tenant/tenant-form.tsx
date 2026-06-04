"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/wizard/field";
import { NavButtons } from "@/components/wizard/nav-buttons";
import { persistStep } from "@/components/wizard/persist";
import { tenantSchema, type TenantData, normalizePanInput } from "@/lib/schemas";
import { LAUNCH_STATES } from "@/lib/constants";

export function TenantForm({
  agreementId,
  initial,
}: {
  agreementId: string;
  initial: TenantData | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<TenantData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initial ?? {
      fullName: "",
      fatherName: "",
      age: undefined,
      gender: "Male",
      occupation: "",
      aadhaarLast4: "",
      pan: "",
      phone: "",
      email: "",
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
      employer: "",
      familyMembers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "familyMembers",
  });

  useUnsavedChangesWarning(isDirty);

  async function onSubmit(data: TenantData) {
    setSubmitting(true);
    const ok = await persistStep(agreementId, "tenant", data);
    setSubmitting(false);
    if (ok) {
      reset(data);
      toast.success("Tenant details saved");
      router.push(`/agreement/${agreementId}/terms`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={errors.fullName}
        >
          <Input id="fullName" {...register("fullName")} />
        </Field>
        <Field label="Father's / Husband's name" htmlFor="fatherName">
          <Input id="fatherName" {...register("fatherName")} />
        </Field>
        <Field label="Age" htmlFor="age" required error={errors.age}>
          <Input
            id="age"
            type="number"
            min={18}
            max={120}
            placeholder="e.g. 42"
            {...register("age")}
          />
        </Field>
        <Field label="Gender" htmlFor="gender" required error={errors.gender}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label="Occupation"
          htmlFor="occupation"
          error={errors.occupation}
        >
          <Input
            id="occupation"
            placeholder="e.g. Software Engineer"
            {...register("occupation")}
          />
        </Field>
        <Field label="Employer / Company" htmlFor="employer">
          <Input
            id="employer"
            placeholder="Optional"
            {...register("employer")}
          />
        </Field>
        <Field
          label="Aadhaar (last 4 digits)"
          htmlFor="aadhaarLast4"
          required
          error={errors.aadhaarLast4}
        >
          <Input
            id="aadhaarLast4"
            inputMode="numeric"
            maxLength={4}
            placeholder="XXXX"
            {...register("aadhaarLast4")}
          />
        </Field>
        <Field
          label="PAN"
          htmlFor="pan"
          error={errors.pan}
          hint="Optional. 10 characters: five letters, four digits, one letter (stored in capitals)."
        >
          <Input
            id="pan"
            type="text"
            inputMode="text"
            placeholder="Your PAN, if applicable"
            maxLength={10}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            {...register("pan", { setValueAs: normalizePanInput })}
          />
        </Field>
        <Field label="Phone" htmlFor="phone" required error={errors.phone}>
          <Input
            id="phone"
            inputMode="numeric"
            maxLength={10}
            {...register("phone")}
          />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
      </div>

      <Field
        label="Current / permanent address"
        htmlFor="addressLine1"
        required
        error={errors.addressLine1}
      >
        <Input id="addressLine1" {...register("addressLine1")} />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="City" htmlFor="city" required error={errors.city}>
          <Input id="city" {...register("city")} />
        </Field>
        <Field label="State" htmlFor="state" required error={errors.state}>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {LAUNCH_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="PIN" htmlFor="pincode" required error={errors.pincode}>
          <Input id="pincode" maxLength={6} {...register("pincode")} />
        </Field>
      </div>

      <div className="rounded-xl border bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              Family members occupying the property
            </h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              // Start with a blank age input; schema preprocess turns "" into a
              // proper validation error rather than coercing to 0.
              append({
                name: "",
                relation: "",
                age: undefined as unknown as number,
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add member
          </Button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Optional — listed in the agreement&rsquo;s occupants clause.
        </p>

        {fields.length > 0 && (
          <div className="mt-4 space-y-3">
            {fields.map((f, i) => (
              <div
                key={f.id}
                className="grid items-end gap-3 rounded-lg border bg-white p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
              >
                <Field
                  label="Name"
                  htmlFor={`familyMembers.${i}.name`}
                  required
                  error={errors.familyMembers?.[i]?.name}
                >
                  <Input
                    id={`familyMembers.${i}.name`}
                    {...register(`familyMembers.${i}.name` as const)}
                  />
                </Field>
                <Field
                  label="Relation"
                  htmlFor={`familyMembers.${i}.relation`}
                  required
                  error={errors.familyMembers?.[i]?.relation}
                >
                  <Input
                    id={`familyMembers.${i}.relation`}
                    placeholder="e.g. Spouse"
                    {...register(`familyMembers.${i}.relation` as const)}
                  />
                </Field>
                <Field
                  label="Age"
                  htmlFor={`familyMembers.${i}.age`}
                  required
                  error={errors.familyMembers?.[i]?.age}
                >
                  <Input
                    id={`familyMembers.${i}.age`}
                    type="number"
                    min={0}
                    max={120}
                    placeholder="e.g. 8"
                    {...register(`familyMembers.${i}.age` as const)}
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label="Remove member"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavButtons
        backHref={`/agreement/${agreementId}/owner`}
        submitting={submitting}
        unsavedChanges={isDirty}
      />
    </form>
  );
}
