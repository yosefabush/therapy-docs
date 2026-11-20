import { apiClient } from './client';

export type DeleteResult = { ok: true } | { ok: false; message: string };

const GENERIC_FAILURE = 'המחיקה נכשלה. אנא נסה שוב.';
const HEBREW = /[\u0590-\u05ff]/;

// DELETE /api/<endpoint> and turn the outcome into a Hebrew message for the UI.
// Server messages are shown only when they are already Hebrew (e.g. "המפגש
// נחתם ולא ניתן למחיקה"); anything else becomes a generic failure message.
export async function deleteResource(endpoint: string): Promise<DeleteResult> {
  const response = await apiClient.delete(endpoint);
  if (!response.error) return { ok: true };
  if (response.status === 403) return { ok: false, message: 'אין לך הרשאה למחוק פריט זה.' };
  if (response.status === 404) return { ok: false, message: 'הפריט לא נמצא או שכבר נמחק.' };
  return {
    ok: false,
    message: HEBREW.test(response.error) ? response.error : GENERIC_FAILURE,
  };
}
