"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkProcuredButton({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mark() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/agreements/${agreementId}/stamp-procured`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Could not mark procured");
      }
      toast.success("Marked procured — advanced to e-signing");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark procured");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={mark} disabled={loading} variant="brand" size="sm">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      Mark procured
    </Button>
  );
}
