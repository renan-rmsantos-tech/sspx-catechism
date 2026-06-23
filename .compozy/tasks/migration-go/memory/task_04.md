# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Authorizer replacing Supabase RLS: coarse role check (coordinator/admin) + fine
`class_catechists` membership for catechists. Done; status=completed.

## Important Decisions
- `Authorizer` interface takes `auth.Claims` by value (matches TechSpec §Core
  Interfaces). Middleware dereferences the `*auth.Claims` from context.
- Data dependency is a narrow `ClassCatechistRepo` interface (not the whole
  `*sqlcgen.Queries`) so the matrix is unit-tested with a fake — no DB needed.
- `CanAccessClass` contract: deny → `(false, nil)` → 403; lookup/parse failure →
  `(false, err)` → 500. Malformed classID/userID UUIDs map to error (→500), not 400.
- Middleware `authz.RequireClassAccess(a, param)` lives in the authz package and
  reads claims via the new `httpx.WithClaims`/`ClaimsFrom` pair.

## Learnings
- Integration test gated on `TEST_DATABASE_URL` (skips without a DB). Run locally
  with an ephemeral `postgres:16-alpine` container + `database.Migrate(url)`.
- `pgconv.ParseUUID` is lenient (accepts non-RFC4122) — fine for seed/test UUIDs.

## Files / Surfaces
- NEW `backend/internal/authz/authorizer.go` (+ `_test.go`, `_integration_test.go`)
- NEW `backend/db/queries/authz.sql` → generated `internal/db/sqlcgen/authz.sql.go`
- MOD `backend/internal/httpx/middleware.go` — added `WithClaims`
- MOD `backend/internal/server/server.go` — `authz` field wired (prepared for 06/07/11)

## Errors / Corrections
- First test draft used a non-existent `httpx.WithClaims` + a 0-TTL token that
  parsed as expired; fixed by adding `WithClaims` and injecting claims directly.

## Ready for Next Run
- Tasks 06/07/11 should chain `authz.RequireClassAccess(s.authz, "id")` after
  `RequireAuth` on class/student/attendance routes. `s.authz` is already built.
