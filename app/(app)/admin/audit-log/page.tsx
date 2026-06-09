import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const pageParam =
    typeof searchParams?.page === "string" ? searchParams.page : "1";
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const filterAction =
    typeof searchParams?.action === "string" ? searchParams.action : undefined;
  const filterAgreementId =
    typeof searchParams?.agreementId === "string"
      ? searchParams.agreementId
      : undefined;

  const where = {
    ...(filterAction ? { action: filterAction } : {}),
    ...(filterAgreementId ? { agreementId: filterAgreementId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        actorType: true,
        actorId: true,
        action: true,
        agreementId: true,
        ip: true,
        correlationId: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { page: String(page), action: filterAction, agreementId: filterAgreementId, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/admin/audit-log?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Audit log{" "}
          <span className="text-sm font-normal text-slate-500">
            ({total.toLocaleString()} entries)
          </span>
        </h2>
        <form method="GET" action="/admin/audit-log" className="flex flex-wrap gap-2">
          <input
            name="action"
            defaultValue={filterAction ?? ""}
            placeholder="Filter by action…"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            name="agreementId"
            defaultValue={filterAgreementId ?? ""}
            placeholder="Agreement ID…"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="rounded bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            Filter
          </button>
          {(filterAction || filterAgreementId) && (
            <Link
              href="/admin/audit-log"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Actor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Agreement</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No audit log entries found.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-4 py-2.5">
                  <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {log.actorType}
                  </span>
                  <span className="font-mono text-xs text-slate-700">{log.actorId}</span>
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={buildHref({ action: log.action, page: "1" })}
                    className="font-mono text-xs text-brand-700 hover:underline"
                  >
                    {log.action}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                  {log.agreementId ? (
                    <Link
                      href={`/admin/agreements/${log.agreementId}`}
                      className="hover:text-brand-700 hover:underline"
                    >
                      {log.agreementId.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                  {log.ip ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
