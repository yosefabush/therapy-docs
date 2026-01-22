// Role-specific prompt registry for AI session summary generation
// Each therapist role has tailored prompts that speak their professional language

import type { TherapistRole } from '@/types';

// Import all role-specific prompts
import { psychologistPrompt } from './psychologist';
import { psychiatristPrompt } from './psychiatrist';
import { socialWorkerPrompt } from './social-worker';
import { occupationalTherapistPrompt } from './occupational-therapist';
import { speechTherapistPrompt } from './speech-therapist';
import { physicalTherapistPrompt } from './physical-therapist';
import { counselorPrompt } from './counselor';
import { artTherapistPrompt } from './art-therapist';
import { musicTherapistPrompt } from './music-therapist';
import { familyTherapistPrompt } from './family-therapist';

/**
 * Session summary prompt configuration for AI-powered documentation
 * Each role has a customized prompt that emphasizes their clinical focus areas
 */
export interface SessionSummaryPrompt {
  /** The therapist role this prompt is designed for */
  role: TherapistRole;

  /** System prompt establishing AI role and clinical expertise */
  systemPrompt: string;

  /** User prompt template with {{soapNotes}} and {{transcript}} placeholders */
  userPromptTemplate: string;

  /** Role-specific clinical priorities for summary generation */
  focusAreas: string[];

  /** Expected structure and format of the generated summary */
  outputFormat: string;
}

/**
 * Registry mapping each therapist role to its specialized prompt
 * Ensures complete coverage of all 10 role types
 */
const promptRegistry: Record<TherapistRole, SessionSummaryPrompt> = {
  psychologist: psychologistPrompt,
  psychiatrist: psychiatristPrompt,
  social_worker: socialWorkerPrompt,
  occupational_therapist: occupationalTherapistPrompt,
  speech_therapist: speechTherapistPrompt,
  physical_therapist: physicalTherapistPrompt,
  counselor: counselorPrompt,
  art_therapist: artTherapistPrompt,
  music_therapist: musicTherapistPrompt,
  family_therapist: familyTherapistPrompt,
};

// Type-level completeness check - will error at compile time if a role is missing
// This ensures the registry always covers all TherapistRole values
const _exhaustiveCheck: Record<TherapistRole, SessionSummaryPrompt> = promptRegistry;
// Suppress unused variable warning
void _exhaustiveCheck;

/**
 * Retrieves the session summary prompt for a specific therapist role
 *
 * @param role - The therapist role to get the prompt for
 * @returns The SessionSummaryPrompt configured for that role
 * @throws Error if role is not found (should not happen with TypeScript type safety)
 *
 * @example
 * ```typescript
 * const prompt = getPromptForRole('psychologist');
 * const systemMessage = prompt.systemPrompt;
 * const userMessage = prompt.userPromptTemplate
 *   .replace('{{soapNotes}}', formattedNotes)
 *   .replace('{{transcript}}', transcript || 'No transcript available');
 * ```
 */
export function getPromptForRole(role: TherapistRole): SessionSummaryPrompt {
  const prompt = promptRegistry[role];

  if (!prompt) {
    // This should never happen if TypeScript types are respected
    throw new Error(
      `No prompt found for role: ${role}. ` +
        `Expected one of: ${Object.keys(promptRegistry).join(', ')}`
    );
  }

  return prompt;
}

/**
 * Returns all available prompts for iteration or display
 */
export function getAllPrompts(): SessionSummaryPrompt[] {
  return Object.values(promptRegistry);
}

/**
 * Returns all supported therapist roles that have prompts
 */
export function getSupportedRoles(): TherapistRole[] {
  return Object.keys(promptRegistry) as TherapistRole[];
}

// Re-export individual prompts for direct access if needed
export {
  psychologistPrompt,
  psychiatristPrompt,
  socialWorkerPrompt,
  occupationalTherapistPrompt,
  speechTherapistPrompt,
  physicalTherapistPrompt,
  counselorPrompt,
  artTherapistPrompt,
  musicTherapistPrompt,
  familyTherapistPrompt,
};
