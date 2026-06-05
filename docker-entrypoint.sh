#!/bin/sh
set -e

# Seed the data directory from the bundled seed files on first run. Existing
# files are never overwritten, so data on a persistent volume is preserved
# across restarts while a fresh/empty volume gets the demo dataset.
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

exec "$@"
