# Technology Stack: AI Clinical Insights for TherapyDocs

**Project:** TherapyDocs - AI-Powered Clinical Insights
**Researched:** 2026-01-22
**Focus:** LLM APIs, prompt management, clinical text generation

---

## Executive Summary

For adding AI-powered clinical insights to TherapyDocs, I recommend a stack centered on **Vercel AI SDK 6.x** with **Anthropic Claude** as the primary LLM provider. This combination offers the best balance of HIPAA-compliance readiness, TypeScript integration with your existing Next.js 16 stack, structured output capabilities, and cost-effectiveness for clinical documentation workloads.

The existing Deepgram integration for transcription remains. AI features will layer on top, processing transcripts and session data to generate role-specific summaries and cross-session patient insights.

---

## Recommended Stack

### Primary LLM Provider

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Anthropic Claude API** | claude-sonnet-4.5 | Clinical text generation, session summaries | HIGH |
| Claude for Healthcare | Current | HIPAA-compliant infrastructure via BAA | HIGH |

**Why Anthropic Claude:**

1. **HIPAA-Ready Infrastructure**: Anthropic launched Claude for Healthcare in January 2026 with HIPAA-compliant BAAs available through AWS Bedrock, Google Cloud, and Azure. They explicitly state user health data is NOT used for model training.

2. **Clinical Documentation Track Record**: Carta Healthcare reports 99% accuracy with 66% reduction in clinical data processing time. Novo Nordisk cut clinical documentation timelines from 12 weeks to 10 minutes.

3. **Healthcare-Specific Features**: Native integrations with CMS Coverage Database, ICD-10 codes, and PubMed. FHIR development agent skills built-in.

4. **Structured Outputs**: As of November 2025, Claude Sonnet 4.5+ supports native structured outputs with guaranteed JSON schema compliance - essential for generating typed SOAP notes.

5. **Context Window**: 200K token context enables analyzing multiple sessions for cross-session patient insights.

**Pricing** (per million tokens):
- Input: $3.00
- Output: $15.00
- With batch processing: $1.50 / $7.50 (50% savings)
- With prompt caching: Up to 90% savings

**Sources:**
- [Anthropic Healthcare Announcement](https://www.anthropic.com/news/healthcare-life-sciences)
- [Claude for Healthcare](https://claude.com/solutions/healthcare)
- [Claude Pricing](https://www.anthropic.com/pricing)

### Alternative LLM Provider (Secondary)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| OpenAI API | gpt-4o | Fallback, comparison testing | MEDIUM |

**Why as secondary:**
- Slightly cheaper ($2.50/$10.00 per million tokens) but less healthcare-specific tooling
- OpenAI for Healthcare launched with BAA support and HIPAA compliance
- Good for A/B testing summary quality
- Zero retention endpoints required for PHI processing

**When to use OpenAI instead:**
- Cost sensitivity is critical
- Need specific OpenAI fine-tuning capabilities
- Existing organizational relationship with OpenAI

**Sources:**
- [OpenAI Healthcare Solutions](https://openai.com/solutions/industries/healthcare/)
- [OpenAI BAA Information](https://help.openai.com/en/articles/8660679-how-can-i-get-a-business-associate-agreement-baa-with-openai)

---

### AI SDK / Framework

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Vercel AI SDK** | 6.x | LLM integration, structured outputs, streaming | HIGH |
| @ai-sdk/anthropic | Latest | Anthropic provider for AI SDK | HIGH |
| @ai-sdk/openai | Latest | OpenAI provider (optional fallback) | MEDIUM |

**Why Vercel AI SDK:**

1. **Native Next.js Integration**: Built by Vercel specifically for Next.js applications. Seamless with your existing App Router architecture.

2. **Unified Provider API**: Switch between Anthropic, OpenAI, or other providers with one line change. Future-proofs against provider lock-in.

3. **AI SDK 6.0 Structured Outputs**: New `Output.object()` API with Zod schema validation - perfect for generating typed `SessionNotes`, `RiskAssessment`, and `AIInsight` objects matching your existing types.

4. **TypeScript-First**: Full type inference, works directly with Zod schemas already used in your codebase.

5. **Streaming Support**: `streamText` with `partialOutputStream` for real-time summary generation UI.

6. **Agent Capabilities**: `ToolLoopAgent` for multi-step clinical workflows (e.g., analyze session -> assess risk -> generate summary -> suggest follow-up).

**Key API Pattern:**

```typescript
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const sessionSummarySchema = z.object({
  chiefComplaint: z.string().describe("Primary presenting concern"),
  clinicalObservations: z.string().describe("Objective observations"),
  assessment: z.string().describe("Clinical interpretation"),
  plan: z.string().describe("Treatment plan for next steps"),
  riskIndicators: z.array(z.string()).optional(),
});

const { output } = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  output: Output.object({
    schema: sessionSummarySchema,
    name: 'SessionSummary',
    description: 'Structured clinical session summary'
  }),
  prompt: roleSpecificPrompt,
});
```

**Sources:**
- [AI SDK Introduction](https://ai-sdk.dev/docs/introduction)
- [AI SDK 6.0 Blog](https://vercel.com/blog/ai-sdk-6)
- [Structured Data Generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)

---

### Schema Validation

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Zod** | 3.25.x | Schema definition, LLM output validation | HIGH |

**Why Zod:**

1. **Already in Your Stack**: `package.json` shows `zod: ^3.25.76` already installed.

2. **AI SDK Native Support**: AI SDK 6.x uses Zod schemas directly for `Output.object()`.

3. **TypeScript Integration**: Automatic type inference from schemas - define once, use for validation AND types.

4. **Runtime Validation**: Catches LLM hallucinations that violate schema constraints.

5. **Anthropic Structured Outputs**: Zod schemas work directly with Claude's native structured output feature for guaranteed compliance.

**Pattern - Define schemas matching existing types:**

```typescript
// Matches src/types/index.ts SessionNotes interface
export const sessionNotesSchema = z.object({
  chiefComplaint: z.string().optional(),
  subjective: z.string().describe("Patient's self-report"),
  objective: z.string().describe("Therapist's observations"),
  assessment: z.string().describe("Clinical interpretation"),
  plan: z.string().describe("Treatment plan"),
  interventionsUsed: z.array(z.string()),
  progressTowardGoals: z.string().optional(),
  riskAssessment: riskAssessmentSchema.optional(),
});
```

**Sources:**
- [Zod GitHub](https://github.com/colinhacks/zod)
- [AI SDK Zod Integration](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)

---

### Prompt Management

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Custom TypeScript Module** | N/A | Role-specific prompt templates | HIGH |
| LangSmith (optional) | Latest | Prompt versioning, observability | MEDIUM |

**Recommended Approach: Custom TypeScript Prompt System**

For TherapyDocs with 10 distinct therapist roles, a custom prompt management system is more appropriate than LangChain/LangSmith for several reasons:

1. **Role-Specific Prompts**: You need prompts that speak each profession's language (psychologist vs psychiatrist vs OT). This is domain configuration, not generic prompt chaining.

2. **Type Safety**: TypeScript prompt templates with `TherapistRole` enum integration.

3. **No External Dependencies**: Keeps PHI processing in-house without routing through third-party prompt management SaaS.

4. **Simpler Architecture**: Your current `ai-features.ts` already has role-specific generators. Enhance with LLM calls, don't replace with framework.

**Recommended Pattern:**

```typescript
// src/lib/prompts/clinical-prompts.ts
import { TherapistRole, SessionType } from '@/types';

interface PromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
  outputDescription: string;
}

const rolePromptConfigs: Record<TherapistRole, PromptConfig> = {
  psychologist: {
    systemPrompt: `You are assisting a licensed psychologist with clinical documentation.
    Use psychological terminology and DSM-5 diagnostic frameworks.
    Focus on cognitive patterns, behavioral observations, and psychological formulation.
    Always maintain professional clinical language suitable for medical records.`,
    userPromptTemplate: `Generate a psychological session summary for the following session data...`,
    outputDescription: 'Psychological assessment in SOAP format'
  },
  psychiatrist: {
    systemPrompt: `You are assisting a psychiatrist with clinical documentation.
    Emphasize medication management, symptom tracking, and mental status examination findings.
    Include relevant pharmacological considerations and side effect monitoring.`,
    // ...
  },
  // ... other roles
};
```

**When to Add LangSmith:**
- If you need prompt A/B testing at scale
- If you want centralized prompt versioning across team
- Self-hosted deployment option available for HIPAA compliance

**Sources:**
- [LangSmith Prompt Management](https://docs.langchain.com/langsmith/manage-prompts-programmatically)
- [Healthcare Prompt Engineering Tutorial](https://www.jmir.org/2025/1/e72644)

---

### Observability (Optional but Recommended)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Langfuse (self-hosted)** | Latest | LLM tracing, cost tracking | MEDIUM |

**Why Langfuse Self-Hosted:**

1. **HIPAA Compliance**: Self-hosting keeps PHI on your infrastructure - no prompts sent to third-party SaaS.

2. **Open Source**: MIT license, 19K+ GitHub stars, no vendor lock-in.

3. **AI SDK Integration**: Native integration with Vercel AI SDK.

4. **Cost Tracking**: Essential for monitoring per-patient LLM costs in healthcare setting.

5. **Prompt Debugging**: Trace why a specific clinical summary was generated.

**Alternative for Simpler Setup:**
- **Helicone**: SOC 2 and HIPAA compliant SaaS option, proxy-based (minimal code changes)

**Sources:**
- [Langfuse Documentation](https://langfuse.com/)
- [Top LLM Observability Platforms](https://agenta.ai/blog/top-llm-observability-platforms)

---

## Complete Installation

```bash
# Core AI SDK packages
npm install ai @ai-sdk/anthropic

# Optional: OpenAI fallback
npm install @ai-sdk/openai

# Zod already installed (^3.25.76)
# npm install zod

# Optional: Observability
npm install langfuse
```

**Environment Variables:**

```env
# Required for Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Optional for OpenAI fallback
OPENAI_API_KEY=sk-...

# Optional for Langfuse observability
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_HOST=https://your-self-hosted-langfuse.com # For self-hosted
```

---

## What NOT to Use

### LangChain (AVOID for this project)

**Why not:**
- Overkill for your use case - you don't need RAG, vector stores, or complex chains
- Adds significant bundle size and complexity
- Your role-specific prompts are better handled with typed TypeScript
- Framework abstraction hides important details for healthcare compliance

**When LangChain IS appropriate:**
- RAG-heavy applications with document retrieval
- Complex multi-step agent workflows with many tools
- Teams already using LangChain ecosystem

### Direct OpenAI/Anthropic SDK (without AI SDK)

**Why not:**
- Locks you to single provider
- No unified streaming/structured output API
- More boilerplate for Next.js integration
- AI SDK abstracts provider differences elegantly

### Fine-Tuned Models (Defer)

**Why defer:**
- Significantly increases HIPAA compliance complexity
- Requires large clinical datasets for training
- Start with prompt engineering; fine-tune only if accuracy insufficient
- OpenAI fine-tuning reportedly saved 74% prompt costs in healthcare - evaluate after baseline

---

## HIPAA Compliance Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| BAA with LLM Provider | Anthropic BAA via AWS Bedrock/direct | Required |
| Zero Data Retention | Use zero-retention API endpoints | Required |
| Data Encryption | TLS 1.2+ in transit, AES-256 at rest | Built-in |
| No PHI in Model Training | Anthropic explicitly excludes health data | Verified |
| Audit Logging | Langfuse self-hosted or custom logging | Required |
| Access Controls | Existing RBAC in TherapyDocs | Existing |
| De-identification Option | Consider for certain insights | Recommended |

**Critical:** Contact baa@anthropic.com or baa@openai.com to establish BAA before processing PHI.

**Sources:**
- [HIPAA Compliant LLMs Guide](https://www.techmagic.co/blog/hipaa-compliant-llms)
- [Anthropic Healthcare Compliance](https://www.anthropic.com/news/healthcare-life-sciences)

---

## Prompt Engineering Patterns for Clinical Use

### Pattern 1: Role-Based System Prompts

Each therapist role gets a tailored system prompt that:
- Establishes professional identity and terminology
- Specifies documentation format expectations
- Includes relevant clinical frameworks (DSM-5, ICF, etc.)

### Pattern 2: Structured Output with Schema Descriptions

Use Zod's `.describe()` to guide LLM output:

```typescript
z.object({
  subjective: z.string().describe("Patient's self-reported symptoms, concerns, and experiences in their own words"),
  objective: z.string().describe("Clinician's direct observations: affect, behavior, appearance, mental status"),
  assessment: z.string().describe("Clinical interpretation integrating subjective and objective findings"),
  plan: z.string().describe("Specific next steps, interventions planned, homework assigned"),
});
```

### Pattern 3: Chain-of-Thought for Risk Assessment

For risk indicators, use CoT prompting:

```typescript
const riskPrompt = `
Analyze this session for risk factors step by step:
1. Review subjective complaints for risk language
2. Assess objective observations for warning signs
3. Compare to previous sessions for escalation patterns
4. Provide risk assessment with confidence level

Session data: ${JSON.stringify(sessionData)}
`;
```

### Pattern 4: Few-Shot Examples for Consistency

Include 2-3 example outputs per role to establish documentation style:

```typescript
const psychologistExamples = `
Example 1:
Input: [session data]
Output: [ideal SOAP note]

Example 2:
...
`;
```

**Sources:**
- [Prompt Engineering in Clinical Practice](https://www.jmir.org/2025/1/e72644)
- [Healthcare AI Prompts Best Practices](https://bastiongpt.com/post/best-practices-for-healthcare-ai-prompts)

---

## Confidence Assessment

| Component | Confidence | Rationale |
|-----------|------------|-----------|
| Vercel AI SDK 6.x | HIGH | Official docs verified, native Next.js support |
| Anthropic Claude | HIGH | Healthcare launch verified, HIPAA BAA confirmed |
| Zod for schemas | HIGH | Already in codebase, AI SDK native support |
| Custom prompt system | HIGH | Matches existing architecture pattern |
| Langfuse self-hosted | MEDIUM | Good fit but adds operational complexity |
| OpenAI as fallback | MEDIUM | Viable but less healthcare-specific tooling |

---

## Migration Path from Current State

Your `src/lib/ai-features.ts` currently uses rule-based text extraction. Migration path:

1. **Phase 1**: Add AI SDK, create LLM-powered `generateSessionSummary()` alongside existing functions
2. **Phase 2**: Implement role-specific prompt templates using existing `TherapistRole` types
3. **Phase 3**: Add structured output with Zod schemas matching `SessionNotes` interface
4. **Phase 4**: Implement cross-session analysis using `analyzePatternsTrends()` with LLM
5. **Phase 5**: Add observability layer (Langfuse)

**Key Principle:** Enhance existing architecture, don't replace. Your role-specific generator pattern is sound - just power it with real AI.

---

## Cost Estimates

For a mental health practice with 1,000 sessions/month:

| Scenario | Input Tokens | Output Tokens | Monthly Cost |
|----------|--------------|---------------|--------------|
| Session summaries only | ~2M | ~1M | ~$21 |
| + Cross-session insights | ~5M | ~2M | ~$45 |
| + Risk analysis | ~8M | ~3M | ~$69 |
| With batch processing (50% off) | - | - | ~$35 |

**Note:** These are estimates. Actual costs depend on session length, analysis depth, and caching effectiveness.

---

## References

### Official Documentation
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction)
- [Anthropic Claude for Healthcare](https://www.anthropic.com/news/healthcare-life-sciences)
- [OpenAI Healthcare Solutions](https://openai.com/solutions/industries/healthcare/)

### Research & Guidelines
- [Prompt Engineering in Clinical Practice (JMIR 2025)](https://www.jmir.org/2025/1/e72644)
- [MIND-SAFE Framework for Mental Health LLMs](https://mental.jmir.org/2025/1/e75078)
- [LLMs in Healthcare Review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12189880/)

### HIPAA Compliance
- [HIPAA Compliant LLMs Guide](https://www.techmagic.co/blog/hipaa-compliant-llms)
- [OpenAI BAA Process](https://help.openai.com/en/articles/8660679-how-can-i-get-a-business-associate-agreement-baa-with-openai)

### Pricing
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [OpenAI Pricing](https://platform.openai.com/docs/pricing)
