import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userRepository } from '@/lib/data/repositories';
import {
  findCredentialByEmail,
  updateCredentialPassword,
} from '@/lib/data/auth-credentials';
import {
  verifyPassword,
  hashPassword,
  isHashedPassword,
  checkRateLimit,
} from '@/lib/security';
import { attachSessionCookie } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

// Generic message so we never reveal whether an email exists.
const INVALID_CREDENTIALS = 'אימייל או סיסמה שגויים. אנא נסה שוב.';

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Throttle login attempts per client IP to slow credential stuffing.
    if (!checkRateLimit(`login:${clientIp(request)}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'יותר מדי ניסיונות התחברות. אנא נסה שוב בעוד מספר דקות.' },
        { status: 429 }
      );
    }

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נא להזין אימייל וסיסמה תקינים' },
        { status: 400 }
      );
    }

    const { rememberMe } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    const user = await userRepository.findByEmail(email);
    const userCredentials = await findCredentialByEmail(email);

    // Always run a comparison to keep timing roughly constant whether or not
    // the account exists, then fail with a single generic message.
    let valid = false;
    if (user && userCredentials) {
      if (isHashedPassword(userCredentials.password)) {
        valid = await verifyPassword(password, userCredentials.password);
      } else {
        // Legacy plaintext credential: verify, then transparently upgrade to
        // a bcrypt hash on first successful login.
        valid = password === userCredentials.password;
        if (valid) {
          await updateCredentialPassword(email, await hashPassword(password));
        }
      }
    }

    if (!user || !userCredentials || !valid) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    await userRepository.update(user.id, { lastLogin: new Date() });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        therapistRole: user.therapistRole,
        organization: user.organization,
      },
      rememberMe,
    });

    // Issue an httpOnly, signed session cookie used for server-side
    // authorization on subsequent API requests.
    return attachSessionCookie(response, {
      sub: user.id,
      role: user.role,
      therapistRole: user.therapistRole,
    });
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
