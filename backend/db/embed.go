// Package db embeds the SQL migrations so they ship inside the Go binary and
// can be applied by goose at startup without external files.
package db

import "embed"

//go:embed migrations/*.sql
var Migrations embed.FS
