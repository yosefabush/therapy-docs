import { Session } from '@/types';
import { JsonRepository } from './base.repository';

class SessionJsonRepository extends JsonRepository<Session> {
  constructor() {
    super('sessions.json');
  }

  async findByPatient(patientId: string): Promise<Session[]> {
    return this.findMany(s => s.patientId === patientId);
  }

  async findByTherapist(therapistId: string): Promise<Session[]> {
    return this.findMany(s => s.therapistId === therapistId);
  }

  async findByDateRange(start: Date, end: Date): Promise<Session[]> {
    return this.findMany(s => {
      const sessionDate = new Date(s.scheduledAt);
      return sessionDate >= start && sessionDate <= end;
    });
  }

  protected generateId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sessionRepository = new SessionJsonRepository();
