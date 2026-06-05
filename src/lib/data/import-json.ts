// Imports the bundled JSON dataset (data/*.json) into Postgres via Prisma.
// Idempotent: every record is upserted by id, so it is safe to run repeatedly
// (used both by the CLI seed script and by runtime auto-seeding).

import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { toJsonPayload } from './revive';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readCollection<T>(filename: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

type AnyRecord = Record<string, unknown> & { id: string };

export async function importJsonDataToDb(): Promise<void> {
  const users = await readCollection<AnyRecord>('users.json');
  for (const u of users) {
    const data = { email: String(u.email).toLowerCase(), payload: toJsonPayload(u) };
    await prisma.user.upsert({ where: { id: u.id }, create: { id: u.id, ...data }, update: data });
  }

  const creds = await readCollection<{ id: string; email: string; password: string }>(
    'auth-credentials.json'
  );
  for (const c of creds) {
    const data = { email: c.email.toLowerCase(), password: c.password };
    await prisma.authCredential.upsert({
      where: { id: c.id },
      create: { id: c.id, ...data },
      update: data,
    });
  }

  const patients = await readCollection<AnyRecord & { status: string; assignedTherapists: string[] }>(
    'patients.json'
  );
  for (const p of patients) {
    const data = {
      status: p.status,
      assignedTherapists: p.assignedTherapists ?? [],
      payload: toJsonPayload(p),
    };
    await prisma.patient.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }

  const sessions = await readCollection<
    AnyRecord & { patientId: string; therapistId: string; status: string; scheduledAt: string }
  >('sessions.json');
  for (const s of sessions) {
    const data = {
      patientId: s.patientId,
      therapistId: s.therapistId,
      status: s.status,
      scheduledAt: new Date(s.scheduledAt),
      payload: toJsonPayload(s),
    };
    await prisma.session.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }

  const goals = await readCollection<AnyRecord & { patientId: string }>('treatment-goals.json');
  for (const g of goals) {
    const data = { patientId: g.patientId, payload: toJsonPayload(g) };
    await prisma.treatmentGoal.upsert({ where: { id: g.id }, create: { id: g.id, ...data }, update: data });
  }

  const reports = await readCollection<AnyRecord & { patientId: string }>('reports.json');
  for (const r of reports) {
    const data = { patientId: r.patientId, payload: toJsonPayload(r) };
    await prisma.report.upsert({ where: { id: r.id }, create: { id: r.id, ...data }, update: data });
  }

  const recordings = await readCollection<AnyRecord & { sessionId: string; patientId: string }>(
    'voice-recordings.json'
  );
  for (const v of recordings) {
    const data = { sessionId: v.sessionId, patientId: v.patientId, payload: toJsonPayload(v) };
    await prisma.voiceRecording.upsert({
      where: { id: v.id },
      create: { id: v.id, ...data },
      update: data,
    });
  }

  const insights = await readCollection<AnyRecord & { patientId: string; generatedAt: string }>(
    'patient-insights.json'
  );
  for (const i of insights) {
    const data = {
      patientId: i.patientId,
      generatedAt: new Date(i.generatedAt),
      payload: toJsonPayload(i),
    };
    await prisma.patientInsights.upsert({
      where: { id: i.id },
      create: { id: i.id, ...data },
      update: data,
    });
  }
}
