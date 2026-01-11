'use client';

import { useState, useEffect, useCallback } from 'react';
import { VoiceRecording } from '@/types';
import { apiClient } from '@/lib/api/client';

interface UseVoiceRecordingsFilters {
  sessionId?: string;
  patientId?: string;
}

export function useVoiceRecordings(filters?: UseVoiceRecordingsFilters) {
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '/voice-recordings';
      const params = new URLSearchParams();
      if (filters?.sessionId) params.set('sessionId', filters.sessionId);
      if (filters?.patientId) params.set('patientId', filters.patientId);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await apiClient.get<VoiceRecording[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setRecordings(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch voice recordings');
    } finally {
      setLoading(false);
    }
  }, [filters?.sessionId, filters?.patientId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const createRecording = async (data: Omit<VoiceRecording, 'id' | 'createdAt'>): Promise<VoiceRecording> => {
    const response = await apiClient.post<VoiceRecording>('/voice-recordings', data);
    if (response.error) throw new Error(response.error);
    await fetchRecordings();
    return response.data!;
  };

  const deleteRecording = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/voice-recordings/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchRecordings();
    return true;
  };

  const updateRecording = async (id: string, data: Partial<VoiceRecording>): Promise<VoiceRecording> => {
    const response = await apiClient.put<VoiceRecording>(`/voice-recordings/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchRecordings();
    return response.data!;
  };

  return {
    recordings,
    loading,
    error,
    refetch: fetchRecordings,
    createRecording,
    updateRecording,
    deleteRecording,
  };
}
