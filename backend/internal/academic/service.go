// Package academic implements academic-year management (CRUD, class_days and the
// enrollment window), replacing the former Supabase-backed calendar actions.
package academic

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

var (
	// ErrNotFound is returned when the academic year id does not exist.
	ErrNotFound = errors.New("ano letivo não encontrado")
	// ErrHasDependencies is returned when a delete is blocked by a foreign key
	// (e.g. classes/enrollments referencing the year).
	ErrHasDependencies = errors.New("ano letivo possui turmas vinculadas e não pode ser excluído")
)

// Service provides academic-year operations over the database.
type Service struct {
	q *sqlcgen.Queries
}

func NewService(db sqlcgen.DBTX) *Service {
	return &Service{q: sqlcgen.New(db)}
}

// List returns every academic year ordered by year descending.
func (s *Service) List(ctx context.Context) ([]sqlcgen.AcademicYear, error) {
	return s.q.ListAcademicYears(ctx)
}

// CreateInput carries the validated payload for creating an academic year.
type CreateInput struct {
	Year      int32
	IsActive  bool
	ClassDays []int32
}

// Create inserts a new academic year. Unique-violation (23505) errors surface as
// *pgconn.PgError for the caller to map to 409.
func (s *Service) Create(ctx context.Context, in CreateInput) (sqlcgen.AcademicYear, error) {
	return s.q.CreateAcademicYear(ctx, sqlcgen.CreateAcademicYearParams{
		Year:      in.Year,
		IsActive:  in.IsActive,
		ClassDays: in.ClassDays,
	})
}

// UpdateInput carries a partial update. Nil pointers mean "leave unchanged".
// When SetEnrollment is true the two enrollment dates are written verbatim (a nil
// date pointer becomes SQL NULL); when false they are left untouched.
type UpdateInput struct {
	IsActive           *bool
	ClassDays          []int32
	SetEnrollment      bool
	EnrollmentStartsAt *pgtype.Date
	EnrollmentEndsAt   *pgtype.Date
}

// Update applies a partial update and returns the updated row. A missing id
// yields ErrNotFound.
func (s *Service) Update(ctx context.Context, id string, in UpdateInput) (sqlcgen.AcademicYear, error) {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return sqlcgen.AcademicYear{}, ErrNotFound
	}
	params := sqlcgen.UpdateAcademicYearParams{
		ID:            uid,
		IsActive:      in.IsActive,
		ClassDays:     in.ClassDays,
		SetEnrollment: in.SetEnrollment,
	}
	if in.SetEnrollment {
		if in.EnrollmentStartsAt != nil {
			params.EnrollmentStartsAt = *in.EnrollmentStartsAt
		}
		if in.EnrollmentEndsAt != nil {
			params.EnrollmentEndsAt = *in.EnrollmentEndsAt
		}
	}
	year, err := s.q.UpdateAcademicYear(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlcgen.AcademicYear{}, ErrNotFound
	}
	return year, err
}

// Delete removes an academic year. A missing id yields ErrNotFound; a foreign-key
// violation (23503) yields ErrHasDependencies.
func (s *Service) Delete(ctx context.Context, id string) error {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return ErrNotFound
	}
	n, err := s.q.DeleteAcademicYear(ctx, uid)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return ErrHasDependencies
		}
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
