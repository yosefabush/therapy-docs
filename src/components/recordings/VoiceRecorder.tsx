'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { DiarizedTranscript } from '@/types';
import { transcribeWithDiarization, formatDiarizedTranscript, getDefaultSpeakerLabels } from '@/lib/transcription-service';

// Speech Recognition types
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

interface VoiceRecorderProps {
  sessionId: string;
  patientId: string;
  onRecordingComplete: (
    audioData: string,
    duration: number,
    transcript?: string,
    diarizedTranscript?: DiarizedTranscript
  ) => void;
  onClose: () => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export function VoiceRecorder({ sessionId, patientId, onRecordingComplete, onClose }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [consentObtained, setConsentObtained] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTranscript, setSavedTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [diarizedTranscript, setDiarizedTranscript] = useState<DiarizedTranscript | null>(null);
  const [isDiarizing, setIsDiarizing] = useState(false);
  const [diarizeError, setDiarizeError] = useState<string | null>(null);
  const [speakerLabels, setSpeakerLabels] = useState<Record<number, string>>(getDefaultSpeakerLabels());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const transcriptRef = useRef<string>('');

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as SpeechRecognitionType;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'he-IL';
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start speech recognition for transcription
  const startTranscription = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setTranscriptError('תמלול קולי אינו נתמך בדפדפן זה. אנא השתמש ב-Chrome או Edge.');
      return;
    }

    setTranscriptError(null);
    setIsTranscribing(true);
    transcriptRef.current = savedTranscript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcriptRef.current += result[0].transcript + ' ';
          setSavedTranscript(transcriptRef.current);
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Don't show error for no-speech, it's common during pauses
      } else if (event.error === 'audio-capture') {
        setTranscriptError('לא זוהה מיקרופון. אנא בדוק את החיבור.');
      } else if (event.error === 'not-allowed') {
        setTranscriptError('הגישה למיקרופון נדחתה.');
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording (speech recognition can stop unexpectedly)
      if (recordingState === 'recording' && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started or other error
        }
      } else {
        setIsTranscribing(false);
        setInterimTranscript('');
      }
    };

    try {
      recognition.start();
    } catch (err) {
      setTranscriptError('שגיאה בהפעלת התמלול.');
      setIsTranscribing(false);
    }
  }, [savedTranscript, recordingState]);

  // Stop speech recognition
  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsTranscribing(false);
    setInterimTranscript('');
  }, []);

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
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        setAudioBlob(blob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start transcription automatically
      startTranscription();

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
      // Pause transcription
      stopTranscription();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      // Resume transcription
      startTranscription();
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
      // Stop transcription
      stopTranscription();
    }
  };

  // Process audio with Deepgram for speaker diarization
  const processDiarization = useCallback(async (audioDataUrl: string) => {
    setIsDiarizing(true);
    setDiarizeError(null);

    try {
      const result = await transcribeWithDiarization(audioDataUrl, 'he');

      if (result.success && result.data) {
        // Apply custom speaker labels
        const dataWithLabels: DiarizedTranscript = {
          ...result.data,
          speakerLabels: speakerLabels,
        };
        setDiarizedTranscript(dataWithLabels);
      } else {
        setDiarizeError(result.error || 'שגיאה בעיבוד התמלול');
      }
    } catch (err) {
      console.error('Diarization error:', err);
      setDiarizeError('שגיאה בעיבוד התמלול עם זיהוי דוברים');
    } finally {
      setIsDiarizing(false);
    }
  }, [speakerLabels]);

  const [speakerLabelConfirmed, setSpeakerLabelConfirmed] = useState(false);

  const handleSave = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    // Alert once to confirm speaker labels if diarization was used
    if (diarizedTranscript && !speakerLabelConfirmed) {
      const labelsText = Object.entries(speakerLabels)
        .map(([num, label]) => `${label}`)
        .join(', ');
      const confirmed = window.confirm(
        `אנא ודא ששמות הדוברים נכונים:\n${labelsText}\n\nהאם השמות נכונים?`
      );
      if (!confirmed) return;
      setSpeakerLabelConfirmed(true);
    }

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      onRecordingComplete(
        base64data,
        recordingTime,
        savedTranscript || undefined,
        diarizedTranscript || undefined
      );
    };
    reader.readAsDataURL(audioBlob);
  }, [recordingTime, onRecordingComplete, savedTranscript, diarizedTranscript, speakerLabels, speakerLabelConfirmed]);

  const handleReset = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingState('idle');
    audioChunksRef.current = [];
    setSavedTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    setTranscriptError(null);
    setDiarizedTranscript(null);
    setDiarizeError(null);
    setSpeakerLabelConfirmed(false);
  };

  const clearTranscript = () => {
    setSavedTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    setDiarizedTranscript(null);
  };

  // Update speaker label
  const updateSpeakerLabel = (speakerNum: number, label: string) => {
    setSpeakerLabels(prev => ({
      ...prev,
      [speakerNum]: label,
    }));
    // Update diarized transcript with new label
    if (diarizedTranscript) {
      setDiarizedTranscript({
        ...diarizedTranscript,
        speakerLabels: {
          ...diarizedTranscript.speakerLabels,
          [speakerNum]: label,
        },
      });
    }
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

      {/* Live Transcription during Recording */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="mt-4 p-4 bg-sage-50 border border-sage-200 rounded-lg text-right">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-clinical-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              תמלול בזמן אמת
              {isTranscribing && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </h4>
            {(savedTranscript || interimTranscript) && (
              <Button variant="ghost" size="sm" onClick={clearTranscript}>
                נקה תמלול
              </Button>
            )}
          </div>

          {transcriptError && (
            <p className="text-xs text-red-600 mb-2">{transcriptError}</p>
          )}

          <div className="bg-white p-3 rounded border border-sage-200 min-h-[80px] max-h-[200px] overflow-y-auto">
            {savedTranscript || interimTranscript ? (
              <p className="text-sm text-clinical-700 whitespace-pre-wrap leading-relaxed text-right">
                {savedTranscript}
                {interimTranscript && (
                  <span className="text-clinical-400">{interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-clinical-400 text-center">
                {isTranscribing ? 'מאזין... דבר/י עכשיו' : 'התמלול יופיע כאן בזמן ההקלטה'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Audio Preview after stopping */}
      {recordingState === 'stopped' && audioPreviewUrl && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-clinical-900">תצוגה מקדימה</h4>
          <audio
            src={audioPreviewUrl}
            controls
            className="w-full"
          />

          {/* Live Transcription Section */}
          {savedTranscript && (
            <div className="mt-4 p-4 bg-sage-50 border border-sage-200 rounded-lg text-right">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-clinical-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  תמלול חי (ללא זיהוי דוברים)
                </h4>
              </div>
              <div className="bg-white p-3 rounded border border-sage-200 max-h-[100px] overflow-y-auto">
                <p className="text-sm text-clinical-700 whitespace-pre-wrap leading-relaxed text-right">
                  {savedTranscript}
                </p>
              </div>
            </div>
          )}

          {/* Deepgram Diarization Section */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-clinical-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                תמלול עם זיהוי דוברים (Deepgram)
              </h4>
            </div>

            {/* Diarization Button */}
            {!diarizedTranscript && !isDiarizing && (
              <div className="text-center py-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Get audio data URL to send to Deepgram
                    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                    const blob = new Blob(audioChunksRef.current, { type: mimeType });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64data = reader.result as string;
                      processDiarization(base64data);
                    };
                    reader.readAsDataURL(blob);
                  }}
                >
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  צור תמלול עם זיהוי דוברים
                </Button>
                <p className="text-xs text-clinical-500 mt-2">
                  * משתמש ב-Deepgram AI לזיהוי מי מדבר בכל משפט
                </p>
              </div>
            )}

            {/* Loading State */}
            {isDiarizing && (
              <div className="text-center py-6">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-clinical-600">מעבד תמלול עם זיהוי דוברים...</p>
                <p className="text-xs text-clinical-400 mt-1">התהליך עשוי לקחת מספר שניות</p>
              </div>
            )}

            {/* Error State */}
            {diarizeError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-sm text-red-700">{diarizeError}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setDiarizeError(null)}
                >
                  נסה שוב
                </Button>
              </div>
            )}

            {/* Diarized Transcript Display */}
            {diarizedTranscript && (
              <div className="space-y-3">
                {/* Speaker Labels Editor */}
                <div className="flex flex-wrap gap-2 pb-3 border-b border-blue-200">
                  <span className="text-xs text-clinical-500 ml-2">הגדר שמות דוברים:</span>
                  {Array.from({ length: diarizedTranscript.speakerCount }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: idx === 0 ? '#10B981' : '#3B82F6' }}
                      ></span>
                      <input
                        type="text"
                        value={speakerLabels[idx]}
                        onChange={(e) => updateSpeakerLabel(idx, e.target.value)}
                        className="text-xs px-2 py-1 border border-sage-300 rounded w-20 text-right"
                      />
                    </div>
                  ))}
                </div>

                {/* Utterances */}
                <div className="bg-white p-3 rounded border border-blue-200 max-h-[250px] overflow-y-auto space-y-3">
                  {diarizedTranscript.utterances.map((utterance, idx) => {
                    const label = speakerLabels[utterance.speaker] || `דובר ${utterance.speaker + 1}`;
                    const isTherapist = utterance.speaker === 0;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded ${isTherapist ? 'bg-green-50 border-r-4 border-green-500' : 'bg-blue-50 border-r-4 border-blue-500'}`}
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

                {/* Summary */}
                <div className="text-xs text-clinical-500 text-center">
                  זוהו {diarizedTranscript.speakerCount} דוברים • {diarizedTranscript.utterances.length} קטעי דיבור
                </div>
              </div>
            )}
          </div>

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
