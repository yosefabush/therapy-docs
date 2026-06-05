# TherapyDocs — Clinical Documentation System

A modern, HIPAA-oriented therapy documentation system built with **Next.js 16**, for mental health professionals, clinics, and health insurance funds. The UI is Hebrew (RTL).

![Version](https://img.shields.io/badge/Version-1.0.0-sage)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/License-MIT-blue)
![HIPAA](https://img.shields.io/badge/HIPAA-oriented-green)

## 🌟 Overview

TherapyDocs streamlines how therapists document and manage treatment sessions. It pairs a calm, professional medical aesthetic with AI-assisted documentation, server-side access control, and a pluggable storage backend (PostgreSQL or a built-in JSON store for demos).

> 📘 **New here?** A full step-by-step usage guide for therapists lives at **`/guide`** (also linked from the login page).
> 🚀 **Deploying?** See **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
> ✅ **Production status & remaining work:** see **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)**.

## ✨ Key Features

### 🏥 Multi-Disciplinary Support
- **Role-Based Templates** for psychologists, psychiatrists, social workers, occupational therapists, speech therapists, family therapists, art & music therapists, and more (`src/lib/templates.ts`).

### 📝 Session Documentation
- **SOAP Notes** (Subjective, Objective, Assessment, Plan)
- **Risk Assessment** screening with safety-plan tracking
- **Voice Recording + Transcription** with speaker diarization (Deepgram)
- **Intervention Tracking** and **digital signatures**

### 👥 Patient Management
- Patient profiles, multi-therapist care teams, treatment-goal tracking, insurance/referral tracking

### 📊 AI-Enhanced Features
- Role-tailored **session summaries**, **pattern recognition** (mood/risk/engagement), **predictive insights**, **voice-to-text**

### 📋 Report Generation
- Progress, discharge, insurance, and multidisciplinary reports with AI-assisted drafting and PDF export

### 🔒 Security & Compliance
- **bcrypt** password hashing (cost 12), **AES-256-GCM** PHI encryption, **HMAC-SHA256** searchable hashing
- **Signed JWT session cookies** (httpOnly) via `jose`, verified in middleware
- **Server-side authorization** — therapists can only access their own patients (admins unrestricted)
- **Audit logging** of PHI access, **rate limiting** on auth, **security headers** (HSTS, X-Frame-Options, …)
- **Fail-closed secrets**: the app refuses insecure defaults in production

## 🛠 Technology Stack

- **Framework**: Next.js 16 (App Router) · **Language**: TypeScript
- **Styling**: Tailwind CSS (custom medical theme), Hebrew RTL (Heebo / David Libre)
- **Validation**: Zod · **Auth**: JWT (`jose`) + bcrypt
- **Crypto**: Node `crypto` (AES-256-GCM, scrypt, HMAC)
- **Database**: PostgreSQL via **Prisma** — with an automatic JSON-file fallback for local/demo
- **Testing**: Vitest (unit) + Playwright (e2e) · **Lint**: ESLint v9 flat config
- **Deployment**: Vercel, any Node host, or Docker / Docker Compose

## 📁 Project Structure

```
therapy-docs/
├── prisma/
│   ├── schema.prisma           # DB schema (used when DATABASE_URL is set)
│   └── migrations/             # SQL migrations
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/ signup/      # Auth pages
│   │   ├── guide/              # Step-by-step usage guide (public)
│   │   ├── patients/ sessions/ reports/ insights/ settings/ help/
│   │   ├── error.tsx · not-found.tsx · global-error.tsx
│   │   └── api/                # Route handlers (auth, patients, sessions, health, …)
│   ├── components/             # ui / layout / feature components
│   ├── lib/
│   │   ├── security.ts         # AES-256-GCM, bcrypt, HMAC, JWT helpers
│   │   ├── env.ts · logger.ts · audit.ts
│   │   ├── auth/               # session cookie + edge-safe JWT
│   │   └── data/
│   │       ├── json-store.ts   # JSON file backend (fallback)
│   │       ├── prisma.ts        # Prisma client + USE_PRISMA flag
│   │       ├── import-json.ts   # load data/*.json into Postgres
│   │       └── repositories/   # JSON + Prisma repos, selected by backend
│   ├── proxy.ts                # auth middleware (Next 16 convention)
│   └── types/index.ts
├── scripts/
│   ├── capture-screenshots.mjs # regenerate /guide screenshots
│   └── db-import.mjs           # seed Postgres from data/*.json
├── data/                       # JSON dataset / demo seed
├── Dockerfile · docker-compose.yml · docker-entrypoint.sh
├── DEPLOYMENT.md · PRODUCTION_READINESS.md
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 20.9+**
- (Optional) PostgreSQL — only if you want database-backed persistence

### Installation

```bash
git clone https://github.com/yosefabush/therapy-docs.git
cd therapy-docs
npm install                 # runs `prisma generate` automatically

cp .env.example .env.local  # then fill in values (see below)

npm run dev                 # http://localhost:3000
```

In development the app works with **no configuration** (it uses the JSON store and dev-only secret fallbacks).

### Demo credentials
| Email | Password | Role |
|-------|----------|------|
| `dr.sarah.cohen@clinic.co.il` | `password123` | Psychologist (5 patients) |
| `admin@clinic.co.il` | `admin123` | Admin (sees all) |

### Environment variables

```env
# Required in PRODUCTION (the app refuses insecure defaults when NODE_ENV=production).
# Generate each with: openssl rand -base64 48
JWT_SECRET=...
ENCRYPTION_KEY=...
SEARCH_HASH_KEY=...

# Optional — when set, all data is stored in Postgres (via Prisma);
# when unset, the JSON file store is used.
DATABASE_URL=postgresql://user:pass@host:5432/therapydocs?schema=public

# Optional — server-side audio transcription
DEEPGRAM_API_KEY=...

# Optional — verbose logs
DEBUG_LOGGING=false
```

> ⚠️ If a required secret is missing in production, **login returns HTTP 500** by design. Check logs for `Missing required environment variable`.

## 📜 Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate && next build`) |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:migrate` | Apply Prisma migrations (`prisma migrate deploy`) |
| `npm run db:seed` | Import `data/*.json` into Postgres (idempotent) |

## 🗄️ Database (optional but recommended)

The storage backend is chosen automatically:

- **`DATABASE_URL` set →** PostgreSQL via Prisma. All data — users, credentials, patients/sessions/etc., and the audit log — persists across deploys and instances.
- **unset →** JSON file store under `data/` (great for local dev and demos; on Vercel this is ephemeral `/tmp`).

To use Postgres:

```bash
export DATABASE_URL=postgresql://user:pass@host:5432/therapydocs?schema=public
npm run db:migrate   # create tables
npm run db:seed      # load the demo dataset (optional)
```

## 🐳 Deployment

The app runs on Vercel, any Node host, or in a container. Full instructions in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

**Docker Compose (app + Postgres):**
```bash
# create .env with JWT_SECRET, ENCRYPTION_KEY, SEARCH_HASH_KEY, POSTGRES_PASSWORD
docker compose up --build
```
The container runs migrations on startup and seeds the database on first run; data persists in the `db_data` volume.

**Vercel:** set `JWT_SECRET`, `ENCRYPTION_KEY`, `SEARCH_HASH_KEY` (and `DATABASE_URL` for persistence) in Project → Settings → Environment Variables, then redeploy. Without `DATABASE_URL`, data lives in ephemeral `/tmp` and resets on each deploy.

## 📱 Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Dashboard — schedule, stats, AI alerts, recent activity |
| `/patients`, `/patients/[id]` | Patient list & full clinical file |
| `/sessions`, `/sessions/[id]` | Session list & SOAP documentation, recording, AI summary, risk |
| `/reports` | Generate and export reports |
| `/insights` | Cross-session AI insights |
| `/settings`, `/help` | Profile/preferences and support |
| `/guide` | Public step-by-step usage guide (with screenshots) |
| `/login`, `/signup` | Authentication |
| `/api/health` | Liveness/readiness probe |

## 🎨 Design

A **refined medical aesthetic**: calming sage greens with warm neutrals (`sage-*`, `warm-*`, `clinical-*`), soft shadows, rounded corners, subtle animations, Hebrew RTL with the Heebo and David Libre typefaces, and accessible contrast.

## 🔒 Security Notes

Implemented: bcrypt password hashing, AES-256-GCM encryption utilities, HMAC search hashing, signed httpOnly JWT sessions verified in middleware, server-side per-therapist authorization, audit logging, auth rate limiting, security headers, and fail-closed secret handling.

**Still required for full production / HIPAA** (see `PRODUCTION_READINESS.md`): managed secret storage + key rotation (KMS), object storage for audio, distributed rate limiting (Redis), connection pooling, a signed BAA with the hosting provider, and TLS termination in front of the app.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

**Note**: This started as a demonstration application and has been hardened substantially. For production healthcare use, complete the remaining items in `PRODUCTION_READINESS.md` and engage appropriate security and compliance reviews (HIPAA, HITECH, state laws).
