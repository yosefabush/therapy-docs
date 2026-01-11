'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';

interface VoiceRecorderProps {
  sessionId: string;
  patientId: string;
  onRecordingComplete: (audioData: string, duration: number) => void;
  onClose: () => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export function VoiceRecorder({ sessionId, patientId, onRecordingComplete, onClose }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [consentObtained, setConsentObtained] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!consentObtained) {
      setError('יש לאשר הסכמה לפני ההקלטה');
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Try WebM first (Chrome/Firefox), fallback to other formats
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(url);
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('לא ניתן להפעיל את המיקרופון. אנא ודא שיש הרשאות מתאימות.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSave = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      onRecordingComplete(base64data, recordingTime);
    };
    reader.readAsDataURL(audioBlob);
  }, [recordingTime, onRecordingComplete]);

  const handleReset = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    setRecordingState('idle');
    audioChunksRef.current = [];
  };

  return (
    <div className="text-center">
      {/* Consent Checkbox */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-right">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentObtained}
            onChange={(e) => setConsentObtained(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-sage-300 text-sage-600 focus:ring-sage-500"
          />
          <span className="text-sm text-amber-800">
            <strong>הסכמה להקלטה (HIPAA):</strong> אני מאשר/ת כי קיבלתי הסכמה מפורשת מהמטופל
            להקלטה זו, בהתאם לדרישות הפרטיות והסודיות.
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Recording Visualizer */}
      <div className="mb-6">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
          recordingState === 'recording'
            ? 'bg-red-100 animate-pulse'
            : recordingState === 'paused'
              ? 'bg-amber-100'
              : 'bg-sage-100'
        }`}>
          <svg
            className={`w-10 h-10 ${
              recordingState === 'recording'
                ? 'text-red-600'
                : recordingState === 'paused'
                  ? 'text-amber-600'
                  : 'text-sage-600'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>

        <p className="text-2xl font-mono text-clinical-900 mt-4">{formatTime(recordingTime)}</p>
        <p className="text-sm text-clinical-500 mt-1">
          {recordingState === 'idle' && 'לחץ להתחלת הקלטה'}
          {recordingState === 'recording' && 'מקליט...'}
          {recordingState === 'paused' && 'מושהה'}
          {recordingState === 'stopped' && 'הקלטה הושלמה'}
        </p>
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center gap-3 mb-6">
        {recordingState === 'idle' && (
          <Button
            variant="primary"
            onClick={startRecording}
            disabled={!consentObtained}
          >
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
            התחל הקלטה
          </Button>
        )}

        {recordingState === 'recording' && (
          <>
            <Button variant="secondary" onClick={pauseRecording}>
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              השהה
            </Button>
            <Button variant="danger" onClick={stopRecording}>
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              עצור
            </Button>
          </>
        )}

        {recordingState === 'paused' && (
          <>
            <Button variant="primary" onClick={resumeRecording}>
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              המשך
            </Button>
            <Button variant="danger" onClick={stopRecording}>
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              עצור
            </Button>
          </>
        )}
      </div>

      {/* Audio Preview */}
      {recordingState === 'stopped' && audioPreviewUrl && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-clinical-900">תצוגה מקדימה</h4>
          <audio
            src={audioPreviewUrl}
            controls
            className="w-full"
          />

          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={handleReset}>
              הקלט מחדש
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              שמור הקלטה
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {recordingState === 'idle' && (
        <Button variant="ghost" onClick={onClose} className="mt-4">
          ביטול
        </Button>
      )}

      {/* HIPAA Notice */}
      <p className="text-xs text-clinical-400 mt-6">
        <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        כל ההקלטות מוצפנות ותואמות לתקן HIPAA
      </p>
    </div>
  );
}
