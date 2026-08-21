#!/bin/bash
# post-merge.sh — run after git merge/pull to bring the workspace up to date
set -e

pnpm install --frozen-lockfile

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations…"
  pnpm --filter @workspace/scripts run migrate

  if [ "$NODE_ENV" != "production" ]; then
    echo "Seeding local jobs…"
    pnpm --filter @workspace/scripts run seed
  fi
fi
