import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';
import { DiarizedTranscript, SpeakerUtterance } from '@/types';
import { logger } from '@/lib/logger';
import { getSession, unauthorized } from '@/lib/auth/authz';
import {
  isTranscriptionConfigured,
  TRANSCRIPTION_NOT_CONFIGURED_CODE,
  TRANSCRIPTION_NOT_CONFIGURED_MESSAGE,
  TRANSCRIPTION_FAILED_MESSAGE,
  TRANSCRIPTION_TOO_LARGE_MESSAGE,
} from '@/lib/transcription-config';

// Reject oversized payloads early (base64 inflates size ~33%); ~25MB of audio.
const MAX_AUDIO_BYTES = 35 * 1024 * 1024;
const SUPPORTED_LANGUAGES = ['he', 'en'];

// Initialize Deepgram client
const getDeepgramClient = () => {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not configured');
  }
  return createClient(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) return unauthorized();

    // No Deepgram key: answer with a clear, translatable status before reading
    // the (large) body. 503 = the feature is unavailable, not a server fault.
    if (!isTranscriptionConfigured()) {
      return NextResponse.json(
        {
          error: TRANSCRIPTION_NOT_CONFIGURED_MESSAGE,
          code: TRANSCRIPTION_NOT_CONFIGURED_CODE,
        },
        { status: 503 }
      );
    }

    // Get the audio data from request
    const body = await request.json();
    const { audioData, language = 'he' } = body;

    if (!audioData || typeof audioData !== 'string') {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    if (typeof language !== 'string' || !SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: 'Unsupported language' },
        { status: 400 }
      );
    }

    if (audioData.length > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: TRANSCRIPTION_TOO_LARGE_MESSAGE, code: 'AUDIO_TOO_LARGE' },
        { status: 413 }
      );
    }

    const deepgram = getDeepgramClient();

    // Convert base64 to buffer
    // audioData format: "data:audio/webm;base64,XXXX..."
    const base64Data = audioData.split(',')[1] || audioData;
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Determine mime type from data URL
    const mimeMatch = audioData.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';

    // Call Deepgram API with diarization
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: language === 'he' ? 'whisper-large' : 'nova-2',
        language: language,
        diarize: true,
        utterances: true,
        smart_format: true,
        punctuate: true,
        mimetype: mimeType,
      }
    );

    if (error) {
      logger.error('Deepgram API error:', error);
      return NextResponse.json(
        { error: TRANSCRIPTION_FAILED_MESSAGE, code: 'TRANSCRIPTION_FAILED' },
        { status: 500 }
      );
    }

    // Process the response
    const channel = result?.results?.channels?.[0];
    const alternatives = channel?.alternatives?.[0];

    if (!alternatives) {
      return NextResponse.json(
        { error: TRANSCRIPTION_FAILED_MESSAGE, code: 'NO_TRANSCRIPTION_RESULTS' },
        { status: 500 }
      );
    }

    const rawUtterances = result?.results?.utterances || [];
    const words = alternatives?.words || [];
    // Diagnostics only (counts, not transcript content) and suppressed in prod.
    logger.debug('[Deepgram] utterances:', rawUtterances.length, 'words:', words.length);

    // Build speaker utterances - prefer utterances array if it has speaker data,
    // otherwise build from word-level speaker info
    const utterancesSpeakers = new Set(rawUtterances.map((u: any) => u.speaker).filter((s: any) => typeof s === 'number'));
    const wordsSpeakers = new Set(words.map((w: any) => w.speaker).filter((s: any) => typeof s === 'number'));

    let speakerUtterances: SpeakerUtterance[];
    let speakerSet: Set<number>;

    if (utterancesSpeakers.size > 1) {
      // Utterances have multiple speakers - use them directly
      speakerSet = utterancesSpeakers;
      speakerUtterances = rawUtterances.map((u: any): SpeakerUtterance => ({
        speaker: u.speaker ?? 0,
        transcript: u.transcript || '',
        start: u.start || 0,
        end: u.end || 0,
        confidence: u.confidence || 0,
      }));
    } else if (wordsSpeakers.size > 1) {
      // Words have speaker info but utterances don't - build segments from words
      logger.debug('[Deepgram] Building utterances from word-level speaker data');
      speakerSet = wordsSpeakers;
      speakerUtterances = [];
      let currentSpeaker = words[0]?.speaker ?? 0;
      let currentWords: string[] = [];
      let segmentStart = words[0]?.start ?? 0;
      let segmentEnd = 0;
      let confidenceSum = 0;
      let wordCount = 0;

      for (const word of words) {
        const speaker = word.speaker ?? 0;
        if (speaker !== currentSpeaker && currentWords.length > 0) {
          speakerUtterances.push({
            speaker: currentSpeaker,
            transcript: currentWords.join(' '),
            start: segmentStart,
            end: segmentEnd,
            confidence: wordCount > 0 ? confidenceSum / wordCount : 0,
          });
          currentWords = [];
          currentSpeaker = speaker;
          segmentStart = word.start || 0;
          confidenceSum = 0;
          wordCount = 0;
        }
        currentWords.push(word.punctuated_word || word.word || '');
        segmentEnd = word.end || 0;
        confidenceSum += word.confidence || 0;
        wordCount++;
      }
      // Push last segment
      if (currentWords.length > 0) {
        speakerUtterances.push({
          speaker: currentSpeaker,
          transcript: currentWords.join(' '),
          start: segmentStart,
          end: segmentEnd,
          confidence: wordCount > 0 ? confidenceSum / wordCount : 0,
        });
      }
    } else {
      // No multi-speaker data found - return what we have
      speakerSet = utterancesSpeakers.size > 0 ? utterancesSpeakers : new Set([0]);
      speakerUtterances = rawUtterances.map((u: any): SpeakerUtterance => ({
        speaker: u.speaker ?? 0,
        transcript: u.transcript || '',
        start: u.start || 0,
        end: u.end || 0,
        confidence: u.confidence || 0,
      }));
    }

    // Format the diarized transcript
    const diarizedTranscript: DiarizedTranscript = {
      utterances: speakerUtterances,
      speakerCount: speakerSet.size || 1,
      rawTranscript: alternatives.transcript || '',
      speakerLabels: {
        0: 'דובר 1',
        1: 'דובר 2',
      },
    };

    return NextResponse.json({
      success: true,
      data: diarizedTranscript,
    });

  } catch (error) {
    logger.error('Transcription error:', error);
    return NextResponse.json(
      { error: TRANSCRIPTION_FAILED_MESSAGE, code: 'TRANSCRIPTION_FAILED' },
      { status: 500 }
    );
  }
}
