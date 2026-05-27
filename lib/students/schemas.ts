import { z } from 'zod'
import { zPgUuid } from '@/lib/z-pg-uuid'

const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/

export const createStudentSchema = z.object({
  class_id: zPgUuid('ID da turma inválido'),
  full_name: z.string().min(1, 'Nome completo é obrigatório'),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida')
    .nullable()
    .optional(),
  city: z.string().nullable().optional(),
  first_communion: z.boolean().optional().default(false),
  confirmation: z.boolean().optional().default(false),
  previous_catechism: z.string().nullable().optional(),
  religious_books: z.string().nullable().optional(),
  guardian_father_name: z.string().nullable().optional(),
  guardian_mother_name: z.string().nullable().optional(),
  guardian_phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Use o formato (11) 99999-9999')
    .nullable()
    .optional(),
  guardian_email: z.string().email('E-mail inválido').nullable().optional(),
})

export const updateStudentSchema = z.object({
  class_id: zPgUuid('ID da turma inválido').optional(),
  full_name: z.string().min(1, 'Nome completo é obrigatório').optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida')
    .nullable()
    .optional(),
  city: z.string().nullable().optional(),
  first_communion: z.boolean().optional(),
  confirmation: z.boolean().optional(),
  previous_catechism: z.string().nullable().optional(),
  religious_books: z.string().nullable().optional(),
  guardian_father_name: z.string().nullable().optional(),
  guardian_mother_name: z.string().nullable().optional(),
  guardian_phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Use o formato (11) 99999-9999')
    .nullable()
    .optional(),
  guardian_email: z.string().email('E-mail inválido').nullable().optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
