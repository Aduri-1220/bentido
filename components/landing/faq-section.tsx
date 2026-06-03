"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const FAQ_ITEMS = [
  {
    q: "Is an online rental agreement valid in India?",
    a: "Yes. When stamp duty rules are followed (including e-stamp where applicable) and parties sign with a recognized e-sign method, residential rental deeds are widely used for KYC, records, and peace of mind. Rules vary by state — we surface what applies to your scenario in the flow.",
  },
  {
    q: "Do I need to visit a government office?",
    a: "Many residential leases are completed fully online: draft, e-stamp where supported, e-sign, and a PDF you can keep or print. Longer leases or specific use cases may need extra steps depending on state law — we’ll flag that when relevant.",
  },
  {
    q: "How long does the process take?",
    a: "Most people finish details and review in under an hour if both sides are available. E-sign is minutes; digital delivery is immediate. Printed or courier options depend on the service level you choose.",
  },
  {
    q: "How is stamp duty calculated?",
    a: "Amounts depend on the state, rent, and term you declare. We calculate and show stamp duty as a clear pass-through on your order summary before you pay, so there’s no guesswork at the last minute.",
  },
  {
    q: "Can we change rent, deposit, or notice after reviewing?",
    a: "Yes. You can jump back into the wizard from the summary until you’re ready to proceed to add-ons and payment. The agreement should match what both sides actually agreed.",
  },
  {
    q: "Is my identity data safe?",
    a: "KYC and e-sign run over licensed providers and encrypted channels. We only retain what’s needed to operate the service and generate your documents — see our privacy policy for retention details.",
  },
  {
    q: "When am I charged?",
    a: "You can review your full draft before committing. Service fees are collected when you proceed to payment for stamping, signatures, and any delivery options you select.",
  },
  {
    q: "Who is WeBroker for?",
    a: "Owners, tenants, and consultants who want a single neutral flow for Indian residential leases — especially when you’ve already agreed on rent and want paperwork that keeps up.",
  },
] as const;

const FAQ_INITIAL_COUNT = 4;

function FaqAccordionRow({
  item,
  index,
}: {
  item: (typeof FAQ_ITEMS)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.18) }}
      className="py-3 sm:py-4"
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
          <span
            className="text-pretty pr-2"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {item.q}
          </span>
          <span className="mt-0.5 shrink-0 text-brand-600 transition group-open:rotate-45">
            +
          </span>
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:mt-3 sm:text-[15px]">
          {item.a}
        </p>
      </details>
    </motion.div>
  );
}

export function LandingFaqSection() {
  const [showAllFaq, setShowAllFaq] = useState(false);
  const total = FAQ_ITEMS.length;
  const hasMore = total > FAQ_INITIAL_COUNT;
  const itemsToShow = showAllFaq
    ? FAQ_ITEMS
    : FAQ_ITEMS.slice(0, FAQ_INITIAL_COUNT);

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-slate-200/80 bg-white py-16 sm:py-24"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-700 sm:text-xs">
            FAQ
          </p>
          <h2
            className="mt-3 text-balance text-2xl font-semibold text-stone-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Answers before you start
          </h2>
          <p className="mt-3 text-sm text-stone-600 sm:mt-4 sm:text-base">
            Plain language so you spend less time searching and more time
            moving in.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl divide-y divide-stone-200 border-t border-stone-200 sm:mt-10">
          {itemsToShow.map((item, i) => (
            <FaqAccordionRow key={item.q} item={item} index={i} />
          ))}
        </div>

        {hasMore ? (
          <div className="mx-auto mt-6 flex max-w-3xl justify-center sm:mt-8">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-stone-700"
              onClick={() => setShowAllFaq((v) => !v)}
              aria-expanded={showAllFaq}
            >
              {showAllFaq
                ? "Show fewer questions"
                : `Show all ${total} questions`}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
