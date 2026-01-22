# Project Research Summary

**Project:** TherapyDocs - AI-Powered Clinical Insights
**Domain:** Clinical AI documentation for mental health professionals
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

TherapyDocs is adding AI-powered clinical insight generation to an existing HIPAA-compliant mental health documentation system supporting 10 distinct therapist roles (psychologist, psychiatrist, social worker, occupational therapist, etc.). The challenge is generating role-specific clinical summaries and cross-session patient insights while navigating the unique risks of AI in mental health: hallucinations that create false clinical data, sycophantic models that minimize risk indicators, and liability ambiguity when AI-generated content enters the medical record.

The recommended approach centers on **Vercel AI SDK 6.x with Anthropic Claude as the primary LLM**, leveraging its HIPAA-compliant BAA availability, healthcare-specific features, and structured output capabilities. The architecture should enhance (not replace) the existing role-dispatch pattern in `ai-features.ts`, using a modular prompt management system where each of the 10 roles gets tailored prompts that speak their professional language. Critical infrastructure decisions must precede feature development: hallucination guardrails via retrieval-augmented generation (RAG), explicit AI attribution with mandatory clinician review workflow, and audit trails that track AI outputs separately from human-authored content.

The primary risks are clinical safety failures from hallucinated data, professional boundary violations from role-conflated summaries, and liability exposure from opaque AI-to-medical-record pathways. Mitigation requires treating risk assessment as a safety-critical feature with dedicated architecture (not general-purpose LLMs), implementing source citation for every AI insight (sessionId, date, verbatim quote), and building transparency-first UI where AI-generated content is visually distinct and requires explicit clinician approval. The Hebrew/RTL interface presents additional complexity requiring either Hebrew-specific medical models (HeRo, DictaBERT 2.0) or quality-aware English translation fallback.

## Key Findings

### Recommended Stack

The core technology stack centers on modern LLM integration with HIPAA compliance built-in from the start. **Vercel AI SDK 6.x** provides a unified provider API with native Next.js integration, allowing seamless switching between providers while maintaining structured output capabilities via Zod schemas. This matches TherapyDocs' existing TypeScript/Next.js 14 architecture and already-installed Zod validation library.

**Core technologies:**
- **Anthropic Claude (claude-sonnet-4.5)**: Primary LLM provider with HIPAA BAA via AWS Bedrock/direct, healthcare-specific features (ICD-10, FHIR integrations), and 200K token context for cross-session analysis. Pricing: $3/$15 per million tokens (input/output), with 50% batch discount and 90% prompt caching savings.
- **Vercel AI SDK 6.x**: LLM integration framework with `Output.object()` structured outputs, unified provider API preventing lock-in, streaming support for real-time UI, and TypeScript-first design matching existing codebase patterns.
- **Zod 3.25.x**: Already installed schema validation library, native AI SDK integration for structured output validation, automatic type inference for TypeScript types, and runtime hallucination detection via schema enforcement.
- **Custom TypeScript Prompt System**: Role-specific prompt templates (10 therapist roles) as versioned TypeScript modules, avoiding LangChain/LangSmith overhead for domain-specific configuration that maps directly to existing `TherapistRole` enum.
- **Langfuse (self-hosted, optional)**: LLM observability for cost tracking, prompt debugging, and HIPAA-compliant tracing when self-hosted. Alternative: Helicone SaaS (SOC 2/HIPAA compliant).

**What NOT to use:**
- LangChain: Overkill for this use case (no RAG, vector stores, or complex chains needed)
- Direct OpenAI/Anthropic SDK without abstraction: Locks to single provider
- Fine-tuned models: Defer until prompt engineering baseline established; increases HIPAA complexity significantly
- OpenAI as primary: Use as secondary/fallback; less healthcare-specific tooling than Claude

### Expected Features

Clinical AI insight systems for mental health have matured significantly, with core value proposition being reduction of 2-3 hours/day documentation time while improving clinical outcomes through pattern recognition. TherapyDocs' unique challenge is supporting 10 distinct therapist roles with different documentation emphases (psychiatrists focus on medication effects, OTs on functional performance, social workers on resource connections).

**Must have (table stakes):**
- **Role-specific SOAP note generation**: Each role expects summaries emphasizing different aspects (psychologists: CBT interventions; psychiatrists: medication response; OTs: functional ADL progress). Complexity: MEDIUM. Safety: Must generate drafts requiring clinician review, never final notes.
- **Clinician review and approval workflow**: HIPAA requires human oversight; 42% patient assessment rate with interruptive alerts vs 4% passive. Complexity: LOW. Safety: AI content clearly marked as draft.
- **Hallucination detection/flagging**: 1.47-20% hallucination rates reported; confidence indicators essential. Complexity: HIGH. Safety: Flag fabricated information and low-confidence assertions.
- **Golden Thread linking**: Notes must connect to treatment plan goals for insurance audits and clinical continuity. Complexity: MEDIUM.
- **Risk assessment surfacing**: 77% of suicide decedents had primary care contact in year before death. Complexity: MEDIUM. Safety: Never auto-dismiss risk; always escalate indicators.
- **Cross-session context awareness**: AI must know patient history without hallucinating false history. Complexity: MEDIUM.
- **Intervention tracking by role**: Each role uses different interventions (CBT for psychologists, case management for social workers). Complexity: LOW.
- **HIPAA-compliant data handling**: BAA required; encryption at rest/transit. Complexity: MEDIUM. Safety: No training on patient data.
- **Audit trail for AI-generated content**: Compliance requires knowing AI vs human authorship. Complexity: LOW.

**Should have (competitive differentiators):**
- **Multidisciplinary summary generation**: Combine insights from all providers treating same patient into unified view. Complexity: HIGH. TherapyDocs' existing `generateMultidisciplinaryReport` is foundation.
- **Pattern recognition across sessions**: Surface mood trends, engagement patterns, risk escalation automatically. Complexity: HIGH. Enhance existing `analyzePatternsTrends` to predictive analytics.
- **Therapeutic alliance insights**: "Alliance Genie" style - surface missed moments, connection patterns. Complexity: HIGH. Novel differentiator.
- **Predictive risk alerts**: 30-day suicide risk prediction achieves 84-92% accuracy. Complexity: VERY HIGH. Requires careful clinical governance.
- **Cross-provider insight synthesis**: "OT notes improved hand function while psychology notes show increased anxiety - is there a connection?" Complexity: VERY HIGH. Unique to multidisciplinary focus.
- **Voice-to-SOAP with speaker diarization**: Leverage existing Deepgram `DiarizedTranscript` infrastructure. Complexity: MEDIUM.
- **Hebrew language clinical NLP**: Extend existing Hebrew localization to clinical terminology. Complexity: HIGH. Israeli market differentiator.

**Defer (v2+):**
- **Supervisor-style session review**: AI feedback on session quality must be carefully framed as supportive, not evaluative. Complexity: VERY HIGH.
- **Auto-diagnosis suggestion**: Creates liability and automation bias; defer indefinitely (surface symptom patterns instead).
- **Prescriptive treatment recommendations**: AI lacks full patient context; surface options, don't decide.

### Architecture Approach

The existing `ai-features.ts` provides a solid foundation with role-dispatch pattern and heuristic-based analysis. The recommended architecture enhances rather than replaces this pattern: keep heuristics as fallback, add LLM-powered path as primary. Modular prompt management system with 10 role-specific prompt files composes with base clinical safety prompts at runtime. New `InsightRepository` persists AI-generated insights with source tracking (sessionIds, date range, prompt metadata) for audit and explainability.

**Major components:**
1. **Prompt Management Layer** (`src/lib/ai/prompts/`) — Loads, composes, and versions prompts; separate directories for role-prompts (10 files, one per therapist role) and insight-prompts (pattern detection, risk analysis, progress tracking). Custom TypeScript module, not external SaaS, keeps PHI in-house.
2. **AI Engines** (`src/lib/ai/engines/`) — `SummaryEngine` for single-session SOAP generation, `InsightEngine` for cross-session pattern analysis, `TranscriptEngine` for voice-to-notes processing. Each engine coordinates with PromptManager and handles LLM API calls with structured output validation.
3. **Insight Repository** (`src/lib/data/repositories/insight.repository.ts`) — Extends existing JSON repository pattern; stores AI insights with enhanced `AIInsight` type including source tracking, clinician acknowledgment workflow, prompt metadata for reproducibility, and encrypted content for PHI.
4. **API Routes** (`/api/ai/summary`, `/api/ai/insights`, `/api/ai/transcript/analyze`) — HTTP interface for AI feature access; handles request validation, session data retrieval, AI generation coordination, and response formatting.
5. **Integration with existing ai-features.ts** — Facade pattern: `generateSessionSummary(session, role, useLLM: boolean)` chooses between heuristic and LLM implementation. Gradual migration path without breaking existing consumers.

**Data flows:**
- **Session summary**: User clicks generate → SummaryEngine fetches session → PromptManager composes role-specific prompt → LLM generates structured SOAP → UI displays as draft requiring approval
- **Cross-session insights**: Scheduled job or user request → InsightEngine fetches patient sessions → Groups by role → For each insight type (pattern/risk/progress), compose prompt → LLM generates insights → Store with source metadata → Display with acknowledgment workflow
- **Transcript analysis**: Recording uploaded → Deepgram diarization → TranscriptEngine generates SOAP suggestions → UI pre-fills form → Clinician reviews/edits → Save to session record

**Build order:**
1. Phase 1: Prompt infrastructure (types, base prompts, prompt manager, 10 role-specific prompts) — no dependencies, enables all features
2. Phase 2: Summary engine (LLM-powered session summaries) — depends on prompts
3. Phase 3: Insight storage (enhanced AIInsight type, repository, APIs) — depends on existing repository pattern
4. Phase 4: Insight engine (cross-session analysis) — depends on prompts + storage
5. Phase 5: Transcript analysis (builds on existing Deepgram integration + new engines)

### Critical Pitfalls

1. **AI Hallucinations in Clinical Context** — LLMs generate plausible but factually incorrect clinical information (fabricated symptoms, invented scores, false patient history). Prevention: Ground all insights in explicit source citations (sessionId, date, verbatim quotes); implement RAG to retrieve actual records before synthesis; prohibit inventing data points; display confidence with uncertainty markers. Detection: AI references non-existent session dates or details not in source documentation. **Address in Phase 1** (foundational architecture).

2. **Sycophantic Risk Assessment** — LLMs downplay risk indicators to be agreeable and non-judgmental, euphemizing concerning patterns as "stable" or avoiding "alarming" language. False reassurance can be fatal in suicide risk detection. Prevention: Explicit clinical prompts instructing "Never minimize risk indicators. Clinical accuracy supersedes diplomatic language"; extract risk as structured fields separate from narrative; conservative bias (over-report rather than under-report); mandatory human review for risk outputs; separate risk classifiers, not general LLMs. **Address in Phase 1** (safety-critical).

3. **Role-Conflation in Multi-Disciplinary Settings** — When analyzing cross-session data from multiple therapist roles, AI conflates discipline-specific perspectives, terminology, and assessment frameworks (social work case management described using psychiatric diagnostic language). Prevention: Role-tagged prompt engineering specifying discipline perspective; separate analysis pipelines per discipline; role-specific output templates; multi-disciplinary reports as aggregation, not synthesis; terminology validation flagging mismatched terms. **Address in Phase 1-2** (role prompts foundational, cross-disciplinary reports Phase 2).

4. **Liability Ambiguity and Documentation Gaps** — AI-generated insights blur the line between AI suggestion and clinician documentation; unclear who bears responsibility for adverse outcomes; missing audit trails. 14% increase in AI-related malpractice claims (2024). Prevention: Mandatory AI attribution with visual distinction and "AI-Generated - Review Required" label; required acknowledgment workflow (explicit accept/modify/reject); immutable audit trail storing original AI output, modifications, and timestamps; clear documentation policy stating clinician responsibility for all documented content. **Address in Phase 1** (infrastructure-level).

5. **Confidence Score Miscalibration** — Current codebase shows confidence scores (0.75, 0.85) that do not accurately reflect reliability. LLMs show minimal variation in confidence between right and wrong answers. Research shows 73% override rate for opaque AI vs 1.7% for trustworthy, transparent AI. Prevention: Remove or recalibrate confidence unless validated against clinical outcomes; use uncertainty bands ("60-80%") not point estimates; semantic framing ("Based on 3 sessions over 2 weeks") more meaningful than abstract scores; show sources over confidence numbers. **Address in Phase 2** (after core insight generation works).

## Implications for Roadmap

Based on combined research, the roadmap should prioritize clinical safety infrastructure before feature development, with a phased approach that builds trust through transparency and gradually increases AI sophistication.

### Phase 1: Core AI Infrastructure & Safety Guardrails
**Rationale:** All critical pitfalls require foundational architectural decisions that cannot be retrofitted. Hallucination detection, liability tracking, and HIPAA compliance are infrastructure, not features. This phase establishes trust through transparency before generating any clinical content.

**Delivers:**
- Prompt management system with role-specific prompt templates (10 therapist roles)
- Hallucination guardrails via retrieval-augmented generation (RAG) architecture
- AI attribution and audit trail system (tracks AI outputs separately from human content)
- Clinician review/approval workflow with explicit accept/modify/reject tracking
- Enhanced `AIInsight` type with source tracking (sessionIds, date range, verbatim quotes)
- `InsightRepository` for AI insight persistence with acknowledgment workflow
- HIPAA compliance verification (BAA with Anthropic, encryption, audit logging)
- Hebrew/RTL language handling tested (prompt templates support Hebrew input/output)

**Addresses features:**
- Clinician review/approval workflow (table stakes)
- Audit trail for AI-generated content (table stakes)
- HIPAA-compliant data handling (table stakes)

**Avoids pitfalls:**
- Pitfall 1: AI hallucinations (RAG architecture, source citations)
- Pitfall 4: Liability ambiguity (audit trails, attribution, acknowledgment workflow)
- Pitfall 7: Hebrew language limitations (language handling tested early)
- Pitfall 10: HIPAA compliance gaps (BAA verification, encryption, audit logging)
- Pitfall 9: Prompt fragility (prompt versioning, testing suite)

**Research flags:** Minimal - well-documented patterns for prompt management and audit systems. Hebrew medical NLP may need deeper research if quality insufficient.

### Phase 2: Role-Specific Session Summaries
**Rationale:** Single-session summaries are lower risk than cross-session analysis (smaller context window, clearer source attribution, immediate clinician review). This phase validates the prompt system with 10 role variations and establishes user trust before advancing to more complex features.

**Delivers:**
- `SummaryEngine` with LLM-powered session summary generation
- 10 role-specific summary implementations (psychologist, psychiatrist, social worker, OT, etc.)
- API route `/api/ai/summary` for session summary generation
- UI integration in session forms with draft state and approval workflow
- Structured output validation via Zod schemas matching `SessionNotes` interface
- Fallback to heuristic summaries if LLM unavailable (graceful degradation)
- Golden Thread linking: notes reference treatment plan goals, track progress

**Addresses features:**
- Role-specific SOAP note generation (table stakes, MEDIUM complexity)
- Golden Thread linking (table stakes, MEDIUM complexity)
- Intervention tracking by role (table stakes, LOW complexity)

**Avoids pitfalls:**
- Pitfall 3: Role-conflation (role-tagged prompts, separate pipelines per discipline)
- Pitfall 9: Prompt fragility (prompt testing suite, version control)

**Uses stack:**
- Vercel AI SDK 6.x with `Output.object()` for structured SOAP notes
- Anthropic Claude claude-sonnet-4.5 for clinical text generation
- Zod schemas for runtime validation and hallucination detection

**Research flags:** Low - SOAP note generation is well-documented. May need phase-level research for Hebrew clinical terminology validation if issues arise.

### Phase 3: Cross-Session Pattern Recognition
**Rationale:** After establishing trust with single-session summaries, advance to cross-session analysis. This phase requires context window management (hierarchical summarization) and more sophisticated hallucination prevention (patterns must trace to specific sessions).

**Delivers:**
- `InsightEngine` with cross-session pattern analysis
- Insight prompt templates for pattern detection, progress tracking, engagement analysis
- API routes `/api/ai/insights` (generate and list) and `/api/insights/:id/acknowledge`
- Enhanced insights page displaying AI-generated patterns with source citations
- Hierarchical summarization strategy for context window management (sliding window with anchors)
- Pattern categories: mood trajectory, treatment response, engagement patterns, functional outcomes

**Addresses features:**
- Pattern recognition across sessions (table stakes, MEDIUM-HIGH complexity)
- Cross-session context awareness (table stakes, MEDIUM complexity)
- Longitudinal symptom visualization (differentiator, MEDIUM complexity)
- Automatic goal progress tracking (differentiator, MEDIUM complexity)

**Avoids pitfalls:**
- Pitfall 1: Hallucinations (explicit source citations for all patterns)
- Pitfall 6: Context window limitations (hierarchical summarization, sliding window with anchors)
- Pitfall 5: Confidence miscalibration (calibrate confidence display based on clinician acceptance rates)

**Implements architecture:**
- InsightEngine with multi-pass analysis (extract key events, then analyze patterns)
- Insight storage with source tracking and acknowledgment workflow

**Research flags:** Medium - Pattern detection algorithms well-documented, but context window management strategies may need phase-level research for optimization.

### Phase 4: Risk Assessment & Safety Features
**Rationale:** Risk assessment is safety-critical and requires dedicated architecture separate from general insight generation. This phase builds on established trust and infrastructure to add the most sensitive clinical feature. Conservative bias (over-report vs under-report) and mandatory human review are non-negotiable.

**Delivers:**
- Dedicated risk assessment engine separate from general LLM summaries
- Risk indicator extraction as structured data fields (suicidal_ideation: present/absent)
- Risk escalation detection across sessions with explicit source citations
- Risk prompt templates with explicit instruction: "Never minimize risk indicators"
- Prominent visual risk indicators requiring clinician acknowledgment
- Risk insight storage with mandatory action tracking

**Addresses features:**
- Risk assessment surfacing (table stakes, MEDIUM complexity, HIGH safety criticality)
- Predictive risk alerts (differentiator, VERY HIGH complexity) - limited implementation, requires extensive validation

**Avoids pitfalls:**
- Pitfall 2: Sycophantic risk assessment (explicit clinical prompts, conservative bias, structured extraction)
- Pitfall 4: Liability ambiguity (mandatory acknowledgment, action tracking)

**Safety considerations:**
- Separate risk detection from summary generation
- Use purpose-built risk classifiers, not general-purpose LLMs
- Mandatory human review for all risk-related outputs
- Conservative bias configuration: over-report rather than under-report
- Clear escalation pathways for identified risks

**Research flags:** High - Risk prediction algorithms require careful validation and clinical governance. May need extensive phase-level research including clinical literature review and validation studies.

### Phase 5: Multidisciplinary Synthesis & Advanced Features
**Rationale:** After solid foundation of role-specific summaries, cross-session patterns, and risk assessment, this phase adds TherapyDocs' unique differentiator: true multidisciplinary intelligence synthesizing insights across providers. Requires all previous phases working reliably.

**Delivers:**
- Multidisciplinary report generation combining insights from all providers treating same patient
- Cross-provider insight synthesis ("OT notes improved hand function while psychology notes show increased anxiety")
- Treatment gap detection (cross-reference diagnosis, treatment plan, actual interventions)
- Voice-to-SOAP integration with existing Deepgram diarization (`TranscriptEngine`)
- API route `/api/ai/transcript/analyze` for voice recording analysis
- UI integration in recording workflow with SOAP pre-fill from transcript

**Addresses features:**
- Multidisciplinary summary generation (differentiator, HIGH complexity)
- Cross-provider insight synthesis (differentiator, VERY HIGH complexity)
- Treatment gap detection (differentiator, HIGH complexity)
- Voice-to-SOAP with speaker diarization (differentiator, MEDIUM complexity)

**Uses stack:**
- Existing Deepgram integration for transcription with speaker diarization
- TranscriptEngine for voice-to-notes processing
- Enhanced multidisciplinary report generation building on existing `generateMultidisciplinaryReport`

**Avoids pitfalls:**
- Pitfall 3: Role-conflation (present each discipline's perspective separately, then coordination notes)
- Pitfall 11: Single-agent reasoning failures (multi-agent architecture for complex cross-provider analysis)

**Research flags:** High - Multidisciplinary synthesis is novel territory with sparse documentation. Likely needs phase-level research for multi-agent architectures and cross-domain reasoning strategies.

### Phase 6: Advanced Analytics & Hebrew Optimization (Post-MVP)
**Rationale:** After core features established and user trust earned, optimize for Israeli market and add advanced analytics requiring extensive validation.

**Delivers:**
- Hebrew clinical NLP optimization (HeRo or DictaBERT 2.0 integration)
- Therapeutic alliance insights (missed moments, connection patterns)
- Enhanced engagement pattern analysis with predictive outreach triggers
- Confidence score calibration based on clinical outcomes
- Supervisor-style session review (carefully framed as supportive)

**Defer beyond MVP:**
- Auto-diagnosis suggestion (creates liability, defer indefinitely)
- Prescriptive treatment recommendations (AI lacks full context)
- Fine-tuned models (requires large clinical datasets, increases HIPAA complexity)

### Phase Ordering Rationale

- **Safety before features**: Phase 1 establishes hallucination detection, liability tracking, and HIPAA compliance before generating any clinical content. These are architectural decisions that cannot be retrofitted.
- **Trust through transparency**: Early phases focus on explicit source citations, clinician review workflows, and audit trails. Trust must be earned before advancing to high-stakes features like risk assessment.
- **Simple to complex**: Single-session summaries (Phase 2) before cross-session analysis (Phase 3); role-specific before multidisciplinary (Phase 5). Each phase validates architecture before adding complexity.
- **Safety-critical features get dedicated phases**: Risk assessment (Phase 4) separated from general pattern recognition due to life-or-death stakes requiring specialized architecture.
- **Dependency-driven**: Prompt infrastructure (Phase 1) enables summaries (Phase 2); insight storage (Phase 3) enables advanced analytics (Phase 5); all phases build on preceding capabilities.
- **Differentiation after foundation**: Multidisciplinary synthesis (Phase 5) and Hebrew optimization (Phase 6) are unique differentiators but require solid foundation first.

### Research Flags

**Needs deeper research:**
- **Phase 3 (Cross-session patterns)**: Context window management strategies, hierarchical summarization optimization
- **Phase 4 (Risk assessment)**: Clinical validation of risk prediction algorithms, governance frameworks for safety-critical AI
- **Phase 5 (Multidisciplinary synthesis)**: Multi-agent architectures for cross-domain reasoning, novel territory with sparse documentation
- **Phase 6 (Hebrew optimization)**: Hebrew medical NLP capabilities, model availability and quality assessment

**Standard patterns (skip phase-level research):**
- **Phase 1 (Infrastructure)**: Prompt management, audit trails, HIPAA compliance - well-documented patterns
- **Phase 2 (Session summaries)**: SOAP note generation well-documented in clinical AI literature

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vercel AI SDK, Anthropic Claude, Zod all verified with official documentation; healthcare BAAs confirmed available; pricing transparent |
| Features | MEDIUM-HIGH | Based on multiple authoritative sources (JMIR research, market leaders Mentalyc/Upheal, APA guidelines); table stakes clear, differentiators identified |
| Architecture | HIGH | Verified against existing TherapyDocs codebase; patterns validated in industry literature; build order dependencies clear |
| Pitfalls | HIGH | Based on 2025-2026 clinical AI research, regulatory updates, professional guidelines; severity classifications grounded in clinical safety literature |

**Overall confidence:** HIGH

### Gaps to Address

- **Hebrew medical NLP quality**: Need validation that Hebrew clinical terminology extraction meets quality thresholds. If insufficient, implement quality-aware fallback to English translation with clear quality loss acknowledgment. **Validation during Phase 1**, optimization in Phase 6.

- **Risk prediction validation**: Predictive risk alerts (84-92% accuracy in research) require extensive clinical validation before deployment. 8-16% error rate potentially deadly. **Extensive validation process required during Phase 4**, potentially defer beyond MVP if validation timeline too long.

- **Confidence score calibration**: Current codebase shows arbitrary confidence scores (0.75, 0.85). Need calibration methodology against actual clinical outcomes (clinician acceptance rates, modification patterns). **Address during Phase 3**, refine in Phase 4.

- **Multi-agent architecture patterns**: Multidisciplinary synthesis and complex cross-provider reasoning may require multi-agent architectures (separate extraction, reasoning, validation agents). Literature emerging but not standardized. **Deep research during Phase 5 planning**.

- **BAA negotiation timeline**: Anthropic BAA via AWS Bedrock/direct requires negotiation. OpenAI for Healthcare alternative if timeline critical. **Initiate BAA process during Phase 1 kickoff**, not during implementation.

- **Token cost optimization**: Initial cost estimates conservative ($21-69/month for 1,000 sessions). Actual costs depend on prompt caching effectiveness, batch processing adoption, and context window usage. **Monitor during Phase 2-3**, optimize if exceeds budget.

## Sources

### Primary (HIGH confidence)
- **Vercel AI SDK Documentation** (ai-sdk.dev) — AI SDK 6.0 structured outputs, provider abstraction, Next.js integration patterns
- **Anthropic Claude for Healthcare** (anthropic.com/news/healthcare-life-sciences) — HIPAA BAA availability, healthcare-specific features, ICD-10/FHIR integrations, pricing
- **npj Digital Medicine - Clinical AI Safety Framework** (nature.com/articles/s41746-025-01670-7) — Hallucination rates (1.47-20%), safety assessment frameworks, clinical validation requirements
- **JMIR Mental Health - AI Psychosis and Sycophancy** (mental.jmir.org/2025/1/e85799/) — Sycophantic risk minimization, mental health AI safety considerations
- **Medical Economics - AI Malpractice Liability** (medicaleconomics.com) — 14% increase in AI-related malpractice claims, liability allocation challenges
- **PMC - Mitigating AI Hallucinations** (pmc.ncbi.nlm.nih.gov/articles/PMC10552880/) — Hallucination detection strategies, RAG architecture patterns

### Secondary (MEDIUM confidence)
- **Mentalyc AI Progress Notes** (mentalyc.com) — Market leader features, role-specific documentation differences
- **Upheal Golden Thread Blog** (upheal.io/blog/the-golden-thread) — Golden Thread implementation patterns for therapy documentation
- **JMIR Medical Informatics - Suicide Risk Prediction** (medinform.jmir.org/2026/1/e74240) — 84-92% accuracy for 30-day suicide risk prediction, algorithm validation
- **Healthcare IT News - Mental Health AI 2026** (healthcareitnews.com) — Industry trends, adoption patterns, market analysis
- **MLOps/LLMOps Roadmap 2026** (Medium) — Production-grade AI system architecture patterns
- **LLM Prompt Management Playbook 2025** (dev.to) — Prompt versioning, testing, and management strategies

### Tertiary (LOW confidence, needs validation)
- **Hebrew Medical Language Model** (emergentmind.com) — HeRo model capabilities; need validation of clinical terminology quality
- **Multi-Agent SOAP Note Architecture** (arxiv.org/html/2508.21803) — Novel pattern for clinical problem detection; research-grade, not production-proven

---
*Research completed: 2026-01-22*
*Ready for roadmap: yes*
