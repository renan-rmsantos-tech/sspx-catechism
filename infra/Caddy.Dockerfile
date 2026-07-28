# Builds the Vite SPA and bakes it into a Caddy image that serves the static
# SPA and reverse-proxies /api/* to the Go backend on the internal network.
# TLS is terminated upstream by the shared Traefik proxy, not here.

# --- Stage 1: build the frontend SPA ---
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
COPY design/assets/catequese-ds.css ../design/assets/catequese-ds.css
# Portão de testes: substitui o job `test` do GitHub Actions. As dependências já
# vieram do `npm ci` acima, então o custo é só o dos testes. Quebrou, não builda.
RUN npx vitest run
RUN npm run build   # outputs /app/dist

# --- Stage 2: Caddy serving the static SPA + proxy ---
# Caddyfile.traefik listens on :80 (no TLS); compose.traefik.yaml also mounts it
# at runtime so config edits take effect without changing this baked default.
FROM caddy:2-alpine
COPY --from=frontend /app/dist /srv
COPY Caddyfile.traefik /etc/caddy/Caddyfile
