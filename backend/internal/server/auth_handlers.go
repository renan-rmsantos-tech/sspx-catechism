package server

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
	"github.com/rmtech/sspx-catechism/backend/internal/users"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Role               string `json:"role"`
	MustChangePassword bool   `json:"mustChangePassword"`
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		httpx.Error(w, http.StatusBadRequest, "e-mail e senha são obrigatórios")
		return
	}

	p, err := s.users.Authenticate(r.Context(), req.Email, req.Password)
	if err != nil {
		switch {
		case errors.Is(err, users.ErrInvalidCredentials):
			httpx.Error(w, http.StatusUnauthorized, "credenciais inválidas")
		case errors.Is(err, users.ErrInactive):
			httpx.Error(w, http.StatusForbidden, "usuário inativo")
		default:
			httpx.Error(w, http.StatusInternalServerError, "erro interno")
		}
		return
	}

	token, err := s.jwt.Issue(pgconv.UUIDString(p.ID), p.Role, time.Now())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "erro ao gerar sessão")
		return
	}
	s.setSessionCookie(w, token)
	httpx.JSON(w, http.StatusOK, loginResponse{Role: p.Role, MustChangePassword: p.MustChangePassword})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	s.clearSessionCookie(w)
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type meResponse struct {
	ID                 string `json:"id"`
	Email              string `json:"email"`
	FullName           string `json:"fullName"`
	Role               string `json:"role"`
	MustChangePassword bool   `json:"mustChangePassword"`
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	claims, _ := httpx.ClaimsFrom(r.Context())
	p, err := s.users.ProfileByID(r.Context(), claims.UserID())
	if err != nil {
		httpx.WriteDBError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, meResponse{
		ID:                 pgconv.UUIDString(p.ID),
		Email:              p.Email,
		FullName:           p.FullName,
		Role:               p.Role,
		MustChangePassword: p.MustChangePassword,
	})
}

type changePasswordRequest struct {
	NewPassword string `json:"newPassword"`
}

func (s *Server) handleChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, _ := httpx.ClaimsFrom(r.Context())
	var req changePasswordRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	if len(req.NewPassword) < 6 {
		httpx.Error(w, http.StatusBadRequest, "a senha deve ter ao menos 6 caracteres")
		return
	}
	if err := s.users.ChangePassword(r.Context(), claims.UserID(), req.NewPassword); err != nil {
		httpx.WriteDBError(w, err)
		return
	}
	// Re-issue token (role unchanged) and refresh cookie.
	token, err := s.jwt.Issue(claims.UserID(), claims.Role, time.Now())
	if err == nil {
		s.setSessionCookie(w, token)
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
