'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, Button, Badge, Avatar, Modal } from '@/components/ui';
import { SessionForm } from '@/components/sessions/SessionForm';
import { therapistRoleLabels, sessionTypeLabels } from '@/lib/mock-data';
import { generateSessionSummary } from '@/lib/ai-features';
import { useSession, useCurrentUser, usePatient, useUsers } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { patient, loading: patientLoading } = usePatient(session?.patientId || '');
  const { users, loading: usersLoading } = useUsers();

  const therapist = session ? users.find(u => u.id === session.therapistId) : null;

  // Show loading while fetching session or user
  if (userLoading || sessionLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  // Show loading while fetching patient (only if we have a session)
  if (session && patientLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  // Show loading while fetching users
  if (usersLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!session || !patient || !currentUser) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <h2 className="text-xl font-semibold text-clinical-900 mb-2">המפגש לא נמצא</h2>
          <Button variant="primary" onClick={() => router.push('/sessions')}>חזרה למפגשים</Button>
        </Card>
      </div>
    );
  }

  const aiSummary = session.status === 'completed' ? generateSessionSummary(session, session.therapistRole) : null;

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(new Date(date));
  };

  const getLocationLabel = (location: string) => {
    const labels: Record<string, string> = {
      in_person: 'פנים אל פנים',
      telehealth: 'טלה-בריאות',
      home_visit: 'ביקור בית',
    };
    return labels[location] || location;
  };

  const getRiskLabel = (type: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      suicidalIdeation: {
        none: 'אין',
        passive: 'מחשבות פסיביות',
        active_no_plan: 'פעיל - ללא תוכנית',
        active_with_plan: 'פעיל - עם תוכנית',
      },
      homicidalIdeation: {
        none: 'אין',
        present: 'קיים',
      },
      selfHarm: {
        none: 'אין',
        history: 'היסטוריה בלבד',
        current: 'נוכחי',
      },
      substanceUse: {
        none: 'אין',
        active: 'שימוש פעיל',
        in_recovery: 'בהחלמה',
      },
    };
    return labels[type]?.[value] || value;
  };

  const statusConfig = {
    scheduled: { variant: 'info' as const, label: 'מתוכנן' },
    in_progress: { variant: 'warning' as const, label: 'בתהליך' },
    completed: { variant: 'success' as const, label: 'הושלם' },
    cancelled: { variant: 'sage' as const, label: 'בוטל' },
    no_show: { variant: 'danger' as const, label: 'לא הגיע' },
  }[session.status];

  if (isEditing) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Sidebar user={{ name: currentUser.name, role: therapistRoleLabels[currentUser.therapistRole!], organization: currentUser.organization }} />
        <main className="mr-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-clinical-900">עריכת רשומות מפגש</h1>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>ביטול</Button>
            </div>
            <SessionForm
              session={session}
              sessionId={session.id}
              patientId={session.patientId}
              therapistRole={session.therapistRole}
              onSubmit={(notes, status) => { console.log('Saved:', notes); setIsEditing(false); }}
              onSaveDraft={(notes) => console.log('Draft:', notes)}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{ name: currentUser.name, role: therapistRoleLabels[currentUser.therapistRole!], organization: currentUser.organization }} />

      <main className="mr-64">
        <div className="sticky top-0 z-40 bg-white border-b border-sage-100 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-clinical-500 mb-2">
            <Link href="/sessions" className="hover:text-sage-600">מפגשים</Link>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-clinical-700">{sessionTypeLabels[session.sessionType]}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                  {sessionTypeLabels[session.sessionType]}
                </h1>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                {session.signedAt && <Badge variant="success">✓ חתום</Badge>}
              </div>
              <p className="text-clinical-500">{formatDateTime(session.scheduledAt)}</p>
            </div>

            <div className="flex items-center gap-3">
              {session.status === 'completed' && !session.signedAt && (
                <>
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>עריכת רשומות</Button>
                  <Button variant="primary" onClick={() => setShowSignModal(true)}>חתימה והשלמה</Button>
                </>
              )}
              {session.status === 'scheduled' && (
                <Button variant="primary" onClick={() => setIsEditing(true)}>התחל מפגש</Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary */}
              {aiSummary && (
                <Card className="bg-gradient-to-br from-sage-50 to-warm-50 border-sage-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="font-semibold text-sage-800">סיכום שנוצר ע"י AI</h3>
                  </div>
                  <p className="text-sage-700">{aiSummary}</p>
                </Card>
              )}

              {/* Session Notes */}
              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                  רשומות מפגש (SOAP)
                </h3>

                {session.notes.chiefComplaint && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-clinical-500 uppercase tracking-wide mb-1">תלונה עיקרית</h4>
                    <p className="text-clinical-800">{session.notes.chiefComplaint}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-r-4 border-blue-400">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">סובייקטיבי (S)</h4>
                    <p className="text-blue-900">{session.notes.subjective || 'לא תועד'}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border-r-4 border-green-400">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">אובייקטיבי (O)</h4>
                    <p className="text-green-900">{session.notes.objective || 'לא תועד'}</p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border-r-4 border-amber-400">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">הערכה (A)</h4>
                    <p className="text-amber-900">{session.notes.assessment || 'לא תועד'}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border-r-4 border-purple-400">
                    <h4 className="text-sm font-semibold text-purple-800 mb-1">תוכנית (P)</h4>
                    <p className="text-purple-900">{session.notes.plan || 'לא תועד'}</p>
                  </div>
                </div>
              </Card>

              {/* Interventions */}
              {session.notes.interventionsUsed && session.notes.interventionsUsed.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-clinical-900 mb-4">התערבויות בשימוש</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.notes.interventionsUsed.map(intervention => (
                      <span key={intervention} className="px-3 py-1.5 bg-sage-100 text-sage-700 rounded-full text-sm">
                        {intervention}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Risk Assessment */}
              {session.notes.riskAssessment && (
                <Card className="border-red-200">
                  <h3 className="text-lg font-semibold text-clinical-900 mb-4">הערכת סיכון</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-clinical-500">מחשבות אובדניות</p>
                      <Badge variant={session.notes.riskAssessment.suicidalIdeation === 'none' ? 'success' : 'danger'}>
                        {getRiskLabel('suicidalIdeation', session.notes.riskAssessment.suicidalIdeation)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-clinical-500">מחשבות אובדניות</p>
                      <Badge variant={session.notes.riskAssessment.homicidalIdeation === 'none' ? 'success' : 'danger'}>
                        {getRiskLabel('homicidalIdeation', session.notes.riskAssessment.homicidalIdeation)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-clinical-500">פגיעה עצמית</p>
                      <Badge variant={session.notes.riskAssessment.selfHarm === 'none' ? 'success' : 'warning'}>
                        {getRiskLabel('selfHarm', session.notes.riskAssessment.selfHarm)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-clinical-500">שימוש בחומרים</p>
                      <Badge variant={session.notes.riskAssessment.substanceUse === 'none' ? 'success' : 'warning'}>
                        {getRiskLabel('substanceUse', session.notes.riskAssessment.substanceUse)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">פרטי מפגש</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-clinical-500">משך</dt>
                    <dd className="text-clinical-900 font-medium">{session.duration} דקות</dd>
                  </div>
                  <div>
                    <dt className="text-clinical-500">מיקום</dt>
                    <dd className="text-clinical-900 font-medium">{getLocationLabel(session.location)}</dd>
                  </div>
                  <div>
                    <dt className="text-clinical-500">סוג מפגש</dt>
                    <dd className="text-clinical-900 font-medium">{sessionTypeLabels[session.sessionType]}</dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">מטופל</h3>
                <Link href={`/patients/${patient.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sage-50 -mx-3">
                  <Avatar name={`${patient.firstName} ${patient.lastName}`} />
                  <div>
                    <p className="font-medium text-clinical-900">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-clinical-500">{patient.primaryDiagnosis}</p>
                  </div>
                </Link>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">מטפל</h3>
                {therapist && (
                  <div className="flex items-center gap-3">
                    <Avatar name={therapist.name} />
                    <div>
                      <p className="font-medium text-clinical-900">{therapist.name}</p>
                      <p className="text-sm text-clinical-500">{therapistRoleLabels[therapist.therapistRole!]}</p>
                    </div>
                  </div>
                )}
              </Card>

              {session.signedAt && (
                <Card className="bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">חתום ונעול</span>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.signedAt))}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sign Modal */}
      <Modal isOpen={showSignModal} onClose={() => setShowSignModal(false)} title="חתימה על רשומות מפגש" size="md">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>חשוב:</strong> לאחר החתימה, לא ניתן לערוך את רשומות המפגש. אנא סקור את כל התיעוד לפני החתימה.
            </p>
          </div>
          <p className="text-clinical-700">
            אני מאשר/ת שהמידע המתועד ברשומת מפגש זו הוא מדויק ומלא למיטב ידיעתי.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowSignModal(false)}>ביטול</Button>
            <Button variant="primary" onClick={() => { setShowSignModal(false); router.push('/sessions'); }}>
              חתום על התיעוד
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
