import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/legal-page-shell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How WeBroker uses cookies and similar technologies on its website and web application.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell title="Cookie Policy" lastUpdated="18 May 2026">
      <section className="space-y-3">
        <p>
          This Cookie Policy explains how <strong>WeBroker Mediation Pvt. Ltd.</strong> (“
          <strong>we</strong>”, “<strong>us</strong>”) uses cookies and similar
          technologies when you visit our website or use the WeBroker web
          application (“<strong>Platform</strong>”). It should be read together
          with our{" "}
          <a href="/privacy" className="font-medium text-brand-700 underline">
            Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          1. What are cookies?
        </h2>
        <p>
          Cookies are small text files stored on your device when you visit a
          site. Similar technologies include local storage and pixel tags. They
          help the Platform remember preferences, keep you signed in, understand
          usage, and (where we use them) measure marketing effectiveness.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          2. How we use cookies on WeBroker
        </h2>
        <p>We use the following categories:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Strictly necessary:</strong> required for core operation —
            for example session and authentication cookies used with your
            sign-in (including NextAuth-related cookies), security tokens, and
            load balancing. The Platform cannot function properly without these.
          </li>
          <li>
            <strong>Functional:</strong> remember choices such as language or UI
            preferences where we offer them.
          </li>
          <li>
            <strong>Analytics:</strong> help us understand how the Platform is
            used (pages viewed, errors) so we can improve performance and UX.
            Where we use third-party analytics, their terms apply in addition to
            this policy.
          </li>
          <li>
            <strong>Marketing / advertising:</strong> only if we enable
            third-party ad or remarketing tags; you may be able to opt out via
            industry tools or your browser settings.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          3. Third parties
        </h2>
        <p>
          Third-party providers (for example Google when you use “Continue with
          Google”, Razorpay during checkout, or embedded content) may set their
          own cookies. We do not control those technologies; please review their
          respective policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          4. Managing cookies
        </h2>
        <p>
          You can block or delete cookies through your browser settings. Blocking
          strictly necessary cookies may prevent sign-in or other features from
          working. For more information, see your browser’s help documentation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          5. Contact
        </h2>
        <p>
          Questions about this Cookie Policy can be sent to{" "}
          <a
            href="mailto:privacy@webroker.in"
            className="font-medium text-brand-700 underline"
          >
            privacy@webroker.in
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
