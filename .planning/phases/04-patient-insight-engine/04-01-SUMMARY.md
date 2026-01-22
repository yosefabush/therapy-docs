---
phase: 04-patient-insight-engine
plan: 01
subsystem: patient-insights
tags: [types, aggregation, session-data, ai-preprocessing]

dependency_graph:
  requires: [03-session-summary-ui]
  provides: [PatientInsights-type, session-aggregator]
  affects: [04-02-insight-generator, 04-03-insights-ui]

tech_stack:
  added: []
  patterns: [session-aggregation, chronological-sorting, ai-text-formatting]

key_files:
  created:
    - src/lib/ai/patient-insights/aggregator.ts
  modified:
    - src/types/index.ts

decisions:
  - id: insight-4-categories
    choice: "PatientInsights has patterns, progressTrends, riskIndicators, treatmentGaps arrays"
    rationale: "Matches INSI-03 through INSI-06 requirements from roadmap"
  - id: insight-item-confidence
    choice: "InsightItem includes confidence score (0-1) and session references"
    rationale: "Allows therapist to verify AI insights against source sessions"
  - id: chronological-sorting
    choice: "Sessions sorted oldest-first for AI analysis"
    rationale: "AI can better detect trends/progression when data is chronological"
  - id: comprehensive-formatting
    choice: "formatSessionsForInsights includes ALL SessionNotes fields"
    rationale: "AI needs complete context for cross-session pattern detection"

metrics:
  duration: ~4 minutes
  completed: 2026-01-22
---

# Phase 04 Plan 01: PatientInsights Type and Session Aggregator Summary

**One-liner:** PatientInsights type with 4-category structure and session aggregator that loads/formats completed sessions for AI analysis

## What Was Built

### PatientInsights Interface (`src/types/index.ts`)

New types for cross-session patient insights:

```typescript
export interface PatientInsights {
  id: string;
  patientId: string;

  // Four insight categories (INSI-03 through INSI-06)
  patterns: InsightItem[];        // Recurring themes, behaviors
  progressTrends: InsightItem[];  // Improvement/decline over time
  riskIndicators: InsightItem[];  // Risk factors across sessions
  treatmentGaps: InsightItem[];   // Mentioned but unaddressed concerns

  // Generation metadata
  generatedAt: Date;
  mode: 'mock' | 'real';
  model?: string;
  tokensUsed?: number;

  // Persistence metadata
  savedAt?: Date;
  savedBy?: string;
}

export interface InsightItem {
  content: string;           // The insight text
  confidence: number;        // 0-1 confidence score
  sessionRefs?: string[];    // Session IDs that support this insight
  firstSeen?: Date;
  lastSeen?: Date;
}
```

### Session Aggregator (`src/lib/ai/patient-insights/aggregator.ts`)

New module for fetching and formatting patient session data:

**Exports:**

1. `aggregatePatientSessions(patientId: string): Promise<AggregatedSessions>`
   - Fetches all sessions for patient via sessionRepository.findByPatient()
   - Filters for `status === 'completed'` only
   - Sorts chronologically (oldest first)
   - Returns session count and date range

2. `formatSessionsForInsights(sessions: Session[]): string`
   - Formats sessions into AI-consumable text block
   - Includes all SOAP fields (subjective, objective, assessment, plan)
   - Includes risk assessment with readable labels
   - Includes medications with dosage and side effects
   - Includes progress toward goals, homework, next session plan
   - Clear section separators between sessions

## Commits

| Hash | Message |
|------|---------|
| 9585cce | feat(04-01): add PatientInsights and InsightItem types |
| bbf7b30 | feat(04-01): create session aggregator for patient insights |

## Verification Results

- [x] `npx tsc --noEmit` passes with no errors
- [x] PatientInsights interface exported from @/types
- [x] aggregator module exports aggregatePatientSessions and formatSessionsForInsights
- [x] `npm run build` completes successfully

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate type definitions**
- **Found during:** Task 1
- **Issue:** PatientInsights and InsightItem were defined twice in types/index.ts
- **Fix:** Removed duplicate definitions (lines 285-312)
- **Files modified:** src/types/index.ts
- **Commit:** 9585cce

## Integration Points

The aggregator is ready to be used by the insight generator (04-02):

```typescript
import { aggregatePatientSessions, formatSessionsForInsights } from '@/lib/ai/patient-insights/aggregator';

// In insight generator:
const { sessions } = await aggregatePatientSessions(patientId);
const formattedText = formatSessionsForInsights(sessions);
// Pass formattedText to AI for insight generation
```

## Next Phase Readiness

**Ready for 04-02: Insight Generator**
- PatientInsights type ready for generator to return
- Session aggregator ready to provide AI input
- Follows same patterns as session summary (mock/real mode, generation metadata)
