"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is an online rental agreement legally valid?",
    a: "Yes. Agreements drafted, e-stamped and e-signed via Aadhaar OTP are legally valid and enforceable under the IT Act, 2000 and the relevant state stamp acts.",
  },
  {
    q: "Do I need to visit a government office?",
    a: "For many 11-month leases, people complete everything online. Longer terms or specific cases may need extra steps depending on state rules — we note that in the flow when it applies to you.",
  },
  {
    q: "How long does the whole process take?",
    a: "Drafting and e-signing typically take 15–20 minutes. Digital copies are delivered instantly; couriered hard copies take 1–6 working days based on the delivery option you choose.",
  },
  {
    q: "What is the stamp duty I have to pay?",
    a: "Stamp duty varies by state. We calculate the correct amount automatically based on the property's state and show it as a transparent pass-through on the order summary.",
  },
  {
    q: "Can I edit the draft after generating it?",
    a: "Absolutely. The summary page lets you click any section to jump back into the wizard and edit it, before you proceed to add-ons and payment.",
  },
  {
    q: "Is my Aadhaar information safe?",
    a: "We never store your full Aadhaar number. Only the last four digits are saved for record-keeping. The e-sign happens directly via the licensed signature gateway over a secure channel.",
  },
];

export function FaqAccordion() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container max-w-3xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            FAQ
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Questions, answered
          </h2>
        </div>

        <Accordion
          type="single"
          collapsible
          className="mt-10 rounded-2xl border bg-white px-6 shadow-sm"
        >
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className={i === faqs.length - 1 ? "border-0" : ""}
            >
              <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
