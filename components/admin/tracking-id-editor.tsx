"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackingIdEditor({
  agreementId,
  initial,
}: {
  agreementId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = (value.trim() || null) !== (initial ?? null);

  async function save(next: string | null) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/agreements/${agreementId}/tracking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingId: next }),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not save tracking ID");
      }
      toast.success(next ? "Tracking ID saved" : "Tracking ID cleared");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. SR123456789"
        maxLength={64}
        disabled={busy}
        className="w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
      />
      <Button
        size="sm"
        variant="brand"
        disabled={!dirty || busy}
        onClick={() => save(value.trim() || null)}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        Save
      </Button>
      {initial ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setValue("");
            void save(null);
          }}
          title="Clear tracking ID"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
