import { TreatmentGoal } from '@/types';
import { JsonRepository } from './base.repository';

class TreatmentGoalJsonRepository extends JsonRepository<TreatmentGoal> {
  constructor() {
    super('treatment-goals.json');
  }

  async findByPatient(patientId: string): Promise<TreatmentGoal[]> {
    return this.findMany(g => g.patientId === patientId);
  }

  protected generateId(): string {
    return `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const treatmentGoalRepository = new TreatmentGoalJsonRepository();
