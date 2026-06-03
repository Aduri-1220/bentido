# WeBroker Production Readiness Audit

**Date:** June 3, 2026  
**Scope:** Full codebase inspection for production gaps, mocks, and missing integrations

---

## What's truly real vs. mocked

### Real and production-shaped
- **Next.js 14 app** — Prisma + Postgres (Neon), NextAuth (credentials + Google), email via Resend, Upstash rate limiting on auth endpoints
- **Razorpay integration** — order creation, client signature verify (`verifyRazorpayPaymentSignature`), webhook signature verify, dedup table `PaymentWebhookEvent`, `finalizeRazorpayCapturedPayment`. Production checkout is genuinely wired.
- **Agreement status state machine** (`lib/agreement-status.ts`) — proper guards; `paymentQualifiesForWorkflow` correctly blocks MOCK payments from advancing in prod unless `ENABLE_PAYMENT_SIMULATE=true`
- **Wizard data model, pricing engine, draft document renderer, admin tools** — manual status advance, executed-copy upload

### Mocked / stubbed (need real integrations before launch)

#### 1. E-stamping
- No integration. Wizard captures `stampValue`, that's it.
- Real platforms hook into SHCIL (e-Stamping) or partners like Leegality / SignDesk / Digio.
- Today, "E_STAMPING" is just a status the admin advances manually.

#### 2. Aadhaar e-sign
- Completely absent.
- UI sells it ("Aadhaar e-sign × N"), pricing charges ₹99/signatory.
- **Missing:** Aadhaar OTP, NSDL/UIDAI ASP flow, eSign XML, audit trail, signature pad.
- Status `E_SIGNING` is admin-advanced.

#### 3. Notary
- No scheduling, no notary marketplace, no NSI/online notary.
- Just an add-on line item with pricing.

#### 4. Courier / delivery
- `trackingId` is a free-text field set by the admin.
- **Missing:** Shiprocket/Delhivery integration, AWB generation, tracking webhooks.
- UI itself admits this: *"In production this advances automatically as stamping, e-signing and courier callbacks come in"* (`status-timeline.tsx:153`)

#### 5. PDF generation
- "PDF" is `window.print()` of HTML in serif font. Not server-rendered.
- **Missing:** A/B/C copy generation, embedded e-stamp page, executed-copy assembly.
- Admin uploads the final PDF manually (`scannedCopyBlob` route).

#### 6. Mock payment path
- `WB_MOCK_` txn IDs, simulate=success/failure UI
- Correctly gated by env, but dashboard/admin still display `mockTxnId` to users:
  - `agreement/[id]/page.tsx:98`
  - `admin/.../page.tsx:176`
- Fine for staging; would be ugly if `ENABLE_PAYMENT_SIMULATE` leaks into prod.

#### 7. Fast-track upload flow placeholders
- `lib/upload-fast-track.ts` fabricates data when users skip structured wizard:
  - `aadhaarLast4: "0000"`
  - `pincode: "560001"`
  - `age: 21`
  - `gender: "Other"`
- This data ends up in the rendered draft. **Most user-visible "mock data in production" risk.**

#### 8. Email
- Silently no-ops when `RESEND_API_KEY` unset (only logs).
- Signup verification auto-verified in dev to compensate.
- **Production check:** ensure that branch can't run in prod.

---

## Production gaps (besides the mocks above)

### Legal / Compliance

- **No bilingual clause templates** — NoBroker offers English + Hindi/Telugu/Kannada side-by-side
- **No state-specific clause variations** — beyond stamp value; rent-control jurisdictions (Maharashtra, Delhi) require different clauses
- **No registration/sub-registrar booking** — required for >11-month agreements or >₹100/month rent in many states
- **No KYC verification** — PAN is captured but never verified against NSDL; Aadhaar last 4 digits is not KYC
- **No tenant police verification** — feature NoBroker advertises
- **No GST invoice generation** — pricing treats stamp as pass-through but no proper invoice PDF for service fee

### Workflow / Ops

- **Customer can advance workflow steps manually** — `POST /api/agreements/:id/status` is public by default. Gate exists (`DISABLE_PUBLIC_AGREEMENT_STATUS_ADVANCE=true`) but opt-in; should be **on by default in prod**.
- **No notification system** — no email/SMS/WhatsApp on status changes, e-sign requests, delivery, OTPs. Resend is wired only for signup/password.
- **No SMS provider** — MSG91/Gupshup required for Aadhaar OTP relay and delivery updates in India
- **No two-party flow** — only the *initiating* user has an account. Counterparty (tenant if owner initiates) never gets login/invite/e-sign link. **Major gap for real rental flow.**
- **No audit log** — who changed what / when (legally important for executed agreements)
- **No in-person biometric or doorstep service** — both are NoBroker selling points

### Storage

- **Files stored as Postgres `Bytes` columns** — `sourceDraftBlob`, `scannedCopyBlob`. Works at low volume; will balloon DB size and slow queries. **Move to S3/R2/Vercel Blob with signed URLs before scale.**
- **No virus scan / file-type sniffing** — beyond MIME trust on user-uploaded drafts

### Security

- **Rate limiting only on auth endpoints** — agreement create, addons, payment intent, status, admin routes all unrate-limited
- **No explicit CSRF protection** on POST API routes beyond NextAuth session cookie
- **No CSP header**
- **Admin gate is email-based only** — no per-admin audit trail
- **`ENABLE_PAYMENT_SIMULATE` is a sharp env var** — suggest refusing to boot in prod if both `PAYMENT_PROVIDER=mock` and `NODE_ENV=production` unless explicit `ALLOW_MOCK_PAYMENTS_IN_PROD=staging` is set

### Data Correctness

- **`normalizePanInput` silently truncates** to 10 chars (flagged in code review; still open)
- **`tenant-form.tsx` / `party-form.tsx` use `as unknown as TenantData`** to bypass age type-safety (flagged; still open)
- **Witnesses data** flows into printed document but witnesses never sign — they're not a party to e-sign
- **Pricing rounding** — `Math.round` for halves; no server-side rupee total reconciliation enforced beyond `getAgreementPriceBreakdownForOwner`

### Observability

- **No structured logging** — console.error scattered throughout. No request IDs.
- **No Sentry / OpenTelemetry** — Razorpay webhooks fail silently to logs
- **No background jobs / queue** — all webhook processing inline. Risk if webhook handler grows (e.g., trigger e-stamp on payment).

---

## UX gaps vs. NoBroker

- **No multi-party invite + collaborative review** — counterparty edits before signing
- **No "drafted by lawyer"** badge / lawyer-on-call upsell
- **No WhatsApp delivery** / OTP / status updates
- **No saved templates** / "duplicate from previous agreement"
- **No renewal flow** — most rentals renew annually; huge LTV lever
- **No agreement registration tracking** — sub-registrar slot booking
- **No tenant background check** — employment, prior landlord references
- **Dashboard is single-agreement-centric** — no portfolio view for landlords with multiple units
- **No mobile app or PWA** install prompt; rental flows are mostly mobile in India

---

## Suggested priority order

1. **Replace fast-track placeholders** (`aadhaarLast4:"0000"`, pincode `560001`, etc.) — they will appear in real agreements today.
2. **Move file storage off Postgres** before users start uploading (target S3/R2).
3. **Default `DISABLE_PUBLIC_AGREEMENT_STATUS_ADVANCE=true`** and force admin-driven transitions.
4. **Pick partners for e-stamp + e-sign** (Leegality / SignDesk / Digio / NSDL eSign) — these unlock real automation.
5. **Two-party invite + counterparty e-sign** — without this, it's a draft generator, not an agreement platform.
6. **Server PDF rendering** (Puppeteer / @react-pdf/renderer) so executed copies are deterministic.
7. **Notifications** (email + SMS + WhatsApp) for status changes and signing requests.
8. **Courier API integration** for tracking IDs.
9. **Renewal flow** + multi-agreement landlord dashboard.
10. **Observability** (Sentry + structured logs + webhook DLQ).

---

## Conclusion

The architecture is sound — state machine, pricing engine, status guards, and Razorpay flow are all production-shaped. The work ahead is mostly **integrations** (e-stamp, e-sign, courier, SMS) and the **two-party signing flow**, not a rewrite.
