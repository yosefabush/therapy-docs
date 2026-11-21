'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Report, ReportType, Session, TreatmentGoal } from '@/types';
import { Button, Card, Select, Badge, Textarea, Modal } from '@/components/ui';
import { generateMultidisciplinaryReport, analyzePatternsTrends } from '@/lib/ai-features';
import { therapistRoleLabels, sessionTypeLabels } from '@/lib/mock-data';
import { buildReportBody, reviveSessionDates, type CreateReportBody } from '@/lib/reports/build-report';

interface ReportGeneratorProps {
  patientId: string;
  patientName: string;
  sessions: Session[];
  goals: TreatmentGoal[];
  generatedBy: string;
  // Persists the report; should reject when saving fails so the dialog can show it.
  onGenerate: (report: CreateReportBody) => void | Promise<void>;
}

export function ReportGenerator({ patientId, patientName, sessions, goals, generatedBy, onGenerate }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('progress_summary');
  // Lazy initializer so the current time is read once on mount rather than on
  // every render (keeps the render pure).
  const [dateRange, setDateRange] = useState(() => ({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reportTypeOptions = [
    { value: 'progress_summary', label: 'סיכום התקדמות' },
    { value: 'discharge_summary', label: 'סיכום שחרור' },
    { value: 'insurance_report', label: 'דוח לביטוח' },
    { value: 'referral_report', label: 'דוח הפניה' },
    { value: 'multidisciplinary_summary', label: 'סיכום רב-מקצועי' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const content = generateMultidisciplinaryReport(
      reviveSessionDates(sessions), goals, patientName,
      { start: new Date(dateRange.start), end: new Date(dateRange.end) }
    );
    
    setGeneratedContent(content);
    setShowPreview(true);
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onGenerate(
        buildReportBody({
          patientId,
          patientName,
          reportType,
          generatedBy,
          sessions,
          goals,
          dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
          summary: generatedContent ?? undefined,
        })
      );
      setShowPreview(false);
    } catch {
      setSaveError('שמירת הדוח נכשלה. אנא נסה שוב.');
    } finally {
      setIsSaving(false);
    }
  };

  const insights = analyzePatternsTrends(sessions);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"Crimson Pro", Georgia, serif' }}>
          יצירת דוח טיפול
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            label="סוג דוח"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={reportTypeOptions}
          />
          
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">תאריך התחלה</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">תאריך סיום</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white"
            />
          </div>
        </div>

        <Button variant="primary" onClick={handleGenerate} loading={isGenerating} className="w-full">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          צור דוח באמצעות AI
        </Button>
      </Card>

      {insights.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-clinical-900 mb-4">תובנות שנוצרו על ידי AI</h3>
          <div className="space-y-3">
            {insights.map(insight => (
              <div 
                key={insight.id}
                className={`p-4 rounded-lg border ${
                  insight.type === 'risk_indicator' ? 'bg-red-50 border-red-200' : 
                  insight.type === 'progress_trend' ? 'bg-green-50 border-green-200' : 
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <p className="text-sm">{insight.content}</p>
                <p className="text-xs text-clinical-400 mt-1">ביטחון: {Math.round(insight.confidence * 100)}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="תצוגה מקדימה של הדוח" size="xl">
        <div className="space-y-4">
          <div className="p-4 bg-clinical-50 rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-sm text-clinical-700 whitespace-pre-wrap font-mono">{generatedContent}</pre>
          </div>
          {saveError && (
            <p role="alert" data-testid="save-report-error" className="text-sm text-red-700">{saveError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowPreview(false)}>ביטול</Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>שמור דוח</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  progress_summary: 'סיכום התקדמות',
  discharge_summary: 'סיכום שחרור',
  insurance_report: 'דוח לביטוח',
  referral_report: 'דוח הפניה',
  evaluation_report: 'דוח הערכה',
  treatment_summary: 'סיכום טיפול',
  multidisciplinary_summary: 'סיכום רב-מקצועי',
};

const REPORT_STATUS_LABELS: Record<Report['status'], string> = {
  draft: 'טיוטה',
  finalized: 'סופי',
  signed: 'חתום',
};

// `onDelete` is omitted when the viewer may not delete the report (e.g. a signed
// report for a non-admin); the server enforces the same rule.
export function ReportCard({ report, onDelete }: { report: Report; onDelete?: () => void }) {
  return (
    <Card hover padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-clinical-900">{report.title || REPORT_TYPE_LABELS[report.reportType]}</h4>
            <p className="text-sm text-clinical-500">
              {new Intl.DateTimeFormat('he-IL', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(report.generatedAt))}
            </p>
          </div>
          <Badge variant={report.status === 'signed' ? 'success' : report.status === 'finalized' ? 'info' : 'warning'}>
            {REPORT_STATUS_LABELS[report.status]}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href="/reports" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">פתח בעמוד הדוחות</Button>
          </Link>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              aria-label="מחק דוח"
              data-testid="delete-report"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              מחק
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
