/**
 * Stamp duty calculator for residential rental agreements in bentido's four
 * launch states. Returns the rupee value of the e-stamp paper the customer
 * needs (which the local vendor procures) plus a human-readable formula
 * breakdown for the customer-facing UI.
 *
 * Formulas are residential rates per state Stamp Acts; commercial rates
 * differ and are out of scope until we open commercial bookings.
 *
 * Source: NoBroker published rates for each state (Telangana ≤11mo = 0.4%
 * of total rent + deposit, Karnataka 0.5%, Tamil Nadu 1% of annual rent,
 * etc.). See the lease-duration unlock plan for the table.
 */

export type StampDutyState =
  | "telangana"
  | "andhra-pradesh"
  | "karnataka"
  | "tamil-nadu";

export type StampDutyInput = {
  state: string;
  durationMonths: number;
  monthlyRent: number;
  securityDeposit: number;
};

export type StampDutyResult = {
  stampValue: number;
  /** Pre-rounding raw rupees (for tests / audit). */
  raw: number;
  /** Rupee value the rate applies to. */
  base: number;
  /** Rate as a percentage (e.g. 0.4 for 0.4%). */
  ratePercent: number;
  /** "0.4% of (₹1,98,000 + ₹50,000)" — displayed under the value. */
  formula: string;
};

/** Floor: smallest practical e-stamp denomination procurable from vendors. */
const MIN_STAMP_VALUE = 100;

/** Round-up step: stamp papers come in denominations divisible by ₹10. */
const ROUND_STEP = 10;

export function computeStampDuty(input: StampDutyInput): StampDutyResult {
  const { state, durationMonths, monthlyRent, securityDeposit } = input;

  const totalRentOverTerm = monthlyRent * durationMonths;
  const annualRent = monthlyRent * 12;
  const isShortTerm = durationMonths <= 11;

  let ratePercent: number;
  let base: number;
  let baseDescription: string;

  switch (state as StampDutyState) {
    case "telangana":
    case "andhra-pradesh":
      ratePercent = isShortTerm ? 0.4 : 0.5;
      base = isShortTerm ? totalRentOverTerm + securityDeposit : annualRent;
      baseDescription = isShortTerm
        ? `${fmt(totalRentOverTerm)} rent + ${fmt(securityDeposit)} deposit`
        : `${fmt(annualRent)} annual rent`;
      break;
    case "karnataka":
      ratePercent = 0.5;
      base = isShortTerm ? totalRentOverTerm + securityDeposit : annualRent;
      baseDescription = isShortTerm
        ? `${fmt(totalRentOverTerm)} rent + ${fmt(securityDeposit)} deposit`
        : `${fmt(annualRent)} annual rent`;
      break;
    case "tamil-nadu":
      ratePercent = 1;
      base = annualRent;
      baseDescription = `${fmt(annualRent)} annual rent`;
      break;
    default:
      ratePercent = 0;
      base = 0;
      baseDescription = "—";
  }

  const raw = (base * ratePercent) / 100;
  const rounded = Math.max(
    MIN_STAMP_VALUE,
    Math.ceil(raw / ROUND_STEP) * ROUND_STEP,
  );

  const formula =
    ratePercent === 0
      ? "Stamp duty for this state is not yet configured."
      : `${ratePercent}% of (${baseDescription}) → ${fmt(raw)}, rounded up to nearest ₹${ROUND_STEP} (min ₹${MIN_STAMP_VALUE})`;

  return { stampValue: rounded, raw, base, ratePercent, formula };
}

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
