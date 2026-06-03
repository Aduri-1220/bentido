"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const items = [
  {
    name: "Aakash Verma",
    role: "Landlord, Bengaluru",
    rating: 5,
    body: "Drafted, e-signed, and had the PDF the same evening — no weekday mornings lost on errands.",
  },
  {
    name: "Megha Iyer",
    role: "Tenant, Mumbai",
    rating: 5,
    body: "The summary page lets you edit any section before paying. Felt much more in control than a copy-shop draft.",
  },
  {
    name: "Karthik Reddy",
    role: "Broker, Hyderabad",
    rating: 5,
    body: "I close 4–5 leases a month through WeBroker. The Aadhaar e-sign step is a magic moment with clients.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            Loved by 12,000+ Indians
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Faster, calmer, paper-free
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-slate-700">
                &ldquo;{t.body}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
