// Package server wires the chi router, middleware and handlers for the API.
package server

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/academic"
	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/authz"
	"github.com/rmtech/sspx-catechism/backend/internal/config"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/users"
)

// Server holds shared dependencies for handlers.
type Server struct {
	cfg   config.Config
	pool  *pgxpool.Pool
	jwt   *auth.Manager
	users *users.Service
	years *academic.Service
	authz authz.Authorizer
}

func New(cfg config.Config, pool *pgxpool.Pool, jwt *auth.Manager) *Server {
	return &Server{
		cfg:   cfg,
		pool:  pool,
		jwt:   jwt,
		users: users.NewService(pool),
		years: academic.NewService(pool),
		// Authorizer replaces RLS; consumed by class/student/attendance routes
		// (tasks 06/07/11) via authz.RequireClassAccess.
		authz: authz.New(sqlcgen.New(pool)),
	}
}

// Router builds the HTTP handler tree.
func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", s.handleHealth)

		// Auth
		r.Post("/auth/login", s.handleLogin)
		r.Post("/auth/logout", s.handleLogout)

		// Authenticated
		r.Group(func(r chi.Router) {
			r.Use(httpx.RequireAuth(s.jwt))
			r.Get("/auth/me", s.handleMe)
			r.Post("/auth/change-password", s.handleChangePassword)

			// Academic years: listing is open to any authenticated user.
			r.Get("/academic-years", s.handleListAcademicYears)

			// Coordinator-only
			r.Group(func(r chi.Router) {
				r.Use(httpx.RequireCoordinator)
				r.Get("/catechists", s.handleListCatechists)
				r.Post("/catechists", s.handleCreateCatechist)
				r.Delete("/catechists/{id}", s.handleDeleteCatechist)

				r.Post("/academic-years", s.handleCreateAcademicYear)
				r.Patch("/academic-years/{id}", s.handleUpdateAcademicYear)
				r.Delete("/academic-years/{id}", s.handleDeleteAcademicYear)
			})
		})
	})

	return r
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if err := s.pool.Ping(r.Context()); err != nil {
		httpx.Error(w, http.StatusServiceUnavailable, "db indisponível")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// setSessionCookie writes the JWT as an httpOnly cookie.
func (s *Server) setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     httpx.SessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   s.cfg.IsProduction(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(s.jwt.TTL().Seconds()),
	})
}

func (s *Server) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     httpx.SessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.cfg.IsProduction(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
