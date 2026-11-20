// At-rest encryption for voice recordings: the audio data URL and every
// transcript field. Same scheme as patient idNumbers (patient-crypto.ts):
// `enc:v1:` + encryptData(value) (AES-256-GCM, ENCRYPTION_KEY). Values without
// the prefix are legacy plaintext: they are read as-is and encrypted on the
// next write (or by scripts/encrypt-recordings.mjs, which must keep producing
// this same format).
//
// Stored shape of an encrypted recording:
//   encryptedAudioUrl   -> "enc:v1:<b64>"      (the whole data URL)
//   encryptedTranscript -> "enc:v1:<b64>"
//   diarizedTranscript  -> "enc:v1:<b64>"      (encrypted JSON of the object, so
//                                               rawTranscript and every utterance
//                                               are covered by one encryption)
// Sizes, status, ids and consent flags stay in plaintext for querying.

import { encryptData, decryptData } from '@/lib/security';
import type { VoiceRecording, DiarizedTranscript } from '@/types';

export const ENCRYPTED_FIELD_PREFIX = 'enc:v1:';

export function isEncryptedField(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_FIELD_PREFIX);
}

export function encryptField(value: string): string {
  if (!value || isEncryptedField(value)) return value;
  return ENCRYPTED_FIELD_PREFIX + encryptData(value);
}

export function decryptField(value: string): string {
  if (!isEncryptedField(value)) return value; // legacy plaintext
  return decryptData(value.slice(ENCRYPTED_FIELD_PREFIX.length));
}

export function encryptRecordingForStorage(rec: VoiceRecording): VoiceRecording {
  const out: Record<string, unknown> = { ...rec };
  if (typeof rec.encryptedAudioUrl === 'string') {
    out.encryptedAudioUrl = encryptField(rec.encryptedAudioUrl);
  }
  if (typeof rec.encryptedTranscript === 'string') {
    out.encryptedTranscript = encryptField(rec.encryptedTranscript);
  }
  const diarized: unknown = rec.diarizedTranscript;
  if (diarized && typeof diarized === 'object') {
    out.diarizedTranscript = encryptField(JSON.stringify(diarized));
  }
  return out as unknown as VoiceRecording;
}

export function decryptRecordingFromStorage(stored: VoiceRecording): VoiceRecording {
  const out: Record<string, unknown> = { ...stored };
  if (typeof stored.encryptedAudioUrl === 'string') {
    out.encryptedAudioUrl = decryptField(stored.encryptedAudioUrl);
  }
  if (typeof stored.encryptedTranscript === 'string') {
    out.encryptedTranscript = decryptField(stored.encryptedTranscript);
  }
  const diarized: unknown = stored.diarizedTranscript;
  if (isEncryptedField(diarized)) {
    out.diarizedTranscript = JSON.parse(decryptField(diarized)) as DiarizedTranscript;
  }
  return out as unknown as VoiceRecording;
}
