// Server-side session invalidation. A session JWT is stateless, so logging out
// only clearing the cookie would leave a copied token valid until it expires.
// Logout therefore records the token's `jti` here and every authenticated
// request rejects listed tokens.
//
// Backed by Postgres (RevokedToken table) when DATABASE_URL is set, otherwise
// by a `revoked-tokens.json` file. Entries are purged once the token has
// expired, so the store stays small.

import { readJsonFile, writeJsonFile } from '@/lib/data/json-store';
import { USE_PRISMA, prisma } from '@/lib/data/prisma';

const REVOKED_FILE = 'revoked-tokens.json';

interface RevokedEntry {
  jti: string;
  expiresAt: Date;
}

export async function revokeToken(jti: string, expiresAt: Date): Promise<void> {
  const now = new Date();
  if (USE_PRISMA) {
    await prisma.revokedToken.upsert({
      where: { jti },
      create: { jti, expiresAt },
      update: {},
    });
    // Housekeeping: tokens past their expiry are rejected by the signature check anyway.
    await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: now } } });
    return;
  }
  const entries = (await readJsonFile<RevokedEntry>(REVOKED_FILE)).filter(
    (e) => new Date(e.expiresAt) > now && e.jti !== jti
  );
  entries.push({ jti, expiresAt });
  await writeJsonFile(REVOKED_FILE, entries);
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (USE_PRISMA) {
    return (await prisma.revokedToken.findUnique({ where: { jti } })) !== null;
  }
  const entries = await readJsonFile<RevokedEntry>(REVOKED_FILE);
  return entries.some((e) => e.jti === jti);
}
