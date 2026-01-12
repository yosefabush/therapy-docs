'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';
import { Modal, Button, Badge } from '@/components/ui';
import { sessionTypeLabels } from '@/lib/mock-data';
import { apiClient } from '@/lib/api/client';

interface SessionActionModalProps {
  session: Session | null;
  patientName?: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (sessionId: string, newStatus: Session['status']) => void;
}

export function SessionActionModal({
  session,
  patientName,
  isOpen,
  onClose,
  onStatusChange,
}: SessionActionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const sessionTime = new Date(session.scheduledAt);
  const formattedTime = new Intl.DateTimeFormat('he-IL', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(sessionTime);
  const formattedDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(sessionTime);

  const handleStatusChange = async (newStatus: Session['status']) => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: Partial<Session> = {
        status: newStatus,
      };

      // If starting session, set startedAt
      if (newStatus === 'in_progress') {
        updateData.startedAt = new Date();
      }

      const response = await apiClient.put(`/sessions/${session.id}`, updateData);

      if (response.error) {
        throw new Error(response.error);
      }

      onStatusChange?.(session.id, newStatus);
      onClose();

      // If starting session, navigate to session details
      if (newStatus === 'in_progress') {
        router.push(`/sessions/${session.id}`);
      }
    } catch (err) {
      setError('שגיאה בעדכון סטטוס המפגש');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const configs: Record<Session['status'], { variant: 'success' | 'warning' | 'danger' | 'info' | 'sage'; label: string }> = {
      scheduled: { variant: 'info', label: 'מתוכנן' },
      in_progress: { variant: 'warning', label: 'בתהליך' },
      completed: { variant: 'success', label: 'הושלם' },
      cancelled: { variant: 'sage', label: 'בוטל' },
      no_show: { variant: 'danger', label: 'לא הגיע' },
    };
    const config = configs[session.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="פעולות מפגש" size="md">
      <div className="space-y-4">
        {/* Session Info */}
        <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-clinical-900">
              {sessionTypeLabels[session.sessionType]}
            </h3>
            {getStatusBadge()}
          </div>
          {patientName && (
            <p className="text-sm text-sage-700 font-medium mb-1">
              מטופל: {patientName}
            </p>
          )}
          <p className="text-sm text-clinical-600">
            {formattedDate} בשעה {formattedTime}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions based on current status */}
        {session.status === 'scheduled' && (
          <div className="space-y-3">
            <p className="text-sm text-clinical-600 text-center">מה תרצה לעשות?</p>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleStatusChange('in_progress')}
              loading={isLoading}
            >
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              התחל מפגש
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleStatusChange('no_show')}
              loading={isLoading}
            >
              <svg className="w-5 h-5 ml-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              מטופל לא הגיע
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => handleStatusChange('cancelled')}
              loading={isLoading}
            >
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              בטל מפגש
            </Button>
          </div>
        )}

        {session.status === 'in_progress' && (
          <div className="space-y-3">
            <p className="text-sm text-clinical-600 text-center">המפגש כבר התחיל</p>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push(`/sessions/${session.id}`)}
            >
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              המשך לתיעוד
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleStatusChange('no_show')}
              loading={isLoading}
            >
              <svg className="w-5 h-5 ml-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              סמן כלא הגיע
            </Button>
          </div>
        )}

        {/* View Details link */}
        <div className="pt-3 border-t border-sage-100">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              onClose();
              router.push(`/sessions/${session.id}`);
            }}
          >
            צפה בפרטי המפגש
          </Button>
        </div>
      </div>
    </Modal>
  );
}
