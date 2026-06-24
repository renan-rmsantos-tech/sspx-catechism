package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/xuri/excelize/v2"
)

func TestAttendanceReportFormats(t *testing.T) {
	e := setupAttendanceEnv(t)
	e.do(http.MethodPost, "/api/attendance", e.catA, "catechist",
		syncBody("30000000-0000-0000-0000-000000000012", e.classA, e.schedDate, e.catA,
			[2]string{e.studentA1, "true"}, [2]string{e.studentA2, "false"}))

	base := "/api/reports/attendance?classId=" + e.classA + "&from=2026-03-01&to=2026-03-31"

	t.Run("json", func(t *testing.T) {
		w := e.do(http.MethodGet, base+"&format=json", "00000000-0000-0000-0000-0000000000aa", "coordinator", "")
		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200 (body=%q)", w.Code, w.Body.String())
		}
		if got := w.Header().Get("Content-Type"); got != "application/json" {
			t.Fatalf("content-type = %q, want application/json", got)
		}
		var data struct {
			ClassName string `json:"className"`
			Students  []struct {
				ID       string `json:"id"`
				FullName string `json:"full_name"`
			} `json:"students"`
			Sessions []struct {
				ID   string `json:"id"`
				Date string `json:"date"`
			} `json:"sessions"`
			Records []struct {
				SessionID string `json:"session_id"`
				StudentID string `json:"student_id"`
				Present   bool   `json:"present"`
			} `json:"records"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &data); err != nil {
			t.Fatalf("decode JSON: %v", err)
		}
		if data.ClassName != "A" || len(data.Students) != 2 || len(data.Sessions) != 1 || len(data.Records) != 2 {
			t.Fatalf("report JSON = %+v", data)
		}
	})

	t.Run("pdf", func(t *testing.T) {
		w := e.do(http.MethodGet, base+"&format=pdf", "00000000-0000-0000-0000-0000000000aa", "coordinator", "")
		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200 (body=%q)", w.Code, w.Body.String())
		}
		if got := w.Header().Get("Content-Type"); got != contentTypePDF {
			t.Fatalf("content-type = %q, want %q", got, contentTypePDF)
		}
		if got := w.Header().Get("Content-Disposition"); !strings.Contains(got, ".pdf") {
			t.Fatalf("content-disposition = %q, want pdf attachment", got)
		}
		if !bytes.HasPrefix(w.Body.Bytes(), []byte("%PDF")) {
			t.Fatalf("PDF prefix = %q", w.Body.Bytes()[:min(4, w.Body.Len())])
		}
	})

	t.Run("xlsx", func(t *testing.T) {
		w := e.do(http.MethodGet, base+"&format=xlsx", "00000000-0000-0000-0000-0000000000aa", "coordinator", "")
		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200 (body=%q)", w.Code, w.Body.String())
		}
		if got := w.Header().Get("Content-Type"); got != contentTypeXLSX {
			t.Fatalf("content-type = %q, want %q", got, contentTypeXLSX)
		}
		if got := w.Header().Get("Content-Disposition"); !strings.Contains(got, ".xlsx") {
			t.Fatalf("content-disposition = %q, want xlsx attachment", got)
		}
		wb, err := excelize.OpenReader(bytes.NewReader(w.Body.Bytes()))
		if err != nil {
			t.Fatalf("open xlsx: %v", err)
		}
		defer wb.Close()
		if len(wb.GetSheetList()) == 0 {
			t.Fatal("xlsx has no sheets")
		}
	})
}

func TestAttendanceReportCoordinatorOnly(t *testing.T) {
	e := setupAttendanceEnv(t)
	path := "/api/reports/attendance?classId=" + e.classA + "&from=2026-03-01&to=2026-03-31&format=json"
	if w := e.do(http.MethodGet, path, "", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous status = %d, want 401", w.Code)
	}
	if w := e.do(http.MethodGet, path, e.catA, "catechist", ""); w.Code != http.StatusForbidden {
		t.Fatalf("catechist status = %d, want 403", w.Code)
	}
}
