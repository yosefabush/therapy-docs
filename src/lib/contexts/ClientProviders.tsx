'use client';

import React, { ReactNode } from 'react';
import { SessionReminderProvider } from './SessionReminderProvider';
import { useIdleLogout } from '@/lib/hooks/use-idle-logout';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * This component wraps all client-side providers for the app
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  // HIPAA: automatically log out unattended sessions after inactivity.
  useIdleLogout();

  return (
    <SessionReminderProvider>
      {children}
    </SessionReminderProvider>
  );
}
