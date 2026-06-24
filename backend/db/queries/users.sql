-- name: GetProfileByEmail :one
SELECT * FROM profiles WHERE email = $1;

-- name: GetProfileByID :one
SELECT * FROM profiles WHERE id = $1;

-- name: CreateProfile :one
INSERT INTO profiles (email, password_hash, full_name, role, must_change_password)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdatePassword :exec
UPDATE profiles
SET password_hash = $2, must_change_password = $3
WHERE id = $1;

-- name: UpdateAdminCredentials :one
UPDATE profiles
SET password_hash = $2, role = 'admin', is_active = TRUE
WHERE email = $1
RETURNING *;

-- name: ListCatechists :many
SELECT * FROM profiles WHERE role = 'catechist' ORDER BY full_name;

-- name: SetRole :exec
UPDATE profiles SET role = $2 WHERE id = $1;

-- name: SetActive :exec
UPDATE profiles SET is_active = $2 WHERE id = $1;

-- name: CountSessionsByCatechist :one
SELECT count(*) FROM attendance_sessions WHERE catechist_id = $1;

-- name: DeleteProfile :exec
DELETE FROM profiles WHERE id = $1;
