'use client';

import React, { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header, QuickActionButton } from '@/components/layout/Header';
import { Card, Button, Input, Select, Tabs, Modal, Badge } from '@/components/ui';
import { PatientList } from '@/components/patients/PatientList';
import { mockUsers, mockPatients, therapistRoleLabels, addPatient, CreatePatientData } from '@/lib/mock-data';
import { Patient } from '@/types';

export default function PatientsPage() {
  const currentUser = mockUsers[0];
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);

  const handlePatientAdded = useCallback((newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient]);
    setShowNewPatient(false);
  }, []);

  const tabs = [
    { id: 'all', label: 'כל המטופלים', count: patients.length },
    { id: 'active', label: 'פעילים', count: patients.filter(p => p.status === 'active').length },
    { id: 'mine', label: 'המטופלים שלי', count: patients.filter(p => p.assignedTherapists.includes(currentUser.id)).length },
    { id: 'discharged', label: 'שוחררו', count: patients.filter(p => p.status === 'discharged').length },
  ];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.primaryDiagnosis?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'active' ? patient.status === 'active' :
      activeTab === 'mine' ? patient.assignedTherapists.includes(currentUser.id) :
      activeTab === 'discharged' ? patient.status === 'discharged' : true;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        <Header
          title="מטופלים"
          subtitle={`${patients.length} מטופלים בסה"כ`}
          actions={
            <QuickActionButton
              label="מטופל חדש"
              onClick={() => setShowNewPatient(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          }
        />

        <div className="p-8">
          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    placeholder="חפש לפי קוד מטופל או אבחנה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-sage-200 bg-white text-clinical-900 placeholder:text-clinical-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>
              </div>
              <Select
                options={[
                  { value: 'recent', label: 'עודכן לאחרונה' },
                  { value: 'name', label: 'קוד מטופל' },
                  { value: 'sessions', label: 'הכי הרבה מפגשים' },
                ]}
                className="w-48"
              />
            </div>
          </Card>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {/* Patient List */}
          {filteredPatients.length > 0 ? (
            <PatientList patients={filteredPatients} therapists={mockUsers} />
          ) : (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-medium text-clinical-900 mb-1">לא נמצאו מטופלים</h3>
              <p className="text-clinical-500 mb-4">נסה לשנות את החיפוש או הסינון</p>
              <Button variant="primary" onClick={() => setShowNewPatient(true)}>
                הוסף מטופל חדש
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* New Patient Modal */}
      <Modal isOpen={showNewPatient} onClose={() => setShowNewPatient(false)} title="הוספת מטופל חדש" size="lg">
        <NewPatientForm
          onClose={() => setShowNewPatient(false)}
          onPatientAdded={handlePatientAdded}
          currentUserId={currentUser.id}
        />
      </Modal>
    </div>
  );
}

interface NewPatientFormProps {
  onClose: () => void;
  onPatientAdded: (patient: Patient) => void;
  currentUserId: string;
}

function NewPatientForm({ onClose, onPatientAdded, currentUserId }: NewPatientFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    diagnosis: '',
    referralSource: '',
    insurance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'שם פרטי הוא שדה חובה';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'שם משפחה הוא שדה חובה';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'תאריך לידה הוא שדה חובה';
    }
    if (!formData.gender) {
      newErrors.gender = 'מגדר הוא שדה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const patientData: CreatePatientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        diagnosis: formData.diagnosis.trim() || undefined,
        referralSource: formData.referralSource.trim() || undefined,
        insurance: formData.insurance.trim() || undefined,
        assignedTherapistId: currentUserId,
      };

      const newPatient = addPatient(patientData);
      onPatientAdded(newPatient);
    } catch (error) {
      console.error('Error creating patient:', error);
      setErrors({ submit: 'שגיאה ביצירת המטופל. נסה שוב.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">מידע בריאותי מוגן</p>
            <p className="text-xs text-amber-700">כל נתוני המטופל מוצפנים ותואמים לתקן HIPAA</p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="שם פרטי"
          value={formData.firstName}
          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
          error={errors.firstName}
          required
        />
        <Input
          label="שם משפחה"
          value={formData.lastName}
          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
          error={errors.lastName}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">תאריך לידה</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className={`w-full px-4 py-2.5 rounded-lg border bg-white ${
              errors.dateOfBirth ? 'border-red-400 focus:ring-red-500' : 'border-sage-200 focus:ring-sage-500'
            } focus:outline-none focus:ring-2`}
            required
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
          )}
        </div>
        <div>
          <Select
            label="מגדר"
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            options={[
              { value: '', label: 'בחר...' },
              { value: 'male', label: 'זכר' },
              { value: 'female', label: 'נקבה' },
              { value: 'other', label: 'אחר' },
              { value: 'prefer_not_to_say', label: 'מעדיף לא לציין' },
            ]}
            error={errors.gender}
          />
        </div>
      </div>

      <Input
        label="אבחנה ראשית"
        value={formData.diagnosis}
        onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
        placeholder="לדוגמה: הפרעת דיכאון מז'ורי"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="מקור הפניה"
          value={formData.referralSource}
          onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))}
          placeholder="לדוגמה: רופא משפחה"
        />
        <Input
          label="קופת חולים"
          value={formData.insurance}
          onChange={(e) => setFormData(prev => ({ ...prev, insurance: e.target.value }))}
          placeholder="לדוגמה: מכבי"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          ביטול
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isSubmitting ? 'יוצר מטופל...' : 'צור מטופל'}
        </Button>
      </div>
    </form>
  );
}
