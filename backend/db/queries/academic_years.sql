-- name: ListAcademicYears :many
SELECT * FROM academic_years ORDER BY year DESC;

-- name: GetAcademicYear :one
SELECT * FROM academic_years WHERE id = $1;

-- name: CreateAcademicYear :one
INSERT INTO academic_years (year, is_active, class_days, enrollment_starts_at, enrollment_ends_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateAcademicYear :one
-- Partial update: is_active and class_days fall back to current values when the
-- caller omits them (COALESCE over a NULL narg). Enrollment dates are touched
-- only when set_enrollment is true, which lets the caller set them to NULL
-- explicitly without COALESCE swallowing the NULL.
UPDATE academic_years SET
    is_active            = COALESCE(sqlc.narg('is_active'), is_active),
    class_days           = COALESCE(sqlc.narg('class_days')::int[], class_days),
    enrollment_starts_at = CASE WHEN sqlc.arg('set_enrollment')::boolean
                                THEN sqlc.narg('enrollment_starts_at')::date
                                ELSE enrollment_starts_at END,
    enrollment_ends_at   = CASE WHEN sqlc.arg('set_enrollment')::boolean
                                THEN sqlc.narg('enrollment_ends_at')::date
                                ELSE enrollment_ends_at END
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteAcademicYear :execrows
DELETE FROM academic_years WHERE id = $1;
