'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from './use-users';

/**
 * Hook that redirects to login page if user is not authenticated.
 * Returns the current user, loading state, and logout function.
 */
export function useAuthRedirect() {
  const router = useRouter();
  const { user, loading, error, logout, refetch } = useCurrentUser();

  useEffect(() => {
    // Only redirect when the user is known to be logged out. A transient
    // failure (error set) must not bounce a logged-in user to /login.
    if (!loading && !user && !error) {
      router.push('/login');
    }
  }, [loading, user, error, router]);

  return { user, loading, error, logout, refetch };
}
