import { DiarizedTranscript } from '@/types';
import {
  TRANSCRIPTION_NOT_CONFIGURED_CODE,
  TRANSCRIPTION_NOT_CONFIGURED_MESSAGE,
  TRANSCRIPTION_FAILED_MESSAGE,
  TRANSCRIPTION_TOO_LARGE_MESSAGE,
} from '@/lib/transcription-config';

interface TranscriptionResult {
  success: boolean;
  data?: DiarizedTranscript;
  error?: string;
  /** Machine-readable reason, e.g. TRANSCRIPTION_NOT_CONFIGURED. */
  code?: string;
}

/** Map a failed /api/transcribe response to a Hebrew, user-facing message. */
export function transcriptionErrorMessage(status: number, code?: string): string {
  if (status === 503 || code === TRANSCRIPTION_NOT_CONFIGURED_CODE) {
    return TRANSCRIPTION_NOT_CONFIGURED_MESSAGE;
  }
  if (status === 413 || code === 'AUDIO_TOO_LARGE') return TRANSCRIPTION_TOO_LARGE_MESSAGE;
  if (status === 401) return 'פג תוקף ההתחברות. התחברו מחדש ונסו שוב.';
  return TRANSCRIPTION_FAILED_MESSAGE;
}

/** Ask the server whether automatic transcription is configured. */
export async function fetchTranscriptionEnabled(): Promise<boolean> {
  try {
    const response = await fetch('/api/transcribe/config');
    if (!response.ok) return false;
    const result = await response.json();
    return result?.data?.enabled === true;
  } catch {
    return false;
  }
}

/**
 * Send audio to Deepgram for transcription with speaker diarization
 * @param audioData Base64 encoded audio data (data URL format)
 * @param language Language code (default: 'he' for Hebrew)
 * @returns Diarized transcript with speaker identification
 */
export async function transcribeWithDiarization(
  audioData: string,
  language: string = 'he'
): Promise<TranscriptionResult> {
  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData,
        language,
      }),
    });

    // The body is not JSON when a proxy rejects the request (e.g. 413 from the
    // platform), so never let parsing mask the HTTP status.
    const result = await response.json().catch(() => ({} as { error?: string; code?: string; data?: DiarizedTranscript }));

    if (!response.ok) {
      return {
        success: false,
        error: transcriptionErrorMessage(response.status, result.code),
        code: result.code,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Transcription service error:', error);
    return {
      success: false,
      error: TRANSCRIPTION_FAILED_MESSAGE,
    };
  }
}

/**
 * Format diarized transcript for display
 * @param transcript Diarized transcript object
 * @param speakerLabels Optional custom speaker labels
 * @returns Formatted string with speaker labels
 */
export function formatDiarizedTranscript(
  transcript: DiarizedTranscript,
  speakerLabels?: Record<number, string>
): string {
  const labels = speakerLabels || transcript.speakerLabels || {};

  return transcript.utterances
    .map((u) => {
      const label = labels[u.speaker] || u.speakerLabel || `דובר ${u.speaker + 1}`;
      return `${label}: ${u.transcript}`;
    })
    .join('\n\n');
}

/**
 * Get default speaker labels for therapy sessions
 */
export function getDefaultSpeakerLabels(): Record<number, string> {
  return {
    0: 'מטפל',
    1: 'מטופל',
  };
}
