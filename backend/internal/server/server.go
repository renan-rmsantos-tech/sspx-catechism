// Package server wires the chi router, middleware and handlers for the API.
package server

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/academic"
	"github.com/rmtech/sspx-catechism/backend/internal/attendance"
	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/authz"
	"github.com/rmtech/sspx-catechism/backend/internal/calendar"
	"github.com/rmtech/sspx-catechism/backend/internal/classes"
	"github.com/rmtech/sspx-catechism/backend/internal/config"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/enrollments"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/students"
	"github.com/rmtech/sspx-catechism/backend/internal/users"
)

// Server holds shared dependencies for handlers.
type Server struct {
	cfg         config.Config
	pool        *pgxpool.Pool
	jwt         *auth.Manager
	users       *users.Service
	years       *academic.Service
	classes     *classes.Service
	students    *students.Service
	calendar    *calendar.Service
	enrollments *enrollments.Service
	attendance  *attendance.Service
	authz       authz.Authorizer
}

func New(cfg config.Config, pool *pgxpool.Pool, jwt *auth.Manager) *Server {
	// Authorizer replaces RLS; consumed by class/student/attendance routes
	// (tasks 06/07/11) via authz.RequireClassAccess and the attendance service.
	authorizer := authz.New(sqlcgen.New(pool))
	return &Server{
		cfg:         cfg,
		pool:        pool,
		jwt:         jwt,
		users:       users.NewService(pool),
		years:       academic.NewService(pool),
		classes:     classes.NewService(pool),
		students:    students.NewService(pool),
		calendar:    calendar.NewService(pool),
		enrollments: enrollments.NewService(pool),
		attendance:  attendance.NewService(pool, authorizer),
		authz:       authorizer,
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

		// Public enrollment submission (no auth — equivalent to the old
		// service-role client); the active-year window is enforced server-side.
		r.Post("/enrollments", s.handleSubmitEnrollment)

		// Authenticated
		r.Group(func(r chi.Router) {
			r.Use(httpx.RequireAuth(s.jwt))
			r.Get("/auth/me", s.handleMe)
			r.Post("/auth/change-password", s.handleChangePassword)

			// Academic years: listing is open to any authenticated user.
			r.Get("/academic-years", s.handleListAcademicYears)

			// Class-date calendar: reading is open to any authenticated user;
			// replacing the set is coordinator-only (below).
			r.Get("/class-dates", s.handleGetClassDates)

			// Classes: listing is scoped per role by the service (coordinator
			// sees all, catechist only their own); the student roster is gated
			// per class by the Authorizer (replacing RLS).
			r.Get("/classes", s.handleListClasses)
			r.With(authz.RequireClassAccess(s.authz, "id")).
				Get("/classes/{id}/students", s.handleListClassStudents)

			// Attendance: idempotent offline sync + scoped read. Open to any
			// authenticated user; the per-session class write scope and the
			// per-role read scope are enforced inside the service.
			r.Post("/attendance", s.handleSyncAttendance)
			r.Get("/attendance", s.handleListAttendance)

			// Coordinator-only
			r.Group(func(r chi.Router) {
				r.Use(httpx.RequireCoordinator)
				r.Get("/catechists", s.handleListCatechists)
				r.Post("/catechists", s.handleCreateCatechist)
				r.Patch("/catechists/{id}", s.handleUpdateCatechist)
				r.Delete("/catechists/{id}", s.handleDeleteCatechist)

				r.Post("/academic-years", s.handleCreateAcademicYear)
				r.Patch("/academic-years/{id}", s.handleUpdateAcademicYear)
				r.Delete("/academic-years/{id}", s.handleDeleteAcademicYear)

				r.Put("/class-dates", s.handleUpdateClassDates)

				r.Post("/classes", s.handleCreateClass)
				r.Patch("/classes/{id}", s.handleUpdateClass)

				// Students: coordinator-only CRUD + name search.
				r.Get("/students", s.handleListStudents)
				r.Post("/students", s.handleCreateStudent)
				r.Get("/students/{id}", s.handleGetStudent)
				r.Patch("/students/{id}", s.handleUpdateStudent)

				// Enrollments review: coordinator lists by status and
				// approves/rejects (the public submit lives outside auth above).
				r.Get("/enrollments", s.handleListEnrollments)
				r.Post("/enrollments/{id}/approve", s.handleApproveEnrollment)
				r.Post("/enrollments/{id}/reject", s.handleRejectEnrollment)
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
