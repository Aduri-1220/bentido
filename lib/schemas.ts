import { z } from "zod";
import { INDIAN_STATES, STAMP_DENOMINATIONS } from "./constants";

const requiredString = (msg: string) => z.string().min(1, msg);

/** HTML number inputs often yield "" or NaN; treat as missing instead of coercing to 0. */
function emptyNumberToUndefined(val: unknown): unknown {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number" && Number.isNaN(val)) return undefined;
  const n = typeof val === "string" ? Number(val.trim()) : val;
  if (typeof n === "number" && Number.isNaN(n)) return undefined;
  return n;
}

/** Canonical PAN string for inputs + validation: NFKC, strip spaces/dashes, A–Z0–9 only. Length is enforced by the schema so over-long input surfaces as an error rather than being silently truncated. */
export function normalizePanInput(raw: unknown): string {
  if (raw == null || raw === "") return "";
  try {
    return String(raw)
      .normalize("NFKC")
      .replace(/[\s-]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  } catch {
    return String(raw)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }
}

export const propertySchema = z.object({
  type: requiredString("Property type is required"),
  bhk: requiredString("BHK configuration is required"),
  bathrooms: z.coerce
    .number()
    .int()
    .min(1, "At least 1 bathroom")
    .max(20, "Too many bathrooms"),
  furnishing: requiredString("Furnishing status is required"),
  flatNumber: z.string().optional().default(""),
  floorNumber: z.string().optional().default(""),
  buildingName: z.string().optional().default(""),
  addressLine1: requiredString("Address is required"),
  addressLine2: z.string().optional().default(""),
  locality: requiredString("Locality is required"),
  city: requiredString("City is required"),
  state: requiredString("State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  carpetArea: z.coerce.number().min(1, "Area is required").max(100000),
  amenities: z.array(z.string()).default([]),
  furnitureSchedule: z
    .array(
      z.object({
        item: requiredString("Item required"),
        units: z.coerce.number().int().min(1, "Units"),
      }),
    )
    .default([]),
});
export type PropertyData = z.infer<typeof propertySchema>;

const partySchema = z.object({
  fullName: requiredString("Full name is required"),
  fatherName: z.string().optional().default(""),
  age: z.preprocess(
    emptyNumberToUndefined,
    z
      .number({
        required_error: "Age is required",
        invalid_type_error: "Age is required",
      })
      .int()
      .min(18, "Must be at least 18")
      .max(120),
  ),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
  occupation: z.string().optional().default(""),
  aadhaarLast4: z.string().regex(/^\d{4}$/, "Last 4 digits of Aadhaar"),
  pan: z.preprocess(
    normalizePanInput,
    z.union([
      z.literal(""),
      z
        .string()
        .length(10, "PAN must be exactly 10 characters")
        .regex(
          /^[A-Z]{5}[0-9]{4}[A-Z]$/,
          "Invalid PAN: use 5 letters, then 4 digits, then 1 letter",
        ),
    ]),
  ),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone"),
  email: z.string().email("Enter a valid email"),
  addressLine1: requiredString("Address is required"),
  city: requiredString("City is required"),
  state: requiredString("State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit PIN"),
});

export const ownerSchema = partySchema;
export type OwnerData = z.infer<typeof ownerSchema>;

export const tenantSchema = partySchema.extend({
  employer: z.string().optional().default(""),
  familyMembers: z
    .array(
      z.object({
        name: requiredString("Name required"),
        relation: requiredString("Relation required"),
        age: z.preprocess(
          emptyNumberToUndefined,
          z
            .number({
              required_error: "Age is required",
              invalid_type_error: "Age is required",
            })
            .int()
            .min(0)
            .max(120),
        ),
      }),
    )
    .default([]),
});
export type TenantData = z.infer<typeof tenantSchema>;

export const termsSchema = z
  .object({
    monthlyRent: z.coerce.number().min(1, "Rent is required"),
    maintenanceIncluded: z.boolean().default(true),
    securityDeposit: z.coerce.number().min(0),
    durationMonths: z.coerce.number().int().min(1).max(120),
    lockInMonths: z.coerce.number().int().min(0).max(120),
    noticePeriodMonths: z.coerce
      .number()
      .int()
      .min(1, "Notice must be at least 1 month")
      .max(12, "Notice cannot exceed 12 months"),
    startDate: requiredString("Start date is required"),
    incrementPercent: z.coerce.number().min(0).max(100),
    rentDueDay: z.coerce.number().int().min(1).max(31),
    paymentMode: requiredString("Payment mode is required"),
    /** Upload-checkout flow: user wants wizard fields to override the PDF. */
    uploadOverridesRequested: z.boolean().optional(),
  })
  .refine((d) => d.lockInMonths <= d.durationMonths, {
    path: ["lockInMonths"],
    message: "Lock-in cannot exceed total duration",
  });
export type TermsData = z.infer<typeof termsSchema>;

export const clauseEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  text: z.string(),
  custom: z.boolean().optional().default(false),
});

export const clausesSchema = z.object({
  clauses: z.array(clauseEntrySchema),
});
export type ClausesData = z.infer<typeof clausesSchema>;

export const witnessSchema = z.object({
  fullName: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

export const witnessesSchema = z.object({
  witnesses: z.array(witnessSchema).max(2).default([]),
});
export type WitnessesData = z.infer<typeof witnessesSchema>;

const fastTrackAge = z.preprocess(
  emptyNumberToUndefined,
  z
    .number({
      required_error: "Age is required",
      invalid_type_error: "Age is required",
    })
    .int()
    .min(18, "Must be at least 18")
    .max(120),
);

const fastTrackAadhaarLast4 = z
  .string()
  .regex(/^\d{4}$/, "Enter last 4 digits of Aadhaar");

const fastTrackGender = z.enum(["Male", "Female", "Other"], {
  errorMap: () => ({ message: "Gender is required" }),
});

const fastTrackPincode = z
  .string()
  .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code");

export const uploadFastTrackStep1Schema = z.object({
  city: requiredString("City is required"),
  state: z
    .string()
    .min(1, "State is required")
    .refine(
      (v) => INDIAN_STATES.some((s) => s.value === v),
      "Pick a valid state",
    ),
  propertyPincode: fastTrackPincode,
  uploadOverridesRequested: z.boolean(),
  securityDeposit: z.coerce
    .number({ invalid_type_error: "Enter deposit amount" })
    .min(0, "Deposit cannot be negative"),
  stampValue: z.coerce
    .number({ invalid_type_error: "Pick stamp paper amount" })
    .int()
    .refine(
      (n) => (STAMP_DENOMINATIONS as readonly number[]).includes(n),
      "Pick a valid stamp denomination",
    ),
  rentExcludingMaintenance: z.enum(["yes", "no"], {
    required_error: "Select whether rent excludes maintenance",
  }),
  startDate: requiredString("Agreement start date is required"),
  landlordFullName: requiredString("Landlord name is required"),
  landlordEmail: z.string().email("Enter a valid landlord email"),
  landlordPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit landlord phone"),
  landlordAge: fastTrackAge,
  landlordGender: fastTrackGender,
  landlordAadhaarLast4: fastTrackAadhaarLast4,
  landlordPincode: fastTrackPincode,
  tenantFullName: requiredString("Tenant name is required"),
  tenantEmail: z.string().email("Enter a valid tenant email"),
  tenantPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit tenant phone"),
  tenantAge: fastTrackAge,
  tenantGender: fastTrackGender,
  tenantAadhaarLast4: fastTrackAadhaarLast4,
  tenantPincode: fastTrackPincode,
});
export type UploadFastTrackStep1Data = z.infer<
  typeof uploadFastTrackStep1Schema
>;

export const signUpSchema = z.object({
  name: requiredString("Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignUpData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type SignInData = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
