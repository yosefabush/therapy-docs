'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Stethoscope, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'נא להזין שם מלא';
    } else if (name.trim().length < 2) {
      newErrors.name = 'השם חייב להכיל לפחות 2 תווים';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'נא להזין כתובת אימייל';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'נא להזין סיסמה';
    } else if (password.length < 6) {
      newErrors.password = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password = 'הסיסמה חייבת להכיל אותיות ומספרים';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'נא לאשר את הסיסמה';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setAuthError(result.error || 'אירעה שגיאה בהרשמה');
      }
    } catch {
      setAuthError('אירעה שגיאה בהרשמה. אנא נסה שוב.');
    }

    setIsLoading(false);
  };

  // Password strength indicator
  const getPasswordStrength = (): { level: number; text: string; color: string } => {
    if (!password) return { level: 0, text: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, text: 'חלשה', color: 'bg-red-500' };
    if (strength <= 3) return { level: 2, text: 'בינונית', color: 'bg-amber-500' };
    return { level: 3, text: 'חזקה', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-warm-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card padding="lg" className="shadow-soft text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2
              className="text-2xl font-bold text-clinical-900 mb-2"
              style={{ fontFamily: 'Georgia, Cambria, serif' }}
            >
              ההרשמה הושלמה בהצלחה!
            </h2>
            <p className="text-clinical-500 mb-4">
              ברוכים הבאים ל-TherapyDocs. מעביר אותך לדף ההתחברות...
            </p>
            <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-warm-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-600 rounded-2xl mb-4 shadow-glow">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-3xl font-bold text-clinical-900"
            style={{ fontFamily: 'Georgia, Cambria, serif' }}
          >
            TherapyDocs
          </h1>
          <p className="text-clinical-500 mt-2">מערכת תיעוד קליני מאובטחת</p>
        </div>

        <Card padding="none" className="shadow-soft">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">יצירת חשבון</CardTitle>
            <CardDescription className="text-center">
              הזן את הפרטים שלך ליצירת חשבון חדש
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <Input
                type="text"
                label="שם מלא"
                placeholder="ד״ר ישראל ישראלי"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                error={errors.name}
                disabled={isLoading}
                autoComplete="name"
              />

              <Input
                type="email"
                label="אימייל"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
                dir="ltr"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-clinical-700">
                  סיסמה
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    disabled={isLoading}
                    autoComplete="new-password"
                    dir="ltr"
                    className={`flex h-10 w-full rounded-lg border bg-white px-4 py-2.5 pe-10 text-sm text-clinical-900 placeholder:text-clinical-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
                      errors.password
                        ? 'border-red-400 focus-visible:ring-red-500'
                        : 'border-sage-200 focus-visible:ring-sage-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical-400 hover:text-clinical-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
                {password && !errors.password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.level
                              ? passwordStrength.color
                              : 'bg-clinical-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-clinical-500">
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-clinical-700">
                  אישור סיסמה
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    disabled={isLoading}
                    autoComplete="new-password"
                    dir="ltr"
                    className={`flex h-10 w-full rounded-lg border bg-white px-4 py-2.5 pe-10 text-sm text-clinical-900 placeholder:text-clinical-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
                      errors.confirmPassword
                        ? 'border-red-400 focus-visible:ring-red-500'
                        : 'border-sage-200 focus-visible:ring-sage-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical-400 hover:text-clinical-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
                {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    <span>הסיסמאות תואמות</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                {!isLoading && <UserPlus className="w-4 h-4" />}
                יצירת חשבון
              </Button>

              <p className="text-xs text-clinical-400 text-center">
                בלחיצה על &quot;יצירת חשבון&quot; הנך מסכים/ה ל
                <Link href="#" className="text-sage-600 hover:underline mx-1">
                  תנאי השימוש
                </Link>
                ול
                <Link href="#" className="text-sage-600 hover:underline mx-1">
                  מדיניות הפרטיות
                </Link>
              </p>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-sage-100 mt-2 pt-6">
            <p className="text-sm text-clinical-500">
              כבר יש לך חשבון?{' '}
              <Link
                href="/login"
                className="text-sage-600 font-medium hover:text-sage-700 hover:underline transition-colors"
              >
                התחבר כאן
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
