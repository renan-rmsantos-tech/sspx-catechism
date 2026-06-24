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

type enrollmentTestEnv struct {
	t          *testing.T
	handler    http.Handler
	jwt        *auth.Manager
	pool       *pgxpool.Pool
	reviewerID string
}

func setupEnrollmentEnv(t *testing.T) *enrollmentTestEnv {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run enrollment integration tests")
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
		`TRUNCATE enrollments, attendance_records, attendance_sessions, students, class_dates, classes, academic_years, profiles RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	// A coordinator profile to act as the reviewer (reviewed_by FK → profiles).
	var reviewerID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO profiles (email, password_hash, full_name, role)
		 VALUES ('coord@example.com', 'x', 'Coord', 'coordinator') RETURNING id`).Scan(&reviewerID); err != nil {
		t.Fatalf("seed reviewer: %v", err)
	}
	jwt := auth.NewManager("test-secret", time.Hour)
	srv := New(config.Config{Env: "development"}, pool, jwt)
	return &enrollmentTestEnv{t: t, handler: srv.Router(), jwt: jwt, pool: pool, reviewerID: reviewerID}
}

// do issues a request. role=="" sends no cookie; for an authenticated role the token
// subject is the seeded coordinator so claims.UserID() resolves to a real profile.
func (e *enrollmentTestEnv) do(method, path, role, body string) *httptest.ResponseRecorder {
	e.t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	if role != "" {
		subject := e.reviewerID
		if role != "coordinator" {
			subject = "00000000-0000-0000-0000-0000000000aa"
		}
		token, err := e.jwt.Issue(subject, role, time.Now())
		if err != nil {
			e.t.Fatalf("issue token: %v", err)
		}
		r.AddCookie(&http.Cookie{Name: httpx.SessionCookie, Value: token})
	}
	w := httptest.NewRecorder()
	e.handler.ServeHTTP(w, r)
	return w
}

// seedYear inserts an academic year. window!="" sets the enrollment window to
// [today-1, today+1] (open) when window=="open" or a past window when "closed".
func (e *enrollmentTestEnv) seedYear(year int, window string) string {
	e.t.Helper()
	var id string
	today := time.Now().UTC()
	var startsAt, endsAt *string
	switch window {
	case "open":
		s := today.AddDate(0, 0, -1).Format("2006-01-02")
		en := today.AddDate(0, 0, 1).Format("2006-01-02")
		startsAt, endsAt = &s, &en
	case "closed":
		s := today.AddDate(0, 0, -10).Format("2006-01-02")
		en := today.AddDate(0, 0, -5).Format("2006-01-02")
		startsAt, endsAt = &s, &en
	}
	if err := e.pool.QueryRow(context.Background(),
		`INSERT INTO academic_years (year, is_active, enrollment_starts_at, enrollment_ends_at)
		 VALUES ($1, TRUE, $2, $3) RETURNING id`, year, startsAt, endsAt).Scan(&id); err != nil {
		e.t.Fatalf("seed year: %v", err)
	}
	return id
}

func (e *enrollmentTestEnv) seedClass(yearID, name string) string {
	e.t.Helper()
	var id string
	if err := e.pool.QueryRow(context.Background(),
		`INSERT INTO classes (academic_year_id, name) VALUES ($1, $2) RETURNING id`, yearID, name).Scan(&id); err != nil {
		e.t.Fatalf("seed class: %v", err)
	}
	return id
}

func decodeEnrollment(t *testing.T, w *httptest.ResponseRecorder) enrollmentResponse {
	t.Helper()
	var e enrollmentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &e); err != nil {
		t.Fatalf("decode: %v (body=%q)", err, w.Body.String())
	}
	return e
}

const validSubmit = `{"fullName":"Ana Clara Souza","birthDate":"2015-06-20","guardianPhone":"(11) 99999-9999","guardianEmail":"mae@example.com"}`

func TestEnrollmentSubmitWindow(t *testing.T) {
	t.Run("inside window creates pending", func(t *testing.T) {
		e := setupEnrollmentEnv(t)
		e.seedYear(2026, "open")
		w := e.do(http.MethodPost, "/api/enrollments", "", validSubmit)
		if w.Code != http.StatusCreated {
			t.Fatalf("status = %d, want 201 (body=%q)", w.Code, w.Body.String())
		}
		en := decodeEnrollment(t, w)
		if en.Status != "pending" {
			t.Fatalf("status = %q, want pending", en.Status)
		}
		if en.FullName != "Ana Clara Souza" {
			t.Fatalf("fullName = %q", en.FullName)
		}
	})

	t.Run("outside window rejected", func(t *testing.T) {
		e := setupEnrollmentEnv(t)
		e.seedYear(2026, "closed")
		w := e.do(http.MethodPost, "/api/enrollments", "", validSubmit)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
		}
	})

	t.Run("no window set rejected", func(t *testing.T) {
		e := setupEnrollmentEnv(t)
		e.seedYear(2026, "none")
		w := e.do(http.MethodPost, "/api/enrollments", "", validSubmit)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
		}
	})

	t.Run("no active year → 404", func(t *testing.T) {
		e := setupEnrollmentEnv(t)
		// No academic year seeded at all.
		w := e.do(http.MethodPost, "/api/enrollments", "", validSubmit)
		if w.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404 (body=%q)", w.Code, w.Body.String())
		}
	})
}

func TestEnrollmentListGatesAndFilter(t *testing.T) {
	e := setupEnrollmentEnv(t)
	e.seedYear(2026, "open")
	// Two pending submissions.
	if w := e.do(http.MethodPost, "/api/enrollments", "", validSubmit); w.Code != http.StatusCreated {
		t.Fatalf("submit 1: %d (%q)", w.Code, w.Body.String())
	}
	second := `{"fullName":"Bruno Lima","guardianPhone":"(11) 98888-7777","guardianEmail":"pai@example.com"}`
	if w := e.do(http.MethodPost, "/api/enrollments", "", second); w.Code != http.StatusCreated {
		t.Fatalf("submit 2: %d (%q)", w.Code, w.Body.String())
	}

	// GET requires coordinator.
	if w := e.do(http.MethodGet, "/api/enrollments", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("GET without auth: %d, want 401", w.Code)
	}
	if w := e.do(http.MethodGet, "/api/enrollments", "catechist", ""); w.Code != http.StatusForbidden {
		t.Fatalf("GET as catechist: %d, want 403", w.Code)
	}

	// Default status (pending) lists both, newest first.
	w := e.do(http.MethodGet, "/api/enrollments", "coordinator", "")
	if w.Code != http.StatusOK {
		t.Fatalf("GET pending: %d (%q)", w.Code, w.Body.String())
	}
	var list []enrollmentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("len = %d, want 2", len(list))
	}
	if list[0].FullName != "Bruno Lima" {
		t.Fatalf("first = %q, want Bruno Lima (newest first)", list[0].FullName)
	}

	// Name filter.
	w = e.do(http.MethodGet, "/api/enrollments?q=ana", "coordinator", "")
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode filtered: %v", err)
	}
	if len(list) != 1 || list[0].FullName != "Ana Clara Souza" {
		t.Fatalf("filtered = %v, want [Ana Clara Souza]", list)
	}

	// approved filter empty so far.
	w = e.do(http.MethodGet, "/api/enrollments?status=approved", "coordinator", "")
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode approved: %v", err)
	}
	if len(list) != 0 {
		t.Fatalf("approved len = %d, want 0", len(list))
	}
}

// submitOne creates a pending enrollment and returns its id.
func (e *enrollmentTestEnv) submitOne(body string) string {
	e.t.Helper()
	w := e.do(http.MethodPost, "/api/enrollments", "", body)
	if w.Code != http.StatusCreated {
		e.t.Fatalf("submit: %d (%q)", w.Code, w.Body.String())
	}
	return decodeEnrollment(e.t, w).ID
}

func TestEnrollmentApproveCreatesStudent(t *testing.T) {
	e := setupEnrollmentEnv(t)
	yearID := e.seedYear(2026, "open")
	classID := e.seedClass(yearID, "Turma A")
	id := e.submitOne(validSubmit)

	// Approve → 200, status approved, student materialized in the class.
	body := `{"classId":"` + classID + `"}`
	w := e.do(http.MethodPost, "/api/enrollments/"+id+"/approve", "coordinator", body)
	if w.Code != http.StatusOK {
		t.Fatalf("approve: %d (%q)", w.Code, w.Body.String())
	}
	en := decodeEnrollment(t, w)
	if en.Status != "approved" {
		t.Fatalf("status = %q, want approved", en.Status)
	}
	if en.ApprovedClassID == nil || *en.ApprovedClassID != classID {
		t.Fatalf("approvedClassId = %v, want %s", en.ApprovedClassID, classID)
	}
	if en.ApprovedStudentID == nil {
		t.Fatalf("approvedStudentId is nil, want a student id")
	}
	if en.ReviewedBy == nil || *en.ReviewedBy != e.reviewerID {
		t.Fatalf("reviewedBy = %v, want %s", en.ReviewedBy, e.reviewerID)
	}
	if en.ReviewedAt == nil {
		t.Fatalf("reviewedAt is nil")
	}

	// The student exists with the enrollment's data.
	var name, gotClass string
	if err := e.pool.QueryRow(context.Background(),
		`SELECT full_name, class_id FROM students WHERE id = $1`, *en.ApprovedStudentID).Scan(&name, &gotClass); err != nil {
		t.Fatalf("load student: %v", err)
	}
	if name != "Ana Clara Souza" || gotClass != classID {
		t.Fatalf("student = (%q,%q), want (Ana Clara Souza,%s)", name, gotClass, classID)
	}

	// Double review → 409.
	if w := e.do(http.MethodPost, "/api/enrollments/"+id+"/approve", "coordinator", body); w.Code != http.StatusConflict {
		t.Fatalf("re-approve: %d, want 409 (%q)", w.Code, w.Body.String())
	}
}

func TestEnrollmentApproveUpdatesExistingStudent(t *testing.T) {
	e := setupEnrollmentEnv(t)
	yearID := e.seedYear(2026, "open")
	classA := e.seedClass(yearID, "Turma A")
	classB := e.seedClass(yearID, "Turma B")

	// Pre-existing student in class A.
	var studentID string
	if err := e.pool.QueryRow(context.Background(),
		`INSERT INTO students (class_id, full_name) VALUES ($1, 'Old Name') RETURNING id`, classA).Scan(&studentID); err != nil {
		t.Fatalf("seed student: %v", err)
	}

	// Renewal enrollment, approved onto the existing student into class B.
	id := e.submitOne(`{"fullName":"Ana Renovada","guardianPhone":"(11) 99999-9999","guardianEmail":"mae@example.com","isRenewal":true}`)
	body := `{"classId":"` + classB + `","existingStudentId":"` + studentID + `"}`
	w := e.do(http.MethodPost, "/api/enrollments/"+id+"/approve", "coordinator", body)
	if w.Code != http.StatusOK {
		t.Fatalf("approve renewal: %d (%q)", w.Code, w.Body.String())
	}
	en := decodeEnrollment(t, w)
	if en.ApprovedStudentID == nil || *en.ApprovedStudentID != studentID {
		t.Fatalf("approvedStudentId = %v, want existing %s", en.ApprovedStudentID, studentID)
	}

	// The existing student was overwritten and re-assigned to class B.
	var name, gotClass string
	if err := e.pool.QueryRow(context.Background(),
		`SELECT full_name, class_id FROM students WHERE id = $1`, studentID).Scan(&name, &gotClass); err != nil {
		t.Fatalf("load student: %v", err)
	}
	if name != "Ana Renovada" || gotClass != classB {
		t.Fatalf("student = (%q,%q), want (Ana Renovada,%s)", name, gotClass, classB)
	}

	// No second student was created.
	var count int
	if err := e.pool.QueryRow(context.Background(), `SELECT count(*) FROM students`).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Fatalf("student count = %d, want 1", count)
	}
}

func TestEnrollmentReject(t *testing.T) {
	e := setupEnrollmentEnv(t)
	e.seedYear(2026, "open")
	id := e.submitOne(validSubmit)

	body := `{"rejectionReason":"Fora da faixa etária"}`
	w := e.do(http.MethodPost, "/api/enrollments/"+id+"/reject", "coordinator", body)
	if w.Code != http.StatusOK {
		t.Fatalf("reject: %d (%q)", w.Code, w.Body.String())
	}
	en := decodeEnrollment(t, w)
	if en.Status != "rejected" {
		t.Fatalf("status = %q, want rejected", en.Status)
	}
	if en.RejectionReason == nil || *en.RejectionReason != "Fora da faixa etária" {
		t.Fatalf("rejectionReason = %v", en.RejectionReason)
	}
	if en.ReviewedBy == nil || *en.ReviewedBy != e.reviewerID {
		t.Fatalf("reviewedBy = %v, want %s", en.ReviewedBy, e.reviewerID)
	}

	// Re-reject a non-pending enrollment → 409.
	if w := e.do(http.MethodPost, "/api/enrollments/"+id+"/reject", "coordinator", body); w.Code != http.StatusConflict {
		t.Fatalf("re-reject: %d, want 409 (%q)", w.Code, w.Body.String())
	}
}

func TestEnrollmentReviewUnknownAndBadRefs(t *testing.T) {
	e := setupEnrollmentEnv(t)
	yearID := e.seedYear(2026, "open")
	e.seedClass(yearID, "Turma A")

	missing := "00000000-0000-0000-0000-0000000000ff"
	// Unknown enrollment → 404.
	if w := e.do(http.MethodPost, "/api/enrollments/"+missing+"/reject", "coordinator", `{}`); w.Code != http.StatusNotFound {
		t.Fatalf("reject unknown: %d, want 404 (%q)", w.Code, w.Body.String())
	}
	// Approve onto a missing class → 409 (FK violation).
	id := e.submitOne(validSubmit)
	body := `{"classId":"` + missing + `"}`
	if w := e.do(http.MethodPost, "/api/enrollments/"+id+"/approve", "coordinator", body); w.Code != http.StatusConflict {
		t.Fatalf("approve bad class: %d, want 409 (%q)", w.Code, w.Body.String())
	}
}
