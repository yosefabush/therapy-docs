'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useSessions(filters?: { therapistId?: string; patientId?: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '/sessions';
      const params = new URLSearchParams();
      if (filters?.therapistId) params.set('therapistId', filters.therapistId);
      if (filters?.patientId) params.set('patientId', filters.patientId);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await apiClient.get<Session[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setSessions(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [filters?.therapistId, filters?.patientId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (data: Partial<Session>): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', data);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return response.data!;
  };

  const updateSession = async (id: string, data: Partial<Session>): Promise<Session> => {
    const response = await apiClient.put<Session>(`/sessions/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return response.data!;
  };

  const deleteSession = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/sessions/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return true;
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };
}

export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      try {
        const response = await apiClient.get<Session>(`/sessions/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setSession(response.data ?? null);
        }
      } catch (err) {
        setError('Failed to fetch session');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [id]);

  return { session, loading, error };
}
