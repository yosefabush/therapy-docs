---
phase: 05
plan: 02
subsystem: insights-ui
tags: [insights, patient-selector, ui-component, api-integration]

# Dependency graph
requires: [04-03]
provides: [insights-page-with-selector, patient-insight-card-component]
affects: [05-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [fetch-on-select, state-machine-ui, variant-styling]

# File tracking
key-files:
  created:
    - src/components/insights/PatientInsightCard.tsx
  modified:
    - src/app/insights/page.tsx

# Decisions made
decisions:
  - id: variant-based-styling
    choice: "Use variant prop (pattern/progress/risk/gap) for color schemes"
    rationale: "Single component handles all 4 insight categories with consistent but distinct styling"
  - id: confidence-color-thresholds
    choice: "90%+ green, 70-90% yellow, <70% gray"
    rationale: "Aligns with 3-tier confidence scoring from Phase 4"
  - id: session-ref-truncation
    choice: "Show first 3 session refs with +N indicator for more"
    rationale: "Prevents UI overflow while indicating more data available"
  - id: stats-from-insights
    choice: "Update stats based on selected patient only (not all patients)"
    rationale: "Cleaner focus on one patient at a time, aligns with patient selector UX"

# Metrics
duration: ~4 minutes
completed: 2026-01-23
---

# Phase 5 Plan 2: Insights Page with Patient Selector Summary

Enhanced AI insights page to display PatientInsights from API with patient selection dropdown.

## One-liner

Patient selector dropdown fetches insights from POST /api/patients/[id]/insights and displays 4 category cards via PatientInsightCard component.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create PatientInsightCard component | c566cec | src/components/insights/PatientInsightCard.tsx |
| 2 | Enhance insights page with patient selector | 22877fd | src/app/insights/page.tsx |

## Key Deliverables

### PatientInsightCard Component (158 lines)

Reusable component for displaying insight categories with:

- **Variant styling:** 4 color schemes (blue/green/red/amber) for pattern/progress/risk/gap
- **Confidence display:** Progress bar with color coding (green/yellow/gray)
- **Session references:** Shows first 3 refs as badges with +N indicator
- **Date range:** Shows firstSeen/lastSeen for progress trends
- **Empty state:** Customizable message when no insights

```typescript
interface PatientInsightCardProps {
  title: string;
  icon: React.ReactNode;
  items: InsightItem[];
  emptyMessage?: string;
  variant: 'pattern' | 'progress' | 'risk' | 'gap';
}
```

### Enhanced Insights Page

Refactored page with:

- **Patient selector dropdown:** Choose patient to view insights
- **API integration:** POST /api/patients/[id]/insights on selection
- **State machine:** 4 states (no-patient, loading, error, insights)
- **Stats cards:** Show counts from selected patient's insights
- **Regenerate button:** Trigger fresh insight generation
- **Error handling:** Error message with retry button

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npx tsc --noEmit` passes with no errors
- [x] `npm run build` succeeds
- [x] PatientInsightCard component exists with variant styling (158 lines)
- [x] Insights page has patient selector dropdown
- [x] Selecting patient calls POST /api/patients/[id]/insights
- [x] Insights display in 4 category cards
- [x] Empty state shows when no patient selected
- [x] Loading state shows during fetch
- [x] Error state shows with retry button
- [x] Regenerate button triggers new generation

## Next Phase Readiness

**Phase 5 Plan 3:** Patient detail page integration - can proceed.

The insights page now:
1. Has working patient selector
2. Fetches real insights from API
3. Displays all 4 categories properly
4. Handles all UI states (loading, error, empty)

Ready for plan 05-03 to integrate insights into patient detail page.
