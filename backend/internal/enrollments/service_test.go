package enrollments

import (
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func date(t *testing.T, s string) pgtype.Date {
	t.Helper()
	tm, err := time.Parse("2006-01-02", s)
	if err != nil {
		t.Fatalf("parse date %q: %v", s, err)
	}
	return pgtype.Date{Time: tm, Valid: true}
}

func TestWithinWindow(t *testing.T) {
	start := date(t, "2026-01-10")
	end := date(t, "2026-02-20")
	null := pgtype.Date{}

	cases := []struct {
		name  string
		today string
		start pgtype.Date
		end   pgtype.Date
		want  bool
	}{
		{"before window", "2026-01-09", start, end, false},
		{"on start (inclusive)", "2026-01-10", start, end, true},
		{"inside window", "2026-01-31", start, end, true},
		{"on end (inclusive)", "2026-02-20", start, end, true},
		{"after window", "2026-02-21", start, end, false},
		{"null start", "2026-01-31", null, end, false},
		{"null end", "2026-01-31", start, null, false},
		{"both null", "2026-01-31", null, null, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := withinWindow(c.today, c.start, c.end); got != c.want {
				t.Fatalf("withinWindow(%q, %v, %v) = %v, want %v", c.today, c.start, c.end, got, c.want)
			}
		})
	}
}
