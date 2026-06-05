# Deployment

TherapyDocs is a standard Next.js 16 app and runs on any host with Node.js
20.9+. It is **not** tied to Vercel.

## Required environment variables

These are required in production (the app refuses insecure defaults when
`NODE_ENV=production`). Generate each secret with `openssl rand -base64 48`.

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | yes | Signs/verifies session cookies |
| `ENCRYPTION_KEY` | yes | AES-256-GCM encryption of PHI |
| `SEARCH_HASH_KEY` | yes | Keyed (HMAC) search hashing |
| `DEEPGRAM_API_KEY` | only for transcription | Server-side audio transcription |
| `DEBUG_LOGGING` | no | Set `true` for verbose logs |

If any required secret is missing, **login returns HTTP 500** by design — check
your host's logs for `Missing required environment variable`.

## Option A — Node server (VPS)

```bash
npm ci
npm run build
NODE_ENV=production PORT=3000 \
  JWT_SECRET=... ENCRYPTION_KEY=... SEARCH_HASH_KEY=... \
  npm run start
```

Run under a process manager (pm2/systemd) and put Nginx/Caddy in front for TLS
(the app sends HSTS, so HTTPS is expected).

## Option B — Docker

The repo ships a multi-stage `Dockerfile` (uses Next's `output: 'standalone'`).

```bash
docker build -t therapy-docs .

docker run -d -p 3000:3000 \
  -e JWT_SECRET=...  -e ENCRYPTION_KEY=...  -e SEARCH_HASH_KEY=... \
  -e DEEPGRAM_API_KEY=... \
  -v therapy_data:/app/data \
  therapy-docs
```

On startup the container seeds an **empty** `/app/data` volume from its bundled
seed data (including the demo `auth-credentials.json`), and never overwrites
existing files — so data on the volume survives restarts and redeploys.

## Option C — Render / Railway / Fly.io / DO App Platform

- Build: `npm run build`  ·  Start: `npm run start`
- Set the env vars in the dashboard
- **Attach a persistent disk mounted at the app's `data/` directory**

## ⚠️ Data persistence

The data store is JSON files on disk (`src/lib/data/json-store.ts`):

- On **Vercel** it writes to `/tmp` (ephemeral — wiped on every deploy/cold
  start). Runtime-created users do not survive a redeploy there.
- On **other hosts** it writes to `./data`. This persists only if that path is
  on durable storage (a mounted volume/disk). In Docker, always mount a volume
  at `/app/data`.

For multi-instance / true production durability, migrate to PostgreSQL — see
`PRODUCTION_READINESS.md`. File storage does not support concurrent instances.

## HIPAA

This app handles PHI. Regardless of host: sign a BAA with the provider, enable
encryption at rest on the volume, terminate TLS in front of the app, and store
secrets in a managed secret store rather than plain env files.
