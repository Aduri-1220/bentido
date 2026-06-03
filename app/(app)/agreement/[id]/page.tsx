import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadAgreement, uploadDraftCheckoutReady } from "@/lib/agreement";
import { StatusTimeline } from "./status-timeline";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  agreementStatusAllowsExecutedCopyDownload,
  deliveryUsesExecutedCopyUpload,
} from "@/lib/delivery-executed-copy";
import { formatDate, formatINR } from "@/lib/utils";

export default async function AgreementStatusPage({
  params,
}: {
  params: { id: string };
}) {
  const parsed = await loadAgreement(params.id);
  if (parsed.agreement.status === "DRAFT") {
    if (uploadDraftCheckoutReady(parsed)) {
      redirect(`/agreement/${params.id}/addons`);
    }
    redirect(`/agreement/${params.id}/preview`);
  }

  const [payment, delivery, addOns] = await Promise.all([
    prisma.payment.findUnique({ where: { agreementId: params.id } }),
    prisma.delivery.findUnique({
      where: { agreementId: params.id },
      select: {
        method: true,
        address: true,
        trackingId: true,
        scannedCopyOriginalName: true,
        scannedCopyUploadedAt: true,
      },
    }),
    prisma.addOn.findMany({ where: { agreementId: params.id } }),
  ]);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <header className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Agreement #{parsed.agreement.id.slice(0, 8)}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {parsed.property?.locality
                    ? `${parsed.property.locality}, ${parsed.property.city}`
                    : parsed.property?.city}
                </p>
              </div>
              <StatusBadge status={parsed.agreement.status} />
            </div>
            <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
              <Pair label="Owner" value={parsed.owner?.fullName} />
              <Pair label="Tenant" value={parsed.tenant?.fullName} />
              <Pair
                label="Tenancy start"
                value={formatDate(parsed.terms?.startDate)}
              />
            </div>
          </header>

          <StatusTimeline
            agreementId={params.id}
            currentStatus={parsed.agreement.status}
          />
        </div>

        <aside className="space-y-5">
          <Card title="Payment">
            <KV
              label="Amount paid"
              value={payment?.amount ? formatINR(payment.amount) : "—"}
            />
            <KV label="Status" value={payment?.status ?? "—"} />
            <KV
              label="Txn / ref"
              value={
                payment?.providerPaymentId ??
                payment?.providerOrderId ??
                "—"
              }
            />
          </Card>

          <Card title="Delivery">
            <KV
              label="Method"
              value={deliveryMethodLabel(delivery?.method)}
            />
            {delivery?.address && (
              <KV label="Address" value={delivery.address} />
            )}
            {delivery?.trackingId && (
              <KV label="Tracking" value={delivery.trackingId} />
            )}
            {delivery != null &&
              deliveryUsesExecutedCopyUpload(delivery.method) && (
              <>
                {!agreementStatusAllowsExecutedCopyDownload(
                  parsed.agreement.status,
                ) ? (
                  <p className="pt-1 text-xs text-slate-500">
                    Once e-stamping and Aadhaar e-sign are done, your executed
                    PDF will be downloadable from{" "}
                    <span className="font-medium text-slate-700">
                      Out for Delivery
                    </span>{" "}
                    onward.
                  </p>
                ) : delivery.scannedCopyUploadedAt ? (
                  <div className="pt-2">
                    <Button asChild variant="brand" size="lg" className="w-full">
                      <a
                        href={`/api/agreements/${params.id}/scanned-copy`}
                        download
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {delivery.method === "DIGITAL"
                          ? "Download digital copy"
                          : "Download scanned copy"}
                      </a>
                    </Button>
                    {delivery.scannedCopyOriginalName ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {delivery.scannedCopyOriginalName}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="pt-1 text-xs text-slate-500">
                    Your finalized PDF will appear here shortly after our team
                    uploads it.
                  </p>
                )}
              </>
            )}
          </Card>

          <Card title="Add-ons">
            {addOns.length === 0 ? (
              <div className="text-sm text-slate-500">None</div>
            ) : (
              <ul className="space-y-1.5">
                {addOns.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700">
                      {a.kind === "ESIGN"
                        ? `Aadhaar e-sign × ${a.qty}`
                        : a.kind === "NOTARY"
                          ? "Notary attestation"
                          : `Extra copies × ${a.qty}`}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatINR(a.unitPrice * a.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={`/agreement/${params.id}/preview`} target="_blank">
              Open signed PDF
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Pair({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 font-medium text-slate-900">{value || "—"}</div>
    </div>
  );
}

function deliveryMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "EXPRESS":
      return "Express courier";
    case "STANDARD":
      return "Standard courier";
    case "SCANNED_ONLINE":
      return "Online scanned copy";
    case "DIGITAL":
    default:
      return "Digital copy";
  }
}
