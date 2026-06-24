-- name: ListClasses :many
-- Coordinator/admin view: every class, with its assigned catechist ids aggregated
-- so the SPA can render/edit assignments without an extra round-trip.
SELECT
    c.*,
    COALESCE(
        ARRAY_AGG(cc.catechist_id ORDER BY cc.catechist_id) FILTER (WHERE cc.catechist_id IS NOT NULL),
        '{}'
    )::uuid[] AS catechist_ids
FROM classes c
LEFT JOIN class_catechists cc ON cc.class_id = c.id
GROUP BY c.id
ORDER BY c.name;

-- name: ListClassesForCatechist :many
-- Per-catechist scope replacing the old RLS: only classes the catechist is
-- assigned to, still aggregating the full set of catechist ids for the class.
SELECT
    c.*,
    COALESCE(
        ARRAY_AGG(cc.catechist_id ORDER BY cc.catechist_id) FILTER (WHERE cc.catechist_id IS NOT NULL),
        '{}'
    )::uuid[] AS catechist_ids
FROM classes c
LEFT JOIN class_catechists cc ON cc.class_id = c.id
WHERE c.id IN (SELECT m.class_id FROM class_catechists m WHERE m.catechist_id = $1)
GROUP BY c.id
ORDER BY c.name;

-- name: GetClass :one
SELECT * FROM classes WHERE id = $1;

-- name: CreateClass :one
INSERT INTO classes (academic_year_id, name, level, schedule)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateClass :one
-- Partial update: every field falls back to its current value when the caller
-- omits it (COALESCE over a NULL narg). Doubles as the row fetch, so a missing id
-- returns no rows (→ 404). Catechist assignments are handled separately.
UPDATE classes SET
    name             = COALESCE(sqlc.narg('name'), name),
    academic_year_id = COALESCE(sqlc.narg('academic_year_id')::uuid, academic_year_id),
    level            = COALESCE(sqlc.narg('level'), level),
    schedule         = COALESCE(sqlc.narg('schedule'), schedule),
    is_archived      = COALESCE(sqlc.narg('is_archived'), is_archived)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteClassCatechists :exec
DELETE FROM class_catechists WHERE class_id = $1;

-- name: AddClassCatechist :exec
INSERT INTO class_catechists (class_id, catechist_id) VALUES ($1, $2);

-- name: ListClassCatechistIDs :many
SELECT catechist_id FROM class_catechists WHERE class_id = $1 ORDER BY catechist_id;

-- name: ListStudentsByClass :many
SELECT * FROM students WHERE class_id = $1 AND is_active ORDER BY full_name;
