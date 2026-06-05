import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center bg-clinical-50 px-4 text-center"
    >
      <div className="max-w-md">
        <p className="text-5xl font-bold text-sage-600 mb-2">404</p>
        <h1 className="text-2xl font-semibold text-clinical-900 mb-3">
          הדף לא נמצא
        </h1>
        <p className="text-clinical-600 mb-6">
          ייתכן שהקישור שגוי או שהדף הוסר.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-sage-600 px-5 py-2.5 text-white font-medium hover:bg-sage-700 transition-colors"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
