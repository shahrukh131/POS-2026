#!/bin/sh
set -e

# 1. Wait for the DB by retrying migrations (compose healthcheck already gates startup; this is a backstop).
attempt=1
max=30
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max" ]; then
    echo "Database not reachable after $max attempts, giving up."
    exit 1
  fi
  echo "migrate deploy failed (attempt $attempt/$max), retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done

# 2. Seed only an empty DB (no duplicates / no overwrites on restart).
node scripts/seed-if-empty.js

# 3. exec so SIGTERM reaches the server's graceful shutdown.
exec node src/server.js
