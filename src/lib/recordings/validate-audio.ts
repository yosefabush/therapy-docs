// Shared (client + server) checks for a recorded-audio data URL.
//
// The audio travels inside a JSON request body and Vercel rejects request
// bodies above 4.5 MB, so the data URL itself is capped at 4 MB, leaving room
// for the transcript and the rest of the JSON.

export const MAX_AUDIO_DATA_URL_BYTES = 4 * 1024 * 1024;

export const AUDIO_TOO_LARGE_MESSAGE =
  'ההקלטה גדולה מדי (מעל 4MB). קצרו את ההקלטה או פצלו אותה להקלטות קצרות ונסו שוב.';
export const AUDIO_BAD_TYPE_MESSAGE =
  'קובץ ההקלטה אינו בפורמט אודיו נתמך. ניתן לשמור רק הקלטות קול.';

// data:audio/<subtype>[;codecs=...][;param=value]*;base64,<payload>
const AUDIO_DATA_URL = /^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=.,+_ -]+)*;base64,[A-Za-z0-9+/]*={0,2}$/i;
const AUDIO_PREFIX = /^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=.,+_ -]+)*;base64,/i;

export type AudioCheck =
  | { ok: true }
  | { ok: false; reason: 'type' | 'size'; message: string };

export function checkAudioDataUrl(dataUrl: string): AudioCheck {
  if (dataUrl.length > MAX_AUDIO_DATA_URL_BYTES) {
    return { ok: false, reason: 'size', message: AUDIO_TOO_LARGE_MESSAGE };
  }
  // Test the prefix first so a huge payload is never run through the full regex
  // for an obviously wrong type.
  if (!AUDIO_PREFIX.test(dataUrl) || !AUDIO_DATA_URL.test(dataUrl)) {
    return { ok: false, reason: 'type', message: AUDIO_BAD_TYPE_MESSAGE };
  }
  return { ok: true };
}
