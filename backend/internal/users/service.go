// Package users implements authentication and catechist/coordinator management,
// replacing Supabase Auth with a self-hosted Go implementation.
package users

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

var (
	ErrInvalidCredentials = errors.New("credenciais inválidas")
	ErrInactive           = errors.New("usuário inativo")
	ErrProtectedAdmin     = errors.New("não é possível remover um administrador")
	ErrHasSessions        = errors.New("catequista possui chamadas registradas")
	ErrInvalidRole        = errors.New("papel inválido")
	ErrAdminImmutable     = errors.New("não é possível alterar o administrador")
	ErrInvalidID          = errors.New("identificador inválido")
)

// Service provides user/auth operations over the database.
type Service struct {
	q *sqlcgen.Queries
}

func NewService(db sqlcgen.DBTX) *Service {
	return &Service{q: sqlcgen.New(db)}
}

// Authenticate verifies email/password and returns the profile on success.
func (s *Service) Authenticate(ctx context.Context, email, password string) (sqlcgen.Profile, error) {
	p, err := s.q.GetProfileByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return p, ErrInvalidCredentials
		}
		return p, err
	}
	if !auth.VerifyPassword(p.PasswordHash, password) {
		return p, ErrInvalidCredentials
	}
	if !p.IsActive {
		return p, ErrInactive
	}
	return p, nil
}

// ProfileByID returns a profile by id string.
func (s *Service) ProfileByID(ctx context.Context, id string) (sqlcgen.Profile, error) {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return sqlcgen.Profile{}, ErrInvalidCredentials
	}
	return s.q.GetProfileByID(ctx, uid)
}

// ChangePassword sets a new password and clears the must_change_password flag.
func (s *Service) ChangePassword(ctx context.Context, id string, newPassword string) error {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return err
	}
	hash, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}
	return s.q.UpdatePassword(ctx, sqlcgen.UpdatePasswordParams{
		ID:                 uid,
		PasswordHash:       hash,
		MustChangePassword: false,
	})
}

// CreateCatechist creates a catechist with a generated password (returned once
// in plaintext) and must_change_password=true.
func (s *Service) CreateCatechist(ctx context.Context, email, fullName string) (string, sqlcgen.Profile, error) {
	plain := auth.GeneratePassword()
	hash, err := auth.HashPassword(plain)
	if err != nil {
		return "", sqlcgen.Profile{}, err
	}
	p, err := s.q.CreateProfile(ctx, sqlcgen.CreateProfileParams{
		Email:              email,
		PasswordHash:       hash,
		FullName:           fullName,
		Role:               "catechist",
		MustChangePassword: true,
	})
	if err != nil {
		return "", sqlcgen.Profile{}, err
	}
	return plain, p, nil
}

// ListCatechists returns all catechist profiles.
func (s *Service) ListCatechists(ctx context.Context) ([]sqlcgen.Profile, error) {
	return s.q.ListCatechists(ctx)
}

// UpdateCatechist changes a catechist's role and/or active flag and returns the
// updated profile. Role, when provided, must be "coordinator" or "catechist"
// (promote/demote); promoting to "admin" is not allowed here. The protected
// admin cannot be altered at all. Reuses the SetRole/SetActive queries.
func (s *Service) UpdateCatechist(ctx context.Context, id string, role *string, isActive *bool) (sqlcgen.Profile, error) {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return sqlcgen.Profile{}, ErrInvalidID
	}
	p, err := s.q.GetProfileByID(ctx, uid)
	if err != nil {
		return sqlcgen.Profile{}, err
	}
	if p.Role == "admin" {
		return sqlcgen.Profile{}, ErrAdminImmutable
	}
	if role != nil {
		if *role != "coordinator" && *role != "catechist" {
			return sqlcgen.Profile{}, ErrInvalidRole
		}
		if err := s.q.SetRole(ctx, sqlcgen.SetRoleParams{ID: uid, Role: *role}); err != nil {
			return sqlcgen.Profile{}, err
		}
	}
	if isActive != nil {
		if err := s.q.SetActive(ctx, sqlcgen.SetActiveParams{ID: uid, IsActive: *isActive}); err != nil {
			return sqlcgen.Profile{}, err
		}
	}
	return s.q.GetProfileByID(ctx, uid)
}

// DeleteCatechist removes a catechist, guarding admins and those with sessions.
func (s *Service) DeleteCatechist(ctx context.Context, id string) error {
	uid, err := pgconv.ParseUUID(id)
	if err != nil {
		return err
	}
	p, err := s.q.GetProfileByID(ctx, uid)
	if err != nil {
		return err
	}
	if p.Role == "admin" {
		return ErrProtectedAdmin
	}
	n, err := s.q.CountSessionsByCatechist(ctx, uid)
	if err != nil {
		return err
	}
	if n > 0 {
		return ErrHasSessions
	}
	return s.q.DeleteProfile(ctx, uid)
}

// BootstrapAdmin idempotently ensures an admin account exists with the given
// credentials. Runs on startup, replacing the old instrumentation.ts seeding.
func (s *Service) BootstrapAdmin(ctx context.Context, email, password string) error {
	if email == "" || password == "" {
		return nil // nothing to seed
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}
	_, err = s.q.GetProfileByEmail(ctx, email)
	if err == nil {
		// Exists → ensure admin role + refresh password.
		_, err = s.q.UpdateAdminCredentials(ctx, sqlcgen.UpdateAdminCredentialsParams{
			Email:        email,
			PasswordHash: hash,
		})
		return err
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("lookup admin: %w", err)
	}
	_, err = s.q.CreateProfile(ctx, sqlcgen.CreateProfileParams{
		Email:              email,
		PasswordHash:       hash,
		FullName:           "Administrador",
		Role:               "admin",
		MustChangePassword: false,
	})
	return err
}
