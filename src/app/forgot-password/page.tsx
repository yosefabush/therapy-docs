import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'שחזור סיסמה | TherapyDocs' };

export default function ForgotPasswordPage() {
  return (
    <PlaceholderPage
      title="שחזור סיסמה"
      message="שחזור סיסמה עצמאי יהיה זמין בקרוב. עד אז, לאיפוס הסיסמה יש לפנות למנהל המערכת."
    />
  );
}
