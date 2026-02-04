'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, MobileMenuProvider, useMobileMenu } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, Badge } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useAuthRedirect, useMyPatients } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PatientInsightCard } from '@/components/insights/PatientInsightCard';
import { PatientInsights } from '@/types';

// Icons for each category
const PatternIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
);

const ProgressIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  </div>
);

const RiskIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </div>
);

const GapIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
);

function InsightsPageContent() {
  const { toggle: toggleMobileMenu } = useMobileMenu();

  // Auth and patients
  const { user: currentUser, loading: userLoading } = useAuthRedirect();
  const { patients: myPatients, loading: patientsLoading } = useMyPatients(currentUser?.id);

  // Insights state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [insights, setInsights] = useState<PatientInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Fetch insights when patient selected
  // First checks for saved insights (GET), then falls back to generating new ones (POST)
  const fetchInsights = async (patientId: string) => {
    setInsightsLoading(true);
    setInsightsError(null);

    try {
      // First, try to get saved insights
      const getResponse = await fetch(`/api/patients/${patientId}/insights`);
      const getResult = await getResponse.json();

      if (getResponse.ok && getResult.data) {
        // Found saved insights - display them
        setInsights(getResult.data);
        setInsightsLoading(false);
        return;
      }

      // No saved insights - generate new ones via POST
      const postResponse = await fetch(`/api/patients/${patientId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const postResult = await postResponse.json();

      // Handle error response from API
      if (!postResponse.ok || postResult.error) {
        setInsightsError(postResult.error || `Server error (${postResponse.status})`);
        setInsights(null);
        return;
      }

      // Handle success - response format: { data: PatientInsights }
      if (postResult.data) {
        setInsights(postResult.data);
      } else {
        setInsightsError('Invalid response format');
        setInsights(null);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setInsightsError('Network error - could not connect to server');
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Trigger fetch on patient selection
  useEffect(() => {
    if (!selectedPatientId) {
      setInsights(null);
      setInsightsError(null);
      return;
    }

    fetchInsights(selectedPatientId);
  }, [selectedPatientId]);

  // Regenerate handler (for "Regenerate" button)
  // Forces new generation via POST, skipping the GET check for saved insights
  const handleRegenerate = async () => {
    if (!selectedPatientId) return;

    setInsightsLoading(true);
    setInsightsError(null);

    try {
      // Force regeneration via POST (skip GET check)
      const response = await fetch(`/api/patients/${selectedPatientId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setInsightsError(result.error || 'Failed to regenerate');
        return;
      }

      if (result.data) {
        setInsights(result.data);
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
      setInsightsError('Network error');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Format relative time for display
  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short' }).format(d);
  };

  // Loading states
  if (userLoading || patientsLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!currentUser) {
    return <LoadingSpinner className="h-screen" />;
  }

  // Stats from insights (or zeros if none)
  const riskCount = insights?.riskIndicators.length || 0;
  const progressCount = insights?.progressTrends.length || 0;
  const patternsCount = insights?.patterns.length || 0;
  const gapsCount = insights?.treatmentGaps.length || 0;

  return (
    <div className="min-h-screen bg-warm-50 overflow-x-hidden">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="md:mr-64 pb-20 md:pb-0">
        <Header
          title="תובנות AI"
          subtitle="ניתוח אוטומטי של דפוסים ומגמות"
          onMobileMenuToggle={toggleMobileMenu}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Patient Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-clinical-700 mb-2">
              בחר מטופל לצפייה בתובנות
            </label>
            <select
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(e.target.value || null)}
              className="w-full max-w-md px-4 py-2.5 rounded-lg border border-sage-200 bg-white text-clinical-900 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors"
            >
              <option value="">בחר מטופל...</option>
              {myPatients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className={`text-center ${riskCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${riskCount > 0 ? 'bg-red-100' : 'bg-sage-100'}`}>
                  <svg className={`w-5 h-5 ${riskCount > 0 ? 'text-red-600' : 'text-sage-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">התראות סיכון</p>
                <p className="text-2xl font-semibold text-clinical-900">{riskCount}</p>
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
                <p className="text-2xl font-semibold text-clinical-900">{progressCount}</p>
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
                <p className="text-2xl font-semibold text-clinical-900">{patternsCount}</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">פערים בטיפול</p>
                <p className="text-2xl font-semibold text-clinical-900">{gapsCount}</p>
              </div>
            </Card>
          </div>

          {/* Insights Content */}
          {/* No patient selected */}
          {!selectedPatientId && (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-medium text-clinical-900 mb-1">בחר מטופל</h3>
              <p className="text-clinical-500">בחר מטופל מהרשימה לצפייה בתובנות AI</p>
            </Card>
          )}

          {/* Loading state */}
          {selectedPatientId && insightsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-sage-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-clinical-600">מייצר תובנות...</p>
            </div>
          )}

          {/* Error state with retry */}
          {selectedPatientId && insightsError && !insightsLoading && (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-red-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 mb-4">{insightsError}</p>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
              >
                נסה שוב
              </button>
            </Card>
          )}

          {/* Insights display */}
          {selectedPatientId && insights && !insightsLoading && (
            <>
              <div className="flex items-center justify-between mb-4">
                {/* Saved indicator */}
                <div className="flex items-center gap-2">
                  {insights.savedAt && (
                    <Badge variant="success">
                      נשמר {formatRelativeTime(insights.savedAt)}
                    </Badge>
                  )}
                  {!insights.savedAt && (
                    <Badge variant="outline">לא נשמר</Badge>
                  )}
                </div>
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 text-sage-700 border border-sage-300 rounded-lg hover:bg-sage-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  יצירה מחדש
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <PatientInsightCard
                  title="דפוסים"
                  icon={<PatternIcon />}
                  items={insights.patterns}
                  variant="pattern"
                  emptyMessage="לא זוהו דפוסים חוזרים"
                />
                <PatientInsightCard
                  title="מגמות התקדמות"
                  icon={<ProgressIcon />}
                  items={insights.progressTrends}
                  variant="progress"
                  emptyMessage="אין מגמות התקדמות לדיווח"
                />
                <PatientInsightCard
                  title="מדדי סיכון"
                  icon={<RiskIcon />}
                  items={insights.riskIndicators}
                  variant="risk"
                  emptyMessage="לא זוהו גורמי סיכון"
                />
                <PatientInsightCard
                  title="פערים בטיפול"
                  icon={<GapIcon />}
                  items={insights.treatmentGaps}
                  variant="gap"
                  emptyMessage="לא זוהו פערים בטיפול"
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Main export wraps content with MobileMenuProvider
export default function InsightsPage() {
  return (
    <MobileMenuProvider>
      <InsightsPageContent />
    </MobileMenuProvider>
  );
}
