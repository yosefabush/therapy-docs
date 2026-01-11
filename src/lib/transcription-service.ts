import { DiarizedTranscript } from '@/types';

interface TranscriptionResult {
  success: boolean;
  data?: DiarizedTranscript;
  error?: string;
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

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to transcribe audio',
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
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
