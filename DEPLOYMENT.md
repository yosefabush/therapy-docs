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
| `DATABASE_URL` | recommended | Postgres connection string; without it the app uses the JSON file store |
| `DEBUG_LOGGING` | no | Set `true` for verbose logs |

If any required secret is missing, **login returns HTTP 500** by design — check
your host's logs for `Missing required environment variable`.

## Database (PostgreSQL)

The app uses Postgres via Prisma when `DATABASE_URL` is set, and falls back to
the JSON file store otherwise. **Use Postgres for any real deployment** — it is
the only way data persists reliably across deploys and multiple instances.

**Managed Postgres (recommended for production):** create a database on Neon,
Supabase, or AWS RDS, then set `DATABASE_URL` on your host. Apply the schema and
load the demo dataset:

```bash
npm run db:migrate   # prisma migrate deploy — creates the tables
npm run db:seed      # loads data/*.json into the database (idempotent)
```

In Docker/Compose the container runs `db:migrate` automatically on startup and
the app seeds the database from the bundled dataset on first run.

**Self-hosted (app + Postgres together):** use the provided `docker-compose.yml`
(see the Docker section).

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

## Option B — Docker Compose (app + Postgres, recommended for self-hosting)

The repo ships `docker-compose.yml` that runs the app and a Postgres database
together. Create a `.env` next to it (`JWT_SECRET`, `ENCRYPTION_KEY`,
`SEARCH_HASH_KEY`, `POSTGRES_PASSWORD`, optional `DEEPGRAM_API_KEY`), then:

```bash
docker compose up --build
```

The app runs migrations on startup and seeds the database on first run. Data
persists in the `db_data` volume across restarts and redeploys.

## Option B′ — Docker (app only)

The multi-stage `Dockerfile` (Next `output: 'standalone'`) also runs standalone.
Point it at any Postgres via `DATABASE_URL`:

```bash
docker build -t therapy-docs .

docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/therapydocs \
  -e JWT_SECRET=...  -e ENCRYPTION_KEY=...  -e SEARCH_HASH_KEY=... \
  -e DEEPGRAM_API_KEY=... \
  therapy-docs
```

Without `DATABASE_URL` it uses the JSON store; in that case mount a volume at
`/app/data` (the entrypoint seeds an empty volume from the bundled dataset and
never overwrites existing files).

## Option C — Render / Railway / Fly.io / DO App Platform

- Build: `npm run build`  ·  Start: `npm run start`
- Provision a managed Postgres and set `DATABASE_URL` (plus the secrets)
- Run `npm run db:migrate` (and optionally `npm run db:seed`) as a release step

## Data persistence

- **With `DATABASE_URL` (Postgres):** all data lives in the database — it
  survives deploys and works across multiple instances. This is the recommended
  setup for any real deployment.
- **Without it (JSON store):** data is files on disk. On **Vercel** that's
  `/tmp` (ephemeral, wiped each deploy); on other hosts it's `./data`, which
  persists only on durable storage. In Docker mount a volume at `/app/data`.

## HIPAA

This app handles PHI. Regardless of host: sign a BAA with the provider, enable
encryption at rest on the volume, terminate TLS in front of the app, and store
secrets in a managed secret store rather than plain env files.
