'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api/client';

const AUTH_STORAGE_KEY = 'therapydocs_auth_user';
const AUTH_CHANGE_EVENT = 'therapydocs_auth_change';

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

// Pending /api/auth/logout call. Stops several mounted hooks from each firing
// logout for the same event, and lets a session lookup wait until the cookie
// is actually cleared.
let logoutInFlight: Promise<void> | null = null;

// Re-populate the per-tab auth flag from a verified server session (e.g. a new
// tab, where sessionStorage starts empty). Does not emit AUTH_CHANGE_EVENT so
// every mounted useCurrentUser does not refetch in a loop.
function restoreAuthUser(userId: string): void {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId, timestamp: Date.now() }));
}

// One /api/auth/me lookup shared by all hook instances on the page.
let sessionLookup: Promise<{ userId: string | null; failed: boolean }> | null = null;

function lookupServerSession(): Promise<{ userId: string | null; failed: boolean }> {
  if (!sessionLookup) {
    // Right after a logout, wait for the cookie to be cleared so the lookup
    // does not resurrect the session that is being ended.
    sessionLookup = Promise.resolve(logoutInFlight)
      .then(() => apiClient.get<Pick<User, 'id'>>('/auth/me'))
      .then((response) => {
        if (response.data?.id) return { userId: response.data.id, failed: false };
        // 401: no valid session. Anything else (aborted, network, 5xx) is a
        // transient failure, not proof that the user is logged out.
        return { userId: null, failed: response.status !== 401 };
      })
      .finally(() => {
        sessionLookup = null;
      });
  }
  return sessionLookup;
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

  // Notify listeners that auth changed
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { userId } }));
}

// Clear user authentication. Returns a promise that settles once the server has
// cleared the cookie and revoked the token, so callers that navigate away (to
// /login, which redirects signed-in users) can wait for it instead of racing it.
export function clearAuthUser(): Promise<void> {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);

  // Also clear the server-side httpOnly session cookie (fire-and-forget).
  if (typeof window !== 'undefined' && !logoutInFlight) {
    logoutInFlight = fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {}, () => {})
      .finally(() => {
        logoutInFlight = null;
      });
  }

  // Notify listeners that auth changed
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { userId: null } }));

  return logoutInFlight ?? Promise.resolve();
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
    setError(null);
    try {
      let storedUserId = getStoredUserId();

      if (!storedUserId) {
        // No flag in this tab: ask the server whether the session cookie is
        // still valid before treating the user as logged out.
        const session = await lookupServerSession();
        if (session.failed) {
          setUser(null);
          setError('Failed to verify session');
          return;
        }
        if (!session.userId) {
          // No user logged in
          setUser(null);
          return;
        }
        restoreAuthUser(session.userId);
        storedUserId = session.userId;
      }

      // Fetch user by ID
      const response = await apiClient.get<User>(`/users/${storedUserId}`);
      if (response.data && !response.error) {
        setUser(response.data);
      } else if (response.status === 401) {
        // The server rejected the session: really logged out.
        clearAuthUser();
        setUser(null);
      } else {
        // Aborted, network error, 5xx, etc. Keep the session; just report it.
        setUser(null);
        setError(response.error ?? 'Failed to fetch current user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen for auth changes (login/logout)
    const handleAuthChange = () => {
      fetchCurrentUser();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
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
