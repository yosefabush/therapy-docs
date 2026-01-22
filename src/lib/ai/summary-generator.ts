// Core AI summary generation logic
// Supports both mock mode (for development) and real mode (OpenAI API)

import { getAIConfig, type AIConfig } from './index';
import { generateMockSummary } from './mock-ai';

/**
 * Result from AI summary generation
 */
export interface SummaryResult {
  /** The generated summary text */
  summary: string;
  /** Whether this was generated in mock or real mode */
  mode: 'mock' | 'real';
  /** The model used for generation */
  model?: string;
  /** Number of tokens used (real mode only) */
  tokensUsed?: number;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Generates an AI summary from the provided prompts
 * Automatically selects mock or real mode based on configuration
 *
 * @param systemPrompt - The system prompt establishing AI role and behavior
 * @param userPrompt - The user prompt with session data to summarize
 * @returns Promise resolving to SummaryResult
 *
 * @example
 * ```typescript
 * const result = await generateAISummary(
 *   "You are a clinical psychologist...",
 *   "SOAP Notes:\n..."
 * );
 *
 * if (result.error) {
 *   console.error('Generation failed:', result.error);
 * } else {
 *   console.log('Summary:', result.summary);
 *   console.log('Mode:', result.mode);
 * }
 * ```
 */
export async function generateAISummary(
  systemPrompt: string,
  userPrompt: string
): Promise<SummaryResult> {
  const config = getAIConfig();

  if (config.mode === 'mock') {
    return generateMockSummary(systemPrompt, userPrompt);
  }

  return generateRealSummary(systemPrompt, userPrompt, config);
}

/**
 * Calls the OpenAI-compatible API to generate a summary
 * Handles errors gracefully and returns meaningful error messages
 */
async function generateRealSummary(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig
): Promise<SummaryResult> {
  try {
    const response = await fetch(config.apiEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        summary: '',
        mode: 'real',
        model: config.model,
        error: `API error ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return {
        summary: '',
        mode: 'real',
        model: config.model,
        error: 'Invalid API response: no choices returned',
      };
    }

    const content = data.choices[0]?.message?.content;
    if (typeof content !== 'string') {
      return {
        summary: '',
        mode: 'real',
        model: config.model,
        error: 'Invalid API response: no content in message',
      };
    }

    return {
      summary: content,
      mode: 'real',
      model: config.model,
      tokensUsed: data.usage?.total_tokens,
    };
  } catch (error) {
    // Handle network errors, JSON parse errors, etc.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      summary: '',
      mode: 'real',
      model: config.model,
      error: `Request failed: ${errorMessage}`,
    };
  }
}
