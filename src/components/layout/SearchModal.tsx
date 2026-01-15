'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePatients, useSessions } from '@/lib/hooks';
import { Patient, Session } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: 'patient' | 'session';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { patients } = usePatients();
  const { sessions } = useSessions();

  // Build patient index Map for O(1) lookups instead of O(n) find operations
  const patientById = React.useMemo(() => {
    if (!patients) return new Map<string, Patient>();
    return new Map(patients.map((p: Patient) => [p.id, p]));
  }, [patients]);

  // Filter results based on query
  const results: SearchResult[] = React.useMemo(() => {
    if (!query.trim()) return [];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search patients
    patients?.forEach((patient: Patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const idNumber = patient.idNumber?.toLowerCase() || '';
      const diagnosis = patient.primaryDiagnosis?.toLowerCase() || '';

      if (
        fullName.includes(lowerQuery) ||
        idNumber.includes(lowerQuery) ||
        diagnosis.includes(lowerQuery)
      ) {
        searchResults.push({
          type: 'patient',
          id: patient.id,
          title: `${patient.firstName} ${patient.lastName}`,
          subtitle: patient.primaryDiagnosis || 'ללא אבחנה',
          href: `/patients/${patient.id}`,
        });
      }
    });

    // Search sessions (by patient name or date) - uses O(1) Map lookup instead of O(n) find
    sessions?.forEach((session: Session) => {
      const patient = patientById.get(session.patientId);
      if (!patient) return;

      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const dateStr = new Date(session.scheduledAt).toLocaleDateString('he-IL');

      if (fullName.includes(lowerQuery) || dateStr.includes(query)) {
        searchResults.push({
          type: 'session',
          id: session.id,
          title: `מפגש: ${patient.firstName} ${patient.lastName}`,
          subtitle: `${dateStr} - ${session.status === 'completed' ? 'הושלם' : session.status === 'scheduled' ? 'מתוכנן' : session.status}`,
          href: `/sessions/${session.id}`,
        });
      }
    });

    return searchResults.slice(0, 8); // Limit to 8 results
  }, [query, patients, sessions, patientById]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, router, onClose]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-24 z-50 mx-auto max-w-xl px-4">
        <div className="bg-white rounded-xl shadow-2xl border border-sage-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-sage-100">
            <svg
              className="w-5 h-5 text-clinical-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="חפש מטופלים, מפגשים..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 text-clinical-900 placeholder:text-clinical-400 focus:outline-none text-sm"
              dir="rtl"
            />
            <kbd className="px-2 py-1 rounded bg-sage-100 text-xs text-clinical-500 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-clinical-500 text-sm">
                  לא נמצאו תוצאות עבור &quot;{query}&quot;
                </div>
              ) : (
                <ul>
                  {results.map((result, index) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        onClick={() => {
                          router.push(result.href);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-right transition-colors ${
                          index === selectedIndex
                            ? 'bg-sage-50'
                            : 'hover:bg-sage-50/50'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            result.type === 'patient'
                              ? 'bg-sage-100 text-sage-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {result.type === 'patient' ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-clinical-900 truncate">
                            {result.title}
                          </div>
                          <div className="text-xs text-clinical-500 truncate">
                            {result.subtitle}
                          </div>
                        </div>

                        {/* Arrow */}
                        {index === selectedIndex && (
                          <svg
                            className="w-4 h-4 text-clinical-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Footer hint */}
          {!query.trim() && (
            <div className="px-4 py-3 border-t border-sage-100 flex items-center justify-between text-xs text-clinical-500">
              <span>הקלד לחיפוש מטופלים או מפגשים</span>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-sage-100 font-mono">↑↓</kbd>
                <span>ניווט</span>
                <kbd className="px-1.5 py-0.5 rounded bg-sage-100 font-mono">↵</kbd>
                <span>בחירה</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
