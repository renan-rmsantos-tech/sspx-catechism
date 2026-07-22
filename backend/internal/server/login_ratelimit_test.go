package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
	"github.com/rmtech/sspx-catechism/backend/internal/config"
)

// TestLoginRateLimit verifies the per-IP throttle on POST /api/auth/login.
// An empty JSON body makes the handler return 400 before touching the database,
// so no pool is needed — the point is that the limiter counts every attempt and
// starts returning 429 once the window is exceeded.
func TestLoginRateLimit(t *testing.T) {
	jwt := auth.NewManager("test-secret", time.Hour)
	handler := New(config.Config{Env: "development"}, nil, jwt).Router()

	req := func() *httptest.ResponseRecorder {
		r := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{}`))
		r.RemoteAddr = "10.1.2.3:5555"
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		return w
	}

	// The first loginRateLimit attempts are allowed through (400, not 429).
	for i := 0; i < loginRateLimit; i++ {
		if w := req(); w.Code == http.StatusTooManyRequests {
			t.Fatalf("attempt %d unexpectedly rate-limited (429) before the limit", i+1)
		}
	}

	// The next attempt from the same IP must be throttled.
	if w := req(); w.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 after %d attempts, got %d", loginRateLimit, w.Code)
	}

	// A different IP is tracked independently and is still allowed.
	r := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{}`))
	r.RemoteAddr = "10.9.9.9:5555"
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)
	if w.Code == http.StatusTooManyRequests {
		t.Fatalf("a fresh IP should not be rate-limited, got 429")
	}
}
