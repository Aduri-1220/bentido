import type { ReactNode } from "react";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { SiteFooter } from "@/components/landing/site-footer";

/**
 * Minimal chrome for legal pages: brand header + readable content + site footer.
 */
export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50/40">
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800"
          >
            <FileSignature className="h-5 w-5 text-brand-600" />
            WeBroker
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-700 sm:text-[15px] sm:leading-7">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
