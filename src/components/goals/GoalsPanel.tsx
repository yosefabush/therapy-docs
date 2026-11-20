'use client';

import React, { useState } from 'react';
import { Card, Button, Badge, ProgressBar, Modal } from '@/components/ui';
import type { TreatmentGoal } from '@/types';

export const GOAL_STATUS_LABELS: Record<TreatmentGoal['status'], string> = {
  active: 'פעילה',
  achieved: 'הושגה',
  modified: 'עודכנה',
  discontinued: 'הופסקה',
};

interface GoalsPanelProps {
  patientId: string;
  goals: TreatmentGoal[];
  createGoal: (data: Partial<TreatmentGoal>) => Promise<TreatmentGoal>;
  updateGoal: (id: string, data: Partial<TreatmentGoal>) => Promise<TreatmentGoal>;
}

const fieldClass =
  'flex w-full rounded-lg border border-sage-200 bg-white px-4 py-2.5 text-sm text-clinical-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500';
const labelClass = 'block text-sm font-medium text-clinical-700 mb-1.5';

// Server validation messages are English; never show them raw to the user.
function friendlyError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : '';
  return /[\u0590-\u05FF]/.test(message) ? message : fallback;
}

export function GoalsPanel({ patientId, goals, createGoal, updateGoal }: GoalsPanelProps) {
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // --- create ---------------------------------------------------------------
  const [showCreate, setShowCreate] = useState(false);
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [createErrors, setCreateErrors] = useState<{ description?: string; criteria?: string; form?: string }>({});
  const [creating, setCreating] = useState(false);

  const openCreate = () => {
    setDescription('');
    setCriteria('');
    setTargetDate('');
    setCreateErrors({});
    setShowCreate(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof createErrors = {};
    if (!description.trim()) errors.description = 'יש להזין תיאור מטרה';
    if (!criteria.trim()) errors.criteria = 'יש להזין קריטריון מדידה';
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCreating(true);
    try {
      await createGoal({
        patientId,
        description: description.trim(),
        measurementCriteria: criteria.trim(),
        targetDate: targetDate ? (new Date(targetDate).toISOString() as unknown as Date) : undefined,
        status: 'active',
        progress: 0,
      });
      setShowCreate(false);
      setFeedback({ kind: 'success', text: 'המטרה נוספה בהצלחה' });
    } catch (err) {
      setCreateErrors({ form: friendlyError(err, 'שגיאה בהוספת המטרה. נסו שוב.') });
    } finally {
      setCreating(false);
    }
  };

  // --- update progress ------------------------------------------------------
  const [editing, setEditing] = useState<TreatmentGoal | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<TreatmentGoal['status']>('active');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const openUpdate = (goal: TreatmentGoal) => {
    setEditing(goal);
    setProgress(goal.progress);
    setStatus(goal.status);
    setUpdateError(null);
  };

  const changeProgress = (value: number) => {
    const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
    setProgress(clamped);
    if (clamped === 100 && status === 'active') setStatus('achieved');
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      await updateGoal(editing.id, { progress, status });
      setEditing(null);
      setFeedback({ kind: 'success', text: 'התקדמות המטרה עודכנה' });
    } catch (err) {
      setUpdateError(friendlyError(err, 'שגיאה בעדכון ההתקדמות. נסו שוב.'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          data-testid="goals-feedback"
          className={`p-3 rounded-lg text-sm border ${
            feedback.kind === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {goals.length === 0 && (
        <Card className="text-center py-8 text-clinical-500">אין מטרות טיפול עדיין</Card>
      )}

      {goals.map((goal) => (
        <Card key={goal.id} data-testid="goal-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-clinical-900">{goal.description}</h4>
              <p className="text-sm text-clinical-500">{goal.measurementCriteria}</p>
            </div>
            <Badge variant={goal.status === 'achieved' ? 'success' : goal.status === 'active' ? 'info' : 'sage'}>
              {GOAL_STATUS_LABELS[goal.status] ?? goal.status}
            </Badge>
          </div>
          <ProgressBar value={goal.progress} showLabel className="mb-3" />
          <div className="flex items-center justify-between text-sm text-clinical-500">
            <span>
              יעד: {goal.targetDate ? new Intl.DateTimeFormat('he-IL').format(new Date(goal.targetDate)) : 'מתמשך'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => openUpdate(goal)}>
              עדכן התקדמות
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="secondary" className="w-full" onClick={openCreate}>
        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        הוסף מטרה חדשה
      </Button>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="הוספת מטרת טיפול" size="md">
        <form onSubmit={submitCreate} className="space-y-4 text-right" noValidate>
          {createErrors.form && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {createErrors.form}
            </div>
          )}
          <div>
            <label htmlFor="goal-description" className={labelClass}>תיאור המטרה</label>
            <textarea
              id="goal-description"
              className={fieldClass}
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {createErrors.description && <p className="text-sm text-red-600 mt-1">{createErrors.description}</p>}
          </div>
          <div>
            <label htmlFor="goal-criteria" className={labelClass}>קריטריון מדידה</label>
            <input
              id="goal-criteria"
              className={fieldClass}
              maxLength={2000}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
            {createErrors.criteria && <p className="text-sm text-red-600 mt-1">{createErrors.criteria}</p>}
          </div>
          <div>
            <label htmlFor="goal-target-date" className={labelClass}>תאריך יעד (אופציונלי)</label>
            <input
              id="goal-target-date"
              type="date"
              className={fieldClass}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-start pt-2">
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'שומר...' : 'הוסף מטרה'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title="עדכון התקדמות" size="md">
        {editing && (
          <form onSubmit={submitUpdate} className="space-y-4 text-right">
            <p className="text-sm text-clinical-600">{editing.description}</p>
            {updateError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {updateError}
              </div>
            )}
            <div>
              <label htmlFor="goal-progress" className={labelClass}>התקדמות (%)</label>
              <div className="flex items-center gap-3">
                <input
                  id="goal-progress"
                  type="number"
                  min={0}
                  max={100}
                  className={`${fieldClass} w-28`}
                  value={progress}
                  onChange={(e) => changeProgress(Number(e.target.value))}
                />
                <input
                  aria-label="סרגל התקדמות"
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => changeProgress(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label htmlFor="goal-status" className={labelClass}>סטטוס</label>
              <select
                id="goal-status"
                className={fieldClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as TreatmentGoal['status'])}
              >
                {(Object.keys(GOAL_STATUS_LABELS) as TreatmentGoal['status'][]).map((key) => (
                  <option key={key} value={key}>{GOAL_STATUS_LABELS[key]}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-start pt-2">
              <Button type="submit" variant="primary" disabled={updating}>
                {updating ? 'שומר...' : 'שמור התקדמות'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>ביטול</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
