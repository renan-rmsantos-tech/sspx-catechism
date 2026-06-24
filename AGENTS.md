# Agent guidelines

Stack ativa: **Go** (`backend/`) + **Vite/React** (`frontend/`) + **PostgreSQL** em Docker no VPS.

- Backend: chi, pgx, sqlc, goose — ver `backend/`
- Frontend: React Router, Tailwind, shadcn/ui — ver `frontend/`
- Deploy: `docker-compose.yml` + Caddy; CI em `.github/workflows/deploy.yml`
- Planejamento histórico da migração: `.compozy/tasks/migration-go/`
