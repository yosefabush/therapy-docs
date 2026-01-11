import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/repositories';
import { readJsonFile, writeJsonFile } from '@/lib/data/json-store';

interface AuthCredentials {
  id: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'נא להזין אימייל וסיסמה' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await userRepository.findByEmail(email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא. אנא בדוק את כתובת האימייל.' },
        { status: 401 }
      );
    }

    // Check password from auth credentials file
    const credentials = await readJsonFile<AuthCredentials>('auth-credentials.json');
    const userCredentials = credentials.find(c => c.email.toLowerCase() === email.toLowerCase());

    if (!userCredentials || userCredentials.password !== password) {
      return NextResponse.json(
        { error: 'סיסמה שגויה. אנא נסה שוב.' },
        { status: 401 }
      );
    }

    // Update last login
    await userRepository.update(user.id, { lastLogin: new Date() });

    // Return user data with rememberMe flag
    return NextResponse.json({
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
