import { NextResponse, type NextRequest } from 'next/server';
import { verifyActiveSession } from '@/lib/auth/active-session';

const SESSION_COOKIE = 'therapydocs_session';

// API routes that must remain reachable without an authenticated session.
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/health',
  '/api/swagger',
];

// App pages reachable without a session. Every other page is redirected to
// /login server-side when there is no valid session cookie.
const PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/guide',
  '/api-docs',
];

// Pages for people who are NOT signed in: a signed-in user is sent to the dashboard.
const GUEST_ONLY_PAGE_PREFIXES = ['/login', '/signup'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/api/')) {
    return matchesPrefix(pathname, PUBLIC_API_PREFIXES);
  }
  // Next.js internals not excluded by the matcher (e.g. dev HMR).
  if (pathname.startsWith('/_next/')) return true;
  // Static files from public/ (e.g. /favicon.ico, /guide/01-login.png).
  if (/\.[^/]+$/.test(pathname)) return true;
  return matchesPrefix(pathname, PUBLIC_PAGE_PREFIXES);
}

// Enforce authentication server-side: API routes get a 401, app pages are
// redirected to /login. (The client-side redirect in useAuthRedirect stays as a
// fallback for sessions that expire while a page is open.)
//
// Next.js 16 renamed the `middleware` file convention to `proxy`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const guestOnly = matchesPrefix(pathname, GUEST_ONLY_PAGE_PREFIXES);

  if (isPublicPath(pathname) && !guestOnly) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyActiveSession(token) : null;

  if (guestOnly) {
    // Already signed in (valid, non-revoked session): /login and /signup go to the dashboard.
    return session
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next.js build assets; public paths are filtered above.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
