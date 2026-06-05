import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userRepository } from '@/lib/data/repositories';
import { readJsonFile, writeJsonFile } from '@/lib/data/json-store';
import { hashPassword, checkRateLimit } from '@/lib/security';
import { logger } from '@/lib/logger';

interface AuthCredentials {
  id: string;
  email: string;
  password: string;
}

const signupSchema = z.object({
  name: z.string().trim().min(2, 'שם קצר מדי'),
  email: z.string().email(),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
});

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(`signup:${clientIp(request)}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. אנא נסה שוב בעוד מספר דקות.' },
        { status: 429 }
      );
    }

    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'נא למלא את כל השדות' },
        { status: 400 }
      );
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת אימייל זו כבר רשומה במערכת.' },
        { status: 400 }
      );
    }

    const newUser = await userRepository.create({
      email,
      name,
      role: 'therapist',
      therapistRole: 'psychologist', // Default role
      organization: 'מרכז הרמוניה לבריאות הנפש',
      lastLogin: new Date(),
    });

    // Store a bcrypt hash of the password, never the plaintext.
    const credentials = await readJsonFile<AuthCredentials>(
      'auth-credentials.json'
    );
    credentials.push({
      id: newUser.id,
      email,
      password: await hashPassword(password),
    });
    await writeJsonFile('auth-credentials.json', credentials);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        therapistRole: newUser.therapistRole,
        organization: newUser.organization,
      },
    });
  } catch (error) {
    logger.error('Signup error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}
