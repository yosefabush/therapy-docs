// Imports the bundled JSON dataset (data/*.json) into Postgres via Prisma.
// Idempotent (upsert by id). Usage:  DATABASE_URL=... node scripts/db-import.mjs
//
// Mirrors src/lib/data/import-json.ts for CLI / container use.

import { readFile } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.resolve('data');

async function read(file) {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf-8'));
  } catch {
    return [];
  }
}

const json = (o) => JSON.parse(JSON.stringify(o));

async function main() {
  for (const u of await read('users.json')) {
    const data = { email: String(u.email).toLowerCase(), payload: json(u) };
    await prisma.user.upsert({ where: { id: u.id }, create: { id: u.id, ...data }, update: data });
  }

  for (const c of await read('auth-credentials.json')) {
    const data = { email: c.email.toLowerCase(), password: c.password };
    await prisma.authCredential.upsert({ where: { id: c.id }, create: { id: c.id, ...data }, update: data });
  }

  for (const p of await read('patients.json')) {
    const data = { status: p.status, assignedTherapists: p.assignedTherapists ?? [], payload: json(p) };
    await prisma.patient.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }

  for (const s of await read('sessions.json')) {
    const data = {
      patientId: s.patientId,
      therapistId: s.therapistId,
      status: s.status,
      scheduledAt: new Date(s.scheduledAt),
      payload: json(s),
    };
    await prisma.session.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }

  for (const g of await read('treatment-goals.json')) {
    const data = { patientId: g.patientId, payload: json(g) };
    await prisma.treatmentGoal.upsert({ where: { id: g.id }, create: { id: g.id, ...data }, update: data });
  }

  for (const r of await read('reports.json')) {
    const data = { patientId: r.patientId, payload: json(r) };
    await prisma.report.upsert({ where: { id: r.id }, create: { id: r.id, ...data }, update: data });
  }

  for (const v of await read('voice-recordings.json')) {
    const data = { sessionId: v.sessionId, patientId: v.patientId, payload: json(v) };
    await prisma.voiceRecording.upsert({ where: { id: v.id }, create: { id: v.id, ...data }, update: data });
  }

  for (const i of await read('patient-insights.json')) {
    const data = { patientId: i.patientId, generatedAt: new Date(i.generatedAt), payload: json(i) };
    await prisma.patientInsights.upsert({ where: { id: i.id }, create: { id: i.id, ...data }, update: data });
  }

  const counts = {
    users: await prisma.user.count(),
    patients: await prisma.patient.count(),
    sessions: await prisma.session.count(),
    credentials: await prisma.authCredential.count(),
  };
  console.log('Imported:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
