'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

// Catches errors thrown in the root layout. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled root error:', error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
          אירעה שגיאה לא צפויה
        </h1>
        <p style={{ color: '#555', marginBottom: '1.5rem' }}>
          משהו השתבש. נסה לטעון מחדש את הדף.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#5b8a72',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.625rem 1.25rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          נסה שוב
        </button>
      </body>
    </html>
  );
}
