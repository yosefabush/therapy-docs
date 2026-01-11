'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { useSessions, useCurrentUser } from './index';

interface UseSessionReminderReturn {
  upcomingSession: Session | null;
  isReminderVisible: boolean;
  dismissReminder: () => void;
  markNoShow: () => Promise<void>;
  startSession: () => void;
}

const REMINDER_WINDOW_MINUTES = 5; // Show reminder 5 minutes before
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const GRACE_PERIOD_MINUTES = 30; // Show reminder up to 30 minutes after scheduled time

/**
 * Hook to manage session reminders for upcoming sessions
 * Shows reminder when a session is scheduled within the next 5 minutes
 */
export function useSessionReminder(): UseSessionReminderReturn {
  const { user } = useCurrentUser();
  const { sessions, updateSession } = useSessions({ therapistId: user?.id });

  const [upcomingSession, setUpcomingSession] = useState<Session | null>(null);
  const [isReminderVisible, setIsReminderVisible] = useState(false);
  const [dismissedSessionIds, setDismissedSessionIds] = useState<Set<string>>(new Set());

  // Check if a session is upcoming (within reminder window)
  const isSessionUpcoming = useCallback((session: Session): boolean => {
    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60);

    // Show reminder if:
    // 1. Session is scheduled
    // 2. Session is within reminder window (5 minutes before to 30 minutes after)
    // 3. Session hasn't been dismissed
    return (
      session.status === 'scheduled' &&
      minutesUntil <= REMINDER_WINDOW_MINUTES &&
      minutesUntil > -GRACE_PERIOD_MINUTES &&
      !dismissedSessionIds.has(session.id)
    );
  }, [dismissedSessionIds]);

  // Find the next upcoming session
  const findUpcomingSession = useCallback((): Session | null => {
    if (!sessions || sessions.length === 0) return null;

    const upcomingSessions = sessions.filter(isSessionUpcoming);

    if (upcomingSessions.length === 0) return null;

    // Sort by scheduled time and return the earliest one
    return upcomingSessions.sort((a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )[0];
  }, [sessions, isSessionUpcoming]);

  // Check for upcoming sessions periodically
  useEffect(() => {
    const checkUpcomingSessions = () => {
      const nextSession = findUpcomingSession();

      if (nextSession && nextSession.id !== upcomingSession?.id) {
        setUpcomingSession(nextSession);
        setIsReminderVisible(true);
      } else if (!nextSession && upcomingSession) {
        // No more upcoming sessions
        setUpcomingSession(null);
        setIsReminderVisible(false);
      }
    };

    // Initial check
    checkUpcomingSessions();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkUpcomingSessions, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [findUpcomingSession, upcomingSession]);

  // Dismiss the current reminder
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

  // Mark the session as no-show
  const markNoShow = useCallback(async () => {
    if (!upcomingSession) return;

    try {
      await updateSession(upcomingSession.id, { status: 'no_show' });
      dismissReminder();
    } catch (error) {
      console.error('Failed to mark session as no-show:', error);
      throw error;
    }
  }, [upcomingSession, updateSession, dismissReminder]);

  // Start the session (caller will handle navigation)
  const startSession = useCallback(() => {
    dismissReminder();
  }, [dismissReminder]);

  return {
    upcomingSession,
    isReminderVisible,
    dismissReminder,
    markNoShow,
    startSession,
  };
}
