'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Tabs } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';
import { analyzePatternsTrends } from '@/lib/ai-features';
import { useAuthRedirect, useMyPatients, useMySessions } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Hoist date formatter outside component
const insightDateFormatter = new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' });

// Hoist static insight icons outside component
const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  risk_indicator: (
    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  ),
  progress_trend: (
    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
  ),
  pattern: (
    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  ),
};

// Hoist badge config outside component
const INSIGHT_BADGE_CONFIG: Record<string, { variant: 'warning' | 'success' | 'sage'; label: string }> = {
  risk_indicator: { variant: 'warning', label: 'סיכון' },
  progress_trend: { variant: 'success', label: 'התקדמות' },
  pattern: { variant: 'sage', label: 'דפוס' },
};

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const { user: currentUser, loading: userLoading } = useAuthRedirect();
  const { patients: myPatients, loading: patientsLoading } = useMyPatients(currentUser?.id);
  const { sessions, loading: sessionsLoading } = useMySessions(currentUser?.id);

  // Build session lookup Map for O(1) access by patient ID
  const sessionsByPatientId = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const session of sessions) {
      const patientSessions = map.get(session.patientId) || [];
      patientSessions.push(session);
      map.set(session.patientId, patientSessions);
    }
    return map;
  }, [sessions]);

  // Generate and categorize insights in a single pass
  const { allInsights, riskInsights, progressInsights, patternInsights } = useMemo(() => {
    const all: Array<{
      id: string;
      type: string;
      content: string;
      confidence: number;
      generatedAt: Date;
      patientId: string;
      patientName: string;
    }> = [];
    const risk: typeof all = [];
    const progress: typeof all = [];
    const pattern: typeof all = [];

    for (const patient of myPatients) {
      const patientSessions = sessionsByPatientId.get(patient.id) || [];
      const insights = analyzePatternsTrends(patientSessions);

      for (const insight of insights) {
        const enrichedInsight = {
          ...insight,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
        };
        all.push(enrichedInsight);

        // Categorize in single pass
        if (insight.type === 'risk_indicator') {
          risk.push(enrichedInsight);
        } else if (insight.type === 'progress_trend') {
          progress.push(enrichedInsight);
        } else {
          pattern.push(enrichedInsight);
        }
      }
    }

    return {
      allInsights: all,
      riskInsights: risk,
      progressInsights: progress,
      patternInsights: pattern,
    };
  }, [myPatients, sessionsByPatientId]);

  // Memoize tabs to prevent recreation on every render
  const tabs = useMemo(() => [
    { id: 'all', label: 'כל התובנות', count: allInsights.length },
    { id: 'risk', label: 'סיכונים', count: riskInsights.length },
    { id: 'progress', label: 'התקדמות', count: progressInsights.length },
    { id: 'patterns', label: 'דפוסים', count: patternInsights.length },
  ], [allInsights.length, riskInsights.length, progressInsights.length, patternInsights.length]);

  // Memoize filtered insights using object lookup instead of ternary chain
  const INSIGHT_FILTERS = useMemo(() => ({
    all: allInsights,
    risk: riskInsights,
    progress: progressInsights,
    patterns: patternInsights,
  }), [allInsights, riskInsights, progressInsights, patternInsights]);

  const filteredInsights = INSIGHT_FILTERS[activeTab as keyof typeof INSIGHT_FILTERS] || allInsights;

  if (userLoading || patientsLoading || sessionsLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!currentUser) {
    return <LoadingSpinner className="h-screen" />;
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        <Header
          title="תובנות AI"
          subtitle="ניתוח אוטומטי של דפוסים ומגמות"
        />

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className={`text-center ${riskInsights.length > 0 ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${riskInsights.length > 0 ? 'bg-red-100' : 'bg-sage-100'}`}>
                  <svg className={`w-5 h-5 ${riskInsights.length > 0 ? 'text-red-600' : 'text-sage-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">התראות סיכון</p>
                <p className="text-2xl font-semibold text-clinical-900">{riskInsights.length}</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">מגמות התקדמות</p>
                <p className="text-2xl font-semibold text-clinical-900">{progressInsights.length}</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">דפוסים שזוהו</p>
                <p className="text-2xl font-semibold text-clinical-900">{patternInsights.length}</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">מטופלים מנוטרים</p>
                <p className="text-2xl font-semibold text-clinical-900">{myPatients.length}</p>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {/* Insights List */}
          {filteredInsights.length > 0 ? (
            <div className="space-y-3">
              {filteredInsights.map((insight) => {
                const badgeConfig = INSIGHT_BADGE_CONFIG[insight.type] || INSIGHT_BADGE_CONFIG.pattern;
                return (
                  <Card key={insight.id} hover className="cursor-pointer">
                    <div className="flex items-start gap-4">
                      {INSIGHT_ICONS[insight.type] || INSIGHT_ICONS.pattern}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-clinical-900">{insight.patientName}</span>
                          <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-clinical-600">{insight.content}</p>
                        <p className="text-xs text-clinical-400 mt-2">
                          {insightDateFormatter.format(new Date(insight.generatedAt))}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-clinical-900 mb-1">אין תובנות</h3>
              <p className="text-clinical-500">תובנות יופיעו כאן ככל שיצטברו נתונים</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
