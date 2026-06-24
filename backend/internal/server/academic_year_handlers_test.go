package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidClassDays(t *testing.T) {
	cases := []struct {
		name string
		days []int32
		want bool
	}{
		{"all weekdays", []int32{0, 1, 2, 3, 4, 5, 6}, true},
		{"single saturday", []int32{6}, true},
		{"negative", []int32{-1}, false},
		{"too high", []int32{7}, false},
		{"mixed invalid", []int32{1, 9}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := validClassDays(c.days); got != c.want {
				t.Fatalf("validClassDays(%v) = %v, want %v", c.days, got, c.want)
			}
		})
	}
}

func TestParseDateField(t *testing.T) {
	cases := []struct {
		name      string
		raw       string
		wantOK    bool
		wantValid bool
	}{
		{"explicit null", `null`, true, false},
		{"valid date", `"2026-02-01"`, true, true},
		{"bad format", `"01/02/2026"`, false, false},
		{"impossible date", `"2026-13-40"`, false, false},
		{"not a string", `123`, false, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			d, ok, _ := parseDateField(json.RawMessage(c.raw))
			if ok != c.wantOK {
				t.Fatalf("ok = %v, want %v", ok, c.wantOK)
			}
			if ok && d.Valid != c.wantValid {
				t.Fatalf("date.Valid = %v, want %v", d.Valid, c.wantValid)
			}
		})
	}
}

// validation paths reject before any DB access, so a Server with a nil-backed
// service is sufficient to exercise them.
func newValidationServer() *Server { return &Server{} }

func TestCreateAcademicYearValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"missing year", `{"classDays":[6]}`},
		{"non-positive year", `{"year":0,"classDays":[6]}`},
		{"empty classDays", `{"year":2026,"classDays":[]}`},
		{"out-of-range classDays", `{"year":2026,"classDays":[8]}`},
		{"bad start date", `{"year":2026,"classDays":[6],"enrollmentStartsAt":"2026/01/01"}`},
		{"end before start", `{"year":2026,"classDays":[6],"enrollmentStartsAt":"2026-03-01","enrollmentEndsAt":"2026-02-01"}`},
		{"unknown field", `{"year":2026,"foo":1}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/academic-years", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleCreateAcademicYear(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestUpdateAcademicYearValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"empty classDays", `{"classDays":[]}`},
		{"out-of-range classDays", `{"classDays":[-1]}`},
		{"bad start date", `{"enrollmentStartsAt":"2026/01/01"}`},
		{"end before start", `{"enrollmentStartsAt":"2026-03-01","enrollmentEndsAt":"2026-02-01"}`},
		{"end equals start", `{"enrollmentStartsAt":"2026-03-01","enrollmentEndsAt":"2026-03-01"}`},
		{"unknown field", `{"bogus":true}`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPatch, "/api/academic-years/x", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleUpdateAcademicYear(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}
