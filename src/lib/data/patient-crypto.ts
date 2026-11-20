// At-rest encryption for the patient's national ID number (תעודת זהות).
//
// Stored form: `enc:v1:` + encryptData(idNumber) (AES-256-GCM, ENCRYPTION_KEY).
// Values without the prefix are legacy plaintext: they are returned as-is on
// read and encrypted on the next write (or by scripts/encrypt-patient-ids.mjs,
// which must keep producing this same format).

import { encryptData, decryptData } from '@/lib/security';
import type { Patient } from '@/types';

export const ENCRYPTED_ID_PREFIX = 'enc:v1:';

export function isEncryptedIdNumber(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_ID_PREFIX);
}

export function encryptIdNumber(value: string): string {
  if (!value || isEncryptedIdNumber(value)) return value;
  return ENCRYPTED_ID_PREFIX + encryptData(value);
}

export function decryptIdNumber(value: string): string {
  if (!isEncryptedIdNumber(value)) return value; // legacy plaintext
  return decryptData(value.slice(ENCRYPTED_ID_PREFIX.length));
}

export function encryptPatientForStorage<T extends Pick<Patient, 'idNumber'>>(patient: T): T {
  if (typeof patient.idNumber !== 'string') return patient;
  return { ...patient, idNumber: encryptIdNumber(patient.idNumber) };
}

export function decryptPatientFromStorage<T extends Pick<Patient, 'idNumber'>>(patient: T): T {
  if (typeof patient.idNumber !== 'string') return patient;
  return { ...patient, idNumber: decryptIdNumber(patient.idNumber) };
}
