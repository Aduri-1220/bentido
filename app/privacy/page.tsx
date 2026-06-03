import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How WeBroker Mediation Pvt. Ltd. collects, uses, and protects personal data for rental agreement services.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="18 May 2026">
      <section className="space-y-3">
        <p>
          This Privacy Policy describes how{" "}
          <strong>WeBroker Mediation Pvt. Ltd.</strong> (“
          <strong>Company</strong>”, “<strong>we</strong>”, “<strong>us</strong>
          ” or “<strong>our</strong>”) handles personal data when you use the
          WeBroker website, web application, and related services (together, the “
          <strong>Platform</strong>”) that help landlords, tenants, and
          intermediaries prepare, pay for, and complete rental/lease agreement
          workflows — including structured drafting, optional document upload,
          add-ons (such as e-stamp and e-sign coordination), online payments, and
          delivery of executed documents (“<strong>Services</strong>”).
        </p>
        <p>
          This document is published in accordance with the Information
          Technology Act, 2000 and the rules made thereunder, where applicable.
          By accessing the Platform or using the Services, or by otherwise
          submitting personal data to us, you agree to this Privacy Policy. If
          you do not agree, please do not use the Platform or provide personal
          data.
        </p>
        <p>
          “<strong>You</strong>” or “<strong>user</strong>” means any person
          who visits the Platform, creates an account, or otherwise interacts
          with us in connection with the Services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          1. Information we collect
        </h2>
        <p>Depending on how you use the Platform, we may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account and sign-in data:</strong> such as name, email
            address, 10-digit Indian mobile number (where requested), password
            (stored using secure hashing), profile role or preferences you
            provide (e.g. owner, tenant, broker), and session identifiers when
            you stay signed in. If you choose “Continue with Google”, we receive
            profile information from Google as permitted by your Google account
            settings and our integration.
          </li>
          <li>
            <strong>Agreement workflow data:</strong> information you enter or
            upload to create or continue a rental agreement, including property
            details, party and witness names and contact details, rent and
            deposit amounts, clause selections, and similar fields needed to
            generate or review a draft.
          </li>
          <li>
            <strong>Documents and files:</strong> prior agreement drafts or other
            files you upload (for example PDF or Word documents), and executed
            agreement copies we may make available to you after fulfilment.
          </li>
          <li>
            <strong>Payment information:</strong> amounts, order references, and
            payment status processed through our payment partner (
            <strong>Razorpay</strong> or another provider we configure). We do not
            store full card or UPI credentials on our servers; such details are
            handled by the payment service provider under their terms and
            applicable security standards.
          </li>
          <li>
            <strong>Delivery and fulfilment:</strong> postal or courier address
            and tracking identifiers where you choose physical or tracked
            delivery options.
          </li>
          <li>
            <strong>Support and communications:</strong> messages you send us
            (including email) and metadata necessary to respond.
          </li>
          <li>
            <strong>Technical and usage data:</strong> server logs may include IP
            address, device/browser type, referring URLs, timestamps, and
            diagnostic data used to secure and operate the Platform. We may use
            cookies and similar technologies as described in our{" "}
            <a href="/cookies" className="font-medium text-brand-700 underline">
              Cookie Policy
            </a>
            .
          </li>
        </ul>
        <p>
          Our current web offering does not require access to your phone
          contacts, precise device location, or a list of other apps installed
          on your device. If we introduce optional mobile features that request
          such access, we will update this policy and, where required, seek
          separate consent before collection.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          2. How we use information
        </h2>
        <p>We use personal data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, operate, and improve the Services and Platform;</li>
          <li>
            Authenticate users, prevent fraud, abuse, and security incidents;
          </li>
          <li>
            Process payments, fulfil orders, and communicate status updates about
            your agreement workflow;
          </li>
          <li>
            Comply with law, respond to lawful requests, and enforce our terms;
          </li>
          <li>
            Send service-related notices (including account, payment, and
            delivery messages). Where permitted, we may also send product
            updates you can opt out of as described below.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          3. Sharing and subprocessors
        </h2>
        <p>
          We do not sell your personal data. We may share data with service
          providers who process it on our instructions — for example cloud
          hosting and database services, payment gateways, email delivery,
          analytics or error monitoring, and (where applicable) partners
          involved in e-stamp, e-sign, notary, or courier workflows. These
          parties are contractually required to use the data only to assist in
          delivering the Services.
        </p>
        <p>
          We may disclose information if we reasonably believe it is necessary
          to: comply with applicable law or legal process; protect the rights,
          property, or safety of the Company, users, or the public; detect or
          prevent fraud or security issues; or enforce our agreements. Certain
          disclosures may occur without prior notice where the law allows.
        </p>
        <p>
          If we are involved in a merger, acquisition, financing, reorganisation,
          or sale of assets, personal data may be transferred as part of that
          transaction, subject to appropriate safeguards and notice where
          required.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          4. International transfers
        </h2>
        <p>
          We primarily serve users in India. Your data may be stored and
          processed on servers located in India and/or in other countries where
          our hosting or subprocessors operate. Where cross-border transfers
          occur, we take steps we consider appropriate under applicable law to
          protect personal data in line with this Privacy Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          5. Retention
        </h2>
        <p>
          We retain personal data only as long as needed for the purposes
          described above, including legal, tax, accounting, and dispute
          resolution requirements, and consistent with our data retention
          practices. When retention is no longer required, we delete or
          irreversibly anonymise data where feasible.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          6. Security
        </h2>
        <p>
          We implement administrative, technical, and organisational measures
          designed to protect personal data against unauthorised access, loss, or
          misuse. No method of transmission over the Internet is completely
          secure; you use the Platform at your own risk to that extent. If we
          become aware of a breach that materially affects personal data we hold
          about you, we will notify you where the law requires and work to
          mitigate harm.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          7. Your choices
        </h2>
        <p>
          Where applicable law grants you rights of access, correction,
          deletion, restriction, objection, or portability, you may exercise
          them by contacting us at the address below. You may withdraw consent
          for optional processing where consent was the sole basis; withdrawal
          may limit certain features.
        </p>
        <p>
          For marketing messages, you can opt out by using instructions in the
          message or by emailing us. Transactional and security-related messages
          may continue as needed to operate your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          8. Third-party links
        </h2>
        <p>
          The Platform may link to third-party websites or services (including
          payment and identity providers). Their privacy practices are governed
          by their own policies; we encourage you to read them before
          submitting information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          9. Cookies
        </h2>
        <p>
          We use cookies and similar technologies for essential operation,
          preferences, analytics, and (where enabled) advertising. Details appear
          in our{" "}
          <a href="/cookies" className="font-medium text-brand-700 underline">
            Cookie Policy
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          10. Changes
        </h2>
        <p>
          We may update this Privacy Policy from time to time. The “Last
          updated” date will change accordingly. For material changes, we may
          provide additional notice (for example by email or a banner on the
          Platform) where appropriate.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-slate-900">
          11. Grievance officer and contact
        </h2>
        <p>
          Under the Information Technology Act, 2000 and applicable rules,
          grievances concerning processing of personal data may be addressed to
          the Grievance Officer appointed by the Company:
        </p>
        <ul className="list-none space-y-1 border-l-2 border-brand-200 pl-4">
          <li>
            <strong>WeBroker Mediation Pvt. Ltd.</strong>
          </li>
          <li>
            <strong>Grievance Officer:</strong> Privacy &amp; Grievance Officer
          </li>
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:privacy@webroker.in"
              className="font-medium text-brand-700 underline"
            >
              privacy@webroker.in
            </a>
          </li>
        </ul>
        <p>
          We will endeavour to acknowledge and resolve grievances within the
          timelines prescribed under applicable law.
        </p>
        <p>
          General questions about this Privacy Policy may also be sent to the
          same email. We may not respond to requests unrelated to privacy or the
          Services.
        </p>
      </section>
    </LegalPageShell>
  );
}
