import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseAgreementJsonFields } from "@/lib/agreement";
import { paymentQualifiesForWorkflow } from "@/lib/agreement-status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/app/status-badge";
import { DraftDocument } from "@/components/agreement/draft-document";
import { AdminWorkflowAdvance } from "@/components/admin/admin-workflow-advance";
import { deliveryUsesExecutedCopyUpload } from "@/lib/delivery-executed-copy";
import { AdminScannedCopyUpload } from "@/components/admin/admin-scanned-copy-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function WorkerAgreementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const agreement = await prisma.agreement.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          state: true,
          createdAt: true,
        },
      },
      payment: true,
      delivery: true,
      addOns: true,
    },
  });

  if (!agreement) notFound();

  const hasUploadedBlob =
    (await prisma.agreement.count({
      where: { id: params.id, sourceDraftBlob: { not: null } },
    })) > 0;

  const parsedFields = parseAgreementJsonFields(agreement);

  const ownerPreview = jsonPretty(agreement.ownerJson);
  const tenantPreview = jsonPretty(agreement.tenantJson);
  const propertyPreview = jsonPretty(agreement.propertyJson);
  const termsPreview = jsonPretty(agreement.termsJson);

  const payment = agreement.payment;
  const workflowPaymentOk = paymentQualifiesForWorkflow(payment);

  const paymentRecordedLabel =
    payment?.status === "SUCCESS"
      ? "Paid"
      : payment?.status === "PENDING"
        ? "Not completed yet"
        : payment?.status === "FAILED"
          ? "Payment failed"
          : payment?.status ?? "—";

  return (
    <div>
      <Link
        href="/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All agreements
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-lg font-semibold text-slate-900">
              {agreement.id}
            </h2>
            <StatusBadge status={agreement.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Updated {formatDate(agreement.updatedAt)} · Created{" "}
            {formatDate(agreement.createdAt)}
          </p>
          {agreement.wizardEntry ? (
            <p className="mt-1 font-mono text-xs text-slate-500">
              wizardEntry: {agreement.wizardEntry}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasUploadedBlob ? (
            <Button asChild variant="outline">
              <a
                href={`/api/admin/agreements/${params.id}/source-draft`}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Customer upload (PDF/DOCX)
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminWorkflowAdvance
          agreementId={params.id}
          currentStatus={agreement.status}
          workflowPaymentOk={workflowPaymentOk}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
            <CardDescription>
              Email/password sign-up uses their 10-digit mobile as database
              user id. Filter agreements on staff lists by typing that mobile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={agreement.user.name ?? "—"} />
            <Row label="Email" value={agreement.user.email} />
            <Row
              label="Phone"
              value={
                agreement.user.phone
                  ? `+91 ${agreement.user.phone}`
                  : "— (not collected — e.g. Google sign-up)"
              }
            />
            <Row label="User ID" value={agreement.user.id} mono />
            <Row label="Role" value={agreement.user.role ?? "—"} />
            <Row label="State" value={agreement.user.state ?? "—"} />
            <Row
              label="Signed up"
              value={formatDate(agreement.user.createdAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
            <CardDescription>
              Order amounts are hidden in this workspace. Use Admin for billing
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {payment ? (
              <>
                <Row label="Gateway status" value={payment.status} />
                <Row label="Checkout" value={paymentRecordedLabel} />
                <Row
                  label="Payment mode"
                  value={paymentMethodLabel(payment.method)}
                />
                <Row label="Recorded at" value={formatDate(payment.createdAt)} />
              </>
            ) : (
              <p className="text-slate-600">No payment record yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {agreement.delivery ? (
              <>
                <Row
                  label="Method"
                  value={workerDeliveryMethodLabel(agreement.delivery.method)}
                />
                <Row
                  label="Address"
                  value={agreement.delivery.address ?? "—"}
                />
                <Row
                  label="Tracking"
                  value={agreement.delivery.trackingId ?? "—"}
                  mono
                />
              </>
            ) : (
              <p className="text-slate-600">No delivery selection saved.</p>
            )}
          </CardContent>
        </Card>

        {deliveryUsesExecutedCopyUpload(agreement.delivery?.method) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Signed agreement PDF (digital / scanned)
              </CardTitle>
              <CardDescription>
                Upload the final PDF after e-stamping and Aadhaar e-sign so the
                customer can download it from their agreement page once the flow
                reaches Out for Delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminScannedCopyUpload
                agreementId={params.id}
                existingFileName={
                  agreement.delivery?.scannedCopyOriginalName ?? null
                }
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add-ons selected</CardTitle>
            <CardDescription>
              Line-item prices are hidden — use this list to fulfil e-sign,
              notary, and copy requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Stamp duty on order"
              value={
                agreement.stampValue != null
                  ? "Included (amount hidden)"
                  : "—"
              }
            />
            {agreement.addOns.length === 0 ? (
              <p className="text-slate-600">No add-on rows stored.</p>
            ) : (
              <ul className="space-y-2">
                {agreement.addOns.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="font-medium text-slate-900">
                      {addOnKindLabel(o.kind)}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Quantity: {o.qty}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Generated rental draft (from wizard data)
            </CardTitle>
            <CardDescription>
              Same legal draft the customer sees on Preview — built from saved
              property, parties, terms, clauses, and witnesses (not from their
              uploaded PDF text).
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 md:p-6">
            <div className="mx-auto max-h-[min(70vh,880px)] overflow-y-auto rounded-lg shadow-inner">
              <DraftDocument
                agreementId={params.id}
                property={parsedFields.property}
                owner={parsedFields.owner}
                tenant={parsedFields.tenant}
                terms={parsedFields.terms}
                clauses={parsedFields.clauses}
                witnesses={parsedFields.witnesses}
                showEditPencils={false}
              />
            </div>
          </CardContent>
        </Card>

        <JsonCard title="Property (JSON)" content={propertyPreview} />
        <JsonCard title="Owner / landlord (JSON)" content={ownerPreview} />
        <JsonCard title="Tenant (JSON)" content={tenantPreview} />
        <JsonCard title="Terms (JSON)" content={termsPreview} />
        <JsonCard
          title="Clauses (JSON)"
          content={jsonPretty(agreement.clausesJson)}
        />
        <JsonCard
          title="Witnesses (JSON)"
          content={jsonPretty(agreement.witnessesJson)}
        />
      </div>
    </div>
  );
}

function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "— (not recorded — legacy or incomplete checkout)";
  const map: Record<string, string> = {
    UPI: "UPI",
    CARD: "Credit / debit card",
    NETBANKING: "Net banking",
  };
  return map[method] ?? method;
}

function addOnKindLabel(kind: string): string {
  const map: Record<string, string> = {
    ESIGN: "Aadhaar e-sign",
    NOTARY: "Notary",
    EXTRA_COPY: "Extra printed copy",
  };
  return map[kind] ?? kind;
}

function workerDeliveryMethodLabel(method: string): string {
  const map: Record<string, string> = {
    DIGITAL: "Digital copy",
    SCANNED_ONLINE: "Online scanned copy",
    STANDARD: "Standard courier",
    EXPRESS: "Express courier",
  };
  return map[method] ?? method;
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span className="min-w-[7rem] shrink-0 text-slate-500">{label}</span>
      <span
        className={`break-all text-slate-900 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function JsonCard({ title, content }: { title: string; content: string }) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
          {content}
        </pre>
      </CardContent>
    </Card>
  );
}

function jsonPretty(s: string | null): string {
  if (!s) return "—";
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
