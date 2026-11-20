import { describe, it, expect } from 'vitest';
import { checkAudioDataUrl, MAX_AUDIO_DATA_URL_BYTES } from './validate-audio';

describe('checkAudioDataUrl', () => {
  it('accepts the audio data URLs browsers produce', () => {
    for (const prefix of [
      'data:audio/webm;base64,',
      'data:audio/webm;codecs=opus;base64,',
      'data:audio/ogg;codecs=opus;base64,',
      'data:audio/mp4;base64,',
      'data:audio/mpeg;base64,',
      'data:audio/wav;base64,',
    ]) {
      expect(checkAudioDataUrl(prefix + 'AAAA'), prefix).toEqual({ ok: true });
    }
  });

  it('rejects non-audio data URLs and non-data-URL strings', () => {
    for (const bad of [
      'data:text/html;base64,PHNjcmlwdD4=',
      'data:image/png;base64,AAAA',
      'data:application/pdf;base64,AAAA',
      'https://example.com/a.webm',
      'AAAA',
      'data:audio/webm,not-base64',
      'data:audio/webm;base64,AA AA',
    ]) {
      const r = checkAudioDataUrl(bad);
      expect(r.ok, bad).toBe(false);
      if (!r.ok) expect(r.reason).toBe('type');
    }
  });

  it('rejects payloads over 4 MB with a Hebrew message', () => {
    const big = 'data:audio/webm;base64,' + 'A'.repeat(MAX_AUDIO_DATA_URL_BYTES);
    const r = checkAudioDataUrl(big);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('size');
      expect(r.message).toMatch(/[\u0590-\u05FF]/);
    }
  });

  it('accepts a payload just under the limit', () => {
    const prefix = 'data:audio/webm;base64,';
    const ok = prefix + 'A'.repeat(MAX_AUDIO_DATA_URL_BYTES - prefix.length);
    expect(checkAudioDataUrl(ok)).toEqual({ ok: true });
  });
});
