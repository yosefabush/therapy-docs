// Repository selection: when DATABASE_URL is set the app uses the
// PostgreSQL/Prisma implementations; otherwise it falls back to the JSON file
// store. API routes import from here and are agnostic to the backend.

import { USE_PRISMA } from '../prisma';

import { userRepository as userJson } from './user.repository';
import { patientRepository as patientJson } from './patient.repository';
import { sessionRepository as sessionJson } from './session.repository';
import { treatmentGoalRepository as treatmentGoalJson } from './treatment-goal.repository';
import { reportRepository as reportJson } from './report.repository';
import { voiceRecordingRepository as voiceRecordingJson } from './voice-recording.repository';
import { patientInsightsRepository as patientInsightsJson } from './patient-insights.repository';

import {
  userPrismaRepository,
  patientPrismaRepository,
  sessionPrismaRepository,
  treatmentGoalPrismaRepository,
  reportPrismaRepository,
  voiceRecordingPrismaRepository,
  patientInsightsPrismaRepository,
} from './prisma.repositories';

export const userRepository = USE_PRISMA ? userPrismaRepository : userJson;
export const patientRepository = USE_PRISMA ? patientPrismaRepository : patientJson;
export const sessionRepository = USE_PRISMA ? sessionPrismaRepository : sessionJson;
export const treatmentGoalRepository = USE_PRISMA
  ? treatmentGoalPrismaRepository
  : treatmentGoalJson;
export const reportRepository = USE_PRISMA ? reportPrismaRepository : reportJson;
export const voiceRecordingRepository = USE_PRISMA
  ? voiceRecordingPrismaRepository
  : voiceRecordingJson;
export const patientInsightsRepository = USE_PRISMA
  ? patientInsightsPrismaRepository
  : patientInsightsJson;
