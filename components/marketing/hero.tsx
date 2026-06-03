"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -right-32 top-40 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="container relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            Structured templates · Aadhaar e-sign · Doorstep delivery
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-balance text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl"
          >
            Rental agreements,{" "}
            <span className="gradient-text">sorted in minutes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 max-w-xl text-balance text-lg text-slate-600"
          >
            Draft, e-stamp, e-sign and deliver your rental agreement — all from
            one polished flow, without leaving home. For owners, tenants and
            brokers across India.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild variant="brand" size="xl">
              <Link href="/sign-up">
                Create Agreement
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              No paperwork
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Legally enforceable
            </span>
            <span className="inline-flex items-center gap-2">
              <Stamp className="h-4 w-4 text-emerald-600" />
              State-wise e-stamp
            </span>
          </motion.div>
        </div>

        <HeroMockDoc />
      </div>
    </section>
  );
}

function HeroMockDoc() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-400/20 via-indigo-300/20 to-purple-300/20 blur-2xl" />
      <div className="relative rounded-2xl border bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-500">
            Draft Preview · 11-month Lease
          </div>
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
        <div className="space-y-3 font-serif">
          <h3 className="text-center text-base font-semibold text-slate-900">
            RENTAL AGREEMENT
          </h3>
          <div className="h-px bg-slate-200" />
          {[
            "This Rental Agreement is made on ___ day of ___, 2026 between:",
            "Mr. Rajesh Kumar (the 'Owner'), aged 42 years, residing at...",
            "AND Ms. Priya Sharma (the 'Tenant'), aged 28 years, residing at...",
            "WHEREAS the Owner is the absolute owner of the property...",
            "NOW THEREFORE, in consideration of the rent and the covenants...",
          ].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-xs leading-relaxed text-slate-700"
            >
              {line}
            </motion.p>
          ))}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <div className="text-[10px] text-slate-500">
              Signed via Aadhaar OTP
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
            >
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 8 }}
        transition={{ delay: 0.7, type: "spring" }}
        className="absolute -right-6 -top-6 rounded-xl border bg-white p-3 shadow-lg"
      >
        <Stamp className="h-6 w-6 text-brand-600" />
        <div className="mt-1 text-[10px] font-semibold text-slate-700">
          ₹500 E-Stamp
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ delay: 0.9, type: "spring" }}
        className="absolute -bottom-6 -left-6 rounded-xl border bg-white p-3 shadow-lg"
      >
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <div className="mt-1 text-[10px] font-semibold text-slate-700">
          Aadhaar e-signed
        </div>
      </motion.div>
    </motion.div>
  );
}
