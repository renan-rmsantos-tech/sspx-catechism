-- name: IsScheduledDate :one
-- True when the date is a scheduled class date for the class's academic year.
-- Returns false for an unknown class OR an unscheduled date, so the sync loop
-- marks both as skipped (parity with the old route, where an unknown class fell
-- through to a failing FK insert that was also counted as skipped).
SELECT EXISTS (
    SELECT 1
    FROM classes c
    JOIN class_dates cd ON cd.academic_year_id = c.academic_year_id
    WHERE c.id = $1 AND cd.date = $2
) AS scheduled;

-- name: UpsertAttendanceSession :one
-- Idempotent session insert keyed on UNIQUE(class_id,date). On a re-sent batch the
-- conflict triggers DO NOTHING, so RETURNING yields no row (pgx.ErrNoRows) — the
-- caller treats that as "already synced" and skips. catechist_id comes from the
-- token, never the client payload.
INSERT INTO attendance_sessions (class_id, date, catechist_id, synced_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (class_id, date) DO NOTHING
RETURNING id;

-- name: InsertAttendanceRecords :exec
-- Bulk-insert a session's records. ON CONFLICT(session_id,student_id) DO NOTHING
-- makes duplicate students within a payload (or a partial re-send) a no-op.
INSERT INTO attendance_records (session_id, student_id, present)
SELECT $1, unnest($2::uuid[]), unnest($3::boolean[])
ON CONFLICT (session_id, student_id) DO NOTHING;

-- name: ListAttendanceSessions :many
-- Sessions visible to the caller, newest first, with optional classId/from/to
-- filters. Read scope replaces RLS: privileged roles (coordinator/admin) see every
-- session; a catechist sees only sessions of classes they are assigned to.
SELECT s.id, s.class_id, s.date, s.catechist_id, s.synced_at
FROM attendance_sessions s
WHERE (sqlc.narg('class_id')::uuid IS NULL OR s.class_id = sqlc.narg('class_id'))
  AND (sqlc.narg('from_date')::date IS NULL OR s.date >= sqlc.narg('from_date'))
  AND (sqlc.narg('to_date')::date IS NULL OR s.date <= sqlc.narg('to_date'))
  AND (
    sqlc.arg('is_privileged')::boolean
    OR EXISTS (
      SELECT 1 FROM class_catechists cc
      WHERE cc.class_id = s.class_id AND cc.catechist_id = sqlc.arg('viewer_id')
    )
  )
ORDER BY s.date DESC, s.id;

-- name: ListAttendanceRecordsForSessions :many
-- Records of the given sessions, used to embed each session's records in the GET
-- response after the scoped session list is fetched.
SELECT id, session_id, student_id, present
FROM attendance_records
WHERE session_id = ANY($1::uuid[])
ORDER BY id;
