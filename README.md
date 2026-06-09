# bentido — Rental agreements, sorted in minutes

A polished Next.js 14 web app for drafting, e-stamping, e-signing and delivering
rental agreements end-to-end. This iteration focuses on the **full UX flow** with
mocked integrations (Razorpay, Aadhaar e-sign, notary and courier) so the
end-to-end experience is exercisable without external credentials.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + custom shadcn/ui-style primitives
- **Radix UI** for accessible interactive primitives
- **Framer Motion** for micro-animations
- **react-hook-form** + **zod** for forms & validation
- **Prisma** + **PostgreSQL** (hosted on [Neon](https://neon.tech)) for storage
- **NextAuth** with Credentials + Google providers
- **sonner** for toast notifications

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Provision a Neon project
#    - Sign up / log in at https://neon.tech
#    - Create a new project (region close to you)
#    - In the project dashboard, copy the *pooled* connection string
#      (host contains `-pooler`, sslmode=require)
#    - Create a second Neon branch for Playwright (copy its pooled URL into TEST_DATABASE_URL)

# 3. Set up env
cp .env.example .env
#    Paste Neon DATABASE_URL and TEST_DATABASE_URL (isolated branch for e2e).

# 4. Apply the database schema (migrations — preferred)
npm run db:migrate
#    Local prototyping without migration history (not for shared/prod DBs):
#    npm run db:push

# 5. Run dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Tip: use the Neon **pooled** connection string for `DATABASE_URL`. Serverless
> functions (Next.js route handlers, Vercel) open a new Prisma client per
> invocation, and Neon's pooler keeps connection counts under the plan limit.

## Database migrations (production)

- **Deploy / Docker / CI:** run `npm run db:migrate` (wrapper for `prisma migrate deploy`) against `DATABASE_URL` **before or as part of** bootstrapping the app — this applies everything under `prisma/migrations`.
- **Docker image:** the production Dockerfile runs `prisma migrate deploy` in `scripts/docker-entrypoint.sh` before `node server.js`. To skip (debug only): `SKIP_PRISMA_MIGRATE=true`.
- **Local schema iteration:** create new migrations with `npm run db:migrate:dev` (`prisma migrate dev`).
- **`db:push`** remains useful for solo prototyping when you explicitly accept schema drift and no migration history.

### Existing databases (brownfield)

If you already have tables from older `db push` runs or from before the baseline migration existed:

1. Back up the database.
2. Compare drift: `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`
3. If the diff is empty, mark the baseline as applied without running SQL:
   `npx prisma migrate resolve --applied 20260516130000_init_schema`
4. If there is drift, resolve it manually or with a follow-up migration before pointing production traffic at the app.

See Prisma’s [baselining guide](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baseline-database) for complex cases.

## End-to-end tests

Playwright **requires `TEST_DATABASE_URL`** — never `DATABASE_URL` alone. Global setup runs `prisma migrate reset --force`, which drops data and reapplies migrations.

```bash
export TEST_DATABASE_URL="postgresql://…your-neon-test-branch…"
npm run test:e2e
```

In CI, inject `TEST_DATABASE_URL` via secrets (isolated branch or ephemeral Postgres).

## End-to-end flow

```
Landing → Sign up → Onboarding (role + state) → Dashboard
   → New Agreement → 7-step wizard (Your draft, Property, Owner, Tenant, Terms, Clauses, Witnesses)
   → Draft preview (one-page A4 view with inline edit pencils)
   → Add-ons & delivery (Aadhaar e-sign, notary, copies, courier, e-stamp)
   → Mocked payment (UPI/Card/Netbanking, success/failure simulator)
   → Status timeline (Created → Paid → E-stamping → E-signing → Delivery → Completed)
```

## Project structure

```
app/
  (marketing)/        Landing page (Hero, Features, Pricing, FAQ, Testimonials)
  (auth)/             /sign-in, /sign-up (split-screen layout)
  (app)/              Authenticated routes (dashboard, onboarding, wizard, etc.)
    agreement/[id]/   draft | property | owner | tenant | terms | clauses | witnesses
                      preview, addons, payment, status (default page)
  api/                Auth, agreements CRUD, addons, payment (mock), status
components/
  ui/                 Reusable shadcn-style primitives
  marketing/          Landing-page sections
  wizard/             Stepper, form scaffolding, persistence helpers
  agreement/          Draft document renderer
  app/                Authenticated app chrome
lib/
  auth.ts             NextAuth config
  db.ts               Prisma client singleton
  schemas.ts          Zod schemas per wizard step
  pricing.ts          Pure pricing engine consumed by addons + payment pages
  clauses.ts          Default clause templates
  constants.ts        States, BHK, amenities, etc.
prisma/
  schema.prisma       Data model
  migrations/         Versioned SQL applied via migrate deploy / e2e reset
scripts/
  docker-entrypoint.sh   Runs migrate deploy then starts Next standalone server
```

## Mocked integrations

The following are mocked behind `/api/*` endpoints with realistic shapes so
swapping in a real provider later is a drop-in:

- **Payment** — `/api/agreements/[id]/payment` — accepts `simulate: "success"|"failure"`
- **Status transitions** — `/api/agreements/[id]/status` — advanced manually
  from the status timeline page for demo purposes
- **PDF generation** — uses print-styled HTML + `window.print()` from the preview page

## Stamp duty

Per-state stamp duty defaults live in `lib/constants.ts` (`INDIAN_STATES`) and
flow into the order summary as a transparent government pass-through (no GST).

## Notes

- For Google OAuth fill in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; if
  unset, the provider is omitted automatically.
- Legacy additive fixes for drifted columns: `npm run db:ensure-columns` — prefer migrations going forward.
- The agreement draft uses serif typography and an A4-styled page so the
  on-screen preview matches the printed/PDF output closely.
