'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await apiClient.get<User[]>('/users');
        if (response.error) {
          setError(response.error);
        } else {
          setUsers(response.data ?? []);
        }
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return { users, loading, error };
}

// Simulated current user - returns first user (therapist)
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      setLoading(true);
      try {
        const response = await apiClient.get<User[]>('/users');
        if (response.error) {
          setError(response.error);
        } else if (response.data && response.data.length > 0) {
          // Simulate logged in user - use first therapist
          const therapist = response.data.find(u => u.role === 'therapist');
          setUser(therapist ?? response.data[0]);
        }
      } catch (err) {
        setError('Failed to fetch current user');
      } finally {
        setLoading(false);
      }
    }
    fetchCurrentUser();
  }, []);

  return { user, loading, error };
}
