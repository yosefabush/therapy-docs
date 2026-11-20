'use client';

import React, { useRef, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { usePatientDocuments } from '@/lib/hooks/use-patient-documents';
import {
  DOCUMENT_ACCEPT_ATTR,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  formatFileSize,
  getExtension,
} from '@/lib/documents/validate';

interface DocumentsPanelProps {
  patientId: string;
}

export function DocumentsPanel({ patientId }: DocumentsPanelProps) {
  const { documents, loading, error, uploadDocument, deleteDocument } = usePatientDocuments(patientId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setFeedback(null);
    let uploaded = 0;
    const failures: string[] = [];
    // One at a time: each request stays well under the platform body limit.
    for (const file of Array.from(files)) {
      try {
        await uploadDocument(file);
        uploaded++;
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : 'ההעלאה נכשלה'}`);
      }
    }
    if (inputRef.current) inputRef.current.value = '';
    setUploading(false);
    if (failures.length > 0) {
      setFeedback({
        kind: 'error',
        text: (uploaded > 0 ? `${uploaded} מסמכים הועלו. ` : '') + failures.join(' | '),
      });
    } else {
      setFeedback({
        kind: 'success',
        text: uploaded === 1 ? 'המסמך הועלה בהצלחה' : `${uploaded} מסמכים הועלו בהצלחה`,
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`למחוק את המסמך "${name}"? פעולה זו אינה הפיכה.`)) return;
    setBusyId(id);
    setFeedback(null);
    try {
      await deleteDocument(id);
      setFeedback({ kind: 'success', text: 'המסמך נמחק' });
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'מחיקת המסמך נכשלה' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4" data-testid="documents-panel">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-medium text-clinical-900">מסמכי המטופל</h3>
            <p className="text-sm text-clinical-500">
              קבצי PDF, PNG, JPG, DOCX, DOC ו-TXT עד {formatFileSize(MAX_DOCUMENT_BYTES)} לקובץ. המסמכים מוצפנים בשרת.
            </p>
          </div>
          <div>
            <input
              ref={inputRef}
              id="document-file-input"
              data-testid="document-file-input"
              type="file"
              multiple
              accept={DOCUMENT_ACCEPT_ATTR}
              className="sr-only"
              aria-label="בחירת קבצים להעלאה"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            <Button
              variant="primary"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? 'מעלה...' : 'העלה מסמכים'}
            </Button>
          </div>
        </div>
      </Card>

      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          data-testid="documents-feedback"
          className={`p-3 rounded-lg text-sm border ${
            feedback.kind === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-clinical-400">טוען מסמכים...</p>
      ) : documents.length === 0 ? (
        <Card className="text-center py-10" data-testid="documents-empty">
          <h3 className="text-lg font-medium text-clinical-900 mb-1">אין מסמכים עדיין</h3>
          <p className="text-clinical-500">העלו טפסי קליטה, הסכמות ומסמכים נוספים</p>
        </Card>
      ) : (
        <ul className="space-y-2" data-testid="documents-list">
          {documents.map((doc) => {
            const base = `/api/patients/${patientId}/documents/${doc.id}`;
            const viewable = DOCUMENT_TYPES[getExtension(doc.name)]?.inlineViewable;
            return (
              <li key={doc.id}>
                <Card data-testid="document-row">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-clinical-900 truncate" data-testid="document-name">{doc.name}</p>
                      <p className="text-xs text-clinical-500">
                        {formatFileSize(doc.size)} · {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(doc.createdAt))}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {viewable && (
                        <a
                          href={`${base}?inline=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-sage-200 text-sage-700 hover:bg-sage-50"
                        >
                          צפייה
                        </a>
                      )}
                      <a
                        href={base}
                        download
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-sage-200 text-sage-700 hover:bg-sage-50"
                      >
                        הורדה
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === doc.id}
                        onClick={() => handleDelete(doc.id, doc.name)}
                      >
                        מחיקה
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
