"use client";
import { motion } from "framer-motion";
import {
  Scale,
  Stamp,
  Fingerprint,
  Truck,
  FileCheck,
  Copy,
  Clock,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Structured templates",
    description:
      "Clauses tuned for everyday residential leases — clear tenure, rent, deposit, and notice language for your state context.",
  },
  {
    icon: Stamp,
    title: "State-specific e-stamping",
    description:
      "Pay the correct stamp duty automatically — no running around for stamp paper.",
  },
  {
    icon: Fingerprint,
    title: "Aadhaar OTP e-sign",
    description:
      "Both parties sign in seconds with Aadhaar — legally enforceable under IT Act, 2000.",
  },
  {
    icon: FileCheck,
    title: "Notary attestation",
    description:
      "Need a notary stamp? Add it as an optional service — we handle it end to end.",
  },
  {
    icon: Truck,
    title: "Doorstep delivery",
    description:
      "Get signed, stamped hard copies couriered to you in 1–6 working days.",
  },
  {
    icon: Copy,
    title: "Multiple copies",
    description:
      "Order extra stamped originals for landlords, banks or police verification.",
  },
  {
    icon: Clock,
    title: "Ready in minutes",
    description:
      "A guided flow replaces endless back-and-forth — most people finish the same day when both parties are available.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    description:
      "Your Aadhaar and personal data is encrypted at rest and never shared.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="bg-slate-50 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            Features
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Everything you need, in one polished flow
          </h2>
          <p className="mt-3 text-slate-600">
            From the very first clause to the courier at your doorstep.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
              className="rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
