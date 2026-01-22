/**
 * Patient Insights Module
 *
 * AI-powered cross-session patient insight generation.
 * Analyzes therapy session history to identify patterns, trends, risks, and gaps.
 *
 * @example
 * ```typescript
 * import { generatePatientInsights } from '@/lib/ai/patient-insights';
 *
 * const insights = await generatePatientInsights('patient-1');
 * console.log('Patterns:', insights.patterns);
 * console.log('Progress:', insights.progressTrends);
 * console.log('Risks:', insights.riskIndicators);
 * console.log('Gaps:', insights.treatmentGaps);
 * ```
 */

// Patient insight generation
export { generatePatientInsights } from './generator';

// Session aggregation utilities
export { aggregatePatientSessions, formatSessionsForInsights } from './aggregator';
export type { AggregatedSessions } from './aggregator';

// Re-export types for convenience
export type { PatientInsights, InsightItem } from '@/types';
