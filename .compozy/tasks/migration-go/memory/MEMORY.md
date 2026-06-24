# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State
- task_01 (infra foundation) complete & verified: Compose (Caddy+API+Postgres),
  CI/deploy, backup/restore scripts, Hetzner runbook all in place.
- task_05 (academic-years API), task_06 (classes + class_catechists API),
  task_07 (students API: search/CRUD), task_09 (calendar/class_dates API),
  task_10 (enrollments: public submit + review), task_11 (attendance
  sync/list API), and task_12 (attendance reports JSON/PDF/XLSX) complete &
  verified against ephemeral PG. `Server` now holds
  `users`, `years`, `classes`, `students`, `calendar`, `enrollments`,
  `attendance`, `reports` services + `authz`.

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
  They share ONE DB and each `TRUNCATE`s its own tables, so packages running in
  parallel collide (e.g. `authz` + `server` both seed `academic_years(2026)`).
  Run them serialized: `go test -p 1 ./...`. CI runs `go test ./...` WITHOUT a DB
  url, so all integration tests skip there — keep meaningful logic in unit tests.
- After adding/editing `backend/db/queries/*.sql`, run `sqlc generate` to refresh
  `internal/db/sqlcgen` (sqlc v1.30.0; config in `backend/sqlc.yaml`).
- Resource pattern (task_05, copy for classes/students/enrollments): thin service
  in `internal/<domain>` (mirrors `internal/users`) with sentinel errors; handlers
  in `internal/server/<domain>_handlers.go`; route group reuses the existing
  `r.Use(httpx.RequireCoordinator)` nest. API contract is **camelCase JSON**
  (Go-defined), not the old Supabase snake_case rows.
- PG error → HTTP: `httpx.WriteDBError` already maps 23505/23503→409, no-rows→404,
  everything else→500. `pgconv.ParseUUID` errors are plain scan errors, so a
  malformed path uuid hits the 500 default — return a domain sentinel (e.g.
  `users.ErrInvalidID`) and map it to 400 in the handler if you want 400. A
  valid-but-unknown uuid still 404s via the GetByID `pgx.ErrNoRows`.
  Use a domain sentinel only when a specific message/status is required (e.g.
  translate 23503 in the service to "possui X vinculadas").
- sqlc partial updates: `COALESCE(sqlc.narg('f'), f)` for "leave unchanged"; for
  nullable columns that must also be clearable, gate with a `set_x boolean` arg +
  `CASE WHEN set_x THEN narg::type ELSE x END`. Decode tri-state JSON
  (absent/null/value) with `json.RawMessage` fields. `:execrows` → RowsAffected.
- DTO validation lives in the handler (mirrors old Zod schemas); dates use
  `^\d{4}-\d{2}-\d{2}$` + `pgconv.ParseDate`/`DateString`. Prefer PATCH for
  partial resource edits per TechSpec API table.
- Tri-state nullable PATCH fields (clearable): decode each as `json.RawMessage`
  and a helper → (val, set, ok): absent→leave (set=false), null/blank→clear
  (set=true,val=nil), value→trim+optional-regex. Maps to a `set_x boolean` + narg
  CASE column (see students `UpdateStudent`). Non-null booleans/required strings
  use `*T` + COALESCE instead. List/detail joins use `sqlc.embed(parent)` so the
  row embeds the full model struct + extra cols → one shared response mapper.

## Open Risks
- Full-stack smoke + backup/restore are unverified until task_16 (needs live VPS +
  the `frontend/` SPA from task_13; `Caddy.Dockerfile`/CI build it).
- Authorization parity vs old RLS is the highest-risk area; keep extending the
  matrix tests as class/student/attendance routes (tasks 06/07/11) consume it.

## Handoffs
- Tasks 07/11: chain `authz.RequireClassAccess(s.authz, "id")` after
  `RequireAuth` on routes scoped to a class (done for `/classes/{id}/students`).
- A service that runs multi-statement transactions (e.g. classes' replace-set)
  takes the `*pgxpool.Pool` and uses `pool.Begin` → `q.WithTx(tx)`; single-query
  services keep taking the pool but only call `sqlcgen.New(pool)`.
- Per-role read scope (catechist sees only own rows) is decided in the service by
  `claims.Role`, NOT by route middleware — the GET stays open to any auth user.
- Aggregating a child set into a parent row: `array_agg(...) FILTER (WHERE ... IS
  NOT NULL)` over a LEFT JOIN + `GROUP BY parent.id`, cast `::uuid[]`.
- Coverage on services whose DB methods are driven by *another* package's
  integration tests is understated by package-level `go test -cover`. Measure the
  real number with `-coverpkg=./internal/<svc>/` run across BOTH the svc and the
  server packages (e.g. calendar's Get/Replace only register via server tests →
  84.4% with coverpkg vs 39% standalone).
- PG `EXTRACT(DOW FROM date)` (Sun=0..Sat=6) matches Go `time.Weekday()` exactly,
  so a Go weekday check and the `validate_class_date_day` trigger agree without a
  mapping table. Bulk insert via `unnest($2::date[])` still fires the per-row
  trigger (defense in depth). Dedup the input slice before insert to avoid tripping
  UNIQUE(academic_year_id,date).
- Calendar GET is query-param driven (`?academicYearId=`), not a path param, to
  mirror the old Supabase route; PUT replaces the whole year's set transactionally
  and refuses to drop a "locked" date (one with an `attendance_sessions` row).
- Active-year-scoped flows resolve the year server-side via `GetActiveEnrollmentYear`
  (`is_active=TRUE LIMIT 1`); no active year is a real misconfiguration → surface it
  (enrollments maps it to 404), don't silently return empty. The public enrollment
  submit is the ONE unauthenticated write route (mounted OUTSIDE the RequireAuth
  group, beside login) — the old service-role path; gate it server-side (window +
  field validation), never trust the client.
- State-machine transitions (e.g. enrollment pending→approved/rejected) use
  `SELECT … FOR UPDATE` inside the tx PLUS a `WHERE status='pending'` guard on the
  UPDATE; a non-pending row → a 409 domain sentinel. When a write must overwrite
  every column (materialize student from enrollment), write a dedicated all-columns
  UPDATE — do NOT reuse the partial COALESCE/tri-state update (it would preserve old
  values for fields the source left null).
- Coverage via `-coverpkg=<svc>,<server>`: the merged profile DUPLICATES each block
  per test binary (one with count=0), so summing halves the %. Dedup by MAX count per
  region before computing (task_10 → 81.6%).
- Attendance API contract for task_12/task_15: `POST /api/attendance` accepts
  `{sessions:[...]}` and returns `{synced, skipped}`; `catechist_id` is always the
  token user, unscheduled/inaccessible sessions are skipped, session idempotency is
  `(class_id,date)`, record idempotency is `(session_id,student_id)`. `GET
  /api/attendance?classId=&from=&to=` returns camelCase sessions with embedded
  `records`.
- Report API contract for task_14: `GET /api/reports/attendance?classId=&from=&to=&format=`
  is coordinator/admin-only and supports `json`, `pdf`, `xlsx`. JSON intentionally
  preserves the legacy report payload shape (`className`, `students[].full_name`,
  `records[].session_id/student_id`) so the existing preview/export helpers can be
  migrated with minimal churn.
- Frontend task_13 established `frontend/` as an independent Vite/React package
  built by `infra/Caddy.Dockerfile`. Auth client contract: same-origin `/api`
  calls use `fetch` with `credentials: 'include'`; `/api/auth/me` returns
  camelCase `AuthUser` (`fullName`, `mustChangePassword`); role homes are
  `admin|coordinator -> /admin` and `catechist -> /dashboard`; any
  `mustChangePassword` user is forced to `/trocar-senha`.
- Frontend task_14 added the coordinator admin SPA under `frontend/src/pages/admin`
  with a typed `frontend/src/lib/admin-api.ts`. Admin forms use React Hook Form +
  Zod; nullable optional fields are transformed to `null` by the resolver, so
  submit handlers should consume resolver output directly rather than re-parsing.
  Report downloads intentionally use raw `fetch` because `apiFetch` parses
  non-JSON bodies as text. Admin navigation links are absolute `/admin/...` paths.
- Frontend task_15 added Vite PWA/offline attendance in `frontend/`: SW registered
  from `main.tsx` via `vite-plugin-pwa` injectManifest, service worker listens for
  `sync-attendance`, and Dexie stores `pending_sessions` plus
  `cached_class_dates`. Attendance replay posts same-origin `/api/attendance`
  with `credentials: 'include'`; pending sessions are deduped client-side by
  `(classId,date)` while backend idempotency remains authoritative.
- Frontend Vitest config is intentionally serialized (`fileParallelism:false`,
  `maxWorkers:1`) because several existing tests use process-global `fetch`/`URL`
  stubs; parallel files race and fail nondeterministically.
