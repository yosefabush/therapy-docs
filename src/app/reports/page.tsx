'use client';

import React, { useState } from 'react';
import { Sidebar, MobileMenuProvider, useMobileMenu } from '@/components/layout/Sidebar';
import { Header, QuickActionButton } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, Button, Badge, Tabs, Modal } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useAuthRedirect, useMyPatients, useMyReports } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function ReportsPageContent() {
  const { toggle: toggleMobileMenu } = useMobileMenu();
  const [activeTab, setActiveTab] = useState('all');
  const [showNewReport, setShowNewReport] = useState(false);
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  const { user: currentUser, loading: userLoading } = useAuthRedirect();
  const { patients, loading: patientsLoading } = useMyPatients(currentUser?.id);
  const { reports, loading: reportsLoading } = useMyReports(currentUser?.id);

  if (userLoading || patientsLoading || reportsLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!currentUser) {
    return <LoadingSpinner className="h-screen" />;
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

  const selectedReport = viewingReport ? reports.find(r => r.id === viewingReport) : null;
  const selectedPatient = selectedReport ? getPatient(selectedReport.patientId) : null;

  const downloadReportAsPDF = async (report?: any, patient?: any) => {
    const reportToDownload = report || selectedReport;
    const patientToDownload = patient || selectedPatient;
    if (!reportToDownload || !patientToDownload) return;

    // Dynamic import html2pdf.js to avoid SSR issues
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;

    // Create formatted HTML element
    const element = document.createElement('div');
    element.dir = 'rtl';
    element.lang = 'he';
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
        <div style="margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
          <h1 style="font-size: 24px; margin-bottom: 10px; color: #374151; border-bottom: 2px solid #6b7280; padding-bottom: 10px;">
            ${getReportTypeLabel(reportToDownload.reportType)}
          </h1>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
            <strong>מטופל/ת:</strong> ${patientToDownload.firstName} ${patientToDownload.lastName}
          </div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
            <strong>תאריך:</strong> ${new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(new Date(reportToDownload.dateRange.start))} - ${new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(new Date(reportToDownload.dateRange.end))}
          </div>
          ${(reportToDownload as any).title ? `<div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;"><strong>כותרת:</strong> ${(reportToDownload as any).title}</div>` : ''}
        </div>

        ${reportToDownload.content.summary ? `
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #4b5563; margin-bottom: 12px;">סיכום</h2>
            <p>${reportToDownload.content.summary}</p>
          </div>
        ` : ''}

        ${reportToDownload.content.sessionsSummary && reportToDownload.content.sessionsSummary.length > 0 ? `
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #4b5563; margin-bottom: 12px;">סיכום מפגשים</h2>
            ${reportToDownload.content.sessionsSummary.map((session: any) => `
              <div style="background-color: #fff; padding: 12px; margin-bottom: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                  ${new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(session.date))} - ${therapistRoleLabels[session.therapistRole as keyof typeof therapistRoleLabels]}
                </div>
                <p style="margin: 8px 0;"><strong>נקודות מפתח:</strong> ${session.keyPoints}</p>
                ${session.progress ? `<p style="margin: 8px 0;"><strong>התקדמות:</strong> ${session.progress}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${reportToDownload.content.goalsProgress && reportToDownload.content.goalsProgress.length > 0 ? `
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #4b5563; margin-bottom: 12px;">התקדמות יעדים</h2>
            ${reportToDownload.content.goalsProgress.map((goal: any) => `
              <div style="background-color: #fff; padding: 12px; margin-bottom: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                <h3 style="font-size: 16px; margin-top: 0; margin-bottom: 10px; color: #6b7280;">${goal.goalDescription}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0;">
                  <div>
                    <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">מצב התחלתי</div>
                    <div>${goal.initialStatus}</div>
                  </div>
                  <div>
                    <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">מצב נוכחי</div>
                    <div>${goal.currentStatus}</div>
                  </div>
                </div>
                ${goal.progressPercentage !== undefined ? `
                  <div style="margin-top: 10px;">
                    <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">התקדמות: ${goal.progressPercentage}%</div>
                    <div style="height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                      <div style="height: 100%; background-color: #10b981; width: ${goal.progressPercentage}%;"></div>
                    </div>
                  </div>
                ` : ''}
                ${goal.notes ? `<p style="font-size: 14px; color: #6b7280; margin-top: 8px;">${goal.notes}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${reportToDownload.content.recommendations ? `
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #4b5563; margin-bottom: 12px;">המלצות</h2>
            <p>${reportToDownload.content.recommendations}</p>
          </div>
        ` : ''}

        ${reportToDownload.content.clinicalImpressions ? `
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #4b5563; margin-bottom: 12px;">רושם קליני</h2>
            <p>${reportToDownload.content.clinicalImpressions}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p><strong>נוצר על ידי:</strong> ${currentUser.name}</p>
          <p><strong>תאריך יצירה:</strong> ${new Intl.DateTimeFormat('he-IL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(reportToDownload.generatedAt))}</p>
          ${reportToDownload.signedAt ? `<p><strong>נחתם בתאריך:</strong> ${new Intl.DateTimeFormat('he-IL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(reportToDownload.signedAt))}</p>` : ''}
        </div>
      </div>
    `;

    // Generate filename
    const fileName = `${getReportTypeLabel(reportToDownload.reportType)}_${patientToDownload.firstName}_${patientToDownload.lastName}_${new Date().toISOString().split('T')[0]}`;

    // PDF options
    const options = {
      margin: 10,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg' as 'jpeg' | 'png' | 'webp', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: 'portrait' as 'portrait' | 'landscape', unit: 'mm', format: 'a4' },
    };

    // Generate PDF
    html2pdf().set(options).from(element).save();
  };

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
    <div className="min-h-screen bg-warm-50 overflow-x-hidden">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="md:mr-64 pb-20 md:pb-0">
        <Header
          title="דוחות"
          subtitle={`${reports.length} דוחות בסה"כ`}
          onMobileMenuToggle={toggleMobileMenu}
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

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <div className="flex items-center justify-between min-w-[500px] sm:min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-clinical-900">{getReportTypeLabel(report.reportType)}</h3>
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-clinical-500">
                              {patient ? `${patient.firstName} ${patient.lastName}` : 'מטופל'} • {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(report.dateRange.start))} - {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(report.dateRange.end))}
                            </p>
                            <p className="text-xs text-clinical-400 mt-1">
                              נוצר: {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(report.generatedAt))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                          <Button variant="ghost" size="sm" onClick={() => setViewingReport(report.id)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadReportAsPDF(report, patient)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </Button>
                        </div>
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
                <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>
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

      {/* View Report Modal */}
      <Modal 
        isOpen={!!viewingReport} 
        onClose={() => setViewingReport(null)} 
        title={selectedReport ? getReportTypeLabel(selectedReport.reportType) : 'דוח'}
        size="xl"
      >
        {selectedReport && selectedPatient && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="border-b border-sage-100 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-clinical-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-sm text-clinical-500">
                    {new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(new Date(selectedReport.dateRange.start))} - {new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(new Date(selectedReport.dateRange.end))}
                  </p>
                </div>
                {getStatusBadge(selectedReport.status)}
              </div>
              {selectedReport.content.summary && (
                <h4 className="text-md font-medium text-clinical-700">{selectedReport.content.summary}</h4>
              )}
            </div>

            {/* Report Content */}
            <div className="space-y-6">
              {/* Summary */}
              {selectedReport.content.summary && (
                <div>
                  <h3 className="text-md font-semibold text-clinical-900 mb-2">סיכום</h3>
                  <div className="bg-sage-50 rounded-lg p-4 text-clinical-800 leading-relaxed">
                    {selectedReport.content.summary}
                  </div>
                </div>
              )}

              {/* Sessions Summary */}
              {selectedReport.content.sessionsSummary && selectedReport.content.sessionsSummary.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-clinical-900 mb-2">סיכום מפגשים</h3>
                  <div className="space-y-3">
                    {selectedReport.content.sessionsSummary.map((session: any, index: number) => (
                      <div key={index} className="bg-warm-50 rounded-lg p-4 border border-warm-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-clinical-900">
                            {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(session.date))}
                          </span>
                          <Badge variant="sage">{therapistRoleLabels[session.therapistRole as keyof typeof therapistRoleLabels]}</Badge>
                        </div>
                        <p className="text-sm text-clinical-700 mb-1"><strong>נקודות מפתח:</strong> {session.keyPoints}</p>
                        {session.progress && (
                          <p className="text-sm text-clinical-600"><strong>התקדמות:</strong> {session.progress}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals Progress */}
              {selectedReport.content.goalsProgress && selectedReport.content.goalsProgress.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-clinical-900 mb-2">התקדמות יעדים</h3>
                  <div className="space-y-3">
                    {selectedReport.content.goalsProgress.map((goal: any, index: number) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-clinical-900 mb-2">{goal.goalDescription}</h4>
                        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                          <div className="grid grid-cols-2 gap-3 text-sm mb-2 min-w-[280px]">
                            <div>
                              <p className="text-clinical-500 text-xs mb-1">מצב התחלתי</p>
                              <p className="text-clinical-700">{goal.initialStatus}</p>
                            </div>
                            <div>
                              <p className="text-clinical-500 text-xs mb-1">מצב נוכחי</p>
                              <p className="text-clinical-700">{goal.currentStatus}</p>
                            </div>
                          </div>
                        </div>
                        {goal.progressPercentage !== undefined && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-clinical-600 mb-1">
                              <span>התקדמות</span>
                              <span>{goal.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-clinical-200 rounded-full h-2">
                              <div
                                className="bg-sage-500 h-2 rounded-full transition-all"
                                style={{ width: `${goal.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {goal.notes && (
                          <p className="text-xs text-clinical-600 mt-2">{goal.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.content.recommendations && (
                <div>
                  <h3 className="text-md font-semibold text-clinical-900 mb-2">המלצות</h3>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 text-clinical-800">
                    {selectedReport.content.recommendations}
                  </div>
                </div>
              )}

              {/* Clinical Impressions */}
              {selectedReport.content.clinicalImpressions && (
                <div>
                  <h3 className="text-md font-semibold text-clinical-900 mb-2">רושם קליני</h3>
                  <div className="bg-sage-50 rounded-lg p-4 text-clinical-800">
                    {selectedReport.content.clinicalImpressions}
                  </div>
                </div>
              )}
            </div>

            {/* Report Metadata */}
            <div className="border-t border-sage-100 pt-4 space-y-2">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="min-w-[300px] space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-clinical-500 flex-shrink-0">נוצר על ידי:</span>
                    <span className="text-clinical-900 font-medium">{currentUser.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-clinical-500 flex-shrink-0">תאריך יצירה:</span>
                    <span className="text-clinical-900">{new Intl.DateTimeFormat('he-IL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(selectedReport.generatedAt))}</span>
                  </div>
                  {selectedReport.signedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-clinical-500 flex-shrink-0">נחתם בתאריך:</span>
                      <span className="text-clinical-900">{new Intl.DateTimeFormat('he-IL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(selectedReport.signedAt))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-4 border-t border-sage-100">
              <Button variant="primary" onClick={() => setViewingReport(null)}>סגור</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Main export wraps content with MobileMenuProvider
export default function ReportsPage() {
  return (
    <MobileMenuProvider>
      <ReportsPageContent />
    </MobileMenuProvider>
  );
}
