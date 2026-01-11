'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, Button, Badge, ProgressBar, Tabs, Avatar, Modal } from '@/components/ui';
import { SessionList } from '@/components/sessions/SessionList';
import { ReportGenerator, ReportCard } from '@/components/reports/ReportGenerator';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useCurrentUser, usePatient, useSessions, useTreatmentGoals, useReports, useUsers, useVoiceRecordings } from '@/lib/hooks';
import { RecordingsList } from '@/components/recordings';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview');
  const [showNewSession, setShowNewSession] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);

  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { patient, loading: patientLoading, error: patientError } = usePatient(patientId);
  const { sessions, loading: sessionsLoading } = useSessions({ patientId });
  const { goals, loading: goalsLoading } = useTreatmentGoals(patientId);
  const { reports, loading: reportsLoading } = useReports(patientId);
  const { users, loading: usersLoading } = useUsers();
  const { recordings, loading: recordingsLoading, deleteRecording } = useVoiceRecordings({ patientId });

  if (userLoading || patientLoading || sessionsLoading || goalsLoading || reportsLoading || usersLoading || recordingsLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!currentUser) {
    return <ErrorMessage message="Failed to load user data" />;
  }

  if (patientError || !patient) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <h2 className="text-xl font-semibold text-clinical-900 mb-2">מטופל לא נמצא</h2>
          <p className="text-clinical-500 mb-4">המטופל שחיפשת אינו קיים.</p>
          <Button variant="primary" onClick={() => router.push('/patients')}>
            חזרה למטופלים
          </Button>
        </Card>
      </div>
    );
  }

  const assignedTherapists = users.filter(u => patient.assignedTherapists.includes(u.id));

  const tabs = [
    { id: 'overview', label: 'סקירה כללית' },
    { id: 'sessions', label: 'מפגשים', count: sessions.length },
    { id: 'recordings', label: 'הקלטות', count: recordings.length },
    { id: 'goals', label: 'מטרות', count: goals.length },
    { id: 'reports', label: 'דוחות', count: reports.length },
    { id: 'documents', label: 'מסמכים' },
  ];

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) > new Date());
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        {/* Custom Header with Patient Info */}
        <div className="sticky top-0 z-40 bg-white border-b border-sage-100">
          <div className="px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-clinical-500 mb-2">
              <Link href="/patients" className="hover:text-sage-600">מטופלים</Link>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-clinical-700">{patient.firstName} {patient.lastName}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={`${patient.firstName} ${patient.lastName}`} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-clinical-900" style={{ fontFamily: '"Crimson Pro", Georgia, serif' }}>
                      {patient.firstName} {patient.lastName}
                    </h1>
                    <Badge variant={patient.status === 'active' ? 'success' : 'sage'}>
                      {patient.status}
                    </Badge>
                  </div>
                  <p className="text-clinical-500">{patient.primaryDiagnosis || 'אין אבחנה'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setShowEditPatient(true)}>
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  עריכה
                </Button>
                <Button variant="primary" onClick={() => setShowNewSession(true)}>
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  מפגש חדש
                </Button>
              </div>
            </div>
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-8" />
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <p className="text-sm text-clinical-500">סה&quot;כ מפגשים</p>
                    <p className="text-3xl font-semibold text-clinical-900 mt-1">{sessions.length}</p>
                    <p className="text-xs text-clinical-400 mt-1">{completedSessions.length} הושלמו</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-clinical-500">התקדמות בטיפול</p>
                    <p className="text-3xl font-semibold text-clinical-900 mt-1">{avgProgress}%</p>
                    <ProgressBar value={avgProgress} className="mt-2" />
                  </Card>
                  <Card>
                    <p className="text-sm text-clinical-500">קרובים</p>
                    <p className="text-3xl font-semibold text-clinical-900 mt-1">{upcomingSessions.length}</p>
                    <p className="text-xs text-clinical-400 mt-1">מפגשים מתוזמנים</p>
                  </Card>
                </div>

                {/* Recent Sessions */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                      מפגשים אחרונים
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('sessions')}>
                      הצג הכל
                    </Button>
                  </div>
                  <SessionList
                    sessions={sessions.slice(0, 3)}
                    therapists={users}
                    showPatient={false}
                  />
                </Card>

                {/* Goals Progress */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                      מטרות טיפול
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('goals')}>
                      נהל
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {goals.map(goal => (
                      <div key={goal.id} className="p-4 bg-sage-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-clinical-900">{goal.description}</p>
                          <Badge variant={goal.status === 'achieved' ? 'success' : goal.status === 'active' ? 'info' : 'sage'}>
                            {goal.status}
                          </Badge>
                        </div>
                        <ProgressBar value={goal.progress} showLabel className="mt-2" />
                        {goal.targetDate && (
                          <p className="text-xs text-clinical-500 mt-2">
                            Target: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(goal.targetDate))}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Patient Info */}
                <Card>
                  <h3 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                    פרטי מטופל
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-clinical-500">תעודת זהות</dt>
                      <dd className="text-clinical-900 font-medium">{patient.idNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-clinical-500">שם מלא</dt>
                      <dd className="text-clinical-900 font-medium">{patient.firstName} {patient.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-clinical-500">תאריך לידה</dt>
                      <dd className="text-clinical-900 font-medium">{patient.dateOfBirth}</dd>
                    </div>
                    <div>
                      <dt className="text-clinical-500">מגדר</dt>
                      <dd className="text-clinical-900 font-medium capitalize">{patient.gender === 'male' ? 'זכר' : patient.gender === 'female' ? 'נקבה' : 'אחר'}</dd>
                    </div>
                    <div>
                      <dt className="text-clinical-500">קופת חולים</dt>
                      <dd className="text-clinical-900 font-medium">{patient.insuranceProvider || 'לא צוין'}</dd>
                    </div>
                    <div>
                      <dt className="text-clinical-500">מקור הפניה</dt>
                      <dd className="text-clinical-900 font-medium">{patient.referralSource || 'לא צוין'}</dd>
                    </div>
                    <div>
                      <dt className="text-clinical-500">תאריך הצטרפות</dt>
                      <dd className="text-clinical-900 font-medium">
                        {new Intl.DateTimeFormat('he-IL', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(patient.createdAt))}
                      </dd>
                    </div>
                  </dl>
                </Card>

                {/* Care Team */}
                <Card>
                  <h3 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
                    צוות מטפלים
                  </h3>
                  <div className="space-y-3">
                    {assignedTherapists.map(therapist => (
                      <div key={therapist.id} className="flex items-center gap-3">
                        <Avatar name={therapist.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-clinical-900">{therapist.name}</p>
                          <p className="text-xs text-clinical-500">
                            {therapistRoleLabels[therapist.therapistRole!]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-4">
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    הוסף חבר צוות
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="max-w-4xl">
              <SessionList
                sessions={sessions}
                therapists={users}
                showPatient={false}
              />
            </div>
          )}

          {activeTab === 'recordings' && (
            <div className="max-w-4xl">
              <RecordingsList
                recordings={recordings}
                sessions={sessions}
                onDelete={deleteRecording}
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="max-w-3xl space-y-4">
              {goals.map(goal => (
                <Card key={goal.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-clinical-900">{goal.description}</h4>
                      <p className="text-sm text-clinical-500">{goal.measurementCriteria}</p>
                    </div>
                    <Badge variant={goal.status === 'achieved' ? 'success' : goal.status === 'active' ? 'info' : 'sage'}>
                      {goal.status}
                    </Badge>
                  </div>
                  <ProgressBar value={goal.progress} showLabel className="mb-3" />
                  <div className="flex items-center justify-between text-sm text-clinical-500">
                    <span>יעד: {goal.targetDate ? new Intl.DateTimeFormat('he-IL').format(new Date(goal.targetDate)) : 'מתמשך'}</span>
                    <Button variant="ghost" size="sm">עדכן התקדמות</Button>
                  </div>
                </Card>
              ))}
              <Button variant="secondary" className="w-full">
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                הוסף מטרה חדשה
              </Button>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <ReportGenerator
                patientId={patientId}
                patientName={`${patient.firstName} ${patient.lastName}`}
                sessions={sessions}
                goals={goals}
                onGenerate={(report) => console.log('Generated:', report)}
              />

              {reports.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-clinical-900 mb-4">דוחות קודמים</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map(report => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        onView={() => {}}
                        onExport={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-clinical-900 mb-1">אין מסמכים עדיין</h3>
              <p className="text-clinical-500 mb-4">העלה טפסי קליטה, הסכמות ומסמכים נוספים</p>
              <Button variant="primary">
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                העלה מסמך
              </Button>
            </Card>
          )}
        </div>
      </main>

      <Modal isOpen={showNewSession} onClose={() => setShowNewSession(false)} title="תזמון מפגש" size="lg">
        <div className="text-center py-8 text-clinical-500">
          טופס תזמון מפגש יופיע כאן...
        </div>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal isOpen={showEditPatient} onClose={() => setShowEditPatient(false)} title="עריכת פרטי מטופל" size="lg">
        <EditPatientForm
          patient={patient}
          onClose={() => setShowEditPatient(false)}
          onSaved={() => {
            setShowEditPatient(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}

interface EditPatientFormProps {
  patient: {
    id: string;
    idNumber: string;
    dateOfBirth: string;
    gender: string;
    primaryDiagnosis?: string;
    referralSource?: string;
    insuranceProvider?: string;
    status: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

function EditPatientForm({ patient, onClose, onSaved }: EditPatientFormProps) {
  const [formData, setFormData] = useState({
    dateOfBirth: patient.dateOfBirth || '',
    gender: patient.gender || '',
    primaryDiagnosis: patient.primaryDiagnosis || '',
    referralSource: patient.referralSource || '',
    insuranceProvider: patient.insuranceProvider || '',
    status: patient.status || 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update patient');
      }

      onSaved();
    } catch (err) {
      setError('שגיאה בעדכון פרטי המטופל');
      console.error(err);
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
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">תעודת זהות</label>
        <input
          type="text"
          value={patient.idNumber}
          disabled
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-clinical-50 text-clinical-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">תאריך לידה</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">מגדר</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
            <option value="other">אחר</option>
            <option value="prefer_not_to_say">מעדיף לא לציין</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">אבחנה ראשית</label>
        <input
          type="text"
          value={formData.primaryDiagnosis}
          onChange={(e) => setFormData(prev => ({ ...prev, primaryDiagnosis: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">מקור הפניה</label>
          <input
            type="text"
            value={formData.referralSource}
            onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">קופת חולים</label>
          <input
            type="text"
            value={formData.insuranceProvider}
            onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">סטטוס</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
        >
          <option value="active">פעיל</option>
          <option value="inactive">לא פעיל</option>
          <option value="discharged">שוחרר</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          ביטול
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isSubmitting ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
    </form>
  );
}
