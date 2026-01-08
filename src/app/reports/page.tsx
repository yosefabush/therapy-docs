'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header, QuickActionButton } from '@/components/layout/Header';
import { Card, Button, Badge, Tabs, Modal } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useCurrentUser, usePatients, useReports } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showNewReport, setShowNewReport] = useState(false);

  const { user: currentUser, loading: userLoading, error: userError } = useCurrentUser();
  const { patients, loading: patientsLoading } = usePatients();
  const { reports, loading: reportsLoading } = useReports();

  if (userLoading || patientsLoading || reportsLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (userError || !currentUser) {
    return <ErrorMessage message="Failed to load user data" />;
  }

  const tabs = [
    { id: 'all', label: 'כל הדוחות', count: reports.length },
    { id: 'progress_summary', label: 'התקדמות', count: reports.filter(r => r.reportType === 'progress_summary').length },
    { id: 'treatment_summary', label: 'סיכום טיפול', count: reports.filter(r => r.reportType === 'treatment_summary').length },
    { id: 'discharge_summary', label: 'שחרור', count: reports.filter(r => r.reportType === 'discharge_summary').length },
  ];

  const filteredReports = reports.filter(report =>
    activeTab === 'all' ? true : report.reportType === activeTab
  );

  const getPatient = (patientId: string) => patients.find(p => p.id === patientId);

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      progress_summary: 'דוח התקדמות',
      treatment_summary: 'סיכום טיפול',
      discharge_summary: 'דוח שחרור',
      evaluation_report: 'הערכה ראשונית',
      insurance_report: 'דוח לביטוח',
      referral_report: 'דוח הפניה',
      multidisciplinary_summary: 'סיכום רב-תחומי',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'sage'> = {
      final: 'success',
      draft: 'warning',
    };
    const labels: Record<string, string> = {
      final: 'סופי',
      draft: 'טיוטה',
    };
    return <Badge variant={variants[status] || 'sage'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        <Header
          title="דוחות"
          subtitle={`${reports.length} דוחות בסה"כ`}
          actions={
            <QuickActionButton
              label="דוח חדש"
              onClick={() => setShowNewReport(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          }
        />

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">סה&quot;כ דוחות</p>
                <p className="text-2xl font-semibold text-clinical-900">{reports.length}</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">טיוטות</p>
                <p className="text-2xl font-semibold text-clinical-900">
                  {reports.filter(r => r.status === 'draft').length}
                </p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">הושלמו החודש</p>
                <p className="text-2xl font-semibold text-clinical-900">
                  {reports.filter(r => {
                    const date = new Date(r.generatedAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-clinical-500">ממתינים לאישור</p>
                <p className="text-2xl font-semibold text-clinical-900">0</p>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {/* Reports List */}
          {filteredReports.length > 0 ? (
            <div className="space-y-3">
              {filteredReports.map(report => {
                const patient = getPatient(report.patientId);
                return (
                  <Card key={report.id} hover className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-clinical-900">{getReportTypeLabel(report.reportType)}</h3>
                            {getStatusBadge(report.status)}
                          </div>
                          <p className="text-sm text-clinical-500">
                            {patient?.patientCode} • {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(report.dateRange.start))} - {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(report.dateRange.end))}
                          </p>
                          <p className="text-xs text-clinical-400 mt-1">
                            נוצר: {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(report.generatedAt))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-clinical-900 mb-1">לא נמצאו דוחות</h3>
              <p className="text-clinical-500 mb-4">צור דוח חדש כדי להתחיל</p>
              <Button variant="primary" onClick={() => setShowNewReport(true)}>
                צור דוח חדש
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* New Report Modal */}
      <Modal isOpen={showNewReport} onClose={() => setShowNewReport(false)} title="יצירת דוח חדש" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">סוג דוח</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="">בחר סוג דוח...</option>
              <option value="progress_summary">דוח התקדמות</option>
              <option value="treatment_summary">סיכום טיפול</option>
              <option value="discharge_summary">דוח שחרור</option>
              <option value="evaluation_report">הערכה ראשונית</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">מטופל</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="">בחר מטופל...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>{patient.patientCode}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">כותרת</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="כותרת הדוח"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
            <Button variant="ghost" onClick={() => setShowNewReport(false)}>ביטול</Button>
            <Button variant="primary">צור דוח</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
