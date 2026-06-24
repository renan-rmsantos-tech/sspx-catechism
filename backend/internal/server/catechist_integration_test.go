package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/config"
	"github.com/rmtech/sspx-catechism/backend/internal/database"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
)

// catechistTestEnv wires the full router against a real Postgres so the
// coordinator gate, the protected-admin guard and the role/active updates are
// exercised end to end.
type catechistTestEnv struct {
	t       *testing.T
	handler http.Handler
	jwt     *auth.Manager
	pool    *pgxpool.Pool

	adminID     string
	catechistID string
}

func setupCatechistEnv(t *testing.T) *catechistTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run catechist integration tests")
	}
	if err := database.Migrate(url); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	if _, err := pool.Exec(ctx, `TRUNCATE profiles RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	env := &catechistTestEnv{}
	for _, p := range []struct {
		fullName string
		email    string
		role     string
		dst      *string
	}{
		{"Administrador", "admin@example.com", "admin", &env.adminID},
		{"Catequista Um", "cat1@example.com", "catechist", &env.catechistID},
	} {
		if err := pool.QueryRow(ctx,
			`INSERT INTO profiles (email, password_hash, full_name, role, must_change_password)
			 VALUES ($1, 'x', $2, $3, false) RETURNING id`, p.email, p.fullName, p.role).
			Scan(p.dst); err != nil {
			t.Fatalf("seed %s: %v", p.email, err)
		}
	}

	jwt := auth.NewManager("test-secret", time.Hour)
	srv := New(config.Config{Env: "development"}, pool, jwt)
	env.t = t
	env.handler = srv.Router()
	env.jwt = jwt
	env.pool = pool
	return env
}

func (e *catechistTestEnv) do(method, path, role, body string) *httptest.ResponseRecorder {
	e.t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	if role != "" {
		token, err := e.jwt.Issue("00000000-0000-0000-0000-0000000000aa", role, time.Now())
		if err != nil {
			e.t.Fatalf("issue token: %v", err)
		}
		r.AddCookie(&http.Cookie{Name: httpx.SessionCookie, Value: token})
	}
	w := httptest.NewRecorder()
	e.handler.ServeHTTP(w, r)
	return w
}

func (e *catechistTestEnv) roleOf(id string) string {
	e.t.Helper()
	var role string
	if err := e.pool.QueryRow(context.Background(),
		`SELECT role FROM profiles WHERE id = $1`, id).Scan(&role); err != nil {
		e.t.Fatalf("read role: %v", err)
	}
	return role
}

func decodeCatechist(t *testing.T, w *httptest.ResponseRecorder) catechistResponse {
	t.Helper()
	var c catechistResponse
	if err := json.Unmarshal(w.Body.Bytes(), &c); err != nil {
		t.Fatalf("decode: %v (body=%q)", err, w.Body.String())
	}
	return c
}

func TestCatechistUpdateGates(t *testing.T) {
	e := setupCatechistEnv(t)

	if w := e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "", `{"isActive":false}`); w.Code != http.StatusUnauthorized {
		t.Fatalf("PATCH without auth: status = %d, want 401", w.Code)
	}
	if w := e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "catechist", `{"isActive":false}`); w.Code != http.StatusForbidden {
		t.Fatalf("PATCH as catechist: status = %d, want 403", w.Code)
	}
}

func TestCatechistPromoteAndToggleActive(t *testing.T) {
	e := setupCatechistEnv(t)

	// Promote to coordinator.
	w := e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "coordinator", `{"role":"coordinator"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("promote: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if got := e.roleOf(e.catechistID); got != "coordinator" {
		t.Fatalf("role = %q, want coordinator", got)
	}

	// Demote back to catechist.
	if w := e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "coordinator", `{"role":"catechist"}`); w.Code != http.StatusOK {
		t.Fatalf("demote: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if got := e.roleOf(e.catechistID); got != "catechist" {
		t.Fatalf("role = %q, want catechist", got)
	}

	// Deactivate.
	w = e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "coordinator", `{"isActive":false}`)
	if w.Code != http.StatusOK {
		t.Fatalf("deactivate: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if c := decodeCatechist(t, w); c.IsActive {
		t.Fatal("isActive should be false after deactivate")
	}

	// Reactivate.
	w = e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "coordinator", `{"isActive":true}`)
	if w.Code != http.StatusOK {
		t.Fatalf("reactivate: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if c := decodeCatechist(t, w); !c.IsActive {
		t.Fatal("isActive should be true after reactivate")
	}
}

func TestCatechistAdminProtected(t *testing.T) {
	e := setupCatechistEnv(t)

	// The protected admin can neither be demoted nor deactivated.
	for _, body := range []string{`{"role":"catechist"}`, `{"isActive":false}`} {
		if w := e.do(http.MethodPatch, "/api/catechists/"+e.adminID, "coordinator", body); w.Code != http.StatusConflict {
			t.Fatalf("PATCH admin %s: status = %d, want 409 (body=%q)", body, w.Code, w.Body.String())
		}
	}
	if got := e.roleOf(e.adminID); got != "admin" {
		t.Fatalf("admin role changed to %q, want admin", got)
	}
}

func TestCatechistUpdateErrors(t *testing.T) {
	e := setupCatechistEnv(t)

	// Invalid role → 400.
	if w := e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "coordinator", `{"role":"superuser"}`); w.Code != http.StatusBadRequest {
		t.Fatalf("invalid role: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}
	// Promoting to admin is not allowed here → 400.
	if w := e.do(http.MethodPatch, "/api/catechists/"+e.catechistID, "coordinator", `{"role":"admin"}`); w.Code != http.StatusBadRequest {
		t.Fatalf("role=admin: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}
	// Unknown id → 404.
	missing := "00000000-0000-0000-0000-0000000000ee"
	if w := e.do(http.MethodPatch, "/api/catechists/"+missing, "coordinator", `{"isActive":false}`); w.Code != http.StatusNotFound {
		t.Fatalf("missing id: status = %d, want 404 (body=%q)", w.Code, w.Body.String())
	}
}
