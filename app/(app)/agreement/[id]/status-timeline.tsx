"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Clock,
  Download,
  FileText,
  Fingerprint,
  Loader2,
  Stamp,
  Truck,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_FLOW } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  DRAFT: FileText,
  PAID: Check,
  E_STAMPING: Stamp,
  E_SIGNING: Fingerprint,
  DELIVERY: Truck,
  COMPLETED: PartyPopper,
} as const;

export function StatusTimeline({
  agreementId,
  currentStatus,
}: {
  agreementId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const statusIndex = STATUS_FLOW.findIndex((s) => s.id === currentStatus);
  const displayIndex =
    statusIndex >= 0 ? statusIndex : STATUS_FLOW.length - 1;

  async function advance() {
    if (statusIndex < 0) return;
    const next = STATUS_FLOW[statusIndex + 1];
    if (!next) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.id }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status updated: ${next.label}`);
      router.refresh();
    } catch {
      toast.error("Could not update status");
    } finally {
      setLoading(false);
    }
  }

  const nextStage =
    statusIndex >= 0 ? STATUS_FLOW[statusIndex + 1] : undefined;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Order progress</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(`/api/agreements/${agreementId}/pdf`, "_blank")
          }
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <ol className="relative mt-6 space-y-1">
        {STATUS_FLOW.map((s, i) => {
          const Icon =
            ICONS[s.id as keyof typeof ICONS] ?? ICONS.DRAFT;
          const isDone = i < displayIndex;
          const isCurrent = i === displayIndex;
          const isLast = i === STATUS_FLOW.length - 1;

          return (
            <li key={s.id} className="relative flex gap-4">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[19px] top-12 h-[calc(100%-1rem)] w-0.5",
                    isDone ? "bg-brand-500" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              )}
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.05 : 1 }}
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                  isDone
                    ? "border-brand-500 bg-brand-500 text-white"
                    : isCurrent
                      ? "border-brand-500 bg-white text-brand-700"
                      : "border-slate-200 bg-white text-slate-400",
                )}
              >
                {isDone ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </motion.div>
              <div className="pb-8">
                <div
                  className={cn(
                    "font-semibold",
                    isCurrent
                      ? "text-slate-900"
                      : isDone
                        ? "text-slate-700"
                        : "text-slate-400",
                  )}
                >
                  {s.label}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {isDone ? "Completed" : isCurrent ? "In progress" : "Up next"}
                </div>
                {isCurrent && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Estimated time: a few minutes
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Demo control</div>
          <p className="mt-1 text-xs text-slate-600">
            In production this advances automatically as stamping, e-signing
            and courier callbacks come in. For now you can step through the
            flow manually.
          </p>
          <Button
            onClick={advance}
            disabled={!nextStage || loading}
            variant="brand"
            size="sm"
            className="mt-3"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {nextStage
              ? `Advance to "${nextStage.label}"`
              : "Workflow completed"}
          </Button>
        </div>
      )}
    </section>
  );
}
