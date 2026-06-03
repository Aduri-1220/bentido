import Link from "next/link";
import {
  FileSignature,
  ShieldCheck,
  Stamp,
  Truck,
  Fingerprint,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-dot opacity-10" />
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-700 shadow">
            <FileSignature className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">WeBroker</span>
        </Link>

        <div className="relative">
          <h1 className="text-balance text-4xl font-bold leading-tight">
            India&rsquo;s smartest way to rent a home.
          </h1>
          <p className="mt-4 max-w-md text-white/85">
            Draft, e-stamp, e-sign and deliver your rental agreement without
            stepping out.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, label: "Structured templates" },
              { icon: Stamp, label: "State e-stamping" },
              { icon: Fingerprint, label: "Aadhaar e-sign" },
              { icon: Truck, label: "Doorstep delivery" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 backdrop-blur"
              >
                <b.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/70">
          &ldquo;Closed three leases this month without printing a single
          page.&rdquo; — Karthik R., broker
        </p>
      </div>

      <div className="flex items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
