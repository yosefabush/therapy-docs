// At-rest encryption for patient documents: the file bytes and the file name.
// Same scheme as the other encrypted fields (`enc:v1:` + AES-256-GCM with
// ENCRYPTION_KEY), but binary-safe (encryptBytes) so a file is stored at ~1.33x
// its size instead of being base64-encoded before encryption.
//
// Size, MIME type, patient id and uploader stay in plaintext metadata: they are
// needed to list documents and are not PHI on their own.

import { encryptBytes, decryptBytes } from '@/lib/security';
import { ENCRYPTED_FIELD_PREFIX, isEncryptedField, encryptField, decryptField } from './recording-crypto';

export function encryptDocumentName(name: string): string {
  return encryptField(name);
}

export function decryptDocumentName(stored: string): string {
  return decryptField(stored);
}

export function encryptDocumentContent(bytes: Buffer): string {
  return ENCRYPTED_FIELD_PREFIX + encryptBytes(bytes);
}

export function decryptDocumentContent(stored: string): Buffer {
  // Documents are new: there is no legacy plaintext form to fall back to.
  if (!isEncryptedField(stored)) {
    throw new Error('Document content is not encrypted');
  }
  return decryptBytes(stored.slice(ENCRYPTED_FIELD_PREFIX.length));
}
