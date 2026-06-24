// Package calendar implements the class-date calendar of an academic year: the
// scheduled dates (with the "locked" ones already bearing attendance) and the
// transactional bulk replacement, validating each date against the year's allowed
// weekdays. It replaces the former Supabase-backed /api/class-dates route; the DB
// trigger validate_class_date_day stays as a second line of defense.
package calendar

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

// ErrNotFound is returned when the academic year id does not exist.
var ErrNotFound = errors.New("ano letivo não encontrado")

// ValidationError carries a business-rule violation (invalid weekday or an
// attempt to remove a locked date) so the handler can map it to HTTP 400 while
// preserving the specific message.
type ValidationError struct{ Msg string }

func (e *ValidationError) Error() string { return e.Msg }

// Service provides calendar operations. It holds the pool because Replace runs a
// multi-statement transaction.
type Service struct {
	pool *pgxpool.Pool
	q    *sqlcgen.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, q: sqlcgen.New(pool)}
}

// Calendar is the GET payload: the scheduled dates and the locked subset (dates
// with an attendance session for any class in the year). Both are YYYY-MM-DD.
type Calendar struct {
	Dates       []string
	LockedDates []string
}

// Get returns the scheduled and locked dates of the year. A syntactically valid
// but unknown year simply yields empty sets (mirrors the previous behavior).
func (s *Service) Get(ctx context.Context, academicYearID string) (Calendar, error) {
	yearUUID, err := pgconv.ParseUUID(academicYearID)
	if err != nil {
		return Calendar{}, &ValidationError{Msg: "academicYearId inválido"}
	}
	dates, err := s.q.ListClassDates(ctx, yearUUID)
	if err != nil {
		return Calendar{}, err
	}
	locked, err := s.q.ListLockedDates(ctx, yearUUID)
	if err != nil {
		return Calendar{}, err
	}
	return Calendar{
		Dates:       dateStrings(dates),
		LockedDates: dateStrings(locked),
	}, nil
}

// Replace swaps the full date set of the year atomically. It validates that every
// date falls on an allowed weekday and that no locked date is being removed,
// returning a *ValidationError on either violation and ErrNotFound for an unknown
// year. The DB trigger re-checks the weekday rule.
func (s *Service) Replace(ctx context.Context, academicYearID string, dates []string) (int, error) {
	yearUUID, err := pgconv.ParseUUID(academicYearID)
	if err != nil {
		return 0, ErrNotFound
	}

	parsed, err := parseDates(dates)
	if err != nil {
		return 0, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	qtx := s.q.WithTx(tx)

	allowed, err := qtx.GetClassDays(ctx, yearUUID)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, err
	}

	if invalid := invalidWeekdays(parsed, allowed); len(invalid) > 0 {
		return 0, &ValidationError{Msg: "Datas não correspondem aos dias de aula configurados: " + strings.Join(invalid, ", ")}
	}

	locked, err := qtx.ListLockedDates(ctx, yearUUID)
	if err != nil {
		return 0, err
	}
	if removed := removedLocked(locked, parsed); len(removed) > 0 {
		return 0, &ValidationError{Msg: "Não é possível remover datas com chamada registrada: " + strings.Join(removed, ", ")}
	}

	if err := qtx.DeleteClassDatesForYear(ctx, yearUUID); err != nil {
		return 0, err
	}
	if len(parsed) > 0 {
		if err := qtx.BulkInsertClassDates(ctx, sqlcgen.BulkInsertClassDatesParams{
			AcademicYearID: yearUUID,
			Column2:        parsed,
		}); err != nil {
			return 0, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return len(parsed), nil
}

// parseDates parses and de-duplicates YYYY-MM-DD strings into pgtype.Date,
// preserving input order. A bad date yields a *ValidationError. Duplicates are
// dropped so they cannot trip the UNIQUE(academic_year_id,date) constraint.
func parseDates(in []string) ([]pgtype.Date, error) {
	out := make([]pgtype.Date, 0, len(in))
	seen := make(map[string]struct{}, len(in))
	for _, s := range in {
		if _, dup := seen[s]; dup {
			continue
		}
		seen[s] = struct{}{}
		d, err := pgconv.ParseDate(s)
		if err != nil {
			return nil, &ValidationError{Msg: fmt.Sprintf("data inválida: %s", s)}
		}
		out = append(out, d)
	}
	return out, nil
}

// invalidWeekdays returns the YYYY-MM-DD dates whose weekday is not in the allowed
// set. Weekdays follow Postgres EXTRACT(DOW): Sunday=0 .. Saturday=6, matching
// Go's time.Weekday.
func invalidWeekdays(dates []pgtype.Date, allowed []int32) []string {
	var bad []string
	for _, d := range dates {
		if !weekdayAllowed(d, allowed) {
			bad = append(bad, d.Time.Format("2006-01-02"))
		}
	}
	return bad
}

func weekdayAllowed(d pgtype.Date, allowed []int32) bool {
	dow := int32(d.Time.Weekday())
	for _, a := range allowed {
		if a == dow {
			return true
		}
	}
	return false
}

// removedLocked returns the locked dates that are absent from the proposed set.
func removedLocked(locked, proposed []pgtype.Date) []string {
	keep := make(map[string]struct{}, len(proposed))
	for _, d := range proposed {
		keep[d.Time.Format("2006-01-02")] = struct{}{}
	}
	var removed []string
	for _, d := range locked {
		s := d.Time.Format("2006-01-02")
		if _, ok := keep[s]; !ok {
			removed = append(removed, s)
		}
	}
	return removed
}

func dateStrings(in []pgtype.Date) []string {
	out := make([]string, 0, len(in))
	for _, d := range in {
		out = append(out, d.Time.Format("2006-01-02"))
	}
	return out
}
