// Core domain types for the Therapy Documentation System

export type TherapistRole = 
  | 'psychologist'
  | 'psychiatrist'
  | 'social_worker'
  | 'occupational_therapist'
  | 'speech_therapist'
  | 'physical_therapist'
  | 'counselor'
  | 'art_therapist'
  | 'music_therapist'
  | 'family_therapist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'therapist' | 'admin' | 'supervisor';
  therapistRole?: TherapistRole;
  licenseNumber?: string;
  organization: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Patient {
  id: string;
  // Israeli ID number (תעודת זהות) - 9 digits
  idNumber: string;
  // Encrypted personal information (for HIPAA compliance - contains full PII blob)
  encryptedData: string;
  // Decrypted display fields (populated after decryption for authorized users)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  primaryDiagnosis?: string;
  referralSource?: string;
  insuranceProvider?: string;
  emergencyContact?: EncryptedContact;
  createdAt: Date;
  updatedAt: Date;
  assignedTherapists: string[]; // User IDs
  status: 'active' | 'inactive' | 'discharged';
}

export interface EncryptedContact {
  encryptedName: string;
  encryptedPhone: string;
  relationship: string;
}

export interface Session {
  id: string;
  patientId: string;
  therapistId: string;
  therapistRole: TherapistRole;
  sessionType: SessionType;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  location: 'in_person' | 'telehealth' | 'home_visit';
  notes: SessionNotes;
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
  signedBy?: string;
  aiSummary?: AISummary;
}

export type SessionType =
  | 'initial_assessment'
  | 'individual_therapy'
  | 'group_therapy'
  | 'family_therapy'
  | 'evaluation'
  | 'follow_up'
  | 'crisis_intervention'
  | 'discharge_planning';

export interface SessionNotes {
  // Encrypted content
  chiefComplaint?: string;
  subjective: string; // Patient's self-report
  objective: string; // Therapist's observations
  assessment: string; // Clinical interpretation
  plan: string; // Treatment plan
  interventionsUsed: string[];
  progressTowardGoals?: string;
  riskAssessment?: RiskAssessment;
  medications?: MedicationNote[];
  homework?: string;
  nextSessionPlan?: string;
  additionalNotes?: string;
}

export interface AISummary {
  content: string;           // The summary text
  generatedAt: Date;         // When generated
  mode: 'mock' | 'real';     // AI mode used
  model?: string;            // Model name (e.g., gpt-4o-mini)
  tokensUsed?: number;       // Tokens consumed (if real mode)
  savedAt?: Date;            // When approved/saved by therapist
  savedBy?: string;          // Therapist ID who approved
}

export interface RiskAssessment {
  suicidalIdeation: 'none' | 'passive' | 'active_no_plan' | 'active_with_plan';
  homicidalIdeation: 'none' | 'present';
  selfHarm: 'none' | 'history' | 'current';
  substanceUse: 'none' | 'active' | 'in_recovery';
  safetyPlanReviewed: boolean;
  notes?: string;
}

export interface MedicationNote {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  sideEffects?: string;
}

export interface TreatmentGoal {
  id: string;
  patientId: string;
  description: string;
  targetDate?: Date;
  status: 'active' | 'achieved' | 'modified' | 'discontinued';
  progress: number; // 0-100
  measurementCriteria: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  version: number;
  diagnosis: string[];
  goals: TreatmentGoal[];
  interventions: PlannedIntervention[];
  frequency: string;
  duration: string;
  startDate: Date;
  reviewDate: Date;
  status: 'draft' | 'active' | 'under_review' | 'completed';
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlannedIntervention {
  id: string;
  type: string;
  description: string;
  frequency: string;
  responsibleTherapist: string;
  therapistRole: TherapistRole;
}

export interface Report {
  id: string;
  patientId: string;
  reportType: ReportType;
  generatedBy: string;
  generatedAt: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  content: ReportContent;
  status: 'draft' | 'finalized' | 'signed';
  signedBy?: string;
  signedAt?: Date;
}

export type ReportType =
  | 'progress_summary'
  | 'discharge_summary'
  | 'insurance_report'
  | 'referral_report'
  | 'evaluation_report'
  | 'treatment_summary'
  | 'multidisciplinary_summary';

export interface ReportContent {
  summary: string;
  sessionsSummary: SessionSummary[];
  goalsProgress: GoalProgress[];
  recommendations: string;
  clinicalImpressions: string;
}

export interface SessionSummary {
  date: Date;
  therapistRole: TherapistRole;
  sessionType: SessionType;
  keyPoints: string;
  progress: string;
}

export interface GoalProgress {
  goalDescription: string;
  initialStatus: string;
  currentStatus: string;
  progressPercentage: number;
  notes: string;
}

// Notifications
export type NotificationType =
  | 'session_reminder'
  | 'session_overdue'
  | 'unsigned_session'
  | 'patient_update'
  | 'system_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // Patient ID, Session ID, etc.
  relatedType?: 'patient' | 'session' | 'report';
  isRead: boolean;
  createdAt: Date;
}

// AI-Enhanced Features
export interface AIInsight {
  id: string;
  patientId: string;
  type: 'pattern' | 'risk_indicator' | 'progress_trend' | 'recommendation';
  content: string;
  confidence: number;
  generatedAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// Speaker utterance from diarization
export interface SpeakerUtterance {
  speaker: number;
  speakerLabel?: string;  // e.g., "מטפל" (Therapist), "מטופל" (Patient)
  transcript: string;
  start: number;
  end: number;
  confidence: number;
}

// Diarized transcript with speaker identification
export interface DiarizedTranscript {
  utterances: SpeakerUtterance[];
  speakerCount: number;
  speakerLabels?: Record<number, string>;  // Map speaker numbers to labels
  rawTranscript: string;  // Full transcript without speaker labels
}

export interface VoiceRecording {
  id: string;
  sessionId: string;
  patientId: string;  // For easier patient-level queries
  duration: number;
  encryptedAudioUrl: string;  // Stores base64 audio data
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  encryptedTranscript?: string;  // Live transcript from Web Speech API
  diarizedTranscript?: DiarizedTranscript;  // Deepgram transcript with speakers
  consentObtained: boolean;
  createdAt: Date;
}

// Audit and Security
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: 'patient' | 'session' | 'report' | 'treatment_plan' | 'user';
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'sign'
  | 'share'
  | 'login'
  | 'logout'
  | 'failed_login';

// Template definitions for different therapist roles
export interface SessionTemplate {
  role: TherapistRole;
  sessionType: SessionType;
  fields: TemplateField[];
  defaultInterventions: string[];
  assessmentScales?: string[];
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'scale' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}
