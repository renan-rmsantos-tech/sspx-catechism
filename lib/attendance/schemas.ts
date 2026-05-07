import { z } from 'zod'
import { zPgUuid } from '@/lib/z-pg-uuid'

export const attendanceRecordSchema = z.object({
  studentId: zPgUuid('ID de aluno inválido'),
  present: z.boolean(),
})

export const pendingSessionSchema = z.object({
  id: zPgUuid('ID de sessão inválido'),
  classId: zPgUuid('ID de turma inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD'),
  catechistId: zPgUuid('ID de catequista inválido'),
  records: z.array(attendanceRecordSchema),
  createdAt: z.number(),
})

export const submitAttendanceSchema = z.object({
  sessions: z.array(pendingSessionSchema).min(1, 'Pelo menos uma sessão é necessária'),
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>
export type PendingSession = z.infer<typeof pendingSessionSchema>
export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>
