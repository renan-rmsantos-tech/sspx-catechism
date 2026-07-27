package auth

import "testing"

// Política da UI e do servidor precisam coincidir
// (BUG-20260724-regras-senha-divergentes): ≥6 caracteres, uma letra e um número.
func TestValidatePassword(t *testing.T) {
	cases := []struct {
		pw string
		ok bool
	}{
		{"camila26", true},
		{"graca-luz-altar-42", true},
		{"123456", false},
		{"abcdef", false},
		{"ab1", false},
		{"", false},
	}
	for _, c := range cases {
		err := ValidatePassword(c.pw)
		if (err == nil) != c.ok {
			t.Errorf("ValidatePassword(%q) = %v, want ok=%v", c.pw, err, c.ok)
		}
	}
}
