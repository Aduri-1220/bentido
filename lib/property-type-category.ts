import { AMENITIES, COMMERCIAL_AMENITIES, PROPERTY_TYPES } from "./constants";

export type PropertyTypeCategory =
  | "residential"
  | "commercial"
  | "warehouse"
  | "land_building"
  | "unknown";

const RESIDENTIAL = new Set([
  "Apartment/Flat",
  "Independent House",
  "Studio Apartments",
]);

const COMMERCIAL = new Set(["Shop", "Office"]);

const WAREHOUSE = new Set(["Godown"]);

const LAND_BUILDING = new Set(["Land+Building/Shed"]);

/** Legacy `PropertyData.type` strings from earlier product versions. */
const LEGACY_TYPE_CATEGORY: Record<string, PropertyTypeCategory> = {
  "Apartment / Flat": "residential",
  "Independent House / Villa": "residential",
  "Independent Floor / Builder Floor": "residential",
  "PG / Hostel Room": "residential",
  "Studio Apartment": "residential",
  "Commercial Space": "commercial",
};

export function getPropertyTypeCategory(
  type: string | null | undefined,
): PropertyTypeCategory {
  if (!type) return "unknown";
  const t = type.trim();
  const legacy = LEGACY_TYPE_CATEGORY[t];
  if (legacy) return legacy;
  if (RESIDENTIAL.has(t)) return "residential";
  if (COMMERCIAL.has(t)) return "commercial";
  if (WAREHOUSE.has(t)) return "warehouse";
  if (LAND_BUILDING.has(t)) return "land_building";
  return "unknown";
}

export function isRegisteredPropertyType(type: string): boolean {
  return (PROPERTY_TYPES as readonly string[]).includes(type);
}

/** Allowed amenity labels for the agreement property step — checklist only, no free-text values. */
export function amenitiesForPropertyCategory(
  cat: PropertyTypeCategory,
): readonly string[] {
  switch (cat) {
    case "residential":
      return AMENITIES;
    case "commercial":
      return [...AMENITIES, ...COMMERCIAL_AMENITIES];
    case "warehouse":
      return [...COMMERCIAL_AMENITIES];
    case "land_building":
      return [...AMENITIES, ...COMMERCIAL_AMENITIES];
    default:
      return AMENITIES;
  }
}
