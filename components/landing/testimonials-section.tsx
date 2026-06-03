"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

/** Add entries here — the row scrolls horizontally for any length. */
const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      "Drafted, e-signed, and had a clean PDF the same evening. No weekday mornings lost chasing counters or print shops.",
    name: "Aakash Verma",
    role: "Landlord, Bengaluru",
  },
  {
    quote:
      "The summary page let us fix notice period and escalation before paying. Felt more in control than a copy-shop template.",
    name: "Megha Iyer",
    role: "Tenant, Mumbai",
  },
  {
    quote:
      "I run several closings a month. The guided flow and e-sign step are easy to repeat — clients actually read the draft.",
    name: "Karthik Reddy",
    role: "Consultant, Hyderabad",
  },
];

export function LandingTestimonialsSection() {
  const showScrollHint = TESTIMONIALS.length > 1;

  return (
    <section
      className="border-t border-slate-200/60 bg-gradient-to-b from-white via-sky-50/20 to-white py-16 sm:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-700 sm:text-xs">
            People first
          </p>
          <h2
            id="testimonials-heading"
            className="mt-3 text-balance text-2xl font-semibold text-stone-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            What early users say
          </h2>
          <p className="mt-3 text-sm text-stone-500 sm:text-base">
            Sample quotes for tone and layout — swap in verified testimonials as
            you collect them.
          </p>
          {showScrollHint ? (
            <p className="mt-2 text-xs text-stone-400 sm:text-sm">
              Scroll sideways to read more
            </p>
          ) : null}
        </div>

        <div className="relative mt-10 sm:mt-12">
          <ul
            className="flex touch-pan-x gap-4 overflow-x-auto overscroll-x-contain pb-2 pt-1 [scrollbar-width:thin] sm:gap-6"
            style={{
              scrollSnapType: "x mandatory",
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.li
                key={`${t.name}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.2) }}
                className="flex w-[min(22rem,calc(100vw-2.5rem))] shrink-0 snap-start snap-always flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-900/5 sm:w-[min(24rem,calc(100%-2rem))] sm:p-7"
              >
                <Quote
                  className="h-8 w-8 text-brand-200"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="mt-6 border-t border-stone-100 pt-5 sm:mt-8 sm:pt-6">
                  <p className="font-semibold text-stone-900">{t.name}</p>
                  <p className="mt-1 text-sm text-stone-500">{t.role}</p>
                </footer>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
