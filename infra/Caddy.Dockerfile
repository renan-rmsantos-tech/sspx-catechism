# Builds the Vite SPA and bakes it into a Caddy image that also terminates TLS
# and reverse-proxies /api/* to the Go backend. Single edge container.

# --- Stage 1: build the frontend SPA ---
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build   # outputs /app/dist

# --- Stage 2: Caddy serving the static SPA + proxy ---
FROM caddy:2-alpine
COPY --from=frontend /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
