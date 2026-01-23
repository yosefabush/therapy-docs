'use client';

import React from 'react';
import { Card, Badge } from '@/components/ui';
import { InsightItem } from '@/types';

export interface PatientInsightCardProps {
  title: string;
  icon: React.ReactNode;
  items: InsightItem[];
  emptyMessage?: string;
  variant: 'pattern' | 'progress' | 'risk' | 'gap';
}

const variantStyles = {
  pattern: {
    header: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    confidenceHigh: 'bg-blue-500',
  },
  progress: {
    header: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
    confidenceHigh: 'bg-green-500',
  },
  risk: {
    header: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    confidenceHigh: 'bg-red-500',
  },
  gap: {
    header: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    confidenceHigh: 'bg-amber-500',
  },
};

/**
 * Get confidence bar color based on confidence level
 * - 0.9+: High confidence (green)
 * - 0.7-0.9: Moderate confidence (yellow)
 * - <0.7: Low confidence (gray)
 */
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'bg-green-500';
  if (confidence >= 0.7) return 'bg-yellow-500';
  return 'bg-gray-400';
};

/**
 * Format date for display in Hebrew locale
 */
const formatDate = (date: Date | undefined): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short' }).format(new Date(date));
};

/**
 * PatientInsightCard - Reusable component for displaying insight categories
 *
 * Displays a category of AI-generated insights with:
 * - Colored header based on variant (pattern/progress/risk/gap)
 * - List of insight items with confidence indicators
 * - Session references as subtle badges
 * - Date range for progress trends
 * - Empty state when no insights available
 */
export function PatientInsightCard({
  title,
  icon,
  items,
  emptyMessage = 'אין תובנות בקטגוריה זו',
  variant,
}: PatientInsightCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={`overflow-hidden border ${styles.header}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${styles.header} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-medium text-clinical-900">{title}</h3>
        </div>
        <Badge className={styles.badge}>
          {items.length}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-6 text-clinical-500">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li key={index} className="border-b border-clinical-100 pb-4 last:border-0 last:pb-0">
                {/* Content text */}
                <p className="text-sm text-clinical-800 mb-2">{item.content}</p>

                {/* Confidence indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-clinical-100 rounded-full overflow-hidden max-w-24">
                    <div
                      className={`h-full rounded-full transition-all ${getConfidenceColor(item.confidence)}`}
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-clinical-500">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>

                {/* Session references */}
                {item.sessionRefs && item.sessionRefs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.sessionRefs.slice(0, 3).map((ref, refIndex) => (
                      <span
                        key={refIndex}
                        className="text-xs px-1.5 py-0.5 bg-clinical-100 text-clinical-600 rounded"
                      >
                        {ref.substring(0, 8)}
                      </span>
                    ))}
                    {item.sessionRefs.length > 3 && (
                      <span className="text-xs text-clinical-500">
                        +{item.sessionRefs.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Date range for progress trends */}
                {(item.firstSeen || item.lastSeen) && (
                  <div className="text-xs text-clinical-400">
                    {item.firstSeen && item.lastSeen ? (
                      <span>
                        {formatDate(item.firstSeen)} - {formatDate(item.lastSeen)}
                      </span>
                    ) : item.lastSeen ? (
                      <span>נצפה לאחרונה: {formatDate(item.lastSeen)}</span>
                    ) : (
                      <span>נצפה לראשונה: {formatDate(item.firstSeen)}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default PatientInsightCard;
