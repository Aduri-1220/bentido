import Link from "next/link";
import { prisma } from "@/lib/db";
import { LAUNCH_STATES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { MarkNotarisedButton } from "./mark-notarised-button";

export const dynamic = "force-dynamic";

/**
 * Notary queue: agreements that opted into the NOTARY add-on but the
 * off-platform notary visit hasn't been recorded yet. Independent of the
 * main DRAFT → COMPLETED status flow — notary is opt-in per add-on.
 */
export default async function NotaryQueuePage() {
  const pending = await prisma.addOn.findMany({
    where: { kind: "NOTARY", completedAt: null },
    orderBy: { agreement: { updatedAt: "asc" } },
    select: {
      id: true,
      agreementId: true,
      qty: true,
      agreement: {
        select: {
          id: true,
          status: true,
          propertyJson: true,
          updatedAt: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Notary queue ({pending.length})
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Agreements with the notary add-on selected. Mark notarised once the
        local notary has signed the executed copy.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {pending.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            No pending notary jobs.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waiting since</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map((row) => {
                const stateSlug = extractState(row.agreement.propertyJson);
                const stateLabel =
                  LAUNCH_STATES.find((s) => s.value === stateSlug)?.label ??
                  stateSlug ??
                  "—";
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/agreements/${row.agreementId}`}
                        className="font-mono text-xs text-brand-700 hover:underline"
                      >
                        {row.agreementId.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900">
                        {row.agreement.user.name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {row.agreement.user.phone
                          ? `+91 ${row.agreement.user.phone}`
                          : row.agreement.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">{stateLabel}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.agreement.status}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(row.agreement.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MarkNotarisedButton addOnId={row.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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
