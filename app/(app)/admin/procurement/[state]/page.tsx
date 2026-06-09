import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { LAUNCH_STATE_VALUES, LAUNCH_STATES } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { MarkProcuredButton } from "./mark-procured-button";

export const dynamic = "force-dynamic";

export default async function ProcurementByStatePage({
  params,
}: {
  params: { state: string };
}) {
  if (!(LAUNCH_STATE_VALUES as readonly string[]).includes(params.state)) {
    notFound();
  }
  const stateLabel =
    LAUNCH_STATES.find((s) => s.value === params.state)?.label ?? params.state;

  // Fetch all E_STAMPING agreements then filter by JSON state — cleaner with
  // raw SQL but acceptable at expected volume.
  const candidates = await prisma.agreement.findMany({
    where: { status: "E_STAMPING" },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      stampValue: true,
      propertyJson: true,
      updatedAt: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  const rows = candidates.filter(
    (a) => extractState(a.propertyJson) === params.state,
  );

  return (
    <div>
      <Link
        href="/admin/procurement"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        All states
      </Link>

      <h2 className="mt-3 text-lg font-semibold text-slate-900">
        {stateLabel} — stamp paper queue ({rows.length})
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Procure these stamp papers from your {stateLabel} vendor. Mark each one
        procured once the paper is in hand — that advances the agreement to
        e-signing.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            Nothing pending in {stateLabel}.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Denomination</th>
                <th className="px-4 py-3">Waiting since</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/agreements/${a.id}`}
                      className="font-mono text-xs text-brand-700 hover:underline"
                    >
                      {a.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{a.user.name ?? "—"}</div>
                    <div className="text-xs text-slate-500">
                      {a.user.phone ? `+91 ${a.user.phone}` : a.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {a.stampValue ? formatINR(a.stampValue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(a.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MarkProcuredButton agreementId={a.id} />
                  </td>
                </tr>
              ))}
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
