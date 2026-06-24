// Package students implements student management (search, detail, create and
// update including class transfer), replacing the former Supabase-backed student
// routes and Server Actions. Access is coordinator-only, enforced by the route
// middleware before any of these methods run.
package students

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
	// ErrNotFound is returned when the student id does not exist.
	ErrNotFound = errors.New("aluno não encontrado")
	// ErrInvalidReference is returned when the referenced class does not exist
	// (foreign-key violation, 23503).
	ErrInvalidReference = errors.New("turma inválida")
	// ErrInvalidID is returned when an id (student or class) is not a parseable
	// UUID.
	ErrInvalidID = errors.New("identificador inválido")
)

// Service provides student operations over the database.
type Service struct {
	q *sqlcgen.Queries
}

func NewService(db sqlcgen.DBTX) *Service {
	return &Service{q: sqlcgen.New(db)}
}

// StudentWithClass is a student row plus the joined name of its class.
type StudentWithClass struct {
	Student   sqlcgen.Student
	ClassName string
}

// Search returns students ordered by name, optionally filtered by a name
// substring (ILIKE). An empty query returns every student. The class name is
// joined into each row.
func (s *Service) Search(ctx context.Context, q string) ([]StudentWithClass, error) {
	var arg *string
	if q != "" {
		arg = &q
	}
	rows, err := s.q.SearchStudents(ctx, arg)
	if err != nil {
		return nil, err
	}
	out := make([]StudentWithClass, 0, len(rows))
	for _, r := range rows {
		out = append(out, StudentWithClass{Student: r.Student, ClassName: r.ClassName})
	}
	return out, nil
}

// Get returns a single student with its class name. A missing id (or an
// unparseable one) yields ErrNotFound.
func (s *Service) Get(ctx context.Context, id string) (StudentWithClass, error) {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return StudentWithClass{}, ErrNotFound
	}
	row, err := s.q.GetStudent(ctx, uid)
	if errors.Is(err, pgx.ErrNoRows) {
		return StudentWithClass{}, ErrNotFound
	}
	if err != nil {
		return StudentWithClass{}, err
	}
	return StudentWithClass{Student: row.Student, ClassName: row.ClassName}, nil
}

// CreateInput carries the validated payload for creating a student. Nil pointers
// for the nullable fields are stored as SQL NULL.
type CreateInput struct {
	ClassID            string
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
}

// Create inserts a student. A non-UUID class id yields ErrInvalidID; a missing
// class (FK violation) yields ErrInvalidReference.
func (s *Service) Create(ctx context.Context, in CreateInput) (sqlcgen.Student, error) {
	classUUID, err := pgconv.ParseUUID(in.ClassID)
	if err != nil {
		return sqlcgen.Student{}, ErrInvalidID
	}
	st, err := s.q.CreateStudent(ctx, sqlcgen.CreateStudentParams{
		ClassID:            classUUID,
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
	})
	if err != nil {
		return sqlcgen.Student{}, mapFKError(err)
	}
	return st, nil
}

// UpdateInput carries a partial update. Pointers are nil for "leave unchanged".
// The nullable fields are tri-state: SetX=false leaves the column untouched,
// SetX=true writes the (possibly nil → SQL NULL) value verbatim.
type UpdateInput struct {
	ClassID        *string
	FullName       *string
	FirstCommunion *bool
	Confirmation   *bool

	SetBirthDate bool
	BirthDate    pgtype.Date

	SetCity bool
	City    *string

	SetPreviousCatechism bool
	PreviousCatechism    *string

	SetReligiousBooks bool
	ReligiousBooks    *string

	SetGuardianFatherName bool
	GuardianFatherName    *string

	SetGuardianMotherName bool
	GuardianMotherName    *string

	SetGuardianPhone bool
	GuardianPhone    *string

	SetGuardianEmail bool
	GuardianEmail    *string
}

// Update applies a partial update and returns the updated row. A missing id
// yields ErrNotFound; transferring to a missing class (FK violation) yields
// ErrInvalidReference; a non-UUID class id yields ErrInvalidID.
func (s *Service) Update(ctx context.Context, id string, in UpdateInput) (sqlcgen.Student, error) {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return sqlcgen.Student{}, ErrNotFound
	}
	params := sqlcgen.UpdateStudentParams{
		ID:             uid,
		FullName:       in.FullName,
		FirstCommunion: in.FirstCommunion,
		Confirmation:   in.Confirmation,

		SetBirthDate: in.SetBirthDate,
		BirthDate:    in.BirthDate,

		SetCity: in.SetCity,
		City:    in.City,

		SetPreviousCatechism: in.SetPreviousCatechism,
		PreviousCatechism:    in.PreviousCatechism,

		SetReligiousBooks: in.SetReligiousBooks,
		ReligiousBooks:    in.ReligiousBooks,

		SetGuardianFatherName: in.SetGuardianFatherName,
		GuardianFatherName:    in.GuardianFatherName,

		SetGuardianMotherName: in.SetGuardianMotherName,
		GuardianMotherName:    in.GuardianMotherName,

		SetGuardianPhone: in.SetGuardianPhone,
		GuardianPhone:    in.GuardianPhone,

		SetGuardianEmail: in.SetGuardianEmail,
		GuardianEmail:    in.GuardianEmail,
	}
	if in.ClassID != nil {
		classUUID, err := pgconv.ParseUUID(*in.ClassID)
		if err != nil {
			return sqlcgen.Student{}, ErrInvalidID
		}
		params.ClassID = classUUID
	}

	st, err := s.q.UpdateStudent(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlcgen.Student{}, ErrNotFound
	}
	if err != nil {
		return sqlcgen.Student{}, mapFKError(err)
	}
	return st, nil
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
