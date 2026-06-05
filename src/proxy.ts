import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';

const SESSION_COOKIE = 'therapydocs_session';

// API routes that must remain reachable without an authenticated session.
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/health',
  '/api/seed',
  '/api/swagger',
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

// Enforce authentication on API routes server-side. Page-level redirects are
// still handled client-side, but data access is gated here so the API cannot be
// called directly without a valid session.
//
// Next.js 16 renamed the `middleware` file convention to `proxy`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/') || isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
