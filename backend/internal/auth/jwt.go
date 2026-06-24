package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims are the JWT claims carried in the session cookie. UserID lives in the
// standard "sub" claim; Role is custom to avoid a DB hit for coarse authz.
type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func (c Claims) UserID() string { return c.Subject }

// Manager issues and verifies HS256 JWTs.
type Manager struct {
	secret []byte
	ttl    time.Duration
}

func NewManager(secret string, ttl time.Duration) *Manager {
	return &Manager{secret: []byte(secret), ttl: ttl}
}

// TTL is the token lifetime, also used for the cookie MaxAge.
func (m *Manager) TTL() time.Duration { return m.ttl }

// Issue creates a signed token for the given user and role.
func (m *Manager) Issue(userID, role string, now time.Time) (string, error) {
	claims := Claims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(m.secret)
}

// Parse validates a token string and returns its claims.
func (m *Manager) Parse(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}
