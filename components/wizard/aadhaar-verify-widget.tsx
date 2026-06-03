"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Fingerprint,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type KycStatus = "PENDING" | "INITIATED" | "VERIFIED" | "FAILED";

interface Props {
  agreementId: string;
  party: "OWNER" | "TENANT";
  /** Must be filled in from the form before initiating KYC. */
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  initialStatus?: KycStatus;
  initialMaskedAadhaar?: string;
  /** Called when KYC is verified so the parent form can record aadhaarLast4. */
  onVerified?: (maskedAadhaar: string, last4: string) => void;
}

/**
 * Inline Aadhaar OTP KYC widget.
 *
 * Flow:
 *  1. "Verify Aadhaar" button → POST /api/agreements/:id/kyc
 *  2. Digio sends OTP to Aadhaar-linked mobile.
 *  3. Gateway link opens in a new tab for the user to complete OTP entry.
 *  4. Webhook marks as VERIFIED; user clicks "Check status" to refresh.
 */
export function AadhaarVerifyWidget({
  agreementId,
  party,
  customerName,
  customerEmail,
  customerMobile,
  initialStatus = "PENDING",
  initialMaskedAadhaar,
  onVerified,
}: Props) {
  const [status, setStatus] = useState<KycStatus>(initialStatus);
  const [maskedAadhaar, setMaskedAadhaar] = useState(
    initialMaskedAadhaar ?? "",
  );
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function initiateKyc() {
    if (!customerEmail || !customerMobile || !customerName) {
      toast.error("Fill in name, email, and mobile number before verifying.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          party,
          customerEmail,
          customerName,
          customerMobile,
        }),
      });

      if (res.status === 409) {
        toast.info("Aadhaar already verified for this party.");
        setStatus("VERIFIED");
        return;
      }

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        toast.error(error ?? "Failed to initiate KYC. Try again.");
        setStatus("FAILED");
        return;
      }

      const { gatewayUrl: url } = await res.json();
      setGatewayUrl(url);
      setStatus("INITIATED");
      toast.success("OTP sent to Aadhaar-linked mobile. Complete verification in the new tab.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/kyc`);
      if (!res.ok) return;
      const { kyc } = await res.json();
      const row = (kyc as { party: string; status: string; maskedAadhaar?: string }[]).find(
        (r) => r.party === party,
      );
      if (row) {
        setStatus(row.status as KycStatus);
        if (row.maskedAadhaar) {
          setMaskedAadhaar(row.maskedAadhaar);
          const last4 = row.maskedAadhaar.slice(-4);
          onVerified?.(row.maskedAadhaar, last4);
        }
        if (row.status === "VERIFIED") {
          toast.success("Aadhaar verified successfully!");
        } else if (row.status === "FAILED") {
          toast.error("KYC verification failed. Please retry.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "VERIFIED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        <span className="text-green-800">
          Aadhaar verified{maskedAadhaar ? ` — ${maskedAadhaar}` : ""}
        </span>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>Verification failed. Please retry.</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={initiateKyc}
          disabled={loading}
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Retry verification
        </Button>
      </div>
    );
  }

  if (status === "INITIATED" && gatewayUrl) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          OTP sent to Aadhaar-linked mobile. Complete verification in the
          opened tab, then click &quot;Check status&quot; below.
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={gatewayUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button type="button" variant="outline" size="sm">
              <ExternalLink className="h-3 w-3" />
              Open verification link
            </Button>
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Fingerprint className="h-3 w-3" />
            )}
            Check status
          </Button>
        </div>
      </div>
    );
  }

  // PENDING — show initiate button
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={initiateKyc}
      disabled={loading}
      className={cn("gap-2", loading && "pointer-events-none")}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Fingerprint className="h-3 w-3" />
      )}
      Verify Aadhaar via OTP
    </Button>
  );
}
