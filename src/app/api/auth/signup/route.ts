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
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'נא למלא את כל השדות' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email.toLowerCase());

    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת אימייל זו כבר רשומה במערכת.' },
        { status: 400 }
      );
    }

    // Create the user in users.json
    const newUser = await userRepository.create({
      email: email.toLowerCase(),
      name,
      role: 'therapist',
      therapistRole: 'psychologist', // Default role
      organization: 'מרכז הרמוניה לבריאות הנפש',
      lastLogin: new Date(),
    });

    // Store credentials in auth-credentials.json
    const credentials = await readJsonFile<AuthCredentials>('auth-credentials.json');
    credentials.push({
      id: newUser.id,
      email: email.toLowerCase(),
      password: password, // In production, this should be hashed
    });
    await writeJsonFile('auth-credentials.json', credentials);

    // Return success with user data
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}
