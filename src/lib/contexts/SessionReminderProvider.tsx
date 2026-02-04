'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { SessionReminder } from '@/components/sessions/SessionReminder';
import { useCurrentUser } from '@/lib/hooks/use-users';

interface SessionReminderContextValue {
  upcomingSession: Session | null;
  isReminderVisible: boolean;
  dismissReminder: () => void;
}

const SessionReminderContext = createContext<SessionReminderContextValue | null>(null);

export function useSessionReminderContext() {
  const context = useContext(SessionReminderContext);
  if (!context) {
    throw new Error('useSessionReminderContext must be used within SessionReminderProvider');
  }
  return context;
}

interface SessionReminderProviderProps {
  children: ReactNode;
}

const REMINDER_WINDOW_MINUTES = 5;
const CHECK_INTERVAL_MS = 30000;
const GRACE_PERIOD_MINUTES = 30;

export function SessionReminderProvider({ children }: SessionReminderProviderProps) {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [upcomingSession, setUpcomingSession] = useState<Session | null>(null);
  const [isReminderVisible, setIsReminderVisible] = useState(false);
  const [dismissedSessionIds, setDismissedSessionIds] = useState<Set<string>>(new Set());

  // Fetch sessions only when user is logged in
  useEffect(() => {
    // Don't fetch if still loading or no logged-in user
    if (userLoading || !currentUser?.id) return;

    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/sessions?therapistId=${currentUser.id}`);
        const data = await response.json();
        if (data.data) {
          setSessions(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    fetchSessions();
    const intervalId = setInterval(fetchSessions, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [userLoading, currentUser?.id]);

  // Check for upcoming sessions
  const isSessionUpcoming = useCallback((session: Session): boolean => {
    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60);

    return (
      session.status === 'scheduled' &&
      minutesUntil <= REMINDER_WINDOW_MINUTES &&
      minutesUntil > -GRACE_PERIOD_MINUTES &&
      !dismissedSessionIds.has(session.id)
    );
  }, [dismissedSessionIds]);

  // Find upcoming session
  useEffect(() => {
    if (!sessions || sessions.length === 0) return;

    const checkUpcoming = () => {
      const upcomingSessions = sessions.filter(isSessionUpcoming);

      if (upcomingSessions.length > 0) {
        const nextSession = upcomingSessions.sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )[0];

        if (nextSession.id !== upcomingSession?.id) {
          setUpcomingSession(nextSession);
          setIsReminderVisible(true);
        }
      } else if (upcomingSession) {
        setUpcomingSession(null);
        setIsReminderVisible(false);
      }
    };

    checkUpcoming();
    const intervalId = setInterval(checkUpcoming, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [sessions, isSessionUpcoming, upcomingSession]);

  const dismissReminder = useCallback(() => {
    if (upcomingSession) {
      setDismissedSessionIds(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(upcomingSession.id);
        return newSet;
      });
    }
    setIsReminderVisible(false);
    setUpcomingSession(null);
  }, [upcomingSession]);

  const markNoShow = useCallback(async () => {
    if (!upcomingSession) return;

    try {
      await fetch(`/api/sessions/${upcomingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'no_show' }),
      });
      dismissReminder();
    } catch (error) {
      console.error('Failed to mark session as no-show:', error);
      throw error;
    }
  }, [upcomingSession, dismissReminder]);

  const startSession = useCallback(() => {
    dismissReminder();
  }, [dismissReminder]);

  const contextValue: SessionReminderContextValue = {
    upcomingSession,
    isReminderVisible,
    dismissReminder,
  };

  return (
    <SessionReminderContext.Provider value={contextValue}>
      {children}

      {/* Global Session Reminder Modal - only render when user is logged in */}
      {!userLoading && currentUser && upcomingSession && (
        <SessionReminder
          session={upcomingSession}
          isOpen={isReminderVisible}
          onStartSession={startSession}
          onMarkNoShow={markNoShow}
          onDismiss={dismissReminder}
        />
      )}
    </SessionReminderContext.Provider>
  );
}
