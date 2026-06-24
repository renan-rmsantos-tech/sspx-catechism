package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/rmtech/sspx-catechism/backend/internal/attendance"
	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
)

// A lenient (non-RFC4122) seed-style UUID and a valid date used across cases.
const (
	lenientUUIDA = "20000000-0000-0000-0000-000000000001"
	lenientUUIDB = "20000000-0000-0000-0000-000000000002"
)

func TestValidateSyncRequest(t *testing.T) {
	valid := syncAttendanceRequest{Sessions: []attendanceSessionDTO{{
		ID:          lenientUUIDA,
		ClassID:     lenientUUIDB,
		Date:        "2026-03-07",
		CatechistID: lenientUUIDA,
		Records:     []attendanceRecordDTO{{StudentID: lenientUUIDB, Present: true}},
		CreatedAt:   1234,
	}}}
	if msg, ok := validateSyncRequest(valid); !ok {
		t.Fatalf("lenient-UUID payload rejected: %q", msg)
	}

	bad := []struct {
		name string
		req  syncAttendanceRequest
	}{
		{"no sessions", syncAttendanceRequest{}},
		{"bad session id", syncAttendanceRequest{Sessions: []attendanceSessionDTO{{
			ID: "nope", ClassID: lenientUUIDB, Date: "2026-03-07", CatechistID: lenientUUIDA,
		}}}},
		{"bad class id", syncAttendanceRequest{Sessions: []attendanceSessionDTO{{
			ID: lenientUUIDA, ClassID: "nope", Date: "2026-03-07", CatechistID: lenientUUIDA,
		}}}},
		{"bad catechist id", syncAttendanceRequest{Sessions: []attendanceSessionDTO{{
			ID: lenientUUIDA, ClassID: lenientUUIDB, Date: "2026-03-07", CatechistID: "nope",
		}}}},
		{"bad date", syncAttendanceRequest{Sessions: []attendanceSessionDTO{{
			ID: lenientUUIDA, ClassID: lenientUUIDB, Date: "07/03/2026", CatechistID: lenientUUIDA,
		}}}},
		{"bad student id", syncAttendanceRequest{Sessions: []attendanceSessionDTO{{
			ID: lenientUUIDA, ClassID: lenientUUIDB, Date: "2026-03-07", CatechistID: lenientUUIDA,
			Records: []attendanceRecordDTO{{StudentID: "nope", Present: true}},
		}}}},
	}
	for _, c := range bad {
		t.Run(c.name, func(t *testing.T) {
			if _, ok := validateSyncRequest(c.req); ok {
				t.Fatalf("expected %s to be rejected", c.name)
			}
		})
	}
}

// TestSyncAttendanceBadRequests covers the handler's 400/401 paths without a DB.
func TestSyncAttendanceBadRequests(t *testing.T) {
	s := newValidationServer()
	ctx := httpx.WithClaims(t.Context(), claimsFor("catechist", lenientUUIDA))

	cases := []struct {
		name string
		body string
	}{
		{"invalid json", `{`},
		{"empty sessions", `{"sessions":[]}`},
		{"unknown field", `{"sessions":[],"foo":1}`},
		{"bad date format", `{"sessions":[{"id":"` + lenientUUIDA + `","classId":"` + lenientUUIDB +
			`","date":"bad","catechistId":"` + lenientUUIDA + `","records":[],"createdAt":1}]}`},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/attendance", strings.NewReader(c.body)).WithContext(ctx)
			w := httptest.NewRecorder()
			s.handleSyncAttendance(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}

	// No claims in context → 401 (never reached under the auth middleware, but the
	// handler defends against it).
	req := httptest.NewRequest(http.MethodPost, "/api/attendance", strings.NewReader(`{"sessions":[]}`))
	w := httptest.NewRecorder()
	s.handleSyncAttendance(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("missing claims: status = %d, want 401", w.Code)
	}
}

// TestListAttendanceBadDateParams covers the GET filter validation without a DB.
func TestListAttendanceBadDateParams(t *testing.T) {
	s := newValidationServer()
	ctx := httpx.WithClaims(t.Context(), claimsFor("coordinator", lenientUUIDA))
	for _, p := range []string{"from=bad", "to=07/03/2026"} {
		req := httptest.NewRequest(http.MethodGet, "/api/attendance?"+p, nil).WithContext(ctx)
		w := httptest.NewRecorder()
		s.handleListAttendance(w, req)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("param %q: status = %d, want 400", p, w.Code)
		}
	}
}

func TestAttendanceHandlersNoDBServicePaths(t *testing.T) {
	s := &Server{attendance: attendance.NewService(nil, denyAttendanceAuthz{})}
	ctx := httpx.WithClaims(t.Context(), claimsFor("catechist", lenientUUIDA))

	body := `{"sessions":[{"id":"` + lenientUUIDA + `","classId":"` + lenientUUIDB +
		`","date":"2026-03-07","catechistId":"` + lenientUUIDA + `","records":[],"createdAt":1}]}`
	req := httptest.NewRequest(http.MethodPost, "/api/attendance", strings.NewReader(body)).WithContext(ctx)
	w := httptest.NewRecorder()
	s.handleSyncAttendance(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("denied sync status = %d, want 200 (body=%q)", w.Code, w.Body.String())
	}
	if got := w.Body.String(); !strings.Contains(got, `"synced":0`) || !strings.Contains(got, `"skipped":1`) {
		t.Fatalf("denied sync body = %q, want skipped session", got)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/attendance?classId=bad", nil).WithContext(ctx)
	w = httptest.NewRecorder()
	s.handleListAttendance(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("bad classId status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}
}

type denyAttendanceAuthz struct{}

func (denyAttendanceAuthz) IsCoordinator(auth.Claims) bool { return false }
func (denyAttendanceAuthz) CanAccessClass(context.Context, auth.Claims, string) (bool, error) {
	return false, nil
}

func claimsFor(role, userID string) *auth.Claims {
	c := auth.Claims{Role: role}
	c.Subject = userID
	return &c
}
