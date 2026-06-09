"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 px-8 py-16 text-center shadow-2xl md:px-16 md:py-20"
        >
          <div className="absolute inset-0 bg-dot opacity-10" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-5xl">
              Your rental agreement is just a few clicks away
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-white/90">
              Join 12,000+ owners, tenants and brokers using bentido every
              month.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="xl"
                className="bg-white text-brand-700 hover:bg-white/90"
              >
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/sign-in">I already have an account</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
