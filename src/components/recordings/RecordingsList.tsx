'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { VoiceRecording, Session, DiarizedTranscript } from '@/types';
import { Card, Badge, Modal, Button } from '@/components/ui';
import { AudioPlayer } from './AudioPlayer';

// Dynamically import AudioTranscription (client-only)
const AudioTranscription = dynamic(
  () => import('./AudioTranscription').then((mod) => mod.AudioTranscription),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm text-clinical-400">טוען תמלול...</p>
      </div>
    ),
  }
);

interface RecordingsListProps {
  recordings: VoiceRecording[];
  sessions?: Session[];
  onDelete?: (id: string) => void;
  onUpdateTranscript?: (id: string, transcript: string) => void;
  loading?: boolean;
}

export function RecordingsList({ recordings, sessions = [], onDelete, onUpdateTranscript, loading }: RecordingsListProps) {
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [audioBlobs, setAudioBlobs] = useState<Record<string, Blob>>({});
  const [pendingTranscripts, setPendingTranscripts] = useState<Record<string, string>>({});
  const [loadingBlob, setLoadingBlob] = useState<string | null>(null);

  // Fetch audio from URL and convert to Blob
  const fetchAudioBlob = useCallback(async (recordingId: string, audioUrl: string) => {
    if (audioBlobs[recordingId]) return; // Already fetched

    setLoadingBlob(recordingId);
    try {
      // If it's a base64 data URL, convert directly
      if (audioUrl.startsWith('data:')) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        setAudioBlobs(prev => ({ ...prev, [recordingId]: blob }));
      } else {
        // Fetch from URL
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        setAudioBlobs(prev => ({ ...prev, [recordingId]: blob }));
      }
    } catch (err) {
      console.error('Error fetching audio blob:', err);
    } finally {
      setLoadingBlob(null);
    }
  }, [audioBlobs]);

  // Handle starting transcription - fetch blob first
  const handleStartTranscription = useCallback(async (recording: VoiceRecording) => {
    setTranscribingId(recording.id);
    await fetchAudioBlob(recording.id, recording.encryptedAudioUrl);
  }, [fetchAudioBlob]);

  // Handle transcript generated from AudioTranscription
  const handleTranscriptGenerated = useCallback((recordingId: string, transcript: string) => {
    setPendingTranscripts(prev => ({ ...prev, [recordingId]: transcript }));
  }, []);

  const handleSaveTranscript = useCallback((recordingId: string) => {
    const transcript = pendingTranscripts[recordingId];
    if (transcript && onUpdateTranscript) {
      onUpdateTranscript(recordingId, transcript);
      setPendingTranscripts(prev => {
        const updated = { ...prev };
        delete updated[recordingId];
        return updated;
      });
      setAudioBlobs(prev => {
        const updated = { ...prev };
        delete updated[recordingId];
        return updated;
      });
      setTranscribingId(null);
    }
  }, [pendingTranscripts, onUpdateTranscript]);

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

                  {/* Generate Transcript Button - Show when no transcript exists */}
                  {recording.transcriptionStatus !== 'completed' && !recording.encryptedTranscript && (
                    <div className="mt-3">
                      {transcribingId === recording.id ? (
                        <div className="p-4 bg-sage-50 border border-sage-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-clinical-900 flex items-center gap-2">
                              <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              תמלול הקלטה
                            </h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTranscribingId(null)}
                            >
                              סגור
                            </Button>
                          </div>

                          {loadingBlob === recording.id ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
                              <span className="mr-2 text-sm text-clinical-500">טוען הקלטה...</span>
                            </div>
                          ) : (
                            <AudioTranscription
                              audioBlob={audioBlobs[recording.id] || null}
                              onTranscriptGenerated={(text) => handleTranscriptGenerated(recording.id, text)}
                              savedTranscript={pendingTranscripts[recording.id]}
                            />
                          )}

                          {pendingTranscripts[recording.id] && (
                            <div className="mt-3 flex justify-end">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSaveTranscript(recording.id)}
                              >
                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                שמור תמלול
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartTranscription(recording)}
                          disabled={loadingBlob === recording.id}
                        >
                          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          צור תמלול
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Transcripts Section */}
                  {(recording.encryptedTranscript || recording.diarizedTranscript) && (
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
                        <div className="mt-2 space-y-4">
                          {/* Live Transcript Section */}
                          {recording.encryptedTranscript && (
                            <div className="p-3 bg-sage-50 border border-sage-200 rounded-lg">
                              <h5 className="text-sm font-medium text-clinical-900 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                תמלול חי (ללא זיהוי דוברים)
                              </h5>
                              <div className="text-sm text-clinical-700 leading-relaxed text-right">
                                {recording.encryptedTranscript}
                              </div>
                            </div>
                          )}

                          {/* Diarized Transcript Section */}
                          {recording.diarizedTranscript && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="text-sm font-medium text-clinical-900 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                תמלול עם זיהוי דוברים
                                <Badge variant="info" className="mr-auto">
                                  {recording.diarizedTranscript.speakerCount} דוברים
                                </Badge>
                              </h5>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {recording.diarizedTranscript.utterances.map((utterance, idx) => {
                                  const speakerLabels = recording.diarizedTranscript?.speakerLabels || {};
                                  const label = speakerLabels[utterance.speaker] || `דובר ${utterance.speaker + 1}`;
                                  const isTherapist = utterance.speaker === 0;
                                  return (
                                    <div
                                      key={idx}
                                      className={`p-2 rounded ${isTherapist ? 'bg-green-50 border-r-4 border-green-500' : 'bg-blue-100 border-r-4 border-blue-500'}`}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-medium ${isTherapist ? 'text-green-700' : 'text-blue-700'}`}>
                                          {label}
                                        </span>
                                        <span className="text-xs text-clinical-400">
                                          {Math.floor(utterance.start / 60)}:{String(Math.floor(utterance.start % 60)).padStart(2, '0')}
                                        </span>
                                      </div>
                                      <p className="text-sm text-clinical-700 text-right leading-relaxed">
                                        {utterance.transcript}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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
