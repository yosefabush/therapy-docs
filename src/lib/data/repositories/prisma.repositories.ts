import {
  User,
  Patient,
  Session,
  TreatmentGoal,
  Report,
  VoiceRecording,
  PatientInsights,
} from '@/types';
import { prisma } from '../prisma';
import { reviveDates } from '../revive';
import { PrismaRepository, type PayloadDelegate } from './prisma-base.repository';

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
  async findByTherapist(therapistId: string): Promise<Patient[]> {
    const rows = await prisma.patient.findMany({
      where: { assignedTherapists: { has: therapistId } },
    });
    return mapRows<Patient>(rows);
  }
  async findByStatus(status: Patient['status']): Promise<Patient[]> {
    const rows = await prisma.patient.findMany({ where: { status } });
    return mapRows<Patient>(rows);
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
  async findBySession(sessionId: string): Promise<VoiceRecording[]> {
    return mapRows<VoiceRecording>(
      await prisma.voiceRecording.findMany({ where: { sessionId } })
    );
  }
  async findByPatient(patientId: string): Promise<VoiceRecording[]> {
    return mapRows<VoiceRecording>(
      await prisma.voiceRecording.findMany({ where: { patientId } })
    );
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

export const userPrismaRepository = new UserPrismaRepository();
export const patientPrismaRepository = new PatientPrismaRepository();
export const sessionPrismaRepository = new SessionPrismaRepository();
export const treatmentGoalPrismaRepository = new TreatmentGoalPrismaRepository();
export const reportPrismaRepository = new ReportPrismaRepository();
export const voiceRecordingPrismaRepository = new VoiceRecordingPrismaRepository();
export const patientInsightsPrismaRepository = new PatientInsightsPrismaRepository();
