import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories/session.repository';
import { generateSessionSummaryAI, getAIConfig } from '@/lib/ai';

interface SummaryRequest {
  transcript?: string;
  regenerate?: boolean;  // Force regeneration even if summary exists
}

interface SummaryResponse {
  data?: {
    summary: string;
    mode: 'mock' | 'real';
    model?: string;
    tokensUsed?: number;
    generatedAt: string;
  };
  error?: string;
}

/**
 * POST /api/sessions/[id]/summary
 *
 * Generates an AI summary for the specified session.
 *
 * Request body:
 * - transcript (optional): Session transcript for richer summary
 * - regenerate (optional): Force regeneration if summary exists
 *
 * Response:
 * - 200: Summary generated successfully
 * - 400: Invalid request (missing session data)
 * - 404: Session not found
 * - 500: Generation failed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SummaryResponse>> {
  try {
    const { id } = await params;

    // 1. Fetch the session
    const session = await sessionRepository.findById(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // 2. Validate session has notes to summarize
    // Note: Session.notes is a required field per types/index.ts
    // but we check subjective specifically as it's needed for summary
    if (!session.notes.subjective) {
      return NextResponse.json(
        { error: 'Session has no subjective notes to summarize. Please add session notes first.' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    let body: SummaryRequest = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine - transcript is optional
    }

    // 4. Generate the summary
    const result = await generateSessionSummaryAI(
      session,
      session.therapistRole,
      body.transcript
    );

    // 5. Check for generation errors
    if (result.error) {
      console.error(`Summary generation failed for session ${id}:`, result.error);
      return NextResponse.json(
        { error: `Summary generation failed: ${result.error}` },
        { status: 500 }
      );
    }

    // 6. Return success response
    return NextResponse.json({
      data: {
        summary: result.summary,
        mode: result.mode,
        model: result.model,
        tokensUsed: result.tokensUsed,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error in summary generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id]/summary
 *
 * Returns the current AI configuration mode (for frontend to display).
 * Useful for showing "Mock Mode" badge in development.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Verify session exists
    const session = await sessionRepository.findById(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const config = getAIConfig();

    return NextResponse.json({
      data: {
        mode: config.mode,
        model: config.model,
        sessionId: id,
        hasNotes: Boolean(session.notes.subjective),
      }
    });

  } catch (error) {
    console.error('Error fetching summary config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
