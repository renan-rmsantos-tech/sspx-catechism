package server

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
	"github.com/rmtech/sspx-catechism/backend/internal/students"
)

// phoneRe mirrors the previous app's guardian-phone format: (DD) NNNN-NNNN or
// (DD) NNNNN-NNNN, with an optional space after the area code.
var phoneRe = regexp.MustCompile(`^\(\d{2}\)\s?\d{4,5}-\d{4}$`)

// emailRe is a pragmatic e-mail check (single @, no spaces), matching the
// leniency of the previous Zod email validation for this form.
var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

type studentResponse struct {
	ID                 string  `json:"id"`
	ClassID            string  `json:"classId"`
	ClassName          *string `json:"className"`
	FullName           string  `json:"fullName"`
	BirthDate          *string `json:"birthDate"`
	City               *string `json:"city"`
	FirstCommunion     bool    `json:"firstCommunion"`
	Confirmation       bool    `json:"confirmation"`
	PreviousCatechism  *string `json:"previousCatechism"`
	ReligiousBooks     *string `json:"religiousBooks"`
	GuardianFatherName *string `json:"guardianFatherName"`
	GuardianMotherName *string `json:"guardianMotherName"`
	GuardianPhone      *string `json:"guardianPhone"`
	GuardianEmail      *string `json:"guardianEmail"`
	IsActive           bool    `json:"isActive"`
}

// toStudentResponse maps a student row to the API DTO. className is nil for the
// create/update responses (which return the bare row, like the previous app) and
// set for the list/detail views that join the class.
func toStudentResponse(st sqlcgen.Student, className *string) studentResponse {
	return studentResponse{
		ID:                 pgconv.UUIDString(st.ID),
		ClassID:            pgconv.UUIDString(st.ClassID),
		ClassName:          className,
		FullName:           st.FullName,
		BirthDate:          pgconv.DateString(st.BirthDate),
		City:               st.City,
		FirstCommunion:     st.FirstCommunion,
		Confirmation:       st.Confirmation,
		PreviousCatechism:  st.PreviousCatechism,
		ReligiousBooks:     st.ReligiousBooks,
		GuardianFatherName: st.GuardianFatherName,
		GuardianMotherName: st.GuardianMotherName,
		GuardianPhone:      st.GuardianPhone,
		GuardianEmail:      st.GuardianEmail,
		IsActive:           st.IsActive,
	}
}

func toStudentWithClassResponse(sw students.StudentWithClass) studentResponse {
	name := sw.ClassName
	return toStudentResponse(sw.Student, &name)
}

func (s *Server) handleListStudents(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	list, err := s.students.Search(r.Context(), q)
	if err != nil {
		s.writeStudentError(w, err)
		return
	}
	out := make([]studentResponse, 0, len(list))
	for _, sw := range list {
		out = append(out, toStudentWithClassResponse(sw))
	}
	httpx.JSON(w, http.StatusOK, out)
}

func (s *Server) handleGetStudent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sw, err := s.students.Get(r.Context(), id)
	if err != nil {
		s.writeStudentError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toStudentWithClassResponse(sw))
}

type createStudentRequest struct {
	ClassID            string  `json:"classId"`
	FullName           string  `json:"fullName"`
	BirthDate          *string `json:"birthDate"`
	City               *string `json:"city"`
	FirstCommunion     bool    `json:"firstCommunion"`
	Confirmation       bool    `json:"confirmation"`
	PreviousCatechism  *string `json:"previousCatechism"`
	ReligiousBooks     *string `json:"religiousBooks"`
	GuardianFatherName *string `json:"guardianFatherName"`
	GuardianMotherName *string `json:"guardianMotherName"`
	GuardianPhone      *string `json:"guardianPhone"`
	GuardianEmail      *string `json:"guardianEmail"`
}

func (s *Server) handleCreateStudent(w http.ResponseWriter, r *http.Request) {
	var req createStudentRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	req.FullName = strings.TrimSpace(req.FullName)
	if req.FullName == "" {
		httpx.Error(w, http.StatusBadRequest, "nome completo é obrigatório")
		return
	}
	if strings.TrimSpace(req.ClassID) == "" {
		httpx.Error(w, http.StatusBadRequest, "turma é obrigatória")
		return
	}

	birthDate, ok := parseBirthDate(w, req.BirthDate)
	if !ok {
		return
	}
	phone, ok := normalizeValidated(w, req.GuardianPhone, phoneRe, "telefone inválido. Use o formato (11) 99999-9999")
	if !ok {
		return
	}
	email, ok := normalizeValidated(w, req.GuardianEmail, emailRe, "e-mail inválido")
	if !ok {
		return
	}

	created, err := s.students.Create(r.Context(), students.CreateInput{
		ClassID:            strings.TrimSpace(req.ClassID),
		FullName:           req.FullName,
		BirthDate:          birthDate,
		City:               normalizeOptional(req.City),
		FirstCommunion:     req.FirstCommunion,
		Confirmation:       req.Confirmation,
		PreviousCatechism:  normalizeOptional(req.PreviousCatechism),
		ReligiousBooks:     normalizeOptional(req.ReligiousBooks),
		GuardianFatherName: normalizeOptional(req.GuardianFatherName),
		GuardianMotherName: normalizeOptional(req.GuardianMotherName),
		GuardianPhone:      phone,
		GuardianEmail:      email,
	})
	if err != nil {
		s.writeStudentError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, toStudentResponse(created, nil))
}

type updateStudentRequest struct {
	ClassID        *string `json:"classId"`
	FullName       *string `json:"fullName"`
	FirstCommunion *bool   `json:"firstCommunion"`
	Confirmation   *bool   `json:"confirmation"`
	// RawMessage distinguishes absent (nil) from explicit null so each nullable
	// field can be cleared as well as set.
	BirthDate          json.RawMessage `json:"birthDate"`
	City               json.RawMessage `json:"city"`
	PreviousCatechism  json.RawMessage `json:"previousCatechism"`
	ReligiousBooks     json.RawMessage `json:"religiousBooks"`
	GuardianFatherName json.RawMessage `json:"guardianFatherName"`
	GuardianMotherName json.RawMessage `json:"guardianMotherName"`
	GuardianPhone      json.RawMessage `json:"guardianPhone"`
	GuardianEmail      json.RawMessage `json:"guardianEmail"`
}

func (s *Server) handleUpdateStudent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateStudentRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}

	in := students.UpdateInput{
		ClassID:        req.ClassID,
		FirstCommunion: req.FirstCommunion,
		Confirmation:   req.Confirmation,
	}
	if req.FullName != nil {
		name := strings.TrimSpace(*req.FullName)
		if name == "" {
			httpx.Error(w, http.StatusBadRequest, "nome completo é obrigatório")
			return
		}
		in.FullName = &name
	}
	if req.ClassID != nil && strings.TrimSpace(*req.ClassID) == "" {
		httpx.Error(w, http.StatusBadRequest, "turma é obrigatória")
		return
	}

	// birth_date: tri-state date field.
	if req.BirthDate != nil {
		d, ok, msg := parseDateField(req.BirthDate)
		if !ok {
			httpx.Error(w, http.StatusBadRequest, msg)
			return
		}
		in.SetBirthDate = true
		in.BirthDate = d
	}

	// Nullable text fields: absent → leave; null/blank → clear; value → set
	// (phone/email validated).
	textFields := []struct {
		raw      json.RawMessage
		validate *regexp.Regexp
		errMsg   string
		set      *bool
		dst      **string
	}{
		{req.City, nil, "", &in.SetCity, &in.City},
		{req.PreviousCatechism, nil, "", &in.SetPreviousCatechism, &in.PreviousCatechism},
		{req.ReligiousBooks, nil, "", &in.SetReligiousBooks, &in.ReligiousBooks},
		{req.GuardianFatherName, nil, "", &in.SetGuardianFatherName, &in.GuardianFatherName},
		{req.GuardianMotherName, nil, "", &in.SetGuardianMotherName, &in.GuardianMotherName},
		{req.GuardianPhone, phoneRe, "telefone inválido. Use o formato (11) 99999-9999", &in.SetGuardianPhone, &in.GuardianPhone},
		{req.GuardianEmail, emailRe, "e-mail inválido", &in.SetGuardianEmail, &in.GuardianEmail},
	}
	for _, f := range textFields {
		val, set, ok := parseOptionalText(f.raw, f.validate)
		if !ok {
			httpx.Error(w, http.StatusBadRequest, f.errMsg)
			return
		}
		*f.set = set
		*f.dst = val
	}

	updated, err := s.students.Update(r.Context(), id, in)
	if err != nil {
		s.writeStudentError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toStudentResponse(updated, nil))
}

// parseBirthDate validates an optional create-time birth date (nil/blank → null).
func parseBirthDate(w http.ResponseWriter, v *string) (pgtype.Date, bool) {
	if v == nil {
		return pgtype.Date{}, true
	}
	str := strings.TrimSpace(*v)
	if str == "" {
		return pgtype.Date{}, true
	}
	if !dateRe.MatchString(str) {
		httpx.Error(w, http.StatusBadRequest, "data de nascimento inválida")
		return pgtype.Date{}, false
	}
	d, err := pgconv.ParseDate(str)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "data de nascimento inválida")
		return pgtype.Date{}, false
	}
	return d, true
}

// normalizeValidated trims an optional create-time field, collapses blank to nil,
// and (when set) checks it against re. Returns (value, ok); ok=false after writing
// a 400 on a validation failure.
func normalizeValidated(w http.ResponseWriter, v *string, re *regexp.Regexp, errMsg string) (*string, bool) {
	n := normalizeOptional(v)
	if n == nil {
		return nil, true
	}
	if !re.MatchString(*n) {
		httpx.Error(w, http.StatusBadRequest, errMsg)
		return nil, false
	}
	return n, true
}

// parseOptionalText decodes a tri-state nullable text field from a RawMessage.
// Returns (value, set, ok): set=false means "leave unchanged" (absent); set=true
// with a nil value means "clear" (explicit null or blank); a non-blank value is
// trimmed and, when re is non-nil, validated. ok=false on an invalid value.
func parseOptionalText(raw json.RawMessage, re *regexp.Regexp) (val *string, set bool, ok bool) {
	if raw == nil {
		return nil, false, true
	}
	if string(raw) == "null" {
		return nil, true, true
	}
	var str string
	if err := json.Unmarshal(raw, &str); err != nil {
		return nil, false, false
	}
	str = strings.TrimSpace(str)
	if str == "" {
		return nil, true, true
	}
	if re != nil && !re.MatchString(str) {
		return nil, false, false
	}
	return &str, true, true
}

// writeStudentError maps domain and Postgres errors to HTTP responses.
func (s *Server) writeStudentError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, students.ErrNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, students.ErrInvalidID):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, students.ErrInvalidReference):
		httpx.Error(w, http.StatusConflict, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}
