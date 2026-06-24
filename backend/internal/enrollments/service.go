// Package enrollments implements the public enrollment submission (gated on the
// active year's enrollment window) and the coordinator review flow (list by status,
// approve — materializing a student into a class — and reject with a reason). It
// replaces the former Supabase-backed enrollment Server Actions: the public submit
// used the service-role client (no auth) and the review actions ran as the
// coordinator. The active-year resolution and window check live here, in Go.
package enrollments

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

var (
	// ErrNoActiveYear is returned when no academic year is marked active, so neither
	// a public submission nor a coordinator listing can be scoped.
	ErrNoActiveYear = errors.New("nenhum ano letivo ativo encontrado")
	// ErrWindowClosed is returned when the active year's enrollment window is unset
	// or today falls outside it.
	ErrWindowClosed = errors.New("o período de inscrições não está aberto")
	// ErrNotFound is returned when the enrollment id does not exist.
	ErrNotFound = errors.New("inscrição não encontrada")
	// ErrAlreadyReviewed is returned when the enrollment is no longer pending, so it
	// cannot be approved or rejected again.
	ErrAlreadyReviewed = errors.New("esta inscrição já foi processada")
	// ErrInvalidReference is returned when the chosen class or student does not exist
	// (foreign-key violation, 23503).
	ErrInvalidReference = errors.New("turma ou aluno inválido")
	// ErrInvalidID is returned when an id (enrollment, class, student or reviewer) is
	// not a parseable UUID.
	ErrInvalidID = errors.New("identificador inválido")
)

// Service provides enrollment operations. It holds the pool because the review
// (approve/reject) path runs a multi-statement transaction.
type Service struct {
	pool *pgxpool.Pool
	q    *sqlcgen.Queries
	// now lets tests pin "today" for the window check; defaults to time.Now.
	now func() time.Time
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, q: sqlcgen.New(pool), now: time.Now}
}

// SubmitInput carries the validated public enrollment payload. Nil pointers for the
// nullable fields are stored as SQL NULL.
type SubmitInput struct {
	FullName           string
	BirthDate          pgtype.Date
	City               *string
	FirstCommunion     bool
	Confirmation       bool
	PreviousCatechism  *string
	ReligiousBooks     *string
	GuardianFatherName *string
	GuardianMotherName *string
	GuardianPhone      *string
	GuardianEmail      *string
	IsRenewal          bool
	PreviousName       *string
}

// Submit inserts a pending enrollment after validating the active year's enrollment
// window. No active year → ErrNoActiveYear; closed/unset window → ErrWindowClosed.
func (s *Service) Submit(ctx context.Context, in SubmitInput) (sqlcgen.Enrollment, error) {
	year, err := s.q.GetActiveEnrollmentYear(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlcgen.Enrollment{}, ErrNoActiveYear
	}
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	today := s.now().UTC().Format("2006-01-02")
	if !withinWindow(today, year.EnrollmentStartsAt, year.EnrollmentEndsAt) {
		return sqlcgen.Enrollment{}, ErrWindowClosed
	}
	return s.q.CreateEnrollment(ctx, sqlcgen.CreateEnrollmentParams{
		AcademicYearID:     year.ID,
		FullName:           in.FullName,
		BirthDate:          in.BirthDate,
		City:               in.City,
		FirstCommunion:     in.FirstCommunion,
		Confirmation:       in.Confirmation,
		PreviousCatechism:  in.PreviousCatechism,
		ReligiousBooks:     in.ReligiousBooks,
		GuardianFatherName: in.GuardianFatherName,
		GuardianMotherName: in.GuardianMotherName,
		GuardianPhone:      in.GuardianPhone,
		GuardianEmail:      in.GuardianEmail,
		IsRenewal:          in.IsRenewal,
		PreviousName:       in.PreviousName,
	})
}

// withinWindow reports whether today (YYYY-MM-DD) falls inside the [start, end]
// inclusive enrollment window. A null start or end means the window is not open.
// String comparison is valid because the format is zero-padded ISO date.
func withinWindow(today string, start, end pgtype.Date) bool {
	if !start.Valid || !end.Valid {
		return false
	}
	startStr := start.Time.Format("2006-01-02")
	endStr := end.Time.Format("2006-01-02")
	return today >= startStr && today <= endStr
}

// List returns the active year's enrollments of the given status, optionally filtered
// by a name substring (ILIKE). No active year → ErrNoActiveYear.
func (s *Service) List(ctx context.Context, status, q string) ([]sqlcgen.Enrollment, error) {
	year, err := s.q.GetActiveEnrollmentYear(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNoActiveYear
	}
	if err != nil {
		return nil, err
	}
	var qArg *string
	if q != "" {
		qArg = &q
	}
	return s.q.ListEnrollmentsByStatus(ctx, sqlcgen.ListEnrollmentsByStatusParams{
		AcademicYearID: year.ID,
		Status:         status,
		Q:              qArg,
	})
}

// Approve materializes the enrollment into a student and marks it approved. When
// existingStudentID is non-nil the existing student is overwritten and re-assigned;
// otherwise a new student is created in classID. The whole transition runs in one
// transaction. A non-pending enrollment yields ErrAlreadyReviewed; a missing
// enrollment ErrNotFound; a missing class/student ErrInvalidReference.
func (s *Service) Approve(ctx context.Context, enrollmentID, classID string, existingStudentID *string, reviewerID string) (sqlcgen.Enrollment, error) {
	enUUID, err := pgconv.ParseUUID(enrollmentID)
	if err != nil {
		return sqlcgen.Enrollment{}, ErrInvalidID
	}
	classUUID, err := pgconv.ParseUUID(classID)
	if err != nil {
		return sqlcgen.Enrollment{}, ErrInvalidID
	}
	reviewerUUID, err := pgconv.ParseUUID(reviewerID)
	if err != nil {
		return sqlcgen.Enrollment{}, ErrInvalidID
	}
	var studentUUID pgtype.UUID
	if existingStudentID != nil {
		studentUUID, err = pgconv.ParseUUID(*existingStudentID)
		if err != nil {
			return sqlcgen.Enrollment{}, ErrInvalidID
		}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.q.WithTx(tx)

	en, err := qtx.GetEnrollmentForUpdate(ctx, enUUID)
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlcgen.Enrollment{}, ErrNotFound
	}
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	if en.Status != "pending" {
		return sqlcgen.Enrollment{}, ErrAlreadyReviewed
	}

	var resolvedStudentID pgtype.UUID
	if existingStudentID != nil {
		resolvedStudentID, err = qtx.UpdateStudentFromEnrollment(ctx, sqlcgen.UpdateStudentFromEnrollmentParams{
			ID:                 studentUUID,
			ClassID:            classUUID,
			FullName:           en.FullName,
			BirthDate:          en.BirthDate,
			City:               en.City,
			FirstCommunion:     en.FirstCommunion,
			Confirmation:       en.Confirmation,
			PreviousCatechism:  en.PreviousCatechism,
			ReligiousBooks:     en.ReligiousBooks,
			GuardianFatherName: en.GuardianFatherName,
			GuardianMotherName: en.GuardianMotherName,
			GuardianPhone:      en.GuardianPhone,
			GuardianEmail:      en.GuardianEmail,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlcgen.Enrollment{}, ErrInvalidReference
		}
		if err != nil {
			return sqlcgen.Enrollment{}, mapFKError(err)
		}
	} else {
		resolvedStudentID, err = qtx.CreateStudentFromEnrollment(ctx, sqlcgen.CreateStudentFromEnrollmentParams{
			ClassID:            classUUID,
			FullName:           en.FullName,
			BirthDate:          en.BirthDate,
			City:               en.City,
			FirstCommunion:     en.FirstCommunion,
			Confirmation:       en.Confirmation,
			PreviousCatechism:  en.PreviousCatechism,
			ReligiousBooks:     en.ReligiousBooks,
			GuardianFatherName: en.GuardianFatherName,
			GuardianMotherName: en.GuardianMotherName,
			GuardianPhone:      en.GuardianPhone,
			GuardianEmail:      en.GuardianEmail,
		})
		if err != nil {
			return sqlcgen.Enrollment{}, mapFKError(err)
		}
	}

	approved, err := qtx.ApproveEnrollment(ctx, sqlcgen.ApproveEnrollmentParams{
		ID:                enUUID,
		ApprovedStudentID: resolvedStudentID,
		ApprovedClassID:   classUUID,
		ReviewedBy:        reviewerUUID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		// The row stopped being pending between the lock and the update — should not
		// happen under FOR UPDATE, but treat defensively as already reviewed.
		return sqlcgen.Enrollment{}, ErrAlreadyReviewed
	}
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return sqlcgen.Enrollment{}, err
	}
	return approved, nil
}

// Reject marks a pending enrollment rejected with an optional reason and the
// reviewer. A non-pending enrollment yields ErrAlreadyReviewed; a missing one
// ErrNotFound.
func (s *Service) Reject(ctx context.Context, enrollmentID string, reason *string, reviewerID string) (sqlcgen.Enrollment, error) {
	enUUID, err := pgconv.ParseUUID(enrollmentID)
	if err != nil {
		return sqlcgen.Enrollment{}, ErrInvalidID
	}
	reviewerUUID, err := pgconv.ParseUUID(reviewerID)
	if err != nil {
		return sqlcgen.Enrollment{}, ErrInvalidID
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.q.WithTx(tx)

	en, err := qtx.GetEnrollmentForUpdate(ctx, enUUID)
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlcgen.Enrollment{}, ErrNotFound
	}
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	if en.Status != "pending" {
		return sqlcgen.Enrollment{}, ErrAlreadyReviewed
	}

	rejected, err := qtx.RejectEnrollment(ctx, sqlcgen.RejectEnrollmentParams{
		ID:              enUUID,
		RejectionReason: reason,
		ReviewedBy:      reviewerUUID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlcgen.Enrollment{}, ErrAlreadyReviewed
	}
	if err != nil {
		return sqlcgen.Enrollment{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return sqlcgen.Enrollment{}, err
	}
	return rejected, nil
}

// mapFKError translates a Postgres foreign-key violation (23503) into the
// domain-level ErrInvalidReference, leaving other errors untouched.
func mapFKError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		return ErrInvalidReference
	}
	return err
}
