// Mock authentication data and helpers for development

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

// Mock users database
export const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'ד"ר שרה כהן',
    email: 'sarah@therapydocs.com',
    password: 'password123',
    role: 'psychologist',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'ד"ר יוסי לוי',
    email: 'yossi@therapydocs.com',
    password: 'password123',
    role: 'psychiatrist',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'מיכל ברק',
    email: 'michal@therapydocs.com',
    password: 'password123',
    role: 'social_worker',
    createdAt: '2024-03-10',
  },
];

// Simulated registered users (starts with mock users)
let registeredUsers: MockUser[] = [...mockUsers];

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<MockUser, 'password'>;
  error?: string;
}

// Simulate login
export function mockLogin(credentials: LoginCredentials): AuthResult {
  const user = registeredUsers.find(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
  );

  if (!user) {
    return {
      success: false,
      error: 'משתמש לא נמצא. אנא בדוק את כתובת האימייל.',
    };
  }

  if (user.password !== credentials.password) {
    return {
      success: false,
      error: 'סיסמה שגויה. אנא נסה שוב.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return {
    success: true,
    user: userWithoutPassword,
  };
}

// Simulate signup
export function mockSignup(data: SignupData): AuthResult {
  // Check if email already exists
  const existingUser = registeredUsers.find(
    (u) => u.email.toLowerCase() === data.email.toLowerCase()
  );

  if (existingUser) {
    return {
      success: false,
      error: 'כתובת אימייל זו כבר רשומה במערכת.',
    };
  }

  // Create new user
  const newUser: MockUser = {
    id: String(registeredUsers.length + 1),
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'therapist',
    createdAt: new Date().toISOString().split('T')[0],
  };

  registeredUsers.push(newUser);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser;
  return {
    success: true,
    user: userWithoutPassword,
  };
}

// Reset registered users (for testing)
export function resetMockUsers(): void {
  registeredUsers = [...mockUsers];
}

// Get all registered users (without passwords)
export function getMockUsers(): Omit<MockUser, 'password'>[] {
  return registeredUsers.map(({ password, ...user }) => user);
}
