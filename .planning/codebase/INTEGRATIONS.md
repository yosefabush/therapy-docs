# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**Speech-to-Text & Audio Processing:**
- Deepgram API - Real-time and file-based audio transcription with speaker diarization
  - SDK: `@deepgram/sdk` 4.11.3
  - Auth: `DEEPGRAM_API_KEY` environment variable
  - Endpoint: `src/app/api/transcribe/route.ts`
  - Features: Multi-language support (Hebrew: 'he', English: 'en'), speaker diarization, smart formatting, punctuation
  - Models: `whisper-large` for Hebrew, `nova-2` for other languages
  - Usage: Voice recordings transcription, diarized speaker identification in therapy sessions

**Browser APIs:**
- Web Audio API - Client-side audio recording for voice notes
- Web Speech Recognition API - Browser-native speech-to-text (via `react-speech-recognition`)
- File System API - Local file reading for audio uploads

## Data Storage

**Databases:**
- None (Not applicable - no traditional database)

**File Storage:**
- Local JSON file system storage
  - Location: `data/` directory in project root
  - Implementation: `src/lib/data/json-store.ts`
  - Files created:
    - `users.json` - User accounts and profiles
    - `patients.json` - Patient demographics and records
    - `sessions.json` - Clinical session notes and metadata
    - `treatment-goals.json` - Treatment objectives
    - `reports.json` - Generated reports
    - `voice-recordings.json` - Voice recording metadata
    - `auth-credentials.json` - Authentication credentials (plaintext in development)
  - Atomic writes with temp file pattern for consistency
  - Date parsing with JSON reviver for proper Date object handling

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom/Mock implementation
  - Implementation: `src/lib/mock-auth.ts` and `src/app/api/auth/login/route.ts`
  - Approach: Email/password authentication with in-memory user registry
  - Token: Session stored in browser localStorage (manual implementation)
  - Default test users: psych/psychiatrist/social_worker roles with credentials
  - Features: Login, signup, remember-me flag
  - Security note: Passwords stored in plaintext in JSON files (development only)

**Authorization:**
- Role-based access control (RBAC)
  - Roles: psychologist, psychiatrist, social_worker, occupational_therapist, speech_therapist, physical_therapist, counselor, art_therapist, music_therapist, family_therapist
  - Role-specific templates and features in `src/lib/templates.ts`

**Password Security:**
- bcryptjs 2.4.3 - Available but not actively used in current auth (see CONCERNS.md)
- Current: Plain text comparison in login route

**Token/Session Management:**
- jose 5.9.2 - Available for JWT but not actively integrated
- Current: Manual localStorage-based session handling

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Browser console logging
- Server-side console.error for transcription and API errors
- No centralized logging service

**Audit Logging:**
- Framework exists: `src/lib/security.ts` with `createAuditEntry()` function
- Structure: timestamp, userId, action, resourceType, resourceId, ipAddress, details
- Currently not integrated into API routes

## CI/CD & Deployment

**Hosting:**
- Not detected - Application is development-focused

**CI Pipeline:**
- Playwright test runner configured (`playwright.config.ts`)
- Test command: `npm run test`
- Test UI: `npm run test:ui`
- No GitHub Actions or external CI service detected

## Environment Configuration

**Required env vars:**
- `DEEPGRAM_API_KEY` - Speech transcription (present in .env.local)

**Optional env vars:**
- `ENCRYPTION_KEY` - PHI encryption (defaults to demo value)
- `CI` - Used in Playwright test configuration for CI environments

**Secrets location:**
- `.env.local` - Local development secrets (git-ignored)
- Production: Should use environment variable injection or secrets management service

## Data Encryption

**Implementation:**
- Location: `src/lib/security.ts`
- Current approach: XOR-based encryption for demo (NOT secure for production)
- Scope: Intended for PHI (personally identifiable health information)
- Type definitions: `EncryptedContact` in `src/types/index.ts`
- Note: Requires proper key management in production (AWS KMS, Azure Key Vault)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## External Libraries for Integration Support

**HTTP/Fetch:**
- Native `fetch()` API - Used for transcription service calls
  - Endpoint: `/api/transcribe` (internal Next.js API route)

**Export/Reporting:**
- html2pdf.js - Client-side PDF generation from clinical reports
  - Usage: `src/app/reports/page.tsx`
  - Dynamically imported to avoid SSR issues

---

*Integration audit: 2026-01-22*
