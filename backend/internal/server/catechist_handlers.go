package server

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
	"github.com/rmtech/sspx-catechism/backend/internal/users"
)

type catechistResponse struct {
	ID                 string `json:"id"`
	Email              string `json:"email"`
	FullName           string `json:"fullName"`
	Role               string `json:"role"`
	IsActive           bool   `json:"isActive"`
	MustChangePassword bool   `json:"mustChangePassword"`
}

func (s *Server) handleListCatechists(w http.ResponseWriter, r *http.Request) {
	list, err := s.users.ListCatechists(r.Context())
	if err != nil {
		httpx.WriteDBError(w, err)
		return
	}
	out := make([]catechistResponse, 0, len(list))
	for _, p := range list {
		out = append(out, catechistResponse{
			ID:                 pgconv.UUIDString(p.ID),
			Email:              p.Email,
			FullName:           p.FullName,
			Role:               p.Role,
			IsActive:           p.IsActive,
			MustChangePassword: p.MustChangePassword,
		})
	}
	httpx.JSON(w, http.StatusOK, out)
}

type createCatechistRequest struct {
	Email    string `json:"email"`
	FullName string `json:"fullName"`
}

type createCatechistResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"fullName"`
	Password string `json:"password"` // shown once
}

func (s *Server) handleCreateCatechist(w http.ResponseWriter, r *http.Request) {
	var req createCatechistRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.FullName = strings.TrimSpace(req.FullName)
	if req.Email == "" || req.FullName == "" {
		httpx.Error(w, http.StatusBadRequest, "e-mail e nome são obrigatórios")
		return
	}
	plain, p, err := s.users.CreateCatechist(r.Context(), req.Email, req.FullName)
	if err != nil {
		httpx.WriteDBError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, createCatechistResponse{
		ID:       pgconv.UUIDString(p.ID),
		Email:    p.Email,
		FullName: p.FullName,
		Password: plain,
	})
}

type updateCatechistRequest struct {
	Role     *string `json:"role"`
	IsActive *bool   `json:"isActive"`
}

func (s *Server) handleUpdateCatechist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateCatechistRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	if req.Role == nil && req.IsActive == nil {
		httpx.Error(w, http.StatusBadRequest, "informe papel e/ou ativação")
		return
	}
	var role *string
	if req.Role != nil {
		trimmed := strings.TrimSpace(*req.Role)
		role = &trimmed
	}

	p, err := s.users.UpdateCatechist(r.Context(), id, role, req.IsActive)
	switch {
	case err == nil:
		httpx.JSON(w, http.StatusOK, catechistResponse{
			ID:                 pgconv.UUIDString(p.ID),
			Email:              p.Email,
			FullName:           p.FullName,
			Role:               p.Role,
			IsActive:           p.IsActive,
			MustChangePassword: p.MustChangePassword,
		})
	case errors.Is(err, users.ErrAdminImmutable):
		httpx.Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, users.ErrInvalidRole):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, users.ErrInvalidID):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}

func (s *Server) handleDeleteCatechist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := s.users.DeleteCatechist(r.Context(), id)
	switch {
	case err == nil:
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	case errors.Is(err, users.ErrProtectedAdmin):
		httpx.Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, users.ErrHasSessions):
		httpx.Error(w, http.StatusConflict, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}
