import { describe, it, expect } from 'vitest';
import { buildReportBody, defaultDateRange } from './build-report';
import type { Session, TreatmentGoal } from '@/types';

const range = { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-04-01T00:00:00Z') };
// API responses carry ISO strings, not Dates.
const sessions = [
  {
    id: 's1', patientId: 'p1', therapistId: 't1', therapistRole: 'psychologist', sessionType: 'individual_therapy',
    scheduledAt: '2026-02-01T10:00:00.000Z', status: 'completed',
    notes: { subjective: 'sub', assessment: 'assess', progressTowardGoals: 'better', objective: '', plan: '', interventionsUsed: [] },
  },
  { id: 's2', scheduledAt: '2025-01-01T10:00:00.000Z', status: 'completed', notes: {} },
] as unknown as Session[];
const goals = [
  { id: 'g1', description: 'sleep', status: 'active', progress: 40, measurementCriteria: 'hours' },
] as unknown as TreatmentGoal[];

describe('buildReportBody', () => {
  it('builds a POST /api/reports body with title, dates and content', () => {
    const body = buildReportBody({
      patientId: 'p1', patientName: 'Dana Levi', reportType: 'progress_summary', generatedBy: 't1',
      sessions, goals, dateRange: range, title: '  דוח רבעוני  ',
    });
    expect(body).toMatchObject({
      patientId: 'p1', reportType: 'progress_summary', generatedBy: 't1', title: 'דוח רבעוני', status: 'draft',
      dateRange: { start: '2026-01-01T00:00:00.000Z', end: '2026-04-01T00:00:00.000Z' },
    });
    expect(body.content.summary.length).toBeGreaterThan(0);
    expect(body.content.sessionsSummary).toHaveLength(1); // only the in-range session
    expect(body.content.sessionsSummary[0].keyPoints).toBe('assess');
    expect(body.content.goalsProgress[0]).toMatchObject({ goalDescription: 'sleep', progressPercentage: 40 });
  });

  it('omits the title when blank and uses a provided summary verbatim', () => {
    const body = buildReportBody({
      patientId: 'p1', patientName: 'X', reportType: 'discharge_summary', generatedBy: 't1',
      sessions: [], goals: [], dateRange: range, title: '   ', summary: 'preview text',
    });
    expect('title' in body).toBe(false);
    expect(body.content.summary).toBe('preview text');
  });

  it('defaults to a 90-day window ending now', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    const r = defaultDateRange(now);
    expect(r.end).toEqual(now);
    expect(now.getTime() - r.start.getTime()).toBe(90 * 24 * 3600 * 1000);
  });
});
