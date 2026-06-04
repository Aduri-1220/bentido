"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CounterpartyActions({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "changes" | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [comment, setComment] = useState("");

  async function approve() {
    setBusy("approve");
    try {
      const res = await fetch(`/api/counterparty/${token}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not approve");
      }
      toast.success("Approved — the landlord can now proceed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not approve");
    } finally {
      setBusy(null);
    }
  }

  async function requestChanges() {
    if (comment.trim().length < 5) {
      toast.error("Please describe the changes (min 5 characters)");
      return;
    }
    setBusy("changes");
    try {
      const res = await fetch(`/api/counterparty/${token}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not submit");
      }
      toast.success("Sent to the landlord");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Your response</h2>
      <p className="mt-1 text-sm text-slate-600">
        Approve to let the landlord proceed to payment and Aadhaar e-sign, or
        request changes if anything needs to be revised.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={approve}
          disabled={busy !== null}
          variant="brand"
          size="sm"
        >
          {busy === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </Button>
        <Button
          onClick={() => setShowChanges((v) => !v)}
          disabled={busy !== null}
          variant="outline"
          size="sm"
        >
          <MessageSquare className="h-4 w-4" />
          Request changes
        </Button>
      </div>

      {showChanges ? (
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            What needs to change?
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. The rent amount should be ₹25,000, not ₹30,000. Please update clause 4."
            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="flex justify-end">
            <Button
              onClick={requestChanges}
              disabled={busy !== null}
              variant="brand"
              size="sm"
            >
              {busy === "changes" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Send to landlord
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
