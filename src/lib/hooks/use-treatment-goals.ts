'use client';

import { useState, useEffect, useCallback } from 'react';
import { TreatmentGoal } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useTreatmentGoals(patientId?: string) {
  const [goals, setGoals] = useState<TreatmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = patientId
        ? `/treatment-goals?patientId=${patientId}`
        : '/treatment-goals';
      const response = await apiClient.get<TreatmentGoal[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setGoals(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (data: Partial<TreatmentGoal>): Promise<TreatmentGoal> => {
    const response = await apiClient.post<TreatmentGoal>('/treatment-goals', data);
    if (response.error) throw new Error(response.error);
    await fetchGoals();
    return response.data!;
  };

  const updateGoal = async (id: string, data: Partial<TreatmentGoal>): Promise<TreatmentGoal> => {
    const response = await apiClient.put<TreatmentGoal>(`/treatment-goals/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchGoals();
    return response.data!;
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/treatment-goals/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchGoals();
    return true;
  };

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
