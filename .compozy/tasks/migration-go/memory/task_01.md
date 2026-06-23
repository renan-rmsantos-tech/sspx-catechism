# Task Memory: task_01.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Infra foundation (Compose: Caddy+API+Postgres, CI/deploy, backup). Skeleton already
existed from commit 29e0ef3; this run verified it and fixed the API healthcheck.

## Important Decisions
- API image is `distroless/static` (no shell/wget). Healthcheck now uses the binary's
  own `-healthcheck` flag (`/api -healthcheck`) instead of the broken `wget` CMD.
- Caddy now `depends_on api: condition: service_healthy` (was an unconditional dep).

## Learnings
- `frontend/` does not exist yet (task_13); `Caddy.Dockerfile` builds it, so
  `docker compose up --build` cannot succeed until task_13. `docker compose config` is fine.
- `_tasks.md` master index was deleted in the working tree by the workflow re-template;
  left out of the task_01 commit. Working tree also carries unrelated authz/server changes
  (another task) — kept out of this commit.

## Files / Surfaces
- docker-compose.yml (healthcheck + caddy depends_on), backend/Dockerfile (comment),
  backend/cmd/api/main.go (runHealthcheck + dispatch).
- Unchanged but reviewed: Caddyfile, infra/Caddy.Dockerfile, infra/README.md,
  scripts/backup.sh, scripts/restore.sh, .github/workflows/deploy.yml, .env.server.example.

## Errors / Corrections
- Original `api` healthcheck (`["CMD","wget",...]`) could never pass on distroless. Fixed.

## Ready for Next Run
- Smoke (`docker compose up`) and backup/restore integration deferred to task_16.
- CI `deploy.yml` test job builds `frontend/` → will fail until task_13 lands.
