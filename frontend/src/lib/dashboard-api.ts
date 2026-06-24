import { apiFetch } from '@/lib/api'
import type { AttendanceSession } from '@/lib/attendance-types'

export interface DashboardClass {
  id: string
  academicYearId: string
  name: string
  level: string | null
  schedule: string | null
  isArchived: boolean
  catechistIds: string[]
}

export interface DashboardStudent {
  id: string
  classId: string
  fullName: string
  isActive: boolean
}

export interface AcademicYearSummary {
  id: string
  year: number
  isActive: boolean
}

export interface CalendarDates {
  dates: string[]
  lockedDates: string[]
}

export interface DashboardData {
  classes: DashboardClass[]
  studentsByClass: Record<string, DashboardStudent[]>
  activeYear: AcademicYearSummary | null
  classDates: string[]
  attendance: AttendanceSession[]
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [classes, years, attendance] = await Promise.all([
    apiFetch<DashboardClass[]>('/api/classes'),
    apiFetch<AcademicYearSummary[]>('/api/academic-years'),
    apiFetch<AttendanceSession[]>('/api/attendance'),
  ])
  const activeYear = years.find((year) => year.isActive) ?? null
  const classDates = activeYear
    ? (await apiFetch<CalendarDates>(
        `/api/class-dates?academicYearId=${encodeURIComponent(activeYear.id)}`,
      )).dates
    : []

  const studentsEntries = await Promise.all(
    classes
      .filter((item) => !item.isArchived)
      .map(async (item) => {
        const students = await apiFetch<DashboardStudent[]>(
          `/api/classes/${encodeURIComponent(item.id)}/students`,
        )
        return [item.id, students] as const
      }),
  )

  return {
    classes: classes.filter((item) => !item.isArchived),
    studentsByClass: Object.fromEntries(studentsEntries),
    activeYear,
    classDates,
    attendance,
  }
}

export async function loadAttendanceSheetData(classId: string) {
  const data = await loadDashboardData()
  const classItem = data.classes.find((item) => item.id === classId) ?? null
  return {
    ...data,
    classItem,
    students: data.studentsByClass[classId] ?? [],
  }
}
