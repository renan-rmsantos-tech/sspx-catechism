-- name: SearchStudents :many
-- Coordinator list, optionally filtered by name (ILIKE). The class name is joined
-- so the SPA can show it without a second round-trip. A NULL q (no search param)
-- returns every student; the same narg is referenced twice so sqlc emits a single
-- nullable Q parameter.
SELECT sqlc.embed(s), c.name AS class_name
FROM students s
JOIN classes c ON c.id = s.class_id
WHERE sqlc.narg('q')::text IS NULL
   OR s.full_name ILIKE '%' || sqlc.narg('q')::text || '%'
ORDER BY s.full_name;

-- name: GetStudent :one
-- Detail view: the full student row plus the joined class name. A missing id
-- returns no rows (→ 404).
SELECT sqlc.embed(s), c.name AS class_name
FROM students s
JOIN classes c ON c.id = s.class_id
WHERE s.id = $1;

-- name: CreateStudent :one
INSERT INTO students (
    class_id, full_name, birth_date, city, first_communion, confirmation,
    previous_catechism, religious_books, guardian_father_name,
    guardian_mother_name, guardian_phone, guardian_email
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: UpdateStudent :one
-- Partial update. class_id, full_name and the two booleans fall back to their
-- current value when omitted (COALESCE over a NULL narg). The nullable fields are
-- tri-state (absent = leave / null = clear / value = set): each is touched only
-- when its set_x flag is true, so the caller can clear it to NULL without COALESCE
-- swallowing the NULL. Doubles as the row fetch, so a missing id returns no rows
-- (→ 404).
UPDATE students SET
    class_id        = COALESCE(sqlc.narg('class_id')::uuid, class_id),
    full_name       = COALESCE(sqlc.narg('full_name'), full_name),
    first_communion = COALESCE(sqlc.narg('first_communion'), first_communion),
    confirmation    = COALESCE(sqlc.narg('confirmation'), confirmation),
    birth_date           = CASE WHEN sqlc.arg('set_birth_date')::boolean
                                THEN sqlc.narg('birth_date')::date ELSE birth_date END,
    city                 = CASE WHEN sqlc.arg('set_city')::boolean
                                THEN sqlc.narg('city') ELSE city END,
    previous_catechism   = CASE WHEN sqlc.arg('set_previous_catechism')::boolean
                                THEN sqlc.narg('previous_catechism') ELSE previous_catechism END,
    religious_books      = CASE WHEN sqlc.arg('set_religious_books')::boolean
                                THEN sqlc.narg('religious_books') ELSE religious_books END,
    guardian_father_name = CASE WHEN sqlc.arg('set_guardian_father_name')::boolean
                                THEN sqlc.narg('guardian_father_name') ELSE guardian_father_name END,
    guardian_mother_name = CASE WHEN sqlc.arg('set_guardian_mother_name')::boolean
                                THEN sqlc.narg('guardian_mother_name') ELSE guardian_mother_name END,
    guardian_phone       = CASE WHEN sqlc.arg('set_guardian_phone')::boolean
                                THEN sqlc.narg('guardian_phone') ELSE guardian_phone END,
    guardian_email       = CASE WHEN sqlc.arg('set_guardian_email')::boolean
                                THEN sqlc.narg('guardian_email') ELSE guardian_email END
WHERE id = sqlc.arg('id')
RETURNING *;
