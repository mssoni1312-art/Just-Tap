#!/bin/sh
set -e

echo "==> Waiting for MySQL..."
node scripts/wait-for-services.js

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "==> Running database migrations..."
  if ! node src/database/setup.js migrate; then
    echo "WARNING: Database migrations failed — starting API anyway"
  fi
fi

if [ "$RUN_SEEDERS" = "true" ]; then
  echo "==> Running database seeders..."
  if ! node src/database/setup.js seed; then
    echo "WARNING: Database seeders failed — starting API anyway"
  fi
fi

echo "==> Starting API server..."
exec "$@"
