---
phase: 05-patient-insight-integration
plan: 03
subsystem: persistence
tags: [persistence, repository, api-endpoints, insights, json-storage]

# Dependency graph
requires:
  - phase: 05-01
    provides: InsightPanel component with state machine UI
  - phase: 05-02
    provides: Insights page with patient selector, PatientInsightCard component
  - phase: 04-patient-insight-engine
    provides: PatientInsights type, POST insight generation endpoint
provides:
  - Patient insights persistence layer (repository, GET/PATCH endpoints)
  - InsightPanel save functionality with savedAt tracking
  - Patient profile loads existing insights on mount
  - Insights page shows saved insights first before generating new
  - Complete INSI-01 and INSI-08 flows
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JSON repository pattern for insights (matching existing repos)
    - GET-then-POST pattern for loading vs generating
    - savedAt timestamp for persistence tracking

key-files:
  created:
    - src/lib/data/repositories/patient-insights.repository.ts
  modified:
    - src/lib/data/repositories/index.ts
    - src/app/api/patients/[id]/insights/route.ts
    - src/components/patients/InsightPanel.tsx
    - src/app/patients/[id]/page.tsx
    - src/app/insights/page.tsx

key-decisions:
  - "json-repository-pattern: Follow existing JsonRepository pattern for insights storage"
  - "get-then-post-pattern: Insights page checks GET first, falls back to POST for generation"
  - "savedAt-tracking: Use savedAt field to distinguish saved vs freshly generated insights"
  - "saving-state: Add 'saving' state to InsightPanel for save operation feedback"

patterns-established:
  - "Insight persistence flow: Generate on patient profile -> Save -> View on insights page"
  - "Repository CRUD pattern: findByPatientId, saveForPatient, deleteByPatientId methods"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 05 Plan 03: Insight Persistence Summary

**Complete persistence layer for patient insights with repository, GET/PATCH endpoints, and UI integration enabling insights to persist across sessions and pages**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-01-23T13:32:44Z
- **Completed:** 2026-01-23T13:40:36Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- Patient insights persist across page reloads in JSON storage
- Therapists can save generated insights from patient profile
- Insights page shows saved insights immediately when patient selected
- Regenerate feature allows creating updated analysis anytime
- Complete INSI-01 flow: generate on profile -> save -> view on insights page
- Complete INSI-08 flow: insights persist and can be regenerated

## Task Commits

Each task was committed atomically:

1. **Task 1: Add insights repository** - `25529bb` (feat)
2. **Task 2: Add GET and PATCH endpoints** - `cd44a9f` (feat)
3. **Task 3: Update InsightPanel for persistence and patient page integration** - `f4c9ba6` (feat)
4. **Task 4: Update insights page to show saved insights** - `2809b2d` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/lib/data/repositories/patient-insights.repository.ts` - New repository with findByPatientId, saveForPatient, deleteByPatientId
- `src/lib/data/repositories/index.ts` - Added patientInsightsRepository export
- `src/app/api/patients/[id]/insights/route.ts` - Added GET (fetch saved) and PATCH (save insights) endpoints
- `src/components/patients/InsightPanel.tsx` - Added handleSave with PATCH call, 'saving' state, saveError display, savedAt in metadata
- `src/app/patients/[id]/page.tsx` - Fetch existing insights on mount via GET, pass to InsightPanel
- `src/app/insights/page.tsx` - Check GET first for saved insights, fallback to POST, show "Saved" badge

## Decisions Made
- **json-repository-pattern**: Follow existing JsonRepository pattern from base.repository.ts for consistency with other repositories
- **get-then-post-pattern**: Insights page checks GET endpoint first for saved insights, only calls POST (generate) if none found
- **savedAt-tracking**: Use savedAt field to distinguish saved vs freshly generated insights, display "Saved X ago" vs "Not saved"
- **saving-state**: Add 'saving' state to InsightPanel state machine for visual feedback during save operation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (Patient Insight Integration) is now complete
- All INSI user stories satisfied:
  - INSI-01: Navigate to AI Insights page, select patient, view analysis
  - INSI-03-06: Four insight categories (patterns, progress, risks, gaps)
  - INSI-07: Confidence scores displayed
  - INSI-08: Insights persist and can be regenerated
- Ready for production use or Phase 6 if planned

---
*Phase: 05-patient-insight-integration*
*Completed: 2026-01-23*
