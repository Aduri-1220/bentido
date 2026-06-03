import Link from "next/link";
import { FileSignature } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-sky-100/90 bg-gradient-to-b from-white to-sky-50/30 py-8 sm:py-10">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2 text-stone-700">
          <FileSignature className="h-4 w-4" />
          <span className="text-sm font-medium">WeBroker</span>
        </div>
        <p className="text-center text-[11px] text-stone-500 sm:text-xs">
          © {new Date().getFullYear()} WeBroker Mediation Pvt. Ltd. · Rental
          agreements with e-stamp &amp; e-sign.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-stone-500 sm:gap-4 sm:text-xs">
          <Link href="/privacy" className="hover:text-stone-800">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-stone-800">
            Cookies
          </Link>
          <a href="#" className="hover:text-stone-800">
            Terms
          </a>
          <a
            href="mailto:privacy@webroker.in"
            className="hover:text-stone-800"
          >
            Contact
          </a>
          <Link
            href="/sign-in?callbackUrl=/admin"
            className="hover:text-stone-800"
          >
            Admin sign in
          </Link>
          <Link
            href="/sign-in?callbackUrl=/worker"
            className="hover:text-stone-800"
          >
            Worker sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
