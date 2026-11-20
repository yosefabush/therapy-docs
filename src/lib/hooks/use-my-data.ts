'use client';

import { useState, useEffect, useCallback } from 'react';
import { Patient, Session, TreatmentGoal, Report } from '@/types';
import { apiClient } from '@/lib/api/client';
import { filterMyPatients, filterMySessions, filterMyReports } from './my-data-filters';

/**
 * Hook to fetch only patients assigned to a specific therapist
 */
export function useMyPatients(therapistId: string | undefined, isAdmin = false) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!therapistId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Patient[]>(`/patients?therapistId=${therapistId}`);

      if (response.error) {
        setError(response.error);
        setPatients([]);
      } else {
        // Therapists only see their own patients; admins see all of them.
        setPatients(filterMyPatients(response.data ?? [], therapistId, isAdmin));
      }
    } catch (err) {
      setError('Failed to fetch patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [therapistId, isAdmin]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    // Ensure the current therapist is assigned
    const patientData = {
      ...data,
      assignedTherapists: data.assignedTherapists.includes(therapistId!)
        ? data.assignedTherapists
        : [...data.assignedTherapists, therapistId!],
    };
    const response = await apiClient.post<Patient>('/patients', patientData);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return response.data!;
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    createPatient,
  };
}

/**
 * Hook to fetch only sessions for a specific therapist
 */
export function useMySessions(therapistId: string | undefined, isAdmin = false) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!therapistId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Session[]>(`/sessions?therapistId=${therapistId}`);

      if (response.error) {
        setError(response.error);
        setSessions([]);
      } else {
        // Therapists only see their own sessions; admins see all of them.
        setSessions(filterMySessions(response.data ?? [], therapistId, isAdmin));
      }
    } catch (err) {
      setError('Failed to fetch sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [therapistId, isAdmin]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (data: Partial<Session>): Promise<Session> => {
    const sessionData = {
      ...data,
      therapistId: therapistId!,
    };
    const response = await apiClient.post<Session>('/sessions', sessionData);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return response.data!;
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
  };
}

/**
 * Hook to fetch treatment goals for patients assigned to a specific therapist
 */
export function useMyTreatmentGoals(therapistId: string | undefined, patientIds: string[]) {
  const [goals, setGoals] = useState<TreatmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!therapistId || patientIds.length === 0) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<TreatmentGoal[]>('/treatment-goals');

      if (response.error) {
        setError(response.error);
        setGoals([]);
      } else {
        // Filter to only show goals for therapist's patients
        const myGoals = (response.data ?? []).filter(g => patientIds.includes(g.patientId));
        setGoals(myGoals);
      }
    } catch (err) {
      setError('Failed to fetch treatment goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [therapistId, patientIds]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
  };
}

/**
 * Hook to fetch reports created by or for a specific therapist
 */
export function useMyReports(therapistId: string | undefined, isAdmin = false) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!therapistId) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Report[]>('/reports');

      if (response.error) {
        setError(response.error);
        setReports([]);
      } else {
        // Therapists only see reports they generated; admins see all of them.
        setReports(filterMyReports(response.data ?? [], therapistId, isAdmin));
      }
    } catch (err) {
      setError('Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [therapistId, isAdmin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
  };
}
