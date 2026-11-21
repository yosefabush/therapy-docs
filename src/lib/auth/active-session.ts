// A session is "active" when its JWT verifies (signature + expiry) AND it has
// not been revoked by a logout. Node runtime only (reads the revocation store).

import { logger } from '@/lib/logger';
import { verifySessionToken, type SessionPayload } from './jwt';
import { isTokenRevoked } from './revocation';

export async function verifyActiveSession(token: string): Promise<SessionPayload | null> {
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  // Tokens issued before revocation existed carry no jti; they simply expire.
  if (!payload.jti) return payload;
  try {
    if (await isTokenRevoked(payload.jti)) return null;
  } catch (error) {
    // Fail closed: if the denylist cannot be read, do not trust the token.
    logger.error('Failed to check token revocation:', error);
    return null;
  }
  return payload;
}
