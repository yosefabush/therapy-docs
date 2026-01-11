'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Button, ProgressBar, Modal } from '@/components/ui';
import { PatientCardCompact } from '@/components/patients/PatientList';
import { TodaySchedule } from '@/components/sessions/SessionList';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useAuthRedirect, useMyPatients, useMySessions, useMyTreatmentGoals } from '@/lib/hooks';
import { apiClient } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Dashboard() {
  const [showNewSession, setShowNewSession] = useState(false);

  const { user: currentUser, loading: userLoading } = useAuthRedirect();

  // Use user-specific hooks - only fetch data for current user
  const { patients: myPatients, loading: patientsLoading } = useMyPatients(currentUser?.id);
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useMySessions(currentUser?.id);

  // Get patient IDs for treatment goals filtering
  const patientIds = useMemo(() => myPatients.map(p => p.id), [myPatients]);
  const { goals, loading: goalsLoading } = useMyTreatmentGoals(currentUser?.id, patientIds);

  if (userLoading || patientsLoading || sessionsLoading || goalsLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!currentUser) {
    // Will redirect to login
    return <LoadingSpinner className="h-screen" />;
  }

  // Get today's sessions for current user
  const today = new Date();
  const todaysSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduledAt);
    return sessionDate.toDateString() === today.toDateString();
  });

  // Calculate stats
  const completedToday = todaysSessions.filter(s => s.status === 'completed').length;
  const pendingDocumentation = sessions.filter(
    s => s.status === 'completed' && !s.signedAt
  ).length;

  // Only show AI insights if user has patients
  const allInsights: Array<{
    id: string;
    patientId: string;
    type: 'progress_trend' | 'pattern' | 'risk_indicator';
    content: string;
    confidence: number;
    generatedAt: Date;
  }> = myPatients.length > 0 ? [
    {
      id: 'mock-insight-1',
      patientId: '',
      type: 'progress_trend',
      content: 'התקדמות חיובית: מטופלים הראו שיפור במדדי חרדה.',
      confidence: 0.85,
      generatedAt: new Date(),
    },
    {
      id: 'mock-insight-2',
      patientId: '',
      type: 'pattern',
      content: 'תבנית מזוהה: מטופלים מגיבים טוב יותר למפגשים בשעות הבוקר.',
      confidence: 0.72,
      generatedAt: new Date(),
    },
  ] : [];

  const criticalInsights = allInsights.filter(i => i.type === 'risk_indicator');

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        <Header
          title="לוח בקרה"
          subtitle={`ברוך שובך, ${currentUser.name.split(' ')[0]}`}
        />

        <div className="p-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="animate-in opacity-0 stagger-1 text-center" style={{ animationFillMode: 'forwards' }}>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">מפגשים להיום</p>
                <p className="text-3xl font-semibold text-clinical-900 mt-1">
                  {completedToday}/{todaysSessions.length}
                </p>
              </div>
              <div className="mt-3">
                <ProgressBar value={completedToday} max={todaysSessions.length || 1} />
              </div>
            </Card>

            <Card className="animate-in opacity-0 stagger-2 text-center" style={{ animationFillMode: 'forwards' }}>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">מטופלים פעילים</p>
                <p className="text-3xl font-semibold text-clinical-900 mt-1">
                  {myPatients.filter(p => p.status === 'active').length}
                </p>
              </div>
            </Card>

            <Card className="animate-in opacity-0 stagger-3 text-center" style={{ animationFillMode: 'forwards' }}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  pendingDocumentation > 0 ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <svg className={`w-6 h-6 ${pendingDocumentation > 0 ? 'text-amber-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">תיעוד ממתין</p>
                <p className="text-3xl font-semibold text-clinical-900 mt-1">
                  {pendingDocumentation}
                </p>
              </div>
              {pendingDocumentation > 0 && (
                <Button variant="ghost" size="sm" className="mt-3 w-full">
                  השלם עכשיו
                </Button>
              )}
            </Card>

            <Card className={`animate-in opacity-0 stagger-4 text-center ${criticalInsights.length > 0 ? 'border-red-200 bg-red-50' : ''}`} style={{ animationFillMode: 'forwards' }}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  criticalInsights.length > 0 ? 'bg-red-100' : 'bg-sage-100'
                }`}>
                  <svg className={`w-6 h-6 ${criticalInsights.length > 0 ? 'text-red-600' : 'text-sage-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">התראות AI</p>
                <p className="text-3xl font-semibold text-clinical-900 mt-1">
                  {criticalInsights.length}
                </p>
              </div>
              {criticalInsights.length > 0 && (
                <p className="text-xs text-red-600 mt-2">נדרשת תשומת לב</p>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                    לוח הזמנים להיום
                  </h2>
                  <span className="text-sm text-clinical-500">
                    {new Intl.DateTimeFormat('he-IL', { weekday: 'long', month: 'long', day: 'numeric' }).format(today)}
                  </span>
                </div>
                <TodaySchedule sessions={todaysSessions} therapists={[]} />
              </Card>

              {/* Recent Activity */}
              <Card className="mt-6">
                <h2 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                  פעילות אחרונה
                </h2>
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-clinical-500 text-center py-4">אין פעילות אחרונה</p>
                  ) : (
                    sessions
                      .filter(s => s.status === 'completed')
                      .slice(0, 5)
                      .map(session => {
                        const patient = myPatients.find(p => p.id === session.patientId);
                        return (
                          <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sage-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-clinical-900">
                                מפגש הושלם עם {patient ? `${patient.firstName} ${patient.lastName}` : 'מטופל'}
                              </p>
                              <p className="text-xs text-clinical-500">
                                {new Intl.DateTimeFormat('he-IL', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(session.scheduledAt))}
                              </p>
                            </div>
                            {session.signedAt ? (
                              <Badge variant="success">חתום</Badge>
                            ) : (
                              <Badge variant="warning">ממתין</Badge>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </Card>

              {/* Quick Links */}
              <Card className="mt-6">
                <h2 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                  פעולות מהירות
                </h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowNewSession(true)}
                    className="flex-1 flex items-center gap-3 p-4 rounded-lg hover:bg-sage-50 transition-colors border border-sage-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-clinical-900">תזמן מפגש חדש</span>
                  </button>
                  <a href="/reports" className="flex-1 flex items-center gap-3 p-4 rounded-lg hover:bg-sage-50 transition-colors border border-sage-100">
                    <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-clinical-900">צור דוח</span>
                  </a>
                  <a href="/help" className="flex-1 flex items-center gap-3 p-4 rounded-lg hover:bg-sage-50 transition-colors border border-sage-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-clinical-900">משאבי טיפול</span>
                  </a>
                </div>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6 flex flex-col">
              {/* My Patients */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                    המטופלים שלי
                  </h2>
                  <a href="/patients"><Button variant="ghost" size="sm">הצג הכל</Button></a>
                </div>
                {myPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-clinical-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-clinical-500">אין מטופלים משויכים</p>
                    <a href="/patients">
                      <Button variant="primary" size="sm" className="mt-3">הוסף מטופל</Button>
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {myPatients.slice(0, 4).map(patient => {
                      const patientGoals = goals.filter(g => g.patientId === patient.id);
                      const avgProgress = patientGoals.length > 0
                        ? Math.round(patientGoals.reduce((sum, g) => sum + g.progress, 0) / patientGoals.length)
                        : 0;
                      const patientSessions = sessions.filter(s => s.patientId === patient.id);
                      const lastSession = patientSessions.filter(s => s.status === 'completed').sort(
                        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
                      )[0];
                      const nextSession = patientSessions.filter(s => s.status === 'scheduled').sort(
                        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                      )[0];

                      return (
                        <PatientCardCompact
                          key={patient.id}
                          patient={patient}
                          progress={avgProgress}
                          lastSession={lastSession?.scheduledAt}
                          nextSession={nextSession?.scheduledAt}
                        />
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* AI Insights - Sidebar */}
              {allInsights.length > 0 && (
                <Card className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                      תובנות AI
                    </h2>
                  </div>
                  <div className="space-y-3 flex-1">
                    {allInsights.slice(0, 5).map(insight => (
                      <div
                        key={insight.id}
                        className={`p-3 rounded-lg text-sm ${
                          insight.type === 'risk_indicator' ? 'bg-red-50 text-red-800' :
                          insight.type === 'progress_trend' ? 'bg-green-50 text-green-800' :
                          'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {insight.content}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* New Session Modal */}
      <Modal isOpen={showNewSession} onClose={() => setShowNewSession(false)} title="תזמן מפגש חדש" size="lg">
        <NewSessionForm
          patients={myPatients}
          currentUserId={currentUser.id}
          therapistRole={currentUser.therapistRole!}
          onClose={() => setShowNewSession(false)}
          onSessionAdded={() => {
            refetchSessions();
            setShowNewSession(false);
          }}
        />
      </Modal>

    </div>
  );
}

interface NewSessionFormProps {
  patients: { id: string; firstName: string; lastName: string }[];
  currentUserId: string;
  therapistRole: string;
  onClose: () => void;
  onSessionAdded: () => void;
}

function NewSessionForm({ patients, currentUserId, therapistRole, onClose, onSessionAdded }: NewSessionFormProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'individual_therapy',
    date: '',
    time: '',
    duration: '50',
    location: 'in_person',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.date || !formData.time) {
      setError('נא למלא את כל השדות הנדרשים');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);

      const sessionData = {
        patientId: formData.patientId,
        therapistId: currentUserId,
        therapistRole: therapistRole,
        sessionType: formData.type,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(formData.duration),
        location: formData.location,
        status: 'scheduled',
      };

      const response = await apiClient.post('/sessions', sessionData);
      if (response.error) {
        throw new Error(response.error);
      }
      onSessionAdded();
    } catch (err) {
      setError('שגיאה ביצירת המפגש');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">מטופל</label>
        <select
          value={formData.patientId}
          onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          required
        >
          <option value="">בחר מטופל...</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">סוג מפגש</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
        >
          <option value="individual_therapy">טיפול פרטני</option>
          <option value="group_therapy">טיפול קבוצתי</option>
          <option value="family_therapy">טיפול משפחתי</option>
          <option value="assessment">הערכה</option>
          <option value="follow_up">מעקב</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">תאריך</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">שעה</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">משך (דקות)</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="30">30 דקות</option>
            <option value="45">45 דקות</option>
            <option value="50">50 דקות</option>
            <option value="60">60 דקות</option>
            <option value="90">90 דקות</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">מיקום</label>
          <select
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="in_person">פנים אל פנים</option>
            <option value="telehealth">טלה-בריאות</option>
            <option value="home_visit">ביקור בית</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>ביטול</Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isSubmitting ? 'יוצר מפגש...' : 'תזמן מפגש'}
        </Button>
      </div>
    </form>
  );
}

