# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Classes API + class_catechists. GET scoped by role (coordinator=all, catechist=own
via class_catechists) using Authorizer; POST/PATCH coordinator-only; replace-set of
catechists in a pgx transaction; GET /classes/:id/students gated by CanAccessClass.
Support is_archived (via PATCH). Mirror task_05 resource pattern.

## Important Decisions
- New `classes` service holds the `*pgxpool.Pool` (not just DBTX) because the
  replace-catechists / create flows need `pool.Begin` → `q.WithTx(tx)`.
- List query aggregates `catechist_ids` via LEFT JOIN + array_agg so the SPA can
  edit without a separate GET. Catechist scope filters with `c.id IN (SELECT ...)`.
- PATCH UpdateClass uses COALESCE narg for all fields (name, academic_year_id,
  level, schedule, is_archived) → "leave unchanged" when omitted; doubles as the
  row fetch so a missing id → ErrNotFound (404). No separate archive endpoint
  (TechSpec lists only PATCH /classes/:id).
- catechist_ids tri-state in PATCH via `*[]string` (nil=leave, present even []=
  replace), matching old `catechist_ids !== undefined` semantics. Dedupe ids to
  avoid 23505 on PK(class_id,catechist_id).
- FK 23503 (missing academic year / catechist) → sentinel ErrInvalidReference →
  409 "ano letivo ou catequista inválido".
- /classes/:id/students route chains `authz.RequireClassAccess(s.authz,"id")`
  after RequireAuth (per shared memory handoff); handler just lists.

## Learnings
- Integration tests verified against ephemeral `postgres:16-alpine` (port 55432).
  classes service coverage 84.9% (>80% target); full suite 74 tests pass.
- Route wiring: `GET /classes` + `GET /classes/{id}/students` live in the
  authenticated group; the roster route chains
  `r.With(authz.RequireClassAccess(s.authz,"id")).Get(...)`. POST/PATCH sit in the
  coordinator-only nested group. `List` scope is decided in the service by role,
  not by middleware (catechist still gets 200, just a filtered set).
- Test seam: catechist `class_catechists` scope needs the JWT `sub` to equal a real
  `profiles.id`, so the test `do()` helper takes an explicit userID (the shared
  academic-year helper hardcoded one subject — class tests needed their own).

## Files / Surfaces
- backend/db/queries/classes.sql (new) → sqlcgen/classes.sql.go (generated)
- backend/internal/classes/service.go (new; holds *pgxpool.Pool for tx)
- backend/internal/server/class_handlers.go (new)
- backend/internal/server/server.go (wired `classes` field + routes)
- backend/internal/server/class_handlers_test.go (unit: payload validation)
- backend/internal/server/class_integration_test.go (CRUD, replace-set, scope/403)

## Errors / Corrections
- Integration tests share ONE database and each `TRUNCATE`s its own tables, so
  `go test ./...` with `TEST_DATABASE_URL` set runs packages in parallel and the
  `authz` + `server` integration suites stomp on each other (both seed
  `academic_years(2026)`). Pre-existing, not task_06-specific. Run integration
  tests serialized: `go test -p 1 ./...`. CI is unaffected — it runs without
  `TEST_DATABASE_URL`, so all integration tests skip.

## Ready for Next Run
- task_07 (students CRUD) builds on `classes` + the same resource pattern; the
  student roster DTO already lives in class_handlers.go (`classStudentResponse`).
