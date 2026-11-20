import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// In-memory stand-in for the JSON file store.
const files = new Map<string, unknown[]>();
vi.mock('../json-store', () => ({
  readJsonFile: async (name: string) => structuredClone(files.get(name) ?? []),
  writeJsonFile: async (name: string, data: unknown[]) => {
    files.set(name, structuredClone(data));
  },
}));

import { patientRepository } from './patient.repository';
import { voiceRecordingRepository } from './voice-recording.repository';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
});

function seed() {
  files.clear();
  files.set('patients.json', [
    { id: 'p1', idNumber: '011111111', assignedTherapists: ['t1'] },
    { id: 'p2', idNumber: '022222222', assignedTherapists: ['t1'] },
  ]);
  files.set('sessions.json', [
    { id: 's1', patientId: 'p1' },
    { id: 's2', patientId: 'p1' },
    { id: 's3', patientId: 'p2' },
  ]);
  files.set('treatment-goals.json', [
    { id: 'g1', patientId: 'p1' },
    { id: 'g2', patientId: 'p2' },
  ]);
  files.set('reports.json', [
    { id: 'r1', patientId: 'p1' },
    { id: 'r2', patientId: 'p2' },
  ]);
  files.set('voice-recordings.json', [
    { id: 'v1', patientId: 'p1', sessionId: 's1', encryptedAudioUrl: 'data:audio/webm;base64,AAAA' },
    { id: 'v2', patientId: 'p2', sessionId: 's3', encryptedAudioUrl: 'data:audio/webm;base64,BBBB' },
  ]);
  files.set('patient-insights.json', [
    { id: 'i1', patientId: 'p1', generatedAt: '2026-01-01T00:00:00Z' },
    { id: 'i2', patientId: 'p2', generatedAt: '2026-01-01T00:00:00Z' },
  ]);
}

const ids = (file: string) => (files.get(file) as { id: string }[]).map((x) => x.id);

describe('JSON mode: deleting a patient cascades', () => {
  beforeEach(seed);

  it('removes the patient and all its sessions, goals, reports, recordings and insights', async () => {
    expect(await patientRepository.delete('p1')).toBe(true);

    expect(ids('patients.json')).toEqual(['p2']);
    expect(ids('sessions.json')).toEqual(['s3']);
    expect(ids('treatment-goals.json')).toEqual(['g2']);
    expect(ids('reports.json')).toEqual(['r2']);
    expect(ids('voice-recordings.json')).toEqual(['v2']);
    expect(ids('patient-insights.json')).toEqual(['i2']);
  });

  it('leaves other patients data untouched and returns false for an unknown patient', async () => {
    expect(await patientRepository.delete('nope')).toBe(false);
    expect(ids('patients.json')).toEqual(['p1', 'p2']);
    expect(ids('sessions.json')).toHaveLength(3);
    expect(ids('voice-recordings.json')).toHaveLength(2);
  });

  it('deleting an unrelated session/recording never decrypts or rewrites other rows', async () => {
    await voiceRecordingRepository.update('v1', { duration: 5 });
    const raw = files.get('voice-recordings.json') as { id: string; encryptedAudioUrl: string }[];
    expect(raw.find((r) => r.id === 'v1')!.encryptedAudioUrl.startsWith('enc:v1:')).toBe(true);
    // v2 was never touched, so it is still the legacy plaintext it started as.
    expect(raw.find((r) => r.id === 'v2')!.encryptedAudioUrl).toBe('data:audio/webm;base64,BBBB');
    expect((await voiceRecordingRepository.findById('v1'))!.encryptedAudioUrl).toBe('data:audio/webm;base64,AAAA');
  });
});
