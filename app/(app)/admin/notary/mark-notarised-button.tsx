"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkNotarisedButton({ addOnId }: { addOnId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mark() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/addons/${addOnId}/notary-completed`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Could not mark notarised");
      }
      toast.success("Marked notarised");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark notarised");
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
      Mark notarised
    </Button>
  );
}
