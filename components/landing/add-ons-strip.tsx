"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ADD_ONS: Array<{
  title: string;
  desc: string;
  image: string;
  alt: string;
  /** Soft wash so all cards match the cream studio look of notarisation. */
  accent: string;
}> = [
  {
    title: "Aadhaar e-sign",
    desc: "OTP-based signing when owner and tenant are in different places.",
    image: "/images/add-ons/aadhaar-esign.png",
    alt: "Smartphone beside a wax-sealed legal scroll on cream backdrop — digital e-sign",
    accent: "from-stone-200/35 via-amber-100/25 to-stone-100/40",
  },
  {
    title: "Notarisation",
    desc: "Optional notary attestation on your executed agreement.",
    image: "/images/add-ons/notarisation.png",
    alt: "Wax seal and formal scroll — official notarisation symbolism",
    accent: "from-amber-100/40 via-rose-100/30 to-stone-100/35",
  },
  {
    title: "Courier delivery",
    desc: "Standard or express hardcopy to the address you provide.",
    image: "/images/add-ons/courier-delivery.png",
    alt: "Sealed envelopes and parcel box — express courier delivery of agreement copies",
    accent: "from-amber-100/35 via-stone-200/25 to-emerald-100/25",
  },
  {
    title: "Extra original copy",
    desc: "Additional stamped original when you need more than one set.",
    image: "/images/add-ons/extra-original-copy.png",
    alt: "Two wax-sealed document envelopes — an extra original set for mailing or filing",
    accent: "from-amber-100/40 via-orange-50/35 to-rose-100/25",
  },
];

export function LandingAddOnsStrip() {
  return (
    <div className="mt-8 sm:mt-10">
      <p className="text-center text-[10px] font-medium uppercase tracking-[0.28em] text-brand-700 sm:text-xs">
        Available add-ons
      </p>
      <p className="mx-auto mt-2 max-w-xl text-center text-xs text-stone-500 sm:text-sm">
        Choose these when you reach checkout — your summary updates with every
        toggle.
      </p>
      <ul
        className="mt-5 flex touch-pan-x gap-4 overflow-x-auto overscroll-x-contain pb-1 pt-0.5 [scrollbar-width:thin] sm:mt-6 sm:gap-5"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {ADD_ONS.map((item, i) => (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.12) }}
            className="w-[min(15.5rem,calc(100vw-3rem))] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200/90 bg-[#faf8f5] shadow-md shadow-stone-900/10 ring-1 ring-stone-900/[0.04] sm:w-[min(14rem,calc(100vw-4rem))]"
          >
            <div
              className={`relative h-[7.25rem] w-full bg-gradient-to-br ${item.accent} sm:h-[7.75rem]`}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 70vw, 224px"
                className="object-cover object-center"
                priority={i < 2}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/10 via-transparent to-white/25"
                aria-hidden
              />
            </div>
            <div className="border-t border-slate-100/90 bg-white px-3.5 py-3 sm:px-4 sm:py-3.5">
              <span className="block text-sm font-semibold text-stone-900">
                {item.title}
              </span>
              <span className="mt-1 block text-[12px] leading-snug text-stone-600 sm:text-[13px]">
                {item.desc}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
