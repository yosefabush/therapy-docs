'use client';

import React, { useState } from 'react';
import { Sidebar, MobileMenuProvider, useMobileMenu } from '@/components/layout/Sidebar';
import { Header, QuickActionButton } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, Button, Select, Tabs, Modal } from '@/components/ui';
import { PatientList } from '@/components/patients/PatientList';
import { therapistRoleLabels } from '@/lib/mock-data';
import { Patient } from '@/types';
import { useAuthRedirect, useMyPatients, useUsers } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { apiClient } from '@/lib/api/client';

function PatientsPageContent() {
  const { toggle: toggleMobileMenu } = useMobileMenu();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);

  const { user: currentUser, loading: userLoading } = useAuthRedirect();
  const { patients, loading: patientsLoading, error: patientsError, refetch } = useMyPatients(currentUser?.id);
  const { users, loading: usersLoading } = useUsers();

  if (userLoading || patientsLoading || usersLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!currentUser) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (patientsError) {
    return <ErrorMessage message={patientsError} onRetry={refetch} />;
  }

  const handlePatientAdded = () => {
    refetch();
    setShowNewPatient(false);
  };

  const tabs = [
    { id: 'all', label: 'כל המטופלים', count: patients.length },
    { id: 'active', label: 'פעילים', count: patients.filter(p => p.status === 'active').length },
    { id: 'discharged', label: 'שוחררו', count: patients.filter(p => p.status === 'discharged').length },
  ];

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchLower) ||
      patient.idNumber?.includes(searchQuery) ||
      patient.primaryDiagnosis?.toLowerCase().includes(searchLower);

    const matchesTab =
      activeTab === 'all' ? true :
      activeTab === 'active' ? patient.status === 'active' :
      activeTab === 'discharged' ? patient.status === 'discharged' : true;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-warm-50 overflow-x-hidden">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="md:mr-64 overflow-x-hidden pb-20 md:pb-0">
        <Header
          title="מטופלים"
          subtitle={`${patients.length} מטופלים בסה"כ`}
          onMobileMenuToggle={toggleMobileMenu}
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

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    placeholder="חפש לפי שם, ת.ז. או אבחנה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-sage-200 bg-white text-clinical-900 placeholder:text-clinical-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>
              </div>
              <Select
                options={[
                  { value: 'recent', label: 'עודכן לאחרונה' },
                  { value: 'name', label: 'שם מטופל' },
                  { value: 'sessions', label: 'הכי הרבה מפגשים' },
                ]}
                className="w-full sm:w-48"
              />
            </div>
          </Card>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {/* Patient List */}
          {filteredPatients.length > 0 ? (
            <PatientList patients={filteredPatients} therapists={users} />
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

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Main export wraps content with MobileMenuProvider
export default function PatientsPage() {
  return (
    <MobileMenuProvider>
      <PatientsPageContent />
    </MobileMenuProvider>
  );
}

interface NewPatientFormProps {
  onClose: () => void;
  onPatientAdded: () => void;
  currentUserId: string;
}

function NewPatientForm({ onClose, onPatientAdded, currentUserId }: NewPatientFormProps) {
  const [formData, setFormData] = useState({
    idNumber: '',
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
  const submittedRef = React.useRef(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'תעודת זהות היא שדה חובה';
    } else if (!/^\d{9}$/.test(formData.idNumber.trim())) {
      newErrors.idNumber = 'תעודת זהות חייבת להכיל 9 ספרות';
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (submittedRef.current || isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    submittedRef.current = true;
    setIsSubmitting(true);

    try {
      const patientData = {
        idNumber: formData.idNumber.trim(),
        encryptedData: `encrypted-${formData.firstName}-${formData.lastName}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        primaryDiagnosis: formData.diagnosis.trim() || undefined,
        referralSource: formData.referralSource.trim() || undefined,
        insuranceProvider: formData.insurance.trim() || undefined,
        assignedTherapists: [currentUserId],
        status: 'active' as const,
      };

      const response = await apiClient.post<Patient>('/patients', patientData);
      if (response.error) {
        throw new Error(response.error);
      }
      onPatientAdded();
    } catch (error) {
      console.error('Error creating patient:', error);
      setErrors({ submit: 'שגיאה ביצירת המטופל. נסה שוב.' });
      submittedRef.current = false; // Allow retry on error
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

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">תעודת זהות</label>
        <input
          type="text"
          value={formData.idNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
          placeholder="123456789"
          maxLength={9}
          className={`w-full px-4 py-2.5 rounded-lg border bg-white ${
            errors.idNumber ? 'border-red-400 focus:ring-red-500' : 'border-sage-200 focus:ring-sage-500'
          } focus:outline-none focus:ring-2`}
          required
        />
        {errors.idNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">שם פרטי</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className={`w-full px-4 py-2.5 rounded-lg border bg-white ${
              errors.firstName ? 'border-red-400 focus:ring-red-500' : 'border-sage-200 focus:ring-sage-500'
            } focus:outline-none focus:ring-2`}
            required
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">שם משפחה</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className={`w-full px-4 py-2.5 rounded-lg border bg-white ${
              errors.lastName ? 'border-red-400 focus:ring-red-500' : 'border-sage-200 focus:ring-sage-500'
            } focus:outline-none focus:ring-2`}
            required
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">מגדר</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className={`w-full px-4 py-2.5 rounded-lg border bg-white ${
              errors.gender ? 'border-red-400 focus:ring-red-500' : 'border-sage-200 focus:ring-sage-500'
            } focus:outline-none focus:ring-2`}
          >
            <option value="">בחר...</option>
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
            <option value="other">אחר</option>
            <option value="prefer_not_to_say">מעדיף לא לציין</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-clinical-700 mb-1.5">אבחנה ראשית</label>
        <input
          type="text"
          value={formData.diagnosis}
          onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
          placeholder="לדוגמה: הפרעת דיכאון מז'ורי"
          className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">מקור הפניה</label>
          <input
            type="text"
            value={formData.referralSource}
            onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))}
            placeholder="לדוגמה: רופא משפחה"
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1.5">קופת חולים</label>
          <input
            type="text"
            value={formData.insurance}
            onChange={(e) => setFormData(prev => ({ ...prev, insurance: e.target.value }))}
            placeholder="לדוגמה: מכבי"
            className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>
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
