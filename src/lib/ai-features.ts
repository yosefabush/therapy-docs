// AI-Enhanced Features for Therapy Documentation
// Revolutionary idea: AI-powered session summarization and pattern recognition

import { Session, TherapistRole, TreatmentGoal, AIInsight } from '@/types';
import { therapistRoleLabels, sessionTypeLabels } from './mock-data';

// Session summary generation based on therapist role
export function generateSessionSummary(session: Session, therapistRole: TherapistRole): string {
  const { notes, sessionType, duration } = session;
  
  // Different summary styles based on role
  const summaryStyles: Record<TherapistRole, (session: Session) => string> = {
    psychologist: (s) => generatePsychologySummary(s),
    psychiatrist: (s) => generatePsychiatrySummary(s),
    social_worker: (s) => generateSocialWorkSummary(s),
    occupational_therapist: (s) => generateOTSummary(s),
    speech_therapist: (s) => generateSpeechSummary(s),
    physical_therapist: (s) => generatePTSummary(s),
    counselor: (s) => generateCounselingSummary(s),
    art_therapist: (s) => generateArtTherapySummary(s),
    music_therapist: (s) => generateMusicTherapySummary(s),
    family_therapist: (s) => generateFamilyTherapySummary(s),
  };
  
  const generator = summaryStyles[therapistRole];
  return generator ? generator(session) : generateGenericSummary(session);
}

function generatePsychologySummary(session: Session): string {
  const { notes } = session;
  const parts: string[] = [];
  
  if (notes.chiefComplaint) {
    parts.push(`Patient presented with ${notes.chiefComplaint.toLowerCase()}.`);
  }
  
  if (notes.subjective) {
    const subjectiveHighlights = extractKeyPoints(notes.subjective);
    parts.push(`Self-report: ${subjectiveHighlights}`);
  }
  
  if (notes.objective) {
    const objectiveHighlights = extractKeyPoints(notes.objective);
    parts.push(`Clinical observations: ${objectiveHighlights}`);
  }
  
  if (notes.interventionsUsed && notes.interventionsUsed.length > 0) {
    parts.push(`Interventions: ${notes.interventionsUsed.join(', ')}.`);
  }
  
  if (notes.assessment) {
    parts.push(`Assessment: ${extractKeyPoints(notes.assessment)}`);
  }
  
  return parts.join(' ');
}

function generatePsychiatrySummary(session: Session): string {
  const { notes } = session;
  const parts: string[] = [];
  
  if (notes.subjective) {
    parts.push(`Patient status: ${extractKeyPoints(notes.subjective)}`);
  }
  
  if (notes.medications && notes.medications.length > 0) {
    const meds = notes.medications.map(m => `${m.name} ${m.dosage}`).join(', ');
    parts.push(`Current medications: ${meds}.`);
  }
  
  if (notes.assessment) {
    parts.push(`Clinical assessment: ${extractKeyPoints(notes.assessment)}`);
  }
  
  if (notes.plan) {
    parts.push(`Plan: ${extractKeyPoints(notes.plan)}`);
  }
  
  return parts.join(' ');
}

function generateSocialWorkSummary(session: Session): string {
  const { notes } = session;
  const parts: string[] = [];
  
  if (notes.chiefComplaint) {
    parts.push(`Primary concern: ${notes.chiefComplaint.toLowerCase()}.`);
  }
  
  if (notes.subjective) {
    parts.push(`Client report: ${extractKeyPoints(notes.subjective)}`);
  }
  
  if (notes.interventionsUsed && notes.interventionsUsed.length > 0) {
    const socialWorkFocused = notes.interventionsUsed.filter(i => 
      ['Case Management', 'Resource Connection', 'Advocacy', 'Care Coordination'].includes(i)
    );
    if (socialWorkFocused.length > 0) {
      parts.push(`Services provided: ${socialWorkFocused.join(', ')}.`);
    }
  }
  
  if (notes.plan) {
    parts.push(`Follow-up plan: ${extractKeyPoints(notes.plan)}`);
  }
  
  return parts.join(' ');
}

function generateOTSummary(session: Session): string {
  const { notes } = session;
  const parts: string[] = [];
  
  parts.push(`Occupational therapy session focused on functional performance.`);
  
  if (notes.subjective) {
    parts.push(`Client reported: ${extractKeyPoints(notes.subjective)}`);
  }
  
  if (notes.objective) {
    parts.push(`Performance observations: ${extractKeyPoints(notes.objective)}`);
  }
  
  if (notes.progressTowardGoals) {
    parts.push(`Goal progress: ${notes.progressTowardGoals}`);
  }
  
  return parts.join(' ');
}

function generateSpeechSummary(session: Session): string {
  const { notes } = session;
  return `Speech-language therapy session. ${notes.subjective ? extractKeyPoints(notes.subjective) : ''} ${notes.assessment ? `Assessment: ${extractKeyPoints(notes.assessment)}` : ''}`;
}

function generatePTSummary(session: Session): string {
  const { notes } = session;
  return `Physical therapy session. ${notes.subjective ? extractKeyPoints(notes.subjective) : ''} ${notes.objective ? `Functional status: ${extractKeyPoints(notes.objective)}` : ''}`;
}

function generateCounselingSummary(session: Session): string {
  const { notes } = session;
  const parts: string[] = [];
  
  if (notes.chiefComplaint) {
    parts.push(`Presented concern: ${notes.chiefComplaint.toLowerCase()}.`);
  }
  
  if (notes.subjective) {
    parts.push(`${extractKeyPoints(notes.subjective)}`);
  }
  
  if (notes.interventionsUsed && notes.interventionsUsed.length > 0) {
    parts.push(`Therapeutic approaches: ${notes.interventionsUsed.join(', ')}.`);
  }
  
  return parts.join(' ');
}

function generateArtTherapySummary(session: Session): string {
  const { notes } = session;
  return `Art therapy session. Creative expression and processing through artistic media. ${notes.assessment ? extractKeyPoints(notes.assessment) : ''}`;
}

function generateMusicTherapySummary(session: Session): string {
  const { notes } = session;
  return `Music therapy session. Therapeutic engagement through musical intervention. ${notes.assessment ? extractKeyPoints(notes.assessment) : ''}`;
}

function generateFamilyTherapySummary(session: Session): string {
  const { notes } = session;
  return `Family therapy session. ${notes.subjective ? extractKeyPoints(notes.subjective) : ''} Family dynamics and communication patterns addressed.`;
}

function generateGenericSummary(session: Session): string {
  const { notes, sessionType } = session;
  const type = sessionTypeLabels[sessionType];
  
  return `${type} session completed. ${notes.subjective ? extractKeyPoints(notes.subjective) : ''} ${notes.plan ? `Plan: ${extractKeyPoints(notes.plan)}` : ''}`;
}

// Extract key points from longer text (simplified version)
function extractKeyPoints(text: string): string {
  // Take first 150 characters and clean up
  const truncated = text.substring(0, 200);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > 100) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  return truncated + (text.length > 200 ? '...' : '');
}

// Generate multidisciplinary report
export function generateMultidisciplinaryReport(
  sessions: Session[],
  goals: TreatmentGoal[],
  patientCode: string,
  dateRange: { start: Date; end: Date }
): string {
  const sessionsInRange = sessions.filter(s => 
    s.scheduledAt >= dateRange.start && 
    s.scheduledAt <= dateRange.end &&
    s.status === 'completed'
  );
  
  // Group sessions by therapist role
  const sessionsByRole = sessionsInRange.reduce((acc, session) => {
    const role = session.therapistRole;
    if (!acc[role]) acc[role] = [];
    acc[role].push(session);
    return acc;
  }, {} as Record<TherapistRole, Session[]>);
  
  const reportSections: string[] = [];
  
  // Header
  reportSections.push(`MULTIDISCIPLINARY TREATMENT SUMMARY`);
  reportSections.push(`Patient: ${patientCode}`);
  reportSections.push(`Period: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`);
  reportSections.push(`Total Sessions: ${sessionsInRange.length}`);
  reportSections.push('');
  
  // Sessions by discipline
  reportSections.push('TREATMENT BY DISCIPLINE:');
  reportSections.push('');
  
  for (const [role, roleSessions] of Object.entries(sessionsByRole)) {
    const roleLabel = therapistRoleLabels[role as TherapistRole];
    reportSections.push(`${roleLabel.toUpperCase()} (${roleSessions.length} sessions):`);
    
    for (const session of roleSessions) {
      const summary = generateSessionSummary(session, role as TherapistRole);
      reportSections.push(`  - ${formatDate(session.scheduledAt)}: ${summary}`);
    }
    reportSections.push('');
  }
  
  // Goals Progress
  if (goals.length > 0) {
    reportSections.push('TREATMENT GOALS PROGRESS:');
    reportSections.push('');
    
    for (const goal of goals) {
      reportSections.push(`  Goal: ${goal.description}`);
      reportSections.push(`  Status: ${goal.status} | Progress: ${goal.progress}%`);
      reportSections.push(`  Target: ${goal.targetDate ? formatDate(goal.targetDate) : 'Ongoing'}`);
      reportSections.push('');
    }
  }
  
  // Risk summary
  const latestRisk = sessionsInRange
    .filter(s => s.notes.riskAssessment)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
  
  if (latestRisk?.notes.riskAssessment) {
    const risk = latestRisk.notes.riskAssessment;
    reportSections.push('RISK ASSESSMENT (Most Recent):');
    reportSections.push(`  Suicidal Ideation: ${risk.suicidalIdeation}`);
    reportSections.push(`  Homicidal Ideation: ${risk.homicidalIdeation}`);
    reportSections.push(`  Self-Harm: ${risk.selfHarm}`);
    reportSections.push(`  Substance Use: ${risk.substanceUse}`);
    reportSections.push('');
  }
  
  return reportSections.join('\n');
}

// AI Pattern Recognition (Revolutionary Feature)
export function analyzePatternsTrends(sessions: Session[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date();
  
  // Analyze mood trends
  const moodIndicators = analyzeMoodTrends(sessions);
  if (moodIndicators) {
    insights.push({
      id: `insight-mood-${Date.now()}`,
      patientId: sessions[0]?.patientId || '',
      type: 'progress_trend',
      content: moodIndicators,
      confidence: 0.75,
      generatedAt: now,
    });
  }
  
  // Check for risk indicators
  const riskIndicators = checkRiskPatterns(sessions);
  if (riskIndicators) {
    insights.push({
      id: `insight-risk-${Date.now()}`,
      patientId: sessions[0]?.patientId || '',
      type: 'risk_indicator',
      content: riskIndicators,
      confidence: 0.85,
      generatedAt: now,
    });
  }
  
  // Treatment engagement patterns
  const engagementPattern = analyzeEngagement(sessions);
  if (engagementPattern) {
    insights.push({
      id: `insight-engagement-${Date.now()}`,
      patientId: sessions[0]?.patientId || '',
      type: 'pattern',
      content: engagementPattern,
      confidence: 0.7,
      generatedAt: now,
    });
  }
  
  return insights;
}

function analyzeMoodTrends(sessions: Session[]): string | null {
  const completedSessions = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  
  if (completedSessions.length < 3) return null;
  
  // Simple heuristic based on keywords in notes
  const positiveIndicators = ['improvement', 'better', 'progress', 'positive', 'stable'];
  const negativeIndicators = ['worse', 'decline', 'deterioration', 'increased symptoms', 'setback'];
  
  const recentSessions = completedSessions.slice(-3);
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const session of recentSessions) {
    const notesText = JSON.stringify(session.notes).toLowerCase();
    positiveIndicators.forEach(word => {
      if (notesText.includes(word)) positiveCount++;
    });
    negativeIndicators.forEach(word => {
      if (notesText.includes(word)) negativeCount++;
    });
  }
  
  if (positiveCount > negativeCount + 2) {
    return 'Positive trend detected: Recent sessions indicate improvement in patient symptoms and functioning.';
  } else if (negativeCount > positiveCount + 2) {
    return 'Attention needed: Recent sessions suggest possible decline in patient status. Consider treatment plan review.';
  }
  
  return 'Treatment progress appears stable. Continue monitoring for changes.';
}

function checkRiskPatterns(sessions: Session[]): string | null {
  const recentSessions = sessions
    .filter(s => s.status === 'completed' && s.notes.riskAssessment)
    .slice(-5);
  
  if (recentSessions.length === 0) return null;
  
  const latestRisk = recentSessions[recentSessions.length - 1].notes.riskAssessment!;
  
  if (latestRisk.suicidalIdeation !== 'none' || 
      latestRisk.homicidalIdeation !== 'none' ||
      latestRisk.selfHarm === 'current') {
    return 'ELEVATED RISK: Recent assessment indicates active risk factors. Ensure safety planning is current and consider increased monitoring.';
  }
  
  // Check for escalation pattern
  const riskLevels = recentSessions.map(s => {
    const risk = s.notes.riskAssessment!;
    let score = 0;
    if (risk.suicidalIdeation !== 'none') score += 2;
    if (risk.homicidalIdeation !== 'none') score += 2;
    if (risk.selfHarm !== 'none') score += 1;
    if (risk.substanceUse === 'active') score += 1;
    return score;
  });
  
  const isEscalating = riskLevels.length >= 2 && 
    riskLevels[riskLevels.length - 1] > riskLevels[riskLevels.length - 2];
  
  if (isEscalating) {
    return 'Risk escalation pattern detected: Consider coordinated team response and safety plan review.';
  }
  
  return null;
}

function analyzeEngagement(sessions: Session[]): string | null {
  const recentSessions = sessions.slice(-10);
  
  const cancelled = recentSessions.filter(s => s.status === 'cancelled').length;
  const noShow = recentSessions.filter(s => s.status === 'no_show').length;
  
  const missedRate = (cancelled + noShow) / recentSessions.length;
  
  if (missedRate > 0.3) {
    return 'Engagement concern: Higher than expected rate of missed sessions. Consider outreach and barriers assessment.';
  }
  
  if (missedRate === 0 && recentSessions.length >= 5) {
    return 'Strong engagement: Patient demonstrating consistent attendance and participation.';
  }
  
  return null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Voice note transcription simulation
export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  suggestedFields: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    interventions?: string[];
  };
}

export function processVoiceTranscription(transcript: string): TranscriptionResult {
  // In production, this would use AI to parse the transcript
  // and suggest appropriate field mappings
  
  const sections: TranscriptionResult['suggestedFields'] = {};
  
  // Simple keyword detection for demonstration
  const lowerTranscript = transcript.toLowerCase();
  
  if (lowerTranscript.includes('patient reports') || lowerTranscript.includes('patient stated')) {
    sections.subjective = extractSectionAfterKeyword(transcript, ['patient reports', 'patient stated', 'client said']);
  }
  
  if (lowerTranscript.includes('observed') || lowerTranscript.includes('appeared')) {
    sections.objective = extractSectionAfterKeyword(transcript, ['observed', 'appeared', 'noted']);
  }
  
  if (lowerTranscript.includes('assessment') || lowerTranscript.includes('impression')) {
    sections.assessment = extractSectionAfterKeyword(transcript, ['assessment', 'impression', 'formulation']);
  }
  
  if (lowerTranscript.includes('plan') || lowerTranscript.includes('next session')) {
    sections.plan = extractSectionAfterKeyword(transcript, ['plan', 'next session', 'follow up']);
  }
  
  return {
    transcript,
    confidence: 0.85,
    suggestedFields: sections,
  };
}

function extractSectionAfterKeyword(text: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const index = text.toLowerCase().indexOf(keyword);
    if (index !== -1) {
      // Extract text after keyword until next period or end
      const afterKeyword = text.substring(index);
      const endIndex = afterKeyword.indexOf('.', 50);
      return afterKeyword.substring(0, endIndex > 0 ? endIndex + 1 : 200);
    }
  }
  return '';
}
