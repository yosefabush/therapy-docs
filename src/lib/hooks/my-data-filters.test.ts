import { describe, it, expect } from 'vitest';
import { filterMyPatients, filterMySessions, filterMyReports } from './my-data-filters';
import type { Patient, Session, Report } from '@/types';

const patients = [
  { id: 'p1', assignedTherapists: ['t1'] },
  { id: 'p2', assignedTherapists: ['t2'] },
  { id: 'p3', assignedTherapists: ['t1', 't2'] },
] as unknown as Patient[];
const sessions = [
  { id: 's1', therapistId: 't1' },
  { id: 's2', therapistId: 't2' },
] as unknown as Session[];
const reports = [
  { id: 'r1', generatedBy: 't1' },
  { id: 'r2', generatedBy: 't2' },
] as unknown as Report[];

describe('useMy* role-aware filters', () => {
  it('therapists only see their own records', () => {
    expect(filterMyPatients(patients, 't1', false).map((p) => p.id)).toEqual(['p1', 'p3']);
    expect(filterMySessions(sessions, 't1', false).map((s) => s.id)).toEqual(['s1']);
    expect(filterMyReports(reports, 't2', false).map((r) => r.id)).toEqual(['r2']);
  });

  it('admins see everything even though they are assigned to nothing', () => {
    expect(filterMyPatients(patients, 'admin-1', true)).toHaveLength(3);
    expect(filterMySessions(sessions, 'admin-1', true)).toHaveLength(2);
    expect(filterMyReports(reports, 'admin-1', true)).toHaveLength(2);
  });

  it('a non-admin with no assignments sees nothing', () => {
    expect(filterMyPatients(patients, 'nobody', false)).toEqual([]);
  });
});
