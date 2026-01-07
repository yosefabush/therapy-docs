import { Report } from '@/types';
import { JsonRepository } from './base.repository';

class ReportJsonRepository extends JsonRepository<Report> {
  constructor() {
    super('reports.json');
  }

  async findByPatient(patientId: string): Promise<Report[]> {
    return this.findMany(r => r.patientId === patientId);
  }

  protected generateId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const reportRepository = new ReportJsonRepository();
