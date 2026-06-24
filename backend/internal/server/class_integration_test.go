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

// classTestEnv wires the full router against a real Postgres so class CRUD, the
// coordinator/auth gates and the per-catechist read scope (replacing RLS) are
// exercised end to end.
type classTestEnv struct {
	t       *testing.T
	handler http.Handler
	jwt     *auth.Manager
	pool    *pgxpool.Pool

	yearID string
	catA   string // catechist assigned to classA
	catB   string // catechist assigned to classB
}

func setupClassEnv(t *testing.T) *classTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run class integration tests")
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
		`TRUNCATE profiles, academic_years RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	env := &classTestEnv{
		catA: "10000000-0000-0000-0000-000000000001",
		catB: "10000000-0000-0000-0000-000000000002",
	}
	// Seed an academic year and two catechist profiles.
	if err := pool.QueryRow(ctx,
		`INSERT INTO academic_years (year, is_active, class_days) VALUES (2026, true, '{6}') RETURNING id`).
		Scan(&env.yearID); err != nil {
		t.Fatalf("seed year: %v", err)
	}
	for _, c := range []struct{ id, email string }{
		{env.catA, "cata@example.com"},
		{env.catB, "catb@example.com"},
	} {
		if _, err := pool.Exec(ctx,
			`INSERT INTO profiles (id, email, password_hash, full_name, role)
			 VALUES ($1, $2, 'x', $2, 'catechist')`, c.id, c.email); err != nil {
			t.Fatalf("seed catechist %s: %v", c.email, err)
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

// do issues a request as the given user/role ("" role means no session cookie).
func (e *classTestEnv) do(method, path, userID, role, body string) *httptest.ResponseRecorder {
	e.t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	if role != "" {
		if userID == "" {
			userID = "00000000-0000-0000-0000-0000000000aa"
		}
		token, err := e.jwt.Issue(userID, role, time.Now())
		if err != nil {
			e.t.Fatalf("issue token: %v", err)
		}
		r.AddCookie(&http.Cookie{Name: httpx.SessionCookie, Value: token})
	}
	w := httptest.NewRecorder()
	e.handler.ServeHTTP(w, r)
	return w
}

func decodeClass(t *testing.T, w *httptest.ResponseRecorder) classResponse {
	t.Helper()
	var c classResponse
	if err := json.Unmarshal(w.Body.Bytes(), &c); err != nil {
		t.Fatalf("decode: %v (body=%q)", err, w.Body.String())
	}
	return c
}

func decodeClasses(t *testing.T, w *httptest.ResponseRecorder) []classResponse {
	t.Helper()
	var c []classResponse
	if err := json.Unmarshal(w.Body.Bytes(), &c); err != nil {
		t.Fatalf("decode list: %v (body=%q)", err, w.Body.String())
	}
	return c
}

func TestClassGates(t *testing.T) {
	e := setupClassEnv(t)

	if w := e.do(http.MethodGet, "/api/classes", "", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("GET without auth: status = %d, want 401", w.Code)
	}
	// Any authenticated user may list (scope is applied per role by the service).
	if w := e.do(http.MethodGet, "/api/classes", e.catA, "catechist", ""); w.Code != http.StatusOK {
		t.Fatalf("GET as catechist: status = %d, want 200", w.Code)
	}
	// Writes require coordinator/admin.
	body := `{"name":"Turma","academicYearId":"` + e.yearID + `"}`
	if w := e.do(http.MethodPost, "/api/classes", e.catA, "catechist", body); w.Code != http.StatusForbidden {
		t.Fatalf("POST as catechist: status = %d, want 403", w.Code)
	}
}

func TestClassCRUDAndCatechistReplacement(t *testing.T) {
	e := setupClassEnv(t)

	// Create a class assigning catechist A — class + assignment must be atomic.
	body := `{"name":"Turma A","academicYearId":"` + e.yearID + `","level":"Nível 1","catechistIds":["` + e.catA + `"]}`
	w := e.do(http.MethodPost, "/api/classes", "", "coordinator", body)
	if w.Code != http.StatusCreated {
		t.Fatalf("create: status = %d, want 201 (body=%q)", w.Code, w.Body.String())
	}
	created := decodeClass(t, w)
	if created.Name != "Turma A" || created.Level == nil || *created.Level != "Nível 1" {
		t.Fatalf("unexpected created class: %+v", created)
	}
	if len(created.CatechistIDs) != 1 || created.CatechistIDs[0] != e.catA {
		t.Fatalf("catechistIds = %v, want [%s]", created.CatechistIDs, e.catA)
	}
	if created.IsArchived {
		t.Fatal("new class should not be archived")
	}
	classID := created.ID

	// Create with an invalid academic year → 409 (FK violation surfaced).
	bad := `{"name":"X","academicYearId":"00000000-0000-0000-0000-0000000000ff"}`
	if w := e.do(http.MethodPost, "/api/classes", "", "coordinator", bad); w.Code != http.StatusConflict {
		t.Fatalf("create with bad year: status = %d, want 409 (body=%q)", w.Code, w.Body.String())
	}

	// Replace the catechist set wholesale: A → B. Must be atomic.
	w = e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator",
		`{"name":"Turma A1","catechistIds":["`+e.catB+`"]}`)
	if w.Code != http.StatusOK {
		t.Fatalf("replace catechists: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	updated := decodeClass(t, w)
	if updated.Name != "Turma A1" {
		t.Fatalf("name = %q, want Turma A1", updated.Name)
	}
	if len(updated.CatechistIDs) != 1 || updated.CatechistIDs[0] != e.catB {
		t.Fatalf("catechistIds = %v, want [%s]", updated.CatechistIDs, e.catB)
	}

	// A name-only PATCH (no catechistIds) must leave the assignment set intact.
	w = e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator", `{"name":"Turma A2"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("name-only patch: status = %d, want 200", w.Code)
	}
	if got := decodeClass(t, w); len(got.CatechistIDs) != 1 || got.CatechistIDs[0] != e.catB {
		t.Fatalf("name-only patch changed catechists: %v", got.CatechistIDs)
	}

	// Empty catechistIds clears the set.
	w = e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator", `{"catechistIds":[]}`)
	if w.Code != http.StatusOK {
		t.Fatalf("clear catechists: status = %d, want 200", w.Code)
	}
	if got := decodeClass(t, w); len(got.CatechistIDs) != 0 {
		t.Fatalf("expected empty catechistIds, got %v", got.CatechistIDs)
	}

	// Archive via PATCH is_archived.
	w = e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator", `{"isArchived":true}`)
	if w.Code != http.StatusOK {
		t.Fatalf("archive: status = %d, want 200", w.Code)
	}
	if !decodeClass(t, w).IsArchived {
		t.Fatal("class should be archived after PATCH")
	}

	// PATCH on a missing id → 404.
	missing := "00000000-0000-0000-0000-0000000000ee"
	if w := e.do(http.MethodPatch, "/api/classes/"+missing, "", "coordinator", `{"name":"Z"}`); w.Code != http.StatusNotFound {
		t.Fatalf("patch missing: status = %d, want 404", w.Code)
	}
}

func TestClassReadScopeByCatechist(t *testing.T) {
	e := setupClassEnv(t)

	// Two classes, each with a distinct catechist.
	classA := decodeClass(t, e.do(http.MethodPost, "/api/classes", "", "coordinator",
		`{"name":"Turma A","academicYearId":"`+e.yearID+`","catechistIds":["`+e.catA+`"]}`)).ID
	classB := decodeClass(t, e.do(http.MethodPost, "/api/classes", "", "coordinator",
		`{"name":"Turma B","academicYearId":"`+e.yearID+`","catechistIds":["`+e.catB+`"]}`)).ID

	// Coordinator sees both.
	if list := decodeClasses(t, e.do(http.MethodGet, "/api/classes", "", "coordinator", "")); len(list) != 2 {
		t.Fatalf("coordinator list length = %d, want 2", len(list))
	}

	// Catechist A sees only class A (RLS-equivalent scope).
	listA := decodeClasses(t, e.do(http.MethodGet, "/api/classes", e.catA, "catechist", ""))
	if len(listA) != 1 || listA[0].ID != classA {
		t.Fatalf("catechist A list = %v, want only %s", listA, classA)
	}

	// Seed an active student in each class.
	studentA := seedStudent(t, e, classA, "Aluno A")
	seedStudent(t, e, classB, "Aluno B")

	// Catechist A can read class A's roster.
	w := e.do(http.MethodGet, "/api/classes/"+classA+"/students", e.catA, "catechist", "")
	if w.Code != http.StatusOK {
		t.Fatalf("catechist A own roster: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	var roster []classStudentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &roster); err != nil {
		t.Fatalf("decode roster: %v", err)
	}
	if len(roster) != 1 || roster[0].ID != studentA {
		t.Fatalf("roster = %v, want [%s]", roster, studentA)
	}

	// Catechist A may NOT read class B's roster → 403 (replaces RLS denial).
	if w := e.do(http.MethodGet, "/api/classes/"+classB+"/students", e.catA, "catechist", ""); w.Code != http.StatusForbidden {
		t.Fatalf("catechist A foreign roster: status = %d, want 403 (body=%q)", w.Code, w.Body.String())
	}

	// Coordinator may read any roster.
	if w := e.do(http.MethodGet, "/api/classes/"+classB+"/students", "", "coordinator", ""); w.Code != http.StatusOK {
		t.Fatalf("coordinator foreign roster: status = %d, want 200", w.Code)
	}
}

func TestClassInvalidIdentifiers(t *testing.T) {
	e := setupClassEnv(t)

	// Non-UUID academic year id → 400 (ErrInvalidID, surfaced by the service).
	if w := e.do(http.MethodPost, "/api/classes", "", "coordinator",
		`{"name":"X","academicYearId":"not-a-uuid"}`); w.Code != http.StatusBadRequest {
		t.Fatalf("bad academicYearId: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// Non-UUID catechist id → 400.
	if w := e.do(http.MethodPost, "/api/classes", "", "coordinator",
		`{"name":"X","academicYearId":"`+e.yearID+`","catechistIds":["nope"]}`); w.Code != http.StatusBadRequest {
		t.Fatalf("bad catechistId: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// Create a real class, then PATCH with a non-UUID academicYearId → 400.
	classID := decodeClass(t, e.do(http.MethodPost, "/api/classes", "", "coordinator",
		`{"name":"Turma A","academicYearId":"`+e.yearID+`"}`)).ID
	if w := e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator",
		`{"academicYearId":"bad"}`); w.Code != http.StatusBadRequest {
		t.Fatalf("patch bad academicYearId: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// Replacing with an unknown (but well-formed) catechist id → 409 (FK).
	ghost := "20000000-0000-0000-0000-0000000000aa"
	if w := e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator",
		`{"catechistIds":["`+ghost+`"]}`); w.Code != http.StatusConflict {
		t.Fatalf("patch unknown catechist: status = %d, want 409 (body=%q)", w.Code, w.Body.String())
	}

	// Duplicate catechist ids are de-duplicated, not a conflict.
	w := e.do(http.MethodPatch, "/api/classes/"+classID, "", "coordinator",
		`{"catechistIds":["`+e.catA+`","`+e.catA+`"]}`)
	if w.Code != http.StatusOK {
		t.Fatalf("duplicate catechist ids: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if got := decodeClass(t, w); len(got.CatechistIDs) != 1 {
		t.Fatalf("expected de-duplicated single catechist, got %v", got.CatechistIDs)
	}
}

func seedStudent(t *testing.T, e *classTestEnv, classID, name string) string {
	t.Helper()
	var id string
	if err := e.pool.QueryRow(context.Background(),
		`INSERT INTO students (class_id, full_name) VALUES ($1, $2) RETURNING id`, classID, name).
		Scan(&id); err != nil {
		t.Fatalf("seed student: %v", err)
	}
	return id
}
