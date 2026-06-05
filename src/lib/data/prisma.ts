import { PrismaClient } from '@prisma/client';

// When DATABASE_URL is set the app uses PostgreSQL via Prisma; otherwise it
// falls back to the JSON file store (handy for local dev and demos).
export const USE_PRISMA = !!process.env.DATABASE_URL;

// Reuse a single PrismaClient across hot-reloads / serverless invocations.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_LOGGING === 'true' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
