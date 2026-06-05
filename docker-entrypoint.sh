#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  # Postgres backend: apply migrations. The app seeds the database from the
  # bundled JSON dataset on first run (when the users table is empty).
  echo "[entrypoint] DATABASE_URL set — running prisma migrate deploy"
  node node_modules/prisma/build/index.js migrate deploy \
    || echo "[entrypoint] migrate deploy failed (continuing)"
else
  # JSON-file backend: seed the data directory from the bundled seed files on
  # first run. Existing files are never overwritten, so data on a persistent
  # volume is preserved across restarts.
  SEED_DIR=/app/seed-data
  DATA_DIR=/app/data
  mkdir -p "$DATA_DIR"
  if [ -d "$SEED_DIR" ]; then
    for f in "$SEED_DIR"/*.json; do
      [ -e "$f" ] || continue
      base=$(basename "$f")
      if [ ! -f "$DATA_DIR/$base" ]; then
        cp "$f" "$DATA_DIR/$base"
      fi
    done
  fi
fi

exec "$@"
