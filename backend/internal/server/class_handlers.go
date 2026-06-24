package server

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/rmtech/sspx-catechism/backend/internal/classes"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

type classResponse struct {
	ID             string   `json:"id"`
	AcademicYearID string   `json:"academicYearId"`
	Name           string   `json:"name"`
	Level          *string  `json:"level"`
	Schedule       *string  `json:"schedule"`
	IsArchived     bool     `json:"isArchived"`
	CatechistIDs   []string `json:"catechistIds"`
}

func toClassResponse(cw classes.ClassWithCatechists) classResponse {
	ids := cw.CatechistIDs
	if ids == nil {
		ids = []string{}
	}
	return classResponse{
		ID:             pgconv.UUIDString(cw.Class.ID),
		AcademicYearID: pgconv.UUIDString(cw.Class.AcademicYearID),
		Name:           cw.Class.Name,
		Level:          cw.Class.Level,
		Schedule:       cw.Class.Schedule,
		IsArchived:     cw.Class.IsArchived,
		CatechistIDs:   ids,
	}
}

func (s *Server) handleListClasses(w http.ResponseWriter, r *http.Request) {
	claims, ok := httpx.ClaimsFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "não autenticado")
		return
	}
	list, err := s.classes.List(r.Context(), *claims)
	if err != nil {
		s.writeClassError(w, err)
		return
	}
	out := make([]classResponse, 0, len(list))
	for _, cw := range list {
		out = append(out, toClassResponse(cw))
	}
	httpx.JSON(w, http.StatusOK, out)
}

type createClassRequest struct {
	Name           string   `json:"name"`
	AcademicYearID string   `json:"academicYearId"`
	Level          *string  `json:"level"`
	Schedule       *string  `json:"schedule"`
	CatechistIDs   []string `json:"catechistIds"`
}

func (s *Server) handleCreateClass(w http.ResponseWriter, r *http.Request) {
	var req createClassRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "nome da turma é obrigatório")
		return
	}
	if req.AcademicYearID == "" {
		httpx.Error(w, http.StatusBadRequest, "ano letivo é obrigatório")
		return
	}

	created, err := s.classes.Create(r.Context(), classes.CreateInput{
		Name:           req.Name,
		AcademicYearID: req.AcademicYearID,
		Level:          normalizeOptional(req.Level),
		Schedule:       normalizeOptional(req.Schedule),
		CatechistIDs:   req.CatechistIDs,
	})
	if err != nil {
		s.writeClassError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, toClassResponse(created))
}

type updateClassRequest struct {
	Name           *string   `json:"name"`
	AcademicYearID *string   `json:"academicYearId"`
	Level          *string   `json:"level"`
	Schedule       *string   `json:"schedule"`
	IsArchived     *bool     `json:"isArchived"`
	CatechistIDs   *[]string `json:"catechistIds"`
}

func (s *Server) handleUpdateClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateClassRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}

	in := classes.UpdateInput{
		AcademicYearID: req.AcademicYearID,
		Level:          req.Level,
		Schedule:       req.Schedule,
		IsArchived:     req.IsArchived,
	}
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			httpx.Error(w, http.StatusBadRequest, "nome da turma é obrigatório")
			return
		}
		in.Name = &name
	}
	if req.CatechistIDs != nil {
		in.ReplaceCatechists = true
		in.CatechistIDs = *req.CatechistIDs
	}

	updated, err := s.classes.Update(r.Context(), id, in)
	if err != nil {
		s.writeClassError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toClassResponse(updated))
}

type classStudentResponse struct {
	ID             string  `json:"id"`
	ClassID        string  `json:"classId"`
	FullName       string  `json:"fullName"`
	BirthDate      *string `json:"birthDate"`
	City           *string `json:"city"`
	FirstCommunion bool    `json:"firstCommunion"`
	Confirmation   bool    `json:"confirmation"`
	IsActive       bool    `json:"isActive"`
}

func toClassStudentResponse(st sqlcgen.Student) classStudentResponse {
	return classStudentResponse{
		ID:             pgconv.UUIDString(st.ID),
		ClassID:        pgconv.UUIDString(st.ClassID),
		FullName:       st.FullName,
		BirthDate:      pgconv.DateString(st.BirthDate),
		City:           st.City,
		FirstCommunion: st.FirstCommunion,
		Confirmation:   st.Confirmation,
		IsActive:       st.IsActive,
	}
}

func (s *Server) handleListClassStudents(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	list, err := s.classes.ListStudents(r.Context(), id)
	if err != nil {
		s.writeClassError(w, err)
		return
	}
	out := make([]classStudentResponse, 0, len(list))
	for _, st := range list {
		out = append(out, toClassStudentResponse(st))
	}
	httpx.JSON(w, http.StatusOK, out)
}

// normalizeOptional trims an optional string field and collapses an empty result
// to nil, so a blank level/schedule is stored as SQL NULL rather than "".
func normalizeOptional(v *string) *string {
	if v == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*v)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

// writeClassError maps domain and Postgres errors to HTTP responses.
func (s *Server) writeClassError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, classes.ErrNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, classes.ErrInvalidID):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, classes.ErrInvalidReference):
		httpx.Error(w, http.StatusConflict, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}
