import type { PatientDocument } from '@/types';

/** Input for storing a new document: raw bytes, encrypted by the repository. */
export interface NewPatientDocument {
  patientId: string;
  name: string;
  mimeType: string;
  uploadedBy: string;
  bytes: Buffer;
}

/** Backend-agnostic contract implemented by the JSON and Prisma stores. */
export interface PatientDocumentStore {
  add(input: NewPatientDocument): Promise<PatientDocument>;
  listByPatient(patientId: string): Promise<PatientDocument[]>;
  findById(id: string): Promise<PatientDocument | null>;
  /** Decrypted file bytes, or null if the document does not exist. */
  readContent(id: string): Promise<Buffer | null>;
  delete(id: string): Promise<boolean>;
}
