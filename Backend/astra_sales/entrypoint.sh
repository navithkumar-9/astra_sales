#!/bin/bash
set -e

echo "=========================================="
echo "  Astra Sales - Backend Entrypoint"
echo "=========================================="

# Wait for MySQL to be ready
echo "Waiting for MySQL at ${MYSQL_HOST:-mysql}:${MYSQL_PORT:-3306}..."

# Remove manual python loop since docker-compose service_healthy handles this.
# This prevents the entrypoint from misidentifying MySQL as "ready" too early.

if [ "$SKIP_MIGRATIONS" != "1" ] && [ "$SKIP_MIGRATIONS" != "true" ]; then
    # Run Django migrations
    echo "Running database migrations..."
    python manage.py migrate --noinput
    echo "Migrations complete!"

    # Collect static files
    echo "Collecting static files..."
    python manage.py collectstatic --noinput 2>/dev/null || true
    echo "Static files collected!"
else
    echo "SKIP_MIGRATIONS is set. Bypassing database migrations and static file collection."
fi

# Start server or execute passed command
if [ "$#" -gt 0 ]; then
    echo "Executing command: $@"
    exec "$@"
else
    echo "Starting Django development server on 0.0.0.0:8000..."
    exec python manage.py runserver 0.0.0.0:8000
fi
