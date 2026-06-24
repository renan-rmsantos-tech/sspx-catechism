import { apiFetch, ApiError } from '@/lib/api'

export interface AcademicYear {
  id: string
  year: number
  isActive: boolean
  classDays: number[]
  enrollmentStartsAt: string | null
  enrollmentEndsAt: string | null
}

export interface ClassItem {
  id: string
  academicYearId: string
  name: string
  level: string | null
  schedule: string | null
  isArchived: boolean
  catechistIds: string[]
}

export interface Student {
  id: string
  classId: string
  className?: string | null
  fullName: string
  birthDate: string | null
  city: string | null
  firstCommunion: boolean
  confirmation: boolean
  previousCatechism: string | null
  religiousBooks: string | null
  guardianFatherName: string | null
  guardianMotherName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  isActive: boolean
}

export interface Catechist {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'coordinator' | 'catechist'
  isActive: boolean
  mustChangePassword: boolean
}

export interface CreatedCatechist {
  id: string
  email: string
  fullName: string
  password: string
}

export interface Enrollment {
  id: string
  academicYearId: string
  status: 'pending' | 'approved' | 'rejected'
  fullName: string
  birthDate: string | null
  city: string | null
  firstCommunion: boolean
  confirmation: boolean
  previousCatechism: string | null
  religiousBooks: string | null
  guardianFatherName: string | null
  guardianMotherName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  isRenewal: boolean
  previousName: string | null
  rejectionReason: string | null
  approvedClassId: string | null
  approvedStudentId: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string | null
}

export interface CalendarDates {
  dates: string[]
  lockedDates: string[]
}

export interface AttendanceReport {
  className: string
  from: string
  to: string
  students: Array<{
    id: string
    full_name: string
    records: Array<{ session_id: string; student_id: string; date: string; present: boolean }>
  }>
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected'
export type ReportFormat = 'json' | 'pdf' | 'xlsx'

export const adminApi = {
  listAcademicYears: () => apiFetch<AcademicYear[]>('/api/academic-years'),
  createAcademicYear: (json: {
    year: number
    isActive: boolean
    classDays: number[]
    enrollmentStartsAt?: string | null
    enrollmentEndsAt?: string | null
  }) => apiFetch<AcademicYear>('/api/academic-years', { method: 'POST', json }),
  updateAcademicYear: (id: string, json: Partial<AcademicYear>) =>
    apiFetch<AcademicYear>(`/api/academic-years/${id}`, { method: 'PATCH', json }),
  deleteAcademicYear: (id: string) =>
    apiFetch<{ status: string }>(`/api/academic-years/${id}`, { method: 'DELETE' }),

  getCalendar: (academicYearId: string) =>
    apiFetch<CalendarDates>(`/api/class-dates?academicYearId=${encodeURIComponent(academicYearId)}`),
  updateCalendar: (academicYearId: string, dates: string[]) =>
    apiFetch<{ count: number }>('/api/class-dates', {
      method: 'PUT',
      json: { academicYearId, dates },
    }),

  listClasses: () => apiFetch<ClassItem[]>('/api/classes'),
  createClass: (json: {
    name: string
    academicYearId: string
    level?: string | null
    schedule?: string | null
    catechistIds: string[]
  }) => apiFetch<ClassItem>('/api/classes', { method: 'POST', json }),
  updateClass: (id: string, json: Partial<ClassItem>) =>
    apiFetch<ClassItem>(`/api/classes/${id}`, { method: 'PATCH', json }),

  searchStudents: (q: string) => apiFetch<Student[]>(`/api/students?q=${encodeURIComponent(q)}`),
  createStudent: (json: StudentFormPayload) =>
    apiFetch<Student>('/api/students', { method: 'POST', json }),
  updateStudent: (id: string, json: Partial<StudentFormPayload>) =>
    apiFetch<Student>(`/api/students/${id}`, { method: 'PATCH', json }),

  listCatechists: () => apiFetch<Catechist[]>('/api/catechists'),
  createCatechist: (json: { email: string; fullName: string }) =>
    apiFetch<CreatedCatechist>('/api/catechists', { method: 'POST', json }),
  updateCatechist: (id: string, json: { role?: string; isActive?: boolean }) =>
    apiFetch<Catechist>(`/api/catechists/${id}`, { method: 'PATCH', json }),
  deleteCatechist: (id: string) =>
    apiFetch<{ status: string }>(`/api/catechists/${id}`, { method: 'DELETE' }),

  listEnrollments: (status: EnrollmentStatus, q: string) =>
    apiFetch<Enrollment[]>(
      `/api/enrollments?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`,
    ),
  approveEnrollment: (id: string, json: { classId: string; existingStudentId?: string | null }) =>
    apiFetch<Enrollment>(`/api/enrollments/${id}/approve`, { method: 'POST', json }),
  rejectEnrollment: (id: string, rejectionReason: string | null) =>
    apiFetch<Enrollment>(`/api/enrollments/${id}/reject`, {
      method: 'POST',
      json: { rejectionReason },
    }),

  getAttendanceReport: (classId: string, from: string, to: string) =>
    apiFetch<AttendanceReport>(
      `/api/reports/attendance?classId=${encodeURIComponent(classId)}&from=${encodeURIComponent(
        from,
      )}&to=${encodeURIComponent(to)}&format=json`,
    ),
  downloadAttendanceReport: (classId: string, from: string, to: string, format: 'pdf' | 'xlsx') =>
    downloadReport(classId, from, to, format),
}

export interface StudentFormPayload {
  classId: string
  fullName: string
  birthDate?: string | null
  city?: string | null
  firstCommunion: boolean
  confirmation: boolean
  previousCatechism?: string | null
  religiousBooks?: string | null
  guardianFatherName?: string | null
  guardianMotherName?: string | null
  guardianPhone?: string | null
  guardianEmail?: string | null
}

async function downloadReport(classId: string, from: string, to: string, format: 'pdf' | 'xlsx') {
  const response = await fetch(
    `/api/reports/attendance?classId=${encodeURIComponent(classId)}&from=${encodeURIComponent(
      from,
    )}&to=${encodeURIComponent(to)}&format=${format}`,
    { credentials: 'include' },
  )

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = await response.text()
    }
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : 'erro ao baixar relatório'
    throw new ApiError(response.status, message, payload)
  }

  return {
    blob: await response.blob(),
    filename: filenameFromHeader(response.headers.get('content-disposition')) ?? `relatorio.${format}`,
  }
}

function filenameFromHeader(header: string | null) {
  if (!header) return null
  const match = /filename="([^"]+)"/.exec(header)
  return match?.[1] ?? null
}
