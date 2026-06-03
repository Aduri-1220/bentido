"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { UploadCloud, AlertTriangle, Lightbulb, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NavButtons } from "@/components/wizard/nav-buttons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { INDIAN_STATES, STAMP_DENOMINATIONS } from "@/lib/constants";
import {
  uploadFastTrackStep1Schema,
  type UploadFastTrackStep1Data,
} from "@/lib/schemas";
import { formatINR } from "@/lib/utils";

function Req({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}{" "}
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </>
  );
}

export function DraftStepForm({
  agreementId,
  existingFileName,
  draftStepComplete,
  uploadRequired,
  hasUploadedDraft,
  uploadFastTrackDefaults,
}: {
  agreementId: string;
  existingFileName: string | null;
  draftStepComplete: boolean;
  uploadRequired: boolean;
  hasUploadedDraft: boolean;
  uploadFastTrackDefaults?: Partial<UploadFastTrackStep1Data>;
}) {
  const router = useRouter();

  if (uploadRequired) {
    return (
      <UploadDraftCheckoutForm
        agreementId={agreementId}
        existingFileName={existingFileName}
        hasUploadedDraft={hasUploadedDraft}
        defaults={uploadFastTrackDefaults}
      />
    );
  }

  return (
    <OptionalDraftForm
      agreementId={agreementId}
      existingFileName={existingFileName}
      draftStepComplete={draftStepComplete}
      router={router}
    />
  );
}

function UploadDraftCheckoutForm({
  agreementId,
  existingFileName,
  hasUploadedDraft,
  defaults,
}: {
  agreementId: string;
  existingFileName: string | null;
  hasUploadedDraft: boolean;
  defaults?: Partial<UploadFastTrackStep1Data>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stampOptions = useMemo(
    () => [...new Set(STAMP_DENOMINATIONS)].sort((a, b) => a - b),
    [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<UploadFastTrackStep1Data>({
    resolver: zodResolver(uploadFastTrackStep1Schema),
    defaultValues: {
      city: "",
      state: "",
      propertyPincode: "",
      uploadOverridesRequested: false,
      securityDeposit: 0,
      stampValue: 100,
      rentExcludingMaintenance: "no",
      startDate: "",
      landlordFullName: "",
      landlordEmail: "",
      landlordPhone: "",
      landlordAge: undefined,
      landlordGender: "Male",
      landlordAadhaarLast4: "",
      landlordPincode: "",
      tenantFullName: "",
      tenantEmail: "",
      tenantPhone: "",
      tenantAge: undefined,
      tenantGender: "Male",
      tenantAadhaarLast4: "",
      tenantPincode: "",
      ...defaults,
    },
  });

  const stateVal = watch("state");
  const stampVal = watch("stampValue");
  const rentExc = watch("rentExcludingMaintenance");
  const landlordGenderVal = watch("landlordGender");
  const tenantGenderVal = watch("tenantGender");

  const draftHasUnsaved = isDirty || pickedFile != null;
  useUnsavedChangesWarning(draftHasUnsaved);

  async function onSubmit(values: UploadFastTrackStep1Data) {
    if (!pickedFile && !hasUploadedDraft && !existingFileName) {
      toast.error("Upload your PDF or DOCX to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("city", values.city);
      fd.append("state", values.state);
      fd.append("propertyPincode", values.propertyPincode);
      fd.append(
        "uploadOverridesRequested",
        values.uploadOverridesRequested ? "true" : "false",
      );
      fd.append("securityDeposit", String(values.securityDeposit));
      fd.append("stampValue", String(values.stampValue));
      fd.append("rentExcludingMaintenance", values.rentExcludingMaintenance);
      fd.append("startDate", values.startDate);
      fd.append("landlordFullName", values.landlordFullName);
      fd.append("landlordEmail", values.landlordEmail);
      fd.append("landlordPhone", values.landlordPhone);
      fd.append("landlordAge", String(values.landlordAge));
      fd.append("landlordGender", values.landlordGender);
      fd.append("landlordAadhaarLast4", values.landlordAadhaarLast4);
      fd.append("landlordPincode", values.landlordPincode);
      fd.append("tenantFullName", values.tenantFullName);
      fd.append("tenantEmail", values.tenantEmail);
      fd.append("tenantPhone", values.tenantPhone);
      fd.append("tenantAge", String(values.tenantAge));
      fd.append("tenantGender", values.tenantGender);
      fd.append("tenantAadhaarLast4", values.tenantAadhaarLast4);
      fd.append("tenantPincode", values.tenantPincode);
      if (pickedFile) fd.append("file", pickedFile);

      const res = await fetch(
        `/api/agreements/${agreementId}/upload-fast-track`,
        { method: "POST", body: fd },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Could not save");
        return;
      }
      toast.success("Saved. Continue to payment.");
      router.push(`/agreement/${agreementId}/addons`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const showSelected = pickedFile?.name ?? existingFileName ?? null;

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="space-y-6"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-slate-50/80 p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Get a valid rental agreement from your own document
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Upload the full document (not just the signature page) as a PDF or
              DOCX. Please make sure your file has final content before you
              upload.
            </p>

            <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden
              />
              <p>
                Use a digitally generated PDF or Word file when possible. Heavy
                scans can slow review.
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                setPickedFile(f ?? null);
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-5 w-full border-dashed sm:w-auto"
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload document
            </Button>

            {showSelected && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <FileText className="h-4 w-4 shrink-0 text-brand-700" />
                <span className="font-medium">{showSelected}</span>
                {pickedFile && (
                  <button
                    type="button"
                    className="ml-2 text-xs font-semibold text-brand-700 hover:underline"
                    onClick={() => {
                      setPickedFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Property & contract details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="city">
                  <Req>City of the property</Req>
                </Label>
                <Input
                  id="city"
                  placeholder="e.g. Hyderabad"
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-xs text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">
                  <Req>State</Req>
                </Label>
                <Select
                  value={stateVal || undefined}
                  onValueChange={(v) =>
                    setValue("state", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-xs text-destructive">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="propertyPincode">
                  <Req>Property PIN code</Req>
                </Label>
                <Input
                  id="propertyPincode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit"
                  {...register("propertyPincode")}
                />
                {errors.propertyPincode && (
                  <p className="text-xs text-destructive">
                    {errors.propertyPincode.message}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 sm:col-span-2">
                <Controller
                  name="uploadOverridesRequested"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="override-upload"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      className="mt-0.5"
                    />
                  )}
                />
                <div>
                  <Label
                    htmlFor="override-upload"
                    className="text-sm font-medium"
                  >
                    I want to override a few fields present in the uploaded
                    document
                  </Label>
                  <p className="mt-1 text-xs text-slate-500">
                    When checked, we&apos;ll treat these form values as the
                    source of truth alongside your PDF.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="securityDeposit">
                  <Req>Refundable deposit amount</Req>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ₹
                  </span>
                  <Input
                    id="securityDeposit"
                    type="number"
                    min={0}
                    step={1}
                    className="pl-8"
                    {...register("securityDeposit", { valueAsNumber: true })}
                  />
                </div>
                {errors.securityDeposit && (
                  <p className="text-xs text-destructive">
                    {errors.securityDeposit.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stampValue">
                  <Req>Select stamp paper amount</Req>
                </Label>
                <Select
                  value={String(stampVal)}
                  onValueChange={(v) =>
                    setValue("stampValue", Number(v), { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="stampValue">
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent>
                    {stampOptions.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {formatINR(d)} stamp
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stampValue && (
                  <p className="text-xs text-destructive">
                    {errors.stampValue.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Rent is excluding maintenance</Label>
                <RadioGroup
                  value={rentExc}
                  onValueChange={(v) =>
                    setValue("rentExcludingMaintenance", v as "yes" | "no", {
                      shouldValidate: true,
                    })
                  }
                  className="flex flex-wrap gap-4"
                >
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <RadioGroupItem value="yes" id="maint-yes" />
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <RadioGroupItem value="no" id="maint-no" />
                    No
                  </label>
                </RadioGroup>
                {errors.rentExcludingMaintenance && (
                  <p className="text-xs text-destructive">
                    {errors.rentExcludingMaintenance.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="startDate">
                  <Req>Agreement start date</Req>
                </Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-xs text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-1 text-base font-semibold text-slate-900">
              <Req>Landlord details</Req>
            </h3>
            <p className="text-xs text-slate-500">Landlord / licensor</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="landlordFullName">Name</Label>
                <Input
                  id="landlordFullName"
                  placeholder="Landlord name"
                  {...register("landlordFullName")}
                />
                {errors.landlordFullName && (
                  <p className="text-xs text-destructive">
                    {errors.landlordFullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlordEmail">Email</Label>
                <Input
                  id="landlordEmail"
                  type="email"
                  placeholder="Landlord email"
                  {...register("landlordEmail")}
                />
                {errors.landlordEmail && (
                  <p className="text-xs text-destructive">
                    {errors.landlordEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlordPhone">Phone</Label>
                <Input
                  id="landlordPhone"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  {...register("landlordPhone")}
                />
                {errors.landlordPhone && (
                  <p className="text-xs text-destructive">
                    {errors.landlordPhone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlordAge">Age</Label>
                <Input
                  id="landlordAge"
                  type="number"
                  min={18}
                  max={120}
                  placeholder="e.g. 42"
                  {...register("landlordAge")}
                />
                {errors.landlordAge && (
                  <p className="text-xs text-destructive">
                    {errors.landlordAge.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlordGender">Gender</Label>
                <Select
                  value={landlordGenderVal || undefined}
                  onValueChange={(v) =>
                    setValue("landlordGender", v as "Male" | "Female" | "Other", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="landlordGender">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.landlordGender && (
                  <p className="text-xs text-destructive">
                    {errors.landlordGender.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlordAadhaarLast4">
                  Aadhaar (last 4 digits)
                </Label>
                <Input
                  id="landlordAadhaarLast4"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="XXXX"
                  {...register("landlordAadhaarLast4")}
                />
                {errors.landlordAadhaarLast4 && (
                  <p className="text-xs text-destructive">
                    {errors.landlordAadhaarLast4.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlordPincode">PIN code</Label>
                <Input
                  id="landlordPincode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit"
                  {...register("landlordPincode")}
                />
                {errors.landlordPincode && (
                  <p className="text-xs text-destructive">
                    {errors.landlordPincode.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                toast.message(
                  "Additional landlords can be named in your uploaded agreement.",
                )
              }
            >
              Add more landlord
            </Button>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-1 text-base font-semibold text-slate-900">
              <Req>Tenant details</Req>
            </h3>
            <p className="text-xs text-slate-500">Tenant / licensee</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tenantFullName">Name</Label>
                <Input
                  id="tenantFullName"
                  placeholder="Tenant name"
                  {...register("tenantFullName")}
                />
                {errors.tenantFullName && (
                  <p className="text-xs text-destructive">
                    {errors.tenantFullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenantEmail">Email</Label>
                <Input
                  id="tenantEmail"
                  type="email"
                  placeholder="Tenant email"
                  {...register("tenantEmail")}
                />
                {errors.tenantEmail && (
                  <p className="text-xs text-destructive">
                    {errors.tenantEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenantPhone">Phone</Label>
                <Input
                  id="tenantPhone"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  {...register("tenantPhone")}
                />
                {errors.tenantPhone && (
                  <p className="text-xs text-destructive">
                    {errors.tenantPhone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenantAge">Age</Label>
                <Input
                  id="tenantAge"
                  type="number"
                  min={18}
                  max={120}
                  placeholder="e.g. 28"
                  {...register("tenantAge")}
                />
                {errors.tenantAge && (
                  <p className="text-xs text-destructive">
                    {errors.tenantAge.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenantGender">Gender</Label>
                <Select
                  value={tenantGenderVal || undefined}
                  onValueChange={(v) =>
                    setValue("tenantGender", v as "Male" | "Female" | "Other", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="tenantGender">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tenantGender && (
                  <p className="text-xs text-destructive">
                    {errors.tenantGender.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenantAadhaarLast4">
                  Aadhaar (last 4 digits)
                </Label>
                <Input
                  id="tenantAadhaarLast4"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="XXXX"
                  {...register("tenantAadhaarLast4")}
                />
                {errors.tenantAadhaarLast4 && (
                  <p className="text-xs text-destructive">
                    {errors.tenantAadhaarLast4.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenantPincode">PIN code</Label>
                <Input
                  id="tenantPincode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit"
                  {...register("tenantPincode")}
                />
                {errors.tenantPincode && (
                  <p className="text-xs text-destructive">
                    {errors.tenantPincode.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                toast.message(
                  "Additional tenants can be named in your uploaded agreement.",
                )
              }
            >
              Add more tenant
            </Button>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-sky-950">
          <div className="flex items-center gap-2 font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Tips
          </div>
          <p className="mt-3 leading-relaxed">
            To ensure faster processing, upload a digitally generated PDF or
            Word document. Scanned or picture-collated copies may delay review.
          </p>
        </aside>
      </div>

      <NavButtons
        backHref="/dashboard"
        submitLabel="Save and continue"
        submitting={submitting}
        unsavedChanges={draftHasUnsaved}
      />
    </form>
  );
}

function OptionalDraftForm({
  agreementId,
  existingFileName,
  draftStepComplete,
  router,
}: {
  agreementId: string;
  existingFileName: string | null;
  draftStepComplete: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [overrideIntent, setOverrideIntent] = useState(false);

  const optionalDraftDirty = pickedFile != null || overrideIntent;
  useUnsavedChangesWarning(optionalDraftDirty);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    try {
      if (pickedFile) {
        const fd = new FormData();
        fd.append("file", pickedFile);
        const res = await fetch(`/api/agreements/${agreementId}/draft`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(j.error ?? "Could not upload file");
          return;
        }
      } else if (!draftStepComplete) {
        const res = await fetch(`/api/agreements/${agreementId}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skip: true }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(j.error ?? "Could not continue");
          return;
        }
      }

      router.push(`/agreement/${agreementId}/property`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const showSelected = pickedFile?.name ?? existingFileName ?? null;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-slate-50/80 p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Get a valid rental agreement from your own document
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Upload the full document (not just the signature page) as a PDF or
              DOCX. We keep a copy with this agreement so you can download it
              later; you will still enter key details in the next steps so the
              summary and delivery pack stay accurate.
            </p>

            <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden
              />
              <p>
                Use a digitally generated PDF or Word file when possible. Heavy
                scans can be harder to read if we add automatic extraction
                later.
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                setPickedFile(f ?? null);
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-5 w-full border-dashed sm:w-auto"
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload document
            </Button>

            {showSelected && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <FileText className="h-4 w-4 shrink-0 text-brand-700" />
                <span className="font-medium">{showSelected}</span>
                {pickedFile && (
                  <button
                    type="button"
                    className="ml-2 text-xs font-semibold text-brand-700 hover:underline"
                    onClick={() => {
                      setPickedFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {(showSelected || draftStepComplete) && (
            <div className="flex items-start gap-3 rounded-lg border bg-white p-4">
              <Checkbox
                id="override"
                checked={overrideIntent}
                onCheckedChange={(v) => setOverrideIntent(v === true)}
              />
              <div>
                <Label htmlFor="override" className="text-sm font-medium">
                  I want to override some fields that appear in my uploaded
                  document
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                  The next steps are the source of truth for your WeBroker
                  draft; use this when your file is older or partially wrong.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-sky-950">
          <div className="flex items-center gap-2 font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Tips
          </div>
          <p className="mt-3 leading-relaxed">
            Uploading a prior draft is optional. If you skip, you can still
            build everything from scratch in the wizard.
          </p>
        </aside>
      </div>

      <NavButtons
        backHref="/dashboard"
        submitLabel="Save and continue"
        submitting={submitting}
        unsavedChanges={optionalDraftDirty}
      />
    </form>
  );
}
