import { z } from 'zod'
import { apiFetch } from '@/lib/api'

const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/
const emptyToNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export const publicEnrollmentSchema = z.object({
  fullName: z.string().trim().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  birthDate: z
    .string()
    .transform(emptyToNull)
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida').nullable()),
  city: z.string().transform(emptyToNull),
  firstCommunion: z.boolean(),
  confirmation: z.boolean(),
  previousCatechism: z.string().transform(emptyToNull),
  religiousBooks: z.string().transform(emptyToNull),
  guardianFatherName: z.string().transform(emptyToNull),
  guardianMotherName: z.string().transform(emptyToNull),
  guardianPhone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Telefone inválido. Use o formato (11) 99999-9999'),
  guardianEmail: z.string().trim().email('Email inválido'),
  isRenewal: z.boolean(),
  previousName: z.string().transform(emptyToNull),
})

export type PublicEnrollmentPayload = z.infer<typeof publicEnrollmentSchema>

export function submitPublicEnrollment(payload: PublicEnrollmentPayload) {
  return apiFetch('/api/enrollments', {
    method: 'POST',
    json: payload,
  })
}
