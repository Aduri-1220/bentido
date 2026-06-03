import Link from "next/link";
import { ArrowRight, FileUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { parsePhoneSearchQuery, digitsOnly } from "@/lib/phone";
import { staffAgreementsMobileWhere } from "@/lib/staff-agreement-phone-filter";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { StaffAgreementsMobileFilter } from "@/components/staff/staff-agreements-mobile-filter";

export const dynamic = "force-dynamic";

export default async function AdminAgreementsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const rawPhone =
    typeof searchParams?.phone === "string"
      ? searchParams.phone
      : searchParams?.phone?.[0];
  const digitsQuery = parsePhoneSearchQuery(rawPhone);
  const mobileWhere = staffAgreementsMobileWhere(digitsQuery);

  const agreements = await prisma.agreement.findMany({
    where: mobileWhere,
    orderBy: { updatedAt: "desc" },
    take: 250,
    select: {
      id: true,
      status: true,
      wizardEntry: true,
      updatedAt: true,
      sourceDraftOriginalName: true,
      propertyJson: true,
      user: {
        select: { id: true, email: true, name: true, phone: true },
      },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Agreements ({agreements.length})
        {digitsQuery ? (
          <span className="text-sm font-normal text-slate-500">
            {" "}
            — mobile{" "}
            {digitsQuery.length === 10 ? "exact" : "partial"} match
          </span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Showing up to 250 most recently updated
        {digitsQuery ? ` (${digitsQuery} · customer id or saved mobile)` : ""}.
      </p>

      <StaffAgreementsMobileFilter
        actionPath="/admin"
        defaultDigits={digitsOnly(rawPhone)}
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {agreements.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-600">
              {digitsQuery
                ? "No agreements match this mobile filter."
                : "No agreements in the database yet."}
            </p>
          ) : (
            agreements.map((a) => {
              const property = safeJson<{
                city?: string;
                locality?: string;
              }>(a.propertyJson);
              const title =
                property?.locality && property?.city
                  ? `${property.locality}, ${property.city}`
                  : (property?.city ?? property?.locality ?? "—");
              return (
                <Link
                  key={a.id}
                  href={`/admin/agreements/${a.id}`}
                  className="flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 md:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">
                        {a.id.slice(0, 8)}…
                      </span>
                      <StatusBadge status={a.status} />
                      {a.sourceDraftOriginalName ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-brand-200 bg-brand-50 text-brand-800"
                        >
                          <FileUp className="h-3 w-3" />
                          Draft file
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate font-medium text-slate-900">
                      {title}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {a.user.name ? `${a.user.name} · ` : ""}
                      {a.user.email}
                      {a.user.phone ? (
                        <>
                          {" "}
                          ·{" "}
                          <span className="font-mono text-slate-700">
                            +91 {a.user.phone}
                          </span>
                        </>
                      ) : (
                        <>
                          {" "}
                          · <span className="text-slate-400">mobile n/a</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 md:min-w-[9rem]">
                    <div>{formatDate(a.updatedAt)}</div>
                    {a.wizardEntry ? (
                      <div className="mt-0.5 font-mono">{a.wizardEntry}</div>
                    ) : null}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function safeJson<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
