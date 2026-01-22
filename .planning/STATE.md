# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Each therapist type sees AI-generated insights that speak their professional language
**Current focus:** Phase 4 - Patient Insight Engine

## Current Position

Phase: 4 of 5 (Patient Insight Engine)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-22 - Completed 04-02-PLAN.md

Progress: [███████░░░] 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: ~5 minutes
- Total execution time: ~40.5 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2/2 | ~8 min | ~4 min |
| 02 | 2/2 | ~13 min | ~6.5 min |
| 03 | 2/2 | ~10 min | ~5 min |
| 04 | 2/3 | ~9.5 min | ~4.75 min |

**Recent Trend:**
- Last 5 plans: 02-02, 03-01, 03-02, 04-01, 04-02
- Trend: Consistent fast execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **use-template-variables**: Use {{soapNotes}} and {{transcript}} as standard template placeholders
- **type-safe-registry**: Use Record<TherapistRole, SessionSummaryPrompt> with compile-time exhaustiveness check
- **bilingual-support**: Each prompt instructs AI to match input language (Hebrew/English)
- **preserve-existing-stubs**: Keep existing role-specific stub functions as fallback until Phase 2 AI integration
- **soap-section-formatting**: Use double newlines between SOAP sections for readability
- **mock-mode-default**: Auto-detect mock/real mode based on OPENAI_API_KEY presence
- **gpt-4o-mini-default**: Use gpt-4o-mini as default model for cost efficiency
- **error-as-return-value**: Return SummaryResult with error field instead of throwing exceptions
- **function-overloads-backward-compat**: Use TypeScript function overloads to add AI mode without breaking callers
- **api-validates-notes**: POST /api/sessions/[id]/summary returns 400 if session lacks subjective notes
- **summary-lifecycle-tracking**: AISummary includes generation + approval metadata (savedAt distinguishes unsaved from approved)
- **ui-state-machine**: SummaryPanel uses 5-state machine (empty/generating/preview/saved/error) for clear UX flow
- **insight-4-categories**: PatientInsights has patterns, progressTrends, riskIndicators, treatmentGaps arrays
- **insight-item-confidence**: InsightItem includes confidence score (0-1) and session references
- **chronological-sorting**: Sessions sorted oldest-first for AI trend analysis
- **structured-json-output**: AI returns JSON with 4 arrays for direct mapping to PatientInsights
- **confidence-scoring**: Three tiers (0.9+ clear, 0.7-0.9 moderate, <0.7 tentative)
- **graceful-parsing**: parseInsightResponse handles markdown code fences and missing arrays
- **bilingual-mock-insights**: Mock generator detects Hebrew content and returns Hebrew insights

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed 04-02-PLAN.md (AI insight generator with prompts)
Resume file: None

Phase 4 deliverables so far:
- PatientInsights and InsightItem interfaces in @/types
- aggregatePatientSessions() to fetch completed sessions
- formatSessionsForInsights() to format sessions for AI
- PATIENT_INSIGHT_SYSTEM_PROMPT for 4-category insight analysis
- buildInsightUserPrompt() for AI prompt construction
- generatePatientInsights() with mock/real mode support
- Bilingual mock insights (Hebrew/English)
- Module exports from @/lib/ai/patient-insights

Previous deliverables available:
- POST /api/sessions/[id]/summary - AI summary generation
- GET /api/sessions/[id]/summary - Configuration check
- PATCH /api/sessions/[id]/summary - Save summary endpoint
- SummaryPanel component with full state machine
- generateSessionSummaryAI() from @/lib/ai
- 10 role-specific prompts in src/lib/ai/prompts/session-summary/
