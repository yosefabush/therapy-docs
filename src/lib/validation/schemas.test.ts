import { describe, it, expect } from 'vitest';
import {
  createPatientSchema,
  updatePatientSchema,
  createSessionSchema,
  updateSessionSchema,
  createReportSchema,
  updateReportSchema,
  createGoalSchema,
  updateGoalSchema,
  createRecordingSchema,
  updateRecordingSchema,
} from './schemas';

describe('mass assignment: unknown fields are stripped', () => {
  it('patient update drops id, createdAt and anything not allow-listed', () => {
    const out = updatePatientSchema.parse({
      status: 'inactive', id: 'evil', createdAt: '2000-01-01', isAdmin: true, role: 'admin',
    });
    expect(out).toEqual({ status: 'inactive' });
  });

  it('session update drops signedBy, aiSummary and id', () => {
    const out = updateSessionSchema.parse({
      status: 'completed', signedBy: 'someone-else', aiSummary: { content: 'x' }, id: 'x',
    });
    expect(out).toEqual({ status: 'completed' });
  });

  it('report update drops generatedBy, signedBy and signedAt', () => {
    const out = updateReportSchema.parse({
      title: 't', generatedBy: 'victim', signedBy: 'victim', signedAt: '2020-01-01',
    });
    expect(out).toEqual({ title: 't' });
  });

  it('recording update only keeps transcript fields (audio, patient and session are immutable)', () => {
    const out = updateRecordingSchema.parse({
      encryptedTranscript: 'hello', encryptedAudioUrl: 'data:audio/webm;base64,AA', patientId: 'p2', sessionId: 's9',
    });
    expect(out).toEqual({ encryptedTranscript: 'hello' });
  });

  it('goal update drops createdBy and id; create has no createdBy field at all', () => {
    expect(updateGoalSchema.parse({ progress: 50, createdBy: 'x', id: 'y' })).toEqual({ progress: 50 });
    const created = createGoalSchema.parse({
      patientId: 'p', description: 'd', measurementCriteria: 'm', createdBy: 'forged',
    });
    expect('createdBy' in created).toBe(false);
  });

  it('report create has no generatedBy and cannot be created as signed', () => {
    const base = {
      patientId: 'p', reportType: 'progress_summary',
      dateRange: { start: '2026-01-01', end: '2026-02-01' }, content: { summary: 's' },
    };
    const out = createReportSchema.parse({ ...base, generatedBy: 'forged' });
    expect('generatedBy' in out).toBe(false);
    expect(createReportSchema.safeParse({ ...base, status: 'signed' }).success).toBe(false);
  });
});

describe('enums and ranges are validated', () => {
  it('rejects invalid statuses and types', () => {
    expect(updateSessionSchema.safeParse({ status: 'archived' }).success).toBe(false);
    expect(updatePatientSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    expect(updatePatientSchema.safeParse({ gender: 'robot' }).success).toBe(false);
    expect(updateReportSchema.safeParse({ status: 'approved' }).success).toBe(false);
    expect(updateGoalSchema.safeParse({ status: 'nope' }).success).toBe(false);
    expect(updateRecordingSchema.safeParse({ transcriptionStatus: 'done' }).success).toBe(false);
  });

  it('rejects out-of-range progress and bad dates', () => {
    expect(updateGoalSchema.safeParse({ progress: 101 }).success).toBe(false);
    expect(updateGoalSchema.safeParse({ progress: -1 }).success).toBe(false);
    expect(updateSessionSchema.safeParse({ scheduledAt: 'not-a-date' }).success).toBe(false);
    expect(createSessionSchema.safeParse({
      patientId: 'p', therapistId: 't', therapistRole: 'psychologist',
      sessionType: 'follow_up', scheduledAt: '2026-01-01T10:00:00Z', duration: 5,
    }).success).toBe(false);
  });

  it('goal creation needs a description and a measurement criterion', () => {
    expect(createGoalSchema.safeParse({ patientId: 'p', description: '  ', measurementCriteria: 'm' }).success).toBe(false);
    expect(createGoalSchema.safeParse({ patientId: 'p', description: 'd', measurementCriteria: '' }).success).toBe(false);
    const ok = createGoalSchema.parse({ patientId: 'p', description: ' d ', measurementCriteria: ' m ' });
    expect(ok).toMatchObject({ description: 'd', measurementCriteria: 'm', status: 'active', progress: 0 });
  });

  it('patient create requires a 9-digit id and at least one therapist', () => {
    const valid = {
      idNumber: '123456789', encryptedData: 'x', firstName: 'a', lastName: 'b',
      dateOfBirth: '1990-01-01', gender: 'female', assignedTherapists: ['t1'],
    };
    expect(createPatientSchema.safeParse(valid).success).toBe(true);
    expect(createPatientSchema.safeParse({ ...valid, idNumber: '123' }).success).toBe(false);
    expect(createPatientSchema.safeParse({ ...valid, assignedTherapists: [] }).success).toBe(false);
  });
});
