'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AISummary } from '@/types';

type PanelState = 'empty' | 'generating' | 'preview' | 'saved' | 'error';

interface SummaryPanelProps {
  sessionId: string;
  existingSummary?: AISummary | null;
  hasNotes: boolean;
  onSummarySaved?: () => void;
}

interface GenerationMetadata {
  mode: 'mock' | 'real';
  model?: string;
  tokensUsed?: number;
  generatedAt: string;
}

export function SummaryPanel({
  sessionId,
  existingSummary,
  hasNotes,
  onSummarySaved,
}: SummaryPanelProps) {
  const [state, setState] = useState<PanelState>('empty');
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Initialize state based on existingSummary prop
  useEffect(() => {
    if (existingSummary) {
      setState('saved');
      setSummaryContent(existingSummary.content);
      setMetadata({
        mode: existingSummary.mode,
        model: existingSummary.model,
        tokensUsed: existingSummary.tokensUsed,
        generatedAt: typeof existingSummary.generatedAt === 'string'
          ? existingSummary.generatedAt
          : new Date(existingSummary.generatedAt).toISOString(),
      });
    }
  }, [existingSummary]);

  const handleGenerate = async () => {
    setState('generating');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setErrorMessage(result.error || 'Failed to generate summary');
        setState('error');
        return;
      }

      setSummaryContent(result.data.summary);
      setMetadata({
        mode: result.data.mode,
        model: result.data.model,
        tokensUsed: result.data.tokensUsed,
        generatedAt: result.data.generatedAt,
      });
      setState('preview');
    } catch (error) {
      setErrorMessage('Failed to connect to server');
      setState('error');
    }
  };

  const handleSave = async () => {
    if (!metadata) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/summary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summaryContent,
          mode: metadata.mode,
          model: metadata.model,
          tokensUsed: metadata.tokensUsed,
          generatedAt: metadata.generatedAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setErrorMessage(result.error || 'Failed to save summary');
        // Stay in preview state on save error
        return;
      }

      setState('saved');
      onSummarySaved?.();
    } catch (error) {
      setErrorMessage('Failed to connect to server');
    }
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  };

  // Empty state - no summary, show generate button
  if (state === 'empty') {
    return (
      <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="font-semibold text-sage-800">סיכום AI</h3>
        </div>
        <p className="text-sage-600 mb-4">
          ניתן ליצור סיכום אוטומטי של המפגש בעזרת AI
        </p>
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={!hasNotes}
          title={!hasNotes ? 'יש להוסיף תיעוד מפגש תחילה' : undefined}
        >
          יצירת סיכום
        </Button>
        {!hasNotes && (
          <p className="text-sm text-clinical-500 mt-2">
            יש להוסיף תיעוד מפגש תחילה
          </p>
        )}
      </Card>
    );
  }

  // Generating state - loading spinner
  if (state === 'generating') {
    return (
      <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="font-semibold text-sage-800">סיכום AI</h3>
        </div>
        <div className="flex items-center gap-3 text-sage-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>יוצר סיכום...</span>
        </div>
      </Card>
    );
  }

  // Error state - show error with retry
  if (state === 'error') {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-warm-50 border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-semibold text-red-800">שגיאה ביצירת סיכום</h3>
        </div>
        <p className="text-red-700 mb-4">{errorMessage}</p>
        <Button variant="primary" onClick={handleGenerate}>
          נסה שוב
        </Button>
      </Card>
    );
  }

  // Preview state - show summary with Save/Regenerate buttons
  if (state === 'preview') {
    return (
      <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="font-semibold text-sage-800">סיכום שנוצר ע"י AI</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={metadata?.mode === 'mock' ? 'warning' : 'info'}>
              {metadata?.mode === 'mock' ? 'מצב בדיקה' : 'AI'}
            </Badge>
            <Badge variant="outline">לא נשמר</Badge>
          </div>
        </div>
        <p className="text-sage-700 whitespace-pre-wrap mb-4">{summaryContent}</p>
        {metadata && (
          <p className="text-xs text-clinical-500 mb-4">
            נוצר: {formatDate(metadata.generatedAt)}
            {metadata.model && ` | מודל: ${metadata.model}`}
            {metadata.tokensUsed && ` | טוקנים: ${metadata.tokensUsed}`}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-600 mb-3">{errorMessage}</p>
        )}
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleSave}>
            שמירה
          </Button>
          <Button variant="secondary" onClick={handleRegenerate}>
            יצירה מחדש
          </Button>
        </div>
      </Card>
    );
  }

  // Saved state - show summary with Regenerate button and saved badge
  return (
    <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="font-semibold text-sage-800">סיכום AI נשמר</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={metadata?.mode === 'mock' ? 'warning' : 'info'}>
            {metadata?.mode === 'mock' ? 'מצב בדיקה' : 'AI'}
          </Badge>
          <Badge variant="success">נשמר</Badge>
        </div>
      </div>
      <p className="text-sage-700 whitespace-pre-wrap mb-4">{summaryContent}</p>
      {metadata && (
        <p className="text-xs text-clinical-500 mb-4">
          נוצר: {formatDate(metadata.generatedAt)}
          {metadata.model && ` | מודל: ${metadata.model}`}
        </p>
      )}
      <Button variant="secondary" onClick={handleRegenerate}>
        יצירה מחדש
      </Button>
    </Card>
  );
}
