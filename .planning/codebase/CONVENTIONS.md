# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `NewSessionForm.tsx`, `SessionList.tsx`, `AudioPlayer.tsx`)
- Utility/library files: camelCase (e.g., `utils.ts`, `mock-data.ts`, `api-client.ts`)
- Hooks: camelCase with `use-` prefix (e.g., `use-sessions.ts`, `use-patients.ts`, `use-voice-recordings.ts`)
- Repositories: `[entity].repository.ts` (e.g., `user.repository.ts`, `session.repository.ts`)
- API route files: `route.ts` in Next.js app directory structure (e.g., `src/app/api/sessions/route.ts`)
- Types files: Index pattern in directories (e.g., `src/types/index.ts`, `src/lib/data/types.ts`)

**Functions:**
- Camel case for all functions, hooks, and utilities: `generateSessionSummary()`, `encryptData()`, `sanitizeInput()`
- React components are PascalCase: `NewSessionForm`, `SessionList`, `Card`
- Hook functions follow `useXxx` pattern: `useSessions()`, `usePatients()`, `useVoiceRecordings()`
- Handler functions: `handle` prefix (e.g., `handleSubmit`, `handleChange`)
- Async operations: no special prefix, conventional naming (e.g., `fetchSessions()`, `createSession()`)

**Variables:**
- Camel case for all variables: `formData`, `isSubmitting`, `sessionData`, `therapistId`, `patientId`
- Boolean variables: `is`/`has` prefix convention (e.g., `isLoading`, `isSubmitting`, `hasError`, `consentObtained`)
- Arrays: plural form (e.g., `sessions`, `patients`, `therapists`, `interventionsUsed`)
- Constants: UPPER_SNAKE_CASE when truly constant (e.g., `ENCRYPTION_KEY`)

**Types:**
- Type names: PascalCase (e.g., `TherapistRole`, `SessionType`, `Patient`, `Session`)
- Type aliases use pipes for unions (e.g., `'psychologist' | 'psychiatrist' | 'social_worker'`)
- Interfaces: PascalCase (e.g., `SessionNotes`, `RiskAssessment`, `User`)
- Enums: PascalCase values in discriminated unions (e.g., `'initial_assessment' | 'individual_therapy'`)

## Code Style

**Formatting:**
- Prettier is configured via ESLint (no separate .prettierrc)
- Line length: 80-120 characters typical
- Spacing: 2 spaces for indentation
- No semicolons at line endings (Prettier removes them)
- Object destructuring preferred: `const { id, name } = user`
- Import statements on separate lines from code body

**Linting:**
- ESLint config: `extends: "next/core-web-vitals"` (`C:\Users\Yosefg\AI\AI PILOT\therapy-docs\therapy-docs\.eslintrc.json`)
- Uses Next.js recommended rules for React and web vitals
- TypeScript strict mode enabled: `"strict": true` in tsconfig.json
- No console errors allowed in production code (use `console.error()` in API handlers only for logging)

## Import Organization

**Order:**
1. React and third-party imports (e.g., `import React`, `import { useState }`)
2. Next.js imports (e.g., `import Link from 'next/link'`, `import { NextRequest }`)
3. Type imports from `@/types` (e.g., `import { Session, User } from '@/types'`)
4. Internal library imports from `@/lib` (e.g., `import { apiClient } from '@/lib/api/client'`)
5. Component imports from `@/components` (e.g., `import { Button, Card } from '@/components/ui'`)
6. Utility imports (e.g., `import { cn } from '@/lib/utils'`)

**Path Aliases:**
- Base alias: `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- All imports use `@/` alias, never relative paths like `../../../`
- Example: `import { useSessions } from '@/lib/hooks'` not `import from '../../../lib/hooks'`
- Barrel exports: `src/components/ui/index.tsx`, `src/lib/hooks/index.ts` used for re-exports

## Error Handling

**Patterns:**
- Try-catch blocks wrap async operations and JSON parsing
- API handlers use try-catch with error differentiation: check `instanceof z.ZodError` for validation errors
- UI forms catch errors and set error state: `catch (err) { setError('Human-readable message') }`
- Zod validation errors parsed and returned with `status: 400`
- Unknown errors logged with `console.error()` and returned with generic message + `status: 500`
- Hooks return error state: `const { error, setError } = useState<string | null>(null)`

Example from `src/app/api/patients/route.ts`:
```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
  }
  console.error('Error creating patient:', error);
  return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
}
```

## Logging

**Framework:** `console.error()` only for API route errors (not `console.log`)

**Patterns:**
- Log errors with context: `console.error('Error creating patient:', error)`
- No production logging for successful operations
- Console only used in server-side code (API routes)
- UI errors shown to users via state management, not console

## Comments

**When to Comment:**
- Comment business logic that's non-obvious (e.g., HIPAA compliance notes)
- Explain "why", not "what" (code should be self-documenting for "what")
- Security considerations always commented (e.g., demo-only encryption warnings)
- Production limitations noted (e.g., "In production, use AWS KMS instead")

Example from `src/lib/security.ts`:
```typescript
// Simple XOR-based encryption for demo purposes
// In production, use Web Crypto API or a proper encryption library
export function encryptData(plaintext: string): string {
```

**JSDoc/TSDoc:**
- Minimal use; TypeScript types provide documentation
- Used for provider components and complex utilities
- Example from `src/lib/contexts/ClientProviders.tsx`:
```typescript
/**
 * Client-side providers wrapper
 * This component wraps all client-side providers for the app
 */
export function ClientProviders({ children }: ClientProvidersProps) {
```

## Function Design

**Size:**
- API handlers: 40-80 lines (including validation and error handling)
- React components: 100-200 lines before extraction to sub-components
- Utility functions: Keep under 50 lines; extract multi-step logic

**Parameters:**
- Use destructuring for objects with 2+ properties
- Props interfaces for components (e.g., `NewSessionFormProps`)
- API validation with Zod schemas before function body

**Return Values:**
- Explicit return types on all functions (TypeScript strict mode)
- Hooks return tuples `[state, setState]` or object `{ state, error, loading }`
- API handlers return `NextResponse.json()`
- Async functions always return Promise-typed value

## Module Design

**Exports:**
- Named exports preferred: `export function useSessions()` not `export default`
- Barrel files used for grouping: `src/components/ui/index.tsx` exports all UI components
- Single responsibility per file (one component or one utility per file)

**Barrel Files:**
- `src/components/ui/index.tsx`: Re-exports all UI components (Button, Card, Badge, etc.)
- `src/lib/hooks/index.ts`: Re-exports all custom hooks
- `src/lib/data/repositories/index.ts`: Re-exports all repositories

Example from `src/components/ui/index.tsx`:
```typescript
export { Button } from './button'
export { Card, CardHeader, CardTitle, CardContent, CardDescription } from './card'
export { Badge } from './badge'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'
```

## Component Architecture

**Client vs Server Components:**
- All page components are client components: `'use client'` directive at top
- All data-fetching hooks prefixed with `'use client'` directive
- Providers are client components: `ClientProviders.tsx`, `SessionReminderProvider.tsx`
- Layout root (`src/app/layout.tsx`) is server component; wraps with `ClientProviders`
- API routes are server-only

**Component Structure:**
- Props interface defined at top: `interface NewSessionFormProps { ... }`
- Component function receives destructured props
- State hooks first: `useState`, `useEffect`
- Event handlers next: `const handleSubmit = ...`
- JSX return at bottom

## Type Definitions

**Pattern:**
- Central types file: `src/types/index.ts` contains all domain models
- Zod schemas in API route files for validation: `const createSessionSchema = z.object({ ... })`
- Type guard functions: `instanceof z.ZodError` for error type checking
- Props interfaces co-located with components: defined above component function

**Discriminated Unions:**
- Role enums: `'psychologist' | 'psychiatrist' | 'social_worker'` etc.
- Status enums: `'scheduled' | 'in_progress' | 'completed'` etc.
- No enum keyword; union types with string literals only

## Tailwind CSS Conventions

**Color Palette:**
- Primary: `sage-*` classes (e.g., `bg-sage-600`, `text-sage-700`, `border-sage-100`)
- Secondary: `warm-*` classes (e.g., `bg-warm-100`, `hover:bg-warm-200`)
- Text: `clinical-*` classes (e.g., `text-clinical-900`, `text-clinical-500`)
- Destructive: `red-*` classes (e.g., `bg-red-600`, `text-red-700`)

**Custom Utilities:**
- Shadow: `shadow-soft` (standard), `shadow-glow` (hover effect)
- Animations: `fade-in`, `slide-up`, `pulse-soft` (defined in tailwind config)
- Layout: `space-y-*` for vertical spacing, `gap-*` for flex gaps
- Responsive: Tailwind breakpoints used (sm, md, lg, xl)

Example from `src/components/ui/button.tsx`:
```typescript
className={cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200",
  hover && "transition-all duration-300 hover:shadow-glow hover:border-sage-200 hover:-translate-y-0.5 cursor-pointer",
  paddings[padding],
  className
)}
```

---

*Convention analysis: 2026-01-22*
