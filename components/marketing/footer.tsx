import Link from "next/link";
import { FileSignature } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
                <FileSignature className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">
                We<span className="text-brand-600">Broker</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-600">
              Rental agreements drafted, stamped, signed and delivered — all
              from one polished flow.
            </p>
          </div>
          <FooterCol
            title="Product"
            items={[
              { label: "How it works", href: "/#how-it-works" },
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/#pricing" },
              { label: "FAQ", href: "/#faq" },
            ]}
          />
          <FooterCol
            title="Company"
            items={[
              { label: "About", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Press", href: "#" },
              { label: "Contact", href: "#" },
            ]}
          />
          <FooterCol
            title="Legal"
            items={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Refund Policy", href: "#" },
              { label: "Security", href: "#" },
            ]}
          />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-slate-500 md:flex-row">
          <span>
            © {new Date().getFullYear()} WeBroker Technologies Pvt. Ltd. All
            rights reserved.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/sign-in?callbackUrl=/admin"
              className="hover:text-brand-700 hover:underline"
            >
              Admin sign in
            </Link>
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
            <Link
              href="/sign-in?callbackUrl=/worker"
              className="hover:text-brand-700 hover:underline"
            >
              Worker sign in
            </Link>
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
            <span>Made with care in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              href={i.href}
              className="text-sm text-slate-600 transition-colors hover:text-brand-700"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
