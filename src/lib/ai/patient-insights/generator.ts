/**
 * Patient Insight Generator
 *
 * AI-powered generation of cross-session patient insights.
 * Supports both mock mode (development) and real mode (OpenAI API).
 */

import { PatientInsights, InsightItem } from '@/types';
import { getAIConfig, generateAISummary } from '@/lib/ai';
import { aggregatePatientSessions, formatSessionsForInsights, AggregatedSessions } from './aggregator';
import { PATIENT_INSIGHT_SYSTEM_PROMPT, buildInsightUserPrompt } from './prompts';

/**
 * Parsed response from AI insight generation
 */
interface ParsedInsights {
  patterns: Array<{
    content: string;
    confidence: number;
    sessionRefs?: string[];
  }>;
  progressTrends: Array<{
    content: string;
    confidence: number;
    firstSeen?: string;
    lastSeen?: string;
  }>;
  riskIndicators: Array<{
    content: string;
    confidence: number;
    sessionRefs?: string[];
  }>;
  treatmentGaps: Array<{
    content: string;
    confidence: number;
  }>;
}

/**
 * Generates AI-powered insights for a patient based on their session history
 *
 * Process:
 * 1. Aggregates all completed sessions for the patient
 * 2. Formats sessions for AI consumption
 * 3. Sends to AI with insight-specific prompts
 * 4. Parses structured JSON response into PatientInsights
 *
 * @param patientId - The patient ID to generate insights for
 * @returns Promise<PatientInsights> - Always returns a valid structure (never throws)
 *
 * @example
 * const insights = await generatePatientInsights('patient-1');
 * if (insights.patterns.length > 0) {
 *   console.log('Found patterns:', insights.patterns);
 * }
 */
export async function generatePatientInsights(patientId: string): Promise<PatientInsights> {
  const config = getAIConfig();
  const generatedAt = new Date();

  // Aggregate patient sessions
  const aggregated = await aggregatePatientSessions(patientId);

  // If no completed sessions, return empty insights
  if (aggregated.sessionCount === 0) {
    return createEmptyInsights(patientId, generatedAt, config.mode);
  }

  // Mock mode: return realistic mock insights
  if (config.mode === 'mock') {
    return generateMockInsights(patientId, aggregated, generatedAt);
  }

  // Real mode: generate via AI
  return generateRealInsights(patientId, aggregated, generatedAt, config.model);
}

/**
 * Creates an empty PatientInsights structure
 */
function createEmptyInsights(
  patientId: string,
  generatedAt: Date,
  mode: 'mock' | 'real'
): PatientInsights {
  return {
    id: `insights-${patientId}-${Date.now()}`,
    patientId,
    patterns: [],
    progressTrends: [],
    riskIndicators: [],
    treatmentGaps: [],
    generatedAt,
    mode,
  };
}

/**
 * Generates mock insights for development/testing
 * Returns realistic sample data based on session count and date range
 */
function generateMockInsights(
  patientId: string,
  aggregated: AggregatedSessions,
  generatedAt: Date
): PatientInsights {
  const { sessions, sessionCount, dateRange } = aggregated;

  // Detect Hebrew content in sessions for bilingual support
  const hasHebrewContent = sessions.some(s =>
    /[\u0590-\u05FF]/.test(s.notes.subjective || '')
  );

  // Generate session date refs from actual sessions
  const sessionDates = sessions.map(s =>
    new Date(s.scheduledAt).toISOString().split('T')[0]
  );

  if (hasHebrewContent) {
    return generateHebrewMockInsights(patientId, sessionDates, dateRange, generatedAt);
  }

  return generateEnglishMockInsights(patientId, sessionDates, dateRange, generatedAt);
}

/**
 * Generates English mock insights
 */
function generateEnglishMockInsights(
  patientId: string,
  sessionDates: string[],
  dateRange: { earliest: Date; latest: Date } | null,
  generatedAt: Date
): PatientInsights {
  const patterns: InsightItem[] = [
    {
      content: 'Patient consistently reports increased anxiety when discussing work-related topics, suggesting occupational stress as a primary trigger.',
      confidence: 0.88,
      sessionRefs: sessionDates.slice(0, Math.min(3, sessionDates.length)),
    },
    {
      content: 'Recurring pattern of negative self-talk when discussing interpersonal relationships, particularly around themes of inadequacy and fear of rejection.',
      confidence: 0.82,
      sessionRefs: sessionDates.slice(1, Math.min(4, sessionDates.length)),
    },
  ];

  const progressTrends: InsightItem[] = [
    {
      content: 'Patient demonstrates improved ability to identify and articulate emotional states over the course of treatment.',
      confidence: 0.91,
      firstSeen: dateRange?.earliest,
      lastSeen: dateRange?.latest,
    },
    {
      content: 'Gradual decrease in reported sleep disturbances, from nightly disruption to 1-2 times per week.',
      confidence: 0.85,
      firstSeen: dateRange?.earliest,
      lastSeen: dateRange?.latest,
    },
  ];

  const riskIndicators: InsightItem[] = [
    {
      content: 'No active suicidal ideation reported. Passive ideation mentioned in early sessions has not recurred in recent visits.',
      confidence: 0.95,
      sessionRefs: sessionDates.slice(0, 1),
    },
  ];

  const treatmentGaps: InsightItem[] = [
    {
      content: 'Patient mentioned family conflict in early sessions that has not been explored in depth. Consider family systems approach.',
      confidence: 0.72,
    },
    {
      content: 'Sleep hygiene interventions were discussed but specific behavioral strategies have not been formally introduced.',
      confidence: 0.78,
    },
  ];

  return {
    id: `insights-${patientId}-${Date.now()}`,
    patientId,
    patterns,
    progressTrends,
    riskIndicators,
    treatmentGaps,
    generatedAt,
    mode: 'mock',
    model: 'mock-v1',
  };
}

/**
 * Generates Hebrew mock insights
 */
function generateHebrewMockInsights(
  patientId: string,
  sessionDates: string[],
  dateRange: { earliest: Date; latest: Date } | null,
  generatedAt: Date
): PatientInsights {
  const patterns: InsightItem[] = [
    {
      content: 'המטופל/ת מדווח/ת באופן עקבי על חרדה מוגברת בעת דיון בנושאים הקשורים לעבודה, מה שמצביע על לחץ תעסוקתי כטריגר עיקרי.',
      confidence: 0.88,
      sessionRefs: sessionDates.slice(0, Math.min(3, sessionDates.length)),
    },
    {
      content: 'דפוס חוזר של שיח עצמי שלילי בעת דיון ביחסים בינאישיים, במיוחד סביב נושאי אי-התאמה ופחד מדחייה.',
      confidence: 0.82,
      sessionRefs: sessionDates.slice(1, Math.min(4, sessionDates.length)),
    },
  ];

  const progressTrends: InsightItem[] = [
    {
      content: 'המטופל/ת מפגין/ה יכולת משופרת לזהות ולבטא מצבים רגשיים לאורך מהלך הטיפול.',
      confidence: 0.91,
      firstSeen: dateRange?.earliest,
      lastSeen: dateRange?.latest,
    },
    {
      content: 'ירידה הדרגתית בהפרעות שינה מדווחות, מהפרעה לילית למספר פעמים בשבוע.',
      confidence: 0.85,
      firstSeen: dateRange?.earliest,
      lastSeen: dateRange?.latest,
    },
  ];

  const riskIndicators: InsightItem[] = [
    {
      content: 'לא דווחה אידאציה אובדנית פעילה. אידאציה פסיבית שהוזכרה במפגשים מוקדמים לא חזרה בביקורים האחרונים.',
      confidence: 0.95,
      sessionRefs: sessionDates.slice(0, 1),
    },
  ];

  const treatmentGaps: InsightItem[] = [
    {
      content: 'המטופל/ת הזכיר/ה קונפליקט משפחתי במפגשים מוקדמים שלא נחקר לעומק. יש לשקול גישה מערכתית משפחתית.',
      confidence: 0.72,
    },
    {
      content: 'התערבויות היגיינת שינה נדונו אך אסטרטגיות התנהגותיות ספציפיות לא הוצגו באופן פורמלי.',
      confidence: 0.78,
    },
  ];

  return {
    id: `insights-${patientId}-${Date.now()}`,
    patientId,
    patterns,
    progressTrends,
    riskIndicators,
    treatmentGaps,
    generatedAt,
    mode: 'mock',
    model: 'mock-v1',
  };
}

/**
 * Generates insights using real AI API
 */
async function generateRealInsights(
  patientId: string,
  aggregated: AggregatedSessions,
  generatedAt: Date,
  model?: string
): Promise<PatientInsights> {
  const { sessions, sessionCount } = aggregated;

  // Format sessions for AI
  const formattedSessions = formatSessionsForInsights(sessions);

  // Build prompts
  const systemPrompt = PATIENT_INSIGHT_SYSTEM_PROMPT;
  const userPrompt = buildInsightUserPrompt(formattedSessions, sessionCount);

  // Call AI
  const result = await generateAISummary(systemPrompt, userPrompt);

  // Handle AI errors
  if (result.error) {
    console.error('AI insight generation failed:', result.error);
    return {
      ...createEmptyInsights(patientId, generatedAt, 'real'),
      model: result.model,
    };
  }

  // Parse JSON response
  const parsed = parseInsightResponse(result.summary);

  if (!parsed) {
    console.error('Failed to parse AI insight response:', result.summary.slice(0, 200));
    return {
      ...createEmptyInsights(patientId, generatedAt, 'real'),
      model: result.model,
    };
  }

  // Map parsed response to PatientInsights
  return mapParsedToInsights(patientId, parsed, generatedAt, result.model, result.tokensUsed);
}

/**
 * Parses JSON response from AI, handling potential markdown code fences
 */
function parseInsightResponse(responseText: string): ParsedInsights | null {
  try {
    // Try to extract JSON from the response (may be wrapped in code fences)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate expected structure
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Ensure all arrays exist (default to empty if missing)
    return {
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      progressTrends: Array.isArray(parsed.progressTrends) ? parsed.progressTrends : [],
      riskIndicators: Array.isArray(parsed.riskIndicators) ? parsed.riskIndicators : [],
      treatmentGaps: Array.isArray(parsed.treatmentGaps) ? parsed.treatmentGaps : [],
    };
  } catch {
    return null;
  }
}

/**
 * Maps parsed AI response to PatientInsights structure
 */
function mapParsedToInsights(
  patientId: string,
  parsed: ParsedInsights,
  generatedAt: Date,
  model?: string,
  tokensUsed?: number
): PatientInsights {
  // Map patterns
  const patterns: InsightItem[] = parsed.patterns.map(p => ({
    content: p.content,
    confidence: normalizeConfidence(p.confidence),
    sessionRefs: p.sessionRefs,
  }));

  // Map progress trends with date parsing
  const progressTrends: InsightItem[] = parsed.progressTrends.map(p => ({
    content: p.content,
    confidence: normalizeConfidence(p.confidence),
    firstSeen: p.firstSeen ? new Date(p.firstSeen) : undefined,
    lastSeen: p.lastSeen ? new Date(p.lastSeen) : undefined,
  }));

  // Map risk indicators
  const riskIndicators: InsightItem[] = parsed.riskIndicators.map(r => ({
    content: r.content,
    confidence: normalizeConfidence(r.confidence),
    sessionRefs: r.sessionRefs,
  }));

  // Map treatment gaps
  const treatmentGaps: InsightItem[] = parsed.treatmentGaps.map(t => ({
    content: t.content,
    confidence: normalizeConfidence(t.confidence),
  }));

  return {
    id: `insights-${patientId}-${Date.now()}`,
    patientId,
    patterns,
    progressTrends,
    riskIndicators,
    treatmentGaps,
    generatedAt,
    mode: 'real',
    model,
    tokensUsed,
  };
}

/**
 * Ensures confidence is a valid number between 0 and 1
 */
function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0.5; // Default confidence for invalid values
  }
  return Math.max(0, Math.min(1, value));
}
