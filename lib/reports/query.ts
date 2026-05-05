import { z } from 'zod'

export const reportParamsSchema = z
  .object({
    classId: z.string().uuid(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
    format: z.enum(['pdf', 'xlsx']),
  })
  .refine((d) => d.from <= d.to, { message: 'from must be <= to', path: ['from'] })

export type ReportParams = z.infer<typeof reportParamsSchema>

export interface ReportStudent {
  id: string
  full_name: string
}

export interface ReportSession {
  id: string
  date: string
}

export interface ReportRecord {
  session_id: string
  student_id: string
  present: boolean
}

export interface ReportData {
  className: string
  from: string
  to: string
  students: ReportStudent[]
  sessions: ReportSession[]
  records: ReportRecord[]
}

export function getCellValue(
  studentId: string,
  sessionId: string,
  records: ReportRecord[]
): string {
  const record = records.find((r) => r.student_id === studentId && r.session_id === sessionId)
  if (!record) return '-'
  return record.present ? 'P' : 'F'
}

export function calcStudentStats(
  studentId: string,
  sessions: ReportSession[],
  records: ReportRecord[]
): { present: number; absent: number; pct: string } {
  const sessionCount = sessions.length
  if (sessionCount === 0) {
    return { present: 0, absent: 0, pct: '-' }
  }
  const presentCount = records.filter((r) => r.student_id === studentId && r.present).length
  const absentCount = sessionCount - presentCount
  const pct = `${Math.round((presentCount / sessionCount) * 100)}%`
  return { present: presentCount, absent: absentCount, pct }
}
