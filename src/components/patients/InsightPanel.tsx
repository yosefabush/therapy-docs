'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PatientInsights, InsightItem } from '@/types';

type PanelState = 'empty' | 'generating' | 'preview' | 'saved' | 'error';

interface InsightPanelProps {
  patientId: string;
  patientName: string;
  existingInsights?: PatientInsights | null;
  onInsightsSaved?: () => void;
}

interface GenerationMetadata {
  mode: 'mock' | 'real';
  model?: string;
  tokensUsed?: number;
  generatedAt: string;
}

// Category configuration with Hebrew labels and icons
const CATEGORIES = {
  patterns: {
    label: 'דפוסים',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  progressTrends: {
    label: 'מגמות התקדמות',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  riskIndicators: {
    label: 'מדדי סיכון',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  treatmentGaps: {
    label: 'פערים בטיפול',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

// Confidence badge color based on score
function getConfidenceBadge(confidence: number): { variant: 'success' | 'warning' | 'sage'; label: string } {
  if (confidence >= 0.9) {
    return { variant: 'success', label: 'גבוה' };
  } else if (confidence >= 0.7) {
    return { variant: 'warning', label: 'בינוני' };
  } else {
    return { variant: 'sage', label: 'נמוך' };
  }
}

// Render a single insight item
function InsightItemDisplay({ item }: { item: InsightItem }) {
  const confidenceBadge = getConfidenceBadge(item.confidence);

  return (
    <div className="p-3 bg-white rounded-lg border border-sage-100">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-clinical-800 flex-1">{item.content}</p>
        <Badge variant={confidenceBadge.variant} className="text-xs shrink-0">
          {confidenceBadge.label}
        </Badge>
      </div>
      {item.sessionRefs && item.sessionRefs.length > 0 && (
        <p className="text-xs text-clinical-400 mt-2">
          מבוסס על {item.sessionRefs.length} מפגשים
        </p>
      )}
    </div>
  );
}

// Render a category section
function CategorySection({
  categoryKey,
  items,
}: {
  categoryKey: CategoryKey;
  items: InsightItem[];
}) {
  const category = CATEGORIES[categoryKey];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sage-600">{category.icon}</span>
        <h4 className="text-sm font-medium text-clinical-800">{category.label}</h4>
        <Badge variant="outline" className="text-xs">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <InsightItemDisplay key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

export function InsightPanel({
  patientId,
  patientName,
  existingInsights,
  onInsightsSaved,
}: InsightPanelProps) {
  const [state, setState] = useState<PanelState>('empty');
  const [insights, setInsights] = useState<PatientInsights | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize state based on existingInsights prop
  useEffect(() => {
    if (existingInsights) {
      setState('saved');
      setInsights(existingInsights);
      setMetadata({
        mode: existingInsights.mode,
        model: existingInsights.model,
        tokensUsed: existingInsights.tokensUsed,
        generatedAt:
          typeof existingInsights.generatedAt === 'string'
            ? existingInsights.generatedAt
            : new Date(existingInsights.generatedAt).toISOString(),
      });
    }
  }, [existingInsights]);

  const handleGenerate = async () => {
    setState('generating');
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      // Handle error response
      if (!response.ok || result.error) {
        setError(result.error || `Failed to generate insights (${response.status})`);
        setState('error');
        return;
      }

      // Handle success - response format: { data: PatientInsights }
      if (result.data) {
        setInsights(result.data);
        setMetadata({
          mode: result.data.mode,
          model: result.data.model,
          tokensUsed: result.data.tokensUsed,
          generatedAt:
            typeof result.data.generatedAt === 'string'
              ? result.data.generatedAt
              : new Date(result.data.generatedAt).toISOString(),
        });
        setState('preview');
      } else {
        setError('Invalid response format from server');
        setState('error');
      }
    } catch (err) {
      console.error('Insight generation failed:', err);
      setError('Network error - could not connect to server');
      setState('error');
    }
  };

  const handleRegenerate = () => {
    // Clear current insights and regenerate
    handleGenerate();
  };

  const handleSave = async () => {
    // Note: Save functionality will be implemented in Plan 03
    // For now, just transition to saved state
    setState('saved');
    onInsightsSaved?.();
  };

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  };

  // Empty state - no insights, show generate button
  if (state === 'empty') {
    return (
      <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-sage-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="font-semibold text-sage-800">תובנות AI</h3>
        </div>
        <p className="text-sage-600 mb-4">ניתח את כל המפגשים של {patientName} וזהה דפוסים ומגמות</p>
        <Button variant="primary" onClick={handleGenerate}>
          יצירת תובנות
        </Button>
      </Card>
    );
  }

  // Generating state - loading spinner
  if (state === 'generating') {
    return (
      <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-sage-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="font-semibold text-sage-800">תובנות AI</h3>
        </div>
        <div className="flex items-center gap-3 text-sage-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>מייצר תובנות...</span>
        </div>
      </Card>
    );
  }

  // Error state - show error with retry
  if (state === 'error') {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-warm-50 border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="font-semibold text-red-800">שגיאה ביצירת תובנות</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button variant="primary" onClick={handleGenerate}>
          נסה שוב
        </Button>
      </Card>
    );
  }

  // Preview and Saved states - show insights with action buttons
  const isSaved = state === 'saved';

  return (
    <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-sage-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="font-semibold text-sage-800">
            {isSaved ? 'תובנות AI נשמרו' : 'תובנות שנוצרו ע"י AI'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={metadata?.mode === 'mock' ? 'warning' : 'info'}>
            {metadata?.mode === 'mock' ? 'מצב בדיקה' : 'AI'}
          </Badge>
          <Badge variant={isSaved ? 'success' : 'outline'}>{isSaved ? 'נשמר' : 'לא נשמר'}</Badge>
        </div>
      </div>

      {/* Insights by category */}
      {insights && (
        <div className="space-y-4 mb-4">
          <CategorySection categoryKey="patterns" items={insights.patterns} />
          <CategorySection categoryKey="progressTrends" items={insights.progressTrends} />
          <CategorySection categoryKey="riskIndicators" items={insights.riskIndicators} />
          <CategorySection categoryKey="treatmentGaps" items={insights.treatmentGaps} />
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <p className="text-xs text-clinical-500 mb-4">
          נוצר: {formatDate(metadata.generatedAt)}
          {metadata.model && ` | מודל: ${metadata.model}`}
          {metadata.tokensUsed && ` | טוקנים: ${metadata.tokensUsed}`}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {!isSaved && (
          <Button variant="primary" onClick={handleSave}>
            שמירה
          </Button>
        )}
        <Button variant="secondary" onClick={handleRegenerate}>
          יצירה מחדש
        </Button>
      </div>
    </Card>
  );
}
