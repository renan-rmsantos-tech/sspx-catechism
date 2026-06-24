// Package authz centralizes the authorization rules that previously lived in
// Supabase RLS (private.is_coordinator / private.is_class_catechist). It is the
// single, testable place for the policy matrix: coordinators/admins see every
// class, catechists only the classes they are assigned to in class_catechists.
package authz

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

// Authorizer answers the per-request authorization questions. It replaces RLS:
// the coarse check uses the role in the JWT claims (no DB hit); the fine check
// consults class_catechists.
type Authorizer interface {
	// IsCoordinator reports whether the claims carry a privileged role
	// (coordinator or admin), mirroring private.is_coordinator().
	IsCoordinator(c auth.Claims) bool
	// CanAccessClass reports whether the user may access the given class:
	// coordinators/admins always may; a catechist only if assigned to it.
	// The error is non-nil only on a lookup failure (→ 500), never on a plain
	// denial (which is reported as false, nil → 403).
	CanAccessClass(ctx context.Context, c auth.Claims, classID string) (bool, error)
}

// ClassCatechistRepo is the data dependency of the authorizer: the subset of the
// generated queries it needs. Declared as an interface so unit tests can cover
// the whole permission matrix with a fake instead of a real database.
type ClassCatechistRepo interface {
	IsClassCatechist(ctx context.Context, arg sqlcgen.IsClassCatechistParams) (bool, error)
}

// SQLAuthorizer implements Authorizer over the sqlc-generated queries.
type SQLAuthorizer struct {
	repo ClassCatechistRepo
}

// New builds an Authorizer backed by the given repository. Pass *sqlcgen.Queries
// (which satisfies ClassCatechistRepo) in production, a fake in tests.
func New(repo ClassCatechistRepo) *SQLAuthorizer {
	return &SQLAuthorizer{repo: repo}
}

// privileged roles get unconditional class access.
func isPrivileged(role string) bool {
	return role == "coordinator" || role == "admin"
}

func (a *SQLAuthorizer) IsCoordinator(c auth.Claims) bool {
	return isPrivileged(c.Role)
}

func (a *SQLAuthorizer) CanAccessClass(ctx context.Context, c auth.Claims, classID string) (bool, error) {
	// Coarse check first: coordinators/admins short-circuit without a DB hit.
	if isPrivileged(c.Role) {
		return true, nil
	}
	classUUID, err := pgconv.ParseUUID(classID)
	if err != nil {
		return false, err
	}
	catechistUUID, err := pgconv.ParseUUID(c.UserID())
	if err != nil {
		return false, err
	}
	return a.repo.IsClassCatechist(ctx, sqlcgen.IsClassCatechistParams{
		ClassID:     classUUID,
		CatechistID: catechistUUID,
	})
}

// RequireClassAccess builds middleware that authorizes access to the class named
// by the given chi path parameter (e.g. "id" for /classes/{id}/...). It must run
// after httpx.RequireAuth so claims are present. Denials map to 403 and lookup
// errors to 500, per the authorization contract.
func RequireClassAccess(a Authorizer, param string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := httpx.ClaimsFrom(r.Context())
			if !ok {
				httpx.Error(w, http.StatusUnauthorized, "não autenticado")
				return
			}
			classID := chi.URLParam(r, param)
			allowed, err := a.CanAccessClass(r.Context(), *claims, classID)
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "erro ao verificar acesso à turma")
				return
			}
			if !allowed {
				httpx.Error(w, http.StatusForbidden, "acesso restrito à turma")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
