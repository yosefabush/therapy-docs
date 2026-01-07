'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, Button, Tabs } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';
import { useCurrentUser } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const { user: currentUser, loading, error } = useCurrentUser();

  if (loading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (error || !currentUser) {
    return <ErrorMessage message="Failed to load user data" />;
  }

  const tabs = [
    { id: 'faq', label: 'שאלות נפוצות' },
    { id: 'guides', label: 'מדריכים' },
    { id: 'contact', label: 'צור קשר' },
  ];

  const faqs = [
    {
      id: '1',
      question: 'כיצד ליצור מטופל חדש?',
      answer: 'לחץ על כפתור "מטופל חדש" בעמוד המטופלים או בלוח הבקרה. מלא את הפרטים הנדרשים ולחץ על "צור מטופל".',
    },
    {
      id: '2',
      question: 'כיצד לתעד מפגש?',
      answer: 'היכנס לפרטי המטופל ולחץ על "מפגש חדש". מלא את פרטי המפגש כולל הערות SOAP וחתום על התיעוד.',
    },
    {
      id: '3',
      question: 'מהן תובנות AI?',
      answer: 'תובנות AI הן ניתוחים אוטומטיים של דפוסים ומגמות בנתוני המטופלים שלך. המערכת מזהה שינויים בסיכון, התקדמות בטיפול ודפוסים חשובים.',
    },
    {
      id: '4',
      question: 'האם המידע מאובטח?',
      answer: 'כן, המערכת תואמת לתקן HIPAA. כל הנתונים מוצפנים ומאובטחים בהתאם לתקנות הפרטיות המחמירות ביותר.',
    },
    {
      id: '5',
      question: 'כיצד ליצור דוח?',
      answer: 'עבור לעמוד הדוחות ולחץ על "דוח חדש". בחר את סוג הדוח והמטופל, ומלא את הפרטים הנדרשים.',
    },
  ];

  const guides = [
    {
      id: '1',
      title: 'התחלה מהירה',
      description: 'מדריך בסיסי להכרת המערכת',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: '2',
      title: 'ניהול מטופלים',
      description: 'כיצד לנהל תיקי מטופלים ביעילות',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: '3',
      title: 'תיעוד מפגשים',
      description: 'הנחיות לתיעוד מקצועי ויעיל',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: '4',
      title: 'שימוש בתובנות AI',
      description: 'כיצד להפיק את המרב מהניתוחים האוטומטיים',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={{
        name: currentUser.name,
        role: therapistRoleLabels[currentUser.therapistRole!],
        organization: currentUser.organization,
      }} />

      <main className="mr-64">
        <Header
          title="עזרה ותמיכה"
          subtitle="מדריכים, שאלות נפוצות ויצירת קשר"
        />

        <div className="p-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map(faq => (
                <Card key={faq.id} className="overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-right"
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span className="font-medium text-clinical-900">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-clinical-400 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-4 text-clinical-600">
                      {faq.answer}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'guides' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.map(guide => (
                <Card key={guide.id} hover className="cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center text-sage-600">
                      {guide.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-clinical-900 mb-1">{guide.title}</h3>
                      <p className="text-sm text-clinical-500">{guide.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-clinical-900 mb-4">שלח הודעה</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">נושא</label>
                    <select className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500">
                      <option value="">בחר נושא...</option>
                      <option value="technical">בעיה טכנית</option>
                      <option value="billing">חיוב</option>
                      <option value="feature">בקשת תכונה</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-1.5">הודעה</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
                      placeholder="תאר את הבעיה או השאלה שלך..."
                    />
                  </div>
                  <Button variant="primary" className="w-full">שלח הודעה</Button>
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-clinical-900">דוא&quot;ל</h4>
                      <p className="text-sm text-clinical-500">support@therapydocs.co.il</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-clinical-900">טלפון</h4>
                      <p className="text-sm text-clinical-500">03-1234567</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-clinical-900">שעות פעילות</h4>
                      <p className="text-sm text-clinical-500">א&apos;-ה&apos; 9:00-17:00</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
