package server

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
	"github.com/rmtech/sspx-catechism/backend/internal/reports"
)

const (
	reportFormatJSON = "json"
	reportFormatPDF  = "pdf"
	reportFormatXLSX = "xlsx"

	contentTypePDF  = "application/pdf"
	contentTypeXLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

type reportQuery struct {
	ClassID string
	From    string
	To      string
	Format  string
}

// handleAttendanceReport returns a coordinator-only attendance report in JSON,
// PDF or XLSX. The JSON shape intentionally mirrors the legacy report endpoint so
// the migrated frontend can keep its preview helpers.
func (s *Server) handleAttendanceReport(w http.ResponseWriter, r *http.Request) {
	q, ok := parseReportQuery(w, r)
	if !ok {
		return
	}

	classID, err := pgconv.ParseUUID(q.ClassID)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "classId inválido")
		return
	}
	from, err := pgconv.ParseDate(q.From)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "parâmetro 'from' inválido. Use o formato YYYY-MM-DD")
		return
	}
	to, err := pgconv.ParseDate(q.To)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "parâmetro 'to' inválido. Use o formato YYYY-MM-DD")
		return
	}

	data, err := s.reports.Build(r.Context(), classID, from, to)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Error(w, http.StatusNotFound, "turma não encontrada")
			return
		}
		httpx.WriteDBError(w, err)
		return
	}

	switch q.Format {
	case reportFormatJSON:
		httpx.JSON(w, http.StatusOK, data)
	case reportFormatPDF:
		buf, err := reports.PDF(data, time.Now())
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "erro ao gerar PDF")
			return
		}
		writeReportFile(w, contentTypePDF, reportFilename(q, "pdf"), buf)
	case reportFormatXLSX:
		buf, err := reports.XLSX(data, time.Now())
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "erro ao gerar XLSX")
			return
		}
		writeReportFile(w, contentTypeXLSX, reportFilename(q, "xlsx"), buf)
	}
}

func parseReportQuery(w http.ResponseWriter, r *http.Request) (reportQuery, bool) {
	values := r.URL.Query()
	q := reportQuery{
		ClassID: values.Get("classId"),
		From:    values.Get("from"),
		To:      values.Get("to"),
		Format:  values.Get("format"),
	}
	if !lenientUUID(q.ClassID) {
		httpx.Error(w, http.StatusBadRequest, "classId inválido")
		return reportQuery{}, false
	}
	if !dateRe.MatchString(q.From) {
		httpx.Error(w, http.StatusBadRequest, "parâmetro 'from' inválido. Use o formato YYYY-MM-DD")
		return reportQuery{}, false
	}
	if !dateRe.MatchString(q.To) {
		httpx.Error(w, http.StatusBadRequest, "parâmetro 'to' inválido. Use o formato YYYY-MM-DD")
		return reportQuery{}, false
	}
	if q.From > q.To {
		httpx.Error(w, http.StatusBadRequest, "from must be <= to")
		return reportQuery{}, false
	}
	switch q.Format {
	case reportFormatJSON, reportFormatPDF, reportFormatXLSX:
	default:
		httpx.Error(w, http.StatusBadRequest, "formato inválido")
		return reportQuery{}, false
	}
	return q, true
}

func writeReportFile(w http.ResponseWriter, contentType, filename string, buf []byte) {
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(buf)
}

func reportFilename(q reportQuery, ext string) string {
	return fmt.Sprintf("relatorio-%s-%s.%s", q.From, q.To, ext)
}
