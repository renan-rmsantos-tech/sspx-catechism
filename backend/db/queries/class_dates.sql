-- name: ListClassDates :many
-- Scheduled dates of the academic year, ordered chronologically.
SELECT date FROM class_dates WHERE academic_year_id = $1 ORDER BY date;

-- name: ListLockedDates :many
-- "Locked" dates: those that already have an attendance session for any class in
-- the year. Removing one of these from the calendar is blocked (would orphan a
-- recorded chamada). DISTINCT because several classes can share a date.
SELECT DISTINCT s.date
FROM attendance_sessions s
JOIN classes c ON c.id = s.class_id
WHERE c.academic_year_id = $1
ORDER BY s.date;

-- name: GetClassDays :one
-- Allowed class weekdays of the year, used to validate each submitted date in Go
-- (the trigger validate_class_date_day re-checks in the DB). No rows → unknown year.
SELECT class_days FROM academic_years WHERE id = $1;

-- name: DeleteClassDatesForYear :exec
DELETE FROM class_dates WHERE academic_year_id = $1;

-- name: BulkInsertClassDates :exec
-- Bulk replace insert. Still fires the per-row trigger (defense in depth).
INSERT INTO class_dates (academic_year_id, date)
SELECT $1, unnest($2::date[]);
