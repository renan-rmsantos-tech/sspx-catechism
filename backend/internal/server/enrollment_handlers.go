package server

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/rmtech/sspx-catechism/backend/internal/db/sqlcgen"
	"github.com/rmtech/sspx-catechism/backend/internal/enrollments"
	"github.com/rmtech/sspx-catechism/backend/internal/httpx"
	"github.com/rmtech/sspx-catechism/backend/internal/pgconv"
)

type enrollmentResponse struct {
	ID                 string  `json:"id"`
	AcademicYearID     string  `json:"academicYearId"`
	Status             string  `json:"status"`
	FullName           string  `json:"fullName"`
	BirthDate          *string `json:"birthDate"`
	City               *string `json:"city"`
	FirstCommunion     bool    `json:"firstCommunion"`
	Confirmation       bool    `json:"confirmation"`
	PreviousCatechism  *string `json:"previousCatechism"`
	ReligiousBooks     *string `json:"religiousBooks"`
	GuardianFatherName *string `json:"guardianFatherName"`
	GuardianMotherName *string `json:"guardianMotherName"`
	GuardianPhone      *string `json:"guardianPhone"`
	GuardianEmail      *string `json:"guardianEmail"`
	IsRenewal          bool    `json:"isRenewal"`
	PreviousName       *string `json:"previousName"`
	RejectionReason    *string `json:"rejectionReason"`
	ApprovedClassID    *string `json:"approvedClassId"`
	ApprovedStudentID  *string `json:"approvedStudentId"`
	ReviewedBy         *string `json:"reviewedBy"`
	ReviewedAt         *string `json:"reviewedAt"`
	CreatedAt          *string `json:"createdAt"`
}

// uuidPtrString renders a nullable pgtype.UUID as a pointer to its dashed string, or
// nil when the column is NULL.
func uuidPtrString(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := pgconv.UUIDString(u)
	return &s
}

func toEnrollmentResponse(e sqlcgen.Enrollment) enrollmentResponse {
	return enrollmentResponse{
		ID:                 pgconv.UUIDString(e.ID),
		AcademicYearID:     pgconv.UUIDString(e.AcademicYearID),
		Status:             e.Status,
		FullName:           e.FullName,
		BirthDate:          pgconv.DateString(e.BirthDate),
		City:               e.City,
		FirstCommunion:     e.FirstCommunion,
		Confirmation:       e.Confirmation,
		PreviousCatechism:  e.PreviousCatechism,
		ReligiousBooks:     e.ReligiousBooks,
		GuardianFatherName: e.GuardianFatherName,
		GuardianMotherName: e.GuardianMotherName,
		GuardianPhone:      e.GuardianPhone,
		GuardianEmail:      e.GuardianEmail,
		IsRenewal:          e.IsRenewal,
		PreviousName:       e.PreviousName,
		RejectionReason:    e.RejectionReason,
		ApprovedClassID:    uuidPtrString(e.ApprovedClassID),
		ApprovedStudentID:  uuidPtrString(e.ApprovedStudentID),
		ReviewedBy:         uuidPtrString(e.ReviewedBy),
		ReviewedAt:         pgconv.TimestampString(e.ReviewedAt),
		CreatedAt:          pgconv.TimestampString(e.CreatedAt),
	}
}

type submitEnrollmentRequest struct {
	FullName           string  `json:"fullName"`
	BirthDate          *string `json:"birthDate"`
	City               *string `json:"city"`
	FirstCommunion     bool    `json:"firstCommunion"`
	Confirmation       bool    `json:"confirmation"`
	PreviousCatechism  *string `json:"previousCatechism"`
	ReligiousBooks     *string `json:"religiousBooks"`
	GuardianFatherName *string `json:"guardianFatherName"`
	GuardianMotherName *string `json:"guardianMotherName"`
	GuardianPhone      *string `json:"guardianPhone"`
	GuardianEmail      *string `json:"guardianEmail"`
	IsRenewal          bool    `json:"isRenewal"`
	PreviousName       *string `json:"previousName"`
}

// handleSubmitEnrollment is the public (no-auth) enrollment submission. It mirrors
// the old enrollmentSchema validation (name ≥ 3 chars, required guardian
// phone/email, optional ISO birth date) then defers the active-year window check to
// the service.
func (s *Server) handleSubmitEnrollment(w http.ResponseWriter, r *http.Request) {
	var req submitEnrollmentRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	req.FullName = strings.TrimSpace(req.FullName)
	if len(req.FullName) < 3 {
		httpx.Error(w, http.StatusBadRequest, "nome completo deve ter pelo menos 3 caracteres")
		return
	}

	birthDate, ok := parseBirthDate(w, req.BirthDate)
	if !ok {
		return
	}
	// Guardian phone and e-mail are required (not nullable) in the public form.
	phone := normalizeOptional(req.GuardianPhone)
	if phone == nil || !phoneRe.MatchString(*phone) {
		httpx.Error(w, http.StatusBadRequest, "telefone inválido. Use o formato (11) 99999-9999")
		return
	}
	email := normalizeOptional(req.GuardianEmail)
	if email == nil || !emailRe.MatchString(*email) {
		httpx.Error(w, http.StatusBadRequest, "e-mail inválido")
		return
	}

	created, err := s.enrollments.Submit(r.Context(), enrollments.SubmitInput{
		FullName:           req.FullName,
		BirthDate:          birthDate,
		City:               normalizeOptional(req.City),
		FirstCommunion:     req.FirstCommunion,
		Confirmation:       req.Confirmation,
		PreviousCatechism:  normalizeOptional(req.PreviousCatechism),
		ReligiousBooks:     normalizeOptional(req.ReligiousBooks),
		GuardianFatherName: normalizeOptional(req.GuardianFatherName),
		GuardianMotherName: normalizeOptional(req.GuardianMotherName),
		GuardianPhone:      phone,
		GuardianEmail:      email,
		IsRenewal:          req.IsRenewal,
		PreviousName:       normalizeOptional(req.PreviousName),
	})
	if err != nil {
		s.writeEnrollmentError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, toEnrollmentResponse(created))
}

// validEnrollmentStatuses are the listing filters allowed on GET.
var validEnrollmentStatuses = map[string]struct{}{
	"pending":  {},
	"approved": {},
	"rejected": {},
}

func (s *Server) handleListEnrollments(w http.ResponseWriter, r *http.Request) {
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	if status == "" {
		status = "pending"
	}
	if _, ok := validEnrollmentStatuses[status]; !ok {
		httpx.Error(w, http.StatusBadRequest, "status inválido")
		return
	}
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	list, err := s.enrollments.List(r.Context(), status, q)
	if err != nil {
		s.writeEnrollmentError(w, err)
		return
	}
	out := make([]enrollmentResponse, 0, len(list))
	for _, e := range list {
		out = append(out, toEnrollmentResponse(e))
	}
	httpx.JSON(w, http.StatusOK, out)
}

type approveEnrollmentRequest struct {
	ClassID           string  `json:"classId"`
	ExistingStudentID *string `json:"existingStudentId"`
}

func (s *Server) handleApproveEnrollment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req approveEnrollmentRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.ClassID) == "" {
		httpx.Error(w, http.StatusBadRequest, "turma é obrigatória")
		return
	}
	claims, ok := httpx.ClaimsFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "não autenticado")
		return
	}

	existing := normalizeOptional(req.ExistingStudentID)
	approved, err := s.enrollments.Approve(r.Context(), id, strings.TrimSpace(req.ClassID), existing, claims.UserID())
	if err != nil {
		s.writeEnrollmentError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toEnrollmentResponse(approved))
}

type rejectEnrollmentRequest struct {
	RejectionReason *string `json:"rejectionReason"`
}

func (s *Server) handleRejectEnrollment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req rejectEnrollmentRequest
	if !httpx.DecodeJSON(w, r, &req) {
		return
	}
	claims, ok := httpx.ClaimsFrom(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "não autenticado")
		return
	}

	rejected, err := s.enrollments.Reject(r.Context(), id, normalizeOptional(req.RejectionReason), claims.UserID())
	if err != nil {
		s.writeEnrollmentError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toEnrollmentResponse(rejected))
}

// writeEnrollmentError maps enrollment domain and Postgres errors to HTTP responses.
func (s *Server) writeEnrollmentError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, enrollments.ErrNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, enrollments.ErrNoActiveYear):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, enrollments.ErrWindowClosed):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, enrollments.ErrInvalidID):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, enrollments.ErrAlreadyReviewed):
		httpx.Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, enrollments.ErrInvalidReference):
		httpx.Error(w, http.StatusConflict, err.Error())
	default:
		httpx.WriteDBError(w, err)
	}
}
