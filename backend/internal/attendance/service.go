// Package attendance implements the offline attendance sync — the most critical
// endpoint of the system. A batch of sessions captured offline is replayed
// idempotently: re-sending the same batch never duplicates a session or a record,
// thanks to the UNIQUE(class_id,date) and UNIQUE(session_id,student_id) keys plus
// ON CONFLICT DO NOTHING. It replaces the former Supabase-backed /api/attendance
// route, moving the RLS read/write scope into the application Authorizer.
package attendance

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/authz"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

// ErrInvalidID is returned when an id in the payload or filter is not a parseable
// UUID. Date strings are validated in the handler (DTO layer).
var ErrInvalidID = errors.New("identificador inválido")

// Service runs the attendance sync and the scoped read. It holds the pool because
// each created session and its records are committed in a single transaction, and
// the Authorizer to gate per-session write access (replacing the RLS insert rule).
type Service struct {
	pool  *pgxpool.Pool
	q     *sqlcgen.Queries
	authz authz.Authorizer
}

func NewService(pool *pgxpool.Pool, a authz.Authorizer) *Service {
	return &Service{pool: pool, q: sqlcgen.New(pool), authz: a}
}

// RecordInput is one student's presence within a session.
type RecordInput struct {
	StudentID string
	Present   bool
}

// SessionInput is one offline session to sync. ClassID/Date identify it (the
// idempotency key); the client-sent catechist id is intentionally absent — the
// session's catechist is always taken from the token.
type SessionInput struct {
	ClassID string
	Date    string
	Records []RecordInput
}

// SyncResult counts the sessions newly persisted and those skipped (already
// synced, date not scheduled, or class not accessible to the caller).
type SyncResult struct {
	Synced  int
	Skipped int
}

// Sync replays a batch of offline sessions idempotently. For each session it, in
// order: verifies the caller may write to the class (denied → skipped), checks the
// date is scheduled (not → skipped), then upserts the session ON CONFLICT
// (class_id,date) DO NOTHING. A conflict (already synced) → skipped; a fresh insert
// persists the records and counts as synced. The catechist id always comes from
// the claims, never the payload.
func (s *Service) Sync(ctx context.Context, c auth.Claims, sessions []SessionInput) (SyncResult, error) {
	catechistUUID, err := pgconv.ParseUUID(c.UserID())
	if err != nil {
		return SyncResult{}, ErrInvalidID
	}

	var res SyncResult
	for _, in := range sessions {
		classUUID, err := pgconv.ParseUUID(in.ClassID)
		if err != nil {
			return SyncResult{}, ErrInvalidID
		}
		date, err := pgconv.ParseDate(in.Date)
		if err != nil {
			return SyncResult{}, ErrInvalidID
		}

		// Write scope (replaces the RLS insert policy): a foreign class is silently
		// skipped, never a hard 403, so one bad session can't fail the whole batch.
		allowed, err := s.authz.CanAccessClass(ctx, c, in.ClassID)
		if err != nil {
			return SyncResult{}, err
		}
		if !allowed {
			res.Skipped++
			continue
		}

		scheduled, err := s.q.IsScheduledDate(ctx, sqlcgen.IsScheduledDateParams{ID: classUUID, Date: date})
		if err != nil {
			return SyncResult{}, err
		}
		if !scheduled {
			res.Skipped++
			continue
		}

		created, err := s.upsertSession(ctx, classUUID, date, catechistUUID, in.Records)
		if err != nil {
			return SyncResult{}, err
		}
		if created {
			res.Synced++
		} else {
			res.Skipped++
		}
	}
	return res, nil
}

// upsertSession inserts the session and its records in one transaction. It returns
// created=false (without error) when the session already existed — the ON CONFLICT
// DO NOTHING yields no row, so the records are left untouched and the batch is
// idempotent.
func (s *Service) upsertSession(ctx context.Context, classID pgtype.UUID, date pgtype.Date, catechistID pgtype.UUID, records []RecordInput) (bool, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)
	qtx := s.q.WithTx(tx)

	sessionID, err := qtx.UpsertAttendanceSession(ctx, sqlcgen.UpsertAttendanceSessionParams{
		ClassID:     classID,
		Date:        date,
		CatechistID: catechistID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil // session already synced
	}
	if err != nil {
		return false, err
	}

	if len(records) > 0 {
		studentIDs, presents, err := splitRecords(records)
		if err != nil {
			return false, err
		}
		if err := qtx.InsertAttendanceRecords(ctx, sqlcgen.InsertAttendanceRecordsParams{
			SessionID: sessionID,
			Column2:   studentIDs,
			Column3:   presents,
		}); err != nil {
			return false, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return true, nil
}

// splitRecords turns the record inputs into the parallel arrays the bulk insert
// expects, parsing each student id leniently (non-RFC4122 hex accepted).
func splitRecords(records []RecordInput) ([]pgtype.UUID, []bool, error) {
	studentIDs := make([]pgtype.UUID, 0, len(records))
	presents := make([]bool, 0, len(records))
	for _, r := range records {
		u, err := pgconv.ParseUUID(r.StudentID)
		if err != nil {
			return nil, nil, ErrInvalidID
		}
		studentIDs = append(studentIDs, u)
		presents = append(presents, r.Present)
	}
	return studentIDs, presents, nil
}

// ListFilter holds the optional GET filters. Empty strings mean "no filter".
type ListFilter struct {
	ClassID string
	From    string
	To      string
}

// Record is one persisted presence row in the GET response.
type Record struct {
	ID        string
	StudentID string
	Present   bool
}

// SessionWithRecords is a session plus its embedded records, as returned by List.
type SessionWithRecords struct {
	ID          string
	ClassID     string
	Date        string
	CatechistID string
	SyncedAt    *string
	Records     []Record
}

// List returns the sessions visible to the caller (coordinators/admins see all;
// catechists only their own classes), newest first, with the records of each
// session embedded. The optional filter narrows by class and date range.
func (s *Service) List(ctx context.Context, c auth.Claims, f ListFilter) ([]SessionWithRecords, error) {
	params := sqlcgen.ListAttendanceSessionsParams{
		IsPrivileged: s.authz.IsCoordinator(c),
	}
	viewerUUID, err := pgconv.ParseUUID(c.UserID())
	if err != nil {
		return nil, ErrInvalidID
	}
	params.ViewerID = viewerUUID

	if f.ClassID != "" {
		u, err := pgconv.ParseUUID(f.ClassID)
		if err != nil {
			return nil, ErrInvalidID
		}
		params.ClassID = u
	}
	if f.From != "" {
		d, err := pgconv.ParseDate(f.From)
		if err != nil {
			return nil, ErrInvalidID
		}
		params.FromDate = d
	}
	if f.To != "" {
		d, err := pgconv.ParseDate(f.To)
		if err != nil {
			return nil, ErrInvalidID
		}
		params.ToDate = d
	}

	rows, err := s.q.ListAttendanceSessions(ctx, params)
	if err != nil {
		return nil, err
	}

	out := make([]SessionWithRecords, 0, len(rows))
	byID := make(map[string]int, len(rows))
	ids := make([]pgtype.UUID, 0, len(rows))
	for _, r := range rows {
		idStr := pgconv.UUIDString(r.ID)
		byID[idStr] = len(out)
		ids = append(ids, r.ID)
		out = append(out, SessionWithRecords{
			ID:          idStr,
			ClassID:     pgconv.UUIDString(r.ClassID),
			Date:        derefDate(r.Date),
			CatechistID: pgconv.UUIDString(r.CatechistID),
			SyncedAt:    pgconv.TimestampString(r.SyncedAt),
			Records:     []Record{},
		})
	}

	if len(ids) > 0 {
		recs, err := s.q.ListAttendanceRecordsForSessions(ctx, ids)
		if err != nil {
			return nil, err
		}
		for _, rec := range recs {
			i, ok := byID[pgconv.UUIDString(rec.SessionID)]
			if !ok {
				continue
			}
			out[i].Records = append(out[i].Records, Record{
				ID:        pgconv.UUIDString(rec.ID),
				StudentID: pgconv.UUIDString(rec.StudentID),
				Present:   rec.Present,
			})
		}
	}
	return out, nil
}

func derefDate(d pgtype.Date) string {
	if s := pgconv.DateString(d); s != nil {
		return *s
	}
	return ""
}
