// Builds the POST /api/reports body for a new report from a patient's sessions
// and goals. Shared by the /reports "צור דוח" dialog and the patient page
// report generator so both persist the same shape.

import type { Report, ReportType, Session, TreatmentGoal } from '@/types';
import { generateMultidisciplinaryReport } from '@/lib/ai-features';

export interface BuildReportInput {
  patientId: string;
  patientName: string;
  reportType: ReportType;
  generatedBy: string;
  sessions: Session[];
  goals: TreatmentGoal[];
  dateRange: { start: Date; end: Date };
  title?: string;
  // Pre-generated narrative (e.g. the previewed text); generated when omitted.
  summary?: string;
}

export interface CreateReportBody {
  patientId: string;
  reportType: ReportType;
  generatedBy: string;
  title?: string;
  dateRange: { start: string; end: string };
  content: Report['content'];
  status: 'draft';
}

// API responses carry ISO strings; the generators compare real Dates.
export function reviveSessionDates(sessions: Session[]): Session[] {
  return sessions.map((s) => ({ ...s, scheduledAt: new Date(s.scheduledAt) }));
}

export function buildReportBody(input: BuildReportInput): CreateReportBody {
  const { dateRange } = input;
  const sessions = reviveSessionDates(input.sessions);
  const inRange = sessions.filter(
    (s) => s.status === 'completed' && s.scheduledAt >= dateRange.start && s.scheduledAt <= dateRange.end
  );

  const summary =
    input.summary ??
    generateMultidisciplinaryReport(sessions, input.goals, input.patientName, dateRange);

  const body: CreateReportBody = {
    patientId: input.patientId,
    reportType: input.reportType,
    generatedBy: input.generatedBy,
    dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() },
    content: {
      summary,
      sessionsSummary: inRange.map((s) => ({
        date: s.scheduledAt,
        therapistRole: s.therapistRole,
        sessionType: s.sessionType,
        keyPoints: s.notes?.assessment || s.notes?.subjective || '',
        progress: s.notes?.progressTowardGoals || '',
      })),
      goalsProgress: input.goals.map((g) => ({
        goalDescription: g.description,
        initialStatus: '',
        currentStatus: g.status,
        progressPercentage: g.progress,
        notes: g.measurementCriteria || '',
      })),
      recommendations: '',
      clinicalImpressions: '',
    },
    status: 'draft',
  };
  const title = input.title?.trim();
  if (title) body.title = title;
  return body;
}

// Default reporting window: the last 90 days up to now.
export function defaultDateRange(now = new Date()): { start: Date; end: Date } {
  return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
}
