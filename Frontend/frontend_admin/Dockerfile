# ──────────────────────────────────────────────
# Astra Sales Frontend — Multi-stage Dockerfile
# ──────────────────────────────────────────────

# --- Base & Dependencies ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Development Stage ---
FROM builder AS development
COPY . .
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- Production Builder Stage ---
FROM builder AS prod-builder
COPY . .
RUN npm run build

# --- Production Stage (Nginx Web Server) ---
FROM nginx:alpine AS production
COPY --from=prod-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
