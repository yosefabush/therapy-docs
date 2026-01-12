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
 * - Session starting now (within 5 minutes of start time)
 * - Unsigned completed sessions
 * - Overdue sessions (scheduled but past time)
 *
 * IMPORTANT: Notifications persist until user reads them (clicks on them).
 * Dismissing only works for read notifications.
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

      // Upcoming session reminder (within next 30 minutes, but more than 5 minutes away)
      if (session.status === 'scheduled' && minutesUntil > 5 && minutesUntil <= 30) {
        const notificationId = `reminder-${session.id}`;
        // Only hide if both read AND dismissed
        if (!(readIds.has(notificationId) && dismissedIds.has(notificationId))) {
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

      // Session starting NOW (within 5 minutes before or after start time)
      if (session.status === 'scheduled' && minutesUntil <= 5 && minutesUntil >= -5) {
        const notificationId = `starting-${session.id}`;
        // Only hide if both read AND dismissed
        if (!(readIds.has(notificationId) && dismissedIds.has(notificationId))) {
          generatedNotifications.push({
            id: notificationId,
            type: 'session_reminder',
            title: 'המפגש מתחיל עכשיו!',
            message: minutesUntil > 0
              ? `המפגש מתחיל בעוד ${Math.ceil(minutesUntil)} דקות`
              : 'המפגש אמור להתחיל עכשיו',
            relatedId: session.id,
            relatedType: 'session',
            isRead: readIds.has(notificationId),
            createdAt: sessionTime,
          });
        }
      }

      // Overdue scheduled session (past scheduled time but still marked as scheduled)
      if (session.status === 'scheduled' && minutesUntil < -5 && minutesUntil > -120) {
        const notificationId = `overdue-${session.id}`;
        // Only hide if both read AND dismissed
        if (!(readIds.has(notificationId) && dismissedIds.has(notificationId))) {
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
          // Only hide if both read AND dismissed
          if (!(readIds.has(notificationId) && dismissedIds.has(notificationId))) {
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

  // Only allow dismissing notifications that have been read
  const dismissNotification = useCallback((id: string) => {
    // Only dismiss if already read
    if (readIds.has(id)) {
      setDismissedIds(prev => new Set([...prev, id]));
    }
  }, [readIds]);

  return {
    notifications,
    unreadCount,
    loading: sessionsLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
