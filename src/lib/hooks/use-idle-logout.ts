'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearAuthUser } from './use-users';

// HIPAA requires automatic logout of unattended sessions. After this much
// inactivity an authenticated user is logged out and sent to the login page.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
];

export function useIdleLogout(timeoutMs: number = IDLE_TIMEOUT_MS): void {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      // Only arm the timer while a session is active.
      if (!isAuthenticated()) return;
      timer.current = setTimeout(() => {
        if (isAuthenticated()) {
          clearAuthUser(); // clears storage + server session cookie
          router.push('/login');
        }
      }, timeoutMs);
    };

    reset();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, reset, { passive: true })
    );

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [router, timeoutMs]);
}
