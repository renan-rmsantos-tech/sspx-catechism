package httpx

import (
	"context"
	"net/http"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
)

// SessionCookie is the name of the httpOnly JWT cookie.
const SessionCookie = "session"

type ctxKey int

const claimsKey ctxKey = iota

// Authenticator validates session cookies. Implemented by *auth.Manager.
type Authenticator interface {
	Parse(token string) (*auth.Claims, error)
}

// RequireAuth validates the session cookie and injects claims into the context.
func RequireAuth(a Authenticator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(SessionCookie)
			if err != nil || c.Value == "" {
				Error(w, http.StatusUnauthorized, "não autenticado")
				return
			}
			claims, err := a.Parse(c.Value)
			if err != nil {
				Error(w, http.StatusUnauthorized, "sessão inválida")
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireCoordinator allows only coordinator/admin roles. Must run after RequireAuth.
func RequireCoordinator(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := ClaimsFrom(r.Context())
		if !ok {
			Error(w, http.StatusUnauthorized, "não autenticado")
			return
		}
		if claims.Role != "coordinator" && claims.Role != "admin" {
			Error(w, http.StatusForbidden, "acesso restrito a coordenadores")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ClaimsFrom extracts the authenticated claims from the request context.
func ClaimsFrom(ctx context.Context) (*auth.Claims, bool) {
	c, ok := ctx.Value(claimsKey).(*auth.Claims)
	return c, ok
}

// WithClaims returns a copy of ctx carrying the given claims, as RequireAuth
// does. Exposed so downstream middleware and tests can populate the context.
func WithClaims(ctx context.Context, c *auth.Claims) context.Context {
	return context.WithValue(ctx, claimsKey, c)
}
