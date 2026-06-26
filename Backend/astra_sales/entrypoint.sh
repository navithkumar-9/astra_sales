#!/bin/bash
set -e

echo "=========================================="
echo "  Astra Sales - Backend Entrypoint"
echo "=========================================="

# Wait for MySQL to be ready
echo "Waiting for MySQL at ${MYSQL_HOST:-mysql}:${MYSQL_PORT:-3306}..."

MAX_RETRIES=30
RETRY_COUNT=0

until python -c "
import os, socket, sys
host = os.environ.get('MYSQL_HOST', 'mysql')
port = int(os.environ.get('MYSQL_PORT', '3306'))
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.connect((host, port))
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
"; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "MySQL not available after ${MAX_RETRIES} attempts. Exiting."
        exit 1
    fi
    echo "  Attempt ${RETRY_COUNT}/${MAX_RETRIES} - retrying in 2s..."
    sleep 2
done

echo "MySQL is ready!"

# Run Django migrations
echo "Running database migrations..."
python manage.py migrate --noinput
echo "Migrations complete!"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true
echo "Static files collected!"

# Start server or execute passed command
if [ "$#" -gt 0 ]; then
    echo "Executing command: $@"
    exec "$@"
else
    echo "Starting Django development server on 0.0.0.0:8000..."
    exec python manage.py runserver 0.0.0.0:8000
fi
