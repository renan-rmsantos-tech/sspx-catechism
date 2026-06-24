package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
)

func TestCreateStudentValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"missing full name", `{"classId":"00000000-0000-0000-0000-000000000001"}`},
		{"blank full name", `{"classId":"00000000-0000-0000-0000-000000000001","fullName":"   "}`},
		{"missing class id", `{"fullName":"Ana Clara"}`},
		{"blank class id", `{"classId":"  ","fullName":"Ana Clara"}`},
		{"bad birth date", `{"classId":"00000000-0000-0000-0000-000000000001","fullName":"Ana","birthDate":"32/13/2020"}`},
		{"bad phone", `{"classId":"00000000-0000-0000-0000-000000000001","fullName":"Ana","guardianPhone":"11999999999"}`},
		{"bad email", `{"classId":"00000000-0000-0000-0000-000000000001","fullName":"Ana","guardianEmail":"not-an-email"}`},
		{"unknown field", `{"classId":"00000000-0000-0000-0000-000000000001","fullName":"Ana","foo":1}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/students", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleCreateStudent(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestUpdateStudentValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"blank full name", `{"fullName":"   "}`},
		{"blank class id", `{"classId":"  "}`},
		{"bad birth date", `{"birthDate":"2020/01/01"}`},
		{"bad phone", `{"guardianPhone":"abc"}`},
		{"bad email", `{"guardianEmail":"nope"}`},
		{"unknown field", `{"bogus":true}`},
		{"invalid json", `{`},
	}
	s := newValidationServer()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPatch, "/api/students/x", strings.NewReader(c.body))
			w := httptest.NewRecorder()
			s.handleUpdateStudent(w, req)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestParseOptionalText(t *testing.T) {
	cases := []struct {
		name    string
		raw     string
		re      *regexp.Regexp
		wantVal *string
		wantSet bool
		wantOK  bool
	}{
		{"absent leaves unchanged", "", nil, nil, false, true},
		{"explicit null clears", "null", nil, nil, true, true},
		{"blank string clears", `"   "`, nil, nil, true, true},
		{"value trimmed and set", `"  São Paulo  "`, nil, strptr("São Paulo"), true, true},
		{"valid phone", `"(11) 99999-9999"`, phoneRe, strptr("(11) 99999-9999"), true, true},
		{"invalid phone rejected", `"11999999999"`, phoneRe, nil, false, false},
		{"valid email", `"mae@exemplo.com"`, emailRe, strptr("mae@exemplo.com"), true, true},
		{"invalid email rejected", `"bad-email"`, emailRe, nil, false, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var raw json.RawMessage
			if c.raw != "" {
				raw = json.RawMessage(c.raw)
			}
			val, set, ok := parseOptionalText(raw, c.re)
			if ok != c.wantOK {
				t.Fatalf("ok = %v, want %v", ok, c.wantOK)
			}
			if set != c.wantSet {
				t.Fatalf("set = %v, want %v", set, c.wantSet)
			}
			switch {
			case c.wantVal == nil && val != nil:
				t.Fatalf("val = %q, want nil", *val)
			case c.wantVal != nil && val == nil:
				t.Fatalf("val = nil, want %q", *c.wantVal)
			case c.wantVal != nil && *val != *c.wantVal:
				t.Fatalf("val = %q, want %q", *val, *c.wantVal)
			}
		})
	}
}

func TestParseBirthDate(t *testing.T) {
	str := func(s string) *string { return &s }

	// nil → null, no error.
	if d, ok := parseBirthDate(httptest.NewRecorder(), nil); !ok || d.Valid {
		t.Fatalf("nil birthDate: ok=%v valid=%v, want ok=true valid=false", ok, d.Valid)
	}
	// blank → null, no error.
	if d, ok := parseBirthDate(httptest.NewRecorder(), str("  ")); !ok || d.Valid {
		t.Fatalf("blank birthDate: ok=%v valid=%v, want ok=true valid=false", ok, d.Valid)
	}
	// valid ISO date → set.
	if d, ok := parseBirthDate(httptest.NewRecorder(), str("2010-05-15")); !ok || !d.Valid {
		t.Fatalf("valid birthDate: ok=%v valid=%v, want ok=true valid=true", ok, d.Valid)
	}
	// malformed → 400.
	w := httptest.NewRecorder()
	if _, ok := parseBirthDate(w, str("15/05/2010")); ok || w.Code != http.StatusBadRequest {
		t.Fatalf("bad birthDate: ok=%v status=%d, want ok=false status=400", ok, w.Code)
	}
}

func strptr(s string) *string { return &s }
