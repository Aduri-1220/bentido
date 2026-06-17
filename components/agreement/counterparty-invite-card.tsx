"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageSquareWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "NONE" | "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export function CounterpartyInviteCard({
  agreementId,
  status,
  tenantEmail,
  inviteSentAt,
  changesComment,
  selfApproveAllowed = false,
}: {
  agreementId: string;
  status: Status;
  tenantEmail: string | null;
  inviteSentAt: string | null;
  changesComment: string | null;
  selfApproveAllowed?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState(false);

  async function approveAsTenant() {
    setApproving(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/approve-as-tenant`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not approve");
      }
      toast.success("Approved as tenant (demo)");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not approve");
    } finally {
      setApproving(false);
    }
  }

  async function send() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/invite`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not send invite");
      }
      toast.success(
        tenantEmail ? `Review link sent to ${tenantEmail}` : "Review link sent",
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send invite");
    } finally {
      setBusy(false);
    }
  }

  const buttonLabel =
    status === "NONE"
      ? "Send for tenant review"
      : status === "CHANGES_REQUESTED"
        ? "Send fresh invite"
        : "Re-send invite";

  return (
    <div className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Tenant review
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            We'll email a one-time link to {tenantEmail ?? "the tenant"}. They
            can approve the draft or request changes before you proceed to
            payment.
          </p>
        </div>
        <Badge status={status} />
      </div>

      {status === "CHANGES_REQUESTED" && changesComment ? (
        <blockquote className="mt-3 rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="block text-xs font-semibold uppercase tracking-wide text-amber-700">
            Tenant's note
          </span>
          {changesComment}
        </blockquote>
      ) : null}

      {inviteSentAt ? (
        <p className="mt-3 text-xs text-slate-500">
          Last sent {new Date(inviteSentAt).toLocaleString()}
        </p>
      ) : null}

      <div className="mt-4">
        <Button
          onClick={send}
          disabled={busy || !tenantEmail}
          variant={status === "APPROVED" ? "outline" : "brand"}
          size="sm"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {buttonLabel}
        </Button>
        {!tenantEmail ? (
          <span className="ml-3 text-xs text-amber-700">
            Add tenant email in the wizard first.
          </span>
        ) : null}
        {selfApproveAllowed && status !== "APPROVED" ? (
          <Button
            onClick={approveAsTenant}
            disabled={approving}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve as tenant (demo)
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Badge({ status }: { status: Status }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }
  if (status === "CHANGES_REQUESTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
        <MessageSquareWarning className="h-3.5 w-3.5" />
        Changes requested
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
        <Clock className="h-3.5 w-3.5" />
        Waiting on tenant
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      Not sent
    </span>
  );
}
