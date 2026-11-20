'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PatientDocument } from '@/types';
import { apiClient } from '@/lib/api/client';
import { checkDocumentMeta, DOCUMENT_TOO_LARGE_MESSAGE } from '@/lib/documents/validate';

const GENERIC_UPLOAD_ERROR = 'העלאת המסמך נכשלה. נסו שוב.';

export function usePatientDocuments(patientId: string) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const response = await apiClient.get<PatientDocument[]>(`/patients/${patientId}/documents`);
    if (response.error) {
      setError('טעינת המסמכים נכשלה');
    } else {
      setError(null);
      setDocuments(response.data ?? []);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /** Uploads one file (multipart, so 4 MB stays under the 4.5 MB request cap). */
  const uploadDocument = async (file: File): Promise<void> => {
    // Same rules as the server, checked first so nothing big is sent in vain.
    const check = checkDocumentMeta(file);
    if (!check.ok) throw new Error(check.message);

    const form = new FormData();
    form.append('file', file);

    let response: Response;
    try {
      response = await fetch(`/api/patients/${patientId}/documents`, { method: 'POST', body: form });
    } catch {
      throw new Error('שגיאת רשת בהעלאת המסמך. בדקו את החיבור ונסו שוב.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({} as { error?: string }));
      const message = typeof body.error === 'string' ? body.error : '';
      if (response.status === 413) throw new Error(DOCUMENT_TOO_LARGE_MESSAGE);
      throw new Error(/[\u0590-\u05FF]/.test(message) ? message : GENERIC_UPLOAD_ERROR);
    }
    await fetchDocuments();
  };

  const deleteDocument = async (docId: string): Promise<void> => {
    const response = await apiClient.delete(`/patients/${patientId}/documents/${docId}`);
    if (response.error) throw new Error('מחיקת המסמך נכשלה. נסו שוב.');
    await fetchDocuments();
  };

  return { documents, loading, error, uploadDocument, deleteDocument, refetch: fetchDocuments };
}
