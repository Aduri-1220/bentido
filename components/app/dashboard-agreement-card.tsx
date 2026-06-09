"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";

export function DashboardAgreementCard({
  id,
  status,
  title,
  tenantName,
  updatedLabel,
  nextHref,
}: {
  id: string;
  status: string;
  title: string;
  tenantName: string;
  updatedLabel: string;
  nextHref: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/agreements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Could not delete");
        return;
      }
      toast.success("Draft deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="group relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={status} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{updatedLabel}</span>
          {status === "DRAFT" ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-500 hover:border-red-200 hover:text-red-600"
              disabled={deleting}
              aria-label="Delete draft"
              onClick={(e) => void onDelete(e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <Link href={nextHref} className="mt-4 block">
        <div className="line-clamp-1 font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-600">Tenant: {tenantName}</div>
        <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
          {status === "DRAFT" ? "Continue draft" : "View details"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </div>
  );
}
