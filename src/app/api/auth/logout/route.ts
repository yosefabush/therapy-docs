import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE } from '@/lib/auth/session';
import { verifySessionToken } from '@/lib/auth/jwt';
import { revokeToken } from '@/lib/auth/revocation';
import { logger } from '@/lib/logger';

// Clears the session cookie AND revokes the token server-side, so a copy of the
// JWT (stolen cookie, other device) stops working immediately instead of at expiry.
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session?.jti && session.exp) {
    try {
      await revokeToken(session.jti, new Date(session.exp * 1000));
    } catch (error) {
      // The cookie is still cleared so the user is logged out of this browser.
      logger.error('Failed to revoke session token on logout:', error);
    }
  }

  return clearSessionCookie(NextResponse.json({ success: true }));
}
