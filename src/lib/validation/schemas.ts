import { z } from 'zod';

/**
 * Allow-list request schemas for the write endpoints (POST/PUT).
 *
 * Every schema is a plain `z.object` (not passthrough): fields that are not
 * listed are STRIPPED, so a client can never smuggle `id`, `createdAt`,
 * `signedBy`, `generatedBy`, `aiSummary`, ... into a stored record. Fields that
 * need an authorization decision (assignedTherapists, therapistId, patientId)
 * are listed here but checked by the route handlers.
 */

export const THERAPIST_ROLES = [
  'psychologist', 'psychiatrist', 'social_worker', 'occupational_therapist',
  'speech_therapist', 'physical_therapist', 'counselor', 'art_therapist',
  'music_therapist', 'family_therapist',
] as const;

export const SESSION_TYPES = [
  'initial_assessment', 'individual_therapy', 'group_therapy', 'family_therapy',
  'evaluation', 'follow_up', 'crisis_intervention', 'discharge_planning',
] as const;

export const SESSION_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] as const;
export const SESSION_LOCATIONS = ['in_person', 'telehealth', 'home_visit'] as const;
export const PATIENT_STATUSES = ['active', 'inactive', 'discharged'] as const;
export const PATIENT_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export const REPORT_TYPES = [
  'progress_summary', 'discharge_summary', 'insurance_report', 'referral_report',
  'evaluation_report', 'treatment_summary', 'multidisciplinary_summary',
] as const;
export const REPORT_STATUSES = ['draft', 'finalized', 'signed'] as const;
export const GOAL_STATUSES = ['active', 'achieved', 'modified', 'discontinued'] as const;
export const TRANSCRIPTION_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;

const text = (max = 20000) => z.string().max(max);

// JSON dates arrive as ISO strings; accept anything `new Date()` can parse.
const dateString = z
  .string()
  .max(64)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: 'Invalid date' });

// ---------------------------------------------------------------- patients --

const patientFields = {
  idNumber: z.string().length(9, 'תעודת זהות חייבת להכיל 9 ספרות'),
  encryptedData: text(100000),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().max(40),
  gender: z.enum(PATIENT_GENDERS),
  primaryDiagnosis: text(500).optional(),
  referralSource: text(500).optional(),
  insuranceProvider: text(500).optional(),
  status: z.enum(PATIENT_STATUSES),
};

export const createPatientSchema = z.object({
  ...patientFields,
  assignedTherapists: z.array(z.string().min(1).max(100)).min(1).max(50),
  status: z.enum(PATIENT_STATUSES).default('active'),
});

/** Fields any assigned therapist may edit. `assignedTherapists` is admin-only. */
export const updatePatientSchema = z
  .object({
    ...patientFields,
    assignedTherapists: z.array(z.string().min(1).max(100)).min(1).max(50),
  })
  .partial();

// ---------------------------------------------------------------- sessions --

export const sessionNotesSchema = z.object({
  chiefComplaint: text().optional(),
  subjective: text().default(''),
  objective: text().default(''),
  assessment: text().default(''),
  plan: text().default(''),
  interventionsUsed: z.array(text(500)).max(100).default([]),
  progressTowardGoals: text().optional(),
  riskAssessment: z
    .object({
      suicidalIdeation: z.enum(['none', 'passive', 'active_no_plan', 'active_with_plan']),
      homicidalIdeation: z.enum(['none', 'present']),
      selfHarm: z.enum(['none', 'history', 'current']),
      substanceUse: z.enum(['none', 'active', 'in_recovery']),
      safetyPlanReviewed: z.boolean(),
      notes: text().optional(),
    })
    .optional(),
  medications: z
    .array(
      z.object({
        name: text(300),
        dosage: text(300),
        frequency: text(300),
        prescribedBy: text(300).optional(),
        sideEffects: text(1000).optional(),
      })
    )
    .max(100)
    .optional(),
  homework: text().optional(),
  nextSessionPlan: text().optional(),
});

export const createSessionSchema = z.object({
  patientId: z.string().min(1),
  therapistId: z.string().min(1),
  therapistRole: z.enum(THERAPIST_ROLES),
  sessionType: z.enum(SESSION_TYPES),
  scheduledAt: dateString,
  duration: z.number().min(15).max(180).default(50),
  // A session is always created unsigned (signedAt/signedBy are not accepted).
  status: z.enum(SESSION_STATUSES).default('scheduled'),
  location: z.enum(SESSION_LOCATIONS).default('in_person'),
  notes: sessionNotesSchema.optional(),
});

export const updateSessionSchema = z
  .object({
    patientId: z.string().min(1),
    therapistId: z.string().min(1),
    therapistRole: z.enum(THERAPIST_ROLES),
    sessionType: z.enum(SESSION_TYPES),
    scheduledAt: dateString,
    startedAt: dateString,
    endedAt: dateString,
    duration: z.number().min(15).max(180),
    status: z.enum(SESSION_STATUSES),
    location: z.enum(SESSION_LOCATIONS),
    notes: sessionNotesSchema,
    // Only a signal: the server stamps the time and the signer itself.
    signedAt: z.union([z.string(), z.boolean(), z.number()]).nullable(),
  })
  .partial();

// ----------------------------------------------------------------- reports --

export const reportContentSchema = z.object({
  summary: text(),
  sessionsSummary: z.array(z.any()).max(1000).default([]),
  goalsProgress: z.array(z.any()).max(1000).default([]),
  recommendations: text().default(''),
  clinicalImpressions: text().default(''),
});

export const createReportSchema = z.object({
  patientId: z.string().min(1),
  reportType: z.enum(REPORT_TYPES),
  title: z.string().max(200).optional(),
  dateRange: z.object({ start: dateString, end: dateString }),
  content: reportContentSchema,
  // A report is created unsigned; signing is a PUT that the server stamps.
  status: z.enum(['draft', 'finalized']).default('draft'),
});

export const updateReportSchema = z
  .object({
    patientId: z.string().min(1),
    reportType: z.enum(REPORT_TYPES),
    title: z.string().max(200),
    dateRange: z.object({ start: dateString, end: dateString }),
    content: reportContentSchema,
    status: z.enum(REPORT_STATUSES),
  })
  .partial();

// ------------------------------------------------------------------- goals --

export const createGoalSchema = z.object({
  patientId: z.string().min(1),
  description: z.string().trim().min(1, 'יש להזין תיאור מטרה').max(2000),
  targetDate: dateString.optional(),
  status: z.enum(GOAL_STATUSES).default('active'),
  progress: z.number().min(0).max(100).default(0),
  measurementCriteria: z.string().trim().min(1, 'יש להזין קריטריון מדידה').max(2000),
});

export const updateGoalSchema = z
  .object({
    patientId: z.string().min(1),
    description: z.string().trim().min(1).max(2000),
    targetDate: dateString.nullable(),
    status: z.enum(GOAL_STATUSES),
    progress: z.number().min(0).max(100),
    measurementCriteria: z.string().trim().min(1).max(2000),
  })
  .partial();

// -------------------------------------------------------------- recordings --

export const speakerUtteranceSchema = z.object({
  speaker: z.number(),
  speakerLabel: z.string().max(200).optional(),
  transcript: z.string().max(100000),
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
});

export const diarizedTranscriptSchema = z.object({
  utterances: z.array(speakerUtteranceSchema).max(10000),
  speakerCount: z.number(),
  speakerLabels: z.record(z.string(), z.string().max(200)).optional(),
  rawTranscript: z.string().max(500000),
});

export const createRecordingSchema = z.object({
  sessionId: z.string().min(1),
  patientId: z.string().min(1),
  duration: z.number().min(0),
  encryptedAudioUrl: z.string(), // data URL; type and size are checked separately
  transcriptionStatus: z.enum(TRANSCRIPTION_STATUSES).default('pending'),
  encryptedTranscript: z.string().max(500000).optional(),
  diarizedTranscript: diarizedTranscriptSchema.optional(),
  consentObtained: z.boolean(),
});

/** A recording's audio, owner and session are immutable; only transcripts change. */
export const updateRecordingSchema = z
  .object({
    transcriptionStatus: z.enum(TRANSCRIPTION_STATUSES),
    encryptedTranscript: z.string().max(500000),
    diarizedTranscript: diarizedTranscriptSchema,
  })
  .partial();

// ------------------------------------------------------ AI summary/insights --

export const saveSummarySchema = z.object({
  summary: z.string().min(1).max(100000),
  mode: z.enum(['mock', 'real']),
  generatedAt: dateString,
  model: z.string().max(200).nullish(),
  tokensUsed: z.number().min(0).nullish(),
});

const insightItemSchema = z.object({
  content: z.string().max(5000),
  confidence: z.number().min(0).max(1),
  sessionRefs: z.array(z.string().max(200)).max(500).optional(),
  firstSeen: dateString.optional(),
  lastSeen: dateString.optional(),
});

export const saveInsightsSchema = z.object({
  insights: z.object({
    patterns: z.array(insightItemSchema).max(200).default([]),
    progressTrends: z.array(insightItemSchema).max(200).default([]),
    riskIndicators: z.array(insightItemSchema).max(200).default([]),
    treatmentGaps: z.array(insightItemSchema).max(200).default([]),
    generatedAt: dateString,
    mode: z.enum(['mock', 'real']),
    model: z.string().max(200).nullish(),
    tokensUsed: z.number().min(0).nullish(),
  }),
});
