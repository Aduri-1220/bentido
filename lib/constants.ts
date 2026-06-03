export const INDIAN_STATES: {
  value: string;
  label: string;
  stampDuty: number;
}[] = [
  { value: "andhra-pradesh", label: "Andhra Pradesh", stampDuty: 500 },
  { value: "arunachal-pradesh", label: "Arunachal Pradesh", stampDuty: 100 },
  { value: "assam", label: "Assam", stampDuty: 100 },
  { value: "bihar", label: "Bihar", stampDuty: 100 },
  { value: "chhattisgarh", label: "Chhattisgarh", stampDuty: 100 },
  { value: "delhi", label: "Delhi", stampDuty: 100 },
  { value: "goa", label: "Goa", stampDuty: 200 },
  { value: "gujarat", label: "Gujarat", stampDuty: 300 },
  { value: "haryana", label: "Haryana", stampDuty: 100 },
  { value: "himachal-pradesh", label: "Himachal Pradesh", stampDuty: 100 },
  { value: "jharkhand", label: "Jharkhand", stampDuty: 100 },
  { value: "karnataka", label: "Karnataka", stampDuty: 500 },
  { value: "kerala", label: "Kerala", stampDuty: 200 },
  { value: "madhya-pradesh", label: "Madhya Pradesh", stampDuty: 100 },
  { value: "maharashtra", label: "Maharashtra", stampDuty: 500 },
  { value: "manipur", label: "Manipur", stampDuty: 100 },
  { value: "meghalaya", label: "Meghalaya", stampDuty: 100 },
  { value: "mizoram", label: "Mizoram", stampDuty: 100 },
  { value: "nagaland", label: "Nagaland", stampDuty: 100 },
  { value: "odisha", label: "Odisha", stampDuty: 100 },
  { value: "punjab", label: "Punjab", stampDuty: 100 },
  { value: "rajasthan", label: "Rajasthan", stampDuty: 500 },
  { value: "sikkim", label: "Sikkim", stampDuty: 100 },
  { value: "tamil-nadu", label: "Tamil Nadu", stampDuty: 100 },
  { value: "telangana", label: "Telangana", stampDuty: 500 },
  { value: "tripura", label: "Tripura", stampDuty: 100 },
  { value: "uttar-pradesh", label: "Uttar Pradesh", stampDuty: 100 },
  { value: "uttarakhand", label: "Uttarakhand", stampDuty: 100 },
  { value: "west-bengal", label: "West Bengal", stampDuty: 100 },
];

export const STAMP_DENOMINATIONS = [100, 200, 300, 500, 1000];

export const PROPERTY_TYPES = [
  "Shop",
  "Office",
  "Apartment/Flat",
  "Godown",
  "Independent House",
  "Land+Building/Shed",
  "Studio Apartments",
];

export const BHK_OPTIONS = [
  "1 RK",
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "4+ BHK",
];

export const FURNISHING_OPTIONS = [
  "Unfurnished",
  "Semi-Furnished",
  "Fully-Furnished",
];

/** Shop / office — property form uses this when type is commercial. */
export const COMMERCIAL_FURNISHING_OPTIONS = [
  "Bare shell",
  "Warm shell",
  "Semi-Fitted",
  "Fully fitted / plug & play",
];

export const COMMERCIAL_AMENITIES = [
  "Fire safety / sprinklers",
  "Loading / unloading bay",
  "Three-phase power",
  "DG / generator backup",
  "CCTV",
  "Elevator / goods lift",
  "Water supply",
];

export const AMENITIES = [
  "Parking",
  "Lift",
  "Power Backup",
  "Security",
  "Water Supply",
  "Gas Connection",
  "Internet/Wifi",
  "Air Conditioning",
  "Geyser",
  "Modular Kitchen",
];

/** How the user started this agreement from the dashboard (optional on legacy rows). */
export const WIZARD_ENTRY_FULL_DETAILS = "FULL_DETAILS";
export const WIZARD_ENTRY_UPLOAD_DRAFT = "UPLOAD_DRAFT";

/** Seeded property address line when the user uploads their own agreement PDF. */
export const UPLOAD_FLOW_PROPERTY_ADDRESS = "As stated in uploaded agreement";

export type WizardEntryKind =
  | typeof WIZARD_ENTRY_FULL_DETAILS
  | typeof WIZARD_ENTRY_UPLOAD_DRAFT;

export const WIZARD_STEPS = [
  { id: "draft", label: "Your draft", index: 1 },
  { id: "property", label: "Property", index: 2 },
  { id: "owner", label: "Owner", index: 3 },
  { id: "tenant", label: "Tenant", index: 4 },
  { id: "terms", label: "Rental Terms", index: 5 },
  { id: "clauses", label: "Clauses", index: 6 },
  { id: "witnesses", label: "Witnesses", index: 7 },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

/** Sidebar steps: scratch flow skips the draft upload step; upload-draft uses a 2-step checkout. */
export function visibleWizardStepsForEntry(
  wizardEntry: string | null | undefined,
): ReadonlyArray<{ id: string; label: string }> {
  if (wizardEntry === WIZARD_ENTRY_FULL_DETAILS) {
    return WIZARD_STEPS.filter((s) => s.id !== "draft");
  }
  if (wizardEntry === WIZARD_ENTRY_UPLOAD_DRAFT) {
    return [
      { id: "draft", label: "Upload & details" },
      { id: "addons", label: "Payment summary" },
    ];
  }
  return WIZARD_STEPS;
}

export const STATUS_FLOW = [
  { id: "DRAFT", label: "Draft Created" },
  { id: "PAID", label: "Payment Received" },
  { id: "E_STAMPING", label: "E-Stamping" },
  { id: "E_SIGNING", label: "Aadhaar E-Signing" },
  { id: "DELIVERY", label: "Out for Delivery" },
  { id: "COMPLETED", label: "Completed" },
] as const;
