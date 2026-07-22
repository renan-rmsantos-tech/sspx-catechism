# Agent guidelines

Stack ativa: **Go** (`backend/`) + **Vite/React** (`frontend/`) + **PostgreSQL** em Docker num droplet DigitalOcean.

- Backend: chi, pgx, sqlc, goose — ver `backend/`
- Frontend: React Router, Tailwind, shadcn/ui — ver `frontend/`
- Deploy: `compose.traefik.yaml` (Caddy serve a SPA + proxy `/api`, atrás do Traefik compartilhado na DigitalOcean); CI em `.github/workflows/deploy.yml`. Runbook em `infra/README.md`
- Backup: `scripts/backup.sh`/`restore.sh` → DigitalOcean Spaces (S3)
- Planejamento histórico da migração: `.compozy/tasks/migration-go/`
