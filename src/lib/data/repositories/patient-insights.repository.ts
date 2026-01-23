import { PatientInsights } from '@/types';
import { JsonRepository } from './base.repository';

class PatientInsightsJsonRepository extends JsonRepository<PatientInsights> {
  constructor() {
    super('patient-insights.json');
  }

  /**
   * Find insights by patient ID
   * Returns null if no saved insights exist
   */
  async findByPatientId(patientId: string): Promise<PatientInsights | null> {
    const insights = await this.findMany(i => i.patientId === patientId);
    // Return most recent if multiple exist (shouldn't happen, but just in case)
    if (insights.length === 0) return null;
    return insights.sort((a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    )[0];
  }

  /**
   * Save or update insights for a patient
   * If insights exist for this patient, update them; otherwise create new
   */
  async saveForPatient(insights: PatientInsights): Promise<PatientInsights> {
    const existing = await this.findByPatientId(insights.patientId);

    if (existing) {
      // Update existing insights
      const updated = await this.update(existing.id, {
        ...insights,
        savedAt: insights.savedAt || new Date(),
      });
      return updated!;
    } else {
      // Create new insights
      const toCreate = {
        ...insights,
        savedAt: insights.savedAt || new Date(),
      };
      // Remove id to let base repository generate one
      const { id: _id, ...dataWithoutId } = toCreate;
      void _id; // Explicitly unused
      return this.create(dataWithoutId as Omit<PatientInsights, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }

  /**
   * Delete insights for a patient (for regeneration cleanup)
   */
  async deleteByPatientId(patientId: string): Promise<void> {
    const existing = await this.findByPatientId(patientId);
    if (existing) {
      await this.delete(existing.id);
    }
  }

  protected generateId(): string {
    return `insights-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const patientInsightsRepository = new PatientInsightsJsonRepository();
