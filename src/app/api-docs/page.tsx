'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  useEffect(() => {
    // Override RTL on document level for this page
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';

    return () => {
      // Restore RTL when leaving the page
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'he';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      <div className="bg-sage-600 text-white py-4 px-8">
        <h1 className="text-2xl font-semibold">TherapyDocs API Documentation</h1>
        <p className="text-sage-100 text-sm mt-1">
          HIPAA-compliant clinical documentation system API
        </p>
      </div>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}
