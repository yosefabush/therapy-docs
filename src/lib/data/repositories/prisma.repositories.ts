import {
  User,
  Patient,
  Session,
  TreatmentGoal,
  Report,
  VoiceRecording,
  PatientInsights,
  PatientDocument,
} from '@/types';
import { prisma } from '../prisma';
import { reviveDates } from '../revive';
import { PrismaRepository, type PayloadDelegate } from './prisma-base.repository';
import { encryptPatientForStorage, decryptPatientFromStorage } from '../patient-crypto';
import type { NewPatientDocument, PatientDocumentStore } from './document-store';
import {
  encryptDocumentName,
  decryptDocumentName,
  encryptDocumentContent,
  decryptDocumentContent,
} from '../document-crypto';
import { encryptRecordingForStorage, decryptRecordingFromStorage } from '../recording-crypto';

const rid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

function mapRows<T>(rows: Array<{ payload: unknown }>): T[] {
  return rows.map((r) => reviveDates(r.payload) as T);
}

// --- User -----------------------------------------------------------------
class UserPrismaRepository extends PrismaRepository<User> {
  constructor() {
    super(prisma.user as unknown as PayloadDelegate);
  }
  protected extractScalars(u: User) {
    return { email: u.email };
  }
  protected generateId() {
    return rid('user');
  }
  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? (reviveDates(row.payload) as unknown as User) : null;
  }
}

// --- Patient --------------------------------------------------------------
class PatientPrismaRepository extends PrismaRepository<Patient> {
  constructor() {
    super(prisma.patient as unknown as PayloadDelegate);
  }
  protected extractScalars(p: Patient) {
    return { status: p.status, assignedTherapists: p.assignedTherapists };
  }
  protected generateId() {
    return rid('patient');
  }
  protected rowToEntity(row: { payload: unknown }): Patient {
    return decryptPatientFromStorage(super.rowToEntity(row));
  }
  protected toStoredPayload(p: Patient): Patient {
    return encryptPatientForStorage(p);
  }
  async findByTherapist(therapistId: string): Promise<Patient[]> {
    const rows = await prisma.patient.findMany({
      where: { assignedTherapists: { has: therapistId } },
    });
    return rows.map((r) => this.rowToEntity(r));
  }
  async findByStatus(status: Patient['status']): Promise<Patient[]> {
    const rows = await prisma.patient.findMany({ where: { status } });
    return rows.map((r) => this.rowToEntity(r));
  }
  // Deleting a patient removes everything keyed to it (sessions, goals,
  // reports, voice recordings, documents, insights) in one transaction: either all of it
  // goes or nothing does. There are no FK constraints, so this is done here
  // rather than by a schema cascade.
  async delete(id: string): Promise<boolean> {
    try {
      const results = await prisma.$transaction([
        prisma.session.deleteMany({ where: { patientId: id } }),
        prisma.treatmentGoal.deleteMany({ where: { patientId: id } }),
        prisma.report.deleteMany({ where: { patientId: id } }),
        prisma.voiceRecording.deleteMany({ where: { patientId: id } }),
        prisma.patientDocument.deleteMany({ where: { patientId: id } }),
        prisma.patientInsights.deleteMany({ where: { patientId: id } }),
        prisma.patient.deleteMany({ where: { id } }),
      ]);
      return results[results.length - 1].count > 0;
    } catch {
      return false;
    }
  }
}

// --- Session --------------------------------------------------------------
class SessionPrismaRepository extends PrismaRepository<Session> {
  constructor() {
    super(prisma.session as unknown as PayloadDelegate);
  }
  protected extractScalars(s: Session) {
    return {
      patientId: s.patientId,
      therapistId: s.therapistId,
      status: s.status,
      scheduledAt: new Date(s.scheduledAt),
    };
  }
  protected generateId() {
    return rid('session');
  }
  async findByPatient(patientId: string): Promise<Session[]> {
    return mapRows<Session>(await prisma.session.findMany({ where: { patientId } }));
  }
  async findByTherapist(therapistId: string): Promise<Session[]> {
    return mapRows<Session>(await prisma.session.findMany({ where: { therapistId } }));
  }
  async findByDateRange(start: Date, end: Date): Promise<Session[]> {
    return mapRows<Session>(
      await prisma.session.findMany({ where: { scheduledAt: { gte: start, lte: end } } })
    );
  }
}

// --- TreatmentGoal --------------------------------------------------------
class TreatmentGoalPrismaRepository extends PrismaRepository<TreatmentGoal> {
  constructor() {
    super(prisma.treatmentGoal as unknown as PayloadDelegate);
  }
  protected extractScalars(g: TreatmentGoal) {
    return { patientId: g.patientId };
  }
  protected generateId() {
    return rid('goal');
  }
  async findByPatient(patientId: string): Promise<TreatmentGoal[]> {
    return mapRows<TreatmentGoal>(
      await prisma.treatmentGoal.findMany({ where: { patientId } })
    );
  }
}

// --- Report ---------------------------------------------------------------
class ReportPrismaRepository extends PrismaRepository<Report> {
  constructor() {
    super(prisma.report as unknown as PayloadDelegate);
  }
  protected extractScalars(r: Report) {
    return { patientId: r.patientId };
  }
  protected generateId() {
    return rid('report');
  }
  async findByPatient(patientId: string): Promise<Report[]> {
    return mapRows<Report>(await prisma.report.findMany({ where: { patientId } }));
  }
}

// --- VoiceRecording -------------------------------------------------------
class VoiceRecordingPrismaRepository extends PrismaRepository<VoiceRecording> {
  constructor() {
    super(prisma.voiceRecording as unknown as PayloadDelegate);
  }
  protected extractScalars(v: VoiceRecording) {
    return { sessionId: v.sessionId, patientId: v.patientId };
  }
  protected generateId() {
    return rid('recording');
  }
  // Audio and transcripts are encrypted at rest (see recording-crypto.ts).
  protected rowToEntity(row: { payload: unknown }): VoiceRecording {
    return decryptRecordingFromStorage(super.rowToEntity(row));
  }
  protected toStoredPayload(v: VoiceRecording): VoiceRecording {
    return encryptRecordingForStorage(v);
  }
  async findBySession(sessionId: string): Promise<VoiceRecording[]> {
    const rows = await prisma.voiceRecording.findMany({ where: { sessionId } });
    return rows.map((r) => this.rowToEntity(r));
  }
  async findByPatient(patientId: string): Promise<VoiceRecording[]> {
    const rows = await prisma.voiceRecording.findMany({ where: { patientId } });
    return rows.map((r) => this.rowToEntity(r));
  }
}

// --- PatientInsights ------------------------------------------------------
class PatientInsightsPrismaRepository extends PrismaRepository<PatientInsights> {
  constructor() {
    super(prisma.patientInsights as unknown as PayloadDelegate);
  }
  protected extractScalars(i: PatientInsights) {
    return { patientId: i.patientId, generatedAt: new Date(i.generatedAt) };
  }
  protected generateId() {
    return rid('insights');
  }
  async findByPatientId(patientId: string): Promise<PatientInsights | null> {
    const row = await prisma.patientInsights.findFirst({
      where: { patientId },
      orderBy: { generatedAt: 'desc' },
    });
    return row ? (reviveDates(row.payload) as unknown as PatientInsights) : null;
  }
  async saveForPatient(insights: PatientInsights): Promise<PatientInsights> {
    const existing = await this.findByPatientId(insights.patientId);
    if (existing) {
      const updated = await this.update(existing.id, {
        ...insights,
        savedAt: insights.savedAt || new Date(),
      });
      return updated!;
    }
    const { id: _id, ...rest } = { ...insights, savedAt: insights.savedAt || new Date() };
    void _id;
    return this.create(rest as Omit<PatientInsights, 'id' | 'createdAt' | 'updatedAt'>);
  }
  async deleteByPatientId(patientId: string): Promise<void> {
    const existing = await this.findByPatientId(patientId);
    if (existing) await this.delete(existing.id);
  }
}

// --- Patient documents ------------------------------------------------------
// Not a PrismaRepository: the (large, encrypted) `content` column lives beside
// the metadata payload and is selected only when a file is downloaded, so
// listing a patient's documents never loads file bytes.
interface DocumentMetaPayload {
  encryptedName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
}

function documentRowToMeta(row: {
  id: string;
  patientId: string;
  payload: unknown;
  createdAt: Date;
}): PatientDocument {
  const p = row.payload as DocumentMetaPayload;
  return {
    id: row.id,
    patientId: row.patientId,
    name: decryptDocumentName(p.encryptedName),
    mimeType: p.mimeType,
    size: p.size,
    uploadedBy: p.uploadedBy,
    createdAt: row.createdAt,
  };
}

class PatientDocumentPrismaRepository implements PatientDocumentStore {
  async add(input: NewPatientDocument): Promise<PatientDocument> {
    const payload: DocumentMetaPayload = {
      encryptedName: encryptDocumentName(input.name),
      mimeType: input.mimeType,
      size: input.bytes.length,
      uploadedBy: input.uploadedBy,
    };
    const row = await prisma.patientDocument.create({
      data: {
        id: rid('document'),
        patientId: input.patientId,
        payload: payload as unknown as object,
        content: encryptDocumentContent(input.bytes),
      },
      select: { id: true, patientId: true, payload: true, createdAt: true },
    });
    return documentRowToMeta(row);
  }
  async listByPatient(patientId: string): Promise<PatientDocument[]> {
    const rows = await prisma.patientDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, patientId: true, payload: true, createdAt: true },
    });
    return rows.map(documentRowToMeta);
  }
  async findById(id: string): Promise<PatientDocument | null> {
    const row = await prisma.patientDocument.findUnique({
      where: { id },
      select: { id: true, patientId: true, payload: true, createdAt: true },
    });
    return row ? documentRowToMeta(row) : null;
  }
  async readContent(id: string): Promise<Buffer | null> {
    const row = await prisma.patientDocument.findUnique({
      where: { id },
      select: { content: true },
    });
    return row ? decryptDocumentContent(row.content) : null;
  }
  async delete(id: string): Promise<boolean> {
    const result = await prisma.patientDocument.deleteMany({ where: { id } });
    return result.count > 0;
  }
}

export const userPrismaRepository = new UserPrismaRepository();
export const patientPrismaRepository = new PatientPrismaRepository();
export const sessionPrismaRepository = new SessionPrismaRepository();
export const treatmentGoalPrismaRepository = new TreatmentGoalPrismaRepository();
export const reportPrismaRepository = new ReportPrismaRepository();
export const voiceRecordingPrismaRepository = new VoiceRecordingPrismaRepository();
export const patientInsightsPrismaRepository = new PatientInsightsPrismaRepository();
export const patientDocumentPrismaRepository = new PatientDocumentPrismaRepository();
