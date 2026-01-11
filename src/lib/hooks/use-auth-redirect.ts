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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  return { user, loading, error, logout, refetch };
}
