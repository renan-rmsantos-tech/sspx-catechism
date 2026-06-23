// Package pgconv converts between Go values and pgtype values used by sqlc.
package pgconv

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// dateLayout is the ISO date format (YYYY-MM-DD) used across the API.
const dateLayout = "2006-01-02"

// ParseDate parses a YYYY-MM-DD string into a valid pgtype.Date.
func ParseDate(s string) (pgtype.Date, error) {
	t, err := time.Parse(dateLayout, s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

// DateString renders a pgtype.Date as YYYY-MM-DD, or nil when the date is null.
func DateString(d pgtype.Date) *string {
	if !d.Valid {
		return nil
	}
	s := d.Time.Format(dateLayout)
	return &s
}

// ParseUUID parses a UUID string into pgtype.UUID. It accepts standard dashed
// form as well as 32 hex chars without dashes, and does NOT enforce RFC-4122
// version bits — preserving the lenient behavior of the previous zPgUuid schema
// (seed UUIDs like "20000000-..." are not valid v4 but must be accepted).
func ParseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

// UUIDString renders a pgtype.UUID as its canonical dashed string ("" if null).
func UUIDString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	v, err := u.Value()
	if err != nil {
		return ""
	}
	s, _ := v.(string)
	return s
}

// Text wraps a string into a pgtype.Text (always valid/non-null).
func Text(s string) pgtype.Text { return pgtype.Text{String: s, Valid: true} }
