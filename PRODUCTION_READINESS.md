# Production Readiness

This document tracks the hardening applied to TherapyDocs and the remaining
work required before a full production / HIPAA-compliant launch.

## ✅ Completed in this pass

### Security
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
   (`src/lib/data/json-store.ts`). This does not support concurrent writes and
   is unsuitable for production scale. Migrate to PostgreSQL (Prisma/Drizzle)
   with connection pooling.
2. **Server-side authorization.** API routes do not yet enforce that the caller
   may access the requested records (filtering happens client-side). Add auth
   middleware that validates the session JWT and scopes every query by the
   authenticated therapist.
3. **Managed secret storage & key rotation.** Move secrets to AWS KMS /
   Secrets Manager (or equivalent) and implement versioned encryption keys.
4. **Object storage for audio.** Move base64 audio out of the data store into
   S3/GCS with signed URLs and streaming.
5. **Audit logging.** Wire the existing `AuditEntry` type into a real,
   append-only audit trail for all PHI access (HIPAA requirement).
6. **Session timeout / automatic logout** after inactivity (HIPAA requirement).
7. **Distributed rate limiting** (Redis) for multi-instance deployments.
8. **Secret hygiene.** Rotate any API keys that were previously committed and
   confirm they are purged from git history.
