# Task Memory: task_07.md

Status: completed & verified.

## Objective Snapshot
Students API (coordinator-only): GET list with optional `q` name search (ILIKE) +
class name join, GET/:id detail (full row + class name), POST create, PATCH update
(incl. class transfer). Normalize payload (trim, booleans, phone/email regex).
not-found→404, FK conflict (bad class_id)→409. Mirror task_05/06 resource pattern.

## Important Decisions
- PATCH excludes `is_active`: the old app toggled active state via separate
  `activate/deactivate` Server Actions, and `updateStudentSchema` did not include
  it. Kept parity (no is_active in PATCH). Follow-up if the SPA needs a toggle:
  add `is_active` (COALESCE bool) to UpdateStudent or a dedicated endpoint.
- No DELETE endpoint: TechSpec API table lists only GET|POST /students and
  GET|PATCH /students/:id. Old delete blocked when attendance_records existed →
  "deactivate instead of delete" is the intended path. Out of scope.
- `className` in the response DTO is `*string`: populated for list/detail (join),
  nil/omitted for create/update which return the bare row (matches old POST that
  did `.select().single()` without the join).
- list/detail use `sqlc.embed(s)` so the row carries a full `sqlcgen.Student` +
  ClassName → one shared mapper (`toStudentResponse`) covers all shapes; no
  re-fetch on create/update.

## Learnings
- Tri-state nullable text on PATCH uses `json.RawMessage` per field +
  `parseOptionalText(raw, re)` → (val, set, ok): absent→leave, null/blank→clear,
  value→trim+optional-regex. Drives the `set_x boolean` + `narg` CASE columns in
  `UpdateStudent`. Phone/email validated only when a non-blank value is present.
- `birth_date` create path: `parseBirthDate` (nil/blank→null date, regex+parse
  else). PATCH reuses existing `parseDateField` + `set_birth_date`.
- Reused package-level `dateRe`, `normalizeOptional`, `newValidationServer()`
  from the academic/class handlers (same `server` package) — no duplication.

## Files / Surfaces
- `backend/db/queries/students.sql` (new) — SearchStudents/GetStudent (embed+join),
  CreateStudent, UpdateStudent (COALESCE + set_x CASE).
- `backend/internal/students/service.go` (new) — Service over DBTX; sentinels
  ErrNotFound/ErrInvalidID/ErrInvalidReference; mapFKError(23503).
- `backend/internal/server/student_handlers.go` (new) — DTOs, validation,
  tri-state decode, writeStudentError mapping.
- `backend/internal/server/student_{handlers,integration}_test.go` (new).
- `backend/internal/server/server.go` — added `students` service + 4 routes under
  the coordinator group.
- Regenerated `internal/db/sqlcgen/students.sql.go` via `sqlc generate`.

## Verification
- `go build ./...` Success · `go vet ./...` clean.
- `go test -p 1 ./...` (TEST_DATABASE_URL=ephemeral PG) → 105 passed, exit 0.
- Student code statement coverage 91.2% (146/160) — above the 80% target.

## Ready for Next Run
- task_10 (enrollment approval) creates/updates students — reuse
  `students.Service.Create`/`Update` + CreateInput/UpdateInput.
- task_12 (reports) reads students; SearchStudents join pattern is reusable.
