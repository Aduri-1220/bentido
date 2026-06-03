"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, FileSignature, Menu, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md"
          >
            <FileSignature className="h-5 w-5" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight">
            We<span className="text-brand-600">Broker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="ghost" className="text-slate-600">
            <Link
              href="/sign-in?callbackUrl=/admin"
              title="Admin allowlist email — opens admin dashboard after login"
              className="inline-flex items-center gap-1.5"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-slate-600">
            <Link
              href="/sign-in?callbackUrl=/worker"
              title="Worker allowlist email — opens worker dashboard after login"
              className="inline-flex items-center gap-1.5"
            >
              <Briefcase className="h-4 w-4" />
              Worker
            </Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn("border-t bg-white md:hidden", open ? "block" : "hidden")}
      >
        <div className="container flex flex-col gap-1 py-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="brand" onClick={() => setOpen(false)}>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
          <Link
            href="/sign-in?callbackUrl=/admin"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-800"
          >
            <Shield className="h-4 w-4" />
            Admin sign in
          </Link>
          <Link
            href="/sign-in?callbackUrl=/worker"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-800"
          >
            <Briefcase className="h-4 w-4" />
            Worker sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
