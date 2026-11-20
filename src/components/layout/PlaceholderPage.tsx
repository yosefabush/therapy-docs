import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}

// Minimal public page for content that is not written yet (no legal text is
// invented here). Used by /terms, /privacy and /forgot-password.
export function PlaceholderPage({
  title,
  message,
  backHref = '/login',
  backLabel = 'חזרה להתחברות',
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-warm-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-600 rounded-2xl mb-4 shadow-glow">
          <Stethoscope className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <div className="rounded-2xl border border-sage-100 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-bold text-clinical-900 mb-3">{title}</h1>
          <p data-testid="placeholder-message" className="text-clinical-600 mb-6">
            {message}
          </p>
          <Link
            href={backHref}
            className="text-sm font-medium text-sage-600 hover:text-sage-700 hover:underline"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
