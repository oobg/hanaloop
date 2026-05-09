#!/bin/sh
set -e

echo "[entrypoint] prisma db push..."
npx prisma db push --skip-generate

if [ "$SEED" = "true" ]; then
  echo "[entrypoint] seeding database..."
  npx tsx prisma/seed.ts
fi

echo "[entrypoint] starting Next.js..."
exec node_modules/.bin/next start
