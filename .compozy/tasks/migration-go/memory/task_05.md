# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Academic-years API: GET [auth], POST/PATCH/DELETE [coord]; class_days (int[] 0–6),
enrollment window, is_active. 23505→409 (duplicate year), 23503→409 (delete with
linked classes). DONE — build/vet/gofmt clean, 56 Go tests pass, new code ~96% cov.

## Important Decisions
- PATCH (not PUT) per TechSpec API table, even though old Next.js route used PUT.
- API contract uses camelCase JSON (e.g. `classDays`, `enrollmentStartsAt`),
  matching the existing Go handlers — NOT the snake_case the old Supabase rows
  returned. The SPA rewrite consumes this new contract.
- Partial update tri-state for the enrollment window: request uses
  `json.RawMessage` for the two date fields so absent (nil) vs explicit `null`
  vs a date are distinguishable. SQL: `is_active`/`class_days` via COALESCE(narg);
  enrollment dates via `CASE WHEN set_enrollment THEN narg::date ELSE current END`
  so a toggle-only PATCH never wipes the window.
- Service layer `internal/academic` mirrors `internal/users` (sentinel errors
  ErrNotFound / ErrHasDependencies; 23503 translated in service.Delete).

## Learnings
- `sqlc.narg(...)::int[]` → Go `[]int32` (nil = NULL, COALESCE-friendly);
  `sqlc.narg('is_active')` → `*bool`. `:execrows` → returns RowsAffected (int64).
- chi `Patch`/`Delete` with `{id}` param; coordinator gate is the existing
  nested `r.Use(httpx.RequireCoordinator)` group in server.Router().

## Files / Surfaces
- `backend/db/queries/academic_years.sql` (new) + regenerated
  `internal/db/sqlcgen/academic_years.sql.go`.
- `backend/internal/academic/service.go` (new).
- `backend/internal/server/academic_year_handlers.go` (new) + routes in
  `server.go` (added `years *academic.Service` field).
- `backend/internal/pgconv/pgconv.go`: added `ParseDate` / `DateString`.
- Tests: `academic_year_handlers_test.go` (unit) +
  `academic_year_integration_test.go` (gated on TEST_DATABASE_URL).

## Errors / Corrections
- Initial DELETE path relied on generic WriteDBError for 23503; switched to a
  service-level translation to ErrHasDependencies for the specific PT message.
- Master `_tasks.md` was DELETED in the working tree (pre-existing branch churn)
  and stale (showed task_04 pending despite commit fa6e806). Restored from HEAD
  and marked task_05 → completed during the verify/commit run.

## Ready for Next Run
- Pattern is ready to copy for task_06 (classes) / task_09 (class_dates) /
  task_10 (enrollments): service + handlers + sqlc + gated integration test.
