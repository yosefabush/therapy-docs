// Edge-safe session JWT helpers (jose only — no Node-specific crypto/bcrypt),
// so this module can be imported from both route handlers and middleware.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { requireSecret } from '@/lib/env';

const JWT_ALG = 'HS256';

export interface SessionPayload extends JWTPayload {
  sub: string; // user id
  role: string; // 'therapist' | 'admin' | ...
  therapistRole?: string;
}

function getJwtKey(): Uint8Array {
  return new TextEncoder().encode(requireSecret('JWT_SECRET'));
}

export async function signSessionToken(
  payload: SessionPayload,
  expiresIn: string = '8h'
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtKey());
}

// Verify signature + expiration. Returns the decoded payload or null.
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: [JWT_ALG],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
