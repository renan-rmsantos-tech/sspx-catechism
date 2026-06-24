package authz_test

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/authz"
	"github.com/rmtech/sspx-catechism/backend/internal/database"
	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
)

// TestCanAccessClassIntegration exercises CanAccessClass against a real Postgres,
// proving the fine-grained check actually consults class_catechists. It is gated
// on TEST_DATABASE_URL so it is skipped on machines/CI without a database.
func TestCanAccessClassIntegration(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run the authz integration test")
	}

	if err := database.Migrate(url); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	// Clean slate for repeatable runs.
	if _, err := pool.Exec(ctx, `TRUNCATE class_catechists, classes, academic_years, profiles RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	var ownCatechist, otherCatechist, year, ownClass, otherClass string
	mustScan := func(q string, args ...any) string {
		var id string
		if err := pool.QueryRow(ctx, q, args...).Scan(&id); err != nil {
			t.Fatalf("seed %q: %v", q, err)
		}
		return id
	}
	ownCatechist = mustScan(
		`INSERT INTO profiles (email, password_hash, full_name, role) VALUES ('own@x.test','h','Own','catechist') RETURNING id`)
	otherCatechist = mustScan(
		`INSERT INTO profiles (email, password_hash, full_name, role) VALUES ('other@x.test','h','Other','catechist') RETURNING id`)
	year = mustScan(`INSERT INTO academic_years (year) VALUES (2026) RETURNING id`)
	ownClass = mustScan(
		`INSERT INTO classes (academic_year_id, name) VALUES ($1,'A') RETURNING id`, year)
	otherClass = mustScan(
		`INSERT INTO classes (academic_year_id, name) VALUES ($1,'B') RETURNING id`, year)
	if _, err := pool.Exec(ctx,
		`INSERT INTO class_catechists (class_id, catechist_id) VALUES ($1,$2)`, ownClass, ownCatechist); err != nil {
		t.Fatalf("assign catechist: %v", err)
	}

	a := authz.New(sqlcgen.New(pool))

	cases := []struct {
		name      string
		role      string
		userID    string
		classID   string
		wantOK    bool
		wantError bool
	}{
		{"catechist of the class allowed", "catechist", ownCatechist, ownClass, true, false},
		{"catechist of another class denied", "catechist", ownCatechist, otherClass, false, false},
		{"unrelated catechist denied", "catechist", otherCatechist, ownClass, false, false},
		{"coordinator allowed anywhere", "coordinator", otherCatechist, ownClass, true, false},
		{"admin allowed anywhere", "admin", otherCatechist, otherClass, true, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			ok, err := a.CanAccessClass(ctx, claims(c.role, c.userID), c.classID)
			if (err != nil) != c.wantError {
				t.Fatalf("error = %v, wantError %v", err, c.wantError)
			}
			if ok != c.wantOK {
				t.Errorf("CanAccessClass = %v, want %v", ok, c.wantOK)
			}
		})
	}
}
