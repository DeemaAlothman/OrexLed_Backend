#!/bin/sh
set -e

echo "Applying pending database migrations..."
npx prisma migrate deploy

echo "Starting OrexLed backend..."
exec node dist/src/main.js
