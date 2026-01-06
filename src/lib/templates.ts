// Session templates tailored for different therapist roles
// Each role has specific fields and assessment tools

import { SessionTemplate, TherapistRole, SessionType } from '@/types';

export const sessionTemplates: SessionTemplate[] = [
  // Psychologist Templates
  {
    role: 'psychologist',
    sessionType: 'individual_therapy',
    fields: [
      { id: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea', required: false, placeholder: "Patient's primary concern for this session" },
      { id: 'subjective', label: 'Subjective', type: 'textarea', required: true, placeholder: "Patient's self-report, mood, thoughts, behaviors since last session" },
      { id: 'objective', label: 'Objective', type: 'textarea', required: true, placeholder: 'Clinical observations, mental status, test results' },
      { id: 'assessment', label: 'Assessment', type: 'textarea', required: true, placeholder: 'Clinical interpretation, diagnostic impressions, formulation' },
      { id: 'plan', label: 'Plan', type: 'textarea', required: true, placeholder: 'Treatment plan, goals, interventions for next session' },
      { id: 'interventionsUsed', label: 'Interventions Used', type: 'multiselect', required: true, options: [
        'Cognitive Restructuring', 'Behavioral Activation', 'Exposure Therapy', 'Mindfulness',
        'Motivational Interviewing', 'Psychoeducation', 'Relaxation Training', 'Problem-Solving Therapy',
        'Interpersonal Therapy', 'Acceptance & Commitment Therapy', 'Dialectical Behavior Therapy Skills'
      ]},
      { id: 'progressTowardGoals', label: 'Progress Toward Goals', type: 'textarea', required: false },
      { id: 'homework', label: 'Homework/Between-Session Tasks', type: 'textarea', required: false },
      { id: 'nextSessionPlan', label: 'Plan for Next Session', type: 'textarea', required: false },
    ],
    defaultInterventions: ['Cognitive Restructuring', 'Psychoeducation'],
    assessmentScales: ['PHQ-9', 'GAD-7', 'BDI-II', 'BAI', 'PCL-5', 'OCI-R'],
  },
  {
    role: 'psychologist',
    sessionType: 'initial_assessment',
    fields: [
      { id: 'presentingProblem', label: 'Presenting Problem', type: 'textarea', required: true },
      { id: 'historyOfPresentIllness', label: 'History of Present Illness', type: 'textarea', required: true },
      { id: 'psychiatricHistory', label: 'Psychiatric History', type: 'textarea', required: true },
      { id: 'medicalHistory', label: 'Medical History', type: 'textarea', required: false },
      { id: 'substanceUseHistory', label: 'Substance Use History', type: 'textarea', required: true },
      { id: 'familyHistory', label: 'Family Psychiatric History', type: 'textarea', required: false },
      { id: 'socialHistory', label: 'Social/Developmental History', type: 'textarea', required: true },
      { id: 'mentalStatusExam', label: 'Mental Status Examination', type: 'textarea', required: true },
      { id: 'diagnosticImpressions', label: 'Diagnostic Impressions', type: 'textarea', required: true },
      { id: 'treatmentRecommendations', label: 'Treatment Recommendations', type: 'textarea', required: true },
    ],
    defaultInterventions: ['Clinical Interview', 'Psychoeducation'],
    assessmentScales: ['PHQ-9', 'GAD-7', 'AUDIT', 'DAST-10'],
  },

  // Psychiatrist Templates
  {
    role: 'psychiatrist',
    sessionType: 'follow_up',
    fields: [
      { id: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea', required: false },
      { id: 'subjective', label: 'Subjective', type: 'textarea', required: true, placeholder: 'Mood, sleep, appetite, energy, medication effects' },
      { id: 'objective', label: 'Objective/Mental Status', type: 'textarea', required: true },
      { id: 'currentMedications', label: 'Current Medications', type: 'textarea', required: true },
      { id: 'sideEffects', label: 'Side Effects', type: 'textarea', required: false },
      { id: 'assessment', label: 'Assessment', type: 'textarea', required: true },
      { id: 'medicationChanges', label: 'Medication Changes', type: 'textarea', required: false },
      { id: 'plan', label: 'Plan', type: 'textarea', required: true },
      { id: 'labsOrdered', label: 'Labs/Tests Ordered', type: 'textarea', required: false },
      { id: 'followUpInterval', label: 'Follow-up Interval', type: 'select', required: true, options: ['1 week', '2 weeks', '4 weeks', '6 weeks', '8 weeks', '12 weeks'] },
    ],
    defaultInterventions: ['Medication Management', 'Psychoeducation'],
    assessmentScales: ['PHQ-9', 'GAD-7', 'AIMS', 'CGI'],
  },

  // Social Worker Templates
  {
    role: 'social_worker',
    sessionType: 'individual_therapy',
    fields: [
      { id: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea', required: false },
      { id: 'subjective', label: 'Subjective', type: 'textarea', required: true },
      { id: 'objective', label: 'Objective', type: 'textarea', required: true },
      { id: 'socialDeterminants', label: 'Social Determinants of Health', type: 'multiselect', required: false, options: [
        'Housing', 'Food Security', 'Transportation', 'Employment', 'Education',
        'Childcare', 'Healthcare Access', 'Social Support', 'Safety', 'Legal Issues'
      ]},
      { id: 'resourcesDiscussed', label: 'Resources Discussed/Connected', type: 'textarea', required: false },
      { id: 'assessment', label: 'Assessment', type: 'textarea', required: true },
      { id: 'plan', label: 'Plan', type: 'textarea', required: true },
      { id: 'interventionsUsed', label: 'Interventions Used', type: 'multiselect', required: true, options: [
        'Case Management', 'Resource Connection', 'Advocacy', 'Crisis Intervention',
        'Problem-Solving Therapy', 'Motivational Interviewing', 'Family Intervention',
        'Care Coordination', 'Discharge Planning', 'Community Outreach'
      ]},
      { id: 'careCoordination', label: 'Care Coordination Notes', type: 'textarea', required: false },
    ],
    defaultInterventions: ['Case Management', 'Resource Connection'],
    assessmentScales: ['PRAPARE', 'PHQ-9'],
  },

  // Occupational Therapist Templates
  {
    role: 'occupational_therapist',
    sessionType: 'evaluation',
    fields: [
      { id: 'referralReason', label: 'Reason for Referral', type: 'textarea', required: true },
      { id: 'occupationalProfile', label: 'Occupational Profile', type: 'textarea', required: true, placeholder: "Client's occupational history, interests, priorities" },
      { id: 'areasOfOccupation', label: 'Areas of Occupation Assessed', type: 'multiselect', required: true, options: [
        'ADLs', 'IADLs', 'Rest/Sleep', 'Education', 'Work', 'Play', 'Leisure', 'Social Participation'
      ]},
      { id: 'performanceSkills', label: 'Performance Skills Assessment', type: 'textarea', required: true },
      { id: 'performancePatterns', label: 'Performance Patterns', type: 'textarea', required: true },
      { id: 'clientFactors', label: 'Client Factors', type: 'textarea', required: false },
      { id: 'environmentContext', label: 'Environment & Context', type: 'textarea', required: false },
      { id: 'assessmentsAdministered', label: 'Assessments Administered', type: 'multiselect', required: false, options: [
        'COPM', 'AMPS', 'MOHOST', 'OPHI-II', 'Sensory Profile', 'Allen Cognitive Level',
        'Executive Function Performance Test', 'KELS', 'Interest Checklist'
      ]},
      { id: 'clinicalInterpretation', label: 'Clinical Interpretation', type: 'textarea', required: true },
      { id: 'treatmentRecommendations', label: 'Treatment Recommendations', type: 'textarea', required: true },
      { id: 'goalsEstablished', label: 'Goals Established', type: 'textarea', required: true },
    ],
    defaultInterventions: ['Assessment', 'Occupational Profile'],
    assessmentScales: ['COPM', 'MOHOST', 'Allen Cognitive Level'],
  },
  {
    role: 'occupational_therapist',
    sessionType: 'individual_therapy',
    fields: [
      { id: 'sessionFocus', label: 'Session Focus', type: 'select', required: true, options: [
        'ADL Training', 'IADL Training', 'Cognitive Rehabilitation', 'Sensory Modulation',
        'Motor Skills', 'Social Skills', 'Work/School Skills', 'Leisure Exploration', 'Environmental Modification'
      ]},
      { id: 'subjective', label: 'Subjective', type: 'textarea', required: true },
      { id: 'objective', label: 'Objective', type: 'textarea', required: true, placeholder: 'Observations, performance measures, functional outcomes' },
      { id: 'activitiesUsed', label: 'Activities/Interventions Used', type: 'textarea', required: true },
      { id: 'assessment', label: 'Assessment', type: 'textarea', required: true },
      { id: 'progressTowardGoals', label: 'Progress Toward Goals', type: 'textarea', required: true },
      { id: 'plan', label: 'Plan', type: 'textarea', required: true },
      { id: 'homeProgram', label: 'Home Program/Recommendations', type: 'textarea', required: false },
    ],
    defaultInterventions: ['Occupation-Based Intervention', 'Skill Building'],
    assessmentScales: ['COPM', 'GAS'],
  },

  // Speech Therapist Templates
  {
    role: 'speech_therapist',
    sessionType: 'evaluation',
    fields: [
      { id: 'referralReason', label: 'Reason for Referral', type: 'textarea', required: true },
      { id: 'caseHistory', label: 'Case History', type: 'textarea', required: true },
      { id: 'areasAssessed', label: 'Areas Assessed', type: 'multiselect', required: true, options: [
        'Articulation', 'Phonology', 'Language Comprehension', 'Language Expression',
        'Pragmatics', 'Fluency', 'Voice', 'Swallowing', 'Cognitive-Communication'
      ]},
      { id: 'assessmentResults', label: 'Assessment Results', type: 'textarea', required: true },
      { id: 'clinicalImpressions', label: 'Clinical Impressions', type: 'textarea', required: true },
      { id: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { id: 'treatmentGoals', label: 'Treatment Goals', type: 'textarea', required: true },
    ],
    defaultInterventions: ['Standardized Assessment', 'Clinical Observation'],
    assessmentScales: ['CELF-5', 'PLS-5', 'GFTA-3', 'SSI-4'],
  },

  // Family Therapist Templates
  {
    role: 'family_therapist',
    sessionType: 'family_therapy',
    fields: [
      { id: 'attendees', label: 'Session Attendees', type: 'textarea', required: true },
      { id: 'presentingIssues', label: 'Presenting Issues', type: 'textarea', required: true },
      { id: 'familyDynamics', label: 'Family Dynamics Observed', type: 'textarea', required: true },
      { id: 'communicationPatterns', label: 'Communication Patterns', type: 'textarea', required: false },
      { id: 'interventionsUsed', label: 'Interventions Used', type: 'multiselect', required: true, options: [
        'Structural Family Therapy', 'Strategic Family Therapy', 'Narrative Therapy',
        'Emotionally Focused Therapy', 'Solution-Focused Brief Therapy', 'Psychoeducation',
        'Communication Skills Training', 'Boundary Setting', 'Conflict Resolution', 'Genogram Work'
      ]},
      { id: 'sessionProcess', label: 'Session Process/Content', type: 'textarea', required: true },
      { id: 'assessment', label: 'Assessment', type: 'textarea', required: true },
      { id: 'plan', label: 'Plan/Next Steps', type: 'textarea', required: true },
      { id: 'homework', label: 'Family Tasks/Homework', type: 'textarea', required: false },
    ],
    defaultInterventions: ['Family Therapy', 'Psychoeducation'],
    assessmentScales: ['FACES-IV', 'Family Assessment Device'],
  },

  // Art Therapist Templates
  {
    role: 'art_therapist',
    sessionType: 'individual_therapy',
    fields: [
      { id: 'sessionTheme', label: 'Session Theme/Directive', type: 'textarea', required: true },
      { id: 'mediaUsed', label: 'Art Media Used', type: 'multiselect', required: true, options: [
        'Drawing', 'Painting', 'Collage', 'Sculpture/Clay', 'Mixed Media',
        'Digital Art', 'Photography', 'Printmaking', 'Fiber Arts', 'Found Objects'
      ]},
      { id: 'artworkDescription', label: 'Artwork Description', type: 'textarea', required: true },
      { id: 'processNotes', label: 'Creative Process Notes', type: 'textarea', required: true },
      { id: 'clientReflections', label: 'Client Reflections/Verbal Processing', type: 'textarea', required: false },
      { id: 'therapeuticObservations', label: 'Therapeutic Observations', type: 'textarea', required: true },
      { id: 'assessment', label: 'Assessment', type: 'textarea', required: true },
      { id: 'plan', label: 'Plan', type: 'textarea', required: true },
    ],
    defaultInterventions: ['Art Making', 'Verbal Processing', 'Art-Based Assessment'],
    assessmentScales: ['PPAT', 'Draw-a-Person', 'House-Tree-Person'],
  },
];

// Get template by role and session type
export function getSessionTemplate(role: TherapistRole, sessionType: SessionType): SessionTemplate | undefined {
  return sessionTemplates.find(t => t.role === role && t.sessionType === sessionType);
}

// Get all templates for a role
export function getTemplatesForRole(role: TherapistRole): SessionTemplate[] {
  return sessionTemplates.filter(t => t.role === role);
}

// Get default template for a role (individual therapy or evaluation)
export function getDefaultTemplateForRole(role: TherapistRole): SessionTemplate | undefined {
  return sessionTemplates.find(t => t.role === role && (t.sessionType === 'individual_therapy' || t.sessionType === 'evaluation'));
}

// Common interventions across all roles
export const commonInterventions = [
  'Psychoeducation',
  'Active Listening',
  'Validation',
  'Reflective Listening',
  'Goal Setting',
  'Progress Review',
  'Care Coordination',
  'Documentation',
];

// Risk assessment fields (common across roles)
export const riskAssessmentFields = [
  { id: 'suicidalIdeation', label: 'Suicidal Ideation', type: 'select', required: true, options: [
    'None', 'Passive ideation', 'Active - no plan', 'Active - with plan'
  ]},
  { id: 'homicidalIdeation', label: 'Homicidal Ideation', type: 'select', required: true, options: ['None', 'Present'] },
  { id: 'selfHarm', label: 'Self-Harm', type: 'select', required: true, options: ['None', 'History', 'Current'] },
  { id: 'substanceUse', label: 'Substance Use', type: 'select', required: true, options: ['None', 'Active use', 'In recovery'] },
  { id: 'safetyPlanReviewed', label: 'Safety Plan Reviewed', type: 'checkbox', required: false },
  { id: 'riskNotes', label: 'Risk Assessment Notes', type: 'textarea', required: false },
];
