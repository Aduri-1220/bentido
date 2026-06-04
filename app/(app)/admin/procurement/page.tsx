import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { LAUNCH_STATES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProcurementIndexPage() {
  const pending = await prisma.agreement.findMany({
    where: { status: "E_STAMPING" },
    select: { id: true, propertyJson: true },
  });

  const countsByState = new Map<string, number>();
  for (const a of pending) {
    const state = extractState(a.propertyJson);
    if (!state) continue;
    countsByState.set(state, (countsByState.get(state) ?? 0) + 1);
  }
  const total = pending.length;
  const unknown = pending.length -
    LAUNCH_STATES.reduce((sum, s) => sum + (countsByState.get(s.value) ?? 0), 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Stamp paper procurement
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Agreements waiting for stamp paper procurement, grouped by state.
        {total > 0 && (
          <>
            {" "}
            <span className="font-medium text-slate-700">
              {total} pending overall.
            </span>
          </>
        )}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {LAUNCH_STATES.map((s) => {
          const count = countsByState.get(s.value) ?? 0;
          return (
            <Link
              key={s.value}
              href={`/admin/procurement/${s.value}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {s.label}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                  {count}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {count === 1 ? "agreement pending" : "agreements pending"}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>

      {unknown > 0 && (
        <p className="mt-4 text-xs text-amber-700">
          {unknown} pending {unknown === 1 ? "agreement is" : "agreements are"}{" "}
          in a state outside our launch set (legacy data) — not shown above.
        </p>
      )}
    </div>
  );
}

function extractState(propertyJson: string | null | undefined): string | null {
  if (!propertyJson) return null;
  try {
    const obj = JSON.parse(propertyJson) as { state?: string };
    return obj.state ?? null;
  } catch {
    return null;
  }
}
