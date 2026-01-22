# Feature Landscape: Clinical AI Insights for TherapyDocs

**Domain:** Clinical AI documentation and insights for mental health professionals
**Researched:** 2026-01-22
**Confidence:** MEDIUM-HIGH (based on multiple authoritative sources, current market analysis)

## Executive Summary

Clinical AI insight systems for mental health documentation have matured significantly. The core value proposition is reducing the 2-3 hours/day therapists spend on documentation while improving clinical outcomes through pattern recognition across sessions. Key differentiators are emerging around role-specific intelligence, "Golden Thread" continuity linking assessments to treatment plans to progress notes, and cross-session patient analysis.

For TherapyDocs' 10 therapist roles, the challenge is generating summaries that emphasize what each profession cares about (psychiatrists: medication effects; OTs: functional performance; social workers: resource connections) while maintaining the Golden Thread across all providers in a multidisciplinary care team.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Clinical Safety Notes |
|---------|--------------|------------|----------------------|
| **Role-specific SOAP note generation** | Every AI therapy note tool supports SOAP/DAP/BIRP formats; role-specific tailoring is now baseline expectation | Medium | Must generate drafts, not final notes; clinician review is non-negotiable |
| **Clinician review and approval workflow** | HIPAA requires human oversight; 42% of flagged patients get assessment when alerts are interruptive vs 4% passive | Low | AI-generated content must be clearly marked as draft requiring approval |
| **Hallucination detection/flagging** | 1.47%-20% hallucination rates reported; clinicians need confidence indicators | High | Flag fabricated information, missing content, and low-confidence assertions |
| **Golden Thread linking** | Notes must connect to treatment plan goals; insurance audits and clinical continuity require this | Medium | Every note should reference relevant goals; progress toward goals must be trackable |
| **Risk assessment surfacing** | 77% of suicide decedents had contact with primary care in year before death; risk must be visible | Medium | Never auto-dismiss risk; always escalate risk indicators to clinician attention |
| **Cross-session context awareness** | AI must know patient history to generate meaningful summaries | Medium | Must pull from prior sessions without hallucinating false history |
| **Intervention tracking by role** | Each role uses different interventions (CBT for psychologists, medication management for psychiatrists, case management for social workers) | Low | Must accurately reflect interventions actually provided, not assumed |
| **Progress note templates per role** | Psychologists need intervention focus; psychiatrists need medication focus; OTs need functional performance focus | Low | Templates must match professional standards for each discipline |
| **HIPAA-compliant data handling** | BAA required for any PHI processing; encryption at rest and in transit | Medium | No recordings stored after transcription; no training on patient data |
| **Audit trail for AI-generated content** | Compliance requires knowing what was AI-generated vs human-written | Low | Clear provenance tracking for all AI contributions |

### Role-Specific Summary Expectations (Table Stakes)

Each therapist role expects their AI summaries to emphasize different aspects:

| Role | Summary Focus | Key Data Points |
|------|---------------|-----------------|
| Psychologist | Cognitive patterns, behavioral observations, intervention effectiveness | PHQ-9/GAD-7 scores, CBT/DBT homework compliance, symptom trajectory |
| Psychiatrist | Medication response, side effects, mental status | Current meds, dosage changes, labs, sleep/appetite/energy |
| Social Worker | Social determinants, resource connections, care coordination | Housing, employment, family support, referrals made |
| Occupational Therapist | Functional performance, ADL/IADL progress, occupational goals | COPM scores, activity tolerance, skill acquisition |
| Art Therapist | Creative process, symbolic content, emotional expression | Media used, artwork themes, verbal processing |
| Music Therapist | Musical engagement, emotional response, therapeutic goals | Instruments used, improvisation quality, lyric themes |
| Family Therapist | Family dynamics, communication patterns, system changes | Who attended, alliances observed, structural interventions |
| School Counselor | Academic impact, behavioral observations, developmental context | Grade impact, peer relationships, teacher reports |
| Addiction Counselor | Substance use status, recovery progress, trigger identification | Days sober, cravings, meeting attendance, relapse risk |
| Clinical Counselor | Therapeutic relationship, presenting concerns, goal progress | Session themes, homework completion, coping skill use |

---

## Differentiators

Features that set product apart. Not expected, but valued and create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multidisciplinary summary generation** | Combine insights from all providers treating same patient into unified view | High | TherapyDocs' existing `generateMultidisciplinaryReport` is foundation; enhance with AI synthesis |
| **Pattern recognition across sessions** | Surface mood trends, engagement patterns, risk escalation automatically | High | Existing `analyzePatternsTrends` detects basic patterns; expand to predictive analytics |
| **Therapeutic alliance insights** | "Alliance Genie" style - surface missed moments, connection patterns | High | Differentiated feature; no direct competitor equivalent for multidisciplinary |
| **Predictive risk alerts** | Flag patients at risk of crisis before escalation (30-day suicide risk prediction achieves 84-92% accuracy) | Very High | Research-grade capability; requires validation and careful clinical governance |
| **Longitudinal symptom visualization** | Show symptom trajectory across weeks/months with trend analysis | Medium | Visual dashboards of PHQ-9, GAD-7 trends over time |
| **Treatment gap detection** | Identify when patient isn't receiving indicated interventions | High | Cross-reference diagnosis, treatment plan, and actual interventions received |
| **Engagement pattern analysis** | Surface attendance patterns, no-show predictions, outreach triggers | Medium | Existing `analyzeEngagement` function; enhance with predictive capability |
| **Cross-provider insight synthesis** | "The OT notes improved hand function while psychology notes show increased anxiety - is there a connection?" | Very High | True multidisciplinary intelligence; unique to TherapyDocs |
| **Voice-to-SOAP with speaker diarization** | Existing Deepgram integration; map therapist/patient speech to appropriate SOAP sections | Medium | Leverage existing `DiarizedTranscript` infrastructure |
| **Automatic goal progress tracking** | Track progress toward treatment goals without manual entry | Medium | Compare current session content against goal criteria |
| **Hebrew language clinical NLP** | Existing Hebrew localization; extend to Hebrew clinical terminology recognition | High | Differentiated for Israeli market |
| **Supervisor-style session review** | AI provides feedback on session quality, missed opportunities | Very High | Novel feature; must be carefully framed as supportive, not evaluative |

### Cross-Session Analysis Differentiators

| Analysis Type | What It Surfaces | Value |
|---------------|------------------|-------|
| **Mood trajectory** | Improving, stable, declining trends across 3+ sessions | Early intervention opportunity |
| **Risk escalation patterns** | Progressive increase in risk factors | Prevention before crisis |
| **Treatment response** | Which interventions correlate with improvement | Evidence-based practice support |
| **Medication effects** | Correlate psychiatry medication changes with symptom changes | Optimize medication management |
| **Functional outcomes** | Track OT goals against daily living improvements | Outcome measurement |
| **Family system changes** | Track family therapy dynamics across sessions | Systemic pattern recognition |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in clinical AI domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-diagnosis suggestion** | AI suggesting diagnoses creates liability, automation bias, and potential harm; lacks clinical judgment context | Surface symptom patterns; let clinicians form diagnostic impressions |
| **Autonomous risk assessment** | 84-92% accuracy means 8-16% error rate; false negatives are deadly | Flag risk indicators prominently; always require clinician review |
| **Auto-complete for clinical content** | LLMs hallucinate 1.47-20% of clinical content; auto-inserted text may be wrong | Generate drafts clearly marked as AI-suggested; require explicit approval |
| **Prescriptive treatment recommendations** | AI lacks full patient context, relationship, and clinical judgment | Surface patterns and options; clinician decides treatment |
| **Confidence scores without explanation** | "85% confident" is meaningless without knowing what drives confidence | Explain what data supports conclusions; show uncertainty sources |
| **Silent AI insertion** | Clinicians must know what AI contributed vs what they wrote | Clear visual distinction; audit trail for AI-generated content |
| **Training on patient data** | Privacy violation; patient consent issues; competitive sensitivity | Use anonymized patterns; never train on identifiable data |
| **Replacing clinical judgment** | AI augments, not replaces; therapeutic relationship is irreplaceable | Position AI as time-saver on documentation, not decision-maker |
| **Sycophantic responses** | LLMs trained to agree may validate clinician errors | Build in appropriate challenge when data contradicts conclusions |
| **Stigmatizing language** | LLMs exhibit stigmatizing attitudes toward mental health conditions | Audit generated content for stigmatizing language; use person-first language |
| **Risk dismissal** | AI must never downplay or dismiss risk indicators | Always escalate risk; never auto-resolve safety concerns |
| **Assuming intervention provided** | AI should not infer interventions that weren't documented | Only reference interventions explicitly recorded |

### Specific Anti-Patterns for Role-Specific Summaries

| Role | Anti-Pattern | Why Dangerous |
|------|--------------|---------------|
| Psychiatrist | Suggesting medication changes | Prescribing authority is MD-only; liability |
| Psychologist | Diagnosing from symptoms | Diagnosis requires comprehensive assessment |
| Social Worker | Assuming resource availability | Resource landscapes vary; must verify |
| OT | Inferring functional capacity | Requires direct observation |
| All | Fabricating quotes | "Patient stated..." must be actual quotes |

---

## Feature Dependencies

```
FOUNDATION (Build First)
    |
    +-- Role-specific templates (existing in templates.ts)
    +-- Session notes structure (existing in types)
    +-- Voice transcription with diarization (existing Deepgram integration)
    |
    v
CORE AI FEATURES
    |
    +-- Clinician review/approval workflow <-- REQUIRED before any AI generation
    |       |
    |       +-- Draft state management
    |       +-- AI content flagging
    |       +-- Approval audit trail
    |
    +-- Role-specific summary generation <-- Builds on existing generateSessionSummary
    |       |
    |       +-- Psychiatrist: medication focus
    |       +-- Psychologist: intervention focus
    |       +-- Social Worker: resource focus
    |       +-- OT: functional focus
    |       +-- (etc. for all 10 roles)
    |
    +-- Golden Thread linking <-- Requires treatment plan integration
    |       |
    |       +-- Goal reference in notes
    |       +-- Progress tracking
    |       +-- Treatment plan sync
    |
    v
CROSS-SESSION ANALYSIS
    |
    +-- Pattern recognition (enhances existing analyzePatternsTrends)
    |       |
    |       +-- Mood trends
    |       +-- Engagement patterns
    |       +-- Symptom trajectory
    |
    +-- Risk assessment surfacing (enhances existing checkRiskPatterns)
    |       |
    |       +-- Escalation detection
    |       +-- Safety plan prompts
    |       +-- Alert routing
    |
    v
DIFFERENTIATORS
    |
    +-- Multidisciplinary synthesis
    |       |
    |       +-- Cross-provider insights
    |       +-- Treatment gap detection
    |
    +-- Predictive analytics (Phase 3+)
            |
            +-- Risk prediction
            +-- Engagement prediction
```

---

## MVP Recommendation

For MVP, prioritize:

1. **Clinician review/approval workflow** (table stakes, LOW complexity)
   - AI-generated content clearly marked
   - Explicit approval required before save
   - Audit trail for compliance

2. **Enhanced role-specific summary generation** (table stakes, MEDIUM complexity)
   - Build on existing `generateSessionSummary` infrastructure
   - Expand to all 10 roles with role-appropriate emphasis
   - Focus on accuracy over completeness

3. **Golden Thread linking** (table stakes, MEDIUM complexity)
   - Connect notes to treatment plan goals
   - Show progress toward goals in each note
   - Enable audit readiness

4. **Basic pattern recognition** (table stakes for trust, MEDIUM complexity)
   - Enhance existing `analyzePatternsTrends`
   - Surface mood trends, engagement patterns
   - Always with clinician review

5. **Risk indicator surfacing** (table stakes for safety, MEDIUM complexity)
   - Enhance existing `checkRiskPatterns`
   - Never auto-dismiss; always escalate
   - Clear visual prominence

### Defer to Post-MVP:

- **Predictive risk alerts**: Requires validation and clinical governance (Phase 2+)
- **Therapeutic alliance insights**: Novel feature needing careful design (Phase 2)
- **Cross-provider synthesis**: Complex; requires solid single-provider foundation (Phase 2)
- **Supervisor-style review**: High complexity and sensitivity (Phase 3)
- **Hebrew clinical NLP**: Market-specific optimization (Phase 2)

---

## Complexity Estimates

| Feature Category | Complexity | Effort Range | Risk Level |
|------------------|------------|--------------|------------|
| Review/approval workflow | Low | 2-4 weeks | Low |
| Role-specific summaries | Medium | 4-8 weeks | Medium (hallucination risk) |
| Golden Thread linking | Medium | 4-6 weeks | Low |
| Pattern recognition | Medium-High | 6-10 weeks | Medium |
| Risk surfacing | Medium | 4-6 weeks | High (safety-critical) |
| Multidisciplinary synthesis | High | 8-12 weeks | High |
| Predictive analytics | Very High | 12-20 weeks | Very High |

---

## Clinical Safety Considerations

### Mandatory Safeguards

1. **Human-in-the-loop**: Every AI output requires clinician approval
2. **Hallucination mitigation**: Flag low-confidence content; verify against source data
3. **Risk escalation**: Never auto-dismiss safety concerns
4. **Audit compliance**: Track all AI contributions for regulatory review
5. **Bias monitoring**: Regular audit of AI outputs for clinical appropriateness

### Governance Requirements

- Internal ethics review for AI features
- Clinical validation before deployment
- Ongoing monitoring of AI-assisted documentation
- Clear liability framework (AI assists, clinician decides)
- Patient consent for AI-assisted documentation

---

## Sources

### Primary Sources (HIGH confidence)
- [Mentalyc - AI Progress Notes](https://www.mentalyc.com/) - Market leader features
- [Upheal - Golden Thread](https://www.upheal.io/blog/the-golden-thread) - Golden Thread implementation
- [JMIR - Suicide Risk Prediction](https://medinform.jmir.org/2026/1/e74240) - Risk algorithm research

### Industry Analysis (MEDIUM confidence)
- [Healthcare IT News - Mental Health AI 2026](https://www.healthcareitnews.com/news/mental-health-ai-breaking-through-core-operations-2026)
- [APA - Personalized Mental Health Care Trends](https://www.apa.org/monitor/2026/01-02/trends-personalized-mental-health-care)
- [Lindy - AI Progress Note Tools](https://www.lindy.ai/blog/best-ai-progress-notes)

### Clinical Safety Research (HIGH confidence)
- [PMC - AI Hallucinations](https://pmc.ncbi.nlm.nih.gov/articles/PMC10552880/) - Hallucination mitigation
- [Nature - AI Clinical Safety Framework](https://www.nature.com/articles/s41746-025-01670-7) - Safety assessment
- [AJMC - AI Suicide Risk Prevention](https://www.ajmc.com/view/ai-powered-clinical-alerts-show-promise-in-suicide-risk-prevention) - Clinical alerts
- [PMC - Ethical Issues in AI Healthcare](https://pmc.ncbi.nlm.nih.gov/articles/PMC8826344/) - Ethics framework

### Role-Specific Documentation (MEDIUM confidence)
- [Mentalyc - Note-taking Differences](https://www.mentalyc.com/blog/difference-in-note-taking-among-mental-health-professionals)
- [PMC - AI in Occupational Therapy](https://pmc.ncbi.nlm.nih.gov/articles/PMC12515345/) - OT-specific considerations
