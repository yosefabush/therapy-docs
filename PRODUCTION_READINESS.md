# Production Readiness

This document tracks the hardening applied to TherapyDocs and the remaining
work required before a full production / HIPAA-compliant launch.

## ✅ Completed in this pass

### Security
- **Server-side authorization.** Login/signup now issue an httpOnly, signed
  **JWT session cookie**; `src/proxy.ts` (Next 16's middleware convention)
  enforces authentication on every `/api` route except the public
  auth/health/seed/swagger endpoints. Patient routes are scoped server-side to
  the authenticated therapist (admins see all), with assignment-based access
  returning 401/403/404. Identity is derived from the verified session, never
  from client-supplied parameters. Added `/api/auth/logout` and `/api/auth/me`.
- **Audit logging.** PHI access (list/read/create/update/delete on patients) is
  recorded via an append-only audit log (`src/lib/audit.ts`); the runtime file
  is gitignored.
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

1. **Persistent database.** Data currently lives in JSON files
   (`src/lib/data/json-store.ts`). Per-file write locks now prevent in-process
   lost updates, but this still does not support multi-instance concurrency and
   is unsuitable for production scale. Migrate to PostgreSQL (Prisma/Drizzle)
   with connection pooling. Once migrated, move authorization scoping into the
   query layer and the audit log into a tamper-evident, retained store.
2. **Managed secret storage & key rotation.** Move secrets to AWS KMS /
   Secrets Manager (or equivalent) and implement versioned encryption keys.
3. **Object storage for audio.** Move base64 audio out of the data store into
   S3/GCS with signed URLs and streaming.
4. **Session timeout / automatic logout** after inactivity (HIPAA requirement).
   The session JWT already expires after 8h; add client-side inactivity logout.
5. **Distributed rate limiting** (Redis) for multi-instance deployments.
6. **Secret hygiene.** Rotate any API keys that were previously committed and
   confirm they are purged from git history.
7. **Extend authorization & auditing** to the remaining resource routes
   (sessions, reports, goals, voice recordings) following the pattern now
   established for patients.
