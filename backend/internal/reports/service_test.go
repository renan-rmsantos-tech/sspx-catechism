package reports

import (
	"bytes"
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"

	"github.com/rmtech/sspx-catechism/backend/internal/database"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

func sampleReportData() Data {
	return Data{
		ClassName: "Turma A",
		From:      "2026-01-01",
		To:        "2026-01-31",
		Students: []Student{
			{ID: "student-a", FullName: "Alice"},
			{ID: "student-b", FullName: "Bruno"},
		},
		Sessions: []Session{
			{ID: "session-1", Date: "2026-01-08"},
			{ID: "session-2", Date: "2026-01-15"},
		},
		Records: []Record{
			{SessionID: "session-1", StudentID: "student-a", Present: true},
			{SessionID: "session-2", StudentID: "student-a", Present: false},
			{SessionID: "session-1", StudentID: "student-b", Present: true},
		},
	}
}

func TestCellValueAndStudentStats(t *testing.T) {
	data := sampleReportData()

	if got := CellValue("student-a", "session-1", data.Records); got != "P" {
		t.Fatalf("present cell = %q, want P", got)
	}
	if got := CellValue("student-a", "session-2", data.Records); got != "F" {
		t.Fatalf("absent cell = %q, want F", got)
	}
	if got := CellValue("student-b", "session-2", data.Records); got != "-" {
		t.Fatalf("missing cell = %q, want -", got)
	}

	stats := StudentStats("student-a", data.Sessions, data.Records)
	if stats.Present != 1 || stats.Absent != 1 || stats.Percent != "50%" {
		t.Fatalf("student-a stats = %+v, want 1 present, 1 absent, 50%%", stats)
	}

	stats = StudentStats("student-b", data.Sessions, data.Records)
	if stats.Present != 1 || stats.Absent != 1 || stats.Percent != "50%" {
		t.Fatalf("student-b stats = %+v, want missing session counted absent", stats)
	}
}

func TestTableRowsAggregateByStudentAndPeriod(t *testing.T) {
	rows := tableRows(sampleReportData())
	want := [][]string{
		{"Alice", "P", "F", "1", "1", "50%"},
		{"Bruno", "P", "-", "1", "1", "50%"},
	}
	if len(rows) != len(want) {
		t.Fatalf("rows = %d, want %d", len(rows), len(want))
	}
	for i := range want {
		for j := range want[i] {
			if rows[i][j] != want[i][j] {
				t.Fatalf("rows[%d][%d] = %q, want %q (rows=%v)", i, j, rows[i][j], want[i][j], rows)
			}
		}
	}
}

func TestPDFAndXLSXRenderNonEmptyFiles(t *testing.T) {
	now := time.Date(2026, 1, 20, 12, 0, 0, 0, time.UTC)
	pdf, err := PDF(sampleReportData(), now)
	if err != nil {
		t.Fatalf("PDF error: %v", err)
	}
	if len(pdf) == 0 || !bytes.HasPrefix(pdf, []byte("%PDF")) {
		t.Fatalf("PDF output invalid: len=%d prefix=%q", len(pdf), pdf[:min(4, len(pdf))])
	}

	xlsx, err := XLSX(sampleReportData(), now)
	if err != nil {
		t.Fatalf("XLSX error: %v", err)
	}
	if len(xlsx) == 0 {
		t.Fatal("XLSX output is empty")
	}
	wb, err := excelize.OpenReader(bytes.NewReader(xlsx))
	if err != nil {
		t.Fatalf("open XLSX: %v", err)
	}
	defer wb.Close()
	if got := wb.GetSheetList()[0]; got != "Presença" {
		t.Fatalf("sheet = %q, want Presença", got)
	}
	cell, err := wb.GetCellValue("Presença", "A6")
	if err != nil {
		t.Fatalf("cell A6: %v", err)
	}
	if cell != "Alice" {
		t.Fatalf("A6 = %q, want Alice", cell)
	}
}

func TestBuildAggregatesReportData(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run reports integration tests")
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
	if _, err := pool.Exec(ctx, `TRUNCATE profiles, academic_years RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	const catechistID = "10000000-0000-0000-0000-000000000001"
	var yearID, classID, studentA, studentB, sessionIn, sessionOut string
	mustScan := func(dst *string, q string, args ...any) {
		t.Helper()
		if err := pool.QueryRow(ctx, q, args...).Scan(dst); err != nil {
			t.Fatalf("seed %q: %v", q, err)
		}
	}
	mustExec := func(q string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, q, args...); err != nil {
			t.Fatalf("seed %q: %v", q, err)
		}
	}

	mustScan(&yearID, `INSERT INTO academic_years (year, is_active, class_days) VALUES (2026, true, '{6}') RETURNING id`)
	mustExec(`INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES ($1,'cat@test','x','Cat','catechist')`, catechistID)
	mustScan(&classID, `INSERT INTO classes (academic_year_id, name) VALUES ($1,'Turma Relatório') RETURNING id`, yearID)
	mustScan(&studentB, `INSERT INTO students (class_id, full_name) VALUES ($1,'Bruno') RETURNING id`, classID)
	mustScan(&studentA, `INSERT INTO students (class_id, full_name) VALUES ($1,'Alice') RETURNING id`, classID)
	mustScan(&sessionIn, `INSERT INTO attendance_sessions (class_id, date, catechist_id) VALUES ($1,'2026-03-07',$2) RETURNING id`, classID, catechistID)
	mustScan(&sessionOut, `INSERT INTO attendance_sessions (class_id, date, catechist_id) VALUES ($1,'2026-04-04',$2) RETURNING id`, classID, catechistID)
	mustExec(`INSERT INTO attendance_records (session_id, student_id, present) VALUES ($1,$2,true),($1,$3,false),($4,$2,true)`,
		sessionIn, studentA, studentB, sessionOut)

	classUUID, err := pgconv.ParseUUID(classID)
	if err != nil {
		t.Fatalf("class uuid: %v", err)
	}
	from, err := pgconv.ParseDate("2026-03-01")
	if err != nil {
		t.Fatalf("from: %v", err)
	}
	to, err := pgconv.ParseDate("2026-03-31")
	if err != nil {
		t.Fatalf("to: %v", err)
	}

	data, err := NewService(pool).Build(ctx, classUUID, from, to)
	if err != nil {
		t.Fatalf("Build: %v", err)
	}
	if data.ClassName != "Turma Relatório" || len(data.Students) != 2 || len(data.Sessions) != 1 || len(data.Records) != 2 {
		t.Fatalf("data = %+v", data)
	}
	if data.Students[0].FullName != "Alice" || data.Students[1].FullName != "Bruno" {
		t.Fatalf("student order = %+v", data.Students)
	}
	if data.Sessions[0].ID != sessionIn || data.Sessions[0].Date != "2026-03-07" {
		t.Fatalf("sessions = %+v, want only in-period session %s", data.Sessions, sessionIn)
	}
	for _, rec := range data.Records {
		if rec.SessionID == sessionOut {
			t.Fatalf("out-of-period record included: %+v", rec)
		}
	}
}
