// AI module for session summary generation
// Supports mock mode (development/testing) and real mode (OpenAI API)

/**
 * Configuration for AI summary generation
 */
export interface AIConfig {
  /** Operating mode: 'mock' for development, 'real' for actual API calls */
  mode: 'mock' | 'real';
  /** OpenAI API key (required for real mode) */
  apiKey?: string;
  /** API endpoint - defaults to OpenAI, but configurable for compatible APIs */
  apiEndpoint?: string;
  /** Model to use - defaults to gpt-4o-mini */
  model?: string;
  /** Maximum tokens for response - defaults to 1000 */
  maxTokens?: number;
}

/**
 * Reads AI configuration from environment variables
 *
 * Environment variables:
 * - OPENAI_API_KEY: API key (presence determines mock vs real mode)
 * - OPENAI_API_ENDPOINT: Custom endpoint (default: OpenAI)
 * - OPENAI_MODEL: Model name (default: gpt-4o-mini)
 * - OPENAI_MAX_TOKENS: Max response tokens (default: 1000)
 *
 * @returns AIConfig with mode automatically set based on API key presence
 */
export function getAIConfig(): AIConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const mode = apiKey ? 'real' : 'mock';

  return {
    mode,
    apiKey,
    apiEndpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
  };
}

// Re-export from summary-generator
export { generateAISummary } from './summary-generator';
export type { SummaryResult } from './summary-generator';
