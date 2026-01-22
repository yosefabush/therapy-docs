# Requirements: TherapyDocs AI Insights

**Defined:** 2026-01-22
**Core Value:** Each therapist type sees AI-generated insights that speak their professional language

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Session Summaries

- [x] **SUMM-01**: Therapist can generate AI summary for a session (prompt auto-selected by their role)
- [x] **SUMM-02**: Summary appears above SOAP notes on session page
- [x] **SUMM-03**: Summary uses SOAP notes + transcript (if available) as input
- [x] **SUMM-04**: 10 distinct prompts tailored to each therapist role's focus areas
- [x] **SUMM-05**: Therapist can review summary before it saves
- [x] **SUMM-06**: Summary saved to session record
- [x] **SUMM-07**: Therapist can regenerate summary

### Patient Insights

- [ ] **INSI-01**: Therapist can trigger patient insight generation from patient profile
- [x] **INSI-02**: AI analyzes all sessions for the patient (across therapists)
- [x] **INSI-03**: Patterns surfaced (recurring themes, behaviors)
- [x] **INSI-04**: Progress trends tracked (improvement/decline over time)
- [x] **INSI-05**: Risk indicators detected across sessions
- [x] **INSI-06**: Treatment gaps identified (mentioned but unaddressed)
- [ ] **INSI-07**: Insights appear on AI insights page
- [ ] **INSI-08**: Insights saved and can be regenerated

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced AI Features

- **EAIF-01**: Source citations showing which notes informed each insight
- **EAIF-02**: Golden Thread linking insights to treatment plan goals
- **EAIF-03**: Multidisciplinary synthesis across different therapist perspectives
- **EAIF-04**: Predictive alerts for risk patterns

### Safety & Compliance

- **SAFE-01**: Visual AI attribution distinguishing AI vs human content
- **SAFE-02**: Audit trail logging AI generation, approvals, modifications
- **SAFE-03**: Hallucination guardrails grounding output in session data only

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Role selection for summaries | Therapist's own role auto-determines prompt; prevents misuse |
| Manual editing of AI summaries | Regenerate-only keeps output consistent |
| Role-specific patient insights | Unified view serves multi-therapist collaboration |
| Real-time/automatic generation | On-demand only for v1; avoids surprise AI content |
| Session summary on insights page | Lives on session page only for context |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SUMM-01 | Phase 2 | Complete |
| SUMM-02 | Phase 3 | Complete |
| SUMM-03 | Phase 2 | Complete |
| SUMM-04 | Phase 1 | Complete |
| SUMM-05 | Phase 3 | Complete |
| SUMM-06 | Phase 3 | Complete |
| SUMM-07 | Phase 3 | Complete |
| INSI-01 | Phase 5 | Pending |
| INSI-02 | Phase 4 | Complete |
| INSI-03 | Phase 4 | Complete |
| INSI-04 | Phase 4 | Complete |
| INSI-05 | Phase 4 | Complete |
| INSI-06 | Phase 4 | Complete |
| INSI-07 | Phase 5 | Pending |
| INSI-08 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after roadmap creation*
