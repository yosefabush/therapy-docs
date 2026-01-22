# Roadmap: TherapyDocs AI Insights

## Overview

This roadmap delivers AI-powered insight generation for TherapyDocs in two main features: role-specific session summaries (tailored to 10 therapist types) and cross-session patient insights (patterns, progress, risks, gaps). The journey starts with prompt infrastructure, builds session summary capability, exposes it via UI, then creates the patient insight engine and integrates it into the application.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Role-Specific Prompts** - Create 10 therapist-role prompts for session summaries
- [ ] **Phase 2: Session Summary Generation** - Build AI engine to generate summaries from notes/transcripts
- [ ] **Phase 3: Session Summary UI** - Add generate/review/save/regenerate workflow on session page
- [ ] **Phase 4: Patient Insight Engine** - Build cross-session analysis for patterns, progress, risks, gaps
- [ ] **Phase 5: Patient Insight Integration** - Add trigger button and display on insights page

## Phase Details

### Phase 1: Role-Specific Prompts
**Goal**: 10 therapist-role prompts exist, each tailored to generate summaries that speak the professional language of that role
**Depends on**: Nothing (first phase)
**Requirements**: SUMM-04
**Success Criteria** (what must be TRUE):
  1. Each of 10 therapist roles has a distinct prompt file in the codebase
  2. Prompts emphasize role-specific focus areas (psychiatrist: medication/symptoms; OT: functional progress; etc.)
  3. Prompts accept SOAP notes and transcript as input variables
  4. Role dispatch mechanism selects correct prompt based on therapist's role
**Plans**: TBD

Plans:
- [ ] 01-01: TBD (prompt authoring)
- [ ] 01-02: TBD (role dispatch integration)

### Phase 2: Session Summary Generation
**Goal**: AI can generate role-specific session summaries using notes and transcripts as input
**Depends on**: Phase 1
**Requirements**: SUMM-01, SUMM-03
**Success Criteria** (what must be TRUE):
  1. Calling generateSessionSummary() with a session and role returns an AI-generated summary
  2. Summary incorporates SOAP notes content when available
  3. Summary incorporates transcript content when available
  4. Summary output reflects the role-specific prompt (different roles produce noticeably different summaries)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD (summary engine)
- [ ] 02-02: TBD (API route)

### Phase 3: Session Summary UI
**Goal**: Therapists can generate, review, save, and regenerate AI summaries directly on the session page
**Depends on**: Phase 2
**Requirements**: SUMM-02, SUMM-05, SUMM-06, SUMM-07
**Success Criteria** (what must be TRUE):
  1. Session page shows a "Generate Summary" button when no summary exists
  2. Generated summary appears above SOAP notes for review before saving
  3. Therapist can approve/save the summary to the session record
  4. Saved summary persists across page reloads
  5. Therapist can regenerate summary to get a fresh version
**Plans**: TBD

Plans:
- [ ] 03-01: TBD (UI component)
- [ ] 03-02: TBD (persistence)
- [ ] 03-03: TBD (regenerate flow)

### Phase 4: Patient Insight Engine
**Goal**: AI can analyze all sessions for a patient and surface patterns, progress trends, risk indicators, and treatment gaps
**Depends on**: Nothing (parallel to Phase 2-3, but logically after prompt infrastructure)
**Requirements**: INSI-02, INSI-03, INSI-04, INSI-05, INSI-06
**Success Criteria** (what must be TRUE):
  1. Insight engine can fetch and aggregate all sessions for a patient
  2. Engine identifies recurring themes and behaviors (patterns)
  3. Engine tracks improvement or decline over time (progress trends)
  4. Engine detects risk indicators mentioned across sessions
  5. Engine identifies treatment gaps (mentioned but unaddressed concerns)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD (session aggregation)
- [ ] 04-02: TBD (insight generation)
- [ ] 04-03: TBD (4-category output)

### Phase 5: Patient Insight Integration
**Goal**: Therapists can trigger insight generation from patient profile and view results on the AI insights page
**Depends on**: Phase 4
**Requirements**: INSI-01, INSI-07, INSI-08
**Success Criteria** (what must be TRUE):
  1. Patient profile page shows "Generate Insights" button
  2. Clicking button triggers AI insight generation for that patient
  3. Generated insights appear on the AI insights page
  4. Insights are saved and persist across sessions
  5. Therapist can regenerate insights to get updated analysis
**Plans**: TBD

Plans:
- [ ] 05-01: TBD (trigger UI)
- [ ] 05-02: TBD (insights display)
- [ ] 05-03: TBD (persistence/regenerate)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Role-Specific Prompts | 0/2 | Not started | - |
| 2. Session Summary Generation | 0/2 | Not started | - |
| 3. Session Summary UI | 0/3 | Not started | - |
| 4. Patient Insight Engine | 0/3 | Not started | - |
| 5. Patient Insight Integration | 0/3 | Not started | - |
