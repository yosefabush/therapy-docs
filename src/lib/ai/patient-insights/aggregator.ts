/**
 * Session Aggregator for Patient Insight Engine
 *
 * Provides utilities for fetching and formatting patient session data
 * for AI insight generation across multiple sessions.
 */

import { sessionRepository } from '@/lib/data/repositories';
import { Session, SessionNotes, RiskAssessment } from '@/types';

/**
 * Aggregated sessions data for a patient
 */
export interface AggregatedSessions {
  patientId: string;
  sessionCount: number;
  dateRange: { earliest: Date; latest: Date } | null;
  sessions: Session[];
}

/**
 * Fetches all completed sessions for a patient, sorted chronologically (oldest first)
 *
 * @param patientId - The patient ID to fetch sessions for
 * @returns AggregatedSessions with all completed sessions
 */
export async function aggregatePatientSessions(patientId: string): Promise<AggregatedSessions> {
  // Fetch all sessions for the patient
  const allSessions = await sessionRepository.findByPatient(patientId);

  // Filter for completed sessions only
  const completedSessions = allSessions.filter(s => s.status === 'completed');

  // Sort chronologically (oldest first)
  completedSessions.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  // Calculate date range
  let dateRange: { earliest: Date; latest: Date } | null = null;
  if (completedSessions.length > 0) {
    dateRange = {
      earliest: new Date(completedSessions[0].scheduledAt),
      latest: new Date(completedSessions[completedSessions.length - 1].scheduledAt)
    };
  }

  return {
    patientId,
    sessionCount: completedSessions.length,
    dateRange,
    sessions: completedSessions
  };
}

/**
 * Formats an array of sessions into a single text block for AI consumption
 * Includes all relevant fields from session notes for comprehensive analysis
 *
 * @param sessions - Array of sessions to format
 * @returns Formatted text block for AI processing
 */
export function formatSessionsForInsights(sessions: Session[]): string {
  if (sessions.length === 0) {
    return 'No completed sessions available for analysis.';
  }

  const formattedSessions = sessions.map((session, index) => {
    return formatSingleSession(session, index + 1);
  });

  return formattedSessions.join('\n\n' + '='.repeat(80) + '\n\n');
}

/**
 * Formats a single session with all relevant fields
 */
function formatSingleSession(session: Session, sessionNumber: number): string {
  const sections: string[] = [];
  const { notes } = session;

  // Session header
  sections.push(`SESSION ${sessionNumber}`);
  sections.push(`Date: ${formatDate(session.scheduledAt)}`);
  sections.push(`Therapist Role: ${formatTherapistRole(session.therapistRole)}`);
  sections.push(`Session Type: ${session.sessionType.replace(/_/g, ' ')}`);
  sections.push(`Duration: ${session.duration} minutes`);
  sections.push('');

  // SOAP Notes
  sections.push('--- SOAP NOTES ---');

  if (notes.chiefComplaint) {
    sections.push(`Chief Complaint: ${notes.chiefComplaint}`);
    sections.push('');
  }

  sections.push(`Subjective: ${notes.subjective}`);
  sections.push('');

  sections.push(`Objective: ${notes.objective}`);
  sections.push('');

  sections.push(`Assessment: ${notes.assessment}`);
  sections.push('');

  sections.push(`Plan: ${notes.plan}`);
  sections.push('');

  // Interventions
  if (notes.interventionsUsed && notes.interventionsUsed.length > 0) {
    sections.push(`Interventions Used: ${notes.interventionsUsed.join(', ')}`);
    sections.push('');
  }

  // Progress toward goals
  if (notes.progressTowardGoals) {
    sections.push(`Progress Toward Goals: ${notes.progressTowardGoals}`);
    sections.push('');
  }

  // Risk Assessment
  if (notes.riskAssessment) {
    sections.push('--- RISK ASSESSMENT ---');
    sections.push(formatRiskAssessment(notes.riskAssessment));
    sections.push('');
  }

  // Medications
  if (notes.medications && notes.medications.length > 0) {
    sections.push('--- MEDICATIONS ---');
    const meds = notes.medications.map(m =>
      `${m.name} ${m.dosage} ${m.frequency}${m.sideEffects ? ` (Side effects: ${m.sideEffects})` : ''}`
    );
    sections.push(meds.join('\n'));
    sections.push('');
  }

  // Homework
  if (notes.homework) {
    sections.push(`Homework: ${notes.homework}`);
    sections.push('');
  }

  // Next session plan
  if (notes.nextSessionPlan) {
    sections.push(`Next Session Plan: ${notes.nextSessionPlan}`);
    sections.push('');
  }

  // Additional notes
  if (notes.additionalNotes) {
    sections.push(`Additional Notes: ${notes.additionalNotes}`);
    sections.push('');
  }

  return sections.join('\n').trim();
}

/**
 * Formats risk assessment into readable text
 */
function formatRiskAssessment(risk: RiskAssessment): string {
  const lines: string[] = [];

  lines.push(`Suicidal Ideation: ${formatRiskLevel(risk.suicidalIdeation)}`);
  lines.push(`Homicidal Ideation: ${risk.homicidalIdeation}`);
  lines.push(`Self-Harm: ${risk.selfHarm}`);
  lines.push(`Substance Use: ${risk.substanceUse}`);
  lines.push(`Safety Plan Reviewed: ${risk.safetyPlanReviewed ? 'Yes' : 'No'}`);

  if (risk.notes) {
    lines.push(`Notes: ${risk.notes}`);
  }

  return lines.join('\n');
}

/**
 * Formats suicidal ideation level with full description
 */
function formatRiskLevel(level: RiskAssessment['suicidalIdeation']): string {
  const labels: Record<RiskAssessment['suicidalIdeation'], string> = {
    'none': 'None',
    'passive': 'Passive ideation',
    'active_no_plan': 'Active ideation (no plan)',
    'active_with_plan': 'Active ideation with plan'
  };
  return labels[level];
}

/**
 * Formats therapist role for display
 */
function formatTherapistRole(role: string): string {
  return role.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Formats date in ISO format for AI clarity
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
