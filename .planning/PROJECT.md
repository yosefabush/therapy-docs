# TherapyDocs AI Insights

## What This Is

AI-powered insight generation for TherapyDocs, a HIPAA-compliant clinical documentation system for mental health professionals. Delivers role-specific session summaries tailored to each of 10 therapist types, plus cross-session patient analysis that surfaces patterns, progress trends, risk indicators, and treatment gaps.

## Core Value

Each therapist type sees AI-generated insights that speak their professional language — psychiatrists see medication and symptom focus, OTs see functional progress, social workers see systemic factors — making the AI actually useful for clinical decision-making.

## Requirements

### Validated

- ✓ Multi-role template system (10 therapist types) — existing (pre-v1.0)
- ✓ Session management with SOAP notes — existing (pre-v1.0)
- ✓ Voice recording and transcription (Deepgram with speaker diarization) — existing (pre-v1.0)
- ✓ Patient management with encrypted PHI — existing (pre-v1.0)
- ✓ AI features infrastructure (`ai-features.ts` with role dispatch) — existing (pre-v1.0)
- ✓ Insights page with pattern display — existing (pre-v1.0)
- ✓ Role-specific session summary generation (10 therapist-type prompts) — v1.0
- ✓ Session summary UI (button on session page, displays above SOAP notes) — v1.0
- ✓ Session summary persistence (saved to session record, regeneratable) — v1.0
- ✓ Patient-level cross-session insight generation — v1.0
- ✓ Patient insight trigger (button on patient profile page) — v1.0
- ✓ Patient insights display (appears on AI insights page) — v1.0
- ✓ Four insight categories: patterns, progress trends, risk indicators, treatment gaps — v1.0

### Active

(None - ready for next milestone planning)

### Out of Scope

- Manual editing of AI summaries — regenerate only, keeps output consistent
- Role-specific patient insights — unified view serves the multi-therapist use case
- Real-time/automatic insight generation — on-demand only for now
- Session summary on insights page — stays on session page only

## Context

**Current State (v1.0 shipped):**
- Codebase: ~701KB TypeScript across 41 modified files
- Tech stack: Next.js 14 App Router, TypeScript, JSON file-based persistence
- AI Features: Session summaries and patient insights with mock/real modes
- Bilingual: Full Hebrew and English support with RTL layouts
- Repository pattern: Consistent JSON storage for insights and summaries

**Shipped v1.0 Features:**
- 10 role-specific AI prompts in `src/lib/ai/prompts/session-summary/`
- Session summary workflow: SummaryPanel component with 5-state machine
- Patient insight engine: 4-category analysis (patterns, progress, risks, gaps)
- Persistence: GET/PATCH endpoints for summaries and insights
- API routes: `/api/sessions/[id]/summary` and `/api/patients/[id]/insights`

**10 Therapist Roles:**
1. Psychologist — cognitive patterns, psychological assessments, therapeutic techniques
2. Psychiatrist — medication, symptoms, diagnostic considerations, side effects
3. Social Worker — social supports, resources, systemic factors, case management
4. Occupational Therapist — functional progress, daily living, activity tolerance
5. Art Therapist — creative expression, symbolic content, emotional themes
6. Music Therapist — musical engagement, emotional responses, rhythm/structure
7. Marriage/Family Therapist — relationship dynamics, family systems, communication
8. School Counselor — academic impact, peer relationships, developmental concerns
9. Addiction Counselor — substance use patterns, recovery progress, triggers
10. Clinical Counselor — presenting concerns, coping strategies, treatment progress

**Known Issues:**
None - all features production-ready

## Constraints

- **Tech stack**: Next.js 14 App Router, TypeScript, existing repository pattern
- **Data persistence**: JSON file-based (existing pattern) — summaries stored in session records
- **AI provider**: Not specified — need to determine (OpenAI, Anthropic, or other)
- **Hebrew RTL**: UI must maintain Hebrew localization and RTL layout
- **Bilingual output**: AI summaries and insights must support both Hebrew and English
- **HIPAA**: All patient data already encrypted; AI summaries inherit same protection

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Session summaries role-specific, patient insights unified | Session = individual therapist's perspective; Patient insights = holistic view for team | ✓ Good - Clear separation of concerns works well |
| Regenerate-only (no manual edit) | Keeps AI output consistent, avoids mixed human/AI content issues | ✓ Good - Clean UX without editing complexity |
| Summary above SOAP on session page | Natural reading flow: AI summary first, then source notes below | ✓ Good - Therapists see insights first |
| Patient insight trigger from profile, displays on insights page | Generate from patient context, view in centralized insights hub | ✓ Good - Workflow feels natural |
| Mock/Real AI modes with auto-detection | Development without API costs, production with OpenAI | ✓ Good - Enables rapid development and testing |
| GET-then-POST pattern for insights | Check saved first, generate only if needed | ✓ Good - Reduces unnecessary API calls |
| Bilingual support with language detection | Hebrew and English based on input content | ✓ Good - Works seamlessly for both languages |
| 5-state machine for UI components | empty → generating → preview → saved → error | ✓ Good - Clear UX with proper feedback |
| Function overloads for backward compatibility | Add AI mode without breaking existing code | ✓ Good - Zero breaking changes |
| Confidence scoring (0-1 scale) | Three tiers for insight reliability | ✓ Good - Helps therapists assess insights |

---
*Last updated: 2026-01-24 after v1.0 milestone completion*
