import { writeJsonFile, fileExists } from './json-store';
import { USE_PRISMA, prisma } from './prisma';
import { importJsonDataToDb } from './import-json';
import { logger } from '@/lib/logger';
import {
  mockUsers,
  mockPatients,
  mockSessions,
  mockTreatmentGoals,
  mockReports,
} from '@/lib/mock-data';

export async function seedIfEmpty(): Promise<boolean> {
  if (USE_PRISMA) {
    // Seed the database from the bundled JSON dataset on first run only.
    const count = await prisma.user.count();
    if (count > 0) return false;
    await importJsonDataToDb();
    logger.debug('Database seeded from bundled JSON dataset');
    return true;
  }

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
  await writeJsonFile('voice-recordings.json', []);

  logger.debug('Database seeded with mock data');
  return true;
}

export async function resetData(): Promise<void> {
  if (USE_PRISMA) {
    // Re-import the bundled dataset (upserts by id).
    await importJsonDataToDb();
    logger.debug('Database reset from bundled JSON dataset');
    return;
  }

  await writeJsonFile('users.json', mockUsers);
  await writeJsonFile('patients.json', mockPatients);
  await writeJsonFile('sessions.json', mockSessions);
  await writeJsonFile('treatment-goals.json', mockTreatmentGoals);
  await writeJsonFile('reports.json', mockReports);
  await writeJsonFile('voice-recordings.json', []);
  logger.debug('Database reset to mock data');
}
