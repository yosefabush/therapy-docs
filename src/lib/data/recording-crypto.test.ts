import { describe, it, expect, beforeAll } from 'vitest';
import {
  ENCRYPTED_FIELD_PREFIX,
  encryptField,
  decryptField,
  isEncryptedField,
  encryptRecordingForStorage,
  decryptRecordingFromStorage,
} from './recording-crypto';
// Plain-JS twin used by the CLI/container scripts; must stay format-compatible.
import {
  encryptRecording as encryptRecordingScript,
  needsEncryption,
} from '../../../scripts/lib/recording-crypto.mjs';
import type { VoiceRecording } from '@/types';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
});

const AUDIO = 'data:audio/webm;base64,' + 'QUJDREVGRw=='.repeat(1000);

function sample(): VoiceRecording {
  return {
    id: 'rec-1',
    sessionId: 's1',
    patientId: 'p1',
    duration: 42,
    encryptedAudioUrl: AUDIO,
    transcriptionStatus: 'completed',
    encryptedTranscript: 'המטופלת מדווחת על חרדה',
    diarizedTranscript: {
      utterances: [{ speaker: 0, transcript: 'שלום מה שלומך', start: 0, end: 1, confidence: 0.9 }],
      rawTranscript: 'שלום מה שלומך',
    },
    consentObtained: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  } as unknown as VoiceRecording;
}

describe('voice recording at-rest encryption', () => {
  it('round-trips a field and never stores the plaintext', () => {
    const stored = encryptField('hello transcript');
    expect(stored.startsWith(ENCRYPTED_FIELD_PREFIX)).toBe(true);
    expect(stored).not.toContain('hello transcript');
    expect(decryptField(stored)).toBe('hello transcript');
  });

  it('reads legacy plaintext unchanged and does not double-encrypt', () => {
    expect(isEncryptedField('plain')).toBe(false);
    expect(decryptField('plain')).toBe('plain');
    const stored = encryptField('x');
    expect(encryptField(stored)).toBe(stored);
  });

  it('encrypts audio, transcript and diarized transcript; leaves metadata readable', () => {
    const rec = sample();
    const stored = encryptRecordingForStorage(rec);
    const json = JSON.stringify(stored);

    expect(isEncryptedField(stored.encryptedAudioUrl)).toBe(true);
    expect(isEncryptedField(stored.encryptedTranscript)).toBe(true);
    expect(isEncryptedField(stored.diarizedTranscript)).toBe(true);
    expect(json).not.toContain('QUJDREVGRw');
    expect(json).not.toContain('חרדה');
    expect(json).not.toContain('שלום מה שלומך');
    expect(stored.sessionId).toBe('s1');
    expect(stored.patientId).toBe('p1');
    expect(stored.duration).toBe(42);
    expect(stored.transcriptionStatus).toBe('completed');
  });

  it('decrypts back to the original recording', () => {
    const rec = sample();
    expect(decryptRecordingFromStorage(encryptRecordingForStorage(rec))).toEqual(rec);
  });

  it('reads a legacy plaintext recording and handles missing optional fields', () => {
    const legacy = sample();
    expect(decryptRecordingFromStorage(legacy)).toEqual(legacy);
    const minimal = { ...sample(), encryptedTranscript: undefined, diarizedTranscript: undefined };
    const stored = encryptRecordingForStorage(minimal as VoiceRecording);
    expect(stored.encryptedTranscript).toBeUndefined();
    expect(decryptRecordingFromStorage(stored)).toEqual(minimal);
  });

  it('fails loudly when decrypted with the wrong key', () => {
    const stored = encryptRecordingForStorage(sample());
    process.env.ENCRYPTION_KEY = 'a-different-key';
    try {
      expect(() => decryptRecordingFromStorage(stored)).toThrow();
    } finally {
      process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
    }
  });

  it('ciphertext overhead stays small (base64 of AES-GCM adds ~4/3 + a fixed header)', () => {
    const stored = encryptRecordingForStorage(sample());
    const ratio = stored.encryptedAudioUrl.length / AUDIO.length;
    expect(ratio).toBeLessThan(1.4);
    expect(ratio).toBeGreaterThan(1.3);
  });

  it('values written by the backfill/seed scripts decrypt in the app and the script is idempotent', () => {
    const rec = sample();
    expect(needsEncryption(rec)).toBe(true);
    const viaScript = encryptRecordingScript(rec);
    expect(needsEncryption(viaScript)).toBe(false);
    expect(encryptRecordingScript(viaScript)).toEqual(viaScript);
    expect(decryptRecordingFromStorage(viaScript as VoiceRecording)).toEqual(rec);
  });
});
