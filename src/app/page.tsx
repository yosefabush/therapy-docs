'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header, QuickActionButton } from '@/components/layout/Header';
import { Card, Badge, Button, ProgressBar, Modal } from '@/components/ui';
import { PatientCardCompact } from '@/components/patients/PatientList';
import { TodaySchedule } from '@/components/sessions/SessionList';
import { mockUsers, mockPatients, mockSessions, mockTreatmentGoals, therapistRoleLabels } from '@/lib/mock-data';
import { analyzePatternsTrends } from '@/lib/ai-features';

export default function Dashboard() {
  const currentUser = mockUsers[0]; // Dr. Sarah Chen
  const [showNewSession, setShowNewSession] = useState(false);

  // Get today's sessions for current user
  const today = new Date();
  const todaysSessions = mockSessions.filter(session => {
    const sessionDate = new Date(session.scheduledAt);
    return sessionDate.toDateString() === today.toDateString() && 
           session.therapistId === currentUser.id;
  });

  // Get patients assigned to current user
  const myPatients = mockPatients.filter(p => 
    p.assignedTherapists.includes(currentUser.id)
  );

  // Calculate stats
  const completedToday = todaysSessions.filter(s => s.status === 'completed').length;
  const pendingDocumentation = mockSessions.filter(
    s => s.status === 'completed' && !s.signedAt && s.therapistId === currentUser.id
  ).length;

  // Get AI insights for all patients
  const allInsights = myPatients.flatMap(patient => {
    const patientSessions = mockSessions.filter(s => s.patientId === patient.id);
    return analyzePatternsTrends(patientSessions);
  });

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
          actions={
            <QuickActionButton
              label="מפגש חדש"
              onClick={() => setShowNewSession(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          }
        />

        <div className="p-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="animate-in opacity-0 stagger-1" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clinical-500">מפגשים להיום</p>
                  <p className="text-3xl font-semibold text-clinical-900 mt-1">
                    {completedToday}/{todaysSessions.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar value={completedToday} max={todaysSessions.length || 1} />
              </div>
            </Card>

            <Card className="animate-in opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clinical-500">מטופלים פעילים</p>
                  <p className="text-3xl font-semibold text-clinical-900 mt-1">
                    {myPatients.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="animate-in opacity-0 stagger-3" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clinical-500">תיעוד ממתין</p>
                  <p className="text-3xl font-semibold text-clinical-900 mt-1">
                    {pendingDocumentation}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  pendingDocumentation > 0 ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <svg className={`w-6 h-6 ${pendingDocumentation > 0 ? 'text-amber-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              {pendingDocumentation > 0 && (
                <Button variant="ghost" size="sm" className="mt-3 w-full">
                  השלם עכשיו
                </Button>
              )}
            </Card>

            <Card className={`animate-in opacity-0 stagger-4 ${criticalInsights.length > 0 ? 'border-red-200 bg-red-50' : ''}`} style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clinical-500">התראות AI</p>
                  <p className="text-3xl font-semibold text-clinical-900 mt-1">
                    {criticalInsights.length}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  criticalInsights.length > 0 ? 'bg-red-100' : 'bg-sage-100'
                }`}>
                  <svg className={`w-6 h-6 ${criticalInsights.length > 0 ? 'text-red-600' : 'text-sage-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
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
                <TodaySchedule sessions={todaysSessions} therapists={mockUsers} />
              </Card>

              {/* Recent Activity */}
              <Card className="mt-6">
                <h2 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                  פעילות אחרונה
                </h2>
                <div className="space-y-3">
                  {mockSessions
                    .filter(s => s.status === 'completed')
                    .slice(0, 5)
                    .map(session => {
                      const patient = mockPatients.find(p => p.id === session.patientId);
                      return (
                        <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sage-50 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-clinical-900">
                              מפגש הושלם עם {patient?.patientCode}
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
                    })}
                </div>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* My Patients */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                    המטופלים שלי
                  </h2>
                  <Button variant="ghost" size="sm">הצג הכל</Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {myPatients.slice(0, 4).map(patient => {
                    const patientGoals = mockTreatmentGoals.filter(g => g.patientId === patient.id);
                    const avgProgress = patientGoals.length > 0
                      ? Math.round(patientGoals.reduce((sum, g) => sum + g.progress, 0) / patientGoals.length)
                      : 0;
                    const patientSessions = mockSessions.filter(s => s.patientId === patient.id);
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
              </Card>

              {/* AI Insights */}
              {allInsights.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                      תובנות AI
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {allInsights.slice(0, 3).map(insight => (
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

              {/* Quick Links */}
              <Card>
                <h2 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                  פעולות מהירות
                </h2>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sage-50 transition-colors text-right">
                    <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-clinical-900">הוסף מטופל חדש</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sage-50 transition-colors text-right">
                    <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-clinical-900">צור דוח</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sage-50 transition-colors text-right">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-clinical-900">משאבי טיפול</span>
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* New Session Modal */}
      <Modal isOpen={showNewSession} onClose={() => setShowNewSession(false)} title="תזמן מפגש חדש" size="lg">
        <div className="text-center py-8 text-clinical-500">
          טופס תזמון מפגש יופיע כאן...
        </div>
      </Modal>
    </div>
  );
}
