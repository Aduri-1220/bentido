"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

const tiers = [
  {
    name: "Digital",
    price: 199,
    description: "Perfect when both parties are tech-savvy.",
    features: [
      "Structured rental draft",
      "PDF instantly via email",
      "Aadhaar e-sign add-on",
      "State-wise e-stamp",
    ],
    cta: "Start Digital",
    highlighted: false,
  },
  {
    name: "Standard",
    price: 449,
    description: "Most popular — printed copies + e-sign.",
    features: [
      "Everything in Digital",
      "Aadhaar e-sign for 2 parties",
      "1 printed + stamped copy",
      "Standard delivery (4–6 days)",
    ],
    cta: "Choose Standard",
    highlighted: true,
  },
  {
    name: "Premium",
    price: 949,
    description: "When you need it certified and quick.",
    features: [
      "Everything in Standard",
      "Notary attestation",
      "Express delivery (1–2 days)",
      "Up to 3 extra copies",
    ],
    cta: "Go Premium",
    highlighted: false,
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Pricing
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Transparent, all-inclusive pricing
          </h2>
          <p className="mt-3 text-slate-600">
            No hidden fees. Stamp duty is shown separately as a government
            pass-through.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={
                t.highlighted
                  ? "relative rounded-2xl border-2 border-brand-500 bg-gradient-to-b from-brand-50/50 to-white p-8 shadow-xl"
                  : "relative rounded-2xl border bg-white p-8 shadow-sm"
              }
            >
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-brand-800 px-3 py-1 text-xs font-bold text-white shadow">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{t.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">
                  {formatINR(t.price)}
                </span>
                <span className="text-sm text-slate-500">
                  + stamp duty + GST
                </span>
              </div>
              <Button
                asChild
                variant={t.highlighted ? "brand" : "outline"}
                size="lg"
                className="mt-6 w-full"
              >
                <Link href="/sign-up">
                  {t.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
