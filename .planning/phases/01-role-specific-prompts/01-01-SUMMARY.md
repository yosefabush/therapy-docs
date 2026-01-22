---
phase: 01-role-specific-prompts
plan: 01
subsystem: ai-prompts
tags: [ai, prompts, session-summary, therapist-roles]

dependency-graph:
  requires: []
  provides: [role-prompts, prompt-registry, getPromptForRole]
  affects: [01-02]

tech-stack:
  added: []
  patterns: [template-variables, type-safe-registry]

key-files:
  created:
    - src/lib/prompts/index.ts
    - src/lib/prompts/psychologist.ts
    - src/lib/prompts/psychiatrist.ts
    - src/lib/prompts/social-worker.ts
    - src/lib/prompts/occupational-therapist.ts
    - src/lib/prompts/speech-therapist.ts
    - src/lib/prompts/physical-therapist.ts
    - src/lib/prompts/counselor.ts
    - src/lib/prompts/art-therapist.ts
    - src/lib/prompts/music-therapist.ts
    - src/lib/prompts/family-therapist.ts
  modified: []

decisions:
  - id: use-template-variables
    choice: "Use {{soapNotes}} and {{transcript}} as standard template placeholders"
    rationale: "Simple string replacement, clear naming, matches common templating conventions"
  - id: type-safe-registry
    choice: "Use Record<TherapistRole, SessionSummaryPrompt> with compile-time exhaustiveness check"
    rationale: "TypeScript ensures all roles are covered; adding new role forces prompt creation"
  - id: bilingual-support
    choice: "Each prompt instructs AI to match input language (Hebrew/English)"
    rationale: "Israeli clinic context requires Hebrew support; automatic language detection is cleaner"

metrics:
  duration: "~5 minutes"
  completed: 2026-01-22
---

# Phase 01 Plan 01: Role-Specific AI Prompts Summary

**One-liner:** Type-safe prompt registry with 10 role-specific AI prompts for session summary generation, each with clinical vocabulary and focus areas tailored to therapist specialty.

## What Was Built

Created a complete prompt system for AI-powered session summaries:

### Core Infrastructure (index.ts)
- `SessionSummaryPrompt` interface defining prompt structure
- `promptRegistry` mapping all 10 TherapistRole values to their prompts
- `getPromptForRole()` function for type-safe prompt retrieval
- `getAllPrompts()` and `getSupportedRoles()` utility functions
- Compile-time exhaustiveness check ensuring all roles have prompts

### Role-Specific Prompts (10 files)

| Role | Focus Areas |
|------|-------------|
| Psychologist | Cognitive patterns, PHQ-9/GAD-7/BDI-II, CBT/DBT/ACT techniques |
| Psychiatrist | Medication regimen, side effects, symptom severity, MSE, labs |
| Social Worker | Social determinants, case management, resource connections |
| Occupational Therapist | ADLs/IADLs, performance skills, independence goals |
| Speech Therapist | Articulation, language, fluency, voice, swallowing |
| Physical Therapist | Motor function, mobility, balance, strength, ROM, gait |
| Counselor | Therapeutic alliance, coping strategies, psychoeducation |
| Art Therapist | Creative expression, symbolic content, artistic media |
| Music Therapist | Musical engagement, emotional responses, interventions |
| Family Therapist | Relationship dynamics, communication patterns, structure |

### Prompt Structure

Each prompt contains:
1. **systemPrompt**: Establishes AI as clinical expert, defines professional vocabulary
2. **userPromptTemplate**: With `{{soapNotes}}` and `{{transcript}}` placeholders
3. **focusAreas**: Array of 7-10 role-specific clinical priorities
4. **outputFormat**: Expected summary structure (2-3 paragraphs + bullet points)

## Key Technical Details

```typescript
// Type-safe prompt retrieval
const prompt = getPromptForRole('psychologist');
const userMessage = prompt.userPromptTemplate
  .replace('{{soapNotes}}', formattedNotes)
  .replace('{{transcript}}', transcript || 'No transcript available');
```

**Exhaustiveness guarantee:**
```typescript
// Compile error if any TherapistRole is missing from registry
const _exhaustiveCheck: Record<TherapistRole, SessionSummaryPrompt> = promptRegistry;
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles with 0 errors
- [x] 11 files exist in src/lib/prompts/
- [x] All prompts export SessionSummaryPrompt with required fields
- [x] All prompts contain {{soapNotes}} and {{transcript}} placeholders
- [x] Type-level completeness check passes

## Commits

| Hash | Description |
|------|-------------|
| d57799a | feat(01-01): create role-specific AI prompts for session summaries |

## Next Phase Readiness

**Ready for Plan 02:** The prompt registry is complete and ready for integration with `ai-features.ts`. Plan 02 will update `generateSessionSummary()` to use these prompts.

**Integration point:**
```typescript
import { getPromptForRole } from '@/lib/prompts';
const prompt = getPromptForRole(therapistRole);
// Use prompt.systemPrompt and prompt.userPromptTemplate with AI API
```
