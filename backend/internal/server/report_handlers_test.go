package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestParseReportQuery(t *testing.T) {
	valid := "/api/reports/attendance?classId=" + lenientUUIDA + "&from=2026-01-01&to=2026-01-31&format=json"
	req := httptest.NewRequest(http.MethodGet, valid, nil)
	w := httptest.NewRecorder()
	q, ok := parseReportQuery(w, req)
	if !ok {
		t.Fatalf("valid query rejected: status=%d body=%q", w.Code, w.Body.String())
	}
	if q.ClassID != lenientUUIDA || q.From != "2026-01-01" || q.To != "2026-01-31" || q.Format != "json" {
		t.Fatalf("query = %+v", q)
	}

	cases := []string{
		"classId=bad&from=2026-01-01&to=2026-01-31&format=json",
		"classId=" + lenientUUIDA + "&from=bad&to=2026-01-31&format=json",
		"classId=" + lenientUUIDA + "&from=2026-01-01&to=bad&format=json",
		"classId=" + lenientUUIDA + "&from=2026-02-01&to=2026-01-31&format=json",
		"classId=" + lenientUUIDA + "&from=2026-01-01&to=2026-01-31&format=csv",
	}
	for _, qs := range cases {
		t.Run(qs, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/reports/attendance?"+qs, nil)
			w := httptest.NewRecorder()
			if _, ok := parseReportQuery(w, req); ok {
				t.Fatalf("query %q accepted, want rejection", qs)
			}
			if w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", w.Code, w.Body.String())
			}
		})
	}
}

func TestReportFilename(t *testing.T) {
	got := reportFilename(reportQuery{From: "2026-01-01", To: "2026-01-31"}, "pdf")
	if got != "relatorio-2026-01-01-2026-01-31.pdf" {
		t.Fatalf("filename = %q", got)
	}
}

func TestWriteReportFileHeaders(t *testing.T) {
	w := httptest.NewRecorder()
	writeReportFile(w, contentTypePDF, "relatorio.pdf", []byte("%PDF"))
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if got := w.Header().Get("Content-Type"); got != contentTypePDF {
		t.Fatalf("content-type = %q, want %q", got, contentTypePDF)
	}
	if got := w.Header().Get("Content-Disposition"); !strings.Contains(got, `attachment; filename="relatorio.pdf"`) {
		t.Fatalf("content-disposition = %q", got)
	}
	if got := w.Body.String(); got != "%PDF" {
		t.Fatalf("body = %q", got)
	}
}
