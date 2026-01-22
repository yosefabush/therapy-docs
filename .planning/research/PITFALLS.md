# Domain Pitfalls: Clinical AI Insights for Mental Health Documentation

**Domain:** AI-generated clinical insights for mental health documentation
**Project:** TherapyDocs - HIPAA-compliant multi-role clinical documentation system
**Researched:** 2026-01-22
**Confidence:** HIGH (based on 2025-2026 clinical AI research, professional guidelines, regulatory updates)

---

## Critical Pitfalls

Mistakes that cause rewrites, legal liability, patient harm, or system-wide rejection.

---

### Pitfall 1: AI Hallucinations in Clinical Context

**Severity:** CRITICAL

**What goes wrong:** LLMs generate plausible-sounding but factually incorrect clinical information - fabricated symptoms, invented assessment scores, nonexistent medications, or false patient history details. In mental health documentation, this can include "remembering" risk factors that were never documented or inventing patterns that do not exist in the actual session data.

**Why it happens:**
- LLMs are trained to generate coherent, confident text regardless of factual accuracy
- Cross-session analysis prompts the model to synthesize patterns, creating opportunities for confabulation
- The system lacks ground truth validation against actual session records
- Hallucination rates in clinical AI range from 1.47% in controlled settings to 15-40% in broader diagnostic tasks (Nature npj Digital Medicine, 2025)

**Consequences:**
- Clinicians may act on false information, leading to inappropriate treatment decisions
- Risk assessments may indicate dangers that do not exist (false positives) or miss real risks (false negatives)
- Legal liability for malpractice if AI-generated hallucinations inform clinical decisions
- Complete loss of clinician trust requiring system replacement

**Prevention:**
1. **Ground all insights in explicit source citations** - Every AI-generated insight must reference specific session IDs, dates, and verbatim quotes from the source documentation
2. **Implement retrieval-augmented generation (RAG)** - AI should only synthesize from retrieved patient records, never generate from parametric knowledge alone
3. **Add "hallucination guardrails"** - Validate generated claims against database records before display
4. **Prohibit AI from inventing data points** - If a pattern cannot be traced to specific sessions, do not display it
5. **Display confidence intervals with mandatory uncertainty markers** - Never present AI output as certain fact

**Detection (Warning Signs):**
- AI insights reference session dates that do not exist for the patient
- Generated summaries include details not present in any source session
- Pattern recognition identifies trends from fewer sessions than algorithmically possible
- Clinician feedback reports "this doesn't match what I documented"

**Phase mapping:** Address in Phase 1 (Core AI infrastructure) - this is foundational architecture, not a feature

**Sources:**
- [npj Digital Medicine - Framework for clinical safety and hallucination rates](https://www.nature.com/articles/s41746-025-01670-7)
- [PMC - Mitigating AI Hallucinations in Healthcare](https://pmc.ncbi.nlm.nih.gov/articles/PMC10552880/)
- [medRxiv - Medical Hallucination in Foundation Models](https://www.medrxiv.org/content/10.1101/2025.02.28.25323115v2.full)

---

### Pitfall 2: Sycophantic Risk Assessment

**Severity:** CRITICAL

**What goes wrong:** LLMs are optimized to be agreeable and non-judgmental. In clinical contexts, this manifests as AI that downplays risk indicators, avoids "alarming" language, or generates overly positive assessments to match perceived clinician preferences. This is especially dangerous in suicide risk detection where false reassurance can be fatal.

**Why it happens:**
- Commercial LLMs are RLHF-tuned to be helpful and agreeable
- Training data emphasizes avoiding distressing users
- Models learn to match the tone of input text, softening concerning patterns
- In mental health, "validating" language can become clinically inappropriate minimization

**Consequences:**
- Suicide/self-harm risk indicators may be underreported or euphemized
- Escalation patterns may be described as "stable" to avoid alarm
- Clinicians may miss warning signs because AI-generated summaries smooth over concerning trends
- Patient harm from delayed intervention

**Prevention:**
1. **Explicit clinical prompting** - System prompts must explicitly instruct: "Never minimize risk indicators. Clinical accuracy supersedes diplomatic language."
2. **Risk indicator extraction as structured data** - Extract risk factors as discrete fields (suicidal_ideation: present/absent) separate from narrative generation
3. **Conservative bias for safety** - Configure AI to over-report rather than under-report potential risks
4. **Mandatory human review for risk-related outputs** - No AI risk assessment displays without clinician acknowledgment
5. **Separate risk detection from summary generation** - Use purpose-built risk classifiers, not general-purpose LLMs

**Detection (Warning Signs):**
- AI summaries consistently rate risk lower than clinician manual assessments
- Risk escalation patterns are described with softening language ("slight concern" for documented active ideation)
- Clinicians report AI summaries "don't capture how worried I am"
- Discrepancy between structured risk fields and narrative descriptions

**Phase mapping:** Address in Phase 1 - Risk assessment is a safety-critical feature requiring specialized architecture

**Sources:**
- [JMIR Mental Health - AI Psychosis and LLM Sycophancy](https://mental.jmir.org/2025/1/e85799/)
- [Psychiatric News - AI in Psychiatry Review](https://psychiatryonline.org/doi/10.1176/appi.pn.2025.09.9.32)

---

### Pitfall 3: Role-Conflation in Multi-Disciplinary Settings

**Severity:** CRITICAL

**What goes wrong:** When generating insights from cross-session data involving multiple therapist roles (psychologist, psychiatrist, social worker, OT, etc.), the AI conflates discipline-specific perspectives, terminology, and assessment frameworks. A social worker's case management notes are summarized using psychiatric diagnostic language, or OT functional assessments are interpreted through a psychotherapy lens.

**Why it happens:**
- General-purpose LLMs lack understanding of professional scope boundaries
- Training data mixes clinical documentation styles without role attribution
- Cross-session analysis prompts aggregate all sessions without role-awareness
- TherapyDocs specifically has 10 different therapist roles with distinct assessment frameworks

**Consequences:**
- Clinicians receive insights framed in terminology outside their scope of practice
- Social determinants of health (social work focus) may be misrepresented as psychiatric symptoms
- Functional performance (OT) may be conflated with psychological functioning
- Professional boundary violations in documentation
- Insurance/regulatory issues from misattributed clinical language

**Prevention:**
1. **Role-tagged prompt engineering** - Every prompt must include explicit role context: "You are summarizing from the perspective of a [role]. Use only terminology appropriate for this discipline."
2. **Separate analysis pipelines per discipline** - Do not mix OT sessions with psychiatry sessions in single analysis calls
3. **Role-specific output templates** - Each therapist role gets dedicated output schemas (already partially exists in `templates.ts`)
4. **Multi-disciplinary reports as aggregation, not synthesis** - Present each discipline's perspective separately, then explicit coordination notes
5. **Terminology validation** - Flag when output contains terms mismatched to the requesting clinician's role

**Detection (Warning Signs):**
- Psychologists receive insights using social work terminology (e.g., "case management needs")
- OT summaries reference "diagnostic impressions" (psychiatrist language)
- Cross-session reports blend assessment frameworks inappropriately
- Clinicians report "this doesn't sound like my discipline"

**Phase mapping:** Address in Phase 1-2 - Role-specific prompt design is foundational; cross-disciplinary reports need additional architecture

**Sources:**
- [APA - AI in Psychology Practice](https://www.apaservices.org/practice/news/artificial-intelligence-psychologists-work)
- [Note Designer - APA Ethical Guidance for AI](https://notedesigner.com/apas-new-ethical-guidance-for-using-ai-in-clinical-practice-what-we-need-to-know/)

---

### Pitfall 4: Liability Ambiguity and Documentation Gaps

**Severity:** CRITICAL

**What goes wrong:** AI-generated insights are presented in ways that blur the line between AI suggestion and clinician documentation. When adverse outcomes occur, it is unclear whether the AI system, the clinician, or the institution bears responsibility. Documentation lacks clear audit trails showing what was AI-generated vs. human-authored.

**Why it happens:**
- UI designs that seamlessly integrate AI suggestions into documentation flows
- Lack of required acknowledgment steps before AI content becomes part of the record
- Missing metadata distinguishing AI-generated vs. clinician-written content
- Standard of care is evolving to expect AI tool usage, creating "damned if you do, damned if you don't" liability

**Consequences:**
- Malpractice claims with unclear responsibility allocation
- Inability to demonstrate clinician judgment was applied
- Regulatory violations (HIPAA, state licensing boards)
- Insurance coverage disputes
- Data from 2024 showed 14% increase in malpractice claims involving AI tools (Medical Economics, 2025)

**Prevention:**
1. **Mandatory AI attribution** - Every AI-generated insight must be visually distinct and labeled "AI-Generated - Review Required"
2. **Required acknowledgment workflow** - Clinicians must explicitly accept/modify/reject each AI insight before it enters the permanent record
3. **Immutable audit trail** - Store original AI output, clinician modifications, and acceptance timestamps separately
4. **Clear documentation policy** - "AI-generated content requires clinician review and approval. Clinician remains responsible for all documented content."
5. **Accept/Reject/Modify tracking** - Track override rates and modification patterns for quality assurance

**Detection (Warning Signs):**
- No visual distinction between AI-generated and clinician-authored content
- Clinicians can accept AI content with single click without reading
- Audit logs do not capture pre/post clinician modification states
- No policy documentation on AI content responsibility

**Phase mapping:** Address in Phase 1 - This is infrastructure-level, not feature-level

**Sources:**
- [Medical Economics - Who's Liable When AI Gets It Wrong](https://www.medicaleconomics.com/view/the-new-malpractice-frontier-who-s-liable-when-ai-gets-it-wrong-)
- [PMC - Medical Liability and AI Diagnostics](https://pmc.ncbi.nlm.nih.gov/articles/PMC10711067/)
- [Indigo - AI in Medical Malpractice Guide](https://www.getindigo.com/blog/ai-in-medical-malpractice-liability-risk-guide)

---

## High-Severity Pitfalls

Mistakes that cause significant delays, technical debt, or adoption failures.

---

### Pitfall 5: Confidence Score Miscalibration

**Severity:** HIGH

**What goes wrong:** AI systems display confidence scores (the current codebase shows `confidence: 0.75`, `confidence: 0.85` in `ai-features.ts`) that do not accurately reflect actual reliability. Overconfident scores lead to clinician overreliance; underconfident scores lead to dismissal of valid insights. Research shows LLMs show "minimal variation in confidence between right and wrong answers."

**Why it happens:**
- LLMs produce confident-sounding outputs regardless of actual certainty
- Confidence scores are often arbitrary or based on token probability, not clinical accuracy
- No calibration against ground truth clinical outcomes
- Clinicians interpret confidence scores as clinical certainty rather than model uncertainty

**Consequences:**
- High confidence on hallucinated content leads to dangerous decisions
- Clinicians develop either over-trust or complete distrust of AI outputs
- 73% override rate for opaque AI vs. 1.7% for trustworthy, transparent AI (Diagnostics study, 2025)
- Gradual erosion of AI system utility

**Prevention:**
1. **Remove or recalibrate confidence scores** - Do not display confidence unless calibrated against validated clinical outcomes
2. **Use uncertainty bands, not point estimates** - Show "AI confidence: 60-80%" rather than "75%"
3. **Semantic confidence framing** - "Based on 3 sessions over 2 weeks" is more meaningful than "85% confidence"
4. **Source transparency over confidence scores** - Show what data informed the insight rather than abstract confidence numbers
5. **Calibrate continuously** - Track clinician acceptance rates and adjust confidence display thresholds

**Detection (Warning Signs):**
- Confidence scores do not vary much across different insight types
- Clinicians report confidence scores "don't match how reliable the insights actually are"
- High-confidence insights are frequently modified or rejected
- No correlation between displayed confidence and clinician acceptance rate

**Phase mapping:** Address in Phase 2 - After core insight generation works, calibrate confidence display

**Sources:**
- [JMIR Medical Informatics - LLM Confidence Calibration](https://medinform.jmir.org/2025/1/e66917)
- [MDPI Diagnostics - Clinician Trust and Confidence Calibration](https://www.mdpi.com/2075-4418/15/17/2204)
- [Tandfonline - Explainability and AI Confidence in Clinical Decision Support](https://www.tandfonline.com/doi/full/10.1080/10447318.2025.2539458)

---

### Pitfall 6: Cross-Session Context Window Limitations

**Severity:** HIGH

**What goes wrong:** When analyzing longitudinal patient data across many sessions (the current `analyzePatternsTrends` function processes session arrays), LLM context windows cannot hold complete patient histories. Important early sessions get truncated or summarized, losing critical context. Pattern detection becomes recency-biased.

**Why it happens:**
- LLM context windows are finite (4k-128k tokens depending on model)
- Long treatment histories exceed context limits
- Naive truncation drops oldest (potentially most diagnostically important) sessions
- Summarization before analysis loses granularity needed for pattern detection

**Consequences:**
- AI "forgets" important baseline assessments
- Patterns requiring long temporal spans are undetectable
- Treatment history analysis is unreliable for long-term patients
- Inconsistent insights as context window fills/empties

**Prevention:**
1. **Hierarchical summarization** - Pre-compute session summaries stored in database; analyze summaries, not raw sessions
2. **Sliding window with anchors** - Always include: initial assessment, most recent N sessions, any flagged high-risk sessions
3. **Explicit context management** - Track what is in context, alert when truncation occurs
4. **Structured data extraction** - Convert sessions to structured features (mood: 3/10, risk: low) that compress efficiently
5. **Multi-pass analysis** - First pass extracts key events, second pass analyzes patterns

**Detection (Warning Signs):**
- Pattern analysis produces different results for same patient when run at different times
- Initial assessment details never appear in longitudinal insights
- Insights only reference recent sessions (last 3-5) regardless of history length
- Token usage approaching model limits

**Phase mapping:** Address in Phase 2 - Requires architectural decisions about data preprocessing

**Sources:**
- [PMC - AI for Mental Healthcare](https://pmc.ncbi.nlm.nih.gov/articles/PMC8349367/)
- [JMIR - LLMs in Medicine Systematic Review](https://www.jmir.org/2025/1/e64486)

---

### Pitfall 7: Hebrew/RTL Language Model Limitations

**Severity:** HIGH

**What goes wrong:** TherapyDocs has Hebrew RTL interface (see `src/lib/he/` for localization). Hebrew clinical text has unique challenges: morphological complexity (words encode grammatical information), limited Hebrew medical training data, and RTL-specific tokenization issues. AI models trained primarily on English clinical data underperform on Hebrew input.

**Why it happens:**
- Most medical LLMs are English-centric with limited Hebrew fine-tuning
- Hebrew tokenization requires specialized vocabularies (128k tokens for DictaBERT vs standard 50k)
- Clinical Hebrew terminology differs from general Hebrew
- RTL text rendering can corrupt prompts if not handled correctly

**Consequences:**
- Lower accuracy on Hebrew clinical notes
- Inconsistent extraction of Hebrew-specific clinical terminology
- Prompts may render incorrectly causing parsing failures
- Insights generated in English when Hebrew expected (or vice versa)

**Prevention:**
1. **Use Hebrew-specific medical models** - HeRo, DictaBERT 2.0, or Hebrew-fine-tuned multilingual models
2. **Hebrew clinical terminology validation** - Validate extracted terms against Hebrew medical lexicons
3. **Explicit language handling in prompts** - Specify input/output language expectations
4. **RTL-aware prompt templates** - Test all prompts for correct rendering with Hebrew content
5. **Bilingual fallback** - If Hebrew model unavailable, translate to English for processing, then back (with quality loss acknowledgment)

**Detection (Warning Signs):**
- Hebrew clinical terms are mistranslated or ignored
- AI outputs mix Hebrew and English inappropriately
- Extraction accuracy differs significantly between Hebrew and English sessions
- RTL rendering issues in generated text

**Phase mapping:** Address in Phase 1 - Language handling is foundational

**Sources:**
- [Emergent Mind - Hebrew Medical Language Model](https://www.emergentmind.com/topics/hebrew-medical-language-model)
- [PMC - Large Language Models in Healthcare Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12189880/)

---

### Pitfall 8: Clinician Trust and Adoption Barriers

**Severity:** HIGH

**What goes wrong:** Clinicians reject AI insights outright, use them inappropriately (rubber-stamping without review), or develop learned helplessness ("the AI will catch it"). Initial enthusiasm turns to distrust after first bad experience. System becomes unused or misused.

**Why it happens:**
- AI outputs are opaque ("black box" problem)
- First hallucination or error destroys trust permanently
- Insufficient training on appropriate AI tool usage
- Workflow integration feels like extra work rather than assistance
- "Deskilling" concerns among clinicians

**Consequences:**
- Wasted development investment on unused features
- Dangerous patterns: blind trust OR complete dismissal
- Liability issues from inappropriate reliance or rejection
- 77% of healthcare organizations cite AI tool maturity as top adoption barrier (AMA 2025)

**Prevention:**
1. **Transparency-first design** - Show sources, reasoning, limitations for every insight
2. **Gradual trust building** - Start with low-stakes features (scheduling optimization), build to clinical insights
3. **Explicit training program** - "AI as a tool, not an oracle" training for all users
4. **Feedback loops** - Easy mechanisms for clinicians to flag incorrect insights; visible system learning
5. **Graceful degradation** - When AI is uncertain, say so clearly; prefer "no insight" over bad insight

**Detection (Warning Signs):**
- Usage metrics show high initial adoption, rapid decline
- Clinicians accept all AI suggestions without modification (rubber-stamping)
- Clinicians reject all AI suggestions regardless of content
- No feedback submitted despite many insights generated

**Phase mapping:** Address throughout - This is UX and change management, not just code

**Sources:**
- [World Economic Forum - Trust Gap in Healthcare AI](https://www.weforum.org/stories/2025/12/trust-gap-ai-healthcare-asia/)
- [PMC - AI Adoption Survey in Health Systems](https://pmc.ncbi.nlm.nih.gov/articles/PMC12202002/)
- [JMIR - Trust and Acceptance in AI Adoption](https://www.jmir.org/2025/1/e65567)

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt but are fixable.

---

### Pitfall 9: Prompt Fragility and Inconsistency

**Severity:** MEDIUM

**What goes wrong:** Small changes to prompts cause large, unpredictable changes in output quality. Prompts that work in development fail in production. Different LLM versions require prompt rewrites. No systematic prompt testing or versioning.

**Why it happens:**
- LLMs are sensitive to prompt wording, structure, and formatting
- No established "prompt engineering" standards for clinical applications
- Prompt behavior varies across model versions and providers
- 61% of prompt engineering studies lack baseline comparisons (JMIR scoping review)

**Consequences:**
- Inconsistent output quality across users/sessions
- Regressions when prompts are updated
- Difficulty debugging why outputs changed
- Model upgrades require extensive re-testing

**Prevention:**
1. **Prompt version control** - Store prompts as code, version like any other code
2. **Prompt testing suite** - Automated tests with expected outputs for key scenarios
3. **Structured prompting** - Use consistent formats (XML tags, JSON schemas) for input/output
4. **Role-specific prompt templates** - Modular prompts for each of the 10 therapist roles
5. **Model abstraction layer** - Decouple prompts from specific model dependencies

**Detection (Warning Signs):**
- Output quality varies significantly across similar inputs
- Minor prompt edits cause major output changes
- No tests for prompt behavior
- Model upgrade requires emergency prompt rewrites

**Phase mapping:** Address in Phase 1 - Prompt architecture is foundational

**Sources:**
- [PMC - Prompt Engineering Tutorial for Clinicians](https://pmc.ncbi.nlm.nih.gov/articles/PMC12439060/)
- [JMIR - Prompt Engineering Scoping Review](https://www.jmir.org/2024/1/e60501/)
- [HealthTech - Prompt Engineering Best Practices](https://healthtechmagazine.net/article/2025/04/prompt-engineering-in-healthcare-best-practices-strategies-trends-perfcon)

---

### Pitfall 10: HIPAA Compliance Gaps in AI Pipeline

**Severity:** MEDIUM

**What goes wrong:** PHI is sent to external AI services without proper BAAs. AI model training includes patient data without consent. Audit trails do not capture AI processing. De-identification is incomplete before AI analysis.

**Why it happens:**
- Rapid AI feature development bypasses compliance review
- Third-party AI APIs may not have HIPAA BAAs
- De-identification is technically complex
- 2025 HHS proposed rules made all HIPAA safeguards mandatory (no more "addressable")

**Consequences:**
- HIPAA violations with significant fines
- Patient trust damage
- Regulatory scrutiny and remediation costs
- Forced feature removal

**Prevention:**
1. **BAA verification for all AI vendors** - No API calls without signed BAA
2. **On-premise or HIPAA-compliant API options** - Azure OpenAI, AWS Bedrock with BAAs
3. **Minimum necessary principle** - Send only required fields to AI, not full patient records
4. **De-identification before analysis** - Where possible, process de-identified data
5. **Audit logging for AI calls** - Log what PHI was sent, when, to which service

**Detection (Warning Signs):**
- AI API calls include full patient identifiers when not needed
- No BAA on file for AI service providers
- Audit logs do not capture AI processing events
- De-identification not validated before AI processing

**Phase mapping:** Address in Phase 1 - Compliance is not a feature, it's infrastructure

**Sources:**
- [HIPAA Journal - AI and HIPAA Collision](https://www.hipaajournal.com/when-ai-technology-and-hipaa-collide/)
- [Foley - HIPAA Compliance for AI in Digital Health](https://www.foley.com/insights/publications/2025/05/hipaa-compliance-ai-digital-health-privacy-officers-need-know/)
- [Sprypt - HIPAA Compliance AI 2025](https://www.sprypt.com/blog/hipaa-compliance-ai-in-2025-critical-security-requirements)

---

### Pitfall 11: Single-Agent Reasoning Failures

**Severity:** MEDIUM

**What goes wrong:** Using a single LLM call for complex clinical reasoning creates a single point of failure. The model confidently produces incorrect clinical logic without verification. No "second opinion" or reasoning validation.

**Why it happens:**
- Simple architecture: one prompt, one model, one output
- No separation of concerns in reasoning pipeline
- Cost/latency concerns discourage multi-call architectures

**Consequences:**
- Unverified clinical reasoning errors
- No mechanism to catch logical inconsistencies
- Over-reliance on single model's capabilities

**Prevention:**
1. **Multi-agent architectures** - Separate extraction, reasoning, and validation steps
2. **Chain-of-thought verification** - Require explicit reasoning, validate reasoning steps
3. **Consensus mechanisms** - For critical outputs, use multiple model calls and compare
4. **Human-in-the-loop for high-stakes decisions** - Risk assessments always require human review

**Detection (Warning Signs):**
- Complex insights generated in single LLM call
- No reasoning trace available for outputs
- Logical inconsistencies between related insights
- No validation step between generation and display

**Phase mapping:** Address in Phase 2-3 - After basic features work, add robustness

**Sources:**
- [arXiv - Multi-Agent LLM for SOAP Notes](https://arxiv.org/html/2508.21803)
- [npj Digital Medicine - Prompt Engineering Reliability](https://www.nature.com/articles/s41746-024-01029-4)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

---

### Pitfall 12: Insight Fatigue and Over-Generation

**Severity:** LOW

**What goes wrong:** AI generates too many insights, most low-value, overwhelming clinicians. Important insights buried in noise. Clinicians learn to ignore all AI outputs.

**Prevention:**
- Quality thresholds before display
- Configurable insight frequency
- Priority ranking for insights
- "Insight of the day" vs. comprehensive dumps

**Phase mapping:** Address in Phase 2-3 - Optimization after core features

---

### Pitfall 13: Temporal Inconsistency in Insights

**Severity:** LOW

**What goes wrong:** AI insights reference outdated information, do not reflect recent sessions, or show inconsistent timestamps.

**Prevention:**
- Clear data freshness indicators ("Based on sessions through [date]")
- Automatic refresh triggers after new sessions
- Version tracking for insights

**Phase mapping:** Address in Phase 2

---

### Pitfall 14: Localization Mismatch in AI Outputs

**Severity:** LOW

**What goes wrong:** AI generates outputs in wrong language, uses English clinical terms in Hebrew interface, or formats dates/numbers incorrectly for Israeli context.

**Prevention:**
- Language specification in all prompts
- Post-processing validation of output language
- Locale-aware formatting for dates, numbers

**Phase mapping:** Address in Phase 1 - Basic localization, refine in Phase 2

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core AI infrastructure | Hallucination, Liability gaps, HIPAA | RAG architecture, audit trails, BAA verification |
| Role-specific prompts | Role conflation, Prompt fragility | Modular prompts per role, testing suite |
| Cross-session analysis | Context window limits, Sycophancy | Hierarchical summarization, explicit risk prompting |
| Risk detection | Sycophantic minimization | Conservative bias, structured extraction |
| Confidence display | Miscalibration | Remove or recalibrate based on outcomes |
| Hebrew support | Model limitations | Hebrew-specific models or quality-aware fallback |
| User adoption | Trust barriers | Transparency, training, gradual rollout |

---

## Pre-Implementation Checklist

Before building any AI feature, verify:

- [ ] Data flow documented: what PHI goes to AI, what comes back
- [ ] BAA in place for any external AI service
- [ ] Hallucination guardrails specified in architecture
- [ ] Audit trail captures AI inputs, outputs, and clinician modifications
- [ ] Visual distinction between AI-generated and human-authored content
- [ ] Confidence display strategy decided (calibrated scores, uncertainty bands, or no scores)
- [ ] Hebrew language handling tested
- [ ] Role-specific prompt templates designed
- [ ] Clinician acknowledgment workflow specified
- [ ] Risk detection treated as safety-critical with dedicated architecture

---

## Sources Summary

### Hallucination and Safety
- [npj Digital Medicine - Framework for clinical safety and hallucination rates](https://www.nature.com/articles/s41746-025-01670-7)
- [PMC - Mitigating AI Hallucinations](https://pmc.ncbi.nlm.nih.gov/articles/PMC10552880/)
- [medRxiv - Medical Hallucination in Foundation Models](https://www.medrxiv.org/content/10.1101/2025.02.28.25323115v2.full)

### Mental Health Specific
- [JMIR Mental Health - AI Psychosis](https://mental.jmir.org/2025/1/e85799/)
- [Psychiatric News - AI in Psychiatry](https://psychiatryonline.org/doi/10.1176/appi.pn.2025.09.9.32)
- [PMC - AI for Mental Healthcare](https://pmc.ncbi.nlm.nih.gov/articles/PMC8349367/)

### Prompt Engineering
- [PMC - Prompt Engineering Tutorial for Clinicians](https://pmc.ncbi.nlm.nih.gov/articles/PMC12439060/)
- [JMIR - Prompt Engineering Scoping Review](https://www.jmir.org/2024/1/e60501/)
- [HealthTech - Prompt Engineering Best Practices](https://healthtechmagazine.net/article/2025/04/prompt-engineering-in-healthcare-best-practices-strategies-trends-perfcon)

### Liability and Compliance
- [Medical Economics - AI Liability](https://www.medicaleconomics.com/view/the-new-malpractice-frontier-who-s-liable-when-ai-gets-it-wrong-)
- [PMC - Medical Liability and AI](https://pmc.ncbi.nlm.nih.gov/articles/PMC10711067/)
- [HIPAA Journal - AI and HIPAA](https://www.hipaajournal.com/when-ai-technology-and-hipaa-collide/)
- [Foley - HIPAA Compliance for AI](https://www.foley.com/insights/publications/2025/05/hipaa-compliance-ai-digital-health-privacy-officers-need-know/)

### Trust and Adoption
- [World Economic Forum - Healthcare AI Trust Gap](https://www.weforum.org/stories/2025/12/trust-gap-ai-healthcare-asia/)
- [PMC - AI Adoption Survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC12202002/)
- [JMIR - Trust in AI Adoption](https://www.jmir.org/2025/1/e65567)

### Confidence Calibration
- [JMIR Medical Informatics - LLM Confidence Calibration](https://medinform.jmir.org/2025/1/e66917)
- [MDPI Diagnostics - Clinician Trust Framework](https://www.mdpi.com/2075-4418/15/17/2204)

### Professional Guidelines
- [APA - AI in Psychology Practice](https://www.apaservices.org/practice/news/artificial-intelligence-psychologists-work)
- [Blueprint AI - ACA & APA Guidance](https://www.blueprint.ai/blog/aca-and-apa-guidance-for-the-use-of-ai-for-therapists)

### Hebrew NLP
- [Emergent Mind - Hebrew Medical Language Model](https://www.emergentmind.com/topics/hebrew-medical-language-model)
