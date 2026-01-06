import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TherapyDocs | מערכת תיעוד קליני',
  description: 'מערכת תיעוד טיפולי מאובטחת ואינטואיטיבית לאנשי מקצוע בתחום הבריאות',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=David+Libre:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body" style={{ fontFamily: '"Heebo", system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
