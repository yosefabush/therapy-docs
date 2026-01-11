'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api/client';

const AUTH_STORAGE_KEY = 'therapydocs_auth_user';

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

// Get stored user ID from storage
function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;

  // Check localStorage first (remember me), then sessionStorage
  const localStored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (localStored) {
    try {
      const data = JSON.parse(localStored);
      return data.userId;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const sessionStored = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (sessionStored) {
    try {
      const data = JSON.parse(sessionStored);
      return data.userId;
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return null;
}

// Store user authentication
export function storeAuthUser(userId: string, rememberMe: boolean): void {
  const data = JSON.stringify({ userId, timestamp: Date.now() });

  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, data);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, data);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

// Clear user authentication
export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getStoredUserId() !== null;
}

// Current user hook - checks for logged in user from storage
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const storedUserId = getStoredUserId();

      if (!storedUserId) {
        // No user logged in
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch user by ID
      const response = await apiClient.get<User>(`/users/${storedUserId}`);
      if (response.error) {
        // User not found, clear storage
        clearAuthUser();
        setUser(null);
        setError(response.error);
      } else if (response.data) {
        setUser(response.data);
      } else {
        clearAuthUser();
        setUser(null);
      }
    } catch (err) {
      setError('Failed to fetch current user');
      clearAuthUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(() => {
    clearAuthUser();
    setUser(null);
  }, []);

  const refetch = useCallback(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return { user, loading, error, logout, refetch };
}
