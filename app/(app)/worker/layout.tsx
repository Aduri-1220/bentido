import Link from "next/link";
import { requireWorker } from "@/lib/session";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorker();
  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Staff
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Worker
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Progress agreements, customer uploads, and signed PDFs. Payment
            amounts are hidden; successful checkout appears as Paid only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/worker"
            className="font-medium text-slate-600 hover:text-brand-700"
          >
            All agreements
          </Link>
          <Link
            href="/dashboard"
            className="font-medium text-brand-700 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
