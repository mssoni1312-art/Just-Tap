#!/bin/sh
set -e

echo "==> Waiting for MySQL and Redis..."
node scripts/wait-for-services.js

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "==> Running database migrations..."
  node src/database/setup.js migrate
fi

if [ "$RUN_SEEDERS" = "true" ]; then
  echo "==> Running database seeders..."
  node src/database/setup.js seed
fi

echo "==> Starting API server..."
exec "$@"
