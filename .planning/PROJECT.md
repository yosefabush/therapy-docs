# TherapyDocs AI Insights

## What This Is

AI-powered insight generation for TherapyDocs, a HIPAA-compliant clinical documentation system for mental health professionals. This milestone adds role-specific session summaries tailored to each therapist type, plus cross-session patient analysis that surfaces patterns, progress trends, risk indicators, and treatment gaps across all sessions.

## Core Value

Each therapist type sees AI-generated insights that speak their professional language — psychiatrists see medication and symptom focus, OTs see functional progress, social workers see systemic factors — making the AI actually useful for clinical decision-making.

## Requirements

### Validated

- ✓ Multi-role template system (10 therapist types) — existing
- ✓ Session management with SOAP notes — existing
- ✓ Voice recording and transcription (Deepgram with speaker diarization) — existing
- ✓ Patient management with encrypted PHI — existing
- ✓ AI features infrastructure (`ai-features.ts` with role dispatch) — existing
- ✓ Insights page with pattern display — existing

### Active

- [ ] Role-specific session summary generation (10 therapist-type prompts)
- [ ] Session summary UI (button on session page, displays above SOAP notes)
- [ ] Session summary persistence (saved to session record, regeneratable)
- [ ] Patient-level cross-session insight generation
- [ ] Patient insight trigger (button on patient profile page)
- [ ] Patient insights display (appears on AI insights page)
- [ ] Four insight categories: patterns, progress trends, risk indicators, treatment gaps

### Out of Scope

- Manual editing of AI summaries — regenerate only, keeps output consistent
- Role-specific patient insights — unified view serves the multi-therapist use case
- Real-time/automatic insight generation — on-demand only for now
- Session summary on insights page — stays on session page only

## Context

**Existing AI Infrastructure:**
- `src/lib/ai-features.ts` has `generateSessionSummary()` that dispatches to role-specific generators
- Strategy pattern already exists: `generatePsychologySummary()`, `generatePsychiatrySummary()`, etc.
- Need to expand these generators with proper prompts and integrate transcript input

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

**Session Summary Input:**
- SOAP notes (Subjective, Objective, Assessment, Plan)
- Transcript (if available) — Deepgram diarized with speaker labels

**Patient Insight Input:**
- All sessions for the patient across all therapists
- Aggregates SOAP notes and summaries from each session

## Constraints

- **Tech stack**: Next.js 14 App Router, TypeScript, existing repository pattern
- **Data persistence**: JSON file-based (existing pattern) — summaries stored in session records
- **AI provider**: Not specified — need to determine (OpenAI, Anthropic, or other)
- **Hebrew RTL**: UI must maintain Hebrew localization and RTL layout
- **HIPAA**: All patient data already encrypted; AI summaries inherit same protection

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Session summaries role-specific, patient insights unified | Session = individual therapist's perspective; Patient insights = holistic view for team | — Pending |
| Regenerate-only (no manual edit) | Keeps AI output consistent, avoids mixed human/AI content issues | — Pending |
| Summary above SOAP on session page | Natural reading flow: AI summary first, then source notes below | — Pending |
| Patient insight trigger from profile, displays on insights page | Generate from patient context, view in centralized insights hub | — Pending |

---
*Last updated: 2026-01-22 after initialization*
