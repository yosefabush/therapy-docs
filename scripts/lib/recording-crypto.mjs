// Plain-JS twin of src/lib/data/recording-crypto.ts for the CLI/container
// scripts that cannot import the TypeScript app code. Same stored format as
// patient idNumbers (`enc:v1:` + base64(salt|iv|tag|ct)); see
// patient-id-crypto.mjs. Covered by recording-crypto.test.ts.

import { encryptIdNumber, isEncryptedIdNumber } from './patient-id-crypto.mjs';

export const isEncryptedField = isEncryptedIdNumber;
export const encryptField = encryptIdNumber;

// Returns the recording in stored form (audio + transcripts encrypted).
// Already-encrypted fields are left untouched, so this is idempotent.
export function encryptRecording(rec) {
  const out = { ...rec };
  if (typeof rec.encryptedAudioUrl === 'string') {
    out.encryptedAudioUrl = encryptField(rec.encryptedAudioUrl);
  }
  if (typeof rec.encryptedTranscript === 'string') {
    out.encryptedTranscript = encryptField(rec.encryptedTranscript);
  }
  if (rec.diarizedTranscript && typeof rec.diarizedTranscript === 'object') {
    out.diarizedTranscript = encryptField(JSON.stringify(rec.diarizedTranscript));
  }
  return out;
}

// True when any sensitive field is still plaintext.
export function needsEncryption(rec) {
  return (
    (typeof rec.encryptedAudioUrl === 'string' && rec.encryptedAudioUrl !== '' && !isEncryptedField(rec.encryptedAudioUrl)) ||
    (typeof rec.encryptedTranscript === 'string' && rec.encryptedTranscript !== '' && !isEncryptedField(rec.encryptedTranscript)) ||
    (rec.diarizedTranscript != null && typeof rec.diarizedTranscript === 'object')
  );
}
