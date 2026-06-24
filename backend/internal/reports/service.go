// Package reports builds and renders attendance reports.
package reports

import (
	"bytes"
	"context"
	"fmt"
	"math"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/xuri/excelize/v2"

	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

// Service reads report data from Postgres through sqlc.
type Service struct {
	q *sqlcgen.Queries
}

func NewService(db sqlcgen.DBTX) *Service {
	return &Service{q: sqlcgen.New(db)}
}

// Student mirrors the legacy report JSON contract.
type Student struct {
	ID       string `json:"id"`
	FullName string `json:"full_name"`
}

// Session mirrors the legacy report JSON contract.
type Session struct {
	ID   string `json:"id"`
	Date string `json:"date"`
}

// Record mirrors the legacy report JSON contract.
type Record struct {
	SessionID string `json:"session_id"`
	StudentID string `json:"student_id"`
	Present   bool   `json:"present"`
}

// Data is the report payload returned as JSON and used by the PDF/XLSX renderers.
type Data struct {
	ClassName string    `json:"className"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Students  []Student `json:"students"`
	Sessions  []Session `json:"sessions"`
	Records   []Record  `json:"records"`
}

// Build gathers class, students, sessions and records for the inclusive period.
func (s *Service) Build(ctx context.Context, classID pgtype.UUID, from, to pgtype.Date) (Data, error) {
	className, err := s.q.GetReportClass(ctx, classID)
	if err != nil {
		return Data{}, err
	}

	studentRows, err := s.q.ListReportStudents(ctx, classID)
	if err != nil {
		return Data{}, err
	}
	students := make([]Student, 0, len(studentRows))
	for _, row := range studentRows {
		students = append(students, Student{ID: pgconv.UUIDString(row.ID), FullName: row.FullName})
	}

	sessionRows, err := s.q.ListReportSessions(ctx, sqlcgen.ListReportSessionsParams{
		ClassID:  classID,
		FromDate: from,
		ToDate:   to,
	})
	if err != nil {
		return Data{}, err
	}
	sessions := make([]Session, 0, len(sessionRows))
	sessionIDs := make([]pgtype.UUID, 0, len(sessionRows))
	for _, row := range sessionRows {
		sessions = append(sessions, Session{ID: pgconv.UUIDString(row.ID), Date: derefDate(row.Date)})
		sessionIDs = append(sessionIDs, row.ID)
	}

	records := []Record{}
	if len(sessionIDs) > 0 {
		recordRows, err := s.q.ListReportRecords(ctx, sessionIDs)
		if err != nil {
			return Data{}, err
		}
		records = make([]Record, 0, len(recordRows))
		for _, row := range recordRows {
			records = append(records, Record{
				SessionID: pgconv.UUIDString(row.SessionID),
				StudentID: pgconv.UUIDString(row.StudentID),
				Present:   row.Present,
			})
		}
	}

	return Data{
		ClassName: className,
		From:      derefDate(from),
		To:        derefDate(to),
		Students:  students,
		Sessions:  sessions,
		Records:   records,
	}, nil
}

// CellValue returns the legacy table value for one student/session: P, F or -.
func CellValue(studentID, sessionID string, records []Record) string {
	for _, rec := range records {
		if rec.StudentID == studentID && rec.SessionID == sessionID {
			if rec.Present {
				return "P"
			}
			return "F"
		}
	}
	return "-"
}

// Stats mirrors the old report calculation: any non-present session counts as an
// absence, including a missing record.
type Stats struct {
	Present int
	Absent  int
	Percent string
}

func StudentStats(studentID string, sessions []Session, records []Record) Stats {
	present := 0
	for _, rec := range records {
		if rec.StudentID == studentID && rec.Present {
			present++
		}
	}
	return statsFromPresentCount(present, len(sessions))
}

func tableRows(data Data) [][]string {
	type key struct {
		studentID string
		sessionID string
	}
	values := make(map[key]string, len(data.Records))
	presentByStudent := make(map[string]int, len(data.Students))
	for _, rec := range data.Records {
		cell := "F"
		if rec.Present {
			cell = "P"
			presentByStudent[rec.StudentID]++
		}
		values[key{studentID: rec.StudentID, sessionID: rec.SessionID}] = cell
	}

	rows := make([][]string, 0, len(data.Students))
	for _, student := range data.Students {
		stats := statsFromPresentCount(presentByStudent[student.ID], len(data.Sessions))
		row := make([]string, 0, len(data.Sessions)+4)
		row = append(row, student.FullName)
		for _, session := range data.Sessions {
			cell, ok := values[key{studentID: student.ID, sessionID: session.ID}]
			if !ok {
				cell = "-"
			}
			row = append(row, cell)
		}
		row = append(row, fmt.Sprint(stats.Present), fmt.Sprint(stats.Absent), stats.Percent)
		rows = append(rows, row)
	}
	return rows
}

func statsFromPresentCount(present, sessionCount int) Stats {
	if sessionCount == 0 {
		return Stats{Percent: "-"}
	}
	return Stats{
		Present: present,
		Absent:  sessionCount - present,
		Percent: fmt.Sprintf("%d%%", int(math.Round((float64(present)/float64(sessionCount))*100))),
	}
}

// PDF renders the attendance report as a landscape PDF.
func PDF(data Data, generatedAt time.Time) ([]byte, error) {
	doc := fpdf.New("L", "mm", "A4", "")
	doc.SetTitle("Relatório de presença", false)
	doc.SetMargins(10, 10, 10)
	doc.AddPage()
	doc.SetFont("Helvetica", "B", 14)
	doc.CellFormat(0, 7, data.ClassName, "", 1, "L", false, 0, "")
	doc.SetFont("Helvetica", "", 10)
	doc.CellFormat(0, 5, fmt.Sprintf("Período: %s a %s", data.From, data.To), "", 1, "L", false, 0, "")
	doc.CellFormat(0, 5, "Gerado em: "+generatedAt.Format("02/01/2006"), "", 1, "L", false, 0, "")
	doc.Ln(3)

	headers := make([]string, 0, len(data.Sessions)+4)
	headers = append(headers, "Aluno")
	for _, session := range data.Sessions {
		if len(session.Date) >= 10 {
			headers = append(headers, session.Date[5:])
		} else {
			headers = append(headers, session.Date)
		}
	}
	headers = append(headers, "Presenças", "Faltas", "%")

	pageWidth, _ := doc.GetPageSize()
	left, _, right, _ := doc.GetMargins()
	usable := pageWidth - left - right
	fixed := []float64{42, 20, 16, 12}
	sessionW := 14.0
	if len(data.Sessions) > 0 {
		remaining := usable - fixed[0] - fixed[1] - fixed[2] - fixed[3]
		sessionW = math.Max(7, remaining/float64(len(data.Sessions)))
	}
	widths := []float64{fixed[0]}
	for range data.Sessions {
		widths = append(widths, sessionW)
	}
	widths = append(widths, fixed[1], fixed[2], fixed[3])

	doc.SetFont("Helvetica", "B", 7)
	for i, h := range headers {
		doc.CellFormat(widths[i], 6, h, "1", 0, "C", false, 0, "")
	}
	doc.Ln(-1)

	doc.SetFont("Helvetica", "", 7)
	for _, row := range tableRows(data) {
		for i, cell := range row {
			align := "C"
			if i == 0 {
				align = "L"
			}
			doc.CellFormat(widths[i], 6, cell, "1", 0, align, false, 0, "")
		}
		doc.Ln(-1)
	}

	var buf bytes.Buffer
	if err := doc.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// XLSX renders the attendance report as an Excel workbook.
func XLSX(data Data, generatedAt time.Time) ([]byte, error) {
	f := excelize.NewFile()
	const sheet = "Presença"
	idx, err := f.NewSheet(sheet)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(idx)
	_ = f.DeleteSheet("Sheet1")

	rows := [][]any{
		{data.ClassName},
		{fmt.Sprintf("Período: %s a %s", data.From, data.To)},
		{"Gerado em: " + generatedAt.Format("02/01/2006")},
		{},
	}
	header := []any{"Aluno"}
	for _, session := range data.Sessions {
		header = append(header, session.Date)
	}
	header = append(header, "Presenças", "Faltas", "%")
	rows = append(rows, header)
	for _, row := range tableRows(data) {
		out := make([]any, 0, len(row))
		for _, cell := range row {
			out = append(out, cell)
		}
		rows = append(rows, out)
	}

	for r, row := range rows {
		cell, err := excelize.CoordinatesToCellName(1, r+1)
		if err != nil {
			return nil, err
		}
		if err := f.SetSheetRow(sheet, cell, &row); err != nil {
			return nil, err
		}
	}
	f.SetColWidth(sheet, "A", "A", 28)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func derefDate(d pgtype.Date) string {
	if s := pgconv.DateString(d); s != nil {
		return *s
	}
	return ""
}
