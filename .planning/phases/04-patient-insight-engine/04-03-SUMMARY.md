---
phase: 04-patient-insight-engine
plan: 03
subsystem: api
tags: [rest-api, patient-insights, endpoint, validation]

dependency_graph:
  requires: [04-02-insight-generator]
  provides: [patient-insights-api]
  affects: [05-insights-ui]

tech_stack:
  added: []
  patterns: [rest-api, data-envelope-response, patient-validation]

key_files:
  created:
    - src/app/api/patients/[id]/insights/route.ts
  modified: []

decisions:
  - id: post-only-endpoint
    choice: "POST-only endpoint - no GET for now"
    rationale: "Insights generated on-demand, persistence deferred to Phase 5"
  - id: data-envelope-response
    choice: "Response format: { data: PatientInsights } or { error: string }"
    rationale: "Consistent with established API patterns in codebase"

metrics:
  duration: ~3 minutes
  completed: 2026-01-22
---

# Phase 04 Plan 03: Patient Insights API Route Summary

**One-liner:** REST API endpoint exposing patient insight generation at POST /api/patients/[id]/insights

## What Was Built

### Patient Insights API Route (`src/app/api/patients/[id]/insights/route.ts`)

POST endpoint for generating AI-powered patient insights:

**POST /api/patients/[id]/insights**

Pipeline:
1. Extract patient ID from URL params
2. Validate patient exists via `patientRepository.findById()`
3. Call `generatePatientInsights(patientId)` from patient-insights module
4. Return `{ data: PatientInsights }` response

**Response Structure:**
```json
{
  "data": {
    "id": "insights-patient-1-...",
    "patientId": "patient-1",
    "patterns": [...],
    "progressTrends": [...],
    "riskIndicators": [...],
    "treatmentGaps": [...],
    "generatedAt": "2026-01-22T...",
    "mode": "mock",
    "model": "mock-v1"
  }
}
```

**Error Responses:**
- 404: `{ "error": "Patient not found" }` - Invalid patient ID
- 500: `{ "error": "Failed to generate insights" }` - Generation failure

**Design Choices:**
- POST method: Insight generation is a compute operation, not retrieval
- No GET endpoint: Insights are generated fresh on demand (persistence in Phase 5)
- Follows session summary API pattern for consistency

## Commits

| Hash | Message |
|------|---------|
| 925d50b | feat(04-03): add patient insights API route |

## Verification Results

- [x] `npx tsc --noEmit` passes with no errors
- [x] `npm run build` completes successfully
- [x] POST /api/patients/patient-1/insights returns 200 with PatientInsights
- [x] POST /api/patients/nonexistent/insights returns 404
- [x] Response has all required fields: id, patientId, patterns, progressTrends, riskIndicators, treatmentGaps, generatedAt, mode
- [x] Patient-1 returns populated insight arrays (has 3 completed sessions)
- [x] Patient-4 returns empty arrays gracefully (no completed sessions)

## End-to-End Pipeline Verification

Tested complete Phase 4 pipeline:

```
API Request (POST /api/patients/patient-1/insights)
    ↓
Route handler validates patient exists
    ↓
generatePatientInsights(patientId)
    ↓
aggregatePatientSessions() fetches completed sessions
    ↓
formatSessionsForInsights() prepares AI input
    ↓
Mock mode: generateMockInsights() returns bilingual insights
    ↓
Response: PatientInsights JSON with 4 categories
```

**Test Results:**
- patient-1: 2 patterns, 2 progress trends, 1 risk indicator, 2 treatment gaps
- patient-2: Similar populated response
- patient-4: Empty arrays (no completed sessions) - handled gracefully
- nonexistent: 404 error response

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

The API is ready to be called from UI components (Phase 5):

```typescript
// In insights page/component:
const response = await fetch(`/api/patients/${patientId}/insights`, {
  method: 'POST',
});
const { data: insights } = await response.json();

// Display insight categories
insights.patterns.forEach(p => {
  console.log(`[${(p.confidence * 100).toFixed(0)}%] ${p.content}`);
});
```

## Phase 4 Completion

**Phase 4: Patient Insight Engine is now complete.**

All 3 plans delivered:
1. 04-01: Session aggregator (aggregatePatientSessions, formatSessionsForInsights)
2. 04-02: AI insight generator (generatePatientInsights with prompts and mock/real modes)
3. 04-03: API route (POST /api/patients/[id]/insights)

**Ready for Phase 5: Insights UI**
- API endpoint functional and tested
- Returns complete PatientInsights with 4 categories
- Mock mode works for development
- Bilingual support (Hebrew/English)
