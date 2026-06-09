"use client";

import { motion } from "framer-motion";
import { Check, KeyRound, House } from "lucide-react";

const FOR_OWNERS = [
  "Know exactly who is moving in — verified ID before the draft is shared.",
  "Security deposit held safely until handover is confirmed.",
  "A defensible Leave & Licence you can show to banks or future tenants.",
];

const FOR_TENANTS = [
  "See rent, deposit and terms in plain language — before you pay.",
  "E-sign from your phone; no chasing brokers for paperwork.",
  "Walk away with a stamped, filed agreement you can trust.",
];

export function ForYouSection() {
  return (
    <section
      id="for-you"
      className="relative border-y border-sky-100/90 bg-white py-14 sm:py-20"
      aria-labelledby="for-you-heading"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-700 sm:text-xs">
            Built for both sides
          </p>
          <h2
            id="for-you-heading"
            className="mt-3 text-balance text-2xl font-semibold text-stone-900 sm:text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Renting should feel fair — for you, not just for the process.
          </h2>
          <p className="mt-3 text-sm text-stone-600 sm:mt-4 sm:text-base">
            bentido sits in the middle so owners and tenants get the same
            clarity, the same protections, and one neutral place to finish the
            deal.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 md:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6 shadow-sm sm:p-8"
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-100/60 blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
                <House className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900 sm:text-xl">
                  If you&apos;re the owner
                </h3>
                <p className="text-sm text-stone-600">
                  Less back-and-forth. More certainty.
                </p>
              </div>
            </div>
            <ul className="relative mt-6 space-y-3.5">
              {FOR_OWNERS.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-[13px] leading-relaxed text-stone-700 sm:text-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-brand-50/40 p-6 shadow-sm sm:p-8"
          >
            <div
              className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-violet-200/40 blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
                <KeyRound className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900 sm:text-xl">
                  If you&apos;re moving in
                </h3>
                <p className="text-sm text-stone-600">
                  No guesswork on money or obligations.
                </p>
              </div>
            </div>
            <ul className="relative mt-6 space-y-3.5">
              {FOR_TENANTS.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-[13px] leading-relaxed text-stone-700 sm:text-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
