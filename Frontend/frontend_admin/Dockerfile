# ──────────────────────────────────────────────
# Astra Sales Frontend — Development Dockerfile
# ──────────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files (will be overridden by volume mount in dev)
COPY . .

# Expose Vite dev server port
EXPOSE 5174

# Start Vite dev server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
