import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, isPublicPath } from './proxy';
import { signSessionToken } from '@/lib/auth/jwt';

// The revocation store is mocked: these tests are about the proxy's decisions.
const revoked = new Set<string>();
vi.mock('@/lib/auth/revocation', () => ({
  isTokenRevoked: async (jti: string) => revoked.has(jti),
  revokeToken: async (jti: string) => {
    revoked.add(jti);
  },
}));
beforeEach(() => revoked.clear());

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-value';
});

const req = (path: string, token?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: token ? { cookie: `therapydocs_session=${token}` } : {},
  });

describe('proxy (server-side auth)', () => {
  it.each(['/', '/patients', '/patients/patient-1', '/sessions', '/reports', '/insights', '/settings', '/help'])(
    'redirects unauthenticated %s to /login',
    async (path) => {
      const res = await proxy(req(path));
      expect([302, 307]).toContain(res.status);
      expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
    }
  );

  it('rejects an invalid session token', async () => {
    const res = await proxy(req('/patients', 'not-a-jwt'));
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('lets a valid session through', async () => {
    const token = await signSessionToken({ sub: 'user-1', role: 'therapist' });
    const res = await proxy(req('/patients', token));
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('returns 401 JSON for protected APIs, including /api/seed', async () => {
    for (const path of ['/api/patients', '/api/seed']) {
      const res = await proxy(req(path));
      expect(res.status).toBe(401);
    }
  });

  it('keeps public pages, public APIs and static files open', () => {
    for (const path of [
      '/login', '/signup', '/forgot-password', '/terms', '/privacy', '/guide', '/api-docs',
      '/api/auth/login', '/api/auth/signup', '/api/auth/logout', '/api/health', '/api/swagger',
      '/favicon.ico', '/guide/01-login.png',
    ]) {
      expect(isPublicPath(path)).toBe(true);
    }
    for (const path of ['/', '/patients', '/api/seed', '/api/auth/me', '/api/users/x.json']) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});

describe('proxy (signed-in users on guest pages, revoked sessions)', () => {
  it.each(['/login', '/signup'])('redirects a signed-in user from %s to the dashboard', async (path) => {
    const token = await signSessionToken({ sub: 'user-1', role: 'therapist' });
    const res = await proxy(req(path, token));
    expect([302, 307]).toContain(res.status);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  it.each(['/login', '/signup'])('lets a signed-out visitor see %s', async (path) => {
    const res = await proxy(req(path));
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('treats an invalid cookie on /login as signed out (no redirect loop)', async () => {
    const res = await proxy(req('/login', 'not-a-jwt'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('does not redirect guests away from the other public pages', async () => {
    const token = await signSessionToken({ sub: 'user-1', role: 'therapist' });
    for (const path of ['/guide', '/terms', '/privacy', '/forgot-password']) {
      const res = await proxy(req(path, token));
      expect(res.headers.get('location')).toBeNull();
    }
  });

  it('rejects a revoked (logged-out) token on pages and APIs', async () => {
    const token = await signSessionToken({ sub: 'user-1', role: 'therapist' });
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, new TextEncoder().encode('test-jwt-secret-value'));
    revoked.add(payload.jti as string);

    const page = await proxy(req('/patients', token));
    expect(new URL(page.headers.get('location')!).pathname).toBe('/login');
    const api = await proxy(req('/api/patients', token));
    expect(api.status).toBe(401);
    // ...and it no longer counts as "signed in" on /login.
    const login = await proxy(req('/login', token));
    expect(login.headers.get('location')).toBeNull();
  });
});
