"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { ownerSchema, type OwnerData, normalizePanInput } from "@/lib/schemas";
import { INDIAN_STATES } from "@/lib/constants";

interface PartyFormProps {
  agreementId: string;
  kind: "owner";
  initial: OwnerData | null;
  nextStep: string;
  backStep: string;
}

export function PartyForm({
  agreementId,
  kind,
  initial,
  nextStep,
  backStep,
}: PartyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<OwnerData>({
    resolver: zodResolver(ownerSchema),
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
    },
  });

  useUnsavedChangesWarning(isDirty);

  async function onSubmit(data: OwnerData) {
    setSubmitting(true);
    const ok = await persistStep(agreementId, kind, data);
    setSubmitting(false);
    if (ok) {
      reset(data);
      toast.success("Owner details saved");
      router.push(`/agreement/${agreementId}/${nextStep}`);
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
          <Input
            id="fullName"
            placeholder="Full legal name"
            {...register("fullName")}
          />
        </Field>
        <Field label="Father's / Husband's name" htmlFor="fatherName">
          <Input
            id="fatherName"
            placeholder="As per Aadhaar"
            {...register("fatherName")}
          />
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
        <Field label="Occupation" htmlFor="occupation">
          <Input
            id="occupation"
            placeholder="e.g. Business / Salaried"
            {...register("occupation")}
          />
        </Field>
        <Field
          label="Aadhaar (last 4 digits)"
          htmlFor="aadhaarLast4"
          required
          error={errors.aadhaarLast4}
          hint="We never store your full Aadhaar number."
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
            placeholder="10-digit mobile"
            {...register("phone")}
          />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            {...register("email")}
          />
        </Field>
      </div>

      <Field
        label="Current address"
        htmlFor="addressLine1"
        required
        error={errors.addressLine1}
      >
        <Input
          id="addressLine1"
          placeholder="House / Flat, building, street"
          {...register("addressLine1")}
        />
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
                  {INDIAN_STATES.map((s) => (
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

      <NavButtons
        backHref={`/agreement/${agreementId}/${backStep}`}
        submitting={submitting}
        unsavedChanges={isDirty}
      />
    </form>
  );
}
