import { z } from 'zod'
import { zPgUuid } from '@/lib/z-pg-uuid'

export const createAcademicYearSchema = z.object({
  year: z.number().int().positive('Ano letivo deve ser um número inteiro positivo'),
  is_active: z.boolean().optional().default(false),
})

export const createClassSchema = z.object({
  name: z.string().min(1, 'Nome da turma é obrigatório'),
  academic_year_id: zPgUuid('ID do ano letivo inválido'),
  level: z.string().optional(),
  schedule: z.string().optional(),
  catechist_ids: z.array(zPgUuid('ID de catequista inválido')).optional().default([]),
})

export const updateClassSchema = z.object({
  name: z.string().min(1, 'Nome da turma é obrigatório').optional(),
  academic_year_id: zPgUuid().optional(),
  level: z.string().optional(),
  schedule: z.string().optional(),
  is_archived: z.boolean().optional(),
  catechist_ids: z.array(zPgUuid()).optional(),
})

export const inviteCatechistSchema = z.object({
  email: z.string().email('E-mail inválido'),
  full_name: z.string().min(1, 'Nome completo é obrigatório'),
})

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>
export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
export type InviteCatechistInput = z.infer<typeof inviteCatechistSchema>
