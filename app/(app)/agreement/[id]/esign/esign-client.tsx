"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Fingerprint,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  AlertCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ESignRow {
  party: string;
  status: string;
  signerEmail: string | null;
  accessToken: string | null;
  digioDocId: string | null;
  signedAt: Date | null;
}

interface Props {
  agreementId: string;
  owner: { name: string; email: string };
  tenant: { name: string; email: string };
  existingRows: ESignRow[];
}

export function ESignClient({
  agreementId,
  owner,
  tenant,
  existingRows,
}: Props) {
  const [rows, setRows] = useState<ESignRow[]>(existingRows);
  const [initiating, setInitiating] = useState(false);
  const [signerLinks, setSignerLinks] = useState<
    { party: string; email: string; gatewayUrl: string }[]
  >([]);

  const allSigned =
    rows.length >= 2 && rows.every((r) => r.status === "SIGNED");
  const anyInitiated = rows.some((r) =>
    ["INITIATED", "SIGNED"].includes(r.status),
  );

  async function initiateESign() {
    setInitiating(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/esign`, {
        method: "POST",
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Failed to initiate eSign");
        return;
      }
      const data = await res.json();
      setSignerLinks(data.signerLinks ?? []);
      toast.success("eSign request created — signing links sent via email");

      // Refresh status rows
      const statusRes = await fetch(`/api/agreements/${agreementId}/esign`);
      if (statusRes.ok) {
        const { esign } = await statusRes.json();
        setRows(esign);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setInitiating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SignerCard
          label="Owner / Landlord"
          name={owner.name}
          email={owner.email}
          row={rows.find((r) => r.party === "OWNER")}
          link={signerLinks.find((l) => l.party === "OWNER")?.gatewayUrl}
        />
        <SignerCard
          label="Tenant"
          name={tenant.name}
          email={tenant.email}
          row={rows.find((r) => r.party === "TENANT")}
          link={signerLinks.find((l) => l.party === "TENANT")?.gatewayUrl}
        />
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">How Aadhaar eSign works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Click &quot;Send signing links&quot; — Digio emails each party.</li>
          <li>Each party opens the link and enters their Aadhaar-linked OTP.</li>
          <li>
            Once all parties sign, the agreement automatically advances to
            Delivery.
          </li>
        </ol>
      </div>

      {allSigned ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">
              All parties have signed!
            </p>
            <p className="text-sm text-green-700">
              The agreement is moving to delivery.
            </p>
          </div>
        </div>
      ) : (
        <Button
          variant="brand"
          size="lg"
          onClick={initiateESign}
          disabled={initiating}
          className="w-full sm:w-auto"
        >
          {initiating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {anyInitiated ? "Resend signing links" : "Send signing links"}
        </Button>
      )}
    </div>
  );
}

function SignerCard({
  label,
  name,
  email,
  row,
  link,
}: {
  label: string;
  name: string;
  email: string;
  row?: ESignRow;
  link?: string;
}) {
  const status = row?.status ?? "PENDING";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-sm",
        status === "SIGNED" && "border-green-200 bg-green-50",
        status === "INITIATED" && "border-blue-100",
        status === "FAILED" && "border-red-100 bg-red-50",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="truncate text-sm text-slate-600">{name}</p>
          <p className="truncate text-xs text-slate-400">{email}</p>
        </div>
        <StatusIcon status={status} />
      </div>

      {status === "SIGNED" && row?.signedAt && (
        <p className="mt-3 text-xs text-green-700">
          Signed on {new Date(row.signedAt).toLocaleDateString("en-IN")}
        </p>
      )}

      {status === "INITIATED" && (
        <p className="mt-3 text-xs text-blue-700">
          Signing link sent — waiting for signature
        </p>
      )}

      {link && status !== "SIGNED" && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
        >
          Open signing link
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "SIGNED")
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (status === "FAILED")
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  if (status === "INITIATED")
    return <Clock className="h-5 w-5 text-blue-500" />;
  return <Clock className="h-5 w-5 text-slate-300" />;
}
