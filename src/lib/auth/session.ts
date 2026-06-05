// Server-side session helpers for route handlers (Node runtime).
//
// The session is an httpOnly, signed JWT cookie. Because it is httpOnly it is
// not readable by client JS (mitigates XSS token theft) and is sent
// automatically with same-origin requests.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { IS_PRODUCTION } from '@/lib/env';
import {
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from './jwt';

export const SESSION_COOKIE = 'therapydocs_session';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

export type { SessionPayload };

// Attach a freshly signed session cookie to a response (used on login).
export async function attachSessionCookie(
  response: NextResponse,
  payload: SessionPayload
): Promise<NextResponse> {
  const token = await signSessionToken(payload, '8h');
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

// Read and verify the current session from the request cookies. Returns the
// decoded payload, or null when there is no valid session.
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function isAdmin(session: SessionPayload | null): boolean {
  return session?.role === 'admin';
}
