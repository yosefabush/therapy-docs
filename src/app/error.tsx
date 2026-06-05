'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

// Route-level error boundary. Shows a friendly message and never exposes
// internal error details to the user.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled UI error:', error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center bg-clinical-50 px-4 text-center"
    >
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-clinical-900 mb-3">
          אירעה שגיאה לא צפויה
        </h1>
        <p className="text-clinical-600 mb-6">
          משהו השתבש בטעינת הדף. נסה שוב, ואם הבעיה נמשכת פנה לתמיכה.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-sage-600 px-5 py-2.5 text-white font-medium hover:bg-sage-700 transition-colors"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
