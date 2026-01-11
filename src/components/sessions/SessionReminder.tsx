'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';
import { Modal, Button, Badge } from '@/components/ui';
import { sessionTypeLabels } from '@/lib/mock-data';
import { usePatient } from '@/lib/hooks';

interface SessionReminderProps {
  session: Session;
  isOpen: boolean;
  onStartSession: () => void;
  onMarkNoShow: () => Promise<void>;
  onDismiss: () => void;
}

export function SessionReminder({
  session,
  isOpen,
  onStartSession,
  onMarkNoShow,
  onDismiss,
}: SessionReminderProps) {
  const router = useRouter();
  const { patient } = usePatient(session.patientId);
  const [isLoading, setIsLoading] = useState(false);
  const [minutesUntil, setMinutesUntil] = useState(0);

  // Calculate and update time until session
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const sessionTime = new Date(session.scheduledAt);
      const minutes = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60));
      setMinutesUntil(minutes);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [session.scheduledAt]);

  const handleStartSession = () => {
    onStartSession();
    router.push(`/sessions/${session.id}`);
  };

  const handleMarkNoShow = async () => {
    setIsLoading(true);
    try {
      await onMarkNoShow();
    } catch (error) {
      console.error('Failed to mark as no-show:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTimeMessage = () => {
    if (minutesUntil > 0) {
      return `מתחיל בעוד ${minutesUntil} דקות`;
    } else if (minutesUntil === 0) {
      return 'מתחיל עכשיו!';
    } else {
      return `היה אמור להתחיל לפני ${Math.abs(minutesUntil)} דקות`;
    }
  };

  const isOverdue = minutesUntil < 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      title="תזכורת מפגש"
      size="md"
    >
      <div className="space-y-6">
        {/* Alert Banner */}
        <div className={`p-4 rounded-lg border ${
          isOverdue
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isOverdue ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <svg
                className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className={`font-medium ${isOverdue ? 'text-red-800' : 'text-amber-800'}`}>
                {getTimeMessage()}
              </p>
              <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                {formatTime(session.scheduledAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-sage-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-clinical-500 text-sm">סוג מפגש:</span>
            <Badge variant="sage">{sessionTypeLabels[session.sessionType]}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-clinical-500 text-sm">מטופל:</span>
            <span className="font-medium text-clinical-900">
              {patient?.patientCode || 'טוען...'}
            </span>
          </div>

          {patient?.primaryDiagnosis && (
            <div className="flex items-center justify-between">
              <span className="text-clinical-500 text-sm">אבחנה:</span>
              <span className="text-sm text-clinical-700">{patient.primaryDiagnosis}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-clinical-500 text-sm">מיקום:</span>
            <span className="text-sm text-clinical-700">
              {session.location === 'in_person' && 'פנים אל פנים'}
              {session.location === 'telehealth' && 'טלה-בריאות'}
              {session.location === 'home_visit' && 'ביקור בית'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-clinical-500 text-sm">משך:</span>
            <span className="text-sm text-clinical-700">{session.duration} דקות</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={handleStartSession}
            className="w-full"
          >
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            התחל מפגש
          </Button>

          <Button
            variant="danger"
            onClick={handleMarkNoShow}
            loading={isLoading}
            className="w-full"
          >
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            המטופל לא הגיע
          </Button>

          <Button
            variant="ghost"
            onClick={onDismiss}
            className="w-full"
          >
            הזכר לי מאוחר יותר
          </Button>
        </div>
      </div>
    </Modal>
  );
}
