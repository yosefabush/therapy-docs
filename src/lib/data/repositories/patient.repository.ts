import { Patient } from '@/types';
import { JsonRepository } from './base.repository';
import { encryptPatientForStorage, decryptPatientFromStorage } from '../patient-crypto';

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

  protected generateId(): string {
    return `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const patientRepository = new PatientJsonRepository();
