// One-off / idempotent backfill: encrypts any legacy plaintext patient
// idNumber at rest. Already-encrypted values are left untouched, so it is safe
// to run on every start.
//   Postgres:   DATABASE_URL=... ENCRYPTION_KEY=... node scripts/encrypt-patient-ids.mjs
//   JSON store: ENCRYPTION_KEY=... node scripts/encrypt-patient-ids.mjs   (rewrites data/patients.json)

import { readFile, writeFile, rename } from 'fs/promises';
import path from 'path';
import { encryptPatient, isEncryptedIdNumber } from './lib/patient-id-crypto.mjs';

const needsEncryption = (p) =>
  p && typeof p.idNumber === 'string' && p.idNumber && !isEncryptedIdNumber(p.idNumber);

async function backfillDb() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    let updated = 0;
    for (const row of await prisma.patient.findMany({ select: { id: true, payload: true } })) {
      if (!needsEncryption(row.payload)) continue;
      await prisma.patient.update({ where: { id: row.id }, data: { payload: encryptPatient(row.payload) } });
      updated++;
    }
    return updated;
  } finally {
    await prisma.$disconnect();
  }
}

async function backfillJson() {
  const file = path.resolve('data', 'patients.json');
  let patients;
  try {
    patients = JSON.parse(await readFile(file, 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') return 0;
    throw e;
  }
  const updated = patients.filter(needsEncryption).length;
  if (updated === 0) return 0;
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(patients.map((p) => (needsEncryption(p) ? encryptPatient(p) : p)), null, 2), 'utf-8');
  await rename(tmp, file);
  return updated;
}

const mode = process.env.DATABASE_URL ? 'postgres' : 'json';
(mode === 'postgres' ? backfillDb() : backfillJson())
  .then((n) => console.log(`[encrypt-patient-ids] ${mode}: encrypted ${n} plaintext idNumber value(s)`))
  .catch((e) => {
    console.error('[encrypt-patient-ids] failed:', e);
    process.exit(1);
  });
