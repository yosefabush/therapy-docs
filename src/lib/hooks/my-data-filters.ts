// Pure role-aware filters behind the useMy* hooks. Therapists only see the
// records tied to them; administrators see everything the API returns (the API
// itself already enforces per-record authorization).

import type { Patient, Session, Report } from '@/types';

export function filterMyPatients(patients: Patient[], userId: string, isAdmin: boolean): Patient[] {
  return isAdmin ? patients : patients.filter((p) => p.assignedTherapists.includes(userId));
}

export function filterMySessions(sessions: Session[], userId: string, isAdmin: boolean): Session[] {
  return isAdmin ? sessions : sessions.filter((s) => s.therapistId === userId);
}

export function filterMyReports(reports: Report[], userId: string, isAdmin: boolean): Report[] {
  return isAdmin ? reports : reports.filter((r) => r.generatedBy === userId);
}
