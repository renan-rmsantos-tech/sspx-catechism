package httpx_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
)

func okHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}

func authedRequest(m *auth.Manager, userID, role string) *http.Request {
	tok, _ := m.Issue(userID, role, time.Now())
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: httpx.SessionCookie, Value: tok})
	return req
}

func TestRequireAuth(t *testing.T) {
	m := auth.NewManager("s", time.Hour)
	h := httpx.RequireAuth(m)(okHandler())

	t.Run("no cookie → 401", func(t *testing.T) {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("got %d", rec.Code)
		}
	})

	t.Run("valid cookie → 200", func(t *testing.T) {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, authedRequest(m, "u", "catechist"))
		if rec.Code != http.StatusOK {
			t.Errorf("got %d", rec.Code)
		}
	})
}

func TestRequireCoordinator(t *testing.T) {
	m := auth.NewManager("s", time.Hour)
	chain := httpx.RequireAuth(m)(httpx.RequireCoordinator(okHandler()))

	cases := []struct {
		role string
		want int
	}{
		{"catechist", http.StatusForbidden},
		{"coordinator", http.StatusOK},
		{"admin", http.StatusOK},
	}
	for _, c := range cases {
		rec := httptest.NewRecorder()
		chain.ServeHTTP(rec, authedRequest(m, "u", c.role))
		if rec.Code != c.want {
			t.Errorf("role %s: got %d want %d", c.role, rec.Code, c.want)
		}
	}
}
