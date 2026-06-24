-- name: GetReportClass :one
-- Class label used in the attendance report header. A missing id returns no rows
-- so the handler maps it through the normal 404 DB path.
SELECT name
FROM classes
WHERE id = $1;

-- name: ListReportStudents :many
-- Preserve the legacy report payload shape: students are returned as id/full_name
-- and ordered by name.
SELECT id, full_name
FROM students
WHERE class_id = $1
ORDER BY full_name;

-- name: ListReportSessions :many
-- Sessions for the requested class and inclusive date period, ordered oldest first
-- to match the legacy PDF/XLSX column order.
SELECT id, date
FROM attendance_sessions
WHERE class_id = $1
  AND date >= sqlc.arg('from_date')
  AND date <= sqlc.arg('to_date')
ORDER BY date, id;

-- name: ListReportRecords :many
-- Presence records for the report sessions. The service skips this query when the
-- period has no sessions.
SELECT session_id, student_id, present
FROM attendance_records
WHERE session_id = ANY($1::uuid[])
ORDER BY session_id, student_id;
