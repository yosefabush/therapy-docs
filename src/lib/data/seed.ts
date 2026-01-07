import { writeJsonFile, fileExists } from './json-store';
import {
  mockUsers,
  mockPatients,
  mockSessions,
  mockTreatmentGoals,
  mockReports,
} from '@/lib/mock-data';

export async function seedIfEmpty(): Promise<boolean> {
  // Check if data already exists
  const usersExist = await fileExists('users.json');
  const patientsExist = await fileExists('patients.json');

  if (usersExist && patientsExist) {
    return false; // Already seeded
  }

  // Seed all collections
  await writeJsonFile('users.json', mockUsers);
  await writeJsonFile('patients.json', mockPatients);
  await writeJsonFile('sessions.json', mockSessions);
  await writeJsonFile('treatment-goals.json', mockTreatmentGoals);
  await writeJsonFile('reports.json', mockReports);

  console.log('Database seeded with mock data');
  return true;
}

export async function resetData(): Promise<void> {
  await writeJsonFile('users.json', mockUsers);
  await writeJsonFile('patients.json', mockPatients);
  await writeJsonFile('sessions.json', mockSessions);
  await writeJsonFile('treatment-goals.json', mockTreatmentGoals);
  await writeJsonFile('reports.json', mockReports);
  console.log('Database reset to mock data');
}
