package authz_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/authz"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
)

// fakeRepo is a stub ClassCatechistRepo. member controls the membership answer;
// err forces a lookup failure; called records whether the DB was consulted.
type fakeRepo struct {
	member bool
	err    error
	called bool
}

func (f *fakeRepo) IsClassCatechist(_ context.Context, _ sqlcgen.IsClassCatechistParams) (bool, error) {
	f.called = true
	return f.member, f.err
}

func claims(role, userID string) auth.Claims {
	c := auth.Claims{Role: role}
	c.Subject = userID
	return c
}

// A valid catechist UUID used across cases (lenient parser accepts dashed hex).
const catechistID = "11111111-1111-1111-1111-111111111111"
const classID = "22222222-2222-2222-2222-222222222222"

func TestIsCoordinator(t *testing.T) {
	a := authz.New(&fakeRepo{})
	cases := []struct {
		role string
		want bool
	}{
		{"coordinator", true},
		{"admin", true},
		{"catechist", false},
		{"", false},
	}
	for _, c := range cases {
		if got := a.IsCoordinator(claims(c.role, catechistID)); got != c.want {
			t.Errorf("IsCoordinator(%q) = %v, want %v", c.role, got, c.want)
		}
	}
}

func TestCanAccessClass(t *testing.T) {
	t.Run("coordinator accesses any class without a DB hit", func(t *testing.T) {
		repo := &fakeRepo{err: errors.New("must not be called")}
		ok, err := authz.New(repo).CanAccessClass(context.Background(), claims("coordinator", catechistID), classID)
		if err != nil || !ok {
			t.Fatalf("got (%v, %v), want (true, nil)", ok, err)
		}
		if repo.called {
			t.Error("coordinator should short-circuit before consulting the repo")
		}
	})

	t.Run("admin accesses any class without a DB hit", func(t *testing.T) {
		repo := &fakeRepo{err: errors.New("must not be called")}
		ok, err := authz.New(repo).CanAccessClass(context.Background(), claims("admin", catechistID), classID)
		if err != nil || !ok {
			t.Fatalf("got (%v, %v), want (true, nil)", ok, err)
		}
		if repo.called {
			t.Error("admin should short-circuit before consulting the repo")
		}
	})

	t.Run("catechist of the class is allowed", func(t *testing.T) {
		repo := &fakeRepo{member: true}
		ok, err := authz.New(repo).CanAccessClass(context.Background(), claims("catechist", catechistID), classID)
		if err != nil || !ok {
			t.Fatalf("got (%v, %v), want (true, nil)", ok, err)
		}
		if !repo.called {
			t.Error("catechist access must consult class_catechists")
		}
	})

	t.Run("catechist of another class is denied", func(t *testing.T) {
		repo := &fakeRepo{member: false}
		ok, err := authz.New(repo).CanAccessClass(context.Background(), claims("catechist", catechistID), classID)
		if err != nil || ok {
			t.Fatalf("got (%v, %v), want (false, nil)", ok, err)
		}
	})

	t.Run("lookup error propagates", func(t *testing.T) {
		repo := &fakeRepo{err: errors.New("db down")}
		ok, err := authz.New(repo).CanAccessClass(context.Background(), claims("catechist", catechistID), classID)
		if err == nil || ok {
			t.Fatalf("got (%v, %v), want (false, error)", ok, err)
		}
	})

	t.Run("malformed class id yields error", func(t *testing.T) {
		repo := &fakeRepo{}
		ok, err := authz.New(repo).CanAccessClass(context.Background(), claims("catechist", catechistID), "not-a-uuid")
		if err == nil || ok {
			t.Fatalf("got (%v, %v), want (false, error)", ok, err)
		}
	})
}

// stubAuthorizer drives RequireClassAccess without a repo.
type stubAuthorizer struct {
	allow bool
	err   error
}

func (s stubAuthorizer) IsCoordinator(auth.Claims) bool { return false }
func (s stubAuthorizer) CanAccessClass(context.Context, auth.Claims, string) (bool, error) {
	return s.allow, s.err
}

func TestRequireClassAccess(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// withClaims wraps a handler with a router that injects claims into the
	// context (as RequireAuth would) and binds the {id} path param.
	serve := func(a authz.Authorizer, withClaims bool) int {
		r := chi.NewRouter()
		r.Use(func(h http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				if withClaims {
					c := claims("catechist", catechistID)
					req = req.WithContext(httpx.WithClaims(req.Context(), &c))
				}
				h.ServeHTTP(w, req)
			})
		})
		r.With(authz.RequireClassAccess(a, "id")).Get("/classes/{id}", next.ServeHTTP)

		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/classes/"+classID, nil))
		return rec.Code
	}

	t.Run("allowed → next handler", func(t *testing.T) {
		if got := serve(stubAuthorizer{allow: true}, true); got != http.StatusOK {
			t.Errorf("got %d, want 200", got)
		}
	})
	t.Run("denied → 403", func(t *testing.T) {
		if got := serve(stubAuthorizer{allow: false}, true); got != http.StatusForbidden {
			t.Errorf("got %d, want 403", got)
		}
	})
	t.Run("lookup error → 500", func(t *testing.T) {
		if got := serve(stubAuthorizer{err: errors.New("boom")}, true); got != http.StatusInternalServerError {
			t.Errorf("got %d, want 500", got)
		}
	})
	t.Run("missing claims → 401", func(t *testing.T) {
		if got := serve(stubAuthorizer{allow: true}, false); got != http.StatusUnauthorized {
			t.Errorf("got %d, want 401", got)
		}
	})
}
