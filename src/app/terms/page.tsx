import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'תנאי שימוש | TherapyDocs' };

export default function TermsPage() {
  return (
    <PlaceholderPage
      title="תנאי שימוש"
      message="תנאי השימוש נמצאים בהכנה ויפורסמו כאן בקרוב."
      backHref="/signup"
      backLabel="חזרה להרשמה"
    />
  );
}
