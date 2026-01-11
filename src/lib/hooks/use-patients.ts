'use client';

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types';
import { apiClient } from '@/lib/api/client';

interface CreatePatientData {
  encryptedData: string;
  patientCode: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  primaryDiagnosis?: string;
  referralSource?: string;
  insuranceProvider?: string;
  assignedTherapists: string[];
  status?: 'active' | 'inactive' | 'discharged';
}

export function usePatients(therapistId?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = therapistId
        ? `/patients?therapistId=${therapistId}`
        : '/patients';
      const response = await apiClient.get<Patient[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setPatients(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = async (data: CreatePatientData): Promise<Patient> => {
    const response = await apiClient.post<Patient>('/patients', data);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return response.data!;
  };

  const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return response.data!;
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/patients/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return true;
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
  };
}

export function usePatient(id: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setPatient(null);
      return;
    }

    async function fetchPatient() {
      setLoading(true);
      try {
        const response = await apiClient.get<Patient>(`/patients/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setPatient(response.data ?? null);
        }
      } catch (err) {
        setError('Failed to fetch patient');
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id]);

  return { patient, loading, error };
}
