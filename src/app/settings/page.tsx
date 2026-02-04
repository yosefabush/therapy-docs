'use client';

import React, { useState } from 'react';
import { Sidebar, MobileMenuProvider, useMobileMenu } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, Button, Tabs } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useCurrentUser } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

function SettingsPageContent() {
  const { toggle: toggleMobileMenu } = useMobileMenu();
  const [activeTab, setActiveTab] = useState('profile');

  const { user: currentUser, loading, error } = useCurrentUser();

  if (loading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (error || !currentUser) {
    return <ErrorMessage message="Failed to load user data" />;
  }

  const tabs = [
    { id: 'profile', label: 'פרופיל' },
    { id: 'notifications', label: 'התראות' },
    { id: 'security', label: 'אבטחה' },
    { id: 'preferences', label: 'העדפות' },
  ];

  return (
    <div className="min-h-screen bg-warm-50 overflow-x-hidden">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="md:mr-64 pb-20 md:pb-0">
        <Header
          title="הגדרות"
          subtitle="נהל את הפרופיל והעדפות החשבון שלך"
          onMobileMenuToggle={toggleMobileMenu}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">פרטים אישיים</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">שם מלא</label>
                    <input
                      type="text"
                      defaultValue={currentUser.name}
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">דוא&quot;ל</label>
                    <input
                      type="email"
                      defaultValue={currentUser.email}
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">תפקיד</label>
                    <input
                      type="text"
                      defaultValue={therapistRoleLabels[currentUser.therapistRole!]}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-clinical-50 text-clinical-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">ארגון</label>
                    <input
                      type="text"
                      defaultValue={currentUser.organization || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">שמור שינויים</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">מספר רישיון</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">מספר רישיון</label>
                    <input
                      type="text"
                      defaultValue={currentUser.licenseNumber || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">עדכן רישיון</Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-lg font-semibold text-clinical-900 mb-4">העדפות התראות</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg hover:bg-sage-50">
                  <div>
                    <p className="font-medium text-clinical-900">התראות דוא&quot;ל</p>
                    <p className="text-sm text-clinical-500">קבל עדכונים על מפגשים ותיעוד</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-sage-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-lg hover:bg-sage-50">
                  <div>
                    <p className="font-medium text-clinical-900">התראות AI</p>
                    <p className="text-sm text-clinical-500">קבל התראות על תובנות חשובות</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-sage-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-lg hover:bg-sage-50">
                  <div>
                    <p className="font-medium text-clinical-900">תזכורות מפגשים</p>
                    <p className="text-sm text-clinical-500">קבל תזכורות לפני מפגשים</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-sage-600 rounded" />
                </label>
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="primary">שמור העדפות</Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">שינוי סיסמה</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">סיסמה נוכחית</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">סיסמה חדשה</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">אימות סיסמה חדשה</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">עדכן סיסמה</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">אימות דו-שלבי</h3>
                <p className="text-clinical-600 mb-4">הגן על החשבון שלך עם שכבת אבטחה נוספת</p>
                <Button variant="secondary">הפעל אימות דו-שלבי</Button>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <h3 className="text-lg font-semibold text-clinical-900 mb-4">העדפות מערכת</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-clinical-700 mb-1.5">שפה</label>
                  <select className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500">
                    <option value="he">עברית</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-clinical-700 mb-1.5">פורמט תאריך</label>
                  <select className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500">
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-clinical-700 mb-1.5">אזור זמן</label>
                  <select className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500">
                    <option value="Asia/Jerusalem">ישראל (GMT+2)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="primary">שמור העדפות</Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Main export wraps content with MobileMenuProvider
export default function SettingsPage() {
  return (
    <MobileMenuProvider>
      <SettingsPageContent />
    </MobileMenuProvider>
  );
}
