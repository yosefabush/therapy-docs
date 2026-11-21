import { describe, it, expect, beforeEach, vi } from 'vitest';

type Row = { jti: string; expiresAt: Date };
const rows = new Map<string, Row>();
vi.mock('@/lib/data/json-store', () => ({
  readJsonFile: async () => {
    throw new Error('the JSON store must not be used when Prisma is active');
  },
  writeJsonFile: async () => {
    throw new Error('the JSON store must not be used when Prisma is active');
  },
}));
vi.mock('@/lib/data/prisma', () => ({
  USE_PRISMA: true,
  prisma: {
    revokedToken: {
      upsert: async ({ where, create }: { where: { jti: string }; create: Row }) => {
        if (!rows.has(where.jti)) rows.set(where.jti, create);
        return rows.get(where.jti);
      },
      deleteMany: async ({ where }: { where: { expiresAt: { lt: Date } } }) => {
        let count = 0;
        for (const [k, r] of rows) {
          if (r.expiresAt < where.expiresAt.lt) {
            rows.delete(k);
            count++;
          }
        }
        return { count };
      },
      findUnique: async ({ where }: { where: { jti: string } }) => rows.get(where.jti) ?? null,
    },
  },
}));

import { revokeToken, isTokenRevoked } from './revocation';

beforeEach(() => rows.clear());

describe('token revocation (Prisma store)', () => {
  it('stores and finds revoked ids, and purges expired ones', async () => {
    await revokeToken('expired', new Date(Date.now() - 1_000));
    await revokeToken('live', new Date(Date.now() + 3_600_000));
    await revokeToken('live', new Date(Date.now() + 3_600_000));
    expect(await isTokenRevoked('live')).toBe(true);
    expect(await isTokenRevoked('expired')).toBe(false);
    expect(await isTokenRevoked('never')).toBe(false);
    expect(rows.size).toBe(1);
  });
});
