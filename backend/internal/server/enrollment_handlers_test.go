package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSubmitEnrollmentValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"too short full name", `{"fullName":"Ab","guardianPhone":"(11) 99999-9999","guardianEmail":"a@b.com"}`},
		{"blank full name", `{"fullName":"   ","guardianPhone":"(11) 99999-9999","guardianEmail":"a@b.com"}`},
		{"missing phone", `{"fullName":"Ana Clara","guardianEmail":"a@b.com"}`},
		{"bad phone", `{"fullName":"Ana Clara","guardianPhone":"11999999999","guardianEmail":"a@b.com"}`},
		{"missing email", `{"fullName":"Ana Clara","guardianPhone":"(11) 99999-9999"}`},
		{"bad email", `{"fullName":"Ana Clara","guardianPhone":"(11) 99999-9999","guardianEmail":"nope"}`},
		{"bad birth date", `{"fullName":"Ana Clara","guardianPhone":"(11) 99999-9999","guardianEmail":"a@b.com","birthDate":"20/06/2015"}`},
		{"unknown field", `{"fullName":"Ana Clara","guardianPhone":"(11) 99999-9999","guardianEmail":"a@b.com","foo":1}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/enrollments", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleSubmitEnrollment(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestListEnrollmentsBadStatus(t *testing.T) {
	s := newValidationServer()
	req := httptest.NewRequest(http.MethodGet, "/api/enrollments?status=bogus", nil)
	w := httptest.NewRecorder()
	s.handleListEnrollments(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}
}

func TestApproveEnrollmentRequiresClass(t *testing.T) {
	s := newValidationServer()
	req := httptest.NewRequest(http.MethodPost, "/api/enrollments/x/approve", strings.NewReader(`{"classId":"  "}`))
	w := httptest.NewRecorder()
	s.handleApproveEnrollment(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
	}
}
