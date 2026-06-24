# Task Memory: task_11.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Idempotent offline attendance sync. `POST /api/attendance` [auth] takes
`{sessions:[...]}` → `{synced, skipped}`; `GET /api/attendance` [auth] filters
classId/from/to with embedded records. Parity reference: old
`app/api/attendance/route.ts` + `lib/attendance/schemas.ts`.

## Important Decisions
- Idempotency keys: `attendance_sessions UNIQUE(class_id,date)` and
  `attendance_records UNIQUE(session_id,student_id)`. Session upsert =
  `INSERT ... ON CONFLICT (class_id,date) DO NOTHING RETURNING id`; pgx.ErrNoRows
  on the upsert means "already synced" → skipped. Records inserted only for a
  freshly-created session, via unnest bulk + `ON CONFLICT DO NOTHING`.
- `IsScheduledDate` = `EXISTS (classes JOIN class_dates ON academic_year_id)`.
  Returns false for an unknown class OR an unscheduled date → both → skipped,
  matching old route (unknown class fell through to a failed FK insert = skipped).
- Per-session POST authz: `authz.CanAccessClass(claims, classId)`. Denied → the
  session is counted as skipped (NOT a 403 for the whole batch) so one foreign
  class can't fail an offline batch — mirrors old RLS insert silently failing →
  skipped. Lookup error → 500. This is BROADER than the old RLS insert policy
  (which required is_class_catechist, excluding non-assigned coordinators); the
  migration's documented model is "catechist OR coordinator" via Authorizer.
- `catechist_id` always = token (`claims.UserID()`); the client-sent `catechistId`
  is validated for shape (parity with zod) but its VALUE is ignored.
- GET read scope per role (like classes/students): coordinator/admin see all;
  catechist sees only sessions of their own classes. Done in SQL via
  `is_privileged bool OR EXISTS(class_catechists)` + `viewer_id` arg.
- Session insert+records wrapped in one tx (atomic). Minor divergence from old
  route which fire-and-forgot record inserts (a bad studentId there still counted
  synced); here a record FK error rolls back + surfaces. Tests seed real students.
- DTO validation in handler (mirror zod `submitAttendanceSchema`): sessions min 1;
  id/classId/catechistId lenient UUID; date `^\d{4}-\d{2}-\d{2}$`; record studentId
  lenient UUID. Any failure → 400 for the whole batch. API JSON is camelCase.

## Learnings
- Verification: full DB-backed suite passes with
  `TEST_DATABASE_URL='postgres://postgres:postgres@localhost:55439/postgres?sslmode=disable' go test -p 1 ./...`.
  Attendance/server coverage passes the >=80% target with
  `go test -p 1 -coverpkg=./internal/attendance,./internal/server -coverprofile=/tmp/task11-cover.out ./internal/attendance ./internal/server`
  (package summary 80.5%; `go tool cover -func` total 82.1%).
- Integration tests must not be run concurrently against the same database; a
  parallel full-suite and coverage run collided on unique academic year seeds.

## Files / Surfaces
- NEW `backend/db/queries/attendance.sql` (+ regen sqlcgen)
- NEW `backend/internal/attendance/service.go` (+ test)
- NEW `backend/internal/server/attendance_handlers.go` (+ unit + integration test)
- EDIT `backend/internal/server/server.go` (wire service + routes)

## Errors / Corrections
- Added a no-DB handler test for denied-class skip and invalid GET classId to lift
  attendance/server coverage above the required threshold and exercise the
  attendance error mapper.
- Could not update master task tracking because
  `.compozy/tasks/migration-go/_tasks.md` is deleted in the current worktree.

## Ready for Next Run
- Task 11 implementation and current task tracking are complete; master tracking
  remains blocked on the missing/deleted `_tasks.md` file.
