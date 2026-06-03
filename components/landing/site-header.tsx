"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileSignature, Briefcase, Shield } from "lucide-react";

export function SiteHeader() {
  const { status, data: session } = useSession();
  const isAuthed = status === "authenticated";
  const isAdmin = session?.user?.isAdmin === true;
  const isWorker = session?.user?.isWorker === true;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-slate-800"
        >
          <FileSignature className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold tracking-wide">WeBroker</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
          <a href="#for-you" className="transition hover:text-slate-900">
            For you
          </a>
          <a href="#features" className="transition hover:text-slate-900">
            Benefits
          </a>
          <a href="#how-it-works" className="transition hover:text-slate-900">
            How it works
          </a>
          <a href="#faq" className="transition hover:text-slate-900">
            FAQ
          </a>
          <a href="#get-started" className="transition hover:text-slate-900">
            Get started
          </a>
        </nav>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {isAuthed ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50/90 px-2.5 py-1.5 text-[10px] font-medium text-amber-950 transition hover:bg-amber-100 sm:gap-1.5 sm:px-3 sm:text-xs"
                  title="Staff dashboard"
                >
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Admin
                </Link>
              ) : null}
              {isWorker ? (
                <Link
                  href="/worker"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50/90 px-2.5 py-1.5 text-[10px] font-medium text-amber-950 transition hover:bg-amber-100 sm:gap-1.5 sm:px-3 sm:text-xs"
                  title="Worker dashboard"
                >
                  <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Worker
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-brand-700 sm:px-4 sm:text-xs"
              >
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex shrink-0 rounded-full border border-stone-300 bg-white px-2.5 py-1.5 text-[10px] font-medium text-stone-700 transition hover:bg-stone-50 sm:px-4 sm:text-xs"
              >
                Sign in
              </Link>
              <Link
                href="/sign-in?callbackUrl=/admin"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[10px] font-medium text-stone-700 transition hover:bg-stone-100 sm:gap-1.5 sm:px-3 sm:text-xs"
                title="Admin allowlist email — opens admin after login"
              >
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Admin
              </Link>
              <Link
                href="/sign-in?callbackUrl=/worker"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[10px] font-medium text-stone-700 transition hover:bg-stone-100 sm:gap-1.5 sm:px-3 sm:text-xs"
                title="Worker allowlist email — opens worker dashboard after login"
              >
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Worker
              </Link>
              <Link
                href="/sign-up"
                className="shrink-0 rounded-full bg-brand-600 px-2.5 py-1.5 text-[10px] font-medium text-white transition hover:bg-brand-700 sm:px-4 sm:text-xs"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
