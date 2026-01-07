'use client';

import { useState, useEffect, useCallback } from 'react';
import { Report } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useReports(patientId?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = patientId
        ? `/reports?patientId=${patientId}`
        : '/reports';
      const response = await apiClient.get<Report[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setReports(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (data: Partial<Report>): Promise<Report> => {
    const response = await apiClient.post<Report>('/reports', data);
    if (response.error) throw new Error(response.error);
    await fetchReports();
    return response.data!;
  };

  const updateReport = async (id: string, data: Partial<Report>): Promise<Report> => {
    const response = await apiClient.put<Report>(`/reports/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchReports();
    return response.data!;
  };

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    createReport,
    updateReport,
  };
}
