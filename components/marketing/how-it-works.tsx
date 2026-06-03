"use client";
import { motion } from "framer-motion";
import { ClipboardList, FileSearch, CreditCard, Truck } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Fill in the details",
    description:
      "Property, owner, tenant, rent and clauses — guided by a friendly 6-step wizard.",
  },
  {
    icon: FileSearch,
    title: "Review your draft",
    description:
      "Preview a structured rental agreement on one page. Edit any section inline.",
  },
  {
    icon: CreditCard,
    title: "Add-ons & payment",
    description:
      "Pick e-sign, notary, delivery and extra copies. Pay once, all-inclusive.",
  },
  {
    icon: Truck,
    title: "Sign & receive",
    description:
      "Aadhaar OTP e-sign in seconds. Get the PDF instantly and stamped copies at home.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            From idea to signed agreement in four steps
          </h2>
          <p className="mt-3 text-slate-600">
            No printing. No notary visits. No back-and-forth.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute -top-3 left-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 px-3 py-0.5 text-xs font-bold text-white shadow">
                Step {i + 1}
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
