package calendar

import (
	"testing"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

func mustDate(t *testing.T, s string) pgtype.Date {
	t.Helper()
	d, err := pgconv.ParseDate(s)
	if err != nil {
		t.Fatalf("parse %s: %v", s, err)
	}
	return d
}

func TestValidationErrorMessage(t *testing.T) {
	err := &ValidationError{Msg: "boom"}
	if err.Error() != "boom" {
		t.Fatalf("Error() = %q, want %q", err.Error(), "boom")
	}
}

func TestInvalidWeekdays(t *testing.T) {
	// 2026-02-07 is a Saturday (DOW 6); 2026-02-04 a Wednesday (3); 2026-02-08 a Sunday (0).
	cases := []struct {
		name    string
		dates   []string
		allowed []int32
		want    []string
	}{
		{"all allowed (saturdays)", []string{"2026-02-07", "2026-02-14"}, []int32{6}, nil},
		{"wednesday not allowed", []string{"2026-02-04"}, []int32{6}, []string{"2026-02-04"}},
		{"mixed", []string{"2026-02-07", "2026-02-04", "2026-02-08"}, []int32{6}, []string{"2026-02-04", "2026-02-08"}},
		{"multiple allowed days", []string{"2026-02-04", "2026-02-07"}, []int32{3, 6}, nil},
		{"empty allowed rejects all", []string{"2026-02-07"}, []int32{}, []string{"2026-02-07"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			dates := make([]pgtype.Date, 0, len(c.dates))
			for _, s := range c.dates {
				dates = append(dates, mustDate(t, s))
			}
			got := invalidWeekdays(dates, c.allowed)
			if len(got) != len(c.want) {
				t.Fatalf("invalidWeekdays = %v, want %v", got, c.want)
			}
			for i := range got {
				if got[i] != c.want[i] {
					t.Fatalf("invalidWeekdays = %v, want %v", got, c.want)
				}
			}
		})
	}
}

func TestRemovedLocked(t *testing.T) {
	locked := []pgtype.Date{mustDate(t, "2026-02-07"), mustDate(t, "2026-02-14")}
	cases := []struct {
		name     string
		proposed []string
		want     []string
	}{
		{"all kept", []string{"2026-02-07", "2026-02-14", "2026-02-21"}, nil},
		{"one removed", []string{"2026-02-07"}, []string{"2026-02-14"}},
		{"all removed", []string{"2026-02-21"}, []string{"2026-02-07", "2026-02-14"}},
		{"empty proposed removes all", nil, []string{"2026-02-07", "2026-02-14"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			proposed := make([]pgtype.Date, 0, len(c.proposed))
			for _, s := range c.proposed {
				proposed = append(proposed, mustDate(t, s))
			}
			got := removedLocked(locked, proposed)
			if len(got) != len(c.want) {
				t.Fatalf("removedLocked = %v, want %v", got, c.want)
			}
			for i := range got {
				if got[i] != c.want[i] {
					t.Fatalf("removedLocked = %v, want %v", got, c.want)
				}
			}
		})
	}
}

func TestParseDates(t *testing.T) {
	t.Run("dedupes preserving order", func(t *testing.T) {
		got, err := parseDates([]string{"2026-02-07", "2026-02-14", "2026-02-07"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 2 {
			t.Fatalf("len = %d, want 2 (deduped)", len(got))
		}
	})
	t.Run("rejects bad date", func(t *testing.T) {
		if _, err := parseDates([]string{"2026-13-40"}); err == nil {
			t.Fatal("expected error for impossible date")
		}
	})
}
