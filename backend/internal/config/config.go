package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds runtime configuration loaded from environment variables.
type Config struct {
	DatabaseURL   string
	JWTSecret     string
	AdminEmail    string
	AdminPassword string
	// AdminForceReset, when true, makes the startup bootstrap overwrite an
	// existing admin's password/role/active state from ADMIN_PASSWORD. Default
	// false: the admin is only ever created if missing, so a password changed
	// in the app is never silently reverted on the next deploy.
	AdminForceReset bool
	Port            string
	Env             string
}

// Load reads configuration from the environment, applying defaults and
// validating required values.
func Load() (Config, error) {
	// Optional .env in the working directory (e.g. backend/.env for local dev).
	// Existing environment variables take precedence (Docker, CI, export).
	_ = godotenv.Load()

	c := Config{
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		AdminEmail:      os.Getenv("ADMIN_EMAIL"),
		AdminPassword:   os.Getenv("ADMIN_PASSWORD"),
		AdminForceReset: os.Getenv("ADMIN_FORCE_RESET") == "true",
		Port:            getenv("PORT", "8080"),
		Env:             getenv("APP_ENV", "development"),
	}
	if c.DatabaseURL == "" {
		return c, fmt.Errorf("DATABASE_URL is required")
	}
	if c.JWTSecret == "" {
		return c, fmt.Errorf("JWT_SECRET is required")
	}
	return c, nil
}

// IsProduction reports whether the app runs in production mode (affects cookie
// Secure flag, etc).
func (c Config) IsProduction() bool { return c.Env == "production" }

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
