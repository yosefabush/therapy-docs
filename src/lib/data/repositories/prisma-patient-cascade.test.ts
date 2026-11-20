import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Prisma stub: every delegate records its calls; $transaction resolves the
// array of queued operations (like the real batch form).
const calls: string[] = [];
const created: Record<string, unknown>[] = [];
let patientDeleteCount = 1;
let failTransaction = false;

vi.mock('../prisma', () => {
  const del = (model: string, count: () => number) => ({
    deleteMany: (args: { where: Record<string, string> }) => {
      calls.push(`${model}.deleteMany(${JSON.stringify(args.where)})`);
      return Promise.resolve({ count: count() });
    },
  });
  const noop = {};
  return {
    USE_PRISMA: true,
    prisma: {
      user: noop,
      patient: del('patient', () => patientDeleteCount),
      session: del('session', () => 2),
      treatmentGoal: del('treatmentGoal', () => 1),
      report: del('report', () => 1),
      voiceRecording: {
        ...del('voiceRecording', () => 1),
        create: ({ data }: { data: Record<string, unknown> }) => {
          created.push(data);
          return Promise.resolve(data);
        },
      },
      patientDocument: del('patientDocument', () => 1),
      patientInsights: del('patientInsights', () => 1),
      $transaction: async (ops: Promise<unknown>[]) => {
        calls.push('$transaction');
        if (failTransaction) throw new Error('boom');
        return Promise.all(ops);
      },
    },
  };
});

import { patientPrismaRepository, voiceRecordingPrismaRepository } from './prisma.repositories';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
});

beforeEach(() => {
  calls.length = 0;
  created.length = 0;
  patientDeleteCount = 1;
  failTransaction = false;
});

describe('Prisma mode: deleting a patient', () => {
  it('removes all dependent rows and the patient in a single transaction', async () => {
    expect(await patientPrismaRepository.delete('p1')).toBe(true);
    expect(calls).toEqual([
      'session.deleteMany({"patientId":"p1"})',
      'treatmentGoal.deleteMany({"patientId":"p1"})',
      'report.deleteMany({"patientId":"p1"})',
      'voiceRecording.deleteMany({"patientId":"p1"})',
      'patientDocument.deleteMany({"patientId":"p1"})',
      'patientInsights.deleteMany({"patientId":"p1"})',
      'patient.deleteMany({"id":"p1"})',
      '$transaction',
    ]);
  });

  it('returns false when the patient does not exist or the transaction fails', async () => {
    patientDeleteCount = 0;
    expect(await patientPrismaRepository.delete('missing')).toBe(false);
    patientDeleteCount = 1;
    failTransaction = true;
    expect(await patientPrismaRepository.delete('p1')).toBe(false);
  });
});

describe('Prisma mode: voice recordings are encrypted in the stored payload', () => {
  it('writes ciphertext for audio and transcripts, plaintext for metadata', async () => {
    await voiceRecordingPrismaRepository.create({
      sessionId: 's1',
      patientId: 'p1',
      duration: 3,
      encryptedAudioUrl: 'data:audio/webm;base64,SECRETAUDIO',
      transcriptionStatus: 'completed',
      encryptedTranscript: 'secret words',
      consentObtained: true,
    });
    const row = created[0] as { sessionId: string; payload: Record<string, unknown> };
    const raw = JSON.stringify(row.payload);
    expect(raw).not.toContain('SECRETAUDIO');
    expect(raw).not.toContain('secret words');
    expect(String(row.payload.encryptedAudioUrl).startsWith('enc:v1:')).toBe(true);
    expect(row.sessionId).toBe('s1');
  });
});
