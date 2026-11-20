import { Patient } from '@/types';
import { JsonRepository } from './base.repository';
import { encryptPatientForStorage, decryptPatientFromStorage } from '../patient-crypto';
import { sessionRepository } from './session.repository';
import { treatmentGoalRepository } from './treatment-goal.repository';
import { reportRepository } from './report.repository';
import { voiceRecordingRepository } from './voice-recording.repository';
import { patientDocumentRepository } from './patient-document.repository';
import { patientInsightsRepository } from './patient-insights.repository';

class PatientJsonRepository extends JsonRepository<Patient> {
  constructor() {
    super('patients.json');
  }

  protected fromStored(p: Patient): Patient {
    return decryptPatientFromStorage(p);
  }

  protected toStored(p: Patient): Patient {
    return encryptPatientForStorage(p);
  }

  async findByTherapist(therapistId: string): Promise<Patient[]> {
    return this.findMany(p => p.assignedTherapists.includes(therapistId));
  }

  async findByStatus(status: Patient['status']): Promise<Patient[]> {
    return this.findMany(p => p.status === status);
  }

  // Deleting a patient removes everything keyed to it (sessions, goals,
  // reports, voice recordings, documents, insights). Children go first and the patient
  // last, so an interrupted delete leaves the patient present and a retry
  // finishes the job (the JSON files cannot be changed in one transaction).
  async delete(id: string): Promise<boolean> {
    const byPatient = (item: { patientId: string }) => item.patientId === id;
    await sessionRepository.deleteMany(byPatient);
    await treatmentGoalRepository.deleteMany(byPatient);
    await reportRepository.deleteMany(byPatient);
    await voiceRecordingRepository.deleteMany(byPatient);
    await patientDocumentRepository.deleteMany(byPatient);
    await patientInsightsRepository.deleteMany(byPatient);
    return super.delete(id);
  }

  protected generateId(): string {
    return `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const patientRepository = new PatientJsonRepository();
