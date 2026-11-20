import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'מדיניות פרטיות | TherapyDocs' };

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      title="מדיניות פרטיות"
      message="מדיניות הפרטיות נמצאת בהכנה ותפורסם כאן בקרוב."
      backHref="/signup"
      backLabel="חזרה להרשמה"
    />
  );
}
