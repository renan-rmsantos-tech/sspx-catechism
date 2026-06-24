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

// academicYearTestEnv wires a full router (auth middleware included) against a
// real Postgres so CRUD and the coordinator/auth gates are exercised end to end.
type academicYearTestEnv struct {
	t       *testing.T
	handler http.Handler
	jwt     *auth.Manager
	pool    *pgxpool.Pool
}

func setupAcademicYearEnv(t *testing.T) *academicYearTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run academic-year integration tests")
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
	if _, err := pool.Exec(ctx,
		`TRUNCATE classes, academic_years RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	jwt := auth.NewManager("test-secret", time.Hour)
	srv := New(config.Config{Env: "development"}, pool, jwt)
	return &academicYearTestEnv{t: t, handler: srv.Router(), jwt: jwt, pool: pool}
}

// do issues a request as the given role ("" means no session cookie).
func (e *academicYearTestEnv) do(method, path, role, body string) *httptest.ResponseRecorder {
	e.t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	if role != "" {
		token, err := e.jwt.Issue("00000000-0000-0000-0000-000000000001", role, time.Now())
		if err != nil {
			e.t.Fatalf("issue token: %v", err)
		}
		r.AddCookie(&http.Cookie{Name: httpx.SessionCookie, Value: token})
	}
	w := httptest.NewRecorder()
	e.handler.ServeHTTP(w, r)
	return w
}

func decodeYear(t *testing.T, w *httptest.ResponseRecorder) academicYearResponse {
	t.Helper()
	var y academicYearResponse
	if err := json.Unmarshal(w.Body.Bytes(), &y); err != nil {
		t.Fatalf("decode: %v (body=%q)", err, w.Body.String())
	}
	return y
}

func TestAcademicYearGates(t *testing.T) {
	e := setupAcademicYearEnv(t)

	if w := e.do(http.MethodGet, "/api/academic-years", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("GET without auth: status = %d, want 401", w.Code)
	}
	// Listing is open to any authenticated user (e.g. a catechist).
	if w := e.do(http.MethodGet, "/api/academic-years", "catechist", ""); w.Code != http.StatusOK {
		t.Fatalf("GET as catechist: status = %d, want 200", w.Code)
	}
	// Writes require coordinator/admin.
	if w := e.do(http.MethodPost, "/api/academic-years", "catechist", `{"year":2030}`); w.Code != http.StatusForbidden {
		t.Fatalf("POST as catechist: status = %d, want 403", w.Code)
	}
}

func TestAcademicYearCRUD(t *testing.T) {
	e := setupAcademicYearEnv(t)

	// Create with defaults (classDays omitted → [6]).
	w := e.do(http.MethodPost, "/api/academic-years", "coordinator", `{"year":2026,"isActive":true}`)
	if w.Code != http.StatusCreated {
		t.Fatalf("create: status = %d, want 201 (body=%q)", w.Code, w.Body.String())
	}
	created := decodeYear(t, w)
	if created.Year != 2026 || !created.IsActive || len(created.ClassDays) != 1 || created.ClassDays[0] != 6 {
		t.Fatalf("unexpected created year: %+v", created)
	}
	if created.EnrollmentStartsAt != nil || created.EnrollmentEndsAt != nil {
		t.Fatalf("expected null enrollment window, got %+v", created)
	}

	// Create with enrollment window in one POST.
	w = e.do(http.MethodPost, "/api/academic-years", "coordinator",
		`{"year":2027,"isActive":false,"classDays":[0],"enrollmentStartsAt":"2026-06-22","enrollmentEndsAt":"2026-06-26"}`)
	if w.Code != http.StatusCreated {
		t.Fatalf("create with window: status = %d, want 201 (body=%q)", w.Code, w.Body.String())
	}
	withWindow := decodeYear(t, w)
	if withWindow.EnrollmentStartsAt == nil || *withWindow.EnrollmentStartsAt != "2026-06-22" {
		t.Fatalf("enrollmentStartsAt = %v, want 2026-06-22", withWindow.EnrollmentStartsAt)
	}
	if withWindow.EnrollmentEndsAt == nil || *withWindow.EnrollmentEndsAt != "2026-06-26" {
		t.Fatalf("enrollmentEndsAt = %v, want 2026-06-26", withWindow.EnrollmentEndsAt)
	}

	// Duplicate year → 409.
	if w := e.do(http.MethodPost, "/api/academic-years", "coordinator", `{"year":2026}`); w.Code != http.StatusConflict {
		t.Fatalf("duplicate year: status = %d, want 409 (body=%q)", w.Code, w.Body.String())
	}

	// List returns the created year.
	w = e.do(http.MethodGet, "/api/academic-years", "coordinator", "")
	if w.Code != http.StatusOK {
		t.Fatalf("list: status = %d, want 200", w.Code)
	}
	var list []academicYearResponse
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("list length = %d, want 1", len(list))
	}

	id := created.ID

	// Update class_days and the enrollment window in one PATCH.
	w = e.do(http.MethodPatch, "/api/academic-years/"+id,
		"coordinator", `{"classDays":[3,6],"enrollmentStartsAt":"2026-01-10","enrollmentEndsAt":"2026-02-10"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("update: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	updated := decodeYear(t, w)
	if len(updated.ClassDays) != 2 {
		t.Fatalf("classDays = %v, want 2 entries", updated.ClassDays)
	}
	if updated.EnrollmentStartsAt == nil || *updated.EnrollmentStartsAt != "2026-01-10" {
		t.Fatalf("enrollmentStartsAt = %v, want 2026-01-10", updated.EnrollmentStartsAt)
	}
	if updated.EnrollmentEndsAt == nil || *updated.EnrollmentEndsAt != "2026-02-10" {
		t.Fatalf("enrollmentEndsAt = %v, want 2026-02-10", updated.EnrollmentEndsAt)
	}

	// Toggle-only PATCH must NOT wipe the enrollment window or class_days.
	w = e.do(http.MethodPatch, "/api/academic-years/"+id, "coordinator", `{"isActive":false}`)
	if w.Code != http.StatusOK {
		t.Fatalf("toggle: status = %d, want 200", w.Code)
	}
	toggled := decodeYear(t, w)
	if toggled.IsActive {
		t.Fatal("isActive should be false after toggle")
	}
	if toggled.EnrollmentStartsAt == nil || len(toggled.ClassDays) != 2 {
		t.Fatalf("toggle wiped fields: %+v", toggled)
	}

	// Explicit null clears the enrollment window.
	w = e.do(http.MethodPatch, "/api/academic-years/"+id,
		"coordinator", `{"enrollmentStartsAt":null,"enrollmentEndsAt":null}`)
	if w.Code != http.StatusOK {
		t.Fatalf("clear window: status = %d, want 200", w.Code)
	}
	cleared := decodeYear(t, w)
	if cleared.EnrollmentStartsAt != nil || cleared.EnrollmentEndsAt != nil {
		t.Fatalf("expected cleared window, got %+v", cleared)
	}

	// Update on a missing id → 404.
	missing := "00000000-0000-0000-0000-0000000000ff"
	if w := e.do(http.MethodPatch, "/api/academic-years/"+missing, "coordinator", `{"isActive":true}`); w.Code != http.StatusNotFound {
		t.Fatalf("update missing: status = %d, want 404", w.Code)
	}

	// DELETE blocked by a linked class → 409.
	if _, err := e.pool.Exec(context.Background(),
		`INSERT INTO classes (academic_year_id, name) VALUES ($1, 'Turma A')`, id); err != nil {
		t.Fatalf("seed class: %v", err)
	}
	if w := e.do(http.MethodDelete, "/api/academic-years/"+id, "coordinator", ""); w.Code != http.StatusConflict {
		t.Fatalf("delete with dependency: status = %d, want 409 (body=%q)", w.Code, w.Body.String())
	}

	// Remove the dependency, then DELETE succeeds; deleting again → 404.
	if _, err := e.pool.Exec(context.Background(), `DELETE FROM classes WHERE academic_year_id = $1`, id); err != nil {
		t.Fatalf("cleanup class: %v", err)
	}
	if w := e.do(http.MethodDelete, "/api/academic-years/"+id, "coordinator", ""); w.Code != http.StatusOK {
		t.Fatalf("delete: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if w := e.do(http.MethodDelete, "/api/academic-years/"+id, "coordinator", ""); w.Code != http.StatusNotFound {
		t.Fatalf("delete again: status = %d, want 404", w.Code)
	}
}
