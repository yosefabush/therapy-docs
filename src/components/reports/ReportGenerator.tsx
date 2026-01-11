'use client';

import React, { useState } from 'react';
import { Report, ReportType, Session, TreatmentGoal } from '@/types';
import { Button, Card, Select, Badge, Textarea, Modal } from '@/components/ui';
import { generateMultidisciplinaryReport, analyzePatternsTrends } from '@/lib/ai-features';
import { therapistRoleLabels, sessionTypeLabels } from '@/lib/mock-data';

interface ReportGeneratorProps {
  patientId: string;
  patientName: string;
  sessions: Session[];
  goals: TreatmentGoal[];
  onGenerate: (report: Partial<Report>) => void;
}

export function ReportGenerator({ patientId, patientName, sessions, goals, onGenerate }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('progress_summary');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const reportTypeOptions = [
    { value: 'progress_summary', label: 'Progress Summary' },
    { value: 'discharge_summary', label: 'Discharge Summary' },
    { value: 'insurance_report', label: 'Insurance Report' },
    { value: 'referral_report', label: 'Referral Report' },
    { value: 'multidisciplinary_summary', label: 'Multidisciplinary Summary' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const content = generateMultidisciplinaryReport(
      sessions, goals, patientName,
      { start: new Date(dateRange.start), end: new Date(dateRange.end) }
    );
    
    setGeneratedContent(content);
    setShowPreview(true);
    setIsGenerating(false);
  };

  const handleSave = () => {
    onGenerate({
      patientId,
      reportType,
      generatedAt: new Date(),
      dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
      status: 'draft',
    });
    setShowPreview(false);
  };

  const insights = analyzePatternsTrends(sessions);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-clinical-900 mb-4" style={{ fontFamily: '"Crimson Pro", Georgia, serif' }}>
          Generate Treatment Report
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={reportTypeOptions}
          />
          
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">End Date</label>
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
          Generate Report with AI
        </Button>
      </Card>

      {insights.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-clinical-900 mb-4">AI-Generated Insights</h3>
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
                <p className="text-xs text-clinical-400 mt-1">Confidence: {Math.round(insight.confidence * 100)}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Report Preview" size="xl">
        <div className="space-y-4">
          <div className="p-4 bg-clinical-50 rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-sm text-clinical-700 whitespace-pre-wrap font-mono">{generatedContent}</pre>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowPreview(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ReportCard({ report, onView, onExport }: { report: Report; onView: () => void; onExport: () => void }) {
  const typeLabels: Record<ReportType, string> = {
    progress_summary: 'Progress Summary',
    discharge_summary: 'Discharge Summary',
    insurance_report: 'Insurance Report',
    referral_report: 'Referral Report',
    evaluation_report: 'Evaluation Report',
    treatment_summary: 'Treatment Summary',
    multidisciplinary_summary: 'Multidisciplinary Summary',
  };

  return (
    <Card hover padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-clinical-900">{typeLabels[report.reportType]}</h4>
            <p className="text-sm text-clinical-500">
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(report.generatedAt))}
            </p>
          </div>
          <Badge variant={report.status === 'signed' ? 'success' : report.status === 'finalized' ? 'info' : 'warning'}>
            {report.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onView} className="flex-1">View</Button>
          <Button variant="ghost" size="sm" onClick={onExport} className="flex-1">Export</Button>
        </div>
      </div>
    </Card>
  );
}
