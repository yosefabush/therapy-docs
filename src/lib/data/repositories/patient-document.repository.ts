import type { PatientDocument } from '@/types';
import { JsonRepository } from './base.repository';
import type { NewPatientDocument, PatientDocumentStore } from './document-store';
import {
  encryptDocumentName,
  decryptDocumentName,
  encryptDocumentContent,
  decryptDocumentContent,
} from '../document-crypto';

// Stored shape: the file name and the content are encrypted ("enc:v1:...").
export interface StoredPatientDocument {
  id: string;
  patientId: string;
  encryptedName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

function toMeta(row: StoredPatientDocument): PatientDocument {
  return {
    id: row.id,
    patientId: row.patientId,
    name: decryptDocumentName(row.encryptedName),
    mimeType: row.mimeType,
    size: row.size,
    uploadedBy: row.uploadedBy,
    createdAt: new Date(row.createdAt),
  };
}

class PatientDocumentJsonRepository extends JsonRepository<StoredPatientDocument> {
  constructor() {
    super('patient-documents.json');
  }

  async add(input: NewPatientDocument): Promise<PatientDocument> {
    const row = await super.create({
      patientId: input.patientId,
      encryptedName: encryptDocumentName(input.name),
      mimeType: input.mimeType,
      size: input.bytes.length,
      uploadedBy: input.uploadedBy,
      content: encryptDocumentContent(input.bytes),
    });
    return toMeta(row);
  }

  async listByPatient(patientId: string): Promise<PatientDocument[]> {
    const rows = await this.findMany((r) => r.patientId === patientId);
    return rows
      .map(toMeta)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById(id: string): Promise<PatientDocument | null> {
    const row = await super.findById(id);
    return row ? toMeta(row) : null;
  }

  async readContent(id: string): Promise<Buffer | null> {
    const row = await super.findById(id);
    return row ? decryptDocumentContent(row.content) : null;
  }

  protected generateId(): string {
    return `document-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

const jsonRepo = new PatientDocumentJsonRepository();

// Exposed through the PatientDocumentStore contract; `deleteMany` is kept for
// the patient-delete cascade.
export const patientDocumentRepository: PatientDocumentStore & {
  deleteMany: PatientDocumentJsonRepository['deleteMany'];
} = {
  add: (input) => jsonRepo.add(input),
  listByPatient: (patientId) => jsonRepo.listByPatient(patientId),
  findById: (id) => jsonRepo.getById(id),
  readContent: (id) => jsonRepo.readContent(id),
  delete: (id) => jsonRepo.delete(id),
  deleteMany: (predicate) => jsonRepo.deleteMany(predicate),
};
