# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Next.js 14 App Router with Client/Server Component Separation and Repository Pattern Data Access

**Key Characteristics:**
- Server-side Next.js 14 App Router with TypeScript for route definition and data operations
- Client components (`'use client'`) for interactive UI and hooks-based state management
- Repository pattern for data abstraction (`src/lib/data/repositories/`)
- Feature-based component organization with role-specific business logic
- HIPAA-compliant design with encrypted data fields and audit-ready types
- Hebrew localization (RTL) with clinical/medical styling

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render interactive user interfaces for therapists
- Location: `src/components/`
- Contains: Feature-specific components (sessions, patients, reports, recordings), layout components (Sidebar, Header), and reusable UI library components
- Depends on: Hooks (data fetching), Types, Contexts (state providers)
- Used by: Next.js pages in `src/app/`

**Page/Route Layer:**
- Purpose: Next.js App Router entry points that orchestrate pages and coordinate component rendering
- Location: `src/app/page.tsx`, `src/app/[feature]/page.tsx`, `src/app/api/`
- Contains: Dashboard, patients, sessions, reports, insights, settings, login/signup pages and API routes
- Depends on: Components, Hooks, Repositories (via API routes), Types
- Used by: Browser routing, external API consumers

**API/Route Handler Layer:**
- Purpose: RESTful API endpoints for CRUD operations and server-side business logic
- Location: `src/app/api/`
- Contains: Handlers for authentication, patients, sessions, reports, treatment goals, voice recordings, transcription
- Depends on: Repositories, Types, Validation (Zod), Services (AI features, transcription)
- Used by: Client components via hooks, external integrations

**Business Logic Layer:**
- Purpose: Domain-specific logic independent of HTTP/UI concerns
- Location: `src/lib/ai-features.ts`, `src/lib/templates.ts`, `src/lib/transcription-service.ts`
- Contains: AI session summarization (role-specific), template definitions by role and session type, voice transcription processing (Deepgram integration)
- Depends on: Types, Mock data for labels
- Used by: API routes, components

**Data Access Layer (Repository Pattern):**
- Purpose: Abstract database access and provide queryable interfaces
- Location: `src/lib/data/repositories/`
- Contains: JSON-file based repositories for Patient, User, Session, Report, TreatmentGoal, VoiceRecording with query methods
- Depends on: JSON store utility, Types
- Used by: API routes exclusively (keeps data operations server-side)

**Utilities & Context Layer:**
- Purpose: Cross-cutting concerns and shared state management
- Location: `src/lib/`, `src/lib/contexts/`
- Contains: Hooks for data fetching, contexts for client-side providers, security utilities (encryption), mock data, localizations (Hebrew)
- Depends on: Types, API calls
- Used by: Components, Pages

## Data Flow

**Session Creation and Documentation Flow:**

1. User clicks "Schedule New Session" on Dashboard (`src/app/page.tsx`)
2. NewSessionForm component (`src/components/sessions/NewSessionForm.tsx`) renders in modal
3. Form submission POSTs to `/api/sessions` route handler
4. Route handler validates input with Zod schema, calls `sessionRepository.create()`
5. Repository writes to `data/sessions.json` file
6. Response returned to client, hooks refetch session list via `useMySessions()`
7. Component state updates, list re-renders

**Therapist Role-Specific Session Notes:**

1. Therapist selects session type and their role (psychologist, psychiatrist, etc.)
2. SessionActionModal or NewSessionForm loads appropriate template from `src/lib/templates.ts`
3. Template specifies required fields, intervention options, and assessment scales per role
4. User fills fields and submits
5. Notes stored in `Session.notes` (type `SessionNotes`)
6. When generating reports, `generateSessionSummary()` from `src/lib/ai-features.ts` tailors output based on therapist role

**Voice Recording and Transcription:**

1. AudioRecorder component captures audio during session
2. User can initiate transcription via UI
3. Base64 audio data POSTs to `/api/transcribe`
4. Route handler sends to Deepgram SDK for speech-to-text with speaker diarization
5. Deepgram returns `DiarizedTranscript` with speaker labels and utterances
6. VoiceRecording object created with `diarizedTranscript` field
7. Component displays transcription with speaker identification (therapist vs. patient labels)

**State Management:**

- Client-side state: Local React `useState()` for modals, form inputs, UI toggles (see Dashboard page.tsx)
- Server state: Repository-backed data in JSON files, accessed via API
- Auth state: Stored via `storeAuthUser()` utility in hooks (`use-users.ts`), retrieved with `useAuthRedirect()`
- User context: `SessionReminderProvider` wraps app in `ClientProviders` for cross-page concerns

## Key Abstractions

**Repository Pattern:**

- Purpose: Decouple data persistence implementation from business logic
- Examples: `src/lib/data/repositories/patient.repository.ts`, `src/lib/data/repositories/session.repository.ts`
- Pattern: Abstract `JsonRepository<T>` base class implements CRUD + custom query methods; concrete repositories extend and specialize

**Session Template System:**

- Purpose: Support 10 therapist roles with role/session-type specific form fields and interventions
- Examples: `sessionTemplates` array in `src/lib/templates.ts` defines 20+ template combinations
- Pattern: `SessionTemplate` interface maps role + sessionType to field definitions, default interventions, and assessment scales

**Encrypted Data Model:**

- Purpose: HIPAA compliance through field-level encryption
- Examples: `Patient.encryptedData`, `EncryptedContact` types in `src/types/index.ts`
- Pattern: PHI stored encrypted; decrypted fields populated for authorized users on client

**AI Insights Generation:**

- Purpose: Role-specific pattern recognition and summaries
- Examples: `generateSessionSummary()` dispatches to `generatePsychologySummary()`, `generatePsychiatrySummary()`, etc.
- Pattern: Strategy pattern - therapist role selects which summary generator to invoke

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Root HTML structure, font loading, client provider wrapper, session reminder context

**Dashboard (Authenticated Home):**
- Location: `src/app/page.tsx`
- Triggers: User logs in and navigates to dashboard
- Responsibilities: Load current user (via `useAuthRedirect`), fetch user's patients/sessions/goals, display stats, schedule modal, AI insights

**Authentication:**
- Location: `src/app/login/page.tsx`, `src/app/signup/page.tsx`
- Triggers: Unauthenticated access
- Responsibilities: Credentials entry, form submission to `/api/auth/login` or `/api/auth/signup`

**API Routes (Server Entry Points):**
- Patients: `/api/patients`, `/api/patients/[id]`, `/api/patients/[id]/sessions`
- Sessions: `/api/sessions`, `/api/sessions/[id]`
- Reports: `/api/reports`, `/api/reports/[id]`
- Audio: `/api/voice-recordings`, `/api/transcribe`

## Error Handling

**Strategy:** Try-catch blocks at API layer with Zod validation, client-side error boundaries optional

**Patterns:**

- API Routes: Catch errors, log to console, return JSON with error message and HTTP status code
- Example: `src/app/api/patients/route.ts` catches validation errors from Zod, returns 400 with details; uncaught errors return 500
- Components: No global error boundary observed; individual hooks may fail silently (e.g., return empty array on fetch failure)
- Data Persistence: JSON repository operations throw on file I/O errors; not caught at route handler level (propagates as 500)

## Cross-Cutting Concerns

**Logging:** `console.error()` calls in API route handlers; no structured logging framework detected

**Validation:** Zod schemas in API routes (`src/app/api/patients/route.ts` uses `createPatientSchema`)

**Authentication:** Custom mock auth in `src/lib/mock-auth.ts` and `use-users.ts` hook; no session middleware observed; auth state stored in browser storage via `storeAuthUser()`

**Authorization:** Role-based filtering in repositories (e.g., `PatientRepository.findByTherapist(therapistId)`) and hooks (`useMySessions()` filters by current user ID)

**Audit Logging:** `AuditLog` type defined in `src/types/index.ts` with `action`, `resourceType`, `userId`, but no audit middleware implemented

---

*Architecture analysis: 2026-01-22*
