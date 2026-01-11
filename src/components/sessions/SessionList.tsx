'use client';

import React from 'react';
import Link from 'next/link';
import { Session, User } from '@/types';
import { Card, Badge, Avatar } from '@/components/ui';
import { therapistRoleLabels, sessionTypeLabels } from '@/lib/mock-data';

interface SessionListProps {
  sessions: Session[];
  therapists: User[];
  patientNames?: Record<string, string>;
  showPatient?: boolean;
}

export function SessionList({ sessions, therapists, patientNames, showPatient = true }: SessionListProps) {
  const getTherapist = (id: string) => therapists.find(t => t.id === id);

  const getStatusConfig = (status: Session['status']) => {
    const configs: Record<Session['status'], { variant: 'success' | 'warning' | 'danger' | 'info' | 'sage'; label: string }> = {
      scheduled: { variant: 'info', label: 'מתוכנן' },
      in_progress: { variant: 'warning', label: 'בתהליך' },
      completed: { variant: 'success', label: 'הושלם' },
      cancelled: { variant: 'sage', label: 'בוטל' },
      no_show: { variant: 'danger', label: 'לא הגיע' },
    };
    return configs[status];
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} דק'`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ש' ${mins} דק'` : `${hours} ש'`;
  };

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const therapist = getTherapist(session.therapistId);
        const statusConfig = getStatusConfig(session.status);

        return (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <Card 
              hover 
              padding="none"
              className="animate-in opacity-0"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Time Block */}
                  <div className="w-20 flex-shrink-0 text-center">
                    <div className="text-xs font-medium text-clinical-500 tracking-wide">
                      {new Intl.DateTimeFormat('he-IL', { weekday: 'short' }).format(new Date(session.scheduledAt))}
                    </div>
                    <div className="text-2xl font-semibold text-clinical-900">
                      {new Intl.DateTimeFormat('he-IL', { day: 'numeric' }).format(new Date(session.scheduledAt))}
                    </div>
                    <div className="text-xs text-clinical-500">
                      {new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(new Date(session.scheduledAt))}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-clinical-900">
                        {sessionTypeLabels[session.sessionType]}
                      </h3>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>

                    {showPatient && patientNames && (
                      <p className="text-sm text-sage-700 font-medium mb-1">
                        מטופל: {patientNames[session.patientId] || session.patientId}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-clinical-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Intl.DateTimeFormat('he-IL', { hour: 'numeric', minute: '2-digit' }).format(new Date(session.scheduledAt))}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {session.location === 'in_person' ? 'פנים אל פנים' : session.location === 'telehealth' ? 'טלה-בריאות' : 'ביקור בית'}
                      </span>
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                  </div>

                  {/* Therapist */}
                  {therapist && (
                    <div className="flex items-center gap-2">
                      <Avatar name={therapist.name} size="sm" />
                      <div className="text-right">
                        <p className="text-sm font-medium text-clinical-900">{therapist.name}</p>
                        <p className="text-xs text-clinical-500">
                          {therapistRoleLabels[session.therapistRole]}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-clinical-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Session Summary (if completed) */}
                {session.status === 'completed' && session.notes.assessment && (
                  <div className="mt-3 pt-3 border-t border-sage-100">
                    <p className="text-sm text-clinical-600 line-clamp-2">
                      {session.notes.assessment}
                    </p>
                    {session.signedAt && (
                      <p className="text-xs text-clinical-400 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        נחתם {new Intl.DateTimeFormat('he-IL', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(session.signedAt))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Today's Schedule Component
interface TodayScheduleProps {
  sessions: Session[];
  therapists: User[];
}

export function TodaySchedule({ sessions, therapists }: TodayScheduleProps) {
  const getTherapist = (id: string) => therapists.find(t => t.id === id);
  
  const now = new Date();
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  if (sessions.length === 0) {
    return (
      <Card className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-clinical-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-clinical-600">אין מפגשים מתוכננים להיום</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {sortedSessions.map(session => {
        const therapist = getTherapist(session.therapistId);
        const sessionTime = new Date(session.scheduledAt);
        const isPast = sessionTime < now;
        const isNext = !isPast && sortedSessions.findIndex(s => new Date(s.scheduledAt) > now) === sortedSessions.indexOf(session);

        return (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              isNext ? 'bg-sage-100 border border-sage-200' : 
              isPast ? 'bg-clinical-50 opacity-60' : 'hover:bg-sage-50'
            }`}>
              <div className="text-right w-16 flex-shrink-0">
                <span className={`text-sm font-medium ${isNext ? 'text-sage-700' : 'text-clinical-600'}`}>
                  {new Intl.DateTimeFormat('he-IL', { hour: 'numeric', minute: '2-digit' }).format(sessionTime)}
                </span>
              </div>
              
              <div className={`w-1 h-10 rounded-full ${
                session.status === 'completed' ? 'bg-green-400' :
                session.status === 'in_progress' ? 'bg-amber-400' :
                isNext ? 'bg-sage-500' : 'bg-clinical-200'
              }`} />
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isNext ? 'text-sage-900' : 'text-clinical-900'}`}>
                  {sessionTypeLabels[session.sessionType]}
                </p>
                {therapist && (
                  <p className="text-xs text-clinical-500">
                    {therapistRoleLabels[session.therapistRole]}
                  </p>
                )}
              </div>

              {session.status === 'completed' && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}

              {isNext && (
                <Badge variant="sage">הבא</Badge>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
