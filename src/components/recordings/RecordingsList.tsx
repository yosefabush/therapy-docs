'use client';

import React, { useState } from 'react';
import { VoiceRecording, Session } from '@/types';
import { Card, Badge, Modal, Button } from '@/components/ui';
import { AudioPlayer } from './AudioPlayer';

interface RecordingsListProps {
  recordings: VoiceRecording[];
  sessions?: Session[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function RecordingsList({ recordings, sessions = [], onDelete, loading }: RecordingsListProps) {
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <h3 className="text-lg font-medium text-clinical-900 mb-1">אין הקלטות עדיין</h3>
        <p className="text-clinical-500">הקלטות קוליות יופיעו כאן לאחר שמירה</p>
      </Card>
    );
  }

  // Group recordings by session
  const groupedBySession = recordings.reduce((groups, recording) => {
    const sessionId = recording.sessionId;
    if (!groups[sessionId]) {
      groups[sessionId] = [];
    }
    groups[sessionId].push(recording);
    return groups;
  }, {} as Record<string, VoiceRecording[]>);

  const getSessionInfo = (sessionId: string): Session | undefined => {
    return sessions.find(s => s.id === sessionId);
  };

  const getTranscriptionBadge = (status: VoiceRecording['transcriptionStatus']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">תומלל</Badge>;
      case 'processing':
        return <Badge variant="info">בעיבוד</Badge>;
      case 'failed':
        return <Badge variant="danger">נכשל</Badge>;
      default:
        return <Badge variant="sage">ממתין</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedBySession).map(([sessionId, sessionRecordings]) => {
        const session = getSessionInfo(sessionId);

        return (
          <Card key={sessionId}>
            {/* Session Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-sage-100">
              <div>
                <h4 className="font-medium text-clinical-900">
                  {session ? (
                    <>מפגש - {formatDate(session.scheduledAt)}</>
                  ) : (
                    <>מפגש {sessionId.slice(-6)}</>
                  )}
                </h4>
                {session && (
                  <p className="text-sm text-clinical-500">
                    {session.sessionType === 'individual_therapy' ? 'טיפול פרטני' :
                     session.sessionType === 'initial_assessment' ? 'הערכה ראשונית' :
                     session.sessionType}
                  </p>
                )}
              </div>
              <Badge variant="sage">{sessionRecordings.length} הקלטות</Badge>
            </div>

            {/* Recordings List */}
            <div className="space-y-4">
              {sessionRecordings.map((recording) => (
                <div key={recording.id} className="space-y-2">
                  {/* Recording Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-clinical-500">
                        {formatDate(recording.createdAt)}
                      </span>
                      {getTranscriptionBadge(recording.transcriptionStatus)}
                    </div>
                  </div>

                  {/* Audio Player */}
                  <AudioPlayer
                    audioUrl={recording.encryptedAudioUrl}
                    duration={recording.duration}
                    onDelete={() => setDeleteConfirmId(recording.id)}
                    showDelete={!!onDelete}
                  />

                  {/* Transcript */}
                  {recording.encryptedTranscript && recording.transcriptionStatus === 'completed' && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedTranscript(
                          expandedTranscript === recording.id ? null : recording.id
                        )}
                        className="text-sm text-sage-600 hover:text-sage-700 flex items-center gap-1"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedTranscript === recording.id ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {expandedTranscript === recording.id ? 'הסתר תמלול' : 'הצג תמלול'}
                      </button>

                      {expandedTranscript === recording.id && (
                        <div className="mt-2 p-3 bg-clinical-50 rounded-lg text-sm text-clinical-700 leading-relaxed">
                          {recording.encryptedTranscript}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="מחיקת הקלטה"
        size="sm"
      >
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-clinical-700 mb-6">
            האם אתה בטוח שברצונך למחוק הקלטה זו? פעולה זו לא ניתנת לביטול.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              ביטול
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              מחק הקלטה
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
