-- name: GetActiveEnrollmentYear :one
-- The active academic year plus its enrollment window, used by the public submit
-- to gate on the open period. No rows → there is no active year configured.
SELECT id, enrollment_starts_at, enrollment_ends_at
FROM academic_years
WHERE is_active = TRUE
LIMIT 1;

-- name: CreateEnrollment :one
-- Public submission (privileged path, no auth — equivalent to the old service-role
-- client). The academic_year_id is resolved server-side from the active year; status
-- defaults to 'pending'.
INSERT INTO enrollments (
    academic_year_id, full_name, birth_date, city, first_communion, confirmation,
    previous_catechism, religious_books, guardian_father_name, guardian_mother_name,
    guardian_phone, guardian_email, is_renewal, previous_name
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
RETURNING *;

-- name: ListEnrollmentsByStatus :many
-- Coordinator listing scoped to the active year, filtered by status and optionally
-- by name (ILIKE). A NULL q returns every enrollment of that status; the same narg is
-- referenced twice so sqlc emits a single nullable Q parameter.
SELECT * FROM enrollments
WHERE academic_year_id = $1
  AND status = $2
  AND (sqlc.narg('q')::text IS NULL OR full_name ILIKE '%' || sqlc.narg('q')::text || '%')
ORDER BY created_at DESC;

-- name: GetEnrollmentForUpdate :one
-- Fetch a single enrollment and lock its row for the review transaction so the
-- pending → approved/rejected transition cannot race. No rows → unknown id (404).
SELECT * FROM enrollments WHERE id = $1 FOR UPDATE;

-- name: CreateStudentFromEnrollment :one
-- Materializes a new student from an approved enrollment's fields, into the chosen
-- class. Mirrors CreateStudent but is scoped to the approval transaction.
INSERT INTO students (
    class_id, full_name, birth_date, city, first_communion, confirmation,
    previous_catechism, religious_books, guardian_father_name,
    guardian_mother_name, guardian_phone, guardian_email
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING id;

-- name: UpdateStudentFromEnrollment :one
-- Overwrites an existing student (re-enrollment/renewal) with the enrollment's
-- fields and (re)assigns the chosen class. Unlike the partial students update this
-- writes every column unconditionally. No rows → unknown student id.
UPDATE students SET
    class_id             = $2,
    full_name            = $3,
    birth_date           = $4,
    city                 = $5,
    first_communion      = $6,
    confirmation         = $7,
    previous_catechism   = $8,
    religious_books      = $9,
    guardian_father_name = $10,
    guardian_mother_name = $11,
    guardian_phone       = $12,
    guardian_email       = $13
WHERE id = $1
RETURNING id;

-- name: ApproveEnrollment :one
-- Marks an enrollment approved with the materialized student/class and the reviewer
-- metadata. The status guard keeps the transition idempotent at the row level.
UPDATE enrollments SET
    status              = 'approved',
    approved_student_id = $2,
    approved_class_id   = $3,
    reviewed_by         = $4,
    reviewed_at         = now()
WHERE id = $1 AND status = 'pending'
RETURNING *;

-- name: RejectEnrollment :one
-- Marks an enrollment rejected with an optional reason and the reviewer. The status
-- guard keeps the transition idempotent at the row level.
UPDATE enrollments SET
    status           = 'rejected',
    rejection_reason = $2,
    reviewed_by      = $3,
    reviewed_at      = now()
WHERE id = $1 AND status = 'pending'
RETURNING *;
