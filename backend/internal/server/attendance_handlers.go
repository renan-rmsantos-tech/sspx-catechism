package server

import (
	"errors"
	"net/http"

	"github.com/rmtech/sspx-catechism/backend/internal/attendance"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

// attendanceRecordDTO mirrors the old attendanceRecordSchema (Zod). studentId uses
// the lenient UUID rule; present is required.
type attendanceRecordDTO struct {
	StudentID string `json:"studentId"`
	Present   bool   `json:"present"`
}

// attendanceSessionDTO mirrors the old pendingSessionSchema. id/catechistId are
// accepted (the client device sends them) and validated for shape, but their
// values are ignored: the session catechist always comes from the token. createdAt
// is the device timestamp, kept only so DisallowUnknownFields does not reject it.
type attendanceSessionDTO struct {
	ID          string                `json:"id"`
	ClassID     string                `json:"classId"`
	Date        string                `json:"date"`
	CatechistID string                `json:"catechistId"`
	Records     []attendanceRecordDTO `json:"records"`
	CreatedAt   int64                 `json:"createdAt"`
}

type syncAttendanceRequest struct {
	Sessions []attendanceSessionDTO `json:"sessions"`
}

type syncAttendanceResponse struct {
	Synced  int `json:"synced"`
	Skipped int `json:"skipped"`
}

// handleSyncAttendance replays a batch of offline sessions idempotently and returns
// {synced, skipped}. Open to any authenticated user; the per-session class write
// scope and the date-scheduled check are enforced by the service.
func (s *Server) handleSyncAttendance(w http.ResponseWriter, r *http.Request) {
	claims, ok := httpx.ClaimsFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "não autenticado")
		return
	}

	var req syncAttendanceRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	if msg, valid := validateSyncRequest(req); !valid {
		httpx.Error(w, http.StatusBadRequest, msg)
		return
	}

	sessions := make([]attendance.SessionInput, 0, len(req.Sessions))
	for _, sess := range req.Sessions {
		recs := make([]attendance.RecordInput, 0, len(sess.Records))
		for _, rec := range sess.Records {
			recs = append(recs, attendance.RecordInput{StudentID: rec.StudentID, Present: rec.Present})
		}
		sessions = append(sessions, attendance.SessionInput{ClassID: sess.ClassID, Date: sess.Date, Records: recs})
	}

	result, err := s.attendance.Sync(r.Context(), *claims, sessions)
	if err != nil {
		s.writeAttendanceError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, syncAttendanceResponse{Synced: result.Synced, Skipped: result.Skipped})
}

// validateSyncRequest mirrors submitAttendanceSchema: at least one session; every
// id/classId/catechistId is a (lenient) UUID and every date is YYYY-MM-DD; record
// studentIds are lenient UUIDs. Any failure rejects the whole batch with 400.
func validateSyncRequest(req syncAttendanceRequest) (string, bool) {
	if len(req.Sessions) == 0 {
		return "pelo menos uma sessão é necessária", false
	}
	for _, sess := range req.Sessions {
		if !lenientUUID(sess.ID) {
			return "ID de sessão inválido", false
		}
		if !lenientUUID(sess.ClassID) {
			return "ID de turma inválido", false
		}
		if !lenientUUID(sess.CatechistID) {
			return "ID de catequista inválido", false
		}
		if !dateRe.MatchString(sess.Date) {
			return "data inválida. Use o formato YYYY-MM-DD", false
		}
		for _, rec := range sess.Records {
			if !lenientUUID(rec.StudentID) {
				return "ID de aluno inválido", false
			}
		}
	}
	return "", true
}

// lenientUUID reports whether s parses as a UUID under the lenient rule (dashed or
// 32 hex, no RFC-4122 version enforcement), matching the old zPgUuid.
func lenientUUID(s string) bool {
	_, err := pgconv.ParseUUID(s)
	return err == nil
}

type attendanceRecordResponse struct {
	ID        string `json:"id"`
	StudentID string `json:"studentId"`
	Present   bool   `json:"present"`
}

type attendanceSessionResponse struct {
	ID          string                     `json:"id"`
	ClassID     string                     `json:"classId"`
	Date        string                     `json:"date"`
	CatechistID string                     `json:"catechistId"`
	SyncedAt    *string                    `json:"syncedAt"`
	Records     []attendanceRecordResponse `json:"records"`
}

// handleListAttendance returns the sessions visible to the caller (scoped by role)
// with their records embedded, filtered by the optional classId/from/to params.
func (s *Server) handleListAttendance(w http.ResponseWriter, r *http.Request) {
	claims, ok := httpx.ClaimsFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "não autenticado")
		return
	}

	q := r.URL.Query()
	filter := attendance.ListFilter{
		ClassID: q.Get("classId"),
		From:    q.Get("from"),
		To:      q.Get("to"),
	}
	if filter.From != "" && !dateRe.MatchString(filter.From) {
		httpx.Error(w, http.StatusBadRequest, "parâmetro 'from' inválido. Use o formato YYYY-MM-DD")
		return
	}
	if filter.To != "" && !dateRe.MatchString(filter.To) {
		httpx.Error(w, http.StatusBadRequest, "parâmetro 'to' inválido. Use o formato YYYY-MM-DD")
		return
	}

	sessions, err := s.attendance.List(r.Context(), *claims, filter)
	if err != nil {
		s.writeAttendanceError(w, err)
		return
	}

	resp := make([]attendanceSessionResponse, 0, len(sessions))
	for _, sess := range sessions {
		recs := make([]attendanceRecordResponse, 0, len(sess.Records))
		for _, rec := range sess.Records {
			recs = append(recs, attendanceRecordResponse{ID: rec.ID, StudentID: rec.StudentID, Present: rec.Present})
		}
		resp = append(resp, attendanceSessionResponse{
			ID:          sess.ID,
			ClassID:     sess.ClassID,
			Date:        sess.Date,
			CatechistID: sess.CatechistID,
			SyncedAt:    sess.SyncedAt,
			Records:     recs,
		})
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// writeAttendanceError maps service errors to HTTP responses. A bad id in the
// payload/filter is a client error (400); everything else falls back to the DB
// error mapper.
func (s *Server) writeAttendanceError(w http.ResponseWriter, err error) {
	if errors.Is(err, attendance.ErrInvalidID) {
		httpx.Error(w, http.StatusBadRequest, "identificador inválido")
		return
	}
	httpx.WriteDBError(w, err)
}
