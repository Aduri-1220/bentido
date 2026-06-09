"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatINR, cn } from "@/lib/utils";
import type { PriceBreakdown } from "@/lib/pricing";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Stage = "ready" | "processing" | "success" | "failure";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(s);
  });
}

export function PaymentClient({
  agreementId,
  breakdown,
  tenantName,
  ownerName,
  city,
  checkoutMode,
  razorpayKeyId,
  simulateUiAllowed,
}: {
  agreementId: string;
  breakdown: PriceBreakdown;
  tenantName: string;
  ownerName: string;
  city: string;
  checkoutMode: "mock" | "razorpay";
  razorpayKeyId: string | null;
  simulateUiAllowed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("ready");
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [simulate, setSimulate] = useState<"success" | "failure">("success");

  async function payMock() {
    const res = await fetch(`/api/agreements/${agreementId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        simulate,
        method: method.toUpperCase() as "UPI" | "CARD" | "NETBANKING",
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Payment request failed",
      );
    }
    if (data.ok) {
      setStage("success");
      await new Promise((r) => setTimeout(r, 900));
      toast.success("Payment successful");
      router.push(`/agreement/${agreementId}`);
    } else {
      setStage("failure");
    }
  }

  async function pay() {
    setStage("processing");
    try {
      if (checkoutMode === "razorpay") {
        if (!razorpayKeyId) {
          toast.error("Razorpay is not configured");
          setStage("failure");
          return;
        }
        const create = await fetch(`/api/agreements/${agreementId}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            method: method.toUpperCase() as "UPI" | "CARD" | "NETBANKING",
          }),
        });
        const created = (await create.json()) as {
          mode?: string;
          keyId?: string;
          orderId?: string;
          currency?: string;
          amountPaise?: number;
          error?: unknown;
        };
        if (!create.ok) {
          const err = created.error;
          const msg =
            typeof err === "string"
              ? err
              : err && typeof err === "object" && "message" in err
                ? String((err as { message?: string }).message)
                : "Could not start checkout";
          throw new Error(msg);
        }
        if (
          created.mode !== "razorpay" ||
          !created.orderId ||
          !created.keyId ||
          typeof created.amountPaise !== "number"
        ) {
          throw new Error("Unexpected checkout response");
        }

        const currency = created.currency?.trim() || "INR";

        setOpen(false);
        setStage("ready");
        await loadRazorpayScript();
        if (!window.Razorpay) throw new Error("Razorpay failed to initialize");

        const options: Record<string, unknown> = {
          key: created.keyId,
          amount: created.amountPaise,
          order_id: created.orderId,
          currency,
          name: "bentido",
          description: "Rental agreement order",
          handler: async (response: RazorpayHandlerResponse) => {
            const verify = await fetch(
              `/api/agreements/${agreementId}/payment/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );
            if (!verify.ok) {
              const v = (await verify.json().catch(() => ({}))) as {
                error?: string;
              };
              toast.error(v.error ?? "Could not verify payment");
              return;
            }
            toast.success("Payment successful");
            router.push(`/agreement/${agreementId}`);
          },
          modal: {
            ondismiss: () => {
              setStage("ready");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      await new Promise((r) => setTimeout(r, 1800));
      await payMock();
    } catch (e) {
      setStage("failure");
      toast.error(e instanceof Error ? e.message : "Payment failed");
    }
  }

  const isRazorpayBlocked = checkoutMode === "razorpay" && !razorpayKeyId;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href={`/agreement/${agreementId}/addons`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to add-ons
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Confirm & pay
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {checkoutMode === "razorpay"
            ? "You will complete payment securely with Razorpay."
            : "Review the order before continuing."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Agreement summary
            </h3>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <Pair label="Owner" value={ownerName} />
              <Pair label="Tenant" value={tenantName} />
              <Pair label="City" value={city} />
              <Pair label="Reference" value={agreementId.slice(0, 12)} />
            </dl>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Line items</h3>
            <ul className="mt-4 divide-y">
              {breakdown.lineItems.map((it) => (
                <li
                  key={it.label}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="text-slate-700">
                    {it.label}
                    {it.description && (
                      <span className="ml-2 text-xs text-slate-500">
                        {it.description}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 font-medium tabular-nums">
                    {formatINR(it.amount)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              <Row label="Subtotal" value={breakdown.subtotal} />
              <Row label="GST (18%)" value={breakdown.gst} muted />
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-base font-semibold text-slate-900">
                  Total payable
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {formatINR(breakdown.total)}
                </span>
              </div>
            </div>
          </section>

          <section
            className={cn(
              "rounded-2xl border p-5 text-sm",
              checkoutMode === "razorpay"
                ? "border-emerald-100 bg-emerald-50/60 text-emerald-900"
                : "border-amber-50/60 bg-amber-50/60 text-amber-900",
            )}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                {checkoutMode === "razorpay" ? (
                  <>
                    Total is calculated on the server from your add-ons, stamp
                    duty, and delivery. Razorpay confirms capture before your
                    agreement moves to <strong>Paid</strong>.
                    <span className="mt-2 block text-xs leading-relaxed opacity-90">
                      <strong>Test mode:</strong> On Razorpay&apos;s screen, use
                      an <strong>Indian domestic</strong> test card from{" "}
                      <a
                        href="https://razorpay.com/docs/payments/payments/test-card-details/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline underline-offset-2"
                      >
                        Razorpay&apos;s test card list
                      </a>
                      . Mastercard example:{" "}
                      <code className="rounded bg-white/80 px-1 py-0.5 text-[11px]">
                        5267 3181 8797 5449
                      </code>{" "}
                      — avoid{" "}
                      <code className="rounded bg-white/80 px-1 py-0.5 text-[11px]">
                        4242…
                      </code>{" "}
                      (often rejected as international).
                    </span>
                  </>
                ) : (
                  <>
                    This is a <strong>simulated checkout</strong> for
                    development. Amount is taken from your saved order only —
                    you cannot override it from the browser.
                  </>
                )}
              </p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              You pay today
            </h3>
            <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
              {formatINR(breakdown.total)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              One-time payment · GST included
            </div>

            {simulateUiAllowed && checkoutMode === "mock" ? (
              <div className="mt-6">
                <Label className="mb-2 block text-sm font-medium">
                  Simulation
                </Label>
                <RadioGroup
                  value={simulate}
                  onValueChange={(v) => setSimulate(v as "success" | "failure")}
                  className="grid grid-cols-2 gap-2"
                >
                  <SimRadio
                    value="success"
                    current={simulate}
                    label="Success"
                  />
                  <SimRadio
                    value="failure"
                    current={simulate}
                    label="Failure"
                  />
                </RadioGroup>
              </div>
            ) : null}

            <Button
              variant="brand"
              size="lg"
              className="mt-5 w-full"
              disabled={isRazorpayBlocked}
              onClick={() => {
                setStage("ready");
                setOpen(true);
              }}
            >
              <CreditCard className="h-4 w-4" />
              Pay {formatINR(breakdown.total)}
            </Button>
            {isRazorpayBlocked ? (
              <p className="mt-2 text-xs text-red-600">
                Missing Razorpay configuration (RAZORPAY_KEY_ID and related
                secrets).
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              Secured checkout
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => stage !== "processing" && setOpen(o)}
      >
        <DialogContent className="sm:max-w-md">
          {stage === "success" ? (
            <SuccessView amount={breakdown.total} />
          ) : stage === "failure" ? (
            <FailureView
              onRetry={() => {
                setStage("ready");
              }}
            />
          ) : stage === "processing" ? (
            <ProcessingView amount={breakdown.total} />
          ) : (
            <ReadyView
              amount={breakdown.total}
              method={method}
              setMethod={setMethod}
              checkoutMode={checkoutMode}
              onPay={pay}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadyView({
  amount,
  method,
  setMethod,
  checkoutMode,
  onPay,
  onCancel,
}: {
  amount: number;
  method: "upi" | "card" | "netbanking";
  setMethod: (m: "upi" | "card" | "netbanking") => void;
  checkoutMode: "mock" | "razorpay";
  onPay: () => void;
  onCancel: () => void;
}) {
  const domesticTestMastercard = "5267 3181 8797 5449";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
            b
          </div>
          bentido Payments
        </DialogTitle>
        <DialogDescription>
          {checkoutMode === "razorpay"
            ? `Open Razorpay to pay ${formatINR(amount)}. Card or UPI details are entered on Razorpay’s page.`
            : `Pay ${formatINR(amount)} to complete your order.`}
        </DialogDescription>
      </DialogHeader>

      {checkoutMode === "razorpay" ? (
        <div className="space-y-3 py-2 text-sm text-slate-700">
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed">
            If you see{" "}
            <strong className="text-slate-900">
              International cards are not supported
            </strong>
            , the PAN/BIN is treated as non-Indian. Use a number from{" "}
            <a
              href="https://razorpay.com/docs/payments/payments/test-card-details/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline underline-offset-2"
            >
              Razorpay → Test cards for Indian payments
            </a>
            . Quick domestic example:{" "}
            <code className="whitespace-nowrap rounded bg-white px-1 py-0.5 text-xs ring-1 ring-slate-200">
              {domesticTestMastercard}
            </code>{" "}
            (any future expiry, any CVV). Avoid{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs ring-1 ring-slate-200">
              4242 4242 4242 4242
            </code>
            — it is usually rejected on Indian test accounts.
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <Tabs value={method} onValueChange={(v) => setMethod(v as never)} />
          {method === "upi" && (
            <div className="space-y-2">
              <Label htmlFor="upi">UPI ID</Label>
              <Input
                id="upi"
                placeholder="username@bank"
                defaultValue="demo@bentido"
              />
            </div>
          )}
          {method === "card" && (
            <div className="space-y-2">
              <Label htmlFor="card">Card number</Label>
              <Input
                id="card"
                placeholder={domesticTestMastercard}
                defaultValue={domesticTestMastercard}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="MM/YY" defaultValue="12/28" />
                <Input placeholder="CVV" defaultValue="123" />
              </div>
            </div>
          )}
          {method === "netbanking" && (
            <div className="space-y-2">
              <Label>Choose bank</Label>
              <Input defaultValue="HDFC Bank" readOnly />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="brand" onClick={onPay}>
          {checkoutMode === "razorpay"
            ? `Continue to Razorpay · ${formatINR(amount)}`
            : `Pay ${formatINR(amount)}`}
        </Button>
      </div>
    </>
  );
}

function Tabs({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  const tabs = [
    { id: "upi", label: "UPI" },
    { id: "card", label: "Card" },
    { id: "netbanking", label: "Netbanking" },
  ];
  return (
    <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onValueChange(t.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === t.id
              ? "bg-white text-slate-900 shadow"
              : "text-slate-600",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ProcessingView({ amount }: { amount: number }) {
  return (
    <div className="py-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-brand-200 border-t-brand-600"
      />
      <h3 className="mt-3 text-lg font-semibold text-slate-900">
        Processing your payment
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Hold on while we confirm {formatINR(amount)} with your bank.
      </p>
    </div>
  );
}

function SuccessView({ amount }: { amount: number }) {
  return (
    <div className="py-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.div>
      <h3 className="mt-4 text-xl font-bold text-slate-900">
        Payment successful
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        We&rsquo;ve received {formatINR(amount)}. Redirecting to your
        agreement&hellip;
      </p>
    </div>
  );
}

function FailureView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
        <XCircle className="h-9 w-9" />
      </div>
      <h3 className="mt-4 text-xl font-bold text-slate-900">Payment failed</h3>
      <p className="mt-1 text-sm text-slate-600">
        Your bank declined the transaction or verification failed. No money was
        kept without confirmation.
      </p>
      <Button onClick={onRetry} variant="brand" className="mt-5">
        Try again
      </Button>
    </div>
  );
}

function SimRadio({
  value,
  current,
  label,
}: {
  value: string;
  current: string;
  label: string;
}) {
  const active = value === current;
  return (
    <Label
      htmlFor={`sim-${value}`}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium transition-colors",
        active &&
          "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-200",
      )}
    >
      <RadioGroupItem value={value} id={`sim-${value}`} />
      {label}
    </Label>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-slate-700", muted && "text-slate-500")}>
        {label}
      </span>
      <span className="font-medium tabular-nums text-slate-900">
        {formatINR(value)}
      </span>
    </div>
  );
}
