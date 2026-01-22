---
phase: 04-patient-insight-engine
plan: 02
subsystem: patient-insights
tags: [ai-generation, prompts, insight-categories, mock-mode, bilingual]

dependency_graph:
  requires: [04-01-session-aggregator]
  provides: [insight-generator, insight-prompts]
  affects: [04-03-insights-ui]

tech_stack:
  added: []
  patterns: [prompt-engineering, json-response-parsing, mock-mode-detection, graceful-error-handling]

key_files:
  created:
    - src/lib/ai/patient-insights/prompts.ts
    - src/lib/ai/patient-insights/generator.ts
    - src/lib/ai/patient-insights/index.ts
  modified: []

decisions:
  - id: structured-json-output
    choice: "AI returns JSON with 4 arrays (patterns, progressTrends, riskIndicators, treatmentGaps)"
    rationale: "Structured output enables direct mapping to PatientInsights interface"
  - id: confidence-scoring
    choice: "Three confidence tiers: 0.9+ (clear), 0.7-0.9 (moderate), <0.7 (tentative)"
    rationale: "Helps therapists prioritize which insights to act on"
  - id: graceful-parsing
    choice: "parseInsightResponse handles markdown code fences and missing arrays"
    rationale: "AI responses may vary - robust parsing prevents crashes"
  - id: bilingual-mock-insights
    choice: "Mock generator detects Hebrew content and returns Hebrew insights"
    rationale: "Consistent with session summary bilingual support"

metrics:
  duration: ~5.5 minutes
  completed: 2026-01-22
---

# Phase 04 Plan 02: AI Insight Generator Summary

**One-liner:** AI-powered insight generator with structured prompts for 4 categories (patterns, progress, risks, gaps) supporting mock and real modes

## What Was Built

### Patient Insight Prompts (`src/lib/ai/patient-insights/prompts.ts`)

System prompt engineering for cross-session insight analysis:

**PATIENT_INSIGHT_SYSTEM_PROMPT:**
- Establishes AI as clinical analyst reviewing complete therapy history
- Defines 4 insight categories with detailed guidance:
  1. PATTERNS: Recurring themes, behaviors, emotional patterns, coping mechanisms
  2. PROGRESS_TRENDS: Improvement/decline over time in symptoms, functioning, goals
  3. RISK_INDICATORS: Safety concerns, suicidal ideation, self-harm, substance use
  4. TREATMENT_GAPS: Unaddressed concerns, untried interventions
- Specifies structured JSON output format with confidence scores
- Includes bilingual support instructions (match input language)
- Confidence scoring guidelines: 0.9+ clear, 0.7-0.9 moderate, <0.7 tentative

**buildInsightUserPrompt(formattedSessions, sessionCount):**
- Constructs user prompt with session count and formatted session data
- Ready for AI consumption via generateAISummary()

### Insight Generator (`src/lib/ai/patient-insights/generator.ts`)

Main insight generation function with mock/real mode support:

**generatePatientInsights(patientId: string): Promise<PatientInsights>**

Pipeline:
1. Calls `aggregatePatientSessions(patientId)` to get completed sessions
2. Returns empty insights if no sessions
3. Detects mock/real mode via `getAIConfig()`
4. Mock: Returns realistic bilingual mock insights
5. Real: Builds prompts, calls AI, parses JSON response
6. Never throws - always returns valid PatientInsights

**Mock Mode Features:**
- `generateMockInsights()` detects Hebrew content in session notes
- `generateEnglishMockInsights()` / `generateHebrewMockInsights()` return realistic content
- Mock insights reference actual session dates from patient history
- 2-3 insights per category with realistic confidence scores

**Real Mode Features:**
- `generateRealInsights()` calls generateAISummary with structured prompts
- `parseInsightResponse()` extracts JSON from response (handles code fences)
- `mapParsedToInsights()` converts AI response to PatientInsights interface
- `normalizeConfidence()` ensures valid 0-1 range

**Error Handling:**
- AI errors logged and return empty insights with error context
- JSON parse failures return empty insights (never crash)
- Invalid confidence values normalized to 0.5 default

### Module Index (`src/lib/ai/patient-insights/index.ts`)

Clean API surface for the module:

```typescript
// Primary export
import { generatePatientInsights } from '@/lib/ai/patient-insights';

// Additional utilities
import { aggregatePatientSessions, formatSessionsForInsights } from '@/lib/ai/patient-insights';
import type { PatientInsights, InsightItem, AggregatedSessions } from '@/lib/ai/patient-insights';
```

## Commits

| Hash | Message |
|------|---------|
| 262184a | feat(04-02): add patient insight prompts for AI analysis |
| 5adf037 | feat(04-02): create AI-powered patient insight generator |
| 537a41d | feat(04-02): create patient insights module index |

## Verification Results

- [x] `npx tsc --noEmit` passes with no errors
- [x] `npm run build` completes successfully
- [x] Module exports generatePatientInsights, aggregatePatientSessions
- [x] System prompt covers all 4 insight categories
- [x] Generator integrates with existing AI module (generateAISummary)
- [x] Mock mode provides bilingual development insights

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Date type assignment in mock generators**
- **Found during:** Task 2 verification
- **Issue:** Mock generators assigned ISO date strings to `firstSeen`/`lastSeen` fields which expect `Date | undefined`
- **Fix:** Changed to pass Date objects directly from dateRange
- **Files modified:** src/lib/ai/patient-insights/generator.ts
- **Commit:** 5adf037

## Integration Points

The generator is ready to be called from UI components (04-03):

```typescript
import { generatePatientInsights } from '@/lib/ai/patient-insights';

// In insights page/component:
const insights = await generatePatientInsights(patientId);

// Access insight categories
insights.patterns.forEach(p => {
  console.log(`[${p.confidence.toFixed(2)}] ${p.content}`);
});
```

## Next Phase Readiness

**Ready for 04-03: Insights UI**
- Generator returns complete PatientInsights structure
- Mock mode works for development without API key
- Bilingual support matches session content language
- All 4 insight categories populated with realistic content
