# Phase 4: Patient Insight Engine - Research

**Researched:** 2026-01-22
**Domain:** AI-powered longitudinal patient analysis, clinical pattern recognition, mental health insights
**Confidence:** HIGH (based on existing codebase patterns + verified OpenAI capabilities)

## Summary

Phase 4 implements an AI engine that analyzes all sessions for a patient and extracts patterns, progress trends, risk indicators, and treatment gaps. This research validates the approach outlined in existing plans and provides technical guidance for implementation.

The existing codebase already has:
1. A working AI infrastructure (`src/lib/ai/`) with mock/real mode support
2. An `AIInsight` type and `analyzePatternsTrends()` function in `ai-features.ts` (rule-based)
3. Session repository with `findByPatient()` method
4. Established prompt patterns from the 10 role-specific session summary prompts

**Primary recommendation:** Follow the existing AI module patterns exactly - reuse `generateAISummary()` for the API call, implement mock mode with realistic Hebrew/English content, and use JSON-structured output in prompts for reliable parsing.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenAI API | v4.x | LLM inference | Already integrated via `generateAISummary()` |
| gpt-4o-mini | (default) | AI model | Cost-efficient, per existing config |
| Next.js API Routes | 14.x | REST endpoints | Existing pattern for summary API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Schema validation | Optional: validate AI JSON response |
| uuid | 4.x | ID generation | Already in base repository |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON parsing | OpenAI Structured Outputs | Structured Outputs guarantee schema but require specific model versions (gpt-4o-mini supports it). Current string parsing works and is simpler. |
| Single AI call | Multi-agent approach | Multi-agent provides better quality but higher latency/cost. Single call is sufficient for MVP. |

**Installation:**
No new packages needed. Existing dependencies cover all requirements.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/ai/patient-insights/
  aggregator.ts      # Session fetching and formatting
  prompts.ts         # System and user prompt templates
  generator.ts       # Main generation logic with mock/real modes
  index.ts           # Public exports
```

This mirrors the existing prompt structure in `src/lib/prompts/` and AI module in `src/lib/ai/`.

### Pattern 1: Session Aggregation Before AI Call
**What:** Fetch all sessions, filter to completed only, sort chronologically, format into single text block
**When to use:** Any multi-session analysis
**Example:**
```typescript
// Source: Existing pattern from ai-features.ts
export async function aggregatePatientSessions(patientId: string): Promise<AggregatedSessions> {
  const allSessions = await sessionRepository.findByPatient(patientId);
  const completed = allSessions.filter(s => s.status === 'completed');
  const sorted = completed.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return {
    patientId,
    sessionCount: sorted.length,
    dateRange: sorted.length > 0 ? {
      earliest: new Date(sorted[0].scheduledAt),
      latest: new Date(sorted[sorted.length - 1].scheduledAt)
    } : null,
    sessions: sorted
  };
}
```

### Pattern 2: JSON-Structured Prompts for Reliable Parsing
**What:** Request JSON output in system prompt, parse with regex fallback
**When to use:** When AI needs to return structured data
**Example:**
```typescript
// Source: Established pattern, verified with OpenAI Structured Outputs docs
const systemPrompt = `...
Output your analysis as JSON in this exact format:
{
  "patterns": [{ "content": "...", "confidence": 0.X }],
  "progressTrends": [...],
  "riskIndicators": [...],
  "treatmentGaps": [...]
}`;

function parseInsightResponse(text: string): ParsedInsights | null {
  try {
    // Handle markdown code fences that LLMs sometimes add
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
```

### Pattern 3: Mock/Real Mode Auto-Detection
**What:** Check for API key presence to determine mode
**When to use:** All AI generation functions
**Example:**
```typescript
// Source: src/lib/ai/index.ts - getAIConfig()
const config = getAIConfig();
if (config.mode === 'mock') {
  return generateMockInsights(patientId, aggregated);
}
return generateRealInsights(systemPrompt, userPrompt);
```

### Pattern 4: Error-as-Return-Value
**What:** Return error in result object instead of throwing
**When to use:** All AI generation to match existing SummaryResult pattern
**Example:**
```typescript
// Source: Existing decision from Phase 2-3
interface InsightResult {
  insights: PatientInsights;
  error?: string;
}
// Never throw - always return valid structure
```

### Anti-Patterns to Avoid
- **Don't make multiple AI calls per insight category:** Inefficient and expensive. Single call with structured JSON output is sufficient.
- **Don't parse AI output without error handling:** LLMs can return malformed JSON. Always have fallback.
- **Don't hardcode English prompts:** Match input language per bilingual-support decision.
- **Don't skip mock mode:** Development without API key must work with realistic mock data.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session fetching | Custom queries | `sessionRepository.findByPatient()` | Already optimized, tested |
| AI API calls | Direct fetch to OpenAI | `generateAISummary()` | Handles config, errors, modes |
| SOAP formatting | New formatter | Extend `formatSOAPNotes()` pattern from ai-features.ts | Consistent, tested |
| Date formatting | Custom | `toISOString()` | LLMs parse ISO dates reliably |
| Mock content | English-only | Hebrew + English templates | Matches existing mock-ai.ts pattern |

**Key insight:** The existing AI infrastructure (`src/lib/ai/`) is well-designed. The insight engine should plug into it, not recreate it.

## Common Pitfalls

### Pitfall 1: Token Limit Overflow
**What goes wrong:** Patient with 50+ sessions creates prompt too large for model context
**Why it happens:** Session history grows unbounded over time
**How to avoid:**
1. Limit to most recent N sessions (e.g., 20-30)
2. OR summarize older sessions first, then analyze summaries
3. Monitor token count before API call
**Warning signs:** API errors about token limits, truncated responses

### Pitfall 2: Inconsistent JSON Structure from AI
**What goes wrong:** AI returns different field names, missing arrays, or invalid JSON
**Why it happens:** LLMs are probabilistic; slight prompt variations cause output variations
**How to avoid:**
1. Use very explicit JSON format in system prompt
2. Include example output in prompt
3. Parse with robust regex that handles code fences
4. Validate parsed result has required fields
5. Consider OpenAI Structured Outputs for guaranteed schema (gpt-4o-mini supports it)
**Warning signs:** JSON parse errors in logs, missing insight categories

### Pitfall 3: Mock Mode Returning Unrealistic Data
**What goes wrong:** Mock insights don't reflect actual session content or count
**Why it happens:** Lazy mock implementation ignores input
**How to avoid:**
1. Mock should vary based on session count
2. Mock should detect Hebrew/English from sessions
3. Mock should reference actual date ranges
**Warning signs:** Same mock output regardless of patient

### Pitfall 4: Risk Indicators Without Proper Urgency
**What goes wrong:** Critical risk indicators (suicidal ideation) treated same as patterns
**Why it happens:** All categories treated uniformly
**How to avoid:**
1. Risk indicators should have highest confidence when explicit in notes
2. Consider adding severity/urgency field to risk indicators
3. UI (Phase 5) should visually distinguish risk alerts
**Warning signs:** Risk indicators buried among patterns

### Pitfall 5: Missing Therapist Context
**What goes wrong:** Insights don't account for different therapist perspectives
**Why it happens:** Sessions from psychologist vs psychiatrist have different focus areas
**How to avoid:**
1. Include therapist role in formatted session text
2. Prompt should note multi-disciplinary context
3. Consider surfacing which roles contributed to each insight
**Warning signs:** Insights miss medication changes (psychiatrist) or social factors (social worker)

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete Session Formatting
```typescript
// Source: Adapted from src/lib/ai-features.ts formatSOAPNotes()
function formatSessionForInsights(session: Session): string {
  const date = new Date(session.scheduledAt).toISOString().split('T')[0];
  const { notes } = session;

  const sections: string[] = [
    `=== Session: ${date} (${session.therapistRole}) ===`,
  ];

  if (notes.chiefComplaint) {
    sections.push(`Chief Complaint: ${notes.chiefComplaint}`);
  }
  sections.push(`Subjective: ${notes.subjective}`);
  sections.push(`Objective: ${notes.objective}`);
  sections.push(`Assessment: ${notes.assessment}`);
  sections.push(`Plan: ${notes.plan}`);

  if (notes.interventionsUsed?.length) {
    sections.push(`Interventions: ${notes.interventionsUsed.join(', ')}`);
  }
  if (notes.progressTowardGoals) {
    sections.push(`Progress: ${notes.progressTowardGoals}`);
  }
  if (notes.riskAssessment) {
    const risk = notes.riskAssessment;
    sections.push(`Risk Assessment: SI=${risk.suicidalIdeation}, HI=${risk.homicidalIdeation}, SH=${risk.selfHarm}, Substance=${risk.substanceUse}`);
  }
  if (notes.medications?.length) {
    const meds = notes.medications.map(m => `${m.name} ${m.dosage}`).join('; ');
    sections.push(`Medications: ${meds}`);
  }

  return sections.join('\n');
}
```

### Insight System Prompt (Bilingual)
```typescript
// Source: Adapted from src/lib/prompts/psychologist.ts pattern
export const PATIENT_INSIGHT_SYSTEM_PROMPT = `You are a clinical analyst reviewing a mental health patient's complete therapy history across multiple providers.

Analyze the provided session notes and identify insights in four categories:

1. PATTERNS: Recurring themes, behaviors, emotional patterns, relationship dynamics, or coping mechanisms that appear across sessions.

2. PROGRESS_TRENDS: Evidence of improvement or decline over time in symptoms, daily functioning, goal achievement, or treatment engagement.

3. RISK_INDICATORS: Safety concerns including suicidal ideation, homicidal ideation, self-harm behaviors, or substance use patterns.

4. TREATMENT_GAPS: Concerns mentioned by the patient that haven't been addressed, or recommended interventions not yet implemented.

Output your analysis as JSON:
{
  "patterns": [{"content": "...", "confidence": 0.X, "sessionRefs": ["YYYY-MM-DD"]}],
  "progressTrends": [{"content": "...", "confidence": 0.X, "trend": "improving|stable|declining"}],
  "riskIndicators": [{"content": "...", "confidence": 0.X, "severity": "low|medium|high"}],
  "treatmentGaps": [{"content": "...", "confidence": 0.X}]
}

Guidelines:
- 2-5 insights per category (fewer if data insufficient)
- Confidence: 0.9+ clear evidence, 0.7-0.9 moderate, <0.7 tentative
- Match the language of the input (Hebrew or English)
- Reference specific session dates where applicable`;
```

### Mock Insight Generator
```typescript
// Source: Pattern from src/lib/ai/mock-ai.ts
function generateMockInsights(patientId: string, aggregated: AggregatedSessions): PatientInsights {
  const isHebrew = aggregated.sessions.some(s =>
    /[\u0590-\u05FF]/.test(s.notes.subjective || '')
  );

  const now = new Date();

  if (isHebrew) {
    return {
      id: `insight-${Date.now()}`,
      patientId,
      patterns: [
        { content: 'דפוס של חשיבה שלילית חוזרת הופיע ב-3 מפגשים אחרונים', confidence: 0.85 },
        { content: 'קשיי שינה מתוארים באופן עקבי לאורך הטיפול', confidence: 0.9 }
      ],
      progressTrends: [
        { content: 'שיפור הדרגתי בתסמיני החרדה מאז תחילת הטיפול', confidence: 0.75 }
      ],
      riskIndicators: [],
      treatmentGaps: [
        { content: 'הומלץ על טיפול קבוצתי אך טרם יושם', confidence: 0.8 }
      ],
      generatedAt: now,
      mode: 'mock'
    };
  }

  // English mock content...
  return {
    id: `insight-${Date.now()}`,
    patientId,
    patterns: [
      { content: 'Recurring negative thought patterns observed across last 3 sessions', confidence: 0.85 },
      { content: 'Sleep difficulties consistently reported throughout treatment', confidence: 0.9 }
    ],
    progressTrends: [
      { content: 'Gradual improvement in anxiety symptoms since treatment start', confidence: 0.75 }
    ],
    riskIndicators: [],
    treatmentGaps: [
      { content: 'Group therapy recommended but not yet implemented', confidence: 0.8 }
    ],
    generatedAt: now,
    mode: 'mock'
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rule-based analysis | LLM-powered analysis | 2024 | Much richer, contextual insights |
| Single-session summary | Longitudinal analysis | This phase | Cross-session pattern detection |
| English-only AI | Bilingual (Hebrew/English) | Phase 1 | Israeli market support |

**OpenAI Recent Updates (2026):**
- OpenAI for Healthcare launched January 2026 with HIPAA-compliant features
- Structured Outputs now guaranteed 100% schema compliance on gpt-4o-mini
- GPT-5.2 available but gpt-4o-mini remains cost-effective for this use case

**Deprecated/outdated:**
- JSON mode (replaced by Structured Outputs for guaranteed schema)
- Assistants API (deprecated August 2025, sunset August 2026)

## Open Questions

Things that couldn't be fully resolved:

1. **Token limit for large patient histories**
   - What we know: gpt-4o-mini has 128k context window
   - What's unclear: Exact session count before hitting practical limits
   - Recommendation: Implement with reasonable limit (20-30 sessions), monitor, adjust

2. **Structured Outputs vs JSON parsing**
   - What we know: Structured Outputs guarantees schema compliance
   - What's unclear: Whether current string parsing is reliable enough
   - Recommendation: Start with JSON parsing (matches existing pattern), upgrade to Structured Outputs if parse errors occur

3. **Insight persistence and regeneration**
   - What we know: INSI-08 requires saving and regenerating
   - What's unclear: Exact persistence model (separate table vs on Patient)
   - Recommendation: Phase 5 will handle UI/persistence; Phase 4 focuses on generation

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/ai/`, `src/lib/ai-features.ts`, `src/lib/prompts/`
- Existing types: `src/types/index.ts` (AIInsight, Session, SessionNotes)
- Existing API patterns: `src/app/api/sessions/[id]/summary/route.ts`

### Secondary (MEDIUM confidence)
- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs) - JSON schema response format
- [OpenAI for Healthcare](https://openai.com/index/openai-for-healthcare/) - HIPAA-compliant patterns
- [Using Zod with OpenAI](https://hooshmand.net/zod-zodresponseformat-structured-outputs-openai/) - TypeScript schema validation

### Tertiary (LOW confidence)
- [MIND-SAFE Framework](https://pmc.ncbi.nlm.nih.gov/articles/PMC12594504/) - Mental health prompt engineering research
- [LLM for Data Analysis](https://www.softwebsolutions.com/resources/llm-for-data-analysis/) - Multi-document analysis patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing, proven codebase patterns
- Architecture: HIGH - Follows established module structure
- Pitfalls: MEDIUM - Based on LLM best practices and clinical domain knowledge

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain, existing patterns)

---

## Appendix: Plan Validation Notes

The existing 04-01, 04-02, 04-03 plans were reviewed against this research:

**04-01 (Types + Aggregator):**
- PatientInsights type structure is appropriate
- InsightItem with confidence and sessionRefs matches best practice
- Aggregator pattern is correct

**04-02 (Prompts + Generator):**
- System prompt structure is appropriate
- Mock mode implementation matches existing pattern
- JSON parsing approach is correct
- Consider adding severity to riskIndicators

**04-03 (API Route):**
- Follows existing session summary API pattern
- Error handling matches established patterns
- Response format is consistent

**Recommendation:** Plans are well-structured and align with research findings. Proceed with implementation.
