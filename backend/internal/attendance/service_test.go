package attendance

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/rmtech/sspx-catechism/backend/internal/auth"
)

// fakeAuthz lets the DB-free error paths (bad ids, denial, lookup error) be
// exercised without a Postgres. allow/err drive CanAccessClass; priv drives
// IsCoordinator.
type fakeAuthz struct {
	allow bool
	err   error
	priv  bool
}

func (f fakeAuthz) IsCoordinator(auth.Claims) bool { return f.priv }
func (f fakeAuthz) CanAccessClass(context.Context, auth.Claims, string) (bool, error) {
	return f.allow, f.err
}

func claims(role, userID string) auth.Claims {
	c := auth.Claims{Role: role}
	c.Subject = userID
	return c
}

const (
	validUUID = "20000000-0000-0000-0000-000000000001"
	otherUUID = "20000000-0000-0000-0000-000000000002"
)

// TestSyncEarlyErrors covers the validation/authz branches that return before any
// database call, so they need no Postgres (pool is nil).
func TestSyncEarlyErrors(t *testing.T) {
	ctx := context.Background()

	t.Run("bad catechist claims", func(t *testing.T) {
		s := NewService(nil, fakeAuthz{allow: true})
		if _, err := s.Sync(ctx, claims("catechist", "not-a-uuid"), nil); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})

	t.Run("bad class id", func(t *testing.T) {
		s := NewService(nil, fakeAuthz{allow: true})
		in := []SessionInput{{ClassID: "nope", Date: "2026-03-07"}}
		if _, err := s.Sync(ctx, claims("catechist", validUUID), in); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})

	t.Run("bad date", func(t *testing.T) {
		s := NewService(nil, fakeAuthz{allow: true})
		in := []SessionInput{{ClassID: validUUID, Date: "bad"}}
		if _, err := s.Sync(ctx, claims("catechist", validUUID), in); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})

	t.Run("authz lookup error surfaces", func(t *testing.T) {
		boom := errors.New("boom")
		s := NewService(nil, fakeAuthz{err: boom})
		in := []SessionInput{{ClassID: validUUID, Date: "2026-03-07"}}
		if _, err := s.Sync(ctx, claims("catechist", validUUID), in); !errors.Is(err, boom) {
			t.Fatalf("err = %v, want boom", err)
		}
	})

	t.Run("denied class is skipped, not an error", func(t *testing.T) {
		s := NewService(nil, fakeAuthz{allow: false})
		in := []SessionInput{{ClassID: validUUID, Date: "2026-03-07"}}
		res, err := s.Sync(ctx, claims("catechist", validUUID), in)
		if err != nil {
			t.Fatalf("err = %v, want nil", err)
		}
		if res.Synced != 0 || res.Skipped != 1 {
			t.Fatalf("res = %+v, want {0 1}", res)
		}
	})
}

// TestListEarlyErrors covers the filter/claims parse errors that return before any
// database call.
func TestListEarlyErrors(t *testing.T) {
	ctx := context.Background()
	s := NewService(nil, fakeAuthz{priv: true})

	t.Run("bad viewer claims", func(t *testing.T) {
		if _, err := s.List(ctx, claims("coordinator", "bad"), ListFilter{}); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})
	t.Run("bad class filter", func(t *testing.T) {
		if _, err := s.List(ctx, claims("coordinator", validUUID), ListFilter{ClassID: "bad"}); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})
	t.Run("bad from filter", func(t *testing.T) {
		if _, err := s.List(ctx, claims("coordinator", validUUID), ListFilter{From: "bad"}); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})
	t.Run("bad to filter", func(t *testing.T) {
		if _, err := s.List(ctx, claims("coordinator", validUUID), ListFilter{To: "bad"}); !errors.Is(err, ErrInvalidID) {
			t.Fatalf("err = %v, want ErrInvalidID", err)
		}
	})
}

func TestSplitRecords(t *testing.T) {
	ids, presents, err := splitRecords([]RecordInput{
		{StudentID: validUUID, Present: true},
		{StudentID: otherUUID, Present: false},
	})
	if err != nil {
		t.Fatalf("err = %v", err)
	}
	if len(ids) != 2 || len(presents) != 2 || presents[0] != true || presents[1] != false {
		t.Fatalf("split = %v / %v", ids, presents)
	}
	if _, _, err := splitRecords([]RecordInput{{StudentID: "nope"}}); !errors.Is(err, ErrInvalidID) {
		t.Fatalf("bad student id err = %v, want ErrInvalidID", err)
	}
}

func TestDerefDate(t *testing.T) {
	if got := derefDate(pgtype.Date{}); got != "" {
		t.Fatalf("null date = %q, want empty", got)
	}
	d, err := pgtypeDate("2026-03-07")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got := derefDate(d); got != "2026-03-07" {
		t.Fatalf("date = %q, want 2026-03-07", got)
	}
}

// pgtypeDate is a tiny test helper mirroring pgconv.ParseDate without importing it
// for a one-off, keeping the deref test self-contained.
func pgtypeDate(s string) (pgtype.Date, error) {
	var d pgtype.Date
	err := d.Scan(s)
	return d, err
}
