package users

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rmtech/sspx-catechism/backend/internal/database"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

// TestBootstrapAdminIsCreateOnly locks in the A2 fix: the startup bootstrap
// must not overwrite an existing admin's password unless force is set, so a
// password changed in the app survives the next deploy.
func TestBootstrapAdminIsCreateOnly(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run bootstrap integration tests")
	}
	if err := database.Migrate(url); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	if _, err := pool.Exec(ctx, `TRUNCATE profiles RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	svc := NewService(pool)
	const email = "admin@example.com"

	// First boot creates the admin with the env password.
	if err := svc.BootstrapAdmin(ctx, email, "original-pass", false); err != nil {
		t.Fatalf("initial bootstrap: %v", err)
	}
	p, err := svc.Authenticate(ctx, email, "original-pass")
	if err != nil {
		t.Fatalf("expected login with original password to succeed: %v", err)
	}

	// Simulate the admin changing the password in the app.
	if err := svc.ChangePassword(ctx, pgconv.UUIDString(p.ID), "changed-in-app"); err != nil {
		t.Fatalf("change password: %v", err)
	}

	// A redeploy runs bootstrap again with the OLD env password, force=false.
	// The in-app password must NOT be reverted.
	if err := svc.BootstrapAdmin(ctx, email, "original-pass", false); err != nil {
		t.Fatalf("redeploy bootstrap: %v", err)
	}
	if _, err := svc.Authenticate(ctx, email, "changed-in-app"); err != nil {
		t.Fatalf("in-app password should still work after redeploy: %v", err)
	}
	if _, err := svc.Authenticate(ctx, email, "original-pass"); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("env password should NOT have been restored, got err=%v", err)
	}

	// force=true is the explicit escape hatch: it resets to the env password.
	if err := svc.BootstrapAdmin(ctx, email, "original-pass", true); err != nil {
		t.Fatalf("forced bootstrap: %v", err)
	}
	if _, err := svc.Authenticate(ctx, email, "original-pass"); err != nil {
		t.Fatalf("forced reset should restore the env password: %v", err)
	}
}
