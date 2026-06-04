import { z } from "zod";
import { LAUNCH_STATE_VALUES, STAMP_DENOMINATIONS } from "./constants";

const launchStateError =
  "We currently serve Telangana, Andhra Pradesh, Karnataka, and Tamil Nadu only";

const launchStateSchema = z
  .string()
  .min(1, "State is required")
  .refine(
    (v) => (LAUNCH_STATE_VALUES as readonly string[]).includes(v),
    launchStateError,
  );
import {
  amenitiesForPropertyCategory,
  getPropertyTypeCategory,
} from "./property-type-category";

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

export const propertySchema = z
  .object({
    type: requiredString("Property type is required"),
    bhk: z.string().optional().default(""),
    bathrooms: z.preprocess(emptyNumberToUndefined, z.number().int().optional()),
    furnishing: z.string().optional().default(""),
    flatNumber: z.string().optional().default(""),
    floorNumber: z.string().optional().default(""),
    buildingName: z.string().optional().default(""),
    addressLine1: requiredString("Address is required"),
    addressLine2: z.string().optional().default(""),
    locality: requiredString("Locality is required"),
    city: requiredString("City is required"),
    state: launchStateSchema,
    pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
    carpetArea: z.preprocess(
      emptyNumberToUndefined,
      z
        .number({
          invalid_type_error: "Area is required",
        })
        .min(1, "Area is required")
        .max(100000),
    ),
    amenities: z.array(z.string()).default([]),
    /** User-entered extras with quantity (not limited to predefined checklist). */
    customAmenities: z
      .array(
        z.object({
          item: z.preprocess(
            (val) => (typeof val === "string" ? val.trim() : val),
            requiredString("Describe the amenity"),
          ),
          units: z.coerce.number().int().min(1).max(999),
        }),
      )
      .default([]),
    furnitureSchedule: z
      .array(
        z.object({
          item: requiredString("Item required"),
          units: z.coerce.number().int().min(1, "Units"),
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    const cat =
      data.type.trim() !== ""
        ? getPropertyTypeCategory(data.type.trim())
        : "unknown";

    const treatAsResidential =
      cat === "residential" ||
      cat === "unknown";

    const hasUnitMarker =
      (data.flatNumber?.trim()?.length ?? 0) > 0 ||
      (data.buildingName?.trim()?.length ?? 0) > 0;

    if (
      parseFloat(String(data.carpetArea)) < 1 ||
      Number.isNaN(parseFloat(String(data.carpetArea)))
    ) {
      ctx.addIssue({
        path: ["carpetArea"],
        code: z.ZodIssueCode.custom,
        message: "Area is required",
      });
    }

    if (treatAsResidential) {
      if (!(data.bhk?.trim()?.length ?? 0)) {
        ctx.addIssue({
          path: ["bhk"],
          code: z.ZodIssueCode.custom,
          message: "Bedroom configuration is required",
        });
      }
      if (typeof data.bathrooms !== "number" || data.bathrooms < 1) {
        ctx.addIssue({
          path: ["bathrooms"],
          code: z.ZodIssueCode.custom,
          message: "At least one bathroom is required",
        });
      }
      if (!(data.furnishing?.trim()?.length ?? 0)) {
        ctx.addIssue({
          path: ["furnishing"],
          code: z.ZodIssueCode.custom,
          message: "Furnishing status is required",
        });
      }
      return;
    }

    if (cat === "commercial") {
      if (!hasUnitMarker) {
        ctx.addIssue({
          path: ["flatNumber"],
          code: z.ZodIssueCode.custom,
          message: "Shop / unit no. or building / complex name is required",
        });
      }
      if (!(data.furnishing?.trim()?.length ?? 0)) {
        ctx.addIssue({
          path: ["furnishing"],
          code: z.ZodIssueCode.custom,
          message: "Select fit-out / furnishing status",
        });
      }
      if (typeof data.bathrooms === "number" && data.bathrooms > 99) {
        ctx.addIssue({
          path: ["bathrooms"],
          code: z.ZodIssueCode.custom,
          message: "Too high",
        });
      }
      return;
    }

    if (cat === "warehouse") {
      if (
        typeof data.bathrooms === "number" &&
        (!Number.isInteger(data.bathrooms) ||
          data.bathrooms < 0 ||
          data.bathrooms > 99)
      ) {
        ctx.addIssue({
          path: ["bathrooms"],
          code: z.ZodIssueCode.custom,
          message: "Enter a whole number between 0 and 99",
        });
      }
      return;
    }

    /* land_building */
    if (
      typeof data.bathrooms === "number" &&
      (!Number.isInteger(data.bathrooms) ||
        data.bathrooms < 0 ||
        data.bathrooms > 99)
    ) {
      ctx.addIssue({
        path: ["bathrooms"],
        code: z.ZodIssueCode.custom,
        message: "Enter a whole number between 0 and 99",
      });
    }
  })
  .transform((data) => {
    const cat = getPropertyTypeCategory(data.type.trim());
    const treatAsResidential = cat === "residential" || cat === "unknown";

    let bhk =
      typeof data.bhk === "string" ? data.bhk.trim() : "";
    const furnishingTrim = (
      typeof data.furnishing === "string"
        ? data.furnishing.trim()
        : ""
    ).trim();

    if (!treatAsResidential && !bhk) {
      bhk = "—";
    }

    let furnishing = furnishingTrim;
    if (
      !furnishing &&
      (cat === "warehouse" || cat === "land_building")
    ) {
      furnishing = "Not applicable";
    }

    const bathroomsComputed =
      typeof data.bathrooms === "number" && Number.isFinite(data.bathrooms)
        ? Math.min(
            Math.max(Math.trunc(data.bathrooms), 0),
            99,
          )
        : treatAsResidential
          ? Math.max(Number(data.bathrooms) || 1, 1)
          : cat === "commercial"
            ? 1
            : 0;

    const amenitiesAllowed = new Set(amenitiesForPropertyCategory(cat));
    const amenities = data.amenities.filter((a) => amenitiesAllowed.has(a));

    const customAmenities = data.customAmenities.map((row) => ({
      item: row.item.trim(),
      units: Math.min(Math.max(Math.trunc(row.units), 1), 999),
    }));

    return {
      ...data,
      bhk,
      furnishing,
      bathrooms: bathroomsComputed,
      amenities,
      customAmenities,
    };
  });
export type PropertyData = z.output<typeof propertySchema>;

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
  state: launchStateSchema,
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
    /**
     * Required true when durationMonths > 11. Acknowledges that bentido will
     * not register the agreement at the Sub-Registrar Office — registration
     * is optional and pursued separately if needed.
     */
    acknowledgesNoRegistration: z.boolean().optional().default(false),
  })
  .refine((d) => d.lockInMonths <= d.durationMonths, {
    path: ["lockInMonths"],
    message: "Lock-in cannot exceed total duration",
  })
  .refine(
    (d) => d.durationMonths <= 11 || d.acknowledgesNoRegistration === true,
    {
      path: ["acknowledgesNoRegistration"],
      message:
        "Please acknowledge that the agreement will not be registered at SRO",
    },
  );
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
  state: launchStateSchema,
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
