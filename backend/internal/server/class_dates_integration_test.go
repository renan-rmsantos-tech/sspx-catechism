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

type classDatesTestEnv struct {
	t       *testing.T
	handler http.Handler
	jwt     *auth.Manager
	pool    *pgxpool.Pool
}

func setupClassDatesEnv(t *testing.T) *classDatesTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run class-dates integration tests")
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
		`TRUNCATE attendance_records, attendance_sessions, class_dates, classes, academic_years, profiles RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	jwt := auth.NewManager("test-secret", time.Hour)
	srv := New(config.Config{Env: "development"}, pool, jwt)
	return &classDatesTestEnv{t: t, handler: srv.Router(), jwt: jwt, pool: pool}
}

func (e *classDatesTestEnv) do(method, path, role, body string) *httptest.ResponseRecorder {
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

func decodeCalendar(t *testing.T, w *httptest.ResponseRecorder) calendarResponse {
	t.Helper()
	var c calendarResponse
	if err := json.Unmarshal(w.Body.Bytes(), &c); err != nil {
		t.Fatalf("decode: %v (body=%q)", err, w.Body.String())
	}
	return c
}

// seedYear inserts an academic year with class_days={6} (Saturday) and returns its id.
func (e *classDatesTestEnv) seedYear(year int) string {
	e.t.Helper()
	var id string
	if err := e.pool.QueryRow(context.Background(),
		`INSERT INTO academic_years (year, class_days) VALUES ($1, '{6}') RETURNING id`, year).Scan(&id); err != nil {
		e.t.Fatalf("seed year: %v", err)
	}
	return id
}

func TestClassDatesGates(t *testing.T) {
	e := setupClassDatesEnv(t)
	yearID := e.seedYear(2026)

	// GET requires auth.
	if w := e.do(http.MethodGet, "/api/class-dates?academicYearId="+yearID, "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("GET without auth: status = %d, want 401", w.Code)
	}
	// GET is open to any authenticated user (catechist).
	if w := e.do(http.MethodGet, "/api/class-dates?academicYearId="+yearID, "catechist", ""); w.Code != http.StatusOK {
		t.Fatalf("GET as catechist: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	// PUT requires coordinator/admin.
	body := `{"academicYearId":"` + yearID + `","dates":["2026-02-07"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "catechist", body); w.Code != http.StatusForbidden {
		t.Fatalf("PUT as catechist: status = %d, want 403", w.Code)
	}
}

func TestClassDatesReplaceAndValidation(t *testing.T) {
	e := setupClassDatesEnv(t)
	yearID := e.seedYear(2026)

	// PUT replaces the set with two Saturdays.
	body := `{"academicYearId":"` + yearID + `","dates":["2026-02-07","2026-02-14"]}`
	w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body)
	if w.Code != http.StatusOK {
		t.Fatalf("PUT: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	var res map[string]int
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("decode count: %v", err)
	}
	if res["count"] != 2 {
		t.Fatalf("count = %d, want 2", res["count"])
	}

	// GET reflects the new set, no locked dates yet.
	w = e.do(http.MethodGet, "/api/class-dates?academicYearId="+yearID, "coordinator", "")
	cal := decodeCalendar(t, w)
	if len(cal.Dates) != 2 || cal.Dates[0] != "2026-02-07" || cal.Dates[1] != "2026-02-14" {
		t.Fatalf("dates = %v, want [2026-02-07 2026-02-14]", cal.Dates)
	}
	if len(cal.LockedDates) != 0 {
		t.Fatalf("lockedDates = %v, want empty", cal.LockedDates)
	}

	// Replacing wholesale removes the old set.
	body = `{"academicYearId":"` + yearID + `","dates":["2026-02-21"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusOK {
		t.Fatalf("PUT replace: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	w = e.do(http.MethodGet, "/api/class-dates?academicYearId="+yearID, "coordinator", "")
	cal = decodeCalendar(t, w)
	if len(cal.Dates) != 1 || cal.Dates[0] != "2026-02-21" {
		t.Fatalf("dates after replace = %v, want [2026-02-21]", cal.Dates)
	}

	// A weekday not in class_days (Wednesday 2026-02-04) → 400.
	body = `{"academicYearId":"` + yearID + `","dates":["2026-02-04"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusBadRequest {
		t.Fatalf("PUT invalid weekday: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// A regex-valid but impossible date passes the handler shape check and is
	// rejected by the service parser → 400.
	body = `{"academicYearId":"` + yearID + `","dates":["2026-13-40"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusBadRequest {
		t.Fatalf("PUT impossible date: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// A malformed academicYearId on GET → 400.
	if w := e.do(http.MethodGet, "/api/class-dates?academicYearId=not-a-uuid", "coordinator", ""); w.Code != http.StatusBadRequest {
		t.Fatalf("GET bad uuid: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// Unknown (but well-formed) year → 404.
	missing := "00000000-0000-0000-0000-0000000000ff"
	body = `{"academicYearId":"` + missing + `","dates":["2026-02-07"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusNotFound {
		t.Fatalf("PUT unknown year: status = %d, want 404 (body=%q)", w.Code, w.Body.String())
	}
}

func TestClassDatesLockedRemovalBlocked(t *testing.T) {
	e := setupClassDatesEnv(t)
	ctx := context.Background()
	yearID := e.seedYear(2026)

	// Seed the calendar, a catechist, a class and an attendance session that locks 2026-02-07.
	body := `{"academicYearId":"` + yearID + `","dates":["2026-02-07","2026-02-14"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusOK {
		t.Fatalf("seed dates: status = %d (body=%q)", w.Code, w.Body.String())
	}
	var catechistID, classID string
	if err := e.pool.QueryRow(ctx,
		`INSERT INTO profiles (email, password_hash, full_name, role)
		 VALUES ('cat@example.com', 'x', 'Cat', 'catechist') RETURNING id`).Scan(&catechistID); err != nil {
		t.Fatalf("seed catechist: %v", err)
	}
	if err := e.pool.QueryRow(ctx,
		`INSERT INTO classes (academic_year_id, name) VALUES ($1, 'Turma A') RETURNING id`, yearID).Scan(&classID); err != nil {
		t.Fatalf("seed class: %v", err)
	}
	if _, err := e.pool.Exec(ctx,
		`INSERT INTO attendance_sessions (class_id, date, catechist_id) VALUES ($1, '2026-02-07', $2)`,
		classID, catechistID); err != nil {
		t.Fatalf("seed session: %v", err)
	}

	// GET now reports 2026-02-07 as locked.
	w := e.do(http.MethodGet, "/api/class-dates?academicYearId="+yearID, "coordinator", "")
	cal := decodeCalendar(t, w)
	if len(cal.LockedDates) != 1 || cal.LockedDates[0] != "2026-02-07" {
		t.Fatalf("lockedDates = %v, want [2026-02-07]", cal.LockedDates)
	}

	// Removing the locked date (dropping it from the set) → 400.
	body = `{"academicYearId":"` + yearID + `","dates":["2026-02-14"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusBadRequest {
		t.Fatalf("PUT removing locked: status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}

	// Keeping the locked date while editing others is allowed.
	body = `{"academicYearId":"` + yearID + `","dates":["2026-02-07","2026-02-21"]}`
	if w := e.do(http.MethodPut, "/api/class-dates", "coordinator", body); w.Code != http.StatusOK {
		t.Fatalf("PUT keeping locked: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
}
