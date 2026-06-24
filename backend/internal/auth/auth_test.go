package auth

import (
	"regexp"
	"testing"
	"time"
)

func TestPasswordHashVerify(t *testing.T) {
	hash, err := HashPassword("segredo123")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if !VerifyPassword(hash, "segredo123") {
		t.Error("expected matching password to verify")
	}
	if VerifyPassword(hash, "errado") {
		t.Error("expected wrong password to fail")
	}
}

func TestGeneratePasswordFormat(t *testing.T) {
	re := regexp.MustCompile(`^[a-z]+-[a-z]+-[a-z]+-\d{2}$`)
	for i := 0; i < 50; i++ {
		p := GeneratePassword()
		if !re.MatchString(p) {
			t.Fatalf("unexpected password format: %q", p)
		}
	}
}

func TestJWTRoundtrip(t *testing.T) {
	m := NewManager("test-secret", time.Hour)
	tok, err := m.Issue("user-1", "coordinator", time.Now())
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	claims, err := m.Parse(tok)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.UserID() != "user-1" || claims.Role != "coordinator" {
		t.Errorf("unexpected claims: %+v", claims)
	}
}

func TestJWTExpired(t *testing.T) {
	m := NewManager("test-secret", time.Hour)
	tok, _ := m.Issue("u", "admin", time.Now().Add(-2*time.Hour))
	if _, err := m.Parse(tok); err == nil {
		t.Error("expected expired token to fail")
	}
}

func TestJWTWrongSecret(t *testing.T) {
	tok, _ := NewManager("secret-a", time.Hour).Issue("u", "admin", time.Now())
	if _, err := NewManager("secret-b", time.Hour).Parse(tok); err == nil {
		t.Error("expected token signed with different secret to fail")
	}
}
