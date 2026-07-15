# ──────────────────────────────────────────────
# Astra Sales Backend — Multi-stage Dockerfile
# ──────────────────────────────────────────────
FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies required for mysqlclient, tini, and dos2unix
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    dos2unix \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN addgroup --system astra && adduser --system --group astra

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Fix line endings and permissions BEFORE switching user
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh \
    && chown -R astra:astra /app

# Switch to non-root user
USER astra

# Expose server port
EXPOSE 8000

# Use Tini as the init system to reap zombies and forward signals
ENTRYPOINT ["/usr/bin/tini", "--", "/app/entrypoint.sh"]


# --- Development Stage ---
FROM base AS development
# Default command for development (managed via compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


# --- Production Stage ---
FROM base AS production
# Default command for production (WSGI server with gunicorn)
CMD ["gunicorn", "astra_sales.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
