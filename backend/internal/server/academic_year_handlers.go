package server

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/rmtech/sspx-catechism/backend/internal/academic"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

type academicYearResponse struct {
	ID                 string  `json:"id"`
	Year               int32   `json:"year"`
	IsActive           bool    `json:"isActive"`
	ClassDays          []int32 `json:"classDays"`
	EnrollmentStartsAt *string `json:"enrollmentStartsAt"`
	EnrollmentEndsAt   *string `json:"enrollmentEndsAt"`
}

func toAcademicYearResponse(y sqlcgen.AcademicYear) academicYearResponse {
	return academicYearResponse{
		ID:                 pgconv.UUIDString(y.ID),
		Year:               y.Year,
		IsActive:           y.IsActive,
		ClassDays:          y.ClassDays,
		EnrollmentStartsAt: pgconv.DateString(y.EnrollmentStartsAt),
		EnrollmentEndsAt:   pgconv.DateString(y.EnrollmentEndsAt),
	}
}

// validClassDays ensures every weekday is in range 0–6 (Sun–Sat).
func validClassDays(days []int32) bool {
	for _, d := range days {
		if d < 0 || d > 6 {
			return false
		}
	}
	return true
}

func (s *Server) handleListAcademicYears(w http.ResponseWriter, r *http.Request) {
	list, err := s.years.List(r.Context())
	if err != nil {
		httpx.WriteDBError(w, err)
		return
	}
	out := make([]academicYearResponse, 0, len(list))
	for _, y := range list {
		out = append(out, toAcademicYearResponse(y))
	}
	httpx.JSON(w, http.StatusOK, out)
}

type createAcademicYearRequest struct {
	Year               int32           `json:"year"`
	IsActive           bool            `json:"isActive"`
	ClassDays          []int32         `json:"classDays"`
	EnrollmentStartsAt json.RawMessage `json:"enrollmentStartsAt"`
	EnrollmentEndsAt   json.RawMessage `json:"enrollmentEndsAt"`
}

func (s *Server) handleCreateAcademicYear(w http.ResponseWriter, r *http.Request) {
	var req createAcademicYearRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	if req.Year <= 0 {
		httpx.Error(w, http.StatusBadRequest, "ano letivo deve ser um número inteiro positivo")
		return
	}
	if req.ClassDays == nil {
		req.ClassDays = []int32{6}
	}
	if len(req.ClassDays) == 0 {
		httpx.Error(w, http.StatusBadRequest, "selecione pelo menos um dia da semana")
		return
	}
	if !validClassDays(req.ClassDays) {
		httpx.Error(w, http.StatusBadRequest, "dia da semana inválido (use 0–6)")
		return
	}

	var start, end pgtype.Date
	if req.EnrollmentStartsAt != nil {
		d, ok, msg := parseDateField(req.EnrollmentStartsAt)
		if !ok {
			httpx.Error(w, http.StatusBadRequest, msg)
			return
		}
		start = d
	}
	if req.EnrollmentEndsAt != nil {
		d, ok, msg := parseDateField(req.EnrollmentEndsAt)
		if !ok {
			httpx.Error(w, http.StatusBadRequest, msg)
			return
		}
		end = d
	}
	if start.Valid && end.Valid && !end.Time.After(start.Time) {
		httpx.Error(w, http.StatusBadRequest, "a data de encerramento deve ser posterior à data de abertura")
		return
	}

	year, err := s.years.Create(r.Context(), academic.CreateInput{
		Year:               req.Year,
		IsActive:           req.IsActive,
		ClassDays:          req.ClassDays,
		EnrollmentStartsAt: start,
		EnrollmentEndsAt:   end,
	})
	if err != nil {
		s.writeAcademicYearError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, toAcademicYearResponse(year))
}

type updateAcademicYearRequest struct {
	IsActive  *bool    `json:"isActive"`
	ClassDays *[]int32 `json:"classDays"`
	// RawMessage distinguishes absent (nil) from explicit null ("null") so the
	// enrollment window can be cleared as well as set.
	EnrollmentStartsAt json.RawMessage `json:"enrollmentStartsAt"`
	EnrollmentEndsAt   json.RawMessage `json:"enrollmentEndsAt"`
}

// parseDateField decodes a RawMessage holding a JSON string date or null. It
// returns (date, ok, errMsg): ok=false on an invalid value.
func parseDateField(raw json.RawMessage) (pgtype.Date, bool, string) {
	if string(raw) == "null" {
		return pgtype.Date{}, true, ""
	}
	var str string
	if err := json.Unmarshal(raw, &str); err != nil {
		return pgtype.Date{}, false, "data inválida"
	}
	if !dateRe.MatchString(str) {
		return pgtype.Date{}, false, "data inválida"
	}
	d, err := pgconv.ParseDate(str)
	if err != nil {
		return pgtype.Date{}, false, "data inválida"
	}
	return d, true, ""
}

func (s *Server) handleUpdateAcademicYear(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateAcademicYearRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}

	in := academic.UpdateInput{IsActive: req.IsActive}

	if req.ClassDays != nil {
		days := *req.ClassDays
		if len(days) == 0 {
			httpx.Error(w, http.StatusBadRequest, "selecione pelo menos um dia da semana")
			return
		}
		if !validClassDays(days) {
			httpx.Error(w, http.StatusBadRequest, "dia da semana inválido (use 0–6)")
			return
		}
		in.ClassDays = days
	}

	// Enrollment window: touch only when at least one field is present.
	if req.EnrollmentStartsAt != nil || req.EnrollmentEndsAt != nil {
		in.SetEnrollment = true
		var start, end pgtype.Date
		if req.EnrollmentStartsAt != nil {
			d, ok, msg := parseDateField(req.EnrollmentStartsAt)
			if !ok {
				httpx.Error(w, http.StatusBadRequest, msg)
				return
			}
			start = d
		}
		if req.EnrollmentEndsAt != nil {
			d, ok, msg := parseDateField(req.EnrollmentEndsAt)
			if !ok {
				httpx.Error(w, http.StatusBadRequest, msg)
				return
			}
			end = d
		}
		if start.Valid && end.Valid && !end.Time.After(start.Time) {
			httpx.Error(w, http.StatusBadRequest, "a data de encerramento deve ser posterior à data de abertura")
			return
		}
		in.EnrollmentStartsAt = &start
		in.EnrollmentEndsAt = &end
	}

	year, err := s.years.Update(r.Context(), id, in)
	if err != nil {
		s.writeAcademicYearError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toAcademicYearResponse(year))
}

func (s *Server) handleDeleteAcademicYear(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := s.years.Delete(r.Context(), id); err != nil {
		s.writeAcademicYearError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// writeAcademicYearError maps domain and Postgres errors to HTTP responses,
// preserving the specific conflict messages the previous app returned.
func (s *Server) writeAcademicYearError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, academic.ErrNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, academic.ErrHasDependencies):
		httpx.Error(w, http.StatusConflict, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}
