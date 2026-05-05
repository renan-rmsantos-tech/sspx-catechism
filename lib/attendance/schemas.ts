import { z } from 'zod'

export const attendanceRecordSchema = z.object({
  studentId: z.string().uuid('ID de aluno inválido'),
  present: z.boolean(),
})

export const pendingSessionSchema = z.object({
  id: z.string().uuid('ID de sessão inválido'),
  classId: z.string().uuid('ID de turma inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD'),
  catechistId: z.string().uuid('ID de catequista inválido'),
  records: z.array(attendanceRecordSchema),
  createdAt: z.number(),
})

export const submitAttendanceSchema = z.object({
  sessions: z.array(pendingSessionSchema).min(1, 'Pelo menos uma sessão é necessária'),
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>
export type PendingSession = z.infer<typeof pendingSessionSchema>
export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>
