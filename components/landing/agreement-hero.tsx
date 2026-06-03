"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileSignature,
  Landmark,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* AgreementHero — modern SaaS hero, outcome-focused (no pipeline).           */
/* -------------------------------------------------------------------------- */

export function AgreementHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-white pt-24 pb-16 sm:pt-32 sm:pb-24"
      aria-label="WeBroker hero"
    >
      <HeroBackdrop />

      <div className="container relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <HeroCopy />
        <HeroPreview />
      </div>
    </section>
  );
}

/* Minimal static backdrop on white */

function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.45), transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.45), transparent 70%)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Left column                                                                */
/* -------------------------------------------------------------------------- */

function HeroCopy() {
  return (
    <div className="flex flex-col items-start text-left">
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-800 shadow-sm shadow-slate-900/5 backdrop-blur sm:text-[11px]"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Same platform for landlords & tenants
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.06 }}
        className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-slate-800 sm:text-5xl md:text-6xl lg:text-[64px]"
      >
        A rental agreement that{" "}
        <span className="bg-gradient-to-r from-brand-500 via-violet-500 to-emerald-600 bg-clip-text text-transparent">
          works for both of you.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.14 }}
        className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base"
      >
        You get a clear Leave &amp; Licence with rent and deposit written in,
        valid e-stamp where your state supports it, and e-sign — without running
        between brokers and print shops. We stay neutral: you focus on the home,
        we handle the paperwork.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-8 flex w-full flex-col gap-3 sm:flex-row"
      >
        <Link
          href="/sign-up"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-4px_rgba(52,120,246,0.55)] transition hover:from-brand-400 hover:to-brand-500 hover:shadow-[0_8px_36px_-4px_rgba(52,120,246,0.75)]"
        >
          <Sparkles className="h-4 w-4" />
          Start my agreement
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50/80"
        >
          Log in
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.26 }}
        className="mt-3 text-[13px] text-stone-500"
      >
        Authorized staff?{" "}
        <Link
          href="/sign-in?callbackUrl=/admin"
          className="font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
        >
          Admin
        </Link>{" "}
        ·{" "}
        <Link
          href="/sign-in?callbackUrl=/worker"
          className="font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
        >
          Worker
        </Link>
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.32 }}
        className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500"
      >
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" /> Aadhaar e-Sign
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" /> Valid e-Stamp
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" /> Structured rental
          clauses
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" /> Review before you
          pay
        </span>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Right column — rental closing flow (not a mock “lease card”)              */
/* -------------------------------------------------------------------------- */

const FLOW_PHASES: Array<{
  label: string;
  headline: string;
  body: string;
  Icon: LucideIcon;
  accent: "brand" | "violet" | "emerald";
  chips: string[];
}> = [
  {
    label: "Verify",
    headline: "Identity before anything is binding",
    body: "Owner and tenant finish Aadhaar + PAN e-KYC so every clause is between the right people.",
    Icon: BadgeCheck,
    accent: "emerald",
    chips: ["Dual KYC", "PAN matched"],
  },
  {
    label: "Align",
    headline: "Rent, deposit & notice in one draft",
    body: "Align on a standard Leave & Licence together until both sides accept — no WhatsApp ping‑pong.",
    Icon: FileSignature,
    accent: "brand",
    chips: ["11‑month L&L", "Add‑ons ok"],
  },
  {
    label: "Close",
    headline: "E-stamp, sign, and wrap up",
    body: "Complete e-stamp duty online where supported, then e-sign and download your executed agreement. Need hard copies? Add delivery — rent and deposit stay between you and your counterparty; we do not hold funds on the site.",
    Icon: Landmark,
    accent: "violet",
    chips: ["Valid e-stamp", "Executed PDF"],
  },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-lg">
      <RentalFlowShowcase />
    </div>
  );
}

function RentalFlowShowcase() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setPhase((p) => (p + 1) % FLOW_PHASES.length),
      3400,
    );
    return () => clearInterval(id);
  }, [reduce]);

  const active = FLOW_PHASES[phase];
  const progress = (phase + 1) / FLOW_PHASES.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.2)] sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_100%_-20%,rgba(52,120,246,0.08),transparent_55%),radial-gradient(ellipse_90%_60%_at_-10%_100%,rgba(139,92,246,0.06),transparent_50%)]"
      />

      <motion.div
        aria-hidden
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"
        animate={
          reduce ? {} : { opacity: [0.4, 1, 0.4], scaleX: [0.92, 1, 0.92] }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            How WeBroker closes rentals
          </p>
          <motion.span
            key={active.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white"
          >
            Step {phase + 1} · {active.label}
          </motion.span>
        </div>

        <div className="mt-6 flex items-stretch gap-5 sm:gap-7">
          {/* Rail */}
          <div className="relative flex min-h-[220px] w-11 shrink-0 flex-col items-center pt-1 sm:min-h-[240px]">
            <div
              className="absolute bottom-5 left-1/2 top-5 w-px -translate-x-1/2 bg-slate-200"
              aria-hidden
            />
            <motion.div
              className="absolute bottom-5 left-1/2 top-5 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-500 via-violet-500 to-emerald-500"
              style={{ transformOrigin: "top center" }}
              initial={false}
              animate={{ scaleY: reduce ? 1 : progress }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              aria-hidden
            />
            <ol className="relative z-[1] flex w-full flex-col gap-6">
              {FLOW_PHASES.map((step, i) => {
                const state =
                  i < phase ? "done" : i === phase ? "current" : "upcoming";
                return (
                  <motion.li
                    key={step.label}
                    className="flex justify-center"
                    initial={false}
                    animate={{
                      scale: state === "current" ? 1.06 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold shadow-sm ring-2 ring-white transition-colors",
                        state === "done" &&
                          "bg-emerald-500 text-white shadow-emerald-500/25",
                        state === "current" &&
                          "bg-slate-900 text-white shadow-slate-900/20",
                        state === "upcoming" &&
                          "border border-slate-200 bg-white text-slate-400",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        i + 1
                      )}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {/* Detail */}
          <div className="min-h-[220px] flex-1 sm:min-h-[240px]">
            <motion.div
              key={phase}
              initial={
                reduce
                  ? { opacity: 1, x: 0, filter: "blur(0px)" }
                  : { opacity: 0, x: 14, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner ring-1 ring-black/5",
                  active.accent === "emerald" &&
                    "bg-emerald-50 text-emerald-700",
                  active.accent === "brand" && "bg-brand-50 text-brand-700",
                  active.accent === "violet" && "bg-violet-50 text-violet-700",
                )}
              >
                <active.Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3
                className="mt-4 text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {active.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {active.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Highlights">
                {active.chips.map((c) => (
                  <li
                    key={c}
                    className="rounded-lg border border-slate-200/90 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        <p className="relative mt-7 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-500">
          Neutral mediation — one flow from KYC to your executed agreement.
        </p>
      </div>
    </motion.div>
  );
}
