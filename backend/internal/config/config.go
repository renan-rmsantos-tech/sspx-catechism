package config

import (
	"fmt"
	"os"
)

// Config holds runtime configuration loaded from environment variables.
type Config struct {
	DatabaseURL   string
	JWTSecret     string
	AdminEmail    string
	AdminPassword string
	Port          string
	Env           string
}

// Load reads configuration from the environment, applying defaults and
// validating required values.
func Load() (Config, error) {
	c := Config{
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		AdminEmail:    os.Getenv("ADMIN_EMAIL"),
		AdminPassword: os.Getenv("ADMIN_PASSWORD"),
		Port:          getenv("PORT", "8080"),
		Env:           getenv("APP_ENV", "development"),
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
