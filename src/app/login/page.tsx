'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Stethoscope } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { storeAuthUser } from '@/lib/hooks';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        // Store auth user in localStorage or sessionStorage based on rememberMe
        storeAuthUser(result.user.id, rememberMe);
        router.push('/');
      } else {
        setAuthError(result.error || 'אירעה שגיאה בהתחברות');
      }
    } catch {
      setAuthError('אירעה שגיאה בהתחברות. אנא נסה שוב.');
    }

    setIsLoading(false);
  };

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
            <CardTitle className="text-2xl text-center">התחברות</CardTitle>
            <CardDescription className="text-center">
              הזן את פרטי החשבון שלך להתחברות
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
                    autoComplete="current-password"
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
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-clinical-600 cursor-pointer select-none"
                  >
                    זכור אותי
                  </label>
                </div>
                <Link
                  href="#"
                  className="text-sm text-sage-600 hover:text-sage-700 hover:underline transition-colors"
                >
                  שכחת סיסמה?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                {!isLoading && <LogIn className="w-4 h-4" />}
                התחברות
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-sage-100 mt-2 pt-6">
            <p className="text-sm text-clinical-500">
              אין לך חשבון?{' '}
              <Link
                href="/signup"
                className="text-sage-600 font-medium hover:text-sage-700 hover:underline transition-colors"
              >
                הירשם עכשיו
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Demo credentials hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-clinical-400">
            לצורך הדגמה: dr.sarah.cohen@clinic.co.il / password123
          </p>
        </div>
      </div>
    </div>
  );
}
