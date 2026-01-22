# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
therapy-docs/
├── src/
│   ├── app/                    # Next.js 14 App Router routes and API
│   │   ├── api/                # RESTful API endpoints
│   │   ├── layout.tsx          # Root layout wrapper
│   │   ├── page.tsx            # Dashboard (home)
│   │   ├── login/              # Authentication pages
│   │   ├── signup/
│   │   ├── patients/           # Patient management pages
│   │   ├── sessions/           # Session pages
│   │   ├── reports/            # Report generation pages
│   │   ├── insights/           # AI insights page
│   │   ├── settings/           # User settings
│   │   ├── help/               # Help/resources
│   │   ├── api-docs/           # Swagger API documentation
│   │   └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI library (Button, Card, Modal, etc.)
│   │   ├── layout/             # Layout components (Sidebar, Header)
│   │   ├── patients/           # Patient feature components
│   │   ├── sessions/           # Session feature components
│   │   ├── reports/            # Report feature components
│   │   ├── recordings/         # Voice recording/playback components
│   │   └── ...
│   ├── lib/                    # Business logic and utilities
│   │   ├── data/               # Data access layer
│   │   │   ├── repositories/   # Repository pattern classes
│   │   │   ├── json-store.ts   # JSON file I/O abstraction
│   │   │   └── seed.ts         # Database seeding
│   │   ├── contexts/           # React context providers
│   │   ├── hooks/              # Custom React hooks for data/state
│   │   ├── api/                # API client utilities
│   │   ├── he/                 # Hebrew localization
│   │   ├── ai-features.ts      # AI summarization and patterns
│   │   ├── templates.ts        # Role-specific session templates
│   │   ├── transcription-service.ts  # Deepgram integration
│   │   ├── security.ts         # Encryption utilities
│   │   ├── mock-data.ts        # Mock users, patients, sessions
│   │   ├── mock-auth.ts        # Mock authentication logic
│   │   ├── swagger.ts          # Swagger/OpenAPI definitions
│   │   └── utils.ts            # General utilities
│   └── types/                  # Centralized TypeScript type definitions
├── data/                       # Runtime JSON data files (generated)
│   ├── users.json
│   ├── patients.json
│   ├── sessions.json
│   ├── reports.json
│   ├── treatment-goals.json
│   └── voice-recordings.json
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── playwright.config.ts
└── ...
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes; defines all HTTP entry points
- Contains: Page components (`page.tsx`), layout wrappers (`layout.tsx`), API route handlers (`route.ts`)
- Key files: `page.tsx` (Dashboard), `api/patients/route.ts`, `api/sessions/route.ts`, `api/transcribe/route.ts`

**`src/app/api/`:**
- Purpose: RESTful API endpoints for client requests
- Contains: CRUD endpoints for patients, sessions, reports, treatment goals, voice recordings; authentication endpoints
- Key files: `patients/route.ts`, `sessions/[id]/route.ts`, `transcribe/route.ts`, `auth/login/route.ts`

**`src/components/`:**
- Purpose: React component library organized by feature
- Contains: UI components (reusable like Button, Modal), feature-specific components (SessionForm, PatientList, RecordingsList)
- Key files: `ui/index.tsx` (barrel export), `sessions/NewSessionForm.tsx`, `patients/PatientList.tsx`, `recordings/AudioPlayer.tsx`

**`src/components/ui/`:**
- Purpose: Reusable UI component library (design system)
- Contains: Button, Card, Modal, Input, Textarea, Select, Badge, ProgressBar, CheckBox, Tabs, Dialog, Avatar, Label, Alert
- Key files: Each exported as `button.tsx`, `card.tsx`, `modal.tsx`, etc.

**`src/components/layout/`:**
- Purpose: Page layout structure components
- Contains: Sidebar (navigation), Header (title/breadcrumb/notifications)
- Key files: `Sidebar.tsx`, `Header.tsx`

**`src/lib/`:**
- Purpose: Business logic, utilities, and data access
- Contains: Repository classes, custom hooks, context providers, AI/transcription services, templates, encryption

**`src/lib/data/repositories/`:**
- Purpose: Data persistence abstraction layer using Repository pattern
- Contains: Abstract `JsonRepository<T>` base class, concrete repositories for each entity type
- Key files: `base.repository.ts`, `patient.repository.ts`, `session.repository.ts`, `user.repository.ts`, `voice-recording.repository.ts`

**`src/lib/hooks/`:**
- Purpose: Custom React hooks for data fetching and state management
- Contains: Hooks like `usePatients()`, `useSessions()`, `useMySessions()` (user-filtered), `useNotifications()`, `useAuthRedirect()`
- Key files: `use-my-data.ts`, `use-sessions.ts`, `use-notifications.ts`

**`src/lib/contexts/`:**
- Purpose: React context providers for cross-component state
- Contains: `ClientProviders` wrapper, `SessionReminderProvider`
- Key files: `ClientProviders.tsx`, `SessionReminderProvider.tsx`

**`src/types/`:**
- Purpose: Centralized TypeScript type definitions and interfaces
- Contains: `User`, `Patient`, `Session`, `SessionNotes`, `RiskAssessment`, `Report`, `TreatmentGoal`, `VoiceRecording`, `AIInsight`, `DiarizedTranscript`, `AuditLog`
- Key files: `index.ts` (single file with all domain types)

**`data/`:**
- Purpose: JSON file storage for application data (simulates database)
- Contains: JSON files for users, patients, sessions, reports, treatment goals, voice recordings
- Generated: Yes (seeded on first API call if missing)
- Committed: No (in .gitignore; runtime-generated)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML structure, font imports, ClientProviders wrapper
- `src/app/page.tsx`: Dashboard home page (authenticated users)
- `src/app/login/page.tsx`: Login form entry point

**Configuration:**
- `tsconfig.json`: Path aliases (`@/*` → `src/*`), TypeScript settings
- `tailwind.config.ts`: Tailwind CSS configuration with custom `sage-*`, `warm-*`, `clinical-*` color palettes and animations
- `next.config.js`: Next.js build configuration
- `playwright.config.ts`: E2E test runner configuration

**Core Logic:**
- `src/lib/ai-features.ts`: AI session summarization (role-specific generators)
- `src/lib/templates.ts`: SessionTemplate definitions for 10 therapist roles × multiple session types
- `src/lib/transcription-service.ts`: Deepgram SDK integration for audio-to-text with speaker diarization

**Data Models:**
- `src/types/index.ts`: All TypeScript interfaces and types (centralized)
- `src/lib/mock-data.ts`: Mock users, patients, sessions, reports for seeding

**Testing:**
- `playwright.config.ts`: E2E test configuration
- Test files: Located alongside features (e.g., `*.test.ts`, `*.spec.ts`) - not observed in current structure

## Naming Conventions

**Files:**
- Pages: `page.tsx` in route directories
- Components: PascalCase (`PatientList.tsx`, `SessionActionModal.tsx`)
- Utilities: kebab-case (`json-store.ts`, `use-auth-redirect.ts`)
- Repositories: kebab-case with `.repository.ts` suffix (`patient.repository.ts`)
- Hooks: `use-` prefix in kebab-case (`use-my-sessions.ts`, `use-notifications.ts`)

**Directories:**
- Features: lowercase, plural (`components/patients/`, `src/app/reports/`)
- Utilities: lowercase (`lib/`, `data/`, `hooks/`)
- Named routes: square brackets for dynamic segments (`[id]`, `[feature]`)

**Types & Interfaces:**
- PascalCase: `User`, `Patient`, `Session`, `SessionNotes`, `RiskAssessment`
- Enums: `TherapistRole`, `SessionType`, `ReportType`, `AuditAction`

**Functions:**
- camelCase: `generateSessionSummary()`, `generatePsychologySummary()`, `findByTherapist()`
- Custom hooks: `usePatients()`, `useMySessions()`, `useNotifications()`

**Variables & Constants:**
- camelCase: `mockUsers`, `sessionTemplates`, `therapistRoleLabels`

## Where to Add New Code

**New Feature (e.g., Risk Assessment Dashboard):**
- Primary code: `src/components/[feature]/RiskAssessmentDashboard.tsx`
- Page: `src/app/[feature]/page.tsx`
- API: `src/app/api/[resource]/route.ts`
- Types: Add interfaces to `src/types/index.ts`
- Repository: `src/lib/data/repositories/[resource].repository.ts` if new data entity
- Tests: `src/components/[feature]/*.test.ts` or `src/app/api/*.test.ts`

**New Component/Module:**
- Implementation: `src/components/[feature]/ComponentName.tsx`
- Export: Add to component barrel file or feature index
- Styling: Use Tailwind CSS with custom clinical palette (sage-*, warm-*, clinical-*)
- Type safety: Import types from `@/types`

**Utilities & Helpers:**
- Shared helpers: `src/lib/[domain]-utils.ts` or feature-specific `src/lib/[feature]/`
- Hooks: `src/lib/hooks/use-[resource].ts`
- Services: `src/lib/[service-name].ts` (e.g., `transcription-service.ts`, `ai-features.ts`)

**Database Operations:**
- Repository methods: Add to existing repository in `src/lib/data/repositories/` or create new one
- API routes: Call repository methods in `src/app/api/[resource]/route.ts`
- Always use repository interface, never direct file access outside data layer

## Special Directories

**`src/lib/he/`:**
- Purpose: Hebrew localization files
- Generated: No
- Committed: Yes
- Contains: Hebrew translations and date/text formatters

**`data/`:**
- Purpose: Runtime JSON data storage
- Generated: Yes (created by `seedIfEmpty()` on first API call)
- Committed: No (in .gitignore)
- Structure: One JSON file per entity type

**`src/components/ui/`:**
- Purpose: Design system UI library
- Generated: No
- Committed: Yes
- Style: Tailwind CSS with Radix UI primitives and custom medical color palette

---

*Structure analysis: 2026-01-22*
