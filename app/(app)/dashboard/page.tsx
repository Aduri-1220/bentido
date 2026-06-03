import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Briefcase, FileText, ScrollText, Shield } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isWorkerEmail } from "@/lib/worker";
import { formatDate } from "@/lib/utils";
import { NewAgreementButton } from "@/components/app/new-agreement-button";
import { DashboardAgreementCard } from "@/components/app/dashboard-agreement-card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const dbProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, role: true, state: true },
  });
  const emailForStaff = dbProfile?.email ?? user.email;
  const showAdminPortal = isAdminEmail(emailForStaff);
  const showWorkerPortal = isWorkerEmail(emailForStaff);
  if (!isAdminEmail(emailForStaff) && !isWorkerEmail(emailForStaff)) {
    if (!dbProfile?.role || !dbProfile?.state) redirect("/onboarding");
  }

  const agreements = await prisma.agreement.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      propertyJson: true,
      tenantJson: true,
      updatedAt: true,
    },
  });

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-slate-600">
            Manage all your rental agreements in one place.
          </p>
        </div>
        <NewAgreementButton />
      </div>

      {showAdminPortal || showWorkerPortal ? (
        <DashboardStaffAccountLinks
          showAdmin={showAdminPortal}
          showWorker={showWorkerPortal}
        />
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total agreements"
          value={agreements.length}
          icon={FileText}
        />
        <StatCard
          label="In progress"
          value={agreements.filter((a) => a.status !== "COMPLETED").length}
          icon={ScrollText}
        />
        <StatCard
          label="Completed"
          value={agreements.filter((a) => a.status === "COMPLETED").length}
          icon={ScrollText}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">
          Your agreements
        </h2>

        {agreements.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agreements.map((a) => {
              const property = safeJson<{
                city?: string;
                locality?: string;
                addressLine1?: string;
              }>(a.propertyJson);
              const tenant = safeJson<{ fullName?: string }>(a.tenantJson);
              const title =
                property?.locality && property?.city
                  ? `${property.locality}, ${property.city}`
                  : property?.addressLine1 || "Untitled agreement";
              const nextHref =
                a.status === "DRAFT"
                  ? `/agreement/${a.id}/preview`
                  : `/agreement/${a.id}`;
              return (
                <DashboardAgreementCard
                  key={a.id}
                  id={a.id}
                  status={a.status}
                  title={title}
                  tenantName={tenant?.fullName || "—"}
                  updatedLabel={formatDate(a.updatedAt)}
                  nextHref={nextHref}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardStaffAccountLinks({
  showAdmin,
  showWorker,
}: {
  showAdmin: boolean;
  showWorker: boolean;
}) {
  return (
    <section
      className="mt-8 rounded-xl border border-brand-200 bg-brand-50/70 p-5 shadow-sm"
      aria-labelledby="staff-account-heading"
    >
      <h2
        id="staff-account-heading"
        className="text-xs font-semibold uppercase tracking-wide text-brand-800"
      >
        Account · Staff portal
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Open the same dashboards as the top navigation when your email is on the
        admin or worker allowlist.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showAdmin ? (
          <PortalLink
            href="/admin"
            label="Admin dashboard"
            icon={Shield}
          />
        ) : null}
        {showWorker ? (
          <PortalLink
            href="/worker"
            label="Worker dashboard"
            icon={Briefcase}
          />
        ) : null}
      </div>
    </section>
  );
}

function PortalLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Shield;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-between gap-4 rounded-lg border border-brand-200/90 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50/90 sm:min-w-[14rem]"
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-700" aria-hidden />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed bg-white py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <FileText className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        No agreements yet
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Get your first rental agreement drafted in minutes.
      </p>
      <div className="mt-6">
        <NewAgreementButton />
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
