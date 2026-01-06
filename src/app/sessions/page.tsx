'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header, QuickActionButton } from '@/components/layout/Header';
import { Card, Button, Select, Tabs, Modal } from '@/components/ui';
import { SessionList } from '@/components/sessions/SessionList';
import { SessionForm } from '@/components/sessions/SessionForm';
import { mockUsers, mockPatients, mockSessions, therapistRoleLabels } from '@/lib/mock-data';

export default function SessionsPage() {
  const currentUser = mockUsers[0];
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mySessions = mockSessions.filter(s => s.therapistId === currentUser.id);
  
  const upcomingSessions = mySessions.filter(s => 
    (s.status === 'scheduled' || s.status === 'in_progress') && 
    new Date(s.scheduledAt) >= today
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const completedSessions = mySessions.filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const pendingSignature = completedSessions.filter(s => !s.signedAt);

  const tabs = [
    { id: 'upcoming', label: 'קרובים', count: upcomingSessions.length },
    { id: 'completed', label: 'הושלמו', count: completedSessions.length },
    { id: 'pending', label: 'ממתינים לחתימה', count: pendingSignature.length },
    { id: 'all', label: 'כל המפגשים', count: mySessions.length },
  ];

  const getFilteredSessions = () => {
    let sessions = mySessions;
    
    switch (activeTab) {
      case 'upcoming':
        sessions = upcomingSessions;
        break;
      case 'completed':
        sessions = completedSessions;
        break;
      case 'pending':
        sessions = pendingSignature;
        break;
      default:
        sessions = mySessions.sort((a, b) => 
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );
    }

    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      sessions = sessions.filter(s => {
        const sessionDate = new Date(s.scheduledAt);
        return sessionDate.toDateString() === filterDate.toDateString();
      });
    }

    return sessions;
  };

  const patientCodes: Record<string, string> = {};
  mockPatients.forEach(p => { patientCodes[p.id] = p.patientCode; });

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        <Header
          title="מפגשים"
          subtitle={`${mySessions.length} מפגשים בסה"כ`}
          actions={
            <QuickActionButton
              label="מפגש חדש"
              onClick={() => setShowNewSession(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          }
        />

        <div className="p-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-clinical-900">{upcomingSessions.length}</p>
                  <p className="text-xs text-clinical-500">קרובים</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-clinical-900">{pendingSignature.length}</p>
                  <p className="text-xs text-clinical-500">ממתין לחתימה</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-clinical-900">{completedSessions.filter(s => s.signedAt).length}</p>
                  <p className="text-xs text-clinical-500">הושלמו וחתומים</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-clinical-900">{mySessions.length}</p>
                  <p className="text-xs text-clinical-500">סה&quot;כ מפגשים</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-sage-200 bg-white text-clinical-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  placeholder="סינון לפי תאריך"
                />
              </div>
              <Select
                options={[
                  { value: 'all', label: 'כל המיקומים' },
                  { value: 'in_person', label: 'פנים אל פנים' },
                  { value: 'telehealth', label: 'טלה-בריאות' },
                  { value: 'home_visit', label: 'ביקור בית' },
                ]}
                className="w-40"
              />
              {selectedDate && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate('')}>
                  נקה סינון
                </Button>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {/* Sessions List */}
          {getFilteredSessions().length > 0 ? (
            <SessionList 
              sessions={getFilteredSessions()} 
              therapists={mockUsers}
              patientCodes={patientCodes}
            />
          ) : (
            <Card className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-clinical-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-clinical-900 mb-1">לא נמצאו מפגשים</h3>
              <p className="text-clinical-500 mb-4">
                {activeTab === 'pending' ? 'כל המפגשים חתומים!' : 'תזמן מפגש חדש כדי להתחיל'}
              </p>
              {activeTab !== 'pending' && (
                <Button variant="primary" onClick={() => setShowNewSession(true)}>
                  תזמן מפגש
                </Button>
              )}
            </Card>
          )}
        </div>
      </main>

      {/* New Session Modal */}
      <Modal isOpen={showNewSession} onClose={() => setShowNewSession(false)} title="מפגש חדש" size="xl">
        <SessionForm
          therapistRole={currentUser.therapistRole!}
          onSubmit={(notes, status) => {
            console.log('Submitted:', notes, status);
            setShowNewSession(false);
          }}
          onSaveDraft={(notes) => {
            console.log('Draft saved:', notes);
          }}
        />
      </Modal>
    </div>
  );
}
