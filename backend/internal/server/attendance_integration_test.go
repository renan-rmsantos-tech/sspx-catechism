package server

import (
	"context"
	"encoding/json"
	"fmt"
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

// attendanceTestEnv wires the full router against a real Postgres so the idempotent
// sync, the date-scheduled skip, the token-derived catechist id and the per-role
// read scope are exercised end to end.
type attendanceTestEnv struct {
	t       *testing.T
	handler http.Handler
	jwt     *auth.Manager
	pool    *pgxpool.Pool

	yearID    string
	classA    string // catechist A's class, with one scheduled date
	classB    string // catechist B's class
	catA      string
	catB      string
	studentA1 string
	studentA2 string
	schedDate string // a scheduled class date for the year
	offDate   string // a valid, unscheduled date
}

func setupAttendanceEnv(t *testing.T) *attendanceTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run attendance integration tests")
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

	e := &attendanceTestEnv{
		catA:      "10000000-0000-0000-0000-000000000001",
		catB:      "10000000-0000-0000-0000-000000000002",
		schedDate: "2026-03-07", // a Saturday → matches class_days {6}
		offDate:   "2026-03-14", // also a Saturday, but never added to class_dates
	}

	mustScan := func(dst *string, q string, args ...any) {
		if err := pool.QueryRow(ctx, q, args...).Scan(dst); err != nil {
			t.Fatalf("seed %q: %v", q, err)
		}
	}
	mustExec := func(q string, args ...any) {
		if _, err := pool.Exec(ctx, q, args...); err != nil {
			t.Fatalf("seed %q: %v", q, err)
		}
	}

	mustScan(&e.yearID,
		`INSERT INTO academic_years (year, is_active, class_days) VALUES (2026, true, '{6}') RETURNING id`)
	for _, c := range []struct{ id, email string }{{e.catA, "cata@x.test"}, {e.catB, "catb@x.test"}} {
		mustExec(`INSERT INTO profiles (id, email, password_hash, full_name, role)
			VALUES ($1,$2,'x',$2,'catechist')`, c.id, c.email)
	}
	mustScan(&e.classA, `INSERT INTO classes (academic_year_id, name) VALUES ($1,'A') RETURNING id`, e.yearID)
	mustScan(&e.classB, `INSERT INTO classes (academic_year_id, name) VALUES ($1,'B') RETURNING id`, e.yearID)
	mustExec(`INSERT INTO class_catechists (class_id, catechist_id) VALUES ($1,$2)`, e.classA, e.catA)
	mustExec(`INSERT INTO class_catechists (class_id, catechist_id) VALUES ($1,$2)`, e.classB, e.catB)
	mustScan(&e.studentA1, `INSERT INTO students (class_id, full_name) VALUES ($1,'Aluno A1') RETURNING id`, e.classA)
	mustScan(&e.studentA2, `INSERT INTO students (class_id, full_name) VALUES ($1,'Aluno A2') RETURNING id`, e.classA)
	// Only schedDate is a scheduled class date.
	mustExec(`INSERT INTO class_dates (academic_year_id, date) VALUES ($1,$2)`, e.yearID, e.schedDate)

	jwt := auth.NewManager("test-secret", time.Hour)
	srv := New(config.Config{Env: "development"}, pool, jwt)
	e.t = t
	e.handler = srv.Router()
	e.jwt = jwt
	e.pool = pool
	return e
}

func (e *attendanceTestEnv) do(method, path, userID, role, body string) *httptest.ResponseRecorder {
	e.t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	if role != "" {
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

// syncBody builds a one-session batch for classID on date with the given records.
// The catechistId in the payload is deliberately a DIFFERENT user than the token
// to prove the persisted catechist_id comes from the token, not the client.
func syncBody(sessionID, classID, date, payloadCatechist string, records ...[2]string) string {
	recs := make([]string, 0, len(records))
	for _, rc := range records {
		recs = append(recs, fmt.Sprintf(`{"studentId":%q,"present":%s}`, rc[0], rc[1]))
	}
	return fmt.Sprintf(
		`{"sessions":[{"id":%q,"classId":%q,"date":%q,"catechistId":%q,"records":[%s],"createdAt":1}]}`,
		sessionID, classID, date, payloadCatechist, strings.Join(recs, ","),
	)
}

func decodeSync(t *testing.T, w *httptest.ResponseRecorder) syncAttendanceResponse {
	t.Helper()
	var r syncAttendanceResponse
	if err := json.Unmarshal(w.Body.Bytes(), &r); err != nil {
		t.Fatalf("decode sync: %v (body=%q)", err, w.Body.String())
	}
	return r
}

func decodeAttendance(t *testing.T, w *httptest.ResponseRecorder) []attendanceSessionResponse {
	t.Helper()
	var r []attendanceSessionResponse
	if err := json.Unmarshal(w.Body.Bytes(), &r); err != nil {
		t.Fatalf("decode list: %v (body=%q)", err, w.Body.String())
	}
	return r
}

// TestAttendanceSyncIdempotent is the core proof: re-sending the same batch never
// duplicates a session or its records.
func TestAttendanceSyncIdempotent(t *testing.T) {
	e := setupAttendanceEnv(t)
	const sessID = "30000000-0000-0000-0000-000000000001"
	body := syncBody(sessID, e.classA, e.schedDate, e.catB,
		[2]string{e.studentA1, "true"}, [2]string{e.studentA2, "false"})

	// First send: one session created.
	w := e.do(http.MethodPost, "/api/attendance", e.catA, "catechist", body)
	if w.Code != http.StatusOK {
		t.Fatalf("first sync: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if got := decodeSync(t, w); got.Synced != 1 || got.Skipped != 0 {
		t.Fatalf("first sync = %+v, want {1 0}", got)
	}

	// Re-send the identical batch: nothing new, the session is skipped.
	w = e.do(http.MethodPost, "/api/attendance", e.catA, "catechist", body)
	if got := decodeSync(t, w); got.Synced != 0 || got.Skipped != 1 {
		t.Fatalf("re-send = %+v, want {0 1}", got)
	}

	// Exactly one session and two records exist regardless of the double send.
	if n := e.count(`SELECT count(*) FROM attendance_sessions WHERE class_id=$1 AND date=$2`, e.classA, e.schedDate); n != 1 {
		t.Fatalf("sessions = %d, want 1", n)
	}
	if n := e.count(`SELECT count(*) FROM attendance_records r
		JOIN attendance_sessions s ON s.id=r.session_id
		WHERE s.class_id=$1 AND s.date=$2`, e.classA, e.schedDate); n != 2 {
		t.Fatalf("records = %d, want 2", n)
	}
}

// TestAttendanceCatechistFromToken proves catechist_id is persisted from the token,
// never the (different) client-sent catechistId.
func TestAttendanceCatechistFromToken(t *testing.T) {
	e := setupAttendanceEnv(t)
	body := syncBody("30000000-0000-0000-0000-000000000002", e.classA, e.schedDate, e.catB,
		[2]string{e.studentA1, "true"})
	if w := e.do(http.MethodPost, "/api/attendance", e.catA, "catechist", body); w.Code != http.StatusOK {
		t.Fatalf("sync: status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	var persisted string
	if err := e.pool.QueryRow(context.Background(),
		`SELECT catechist_id FROM attendance_sessions WHERE class_id=$1 AND date=$2`, e.classA, e.schedDate).
		Scan(&persisted); err != nil {
		t.Fatalf("query catechist_id: %v", err)
	}
	if persisted != e.catA {
		t.Fatalf("persisted catechist_id = %s, want token user %s (not payload %s)", persisted, e.catA, e.catB)
	}
}

// TestAttendanceUnscheduledSkipped proves a valid-but-unscheduled date is skipped,
// and that an inaccessible (foreign) class is skipped rather than 403-ing the batch.
func TestAttendanceUnscheduledSkipped(t *testing.T) {
	e := setupAttendanceEnv(t)

	// Unscheduled date for an accessible class → skipped, nothing persisted.
	body := syncBody("30000000-0000-0000-0000-000000000003", e.classA, e.offDate, e.catA,
		[2]string{e.studentA1, "true"})
	if got := decodeSync(t, e.do(http.MethodPost, "/api/attendance", e.catA, "catechist", body)); got.Synced != 0 || got.Skipped != 1 {
		t.Fatalf("unscheduled = %+v, want {0 1}", got)
	}
	if n := e.count(`SELECT count(*) FROM attendance_sessions WHERE class_id=$1`, e.classA); n != 0 {
		t.Fatalf("sessions after unscheduled = %d, want 0", n)
	}

	// Catechist A syncing classB (not theirs) on a scheduled date → skipped.
	foreign := syncBody("30000000-0000-0000-0000-000000000004", e.classB, e.schedDate, e.catA)
	if got := decodeSync(t, e.do(http.MethodPost, "/api/attendance", e.catA, "catechist", foreign)); got.Synced != 0 || got.Skipped != 1 {
		t.Fatalf("foreign class = %+v, want {0 1}", got)
	}
	if n := e.count(`SELECT count(*) FROM attendance_sessions WHERE class_id=$1`, e.classB); n != 0 {
		t.Fatalf("sessions in classB = %d, want 0 (foreign catechist must not write)", n)
	}
}

// TestAttendanceDuplicateRecordsNoInsert proves duplicate students within one
// payload do not produce duplicate records (ON CONFLICT DO NOTHING).
func TestAttendanceDuplicateRecordsNoInsert(t *testing.T) {
	e := setupAttendanceEnv(t)
	body := syncBody("30000000-0000-0000-0000-000000000005", e.classA, e.schedDate, e.catA,
		[2]string{e.studentA1, "true"}, [2]string{e.studentA1, "false"})
	if got := decodeSync(t, e.do(http.MethodPost, "/api/attendance", e.catA, "catechist", body)); got.Synced != 1 {
		t.Fatalf("sync with dup records = %+v, want synced 1", got)
	}
	if n := e.count(`SELECT count(*) FROM attendance_records r
		JOIN attendance_sessions s ON s.id=r.session_id WHERE s.class_id=$1`, e.classA); n != 1 {
		t.Fatalf("records = %d, want 1 (duplicate student deduped)", n)
	}
}

// TestAttendanceGetScopeAndFilters covers the GET: embedded records, the per-role
// read scope and the classId/from/to filters.
func TestAttendanceGetScopeAndFilters(t *testing.T) {
	e := setupAttendanceEnv(t)

	// Sync one session in classA (catA) and one in classB (catB).
	e.do(http.MethodPost, "/api/attendance", e.catA, "catechist",
		syncBody("30000000-0000-0000-0000-000000000006", e.classA, e.schedDate, e.catA,
			[2]string{e.studentA1, "true"}))
	e.do(http.MethodPost, "/api/attendance", e.catB, "catechist",
		syncBody("30000000-0000-0000-0000-000000000007", e.classB, e.schedDate, e.catB))

	// Coordinator sees both sessions.
	all := decodeAttendance(t, e.do(http.MethodGet, "/api/attendance", "00000000-0000-0000-0000-0000000000aa", "coordinator", ""))
	if len(all) != 2 {
		t.Fatalf("coordinator list = %d sessions, want 2", len(all))
	}

	// Catechist A sees only classA's session, with its one record embedded.
	mine := decodeAttendance(t, e.do(http.MethodGet, "/api/attendance", e.catA, "catechist", ""))
	if len(mine) != 1 || mine[0].ClassID != e.classA {
		t.Fatalf("catechist A list = %+v, want only classA", mine)
	}
	if len(mine[0].Records) != 1 || mine[0].Records[0].StudentID != e.studentA1 || !mine[0].Records[0].Present {
		t.Fatalf("embedded records = %+v, want one present record for %s", mine[0].Records, e.studentA1)
	}
	if mine[0].CatechistID != e.catA || mine[0].SyncedAt == nil {
		t.Fatalf("session meta = %+v, want catechist %s and a syncedAt", mine[0], e.catA)
	}

	// classId filter: coordinator scoped to classB sees one session.
	onlyB := decodeAttendance(t, e.do(http.MethodGet, "/api/attendance?classId="+e.classB, "00000000-0000-0000-0000-0000000000aa", "coordinator", ""))
	if len(onlyB) != 1 || onlyB[0].ClassID != e.classB {
		t.Fatalf("classId filter = %+v, want only classB", onlyB)
	}

	// Date range excluding the only date → empty.
	none := decodeAttendance(t, e.do(http.MethodGet, "/api/attendance?from=2026-04-01", "00000000-0000-0000-0000-0000000000aa", "coordinator", ""))
	if len(none) != 0 {
		t.Fatalf("from filter = %d sessions, want 0", len(none))
	}
}

// TestAttendanceGates covers the auth gate on both verbs.
func TestAttendanceGates(t *testing.T) {
	e := setupAttendanceEnv(t)
	if w := e.do(http.MethodPost, "/api/attendance", "", "", `{"sessions":[]}`); w.Code != http.StatusUnauthorized {
		t.Fatalf("POST without auth: status = %d, want 401", w.Code)
	}
	if w := e.do(http.MethodGet, "/api/attendance", "", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("GET without auth: status = %d, want 401", w.Code)
	}
}

func (e *attendanceTestEnv) count(q string, args ...any) int {
	e.t.Helper()
	var n int
	if err := e.pool.QueryRow(context.Background(), q, args...).Scan(&n); err != nil {
		e.t.Fatalf("count %q: %v", q, err)
	}
	return n
}
