'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { apiClient } from '@/lib/api/client';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface NewSessionFormProps {
  patients: Patient[];
  currentUserId: string;
  therapistRole: string;
  onClose: () => void;
  onSessionAdded: () => void;
}

export function NewSessionForm({ patients, currentUserId, therapistRole, onClose, onSessionAdded }: NewSessionFormProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'individual_therapy',
    date: '',
    time: '',
    duration: '50',
    location: 'in_person',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.date || !formData.time) {
      setError('נא למלא את כל השדות הנדרשים');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);

      const sessionData = {
        patientId: formData.patientId,
        therapistId: currentUserId,
        therapistRole: therapistRole,
        sessionType: formData.type,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(formData.duration),
        location: formData.location,
        status: 'scheduled',
      };

      const response = await apiClient.post('/sessions', sessionData);
      if (response.error) {
        throw new Error(response.error);
      }
      onSessionAdded();
    } catch (err) {
      setError('שגיאה ביצירת המפגש');
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
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">מטופל</label>
        <select
          value={formData.patientId}
          onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          required
        >
          <option value="">בחר מטופל...</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">סוג מפגש</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
        >
          <option value="individual_therapy">טיפול פרטני</option>
          <option value="group_therapy">טיפול קבוצתי</option>
          <option value="family_therapy">טיפול משפחתי</option>
          <option value="assessment">הערכה</option>
          <option value="follow_up">מעקב</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">תאריך</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">שעה</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">משך (דקות)</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="30">30 דקות</option>
            <option value="45">45 דקות</option>
            <option value="50">50 דקות</option>
            <option value="60">60 דקות</option>
            <option value="90">90 דקות</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">מיקום</label>
          <select
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="in_person">פנים אל פנים</option>
            <option value="telehealth">טלה-בריאות</option>
            <option value="home_visit">ביקור בית</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>ביטול</Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isSubmitting ? 'יוצר מפגש...' : 'תזמן מפגש'}
        </Button>
      </div>
    </form>
  );
}
