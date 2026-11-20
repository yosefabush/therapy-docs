import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

export type ParseResult<T> = { data: T } | { error: NextResponse };

export function validationError(error: z.ZodError): NextResponse {
  return NextResponse.json(
    { error: 'Validation error', details: error.errors },
    { status: 400 }
  );
}

/**
 * Parse a JSON request body against an allow-list schema. Malformed JSON, a
 * non-object body and schema violations all produce a 400; unknown keys are
 * stripped by the schema.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  request: NextRequest,
  schema: S
): Promise<ParseResult<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { error: validationError(parsed.error) };
  return { data: parsed.data };
}
