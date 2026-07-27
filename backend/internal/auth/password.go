package auth

import (
	"crypto/rand"
	"errors"
	"math/big"
	"strings"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// ValidatePassword aplica a política prometida na UI de troca de senha:
// mínimo de 6 caracteres, pelo menos uma letra e um número
// (BUG-20260724-regras-senha-divergentes).
func ValidatePassword(plain string) error {
	if len(plain) < 6 {
		return errors.New("a senha deve ter ao menos 6 caracteres")
	}
	var hasLetter, hasDigit bool
	for _, r := range plain {
		switch {
		case unicode.IsLetter(r):
			hasLetter = true
		case unicode.IsDigit(r):
			hasDigit = true
		}
	}
	if !hasLetter || !hasDigit {
		return errors.New("a senha deve conter ao menos uma letra e um número")
	}
	return nil
}

// HashPassword returns a bcrypt hash of the plaintext password.
func HashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(b), err
}

// VerifyPassword reports whether plain matches the stored bcrypt hash.
func VerifyPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// memorable word list for generated catechist passwords (pt-BR), mirroring the
// previous "palavra-palavra-palavra##" format.
var words = []string{
	"agua", "anjo", "altar", "bispo", "calice", "cruz", "fe", "graca",
	"hostia", "igreja", "luz", "missa", "oracao", "paz", "reino", "santo",
	"vela", "vida", "vinho", "amor", "ceu", "dom", "esperanca", "gloria",
}

// GeneratePassword produces a memorable password like "graca-luz-altar-42".
func GeneratePassword() string {
	parts := make([]string, 3)
	for i := range parts {
		parts[i] = words[randInt(len(words))]
	}
	return strings.Join(parts, "-") + "-" + twoDigits()
}

func randInt(n int) int {
	v, err := rand.Int(rand.Reader, big.NewInt(int64(n)))
	if err != nil {
		return 0
	}
	return int(v.Int64())
}

func twoDigits() string {
	d := randInt(90) + 10 // 10..99
	return string(rune('0'+d/10)) + string(rune('0'+d%10))
}
