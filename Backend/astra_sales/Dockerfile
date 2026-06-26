# ──────────────────────────────────────────────
# Astra Sales Backend — Development Dockerfile
# ──────────────────────────────────────────────
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies required for mysqlclient + dos2unix for line endings
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files (will be overridden by volume mount in dev)
COPY . .

# Fix Windows CRLF line endings and make entrypoint executable
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Expose Django development server port
EXPOSE 8000

# Use entrypoint script for startup
ENTRYPOINT ["/app/entrypoint.sh"]
