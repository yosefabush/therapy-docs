'use client';

import React, { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from '@/components/ui';

interface SpeechTranscriptionProps {
  onTranscriptChange: (transcript: string) => void;
  savedTranscript: string;
  onClear: () => void;
}

export function SpeechTranscription({
  onTranscriptChange,
  savedTranscript,
  onClear,
}: SpeechTranscriptionProps) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Update parent when transcript changes
  useEffect(() => {
    if (transcript) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  const startTranscription = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'he-IL' });
  };

  const stopTranscription = () => {
    SpeechRecognition.stopListening();
  };

  const handleClear = () => {
    resetTranscript();
    onClear();
  };

  // Get the current display transcript
  const displayTranscript = listening
    ? (savedTranscript ? `${savedTranscript} ${transcript}` : transcript)
    : savedTranscript;

  if (!browserSupportsSpeechRecognition) {
    return (
      <p className="text-sm text-clinical-500">
        תמלול אוטומטי זמין רק בדפדפנים Chrome ו-Edge.
      </p>
    );
  }

  return (
    <>
      <div className="flex justify-center gap-2 mb-3">
        {!listening ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={startTranscription}
          >
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            התחל תמלול
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={stopTranscription}
          >
            <svg className="w-4 h-4 ml-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
            עצור תמלול
          </Button>
        )}
        {displayTranscript && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            נקה תמלול
          </Button>
        )}
      </div>

      {listening && (
        <p className="text-xs text-sage-600 mb-2 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          מאזין... דבר/י עכשיו
        </p>
      )}

      {displayTranscript ? (
        <div className="bg-white p-3 rounded border border-sage-200 min-h-[80px] max-h-[200px] overflow-y-auto">
          <p className="text-sm text-clinical-700 whitespace-pre-wrap leading-relaxed">
            {displayTranscript}
          </p>
        </div>
      ) : (
        <div className="bg-white p-3 rounded border border-sage-200 min-h-[80px] flex items-center justify-center">
          <p className="text-sm text-clinical-400">
            לחץ על &quot;התחל תמלול&quot; ודבר/י כדי ליצור תמלול
          </p>
        </div>
      )}
    </>
  );
}
