# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State
- task_01 (infra foundation) complete & verified: Compose (Caddy+API+Postgres),
  CI/deploy, backup/restore scripts, Hetzner runbook all in place.

## Shared Decisions
- API container is `distroless/static` (no shell/wget). Container healthchecks must
  use the Go binary itself: `/api -healthcheck` (see `backend/cmd/api/main.go`
  `runHealthcheck`, which probes `/api/health`).
- Authorization (replaces RLS) lives in `backend/internal/authz`. `Authorizer`
  exposes `IsCoordinator(auth.Claims) bool` and `CanAccessClass(ctx, auth.Claims,
  classID) (bool, error)`. Contract: deny → `(false,nil)`; lookup error →
  `(false,err)`. Route guard: `authz.RequireClassAccess(a, pathParam)` (deny→403,
  error→500). The `Server` already holds a built `s.authz`.
- Claims flow through context via `httpx.WithClaims` / `httpx.ClaimsFrom`
  (`*auth.Claims`). Role-based coarse checks avoid a DB hit; fine checks hit
  `class_catechists` through a narrow repo interface.

## Shared Learnings
- Go integration tests gate on `TEST_DATABASE_URL` and skip when unset. Run them
  locally against an ephemeral `postgres:16-alpine` + `database.Migrate(url)`.
- After adding/editing `backend/db/queries/*.sql`, run `sqlc generate` to refresh
  `internal/db/sqlcgen` (sqlc v1.30.0; config in `backend/sqlc.yaml`).
- Resource pattern (task_05, copy for classes/students/enrollments): thin service
  in `internal/<domain>` (mirrors `internal/users`) with sentinel errors; handlers
  in `internal/server/<domain>_handlers.go`; route group reuses the existing
  `r.Use(httpx.RequireCoordinator)` nest. API contract is **camelCase JSON**
  (Go-defined), not the old Supabase snake_case rows.
- PG error → HTTP: `httpx.WriteDBError` already maps 23505/23503→409, no-rows→404.
  Use a domain sentinel only when a specific message is required (e.g. translate
  23503 in the service to "possui X vinculadas").
- sqlc partial updates: `COALESCE(sqlc.narg('f'), f)` for "leave unchanged"; for
  nullable columns that must also be clearable, gate with a `set_x boolean` arg +
  `CASE WHEN set_x THEN narg::type ELSE x END`. Decode tri-state JSON
  (absent/null/value) with `json.RawMessage` fields. `:execrows` → RowsAffected.
- DTO validation lives in the handler (mirrors old Zod schemas); dates use
  `^\d{4}-\d{2}-\d{2}$` + `pgconv.ParseDate`/`DateString`. Prefer PATCH for
  partial resource edits per TechSpec API table.

## Open Risks
- Full-stack smoke + backup/restore are unverified until task_16 (needs live VPS +
  the `frontend/` SPA from task_13; `Caddy.Dockerfile`/CI build it).
- Authorization parity vs old RLS is the highest-risk area; keep extending the
  matrix tests as class/student/attendance routes (tasks 06/07/11) consume it.

## Handoffs
- Tasks 06/07/11: chain `authz.RequireClassAccess(s.authz, "id")` after
  `RequireAuth` on routes scoped to a class.
