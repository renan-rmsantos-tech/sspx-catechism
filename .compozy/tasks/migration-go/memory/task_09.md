# Task Memory: task_09.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Calendar/class_dates API for an academic year: GET (scheduled dates + locked
dates) [auth] and PUT (bulk replace) [coordinator]. Validate each date's weekday
against `academic_years.class_days` (Go + DB trigger), block removal of dates that
already have `attendance_sessions`, apply the swap in a transaction. DONE & verified.

## Important Decisions
- New domain package `internal/calendar` (Service holds `*pgxpool.Pool` because
  Replace runs a transaction — same shape as `classes`).
- "Locked dates" = `attendance_sessions` for any class in the year (DISTINCT date),
  joined classes→academic_year_id. Removing a locked date → 400 ValidationError.
- GET is query-param driven: `/api/class-dates?academicYearId=<uuid>` (NOT a path
  param), mirroring the old Supabase route shape. Missing param → 400.
- PUT body is camelCase `{academicYearId, dates:[]}`; returns `{count}`. Unknown but
  well-formed year → 404 (ErrNotFound from GetClassDays no-rows); invalid weekday or
  locked-removal → 400. GET on an unknown-but-valid UUID returns empty sets (legacy
  behavior); GET on a malformed UUID → 400.
- Replace is transactional on `q.WithTx(tx)`: GetClassDays → invalidWeekdays →
  ListLockedDates → removedLocked → DeleteClassDatesForYear → BulkInsertClassDates
  (`INSERT ... SELECT unnest($2::date[])`, still fires the per-row trigger).
  parseDates dedups input to avoid UNIQUE(year,date) trips.
- Weekday mapping: PG `EXTRACT(DOW)` (Sun=0..Sat=6) == Go `time.Weekday()`, so the
  Go check and the `validate_class_date_day` trigger agree by construction.

## Learnings
- Validation split: date *shape* (regex `^\d{4}-\d{2}-\d{2}$`) in the handler;
  weekday-vs-class_days and locked-removal (need DB) in the service. A regex-valid
  but impossible date (e.g. `2026-13-40`) passes the handler and is caught by
  `parseDates` in the service → 400 (covered by an integration test).
- Coverage: package-level `go test -cover` UNDERSTATES this code because the calendar
  DB funcs (Get/Replace) are exercised by the *server* integration tests, not
  calendar's own unit tests. Measure true coverage with
  `-coverpkg=<calendar>,<server>` across BOTH packages, then filter the profile to
  the two new files → 90.8% (≥80% met). Remaining gaps are fault-injection-only
  paths (tx.Begin/Commit/DB errors).
- Ephemeral PG for integration tests: `docker run postgres:16-alpine` on host port
  55439 (POSTGRES_PASSWORD=postgres, db=catechism). TEST_DATABASE_URL=
  `postgres://postgres:postgres@localhost:55439/catechism?sslmode=disable`.
  Run serialized: `go test -p 1 ./...` (shared DB; see shared MEMORY).

## Files / Surfaces
- `backend/db/queries/class_dates.sql` (+ generated `internal/db/sqlcgen/class_dates.sql.go`)
- `backend/internal/calendar/service.go` (+ `service_test.go`)
- `backend/internal/server/class_dates_handlers.go` (+ `_test.go`, `_integration_test.go`)
- `backend/internal/server/server.go` — added `calendar` field + wiring; GET
  `/class-dates` [auth], PUT `/class-dates` [coord].
- Trigger `validate_class_date_day` already in `db/migrations/0001_init.sql`.

## Errors / Corrections
- Master `_tasks.md` is absent (staged deletion predating this session; same state as
  tasks 05–08 commits). Did NOT recreate it — per-task files + memory are the tracking.

## Ready for Next Run
- task_11 (attendance): a session may only be created on a scheduled class_date; reuse
  the class_dates set / locked-date concept (ADR-003 IsScheduledDate). task_14/15
  consume GET for the calendar UI.
