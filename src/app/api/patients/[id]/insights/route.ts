import { NextRequest, NextResponse } from 'next/server';
import { patientRepository, patientInsightsRepository } from '@/lib/data/repositories';
import { generatePatientInsights } from '@/lib/ai/patient-insights';
import type { PatientInsights } from '@/types';

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

/**
 * GET /api/patients/[id]/insights
 *
 * Retrieves saved insights for a patient.
 *
 * Response:
 * - 200: { data: PatientInsights | null } - Returns saved insights or null if none exist
 * - 404: Patient not found
 * - 500: Fetch failed
 */
export async function GET(
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

    // Get saved insights
    const insights = await patientInsightsRepository.findByPatientId(id);

    // Return insights or null
    return NextResponse.json({ data: insights });

  } catch (error) {
    console.error('Error fetching patient insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/patients/[id]/insights
 *
 * Saves generated insights for a patient.
 *
 * Request body:
 * - insights: PatientInsights - The insights to save
 *
 * Response:
 * - 200: { data: PatientInsights } - The saved insights with savedAt timestamp
 * - 400: Missing insights in request body
 * - 404: Patient not found
 * - 500: Save failed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate patient exists
    const patient = await patientRepository.findById(id);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.insights) {
      return NextResponse.json(
        { error: 'Missing insights in request body' },
        { status: 400 }
      );
    }

    // Add persistence metadata
    const insightsToSave: PatientInsights = {
      ...body.insights,
      patientId: id, // Ensure patientId matches route param
      savedAt: new Date(),
      // savedBy would come from auth in real app
    };

    // Save insights
    const savedInsights = await patientInsightsRepository.saveForPatient(insightsToSave);

    return NextResponse.json({ data: savedInsights });

  } catch (error) {
    console.error('Error saving patient insights:', error);
    return NextResponse.json(
      { error: 'Failed to save insights' },
      { status: 500 }
    );
  }
}
