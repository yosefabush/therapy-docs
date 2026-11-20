// One-off / idempotent backfill: encrypts legacy plaintext voice recordings at
// rest (audio data URL + transcripts). Already-encrypted fields are left
// untouched, so it is safe to run on every start.
//   Postgres:   DATABASE_URL=... ENCRYPTION_KEY=... node scripts/encrypt-recordings.mjs
//   JSON store: ENCRYPTION_KEY=... node scripts/encrypt-recordings.mjs   (rewrites data/voice-recordings.json)

import { readFile, writeFile, rename } from 'fs/promises';
import path from 'path';
import { encryptRecording, needsEncryption } from './lib/recording-crypto.mjs';

async function backfillDb() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    let updated = 0;
    // One row at a time: payloads carry base64 audio and can be several MB.
    const ids = await prisma.voiceRecording.findMany({ select: { id: true } });
    for (const { id } of ids) {
      const row = await prisma.voiceRecording.findUnique({ where: { id }, select: { payload: true } });
      if (!row || !needsEncryption(row.payload)) continue;
      await prisma.voiceRecording.update({ where: { id }, data: { payload: encryptRecording(row.payload) } });
      updated++;
    }
    return updated;
  } finally {
    await prisma.$disconnect();
  }
}

async function backfillJson() {
  const file = path.resolve('data', 'voice-recordings.json');
  let recordings;
  try {
    recordings = JSON.parse(await readFile(file, 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') return 0;
    throw e;
  }
  const updated = recordings.filter(needsEncryption).length;
  if (updated === 0) return 0;
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(recordings.map((r) => (needsEncryption(r) ? encryptRecording(r) : r)), null, 2), 'utf-8');
  await rename(tmp, file);
  return updated;
}

const mode = process.env.DATABASE_URL ? 'postgres' : 'json';
(mode === 'postgres' ? backfillDb() : backfillJson())
  .then((n) => console.log(`[encrypt-recordings] ${mode}: encrypted ${n} plaintext recording(s)`))
  .catch((e) => {
    console.error('[encrypt-recordings] failed:', e);
    process.exit(1);
  });
