# Production Readiness

This document tracks the hardening applied to TherapyDocs and the remaining
work required before a full production / HIPAA-compliant launch.

## ✅ Completed in this pass

### Security
- **Server-side authorization.** Login/signup now issue an httpOnly, signed
  **JWT session cookie**; `src/proxy.ts` (Next 16's middleware convention)
  enforces authentication on every `/api` route except the public
  auth/health/seed/swagger endpoints. **All** resource routes — patients,
  sessions, reports, treatment-goals, voice-recordings, their `[id]` routes,
  the patient sub-routes (sessions/goals/reports/insights), and session
  summaries — are scoped server-side via a shared `canAccessPatient` /
  `filterByPatientAccess` helper: a therapist may only touch records for
  patients they are assigned to (admins are unrestricted), returning
  401/403/404. Identity is derived from the verified session, never from
  client-supplied parameters. The `/api/users` directory is sanitized
  (no email/license) and `/api/users/[id]` is self-only unless admin.
  Destructive seed reset is blocked in production. Added `/api/auth/logout`
  and `/api/auth/me`.
- **Audit logging.** PHI access (read/create/update/delete across patients,
  sessions, reports, and recordings) is recorded via an append-only audit log
  (`src/lib/audit.ts`); the runtime file is gitignored.
- **PostgreSQL persistence (Prisma).** When `DATABASE_URL` is set, all data —
  including users, credentials, patients/sessions/etc. and the audit log — is
  stored in Postgres via Prisma (`prisma/schema.prisma`, repositories in
  `src/lib/data/repositories/prisma.repositories.ts`), selected automatically in
  `repositories/index.ts`. Without `DATABASE_URL` it falls back to the JSON file
  store, so local dev and the demo keep working. Schema migrations live in
  `prisma/migrations`; `npm run db:seed` imports the bundled dataset. This makes
  signed-up users and all data persist across deploys and instances. Docker
  Compose (`docker-compose.yml`) runs the app + Postgres together.
- **Concurrency-safe writes.** The JSON store serializes writes per file to
  prevent lost updates from interleaved read-modify-write requests.
- **Password hashing (bcrypt).** Signup now stores bcrypt hashes (cost 12);
  login verifies with `bcrypt.compare`. Any legacy plaintext credential is
  transparently re-hashed on first successful login. The committed
  `data/auth-credentials.json` was migrated from plaintext to hashes.
- **Real encryption.** The XOR "demo" cipher was replaced with authenticated
  **AES-256-GCM** (random per-record salt + IV, scrypt key derivation).
- **Keyed search hashing.** `hashForSearch` now uses HMAC-SHA256 instead of a
  trivial non-cryptographic hash.
- **JWT session tokens.** Added `createSessionToken` / `verifySessionToken`
  using `jose` (HS256) with signature + expiration verification, replacing the
  format-only `isValidSessionToken` stub.
- **Fail-closed secrets.** Encryption/JWT/search secrets are required from the
  environment; the app refuses insecure fallback values when
  `NODE_ENV=production`. See `.env.example`.
- **Inactivity auto-logout.** `useIdleLogout` clears the session (storage +
  server cookie) and redirects to login after 30 minutes of inactivity, in
  addition to the 8-hour JWT expiry (HIPAA unattended-session requirement).
- **Auth route hardening.** Login/signup now validate input with Zod, apply
  per-IP rate limiting, and return generic messages (no user-enumeration, no
  leaking of internal error details). Passwords require ≥ 8 characters.
- **Security headers.** `next.config.js` sets HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a restrictive
  `Permissions-Policy`. `x-powered-by` is disabled.
- **Reduced PHI in logs.** Verbose request/transcript logging now goes through
  a `logger` that is silent in production unless `DEBUG_LOGGING=true`, and the
  transcription endpoint no longer logs transcript content.
- **Input limits.** The transcription endpoint validates language and rejects
  oversized payloads.

### Tooling & quality
- **Fixed linting.** `next lint` was removed in Next 16; migrated to the
  ESLint v9 flat config (`eslint.config.mjs`) run via `eslint .`.
- **Type checking.** Added `npm run typecheck` (`tsc --noEmit`).
- **Unit tests.** Added Vitest with a suite covering the security module
  (encryption round-trip + tamper detection, password hashing, JWT, rate
  limiting, sanitization). Run with `npm test`.
- **CI.** Added `.github/workflows/ci.yml` running lint, typecheck, tests, and
  build on every PR.
- **Error UX.** Added `error.tsx`, `global-error.tsx`, and `not-found.tsx`.
- **Health probe.** Added `GET /api/health` for load-balancer/uptime checks.

## ⚠️ Remaining work (requires infrastructure decisions)

These items need provisioning that cannot be done from the codebase alone:

1. **Database hardening (follow-ups).** Postgres persistence is in place (see
   above). Remaining polish: connection pooling (PgBouncer / Prisma Accelerate)
   for serverless, promoting hot JSON `payload` fields to real columns as query
   needs grow, and making the audit table tamper-evident/retained.
2. **Managed secret storage & key rotation.** Move secrets to AWS KMS /
   Secrets Manager (or equivalent) and implement versioned encryption keys.
3. **Object storage for audio.** Move base64 audio out of the data store into
   S3/GCS with signed URLs and streaming.
4. **Distributed rate limiting** (Redis) for multi-instance deployments.
5. **Secret hygiene.** Rotate any API keys that were previously committed and
   confirm they are purged from git history.
