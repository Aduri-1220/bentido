import { CLAUSE_TEMPLATES } from "./clauses";
import { UPLOAD_FLOW_PROPERTY_ADDRESS } from "./constants";
import type {
  ClausesData,
  OwnerData,
  PropertyData,
  TenantData,
  TermsData,
  WitnessesData,
} from "./schemas";

type Gender = "Male" | "Female" | "Other";

export interface UploadFastTrackInput {
  city: string;
  state: string;
  propertyPincode: string;
  uploadOverridesRequested: boolean;
  securityDeposit: number;
  stampValue: number;
  /** UI: "yes" = rent quoted excludes maintenance charges → maintenanceIncluded false */
  rentExcludingMaintenance: "yes" | "no";
  startDate: string;
  landlordFullName: string;
  landlordEmail: string;
  landlordPhone: string;
  landlordAge: number;
  landlordGender: Gender;
  landlordAadhaarLast4: string;
  landlordPincode: string;
  tenantFullName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantAge: number;
  tenantGender: Gender;
  tenantAadhaarLast4: string;
  tenantPincode: string;
}

interface PartyMinimal {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: Gender;
  aadhaarLast4: string;
  pincode: string;
}

function partyFromMinimal(
  party: PartyMinimal,
  city: string,
  state: string,
): OwnerData {
  return {
    fullName: party.fullName.trim(),
    fatherName: "",
    age: party.age,
    gender: party.gender,
    occupation: "",
    aadhaarLast4: party.aadhaarLast4,
    pan: "",
    phone: party.phone.trim(),
    email: party.email.trim().toLowerCase(),
    addressLine1: UPLOAD_FLOW_PROPERTY_ADDRESS,
    city: city.trim(),
    state,
    pincode: party.pincode,
  };
}

function asTenant(o: OwnerData): TenantData {
  return { ...o, employer: "", familyMembers: [] };
}

export function buildUploadFastTrackPayload(input: UploadFastTrackInput): {
  propertyJson: string;
  ownerJson: string;
  tenantJson: string;
  termsJson: string;
  clausesJson: string;
  witnessesJson: string;
} {
  const city = input.city.trim();
  const state = input.state;

  const property: PropertyData = {
    type: "Apartment/Flat",
    bhk: "2 BHK",
    bathrooms: 2,
    furnishing: "Semi-Furnished",
    flatNumber: "",
    floorNumber: "",
    buildingName: "",
    addressLine1: UPLOAD_FLOW_PROPERTY_ADDRESS,
    addressLine2: "",
    locality: city,
    city,
    state,
    pincode: input.propertyPincode,
    carpetArea: 500,
    amenities: [],
    customAmenities: [],
    furnitureSchedule: [],
  };

  const owner = partyFromMinimal(
    {
      fullName: input.landlordFullName,
      email: input.landlordEmail,
      phone: input.landlordPhone,
      age: input.landlordAge,
      gender: input.landlordGender,
      aadhaarLast4: input.landlordAadhaarLast4,
      pincode: input.landlordPincode,
    },
    city,
    state,
  );
  const tenant = asTenant(
    partyFromMinimal(
      {
        fullName: input.tenantFullName,
        email: input.tenantEmail,
        phone: input.tenantPhone,
        age: input.tenantAge,
        gender: input.tenantGender,
        aadhaarLast4: input.tenantAadhaarLast4,
        pincode: input.tenantPincode,
      },
      city,
      state,
    ),
  );

  const maintenanceIncluded = input.rentExcludingMaintenance === "no";

  const terms: TermsData = {
    monthlyRent: 1,
    maintenanceIncluded,
    securityDeposit: input.securityDeposit,
    durationMonths: 11,
    lockInMonths: 0,
    noticePeriodMonths: 1,
    startDate: input.startDate,
    incrementPercent: 0,
    rentDueDay: 1,
    paymentMode: "Bank transfer",
    uploadOverridesRequested: input.uploadOverridesRequested,
  };

  const clauses: ClausesData = {
    clauses: CLAUSE_TEMPLATES.map((c) => ({
      id: c.id,
      label: c.label,
      enabled: c.defaultEnabled,
      text: c.defaultText,
      custom: false,
    })),
  };

  const witnesses: WitnessesData = { witnesses: [] };

  return {
    propertyJson: JSON.stringify(property),
    ownerJson: JSON.stringify(owner),
    tenantJson: JSON.stringify(tenant),
    termsJson: JSON.stringify(terms),
    clausesJson: JSON.stringify(clauses),
    witnessesJson: JSON.stringify(witnesses),
  };
}
