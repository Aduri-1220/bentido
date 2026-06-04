"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Stamp,
  Truck,
  Copy,
  Minus,
  Plus,
  Check,
  ShieldCheck,
  Loader2,
  Mail,
  Zap,
  Package,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  computeTotal,
  extraCopyUnitPrice,
  type DeliveryMethod,
} from "@/lib/pricing";
import { formatINR, cn } from "@/lib/utils";

interface Props {
  agreementId: string;
  defaultStampDuty: number;
  stateLabel: string;
  tenantFullName: string;
  city: string;
  currentStampValue: number;
  stampFormula: string;
  summaryBackHref?: string;
  pageTitle?: string;
  pageSubtitle?: string;
}

export function AddOnsClient({
  agreementId,
  defaultStampDuty: _defaultStampDuty,
  stateLabel,
  tenantFullName,
  city,
  currentStampValue,
  stampFormula,
  summaryBackHref,
  pageTitle = "Add-ons & delivery",
  pageSubtitle = "Pick what you need. The order summary on the right updates live.",
}: Props) {
  const router = useRouter();
  const [esign, setEsign] = useState(true);
  const [esignSignatories, setEsignSignatories] = useState(2);
  const [notary, setNotary] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryMethod>("STANDARD");
  const [extraCopies, setExtraCopies] = useState(0);
  const stampValue = currentStampValue;
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    tenantFullName ? `${tenantFullName}, ${city}` : "",
  );
  const [submitting, setSubmitting] = useState(false);

  const breakdown = useMemo(
    () =>
      computeTotal({
        esignSignatories: esign ? esignSignatories : 0,
        notary,
        extraCopies,
        delivery,
        stampDuty: stampValue,
      }),
    [esign, esignSignatories, notary, extraCopies, delivery, stampValue],
  );

  const perExtraCopyPrice = useMemo(
    () =>
      extraCopyUnitPrice({
        stampDuty: stampValue,
        notary,
        esignSignatories: esign ? esignSignatories : 0,
      }),
    [stampValue, notary, esign, esignSignatories],
  );

  async function proceed() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          esignSignatories: esign ? esignSignatories : 0,
          notary,
          extraCopies,
          delivery,
          deliveryAddress:
            delivery === "DIGITAL" || delivery === "SCANNED_ONLINE"
              ? undefined
              : deliveryAddress,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Add-ons saved");
      router.push(`/agreement/${agreementId}/payment`);
    } catch {
      toast.error("Could not save add-ons");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href={summaryBackHref ?? `/agreement/${agreementId}/preview`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {pageTitle}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{pageSubtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              icon={Stamp}
              title="Stamp duty"
              subtitle={`Calculated per ${stateLabel} Stamp Act for your rent, deposit and lease duration.`}
            />
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-2xl font-semibold text-slate-900">
                {formatINR(stampValue)}
              </div>
              <p className="mt-1 text-xs text-slate-600">{stampFormula}</p>
              <p className="mt-3 text-xs text-slate-500">
                Stamp duty is a government tax paid to the State — charged at
                cost, with no GST or markup.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={Fingerprint}
              title="Aadhaar e-sign"
              subtitle="Legally binding OTP-based signature under IT Act, 2000"
            >
              <Switch checked={esign} onCheckedChange={setEsign} />
            </CardHeader>
            <div
              className={cn(
                "mt-4 transition-opacity",
                esign ? "opacity-100" : "pointer-events-none opacity-50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Number of signatories
                </div>
                <QtyStepper
                  value={esignSignatories}
                  setValue={setEsignSignatories}
                  min={1}
                  max={6}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ShieldCheck}
              title="Notary attestation"
              subtitle="A notary attests the signed agreement (optional)"
            >
              <Switch checked={notary} onCheckedChange={setNotary} />
            </CardHeader>
          </Card>

          <Card>
            <CardHeader
              icon={Truck}
              title="Delivery method"
              subtitle="Choose how to receive the signed copies"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DeliveryOption
                method="DIGITAL"
                selected={delivery}
                onSelect={setDelivery}
                icon={Mail}
                title="Digital copy"
                sub="PDF in your account · Free"
                eta="After e-stamp, e-sign & upload"
              />
              <DeliveryOption
                method="SCANNED_ONLINE"
                selected={delivery}
                onSelect={setDelivery}
                icon={ScanLine}
                title="Online scanned copy"
                sub="Free · PDF in your account"
                eta="After admin upload"
              />
              <DeliveryOption
                method="STANDARD"
                selected={delivery}
                onSelect={setDelivery}
                icon={Package}
                title="Standard courier"
                sub={formatINR(100)}
                eta="4–6 working days"
              />
              <DeliveryOption
                method="EXPRESS"
                selected={delivery}
                onSelect={setDelivery}
                icon={Zap}
                title="Express courier"
                sub={formatINR(250)}
                eta="1–2 working days"
              />
            </div>
            {delivery !== "DIGITAL" && delivery !== "SCANNED_ONLINE" && (
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-800">
                  Delivery address
                </label>
                <textarea
                  className="mt-1 min-h-[70px] w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Name, full address, PIN"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              icon={Copy}
              title="Extra original copies"
              subtitle={`${formatINR(perExtraCopyPrice)} per copy · ₹249 base + stamp duty${
                notary ? " + ½ notary" : ""
              }${esign ? " + ½ e-sign" : ""}`}
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-700">Quantity</div>
              <QtyStepper
                value={extraCopies}
                setValue={setExtraCopies}
                min={0}
                max={10}
              />
            </div>
            {extraCopies > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                {extraCopies} × {formatINR(perExtraCopyPrice)} ={" "}
                <span className="font-medium text-slate-700">
                  {formatINR(perExtraCopyPrice * extraCopies)}
                </span>
              </p>
            )}
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              Order summary
            </h3>
            <ul className="mt-4 space-y-3">
              {breakdown.lineItems.map((it, idx) => (
                <motion.li
                  key={`${it.label}-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="text-slate-800">{it.label}</div>
                    {it.description && (
                      <div className="text-xs text-slate-500">
                        {it.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 font-medium tabular-nums text-slate-900">
                    {formatINR(it.amount)}
                  </div>
                </motion.li>
              ))}
            </ul>
            <div className="mt-5 space-y-1.5 border-t pt-4 text-sm">
              <Row label="Subtotal" value={breakdown.subtotal} />
              <Row label="GST (18%)" value={breakdown.gst} muted />
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-base font-semibold text-slate-900">
                  Total
                </span>
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {formatINR(breakdown.total)}
                </span>
              </div>
            </div>
            <Button
              onClick={proceed}
              variant="brand"
              size="lg"
              className="mt-5 w-full"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Proceed to payment
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">
              You can review everything once more before paying.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Stamp;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function QtyStepper({
  value,
  setValue,
  min = 0,
  max = 10,
}: {
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-md border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setValue(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        disabled={value <= min}
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="w-10 text-center font-semibold tabular-nums">{value}</div>
      <button
        type="button"
        onClick={() => setValue(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        disabled={value >= max}
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function DeliveryOption({
  method,
  selected,
  onSelect,
  icon: Icon,
  title,
  sub,
  eta,
}: {
  method: DeliveryMethod;
  selected: DeliveryMethod;
  onSelect: (m: DeliveryMethod) => void;
  icon: typeof Mail;
  title: string;
  sub: string;
  eta: string;
}) {
  const active = selected === method;
  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      className={cn(
        "relative rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        active && "border-brand-500 ring-2 ring-brand-200 shadow-md",
      )}
    >
      <Icon className="h-5 w-5 text-brand-700" />
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-0.5 text-xs text-slate-600">{sub}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
        {eta}
      </div>
      {active && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
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
