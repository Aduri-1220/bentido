export const PRICING = {
  base: 199,
  esignPerSignatory: 99,
  notary: 250,
  extraCopy: 249,
  delivery: {
    DIGITAL: 0,
    SCANNED_ONLINE: 0,
    STANDARD: 100,
    EXPRESS: 250,
  } as const,
  gstRate: 0.18,
};

export type DeliveryMethod = keyof typeof PRICING.delivery;

export interface AddOnsInput {
  esignSignatories: number; // 0 if not using
  notary: boolean;
  extraCopies: number;
  delivery: DeliveryMethod;
  stampDuty: number; // pass-through, from state default
}

export interface LineItem {
  label: string;
  amount: number;
  description?: string;
  /** Portion of `amount` that is a non-taxable government fee pass-through (no GST). */
  nonTaxable?: number;
}

export interface PriceBreakdown {
  lineItems: LineItem[];
  subtotal: number;
  gst: number;
  total: number;
}

/**
 * Per-extra-copy price. Each additional original requires:
 *  - its own printed/processed copy (`PRICING.extraCopy` base)
 *  - its own stamp paper (`stampDuty` pass-through)
 *  - half-share of notary fee (if notarisation was selected)
 *  - half-share of the total e-sign fee (if e-sign was selected)
 */
export function extraCopyUnitPrice(input: {
  stampDuty: number;
  notary: boolean;
  esignSignatories: number;
}): number {
  const notaryHalf = input.notary ? Math.round(PRICING.notary / 2) : 0;
  const esignTotal = PRICING.esignPerSignatory * input.esignSignatories;
  const esignHalf = input.esignSignatories > 0 ? Math.round(esignTotal / 2) : 0;
  return PRICING.extraCopy + input.stampDuty + notaryHalf + esignHalf;
}

export function computeTotal(input: AddOnsInput): PriceBreakdown {
  const items: LineItem[] = [
    {
      label: "Base agreement drafting",
      amount: PRICING.base,
      description: "Structured rental template",
    },
    {
      label: "Stamp duty",
      amount: input.stampDuty,
      description: "Government fee (pass-through, no GST)",
      nonTaxable: input.stampDuty,
    },
  ];

  if (input.esignSignatories > 0) {
    items.push({
      label: `Aadhaar e-sign × ${input.esignSignatories}`,
      amount: PRICING.esignPerSignatory * input.esignSignatories,
      description: "OTP-based legally binding e-signature",
    });
  }
  if (input.notary) {
    items.push({
      label: "Notary attestation",
      amount: PRICING.notary,
      description: "Physical notarisation",
    });
  }
  if (input.extraCopies > 0) {
    const notaryHalf = input.notary ? Math.round(PRICING.notary / 2) : 0;
    const esignTotal = PRICING.esignPerSignatory * input.esignSignatories;
    const esignHalf =
      input.esignSignatories > 0 ? Math.round(esignTotal / 2) : 0;
    const perCopy =
      PRICING.extraCopy + input.stampDuty + notaryHalf + esignHalf;
    const parts: string[] = [
      `₹${PRICING.extraCopy} base`,
      `₹${input.stampDuty} stamp duty`,
    ];
    if (notaryHalf > 0) parts.push(`½ notary ₹${notaryHalf}`);
    if (esignHalf > 0) parts.push(`½ e-sign ₹${esignHalf}`);
    items.push({
      label: `Extra original copies × ${input.extraCopies}`,
      amount: perCopy * input.extraCopies,
      description: `Per copy: ${parts.join(" + ")} = ₹${perCopy}`,
      // Stamp duty portion within extra copies is also a govt fee pass-through.
      nonTaxable: input.stampDuty * input.extraCopies,
    });
  }
  const deliveryFee = PRICING.delivery[input.delivery];
  if (deliveryFee > 0) {
    items.push({
      label:
        input.delivery === "EXPRESS"
          ? "Express delivery (1–2 days)"
          : "Standard delivery (4–6 days)",
      amount: deliveryFee,
    });
  } else if (input.delivery === "SCANNED_ONLINE") {
    items.push({
      label: "Online scanned copy",
      amount: 0,
      description: "Scanned PDF uploaded to your account when ready",
    });
  } else {
    items.push({
      label: "Digital delivery",
      amount: 0,
      description: "Signed PDF emailed instantly",
    });
  }

  // GST applies to everything except government fee pass-throughs.
  const taxable = items.reduce(
    (s, i) => s + (i.amount - (i.nonTaxable ?? 0)),
    0,
  );
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const gst = Math.round(taxable * PRICING.gstRate);
  const total = subtotal + gst;

  return { lineItems: items, subtotal, gst, total };
}
