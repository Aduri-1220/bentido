/** Digits-only mobile for queries (10-digit Indian mobiles from sign-up are [6-9]…). */
export function digitsOnly(raw: string | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

/**
 * Parsed mobile filter string: full 10 digits or shorter partial for "contains".
 */
export function parsePhoneSearchQuery(raw: string | undefined | null): string | null {
  const d = digitsOnly(raw ?? "").trim();
  return d.length > 0 ? d : null;
}
