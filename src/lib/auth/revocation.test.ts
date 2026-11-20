import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const files = new Map<string, unknown[]>();
vi.mock('@/lib/data/json-store', () => ({
  readJsonFile: async (name: string) => structuredClone(files.get(name) ?? []),
  writeJsonFile: async (name: string, data: unknown[]) => {
    files.set(name, structuredClone(data));
  },
}));
vi.mock('@/lib/data/prisma', () => ({ USE_PRISMA: false, prisma: {} }));

import { revokeToken, isTokenRevoked } from './revocation';
import { verifyActiveSession } from './active-session';
import { signSessionToken, verifySessionToken } from './jwt';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-value';
});
beforeEach(() => files.clear());

const inOneHour = () => new Date(Date.now() + 3_600_000);

describe('token revocation (JSON store)', () => {
  it('reports only revoked ids as revoked', async () => {
    await revokeToken('abc', inOneHour());
    expect(await isTokenRevoked('abc')).toBe(true);
    expect(await isTokenRevoked('other')).toBe(false);
  });

  it('is idempotent and purges entries whose token has already expired', async () => {
    await revokeToken('old', new Date(Date.now() - 1_000));
    await revokeToken('abc', inOneHour());
    await revokeToken('abc', inOneHour());
    const stored = files.get('revoked-tokens.json') as { jti: string }[];
    expect(stored.map((e) => e.jti)).toEqual(['abc']);
  });
});

describe('session tokens and logout', () => {
  it('gives every token its own jti', async () => {
    const a = await verifySessionToken(await signSessionToken({ sub: 'u', role: 'therapist' }));
    const b = await verifySessionToken(await signSessionToken({ sub: 'u', role: 'therapist' }));
    expect(a?.jti).toBeTruthy();
    expect(a?.jti).not.toBe(b?.jti);
  });

  it('a revoked token is rejected even though its signature is valid', async () => {
    const token = await signSessionToken({ sub: 'u', role: 'therapist' });
    const payload = await verifySessionToken(token);
    expect(await verifyActiveSession(token)).not.toBeNull();

    await revokeToken(payload!.jti!, new Date(payload!.exp! * 1000));
    expect(await verifySessionToken(token)).not.toBeNull(); // signature alone still passes
    expect(await verifyActiveSession(token)).toBeNull();
  });

  it('revoking one session does not affect another session of the same user', async () => {
    const t1 = await signSessionToken({ sub: 'u', role: 'therapist' });
    const t2 = await signSessionToken({ sub: 'u', role: 'therapist' });
    const p1 = await verifySessionToken(t1);
    await revokeToken(p1!.jti!, new Date(p1!.exp! * 1000));
    expect(await verifyActiveSession(t1)).toBeNull();
    expect(await verifyActiveSession(t2)).not.toBeNull();
  });

  it('rejects garbage and keeps tokens without a jti (issued before revocation existed) valid until expiry', async () => {
    expect(await verifyActiveSession('not-a-jwt')).toBeNull();
    const { SignJWT } = await import('jose');
    const legacy = await new SignJWT({ sub: 'u', role: 'therapist' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('test-jwt-secret-value'));
    expect(await verifyActiveSession(legacy)).not.toBeNull();
  });
});
