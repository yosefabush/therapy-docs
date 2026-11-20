import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, isPublicPath } from './proxy';
import { signSessionToken } from '@/lib/auth/jwt';

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
      '/login', '/signup', '/guide', '/api-docs',
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
