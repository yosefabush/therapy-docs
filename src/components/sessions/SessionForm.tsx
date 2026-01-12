'use client';

import React, { useState, useEffect } from 'react';
import { Session, SessionType, TherapistRole, SessionNotes } from '@/types';
import { Button, Input, Textarea, Select, Card, Badge, Modal } from '@/components/ui';
import { getSessionTemplate, riskAssessmentFields } from '@/lib/templates';
import { sessionTypeLabels, therapistRoleLabels } from '@/lib/mock-data';
import { VoiceRecorder } from '@/components/recordings';
import { useVoiceRecordings } from '@/lib/hooks';

interface SessionFormProps {
  session?: Partial<Session>;
  sessionId?: string;
  patientId?: string;
  therapistRole: TherapistRole;
  onSubmit: (notes: SessionNotes, status: Session['status']) => void;
  onSaveDraft: (notes: SessionNotes) => void;
  isLoading?: boolean;
}

export function SessionForm({
  session,
  sessionId,
  patientId,
  therapistRole,
  onSubmit,
  onSaveDraft,
  isLoading
}: SessionFormProps) {
  // Voice recordings hook
  const { createRecording } = useVoiceRecordings({ sessionId });
  const [sessionType, setSessionType] = useState<SessionType>(session?.sessionType || 'individual_therapy');
  const [notes, setNotes] = useState<SessionNotes>(session?.notes || {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    interventionsUsed: [],
  });
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>(session?.notes?.interventionsUsed || []);

  const template = getSessionTemplate(therapistRole, sessionType);

  const sessionTypeOptions = Object.entries(sessionTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const handleInterventionToggle = (intervention: string) => {
    setSelectedInterventions(prev => 
      prev.includes(intervention)
        ? prev.filter(i => i !== intervention)
        : [...prev, intervention]
    );
  };

  const handleSubmit = (asDraft: boolean) => {
    const finalNotes: SessionNotes = {
      ...notes,
      interventionsUsed: selectedInterventions,
    };

    if (asDraft) {
      onSaveDraft(finalNotes);
    } else {
      onSubmit(finalNotes, 'completed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Type Selection */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-clinical-900" style={{ fontFamily: '"David Libre", Georgia, serif' }}>
            תיעוד מפגש
          </h3>
          <Badge variant="sage">{therapistRoleLabels[therapistRole]}</Badge>
        </div>

        <Select
          label="סוג מפגש"
          value={sessionType}
          onChange={(e) => setSessionType(e.target.value as SessionType)}
          options={sessionTypeOptions}
        />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="secondary"
          onClick={() => setShowVoiceRecorder(true)}
          className="w-full"
        >
          <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="truncate">הערת קול</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowRiskAssessment(true)}
          className="w-full"
        >
          <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="truncate">הערכת סיכון</span>
        </Button>
        <Button variant="ghost" className="w-full">
          <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="truncate">מתבנית</span>
        </Button>
      </div>

      {/* SOAP Notes */}
      <Card>
        <h4 className="font-medium text-clinical-900 mb-4">הערות קליניות (פורמט SOAP)</h4>

        <div className="space-y-4">
          {notes.chiefComplaint !== undefined && (
            <Textarea
              label="תלונה עיקרית"
              value={notes.chiefComplaint}
              onChange={(e) => setNotes(prev => ({ ...prev, chiefComplaint: e.target.value }))}
              placeholder="הדאגה העיקרית של המטופל למפגש זה"
              className="min-h-[80px]"
            />
          )}

          <Textarea
            label="סובייקטיבי (S)"
            value={notes.subjective}
            onChange={(e) => setNotes(prev => ({ ...prev, subjective: e.target.value }))}
            placeholder="דיווח עצמי של המטופל: מצב רוח, מחשבות, התנהגויות, תסמינים מאז המפגש הקודם"
            className="min-h-[120px]"
            helperText="מה המטופל מדווח על מצבו"
          />

          <Textarea
            label="אובייקטיבי (O)"
            value={notes.objective}
            onChange={(e) => setNotes(prev => ({ ...prev, objective: e.target.value }))}
            placeholder="תצפיות קליניות, סטטוס מנטלי, אפקט, התנהגות, תוצאות בדיקות"
            className="min-h-[120px]"
            helperText="מה שאתה מתצפה במהלך המפגש"
          />

          <Textarea
            label="הערכה (A)"
            value={notes.assessment}
            onChange={(e) => setNotes(prev => ({ ...prev, assessment: e.target.value }))}
            placeholder="פרשנות קלינית, רשמים אבחנתיים, הערכת התקדמות"
            className="min-h-[120px]"
            helperText="הפרשנות המקצועית שלך"
          />

          <Textarea
            label="תוכנית (P)"
            value={notes.plan}
            onChange={(e) => setNotes(prev => ({ ...prev, plan: e.target.value }))}
            placeholder="תוכנית טיפול, מטרות, התערבויות למפגש הבא"
            className="min-h-[120px]"
            helperText="מה אתה מתכנן לעשות הלאה"
          />
        </div>
      </Card>

      {/* Interventions Used */}
      {template?.fields.find(f => f.id === 'interventionsUsed')?.options && (
        <Card>
          <h4 className="font-medium text-clinical-900 mb-4">התערבויות בשימוש</h4>
          <div className="flex flex-wrap gap-2">
            {template.fields.find(f => f.id === 'interventionsUsed')?.options?.map(intervention => (
              <button
                key={intervention}
                type="button"
                onClick={() => handleInterventionToggle(intervention)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedInterventions.includes(intervention)
                    ? 'bg-sage-600 text-white'
                    : 'bg-sage-50 text-sage-700 hover:bg-sage-100'
                }`}
              >
                {intervention}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Additional Notes */}
      <Card>
        <h4 className="font-medium text-clinical-900 mb-4">מידע נוסף</h4>

        <div className="space-y-4">
          <Textarea
            label="התקדמות לעבר מטרות"
            value={notes.progressTowardGoals || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, progressTowardGoals: e.target.value }))}
            placeholder="עדכון על התקדמות במטרות הטיפול"
            className="min-h-[80px]"
          />

          <Textarea
            label="שיעורי בית/משימות בין מפגשים"
            value={notes.homework || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, homework: e.target.value }))}
            placeholder="משימות שניתנו למטופל"
            className="min-h-[80px]"
          />

          <Textarea
            label="תוכנית למפגש הבא"
            value={notes.nextSessionPlan || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, nextSessionPlan: e.target.value }))}
            placeholder="נושאים והתערבויות מתוכננות למפגש הבא"
            className="min-h-[80px]"
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-sage-100">
        <Button variant="ghost">
          ביטול
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            loading={isLoading}
          >
            שמור טיוטה
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit(false)}
            loading={isLoading}
          >
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            השלם וחתום
          </Button>
        </div>
      </div>

      {/* Risk Assessment Modal */}
      <Modal
        isOpen={showRiskAssessment}
        onClose={() => setShowRiskAssessment(false)}
        title="הערכת סיכון"
        size="lg"
      >
        <RiskAssessmentForm
          value={notes.riskAssessment}
          onChange={(risk) => setNotes(prev => ({ ...prev, riskAssessment: risk }))}
          onClose={() => setShowRiskAssessment(false)}
        />
      </Modal>

      {/* Voice Recorder Modal */}
      <Modal
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        title="הקלטת הערת קול"
        size="md"
      >
        {sessionId && patientId ? (
          <VoiceRecorder
            sessionId={sessionId}
            patientId={patientId}
            onRecordingComplete={async (audioData, duration, transcript, diarizedTranscript) => {
              try {
                await createRecording({
                  sessionId,
                  patientId,
                  duration,
                  encryptedAudioUrl: audioData,
                  transcriptionStatus: diarizedTranscript ? 'completed' : (transcript ? 'completed' : 'pending'),
                  encryptedTranscript: transcript,
                  diarizedTranscript: diarizedTranscript,
                  consentObtained: true,
                });
                setShowVoiceRecorder(false);
              } catch (error) {
                console.error('Failed to save recording:', error);
              }
            }}
            onClose={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <div className="text-center py-8 text-clinical-500">
            יש לשמור את המפגש לפני הקלטה
          </div>
        )}
      </Modal>
    </div>
  );
}

// Risk Assessment Sub-component
interface RiskAssessmentFormProps {
  value?: SessionNotes['riskAssessment'];
  onChange: (value: SessionNotes['riskAssessment']) => void;
  onClose: () => void;
}

function RiskAssessmentForm({ value, onChange, onClose }: RiskAssessmentFormProps) {
  const [assessment, setAssessment] = useState(value || {
    suicidalIdeation: 'none' as const,
    homicidalIdeation: 'none' as const,
    selfHarm: 'none' as const,
    substanceUse: 'none' as const,
    safetyPlanReviewed: false,
    notes: '',
  });

  const handleSave = () => {
    onChange(assessment);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>חשוב:</strong> אם המטופל מדווח על מחשבות אובדניות או רצחניות פעילות עם תוכנית,
          יש לפעול לפי פרוטוקול התערבות במשבר של המוסד באופן מיידי.
        </p>
      </div>

      <Select
        label="מחשבות אובדניות"
        value={assessment.suicidalIdeation}
        onChange={(e) => setAssessment(prev => ({
          ...prev,
          suicidalIdeation: e.target.value as typeof assessment.suicidalIdeation
        }))}
        options={[
          { value: 'none', label: 'אין' },
          { value: 'passive', label: 'מחשבות פסיביות' },
          { value: 'active_no_plan', label: 'פעילות - ללא תוכנית' },
          { value: 'active_with_plan', label: 'פעילות - עם תוכנית' },
        ]}
      />

      <Select
        label="מחשבות אובדניות"
        value={assessment.homicidalIdeation}
        onChange={(e) => setAssessment(prev => ({
          ...prev,
          homicidalIdeation: e.target.value as typeof assessment.homicidalIdeation
        }))}
        options={[
          { value: 'none', label: 'אין' },
          { value: 'present', label: 'קיימות' },
        ]}
      />

      <Select
        label="פגיעה עצמית"
        value={assessment.selfHarm}
        onChange={(e) => setAssessment(prev => ({
          ...prev,
          selfHarm: e.target.value as typeof assessment.selfHarm
        }))}
        options={[
          { value: 'none', label: 'אין' },
          { value: 'history', label: 'היסטוריה בלבד' },
          { value: 'current', label: 'נוכחי' },
        ]}
      />

      <Select
        label="שימוש בחומרים"
        value={assessment.substanceUse}
        onChange={(e) => setAssessment(prev => ({
          ...prev,
          substanceUse: e.target.value as typeof assessment.substanceUse
        }))}
        options={[
          { value: 'none', label: 'אין' },
          { value: 'active', label: 'שימוש פעיל' },
          { value: 'in_recovery', label: 'בהחלמה' },
        ]}
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={assessment.safetyPlanReviewed}
          onChange={(e) => setAssessment(prev => ({
            ...prev,
            safetyPlanReviewed: e.target.checked
          }))}
          className="w-4 h-4 rounded border-sage-300 text-sage-600 focus:ring-sage-500"
        />
        <span className="text-sm text-clinical-700">תוכנית בטיחות נבדקה עם המטופל</span>
      </label>

      <Textarea
        label="הערות נוספות"
        value={assessment.notes || ''}
        onChange={(e) => setAssessment(prev => ({ ...prev, notes: e.target.value }))}
        placeholder="תצפיות נוספות הקשורות לסיכון"
        className="min-h-[80px]"
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
        <Button variant="ghost" onClick={onClose}>ביטול</Button>
        <Button variant="primary" onClick={handleSave}>שמור הערכה</Button>
      </div>
    </div>
  );
}

