package server

import (
	"errors"
	"net/http"

	"github.com/rmtech/sspx-catechism/backend/internal/calendar"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
)

type calendarResponse struct {
	Dates       []string `json:"dates"`
	LockedDates []string `json:"lockedDates"`
}

// handleGetClassDates returns the scheduled dates of an academic year plus the
// locked subset (dates already bearing attendance). Open to any authenticated
// user. The year is selected by the academicYearId query param.
func (s *Server) handleGetClassDates(w http.ResponseWriter, r *http.Request) {
	yearID := r.URL.Query().Get("academicYearId")
	if yearID == "" {
		httpx.Error(w, http.StatusBadRequest, "academicYearId é obrigatório")
		return
	}
	cal, err := s.calendar.Get(r.Context(), yearID)
	if err != nil {
		s.writeCalendarError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, calendarResponse{Dates: cal.Dates, LockedDates: cal.LockedDates})
}

type updateClassDatesRequest struct {
	AcademicYearID string   `json:"academicYearId"`
	Dates          []string `json:"dates"`
}

// handleUpdateClassDates replaces the full date set of a year (coordinator-only).
// Each date is validated against the year's class_days and locked dates may not be
// removed; the swap runs in a transaction.
func (s *Server) handleUpdateClassDates(w http.ResponseWriter, r *http.Request) {
	var req updateClassDatesRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	if req.AcademicYearID == "" {
		httpx.Error(w, http.StatusBadRequest, "academicYearId é obrigatório")
		return
	}
	if !validDateStrings(req.Dates) {
		httpx.Error(w, http.StatusBadRequest, "data inválida. Use o formato YYYY-MM-DD")
		return
	}
	count, err := s.calendar.Replace(r.Context(), req.AcademicYearID, req.Dates)
	if err != nil {
		s.writeCalendarError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]int{"count": count})
}

// validDateStrings checks the YYYY-MM-DD shape of every entry (DTO-level), leaving
// calendar/weekday rules to the service.
func validDateStrings(dates []string) bool {
	for _, d := range dates {
		if !dateRe.MatchString(d) {
			return false
		}
	}
	return true
}

// writeCalendarError maps calendar domain errors to HTTP responses.
func (s *Server) writeCalendarError(w http.ResponseWriter, err error) {
	var verr *calendar.ValidationError
	switch {
	case errors.As(err, &verr):
		httpx.Error(w, http.StatusBadRequest, verr.Msg)
	case errors.Is(err, calendar.ErrNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}
