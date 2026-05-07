import { z } from 'zod'
import { zPgUuid } from '@/lib/z-pg-uuid'

export const updateClassDatesSchema = z.object({
  academic_year_id: zPgUuid('ID do ano letivo inválido'),
  dates: z.array(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD')
  ),
})

export type UpdateClassDatesInput = z.infer<typeof updateClassDatesSchema>
