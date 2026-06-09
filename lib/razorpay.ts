import { createHmac, timingSafeEqual } from "crypto";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export async function razorpayCreateOrder(input: {
  keyId: string;
  keySecret: string;
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const currency = input.currency ?? "INR";
  const auth = Buffer.from(`${input.keyId}:${input.keySecret}`).toString(
    "base64",
  );
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency,
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed (${res.status}): ${text}`);
  }
  return (await res.json()) as RazorpayOrderResponse;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const body = `${input.orderId}|${input.paymentId}`;
  const expected = createHmac("sha256", input.keySecret)
    .update(body)
    .digest("hex")
    .toLowerCase();
  const got = input.signature.trim().toLowerCase();
  if (expected.length !== got.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(got, "utf8"),
    );
  } catch {
    return false;
  }
}

type RazorpayPaymentEntity = {
  id: string;
  order_id: string | null;
  amount: number;
  status: string;
};

export async function razorpayFetchPayment(input: {
  paymentId: string;
  keyId: string;
  keySecret: string;
}): Promise<RazorpayPaymentEntity> {
  const auth = Buffer.from(`${input.keyId}:${input.keySecret}`).toString(
    "base64",
  );
  const res = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(input.paymentId)}`,
    {
      headers: { Authorization: `Basic ${auth}` },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay payment fetch failed (${res.status}): ${text}`);
  }
  return (await res.json()) as RazorpayPaymentEntity;
}
