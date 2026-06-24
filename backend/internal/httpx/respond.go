// Package httpx holds HTTP helpers: JSON responses, error mapping and auth
// middleware shared across handlers.
package httpx

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// JSON writes v as a JSON response with the given status code.
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// Error writes a JSON error envelope: {"error": "..."}.
func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

// WriteDBError maps common Postgres/pgx errors to HTTP responses, mirroring the
// previous app's behavior (23503 FK / 23505 unique → 409, no-rows → 404).
func WriteDBError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		Error(w, http.StatusNotFound, "não encontrado")
		return
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			Error(w, http.StatusConflict, "registro já existe")
			return
		case "23503":
			Error(w, http.StatusConflict, "registro em uso por outro recurso")
			return
		}
	}
	Error(w, http.StatusInternalServerError, "erro interno")
}

// DecodeJSON reads and decodes a JSON request body into dst, rejecting unknown
// fields. Returns false (and writes a 400) on failure.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		Error(w, http.StatusBadRequest, "JSON inválido: "+err.Error())
		return false
	}
	return true
}
