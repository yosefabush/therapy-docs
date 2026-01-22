import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { generatePatientInsights } from '@/lib/ai/patient-insights';

/**
 * POST /api/patients/[id]/insights
 *
 * Generates AI-powered insights for a patient based on their session history.
 * Analyzes patterns, progress trends, risk indicators, and treatment gaps.
 *
 * Response:
 * - 200: Insights generated successfully
 * - 404: Patient not found
 * - 500: Generation failed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate patient exists
    const patient = await patientRepository.findById(id);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Generate insights
    const insights = await generatePatientInsights(id);

    // Return insights
    return NextResponse.json({ data: insights });

  } catch (error) {
    console.error('Error generating patient insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
