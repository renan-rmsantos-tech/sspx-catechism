// Package classes implements class management and the class_catechists link
// (CRUD plus per-catechist read scope), replacing the former Supabase-backed
// class actions and the RLS that limited a catechist to their own classes.
package classes

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

var (
	// ErrNotFound is returned when the class id does not exist.
	ErrNotFound = errors.New("turma não encontrada")
	// ErrInvalidReference is returned when a referenced academic year or
	// catechist does not exist (foreign-key violation, 23503).
	ErrInvalidReference = errors.New("ano letivo ou catequista inválido")
	// ErrInvalidID is returned when an id (class, academic year or catechist) is
	// not a parseable UUID.
	ErrInvalidID = errors.New("identificador inválido")
)

// Service provides class operations over the database. It holds the pool (not
// just a DBTX) because creating/replacing the catechist set runs in a pgx
// transaction.
type Service struct {
	pool *pgxpool.Pool
	q    *sqlcgen.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, q: sqlcgen.New(pool)}
}

// ClassWithCatechists is a class row plus the ids of its assigned catechists.
type ClassWithCatechists struct {
	Class        sqlcgen.Class
	CatechistIDs []string
}

// List returns classes visible to the caller: coordinators/admins see every
// class; a catechist sees only the classes they are assigned to. This reproduces
// the per-role visibility that RLS used to enforce.
func (s *Service) List(ctx context.Context, c auth.Claims) ([]ClassWithCatechists, error) {
	if c.Role == "coordinator" || c.Role == "admin" {
		rows, err := s.q.ListClasses(ctx)
		if err != nil {
			return nil, err
		}
		out := make([]ClassWithCatechists, 0, len(rows))
		for _, r := range rows {
			out = append(out, ClassWithCatechists{
				Class:        classFromRow(r.ID, r.AcademicYearID, r.Name, r.Level, r.Schedule, r.IsArchived, r.CreatedAt),
				CatechistIDs: uuidStrings(r.CatechistIds),
			})
		}
		return out, nil
	}

	catechistUUID, err := pgconv.ParseUUID(c.UserID())
	if err != nil {
		return nil, ErrInvalidID
	}
	rows, err := s.q.ListClassesForCatechist(ctx, catechistUUID)
	if err != nil {
		return nil, err
	}
	out := make([]ClassWithCatechists, 0, len(rows))
	for _, r := range rows {
		out = append(out, ClassWithCatechists{
			Class:        classFromRow(r.ID, r.AcademicYearID, r.Name, r.Level, r.Schedule, r.IsArchived, r.CreatedAt),
			CatechistIDs: uuidStrings(r.CatechistIds),
		})
	}
	return out, nil
}

// CreateInput carries the validated payload for creating a class.
type CreateInput struct {
	Name           string
	AcademicYearID string
	Level          *string
	Schedule       *string
	CatechistIDs   []string
}

// Create inserts a class and its catechist assignments atomically. A missing
// academic year or catechist (FK violation) yields ErrInvalidReference.
func (s *Service) Create(ctx context.Context, in CreateInput) (ClassWithCatechists, error) {
	ayUUID, err := pgconv.ParseUUID(in.AcademicYearID)
	if err != nil {
		return ClassWithCatechists{}, ErrInvalidID
	}
	catUUIDs, ids, err := parseCatechistIDs(in.CatechistIDs)
	if err != nil {
		return ClassWithCatechists{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return ClassWithCatechists{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.q.WithTx(tx)

	cls, err := qtx.CreateClass(ctx, sqlcgen.CreateClassParams{
		AcademicYearID: ayUUID,
		Name:           in.Name,
		Level:          in.Level,
		Schedule:       in.Schedule,
	})
	if err != nil {
		return ClassWithCatechists{}, mapFKError(err)
	}
	if err := addCatechists(ctx, qtx, cls.ID, catUUIDs); err != nil {
		return ClassWithCatechists{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return ClassWithCatechists{}, err
	}
	return ClassWithCatechists{Class: cls, CatechistIDs: ids}, nil
}

// UpdateInput carries a partial update. Nil pointers mean "leave unchanged".
// When ReplaceCatechists is true the assignment set is replaced wholesale with
// CatechistIDs (an empty slice clears it); when false the assignments are left
// untouched.
type UpdateInput struct {
	Name              *string
	AcademicYearID    *string
	Level             *string
	Schedule          *string
	IsArchived        *bool
	ReplaceCatechists bool
	CatechistIDs      []string
}

// Update applies a partial update and (optionally) replaces the catechist set,
// atomically. A missing id yields ErrNotFound.
func (s *Service) Update(ctx context.Context, id string, in UpdateInput) (ClassWithCatechists, error) {
	classUUID, err := pgconv.ParseUUID(id)
	if err != nil {
		return ClassWithCatechists{}, ErrNotFound
	}
	params := sqlcgen.UpdateClassParams{
		ID:         classUUID,
		Name:       in.Name,
		Level:      in.Level,
		Schedule:   in.Schedule,
		IsArchived: in.IsArchived,
	}
	if in.AcademicYearID != nil {
		ayUUID, err := pgconv.ParseUUID(*in.AcademicYearID)
		if err != nil {
			return ClassWithCatechists{}, ErrInvalidID
		}
		params.AcademicYearID = ayUUID
	}

	var catUUIDs []pgtype.UUID
	var ids []string
	if in.ReplaceCatechists {
		catUUIDs, ids, err = parseCatechistIDs(in.CatechistIDs)
		if err != nil {
			return ClassWithCatechists{}, err
		}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return ClassWithCatechists{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.q.WithTx(tx)

	cls, err := qtx.UpdateClass(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return ClassWithCatechists{}, ErrNotFound
	}
	if err != nil {
		return ClassWithCatechists{}, mapFKError(err)
	}

	if in.ReplaceCatechists {
		if err := qtx.DeleteClassCatechists(ctx, classUUID); err != nil {
			return ClassWithCatechists{}, err
		}
		if err := addCatechists(ctx, qtx, classUUID, catUUIDs); err != nil {
			return ClassWithCatechists{}, err
		}
	} else {
		current, err := qtx.ListClassCatechistIDs(ctx, classUUID)
		if err != nil {
			return ClassWithCatechists{}, err
		}
		ids = uuidStrings(current)
	}

	if err := tx.Commit(ctx); err != nil {
		return ClassWithCatechists{}, err
	}
	return ClassWithCatechists{Class: cls, CatechistIDs: ids}, nil
}

// ListStudents returns the active students of a class, ordered by name. Access
// control (CanAccessClass) is enforced by the route middleware before this runs.
func (s *Service) ListStudents(ctx context.Context, classID string) ([]sqlcgen.Student, error) {
	classUUID, err := pgconv.ParseUUID(classID)
	if err != nil {
		return nil, ErrInvalidID
	}
	return s.q.ListStudentsByClass(ctx, classUUID)
}

// addCatechists inserts each assignment for the class within the given queries
// (typically a transaction). A FK violation (missing catechist) maps to
// ErrInvalidReference.
func addCatechists(ctx context.Context, q *sqlcgen.Queries, classID pgtype.UUID, catUUIDs []pgtype.UUID) error {
	for _, cu := range catUUIDs {
		if err := q.AddClassCatechist(ctx, sqlcgen.AddClassCatechistParams{
			ClassID:     classID,
			CatechistID: cu,
		}); err != nil {
			return mapFKError(err)
		}
	}
	return nil
}

// parseCatechistIDs parses and de-duplicates catechist id strings, returning both
// the pgtype.UUID values (for inserts) and their canonical string forms (for the
// response). Duplicates are dropped so they cannot trip the PK unique constraint.
func parseCatechistIDs(in []string) ([]pgtype.UUID, []string, error) {
	uuids := make([]pgtype.UUID, 0, len(in))
	strs := make([]string, 0, len(in))
	seen := make(map[string]struct{}, len(in))
	for _, raw := range in {
		u, err := pgconv.ParseUUID(raw)
		if err != nil {
			return nil, nil, ErrInvalidID
		}
		canon := pgconv.UUIDString(u)
		if _, dup := seen[canon]; dup {
			continue
		}
		seen[canon] = struct{}{}
		uuids = append(uuids, u)
		strs = append(strs, canon)
	}
	return uuids, strs, nil
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

func classFromRow(id, ayID pgtype.UUID, name string, level, schedule *string, isArchived bool, createdAt pgtype.Timestamptz) sqlcgen.Class {
	return sqlcgen.Class{
		ID:             id,
		AcademicYearID: ayID,
		Name:           name,
		Level:          level,
		Schedule:       schedule,
		IsArchived:     isArchived,
		CreatedAt:      createdAt,
	}
}

func uuidStrings(in []pgtype.UUID) []string {
	out := make([]string, 0, len(in))
	for _, u := range in {
		out = append(out, pgconv.UUIDString(u))
	}
	return out
}
