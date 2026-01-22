# Codebase Concerns

**Analysis Date:** 2026-01-22

## Security Issues

### Critical: Exposed API Key in Version Control

**Risk:** Deepgram API key is hardcoded in `.env.local` and committed to repository
- **Files:** `.env.local` (line 3)
- **Current mitigation:** `.env.local` is gitignored, but the key appears to be exposed in commit history
- **Impact:** Anyone with repository access can make API calls as this service; unauthorized usage charges
- **Recommendations:**
  - Rotate the exposed key immediately
  - Implement environment variable management (never commit .env files)
  - Use a secrets vault (AWS Secrets Manager, HashiCorp Vault, or similar)
  - Add pre-commit hooks to prevent .env files from being committed

### High: Weak Encryption Implementation

**Risk:** Encryption uses simple XOR cipher instead of industry-standard encryption
- **Files:** `src/lib/security.ts` (lines 4-24, 26-42)
- **Problem:** XOR-based encryption is cryptographically broken. The key is derived from a hardcoded demo string.
- **What's encrypted:** Patient data (`encryptedData`), audio URLs (`encryptedAudioUrl`), transcripts (`encryptedTranscript`)
- **Current mitigation:** Comments acknowledge this is "demo only," but code is used in production UI
- **Impact:** PHI (Protected Health Information) is vulnerable to decryption; HIPAA non-compliant
- **Recommendations:**
  - Replace with Web Crypto API (AES-256-GCM) for client-side
  - Use proper backend encryption libraries (libsodium, TweetNaCl.js, or crypto module)
  - Implement proper key derivation (PBKDF2, Argon2)
  - Store encryption keys in secure key management service
  - Consider using a library like `tweetnacl` or `libsodium.js` for authenticated encryption

### High: Simple JWT Validation

**Risk:** Session token validation only checks format, not signature or expiration
- **Files:** `src/lib/security.ts` (lines 75-80)
- **Problem:** `isValidSessionToken()` only checks if token has 3 dot-separated parts
- **Impact:** Tokens can be forged; invalid tokens may be accepted
- **Recommendations:**
  - Implement proper JWT verification with `jose` library (already in dependencies)
  - Validate signature, expiration, and claims
  - Use HS256 or RS256 signing algorithm

### Medium: Plaintext Passwords in Mock Data

**Risk:** Test/demo credentials with hardcoded passwords visible in code
- **Files:** `src/lib/mock-auth.ts` (lines 13-38)
- **Problem:** Demo users have hardcoded passwords like "password123"
- **Impact:** If this code is used in any production environment, accounts are compromised
- **Recommendations:**
  - Only use mock auth in development environment
  - Add guards to prevent mock auth from running in production
  - Use environment-based feature flags

## Tech Debt

### High: Large Component Files with Multiple Responsibilities

**Risk:** Components exceed 600+ lines with mixed concerns
- **Files:**
  - `src/components/recordings/VoiceRecorder.tsx` (674 lines) - Recording, transcription, diarization, UI
  - `src/components/sessions/SessionForm.tsx` (424 lines) - Form validation, submission, error handling
  - `src/app/page.tsx` (408 lines) - Dashboard, stats calculation, insight generation
  - `src/app/patients/page.tsx` (392 lines) - Patient list, filters, modals
  - `src/app/reports/page.tsx` (520 lines) - Report generation, formatting, export

- **Current state:** Components mix business logic, state management, UI rendering, and API calls
- **Impact:** Hard to test, difficult to reuse logic, maintenance nightmare
- **Recommendations:**
  - Extract transcription logic to separate service
  - Extract form validation to Zod schemas and custom hooks
  - Create custom hooks for data fetching (useSessionData, usePatientData, etc.)
  - Use composition to break down complex UIs

### High: TypeScript `any` Type Usage

**Risk:** Multiple uses of `as any` bypasses type safety
- **Files:**
  - `src/components/recordings/VoiceRecorder.tsx` (line 71) - `(window as any).SpeechRecognition`
  - `src/components/recordings/AudioTranscription.tsx` (lines 49, 138) - Same window type casting
  - `src/app/reports/page.tsx` (line 69) - `(reportToDownload as any).title`

- **Impact:** Lost type safety; potential runtime errors not caught at compile time
- **Recommendations:**
  - Define proper interfaces for browser APIs (Web Speech API)
  - Type cast appropriately with const assertions or proper typing
  - Create utility files for browser API access patterns

### Medium: Inconsistent Error Handling

**Risk:** Error handling patterns vary across codebase
- **Files:**
  - `src/components/recordings/VoiceRecorder.tsx` - Some errors logged with `console.error()`, user-facing via state
  - `src/app/api/transcribe/route.ts` - Errors returned as JSON, some details exposed
  - `src/lib/hooks/use-my-data.ts` - Generic error messages set to state

- **Problem:** API error details exposed to client; inconsistent error logging
- **Impact:** Information disclosure; difficulty debugging production issues
- **Recommendations:**
  - Create error boundary component for UI errors
  - Use error logger service (Sentry, LogRocket) for production
  - Sanitize API error responses to not expose stack traces or internal details
  - Log errors server-side with detailed context, send generic messages to client

### Medium: Missing Input Validation on API Routes

**Risk:** No validation of audio data or parameters in transcription endpoint
- **Files:** `src/app/api/transcribe/route.ts` (lines 17-25)
- **Problem:** Audio data not validated for size, format, or type before sending to Deepgram
- **Impact:** Malformed requests, wasted API quota, potential service abuse
- **Recommendations:**
  - Add audio size limits (reject files > 100MB)
  - Validate MIME type matches actual audio format
  - Use Zod schemas to validate request body
  - Add rate limiting per user/IP

## Performance Concerns

### High: Large Base64 Audio Data in Memory

**Risk:** Audio recordings converted to base64 and stored in React state
- **Files:**
  - `src/components/recordings/VoiceRecorder.tsx` (lines 290-304) - `handleSave()` converts to base64
  - `src/components/recordings/RecordingsList.tsx` (lines 46-61) - Fetches audio blobs and stores in state

- **Problem:** For 10-minute audio at 128kbps, base64 = ~30MB in memory; multiple recordings cause memory leak
- **Current state:** No cleanup when component unmounts; state persists for session
- **Impact:** Browser crash on long sessions; slow performance; OOM errors
- **Recommendations:**
  - Store audio as Blob and only convert to base64 when uploading
  - Implement chunked upload for large files
  - Revoke Blob URLs immediately after use
  - Use Web Workers to handle audio processing off main thread

### Medium: Unoptimized List Rendering

**Risk:** Long patient/session/recording lists render without virtualization
- **Files:**
  - `src/components/sessions/SessionList.tsx` (line 272 lines)
  - `src/components/patients/PatientList.tsx` (lines in patient list)
  - `src/components/recordings/RecordingsList.tsx` (line 611 utterances map)

- **Problem:** Rendering 100+ items in DOM simultaneously; no pagination or windowing
- **Impact:** Slow initial render; laggy scrolling; memory bloat
- **Recommendations:**
  - Implement virtualization with `react-window` or `tanstack/react-virtual`
  - Add pagination to API queries
  - Lazy load list items on scroll

## Data Integrity Issues

### High: Client-Side Data Filtering Instead of Server-Side

**Risk:** Data filtering happens in React, not at API level
- **Files:**
  - `src/lib/hooks/use-my-data.ts` (lines 33-35, 99-100, 160-161) - Client-side filtering by therapistId
  - `src/app/page.tsx` (lines 42-45) - Client-side date filtering

- **Problem:** All data is fetched from server, then filtered client-side. Therapist can see URL to fetch all patients.
- **Impact:** Data breach if API is called directly; trusts client to do authorization
- **Current mitigation:** Filtering happens after fetch, but API layer doesn't enforce it
- **Recommendations:**
  - Move filtering to API endpoints (server-side authorization required)
  - Query parameters should be validated on backend
  - Never trust client-side filtering for access control
  - Add middleware to verify therapist has access to requested data

### Medium: No Data Validation on API Responses

**Risk:** API responses not validated against type definitions
- **Files:**
  - `src/lib/api/client.ts` - API client doesn't validate responses
  - Multiple hooks assume API data matches types without checking

- **Problem:** If API returns malformed data, type safety is lost
- **Impact:** Runtime errors; incorrect data displayed to users
- **Recommendations:**
  - Validate all API responses with Zod schemas
  - Create response type guards
  - Use discriminated unions for error handling

## Testing Gaps

### High: No Unit Tests for Security Functions

**Risk:** Encryption, hashing, and validation functions untested
- **Files:**
  - `src/lib/security.ts` - No tests for encryption, hashing, rate limiting
  - `src/lib/mock-auth.ts` - No validation that auth logic works correctly

- **Impact:** Bugs in security code go unnoticed; false sense of security
- **Recommendations:**
  - Write tests for all encryption/decryption round-trips
  - Test rate limiting behavior with mocked time
  - Test token validation with valid and invalid tokens

### Medium: No E2E Tests for Critical Workflows

**Risk:** Recording, transcription, and session saving flows not tested end-to-end
- **Files:** No E2E tests in `test-results/` or configured playwright tests
- **Impact:** Regressions in core features not caught before production
- **Recommendations:**
  - Add playwright E2E tests for: recording > transcription > session save
  - Test audio upload with various file formats
  - Test error scenarios (network failure, API timeout)

### Medium: Missing API Integration Tests

**Risk:** API routes not tested for error handling or edge cases
- **Files:**
  - `src/app/api/transcribe/route.ts` - No tests for malformed input, missing API key
  - `src/app/api/` route handlers - No test coverage

- **Recommendations:**
  - Use Jest or Vitest to test route handlers
  - Mock Deepgram SDK
  - Test error response formats

## Known Bugs

### Medium: Speech Recognition Restarts Unexpectedly

**Risk:** Web Speech API stops during recording pauses and needs restart
- **Files:** `src/components/recordings/VoiceRecorder.tsx` (lines 140-152)
- **Current approach:** Component auto-restarts recognition if `recordingState === 'recording'`
- **Problem:** May accumulate incomplete transcriptions; restart is silent
- **Workaround:** User doesn't realize recognition stopped
- **Recommendations:**
  - Add visual indicator when recognition stops/restarts
  - Log warning when auto-restart happens
  - Consider using `continuous: true` but with explicit error handling

### Low: Missing Null Checks in Diarization Display

**Risk:** Diarized transcript speaker labels may not exist for all speakers
- **Files:** `src/components/recordings/VoiceRecorder.tsx` (line 613)
- **Problem:** `speakerLabels[utterance.speaker]` may be undefined; falls back to "דובר N"
- **Impact:** Inconsistent labels if user doesn't edit all speakers
- **Recommendations:**
  - Initialize all speaker labels on diarization completion
  - Validate speaker numbers match utterance data

## Fragile Areas

### VoiceRecorder Component

**Why fragile:**
- 674 lines with 10+ state variables managing recording, transcription, and diarization
- Multiple async operations (recording, transcription, diarization) with incomplete error recovery
- Browser API support (Web Speech, MediaRecorder) varies by browser

**Safe modification:**
- Isolate transcription logic to separate hook/service
- Create smaller sub-components for recording controls, transcript display, diarization
- Add comprehensive error handling for each async operation
- Test across browsers (Chrome, Safari, Firefox)

**Test coverage gaps:**
- No tests for recording pause/resume cycles
- No tests for transcription with silent periods
- No tests for diarization with single speaker
- No browser compatibility tests

### API Error Handling

**Why fragile:**
- Multiple API endpoints with different error formats
- No centralized error handling strategy
- Client assumes successful responses

**Files:** `src/app/api/` directory

**Safe modification:**
- Create API error response wrapper type
- Add validation middleware to all routes
- Test error scenarios before deployment

## Scaling Limits

### Database/Storage

**Current state:** Data stored in JSON files with in-memory repository pattern
- **Location:** `src/lib/data/` repository pattern
- **Limitation:** Single-threaded; no concurrent writes; loses data on restart
- **Scaling limit:** ~1000 patients; no real-time syncing

**Scaling path:**
- Migrate to PostgreSQL with TypeORM or Prisma
- Add connection pooling
- Implement data replication for HA
- Expected capacity: 100,000+ patients

### Audio Storage

**Current state:** Base64 audio stored in `encryptedAudioUrl` field
- **Limitation:** Database bloat; retrieval is slow; no streaming
- **Scaling limit:** ~10GB before slowdown noticeable

**Scaling path:**
- Move audio to object storage (S3, Azure Blob, GCS)
- Generate signed URLs for secure access
- Implement audio streaming
- Add CDN for fast retrieval

### API Rate Limiting

**Current state:** Rate limiting in `src/lib/security.ts` uses in-memory Map
- **Limitation:** Resets on restart; no distributed rate limiting
- **Scaling limit:** Single instance only

**Scaling path:**
- Use Redis for distributed rate limiting
- Track limits per user, not per IP
- Implement circuit breaker for Deepgram API

## Dependencies at Risk

### Deepgram SDK (`@deepgram/sdk`)

**Risk:** Critical dependency for transcription feature
- **Issue:** Heavy API reliance; service availability critical
- **Alternative:** Implement fallback to browser Web Speech API
- **Migration plan:**
  - Keep Deepgram for production accuracy
  - Fall back to Web Speech API if Deepgram fails
  - Implement retry logic with exponential backoff

### React Speech Recognition

**Risk:** `react-speech-recognition` is light wrapper around deprecated Web Speech API
- **Issue:** API is experimental; browser support varies
- **Alternative:** Use native Web Speech API directly
- **Migration plan:**
  - Already using native API in VoiceRecorder
  - Remove dependency if redundant
  - Implement graceful degradation if API unavailable

## Missing Critical Features

### Encryption Key Management

**Problem:** No mechanism to rotate encryption keys
- **Blocks:** Production deployment; compliance audits
- **Impact:** Inability to change keys if compromised

**Implementation approach:**
- Use external key management (AWS KMS)
- Implement key versioning
- Auto-decrypt with version-aware logic

### Audit Logging

**Problem:** `AuditEntry` type defined but never used
- **Files:** `src/lib/security.ts` (lines 117-132) defines interface but no implementation
- **Blocks:** HIPAA compliance; forensic analysis; breach investigation
- **Impact:** No record of who accessed patient data when

**Implementation approach:**
- Add middleware to log all API calls
- Store audit logs separately from application data
- Implement log retention and archival policy

### Session Timeout

**Problem:** No timeout mechanism; users stay logged in indefinitely
- **Blocks:** HIPAA requirement for automatic logout
- **Impact:** Unattended sessions can access PHI

**Implementation approach:**
- Track last activity timestamp
- Clear session if inactive > 30 minutes
- Warn user before timeout

## Test Coverage Gaps

### Transcription Service

**What's not tested:** Error handling, network failures, malformed audio
- **Files:** `src/lib/transcription-service.ts`
- **Risk:** Silent failures; user doesn't know transcription failed
- **Priority:** High - affects core feature

### API Routes

**What's not tested:** Invalid input, missing headers, auth failures
- **Files:** `src/app/api/**`
- **Risk:** Security vulnerabilities; unexpected errors
- **Priority:** High - security critical

### Patient Data Filtering

**What's not tested:** Access control; therapist seeing other therapists' patients
- **Files:** `src/lib/hooks/use-my-data.ts`
- **Risk:** HIPAA violation; data breach
- **Priority:** Critical

---

*Concerns audit: 2026-01-22*
