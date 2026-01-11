'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';

interface AudioTranscriptionProps {
  audioBlob: Blob | null;
  onTranscriptGenerated: (transcript: string) => void;
  savedTranscript?: string;
}

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

export function AudioTranscription({
  audioBlob,
  onTranscriptGenerated,
  savedTranscript,
}: AudioTranscriptionProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState(savedTranscript || '');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognitionType | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition() as SpeechRecognitionType;
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'he-IL';
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Update transcript when savedTranscript changes
  useEffect(() => {
    if (savedTranscript) {
      setTranscript(savedTranscript);
    }
  }, [savedTranscript]);

  const startListening = useCallback(() => {
    if (!recognition) {
      setError('תמלול קולי אינו נתמך בדפדפן זה. אנא השתמש ב-Chrome או Edge.');
      return;
    }

    setError(null);
    setIsListening(true);
    setIsTranscribing(true);

    let finalTranscript = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
          setTranscript(finalTranscript);
          onTranscriptGenerated(finalTranscript);
        } else {
          interimTranscript += result[0].transcript;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('לא זוהה דיבור. אנא דבר/י בקול רם יותר.');
      } else if (event.error === 'audio-capture') {
        setError('לא זוהה מיקרופון. אנא בדוק את החיבור.');
      } else if (event.error === 'not-allowed') {
        setError('הגישה למיקרופון נדחתה. אנא אשר גישה בהגדרות הדפדפן.');
      } else {
        setError('שגיאה בתמלול. אנא נסה שוב.');
      }
      setIsListening(false);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsTranscribing(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setError('שגיאה בהפעלת התמלול. אנא נסה שוב.');
      setIsListening(false);
      setIsTranscribing(false);
    }
  }, [recognition, transcript, onTranscriptGenerated]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    setIsTranscribing(false);
  }, [recognition]);

  const clearTranscript = () => {
    setTranscript('');
    onTranscriptGenerated('');
  };

  // Check if browser supports speech recognition
  const isSupported = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {!transcript ? (
          <>
            {!isListening ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={startListening}
                disabled={!isSupported}
              >
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                צור תמלול
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={stopListening}
              >
                <svg className="w-4 h-4 ml-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" />
                </svg>
                עצור תמלול
              </Button>
            )}
          </>
        ) : (
          <>
            {!isListening ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={startListening}
              >
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                הוסף לתמלול
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={stopListening}
              >
                <svg className="w-4 h-4 ml-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" />
                </svg>
                עצור
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTranscript}
              disabled={isListening}
            >
              נקה תמלול
            </Button>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}

      {isListening && (
        <p className="text-xs text-sage-600 text-center flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          מאזין... דבר/י עכשיו
        </p>
      )}

      {!isSupported && !transcript && (
        <p className="text-xs text-amber-600 text-center">
          תמלול קולי נתמך רק בדפדפני Chrome ו-Edge.
        </p>
      )}

      {transcript ? (
        <div className="bg-white p-3 rounded border border-sage-200 min-h-[80px] max-h-[200px] overflow-y-auto">
          <p className="text-sm text-clinical-700 whitespace-pre-wrap leading-relaxed">
            {transcript}
          </p>
        </div>
      ) : !isTranscribing && (
        <div className="bg-white p-3 rounded border border-sage-200 min-h-[80px] flex items-center justify-center">
          <p className="text-sm text-clinical-400 text-center">
            לחץ על &quot;צור תמלול&quot; ודבר/י כדי להוסיף תמלול להקלטה
          </p>
        </div>
      )}
    </div>
  );
}
