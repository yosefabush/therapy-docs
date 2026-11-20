import { describe, it, expect, vi, afterEach } from 'vitest';
import { transcriptionErrorMessage, transcribeWithDiarization } from './transcription-service';
import { isTranscriptionConfigured, TRANSCRIPTION_NOT_CONFIGURED_MESSAGE } from './transcription-config';

const HEBREW = /[\u0590-\u05FF]/;

describe('transcription errors are Hebrew, never raw English', () => {
  it('maps 503 / NOT_CONFIGURED to the "not configured" message', () => {
    expect(transcriptionErrorMessage(503)).toBe(TRANSCRIPTION_NOT_CONFIGURED_MESSAGE);
    expect(transcriptionErrorMessage(500, 'TRANSCRIPTION_NOT_CONFIGURED')).toBe(TRANSCRIPTION_NOT_CONFIGURED_MESSAGE);
  });
  it('maps other statuses to Hebrew text', () => {
    for (const status of [401, 413, 500, 502]) {
      expect(transcriptionErrorMessage(status)).toMatch(HEBREW);
    }
  });
});

describe('isTranscriptionConfigured', () => {
  it('is false for a missing or blank key and true otherwise (the key is never returned)', () => {
    expect(isTranscriptionConfigured({})).toBe(false);
    expect(isTranscriptionConfigured({ DEEPGRAM_API_KEY: '' })).toBe(false);
    expect(isTranscriptionConfigured({ DEEPGRAM_API_KEY: '   ' })).toBe(false);
    expect(isTranscriptionConfigured({ DEEPGRAM_API_KEY: 'abc' })).toBe(true);
  });
});

describe('transcribeWithDiarization', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the Hebrew not-configured message on a 503 and ignores the raw server text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ error: 'Deepgram API key not configured', code: 'TRANSCRIPTION_NOT_CONFIGURED' }), { status: 503 })
    ));
    const r = await transcribeWithDiarization('data:audio/webm;base64,AAAA');
    expect(r.success).toBe(false);
    expect(r.error).toBe(TRANSCRIPTION_NOT_CONFIGURED_MESSAGE);
    expect(r.code).toBe('TRANSCRIPTION_NOT_CONFIGURED');
  });

  it('survives a non-JSON error body (e.g. a platform 413 page)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Request Entity Too Large', { status: 413 })));
    const r = await transcribeWithDiarization('data:audio/webm;base64,AAAA');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(HEBREW);
  });

  it('returns Hebrew on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('socket hang up'); }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await transcribeWithDiarization('data:audio/webm;base64,AAAA');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(HEBREW);
  });
});
