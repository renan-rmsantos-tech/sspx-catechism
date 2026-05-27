import { z } from 'zod'

const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/

export const enrollmentSchema = z.object({
  full_name: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
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
    .regex(phoneRegex, 'Telefone inválido. Use o formato (11) 99999-9999'),
  guardian_email: z.string().email('Email inválido'),
  is_renewal: z.boolean().optional().default(false),
  previous_name: z.string().nullable().optional(),
})

export type EnrollmentInput = z.infer<typeof enrollmentSchema>
