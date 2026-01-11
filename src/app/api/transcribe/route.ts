import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';
import { DiarizedTranscript, SpeakerUtterance } from '@/types';

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
    // Get the audio data from request
    const body = await request.json();
    const { audioData, language = 'he' } = body;

    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured. Please add DEEPGRAM_API_KEY to your environment variables.' },
        { status: 500 }
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
      console.error('Deepgram API error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: error.message },
        { status: 500 }
      );
    }

    // Process the response
    const channel = result?.results?.channels?.[0];
    const alternatives = channel?.alternatives?.[0];

    if (!alternatives) {
      return NextResponse.json(
        { error: 'No transcription results' },
        { status: 500 }
      );
    }

    // Get utterances with speaker info
    const utterances = result?.results?.utterances || [];

    // Count unique speakers
    const speakerSet = new Set<number>();
    utterances.forEach((u: any) => {
      if (typeof u.speaker === 'number') {
        speakerSet.add(u.speaker);
      }
    });

    // Format the diarized transcript
    const diarizedTranscript: DiarizedTranscript = {
      utterances: utterances.map((u: any): SpeakerUtterance => ({
        speaker: u.speaker ?? 0,
        transcript: u.transcript || '',
        start: u.start || 0,
        end: u.end || 0,
        confidence: u.confidence || 0,
      })),
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
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process transcription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
