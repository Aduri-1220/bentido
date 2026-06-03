"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  FileSignature,
  Gavel,
  FileText,
  Stamp,
  type LucideIcon,
} from "lucide-react";
import { LandingAddOnsStrip } from "@/components/landing/add-ons-strip";

const FEATURES: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: BadgeCheck,
    title: "You both verify identity first",
    body: "Aadhaar + PAN e-KYC for owner and tenant before anything is locked — so you are always dealing with the real counterparty.",
  },
  {
    icon: FileSignature,
    title: "Fill and sign without the runaround",
    body: "A smart Leave & Licence draft with standard clauses, ready for Aadhaar e-Sign or DSC — most people finish in one sitting.",
  },
  {
    icon: FileText,
    title: "Deposit and rent, documented the same way",
    body: "Security deposit, rent and handover terms live in one agreement — so you share one version of the deal. How you transfer money stays between you; we focus on the paperwork.",
  },
  {
    icon: Gavel,
    title: "Language you can rely on",
    body: "Tenure, notice, indemnity, and add-ons follow widely used residential patterns so the deed reads clearly if you ever need it as proof.",
  },
  {
    icon: Stamp,
    title: "Stamp duty, surfaced clearly",
    body: "We attach the correct state e-stamp where online purchase is supported and show duties as a transparent line item — no last-minute surprises.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-white py-14 sm:py-20"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-700 sm:text-xs">
            What you get
          </p>
          <h2
            className="mt-3 text-balance text-2xl font-semibold text-stone-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Clarity for you, not walls of fine print.
          </h2>
          <p className="mt-3 text-sm text-stone-600 sm:mt-4 sm:text-base">
            We are not a property listing site — we are the neutral layer for
            drafting, signing, and e-stamp so your rental story stays
            straightforward.
          </p>
        </div>

        <LandingAddOnsStrip />

        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-sky-900/5 transition hover:-translate-y-0.5 hover:border-sky-200/80 hover:shadow-md sm:p-6"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 sm:text-base">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600 sm:text-sm">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
