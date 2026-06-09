# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Dependencies
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# `--ignore-scripts` skips the `postinstall` (prisma generate) — the schema isn't
# copied yet at this stage. The builder stage runs `npx prisma generate` explicitly.
RUN npm ci --ignore-scripts

# -----------------------------------------------------------------------------
# Build Next.js (standalone output) + Prisma client
# -----------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /app

# Source (see `.dockerignore` — node_modules stays from deps stage).
COPY . .

# Next allows no public/ folder; Docker COPY expects the path to exist in the builder.
RUN mkdir -p public

# prisma generate requires DATABASE_URL syntax; DB is never contacted during generate.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://_:PLACEHOLDER@_:5432/_"
ENV DOCKER_BUILD=1

RUN npx prisma generate \
  && npm run build

# -----------------------------------------------------------------------------
# Production runner
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure Prisma engine + client from the Linux build survive output tracing.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Schema + migrations for `prisma migrate deploy`, and CLI from the full deps tree.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown nextjs:nodejs ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
