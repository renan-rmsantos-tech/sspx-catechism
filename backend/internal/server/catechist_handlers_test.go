package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// Validation paths reject before any DB access, so a nil-backed Server suffices.
func TestUpdateCatechistValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"empty object", `{}`},
		{"both fields null", `{"role":null,"isActive":null}`},
		{"unknown field", `{"bogus":true}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPatch, "/api/catechists/x", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleUpdateCatechist(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}
