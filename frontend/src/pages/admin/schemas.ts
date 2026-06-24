import { z } from 'zod'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD')
  .or(z.literal(''))

const optionalDate = dateString.transform((value) => (value.trim() === '' ? null : value))
const optionalText = z.string().transform((value) => {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
})

export const academicYearSchema = z
  .object({
    year: z.coerce.number().int().positive('Informe um ano válido'),
    isActive: z.boolean(),
    classDays: z.array(z.coerce.number().int().min(0).max(6)).min(1, 'Selecione ao menos um dia'),
    enrollmentStartsAt: optionalDate,
    enrollmentEndsAt: optionalDate,
  })
  .refine(
    (value) =>
      !value.enrollmentStartsAt ||
      !value.enrollmentEndsAt ||
      value.enrollmentEndsAt > value.enrollmentStartsAt,
    {
      path: ['enrollmentEndsAt'],
      message: 'O encerramento deve ser posterior à abertura',
    },
  )

export const calendarSchema = z.object({
  academicYearId: z.string().min(1, 'Selecione o ano letivo'),
  datesText: z.string().superRefine((value, ctx) => {
    const dates = splitDates(value)
    for (const date of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        ctx.addIssue({ code: 'custom', message: 'Use uma data YYYY-MM-DD por linha' })
        return
      }
    }
  }),
})

export const classSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Nome da turma é obrigatório'),
  academicYearId: z.string().min(1, 'Selecione o ano letivo'),
  level: optionalText,
  schedule: optionalText,
  catechistIds: z.array(z.string()),
  isArchived: z.boolean(),
})

export const studentSchema = z.object({
  id: z.string().optional(),
  classId: z.string().min(1, 'Selecione a turma'),
  fullName: z.string().trim().min(1, 'Nome completo é obrigatório'),
  birthDate: optionalDate,
  city: optionalText,
  firstCommunion: z.boolean(),
  confirmation: z.boolean(),
  previousCatechism: optionalText,
  religiousBooks: optionalText,
  guardianFatherName: optionalText,
  guardianMotherName: optionalText,
  guardianPhone: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === '' || /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(value), {
      message: 'Use o formato (11) 99999-9999',
    })
    .transform((value) => (value === '' ? null : value)),
  guardianEmail: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
      message: 'E-mail inválido',
    })
    .transform((value) => (value === '' ? null : value)),
})

export const catechistSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  fullName: z.string().trim().min(1, 'Nome é obrigatório'),
})

export const rejectEnrollmentSchema = z.object({
  rejectionReason: optionalText,
})

export const approveEnrollmentSchema = z.object({
  classId: z.string().min(1, 'Selecione a turma'),
  existingStudentId: optionalText,
})

export const reportSchema = z
  .object({
    classId: z.string().min(1, 'Selecione a turma'),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD'),
  })
  .refine((value) => value.from <= value.to, {
    path: ['to'],
    message: 'A data final deve ser igual ou posterior à inicial',
  })

export type AcademicYearFormValues = z.input<typeof academicYearSchema>
export type AcademicYearPayload = z.output<typeof academicYearSchema>
export type CalendarFormValues = z.input<typeof calendarSchema>
export type ClassFormValues = z.input<typeof classSchema>
export type ClassPayload = z.output<typeof classSchema>
export type StudentFormValues = z.input<typeof studentSchema>
export type StudentPayload = z.output<typeof studentSchema>
export type CatechistFormValues = z.input<typeof catechistSchema>
export type RejectEnrollmentFormValues = z.input<typeof rejectEnrollmentSchema>
export type ApproveEnrollmentFormValues = z.input<typeof approveEnrollmentSchema>
export type ApproveEnrollmentPayload = z.output<typeof approveEnrollmentSchema>
export type ReportFormValues = z.input<typeof reportSchema>

export function splitDates(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((date) => date.trim())
    .filter(Boolean)
}
