'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Notification, Session } from '@/types';
import { useSessions, useCurrentUser } from './index';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
}

/**
 * Hook to manage notifications based on real session data
 * Generates notifications for:
 * - Upcoming sessions (within 30 minutes)
 * - Unsigned completed sessions
 * - Overdue sessions (scheduled but past time)
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useCurrentUser();
  const { sessions, loading: sessionsLoading } = useSessions({ therapistId: user?.id });
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Generate notifications based on session data
  const notifications = useMemo((): Notification[] => {
    if (!sessions || sessions.length === 0) return [];

    const now = new Date();
    const generatedNotifications: Notification[] = [];

    sessions.forEach((session: Session) => {
      const sessionTime = new Date(session.scheduledAt);
      const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60);

      // Upcoming session reminder (within next 30 minutes)
      if (session.status === 'scheduled' && minutesUntil > 0 && minutesUntil <= 30) {
        const notificationId = `reminder-${session.id}`;
        if (!dismissedIds.has(notificationId)) {
          generatedNotifications.push({
            id: notificationId,
            type: 'session_reminder',
            title: 'תזכורת מפגש',
            message: `מפגש מתוכנן בעוד ${Math.ceil(minutesUntil)} דקות`,
            relatedId: session.id,
            relatedType: 'session',
            isRead: readIds.has(notificationId),
            createdAt: new Date(sessionTime.getTime() - 30 * 60 * 1000),
          });
        }
      }

      // Overdue scheduled session (past scheduled time but still marked as scheduled)
      if (session.status === 'scheduled' && minutesUntil < -5 && minutesUntil > -120) {
        const notificationId = `overdue-${session.id}`;
        if (!dismissedIds.has(notificationId)) {
          generatedNotifications.push({
            id: notificationId,
            type: 'session_overdue',
            title: 'מפגש באיחור',
            message: `מפגש היה אמור להתחיל לפני ${Math.abs(Math.ceil(minutesUntil))} דקות`,
            relatedId: session.id,
            relatedType: 'session',
            isRead: readIds.has(notificationId),
            createdAt: sessionTime,
          });
        }
      }

      // Unsigned completed session (completed but not signed within 24 hours)
      if (session.status === 'completed' && !session.signedAt) {
        const completedTime = session.endedAt ? new Date(session.endedAt) : now;
        const hoursSinceCompleted = (now.getTime() - completedTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCompleted >= 1) {
          const notificationId = `unsigned-${session.id}`;
          if (!dismissedIds.has(notificationId)) {
            generatedNotifications.push({
              id: notificationId,
              type: 'unsigned_session',
              title: 'מפגש ממתין לחתימה',
              message: `מפגש שהסתיים לפני ${Math.floor(hoursSinceCompleted)} שעות טרם נחתם`,
              relatedId: session.id,
              relatedType: 'session',
              isRead: readIds.has(notificationId),
              createdAt: completedTime,
            });
          }
        }
      }
    });

    // Sort by creation time (newest first)
    return generatedNotifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [sessions, dismissedIds, readIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  return {
    notifications,
    unreadCount,
    loading: sessionsLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
