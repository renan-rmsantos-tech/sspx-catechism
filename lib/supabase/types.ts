export type UserRole = 'coordinator' | 'catechist'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface AcademicYear {
  id: string
  year: number
  is_active: boolean
}

export interface Class {
  id: string
  academic_year_id: string
  name: string
  level: string | null
  schedule: string | null
  is_archived: boolean
  created_at: string
}

export interface ClassCatechist {
  class_id: string
  catechist_id: string
}

export interface Student {
  id: string
  class_id: string
  full_name: string
  birth_date: string | null
  city: string | null
  first_communion: boolean
  confirmation: boolean
  previous_catechism: string | null
  religious_books: string | null
  guardian_father_name: string | null
  guardian_mother_name: string | null
  guardian_phone: string | null
  created_at: string
}

export interface AttendanceSession {
  id: string
  class_id: string
  date: string
  catechist_id: string
  synced_at: string | null
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  present: boolean
}

export type TableName =
  | 'profiles'
  | 'academic_years'
  | 'classes'
  | 'class_catechists'
  | 'students'
  | 'attendance_sessions'
  | 'attendance_records'

export const ALL_TABLES: TableName[] = [
  'profiles',
  'academic_years',
  'classes',
  'class_catechists',
  'students',
  'attendance_sessions',
  'attendance_records',
]

export function isValidRole(role: unknown): role is UserRole {
  return role === 'coordinator' || role === 'catechist'
}

export function isCoordinator(profile: Pick<Profile, 'role'>): boolean {
  return profile.role === 'coordinator'
}

export function isCatechist(profile: Pick<Profile, 'role'>): boolean {
  return profile.role === 'catechist'
}
