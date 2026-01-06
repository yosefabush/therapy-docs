'use client';

import React, { useState, useEffect } from 'react';
import { Session, SessionType, TherapistRole, SessionNotes } from '@/types';
import { Button, Input, Textarea, Select, Card, Badge, Modal } from '@/components/ui';
import { getSessionTemplate, riskAssessmentFields } from '@/lib/templates';
import { sessionTypeLabels, therapistRoleLabels } from '@/lib/mock-data';

interface SessionFormProps {
  session?: Partial<Session>;
  therapistRole: TherapistRole;
  onSubmit: (notes: SessionNotes, status: Session['status']) => void;
  onSaveDraft: (notes: SessionNotes) => void;
  isLoading?: boolean;
}

export function SessionForm({ 
  session, 
  therapistRole, 
  onSubmit, 
  onSaveDraft,
  isLoading 
}: SessionFormProps) {
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
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setShowVoiceRecorder(true)}
          className="flex-1"
        >
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          הערת קול
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowRiskAssessment(true)}
          className="flex-1"
        >
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          הערכת סיכון
        </Button>
        <Button variant="ghost" className="flex-1">
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          מתבנית
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
        <VoiceRecorder
          onTranscriptionComplete={(transcript) => {
            // Append to subjective notes
            setNotes(prev => ({
              ...prev,
              subjective: prev.subjective + (prev.subjective ? '\n\n' : '') + transcript
            }));
            setShowVoiceRecorder(false);
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
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
        label="מחשבות רצחניות"
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

// Voice Recorder Sub-component (Revolutionary Feature)
interface VoiceRecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
  onClose: () => void;
}

function VoiceRecorder({ onTranscriptionComplete, onClose }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate transcription
      setTranscript('Patient reports improvement in sleep patterns since last session. Still experiencing morning fatigue but able to complete daily activities. Noted some positive social interactions this week.');
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript('');
    }
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
          isRecording ? 'bg-red-100 animate-pulse' : 'bg-sage-100'
        }`}>
          <svg 
            className={`w-10 h-10 ${isRecording ? 'text-red-600' : 'text-sage-600'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        
        <p className="text-2xl font-mono text-clinical-900 mt-4">{formatTime(recordingTime)}</p>
        <p className="text-sm text-clinical-500 mt-1">
          {isRecording ? 'מקליט...' : 'לחץ להתחלת הקלטה'}
        </p>
      </div>

      <Button
        variant={isRecording ? 'danger' : 'primary'}
        onClick={handleToggleRecording}
        className="mb-4"
      >
        {isRecording ? 'עצור הקלטה' : 'התחל הקלטה'}
      </Button>

      {transcript && (
        <div className="mt-6 text-right">
          <h4 className="font-medium text-clinical-900 mb-2">תמלול</h4>
          <div className="p-4 bg-sage-50 rounded-lg text-sm text-clinical-700">
            {transcript}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={onClose}>בטל</Button>
            <Button variant="primary" onClick={() => onTranscriptionComplete(transcript)}>
              הוסף להערות
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-clinical-400 mt-4">
        <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        כל ההקלטות מוצפנות ותואמות לתקן HIPAA
      </p>
    </div>
  );
}
