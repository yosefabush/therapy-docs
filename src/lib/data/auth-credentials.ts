// Credential store, backed by Postgres (Prisma) when DATABASE_URL is set,
// otherwise by the auth-credentials.json file. Emails are normalized to
// lower-case in storage.

import { USE_PRISMA, prisma } from './prisma';
import { readJsonFile, writeJsonFile } from './json-store';

export interface AuthCredential {
  id: string;
  email: string;
  password: string;
}

const FILE = 'auth-credentials.json';

export async function findCredentialByEmail(
  email: string
): Promise<AuthCredential | null> {
  const e = email.toLowerCase();
  if (USE_PRISMA) {
    const c = await prisma.authCredential.findUnique({ where: { email: e } });
    return c ? { id: c.id, email: c.email, password: c.password } : null;
  }
  const creds = await readJsonFile<AuthCredential>(FILE);
  return creds.find((c) => c.email.toLowerCase() === e) ?? null;
}

export async function createCredential(cred: AuthCredential): Promise<void> {
  const email = cred.email.toLowerCase();
  if (USE_PRISMA) {
    await prisma.authCredential.create({
      data: { id: cred.id, email, password: cred.password },
    });
    return;
  }
  const creds = await readJsonFile<AuthCredential>(FILE);
  creds.push({ ...cred, email });
  await writeJsonFile(FILE, creds);
}

export async function updateCredentialPassword(
  email: string,
  password: string
): Promise<void> {
  const e = email.toLowerCase();
  if (USE_PRISMA) {
    await prisma.authCredential.update({ where: { email: e }, data: { password } });
    return;
  }
  const creds = await readJsonFile<AuthCredential>(FILE);
  const c = creds.find((x) => x.email.toLowerCase() === e);
  if (c) {
    c.password = password;
    await writeJsonFile(FILE, creds);
  }
}
