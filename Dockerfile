# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
# Prisma schema is needed so the postinstall `prisma generate` can run.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build produces a self-contained server in .next/standalone (output: 'standalone').
# No secrets/DATABASE_URL are needed at build time — they are only used at request time.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + static assets + public files.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma client + query engine and the migration files / CLI deps, used by the
# entrypoint to run `prisma migrate deploy` and (optionally) seed at startup.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Bundled seed data lives in /app/seed-data; for the JSON-file backend the
# entrypoint copies any missing files into /app/data on startup (so a fresh
# volume gets the demo dataset). When DATABASE_URL is set the entrypoint runs
# migrations instead and seeds the database on first run.
COPY --from=builder /app/data ./seed-data
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R nextjs:nodejs /app/data /app/seed-data

USER nextjs
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
