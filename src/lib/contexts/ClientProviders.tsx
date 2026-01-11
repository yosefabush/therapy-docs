'use client';

import React, { ReactNode } from 'react';
import { SessionReminderProvider } from './SessionReminderProvider';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * This component wraps all client-side providers for the app
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionReminderProvider>
      {children}
    </SessionReminderProvider>
  );
}
