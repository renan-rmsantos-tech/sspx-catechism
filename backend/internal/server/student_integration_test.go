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

// studentTestEnv wires the full router against a real Postgres so student search,
// CRUD, the coordinator gate and the FK/not-found error mapping are exercised end
// to end.
type studentTestEnv struct {
	t       *testing.T
	handler http.Handler
	jwt     *auth.Manager
	pool    *pgxpool.Pool

	classA string
	classB string
}

func setupStudentEnv(t *testing.T) *studentTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run student integration tests")
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

	var yearID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO academic_years (year, is_active, class_days) VALUES (2026, true, '{6}') RETURNING id`).
		Scan(&yearID); err != nil {
		t.Fatalf("seed year: %v", err)
	}
	env := &studentTestEnv{}
	for _, c := range []struct {
		name string
		dst  *string
	}{{"Turma A", &env.classA}, {"Turma B", &env.classB}} {
		if err := pool.QueryRow(ctx,
			`INSERT INTO classes (academic_year_id, name) VALUES ($1, $2) RETURNING id`, yearID, c.name).
			Scan(c.dst); err != nil {
			t.Fatalf("seed class %s: %v", c.name, err)
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

func (e *studentTestEnv) do(method, path, role, body string) *httptest.ResponseRecorder {
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

func decodeStudent(t *testing.T, w *httptest.ResponseRecorder) studentResponse {
	t.Helper()
	var s studentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &s); err != nil {
		t.Fatalf("decode: %v (body=%q)", err, w.Body.String())
	}
	return s
}

func decodeStudents(t *testing.T, w *httptest.ResponseRecorder) []studentResponse {
	t.Helper()
	var s []studentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &s); err != nil {
		t.Fatalf("decode list: %v (body=%q)", err, w.Body.String())
	}
	return s
}

func TestStudentGates(t *testing.T) {
	e := setupStudentEnv(t)

	if w := e.do(http.MethodGet, "/api/students", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("GET without auth: status = %d, want 401", w.Code)
	}
	// All student routes are coordinator-only: a catechist is forbidden.
	for _, p := range []struct{ method, path, body string }{
		{http.MethodGet, "/api/students", ""},
		{http.MethodPost, "/api/students", `{"classId":"` + e.classA + `","fullName":"X"}`},
		{http.MethodGet, "/api/students/" + e.classA, ""},
		{http.MethodPatch, "/api/students/" + e.classA, `{"fullName":"Y"}`},
	} {
		if w := e.do(p.method, p.path, "catechist", p.body); w.Code != http.StatusForbidden {
			t.Fatalf("%s %s as catechist: status = %d, want 403", p.method, p.path, w.Code)
		}
	}
}

func TestStudentCRUDAndSearch(t *testing.T) {
	e := setupStudentEnv(t)

	// Create in class A with the full set of fields.
	body := `{
		"classId":"` + e.classA + `",
		"fullName":"Ana Clara Souza",
		"birthDate":"2012-05-15",
		"city":"São Paulo",
		"firstCommunion":true,
		"guardianPhone":"(11) 99999-9999",
		"guardianEmail":"mae@exemplo.com"
	}`
	w := e.do(http.MethodPost, "/api/students", "coordinator", body)
	if w.Code != http.StatusCreated {
		t.Fatalf("create: status = %d, want 201 (body=%q)", w.Code, w.Body.String())
	}
	created := decodeStudent(t, w)
	if created.FullName != "Ana Clara Souza" || created.ClassID != e.classA {
		t.Fatalf("unexpected created student: %+v", created)
	}
	if created.BirthDate == nil || *created.BirthDate != "2012-05-15" {
		t.Fatalf("birthDate = %v, want 2012-05-15", created.BirthDate)
	}
	if !created.FirstCommunion || created.Confirmation {
		t.Fatalf("booleans: firstCommunion=%v confirmation=%v, want true/false", created.FirstCommunion, created.Confirmation)
	}
	studentID := created.ID

	// Create a second student in class B.
	e.do(http.MethodPost, "/api/students", "coordinator",
		`{"classId":"`+e.classB+`","fullName":"Bruno Lima"}`)

	// Detail includes the joined class name.
	w = e.do(http.MethodGet, "/api/students/"+studentID, "coordinator", "")
	if w.Code != http.StatusOK {
		t.Fatalf("get: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	got := decodeStudent(t, w)
	if got.ClassName == nil || *got.ClassName != "Turma A" {
		t.Fatalf("className = %v, want Turma A", got.ClassName)
	}

	// List without a query returns both, ordered by name, with class names.
	all := decodeStudents(t, e.do(http.MethodGet, "/api/students", "coordinator", ""))
	if len(all) != 2 || all[0].FullName != "Ana Clara Souza" || all[1].FullName != "Bruno Lima" {
		t.Fatalf("list = %+v, want [Ana, Bruno]", all)
	}
	if all[0].ClassName == nil || *all[0].ClassName != "Turma A" {
		t.Fatalf("list className = %v, want Turma A", all[0].ClassName)
	}

	// Search by name (ILIKE, case-insensitive) returns only the match.
	found := decodeStudents(t, e.do(http.MethodGet, "/api/students?q=ana", "coordinator", ""))
	if len(found) != 1 || found[0].FullName != "Ana Clara Souza" {
		t.Fatalf("search q=ana = %+v, want [Ana]", found)
	}
	// A non-matching query returns an empty list.
	if none := decodeStudents(t, e.do(http.MethodGet, "/api/students?q=zzz", "coordinator", "")); len(none) != 0 {
		t.Fatalf("search q=zzz = %+v, want empty", none)
	}

	// Update: transfer to class B, clear the phone (null), set confirmation.
	w = e.do(http.MethodPatch, "/api/students/"+studentID, "coordinator",
		`{"classId":"`+e.classB+`","guardianPhone":null,"confirmation":true,"city":"Santos"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("update: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	updated := decodeStudent(t, w)
	if updated.ClassID != e.classB {
		t.Fatalf("classId = %s, want %s (transfer)", updated.ClassID, e.classB)
	}
	if updated.GuardianPhone != nil {
		t.Fatalf("guardianPhone = %v, want nil (cleared)", *updated.GuardianPhone)
	}
	if !updated.Confirmation {
		t.Fatal("confirmation should be true after update")
	}
	if updated.City == nil || *updated.City != "Santos" {
		t.Fatalf("city = %v, want Santos", updated.City)
	}
	// A field not mentioned in the PATCH is left intact (full name unchanged).
	if updated.FullName != "Ana Clara Souza" {
		t.Fatalf("fullName = %q, want unchanged Ana Clara Souza", updated.FullName)
	}
	// firstCommunion was set true at create and not mentioned → still true.
	if !updated.FirstCommunion {
		t.Fatal("firstCommunion should remain true (omitted from PATCH)")
	}
}

func TestStudentNotFoundAndConflicts(t *testing.T) {
	e := setupStudentEnv(t)

	missing := "00000000-0000-0000-0000-0000000000ee"
	if w := e.do(http.MethodGet, "/api/students/"+missing, "coordinator", ""); w.Code != http.StatusNotFound {
		t.Fatalf("get missing: status = %d, want 404", w.Code)
	}
	if w := e.do(http.MethodPatch, "/api/students/"+missing, "coordinator", `{"fullName":"Z"}`); w.Code != http.StatusNotFound {
		t.Fatalf("patch missing: status = %d, want 404", w.Code)
	}

	// Create referencing a well-formed but unknown class → 409 (FK violation).
	ghost := "20000000-0000-0000-0000-0000000000ff"
	if w := e.do(http.MethodPost, "/api/students", "coordinator",
		`{"classId":"`+ghost+`","fullName":"Ana"}`); w.Code != http.StatusConflict {
		t.Fatalf("create unknown class: status = %d, want 409 (body=%q)", w.Code, w.Body.String())
	}

	// Create with a non-UUID class id → 400.
	if w := e.do(http.MethodPost, "/api/students", "coordinator",
		`{"classId":"not-a-uuid","fullName":"Ana"}`); w.Code != http.StatusBadRequest {
		t.Fatalf("create bad class id: status = %d, want 400", w.Code)
	}

	// Transfer an existing student to an unknown class → 409.
	created := decodeStudent(t, e.do(http.MethodPost, "/api/students", "coordinator",
		`{"classId":"`+e.classA+`","fullName":"Carla"}`))
	if w := e.do(http.MethodPatch, "/api/students/"+created.ID, "coordinator",
		`{"classId":"`+ghost+`"}`); w.Code != http.StatusConflict {
		t.Fatalf("transfer to unknown class: status = %d, want 409 (body=%q)", w.Code, w.Body.String())
	}
}
