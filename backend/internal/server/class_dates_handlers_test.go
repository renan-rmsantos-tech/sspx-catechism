package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidDateStrings(t *testing.T) {
	cases := []struct {
		name  string
		dates []string
		want  bool
	}{
		{"empty", nil, true},
		{"valid", []string{"2026-02-07", "2026-02-14"}, true},
		{"bad format", []string{"07/02/2026"}, false},
		{"one bad among good", []string{"2026-02-07", "2026-2-7"}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := validDateStrings(c.dates); got != c.want {
				t.Fatalf("validDateStrings(%v) = %v, want %v", c.dates, got, c.want)
			}
		})
	}
}

// Validation paths reject before any DB access, so a nil-backed Server suffices.
func TestUpdateClassDatesValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"missing academicYearId", `{"dates":["2026-02-07"]}`},
		{"bad date format", `{"academicYearId":"00000000-0000-0000-0000-000000000001","dates":["07-02-2026"]}`},
		{"invalid json", `{`},
		{"unknown field", `{"academicYearId":"x","dates":[],"foo":1}`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPut, "/api/class-dates", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleUpdateClassDates(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestGetClassDatesMissingParam(t *testing.T) {
	s := newValidationServer()
	req := httptest.NewRequest(http.MethodGet, "/api/class-dates", nil)
	w := httptest.NewRecorder()
	s.handleGetClassDates(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}
}
