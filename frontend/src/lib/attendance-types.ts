export interface AttendanceRecordInput {
  studentId: string
  present: boolean
}

export interface PendingSession {
  id: string
  classId: string
  date: string
  catechistId: string
  records: AttendanceRecordInput[]
  createdAt: number
}

export interface AttendanceSyncResult {
  synced: number
  skipped: number
}

export interface AttendanceRecord {
  id: string
  studentId: string
  present: boolean
}

export interface AttendanceSession {
  id: string
  classId: string
  date: string
  catechistId: string
  syncedAt: string | null
  records: AttendanceRecord[]
}
