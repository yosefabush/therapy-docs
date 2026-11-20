// Server/client-safe constants for the automatic (Deepgram) transcription
// feature. Only the helper reads the environment, so it must run server-side.

export const TRANSCRIPTION_NOT_CONFIGURED_CODE = 'TRANSCRIPTION_NOT_CONFIGURED';

export const TRANSCRIPTION_NOT_CONFIGURED_MESSAGE =
  'תמלול אוטומטי עם זיהוי דוברים אינו מוגדר במערכת. פנו למנהל המערכת להפעלת השירות.';

export const TRANSCRIPTION_FAILED_MESSAGE =
  'שגיאה בעיבוד התמלול. נסו שוב מאוחר יותר.';

export const TRANSCRIPTION_TOO_LARGE_MESSAGE =
  'ההקלטה גדולה מדי לתמלול אוטומטי. קצרו את ההקלטה ונסו שוב.';

/** Server-side: is a Deepgram key available? (never exposes the key itself) */
export function isTranscriptionConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  return Boolean(env.DEEPGRAM_API_KEY && env.DEEPGRAM_API_KEY.trim());
}
