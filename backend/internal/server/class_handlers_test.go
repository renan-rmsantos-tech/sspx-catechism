package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCreateClassValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"missing name", `{"academicYearId":"00000000-0000-0000-0000-000000000001"}`},
		{"blank name", `{"name":"   ","academicYearId":"00000000-0000-0000-0000-000000000001"}`},
		{"missing academic year", `{"name":"Turma A"}`},
		{"unknown field", `{"name":"Turma A","academicYearId":"00000000-0000-0000-0000-000000000001","foo":1}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/classes", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleCreateClass(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestUpdateClassValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"blank name", `{"name":"   "}`},
		{"unknown field", `{"bogus":true}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPatch, "/api/classes/x", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleUpdateClass(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestNormalizeOptional(t *testing.T) {
	str := func(s string) *string { return &s }
	cases := []struct {
		name string
		in   *string
		want *string
	}{
		{"nil stays nil", nil, nil},
		{"blank collapses to nil", str("   "), nil},
		{"value trimmed", str("  Manhã  "), str("Manhã")},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := normalizeOptional(c.in)
			switch {
			case c.want == nil && got != nil:
				t.Fatalf("got %q, want nil", *got)
			case c.want != nil && got == nil:
				t.Fatalf("got nil, want %q", *c.want)
			case c.want != nil && *got != *c.want:
				t.Fatalf("got %q, want %q", *got, *c.want)
			}
		})
	}
}
