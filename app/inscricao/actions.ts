'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { enrollmentSchema } from '@/lib/enrollments/schemas'
import { extractEnrollmentBody } from '@/lib/enrollments/helpers'

export type EnrollmentActionState =
  | { error: string; values: Record<string, string> }
  | { success: true }
  | null

export async function submitEnrollment(
  _prev: EnrollmentActionState,
  formData: FormData
): Promise<EnrollmentActionState> {
  const body = extractEnrollmentBody(formData)
  const values: Record<string, string> = {}
  formData.forEach((v, k) => { if (typeof v === 'string') values[k] = v })

  const result = enrollmentSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos', values }
  }

  const supabase = createSupabaseAdminClient()

  const { data: activeYear, error: yearError } = await supabase
    .from('academic_years')
    .select('id, enrollment_starts_at, enrollment_ends_at')
    .eq('is_active', true)
    .single()

  if (yearError || !activeYear) {
    return { error: 'Não foi possível encontrar o ano letivo ativo.', values }
  }

  const today = new Date().toISOString().split('T')[0]
  const { enrollment_starts_at, enrollment_ends_at } = activeYear

  if (
    !enrollment_starts_at ||
    !enrollment_ends_at ||
    today < enrollment_starts_at ||
    today > enrollment_ends_at
  ) {
    return { error: 'O período de inscrições não está aberto.', values }
  }

  const { error: insertError } = await supabase.from('enrollments').insert({
    academic_year_id: activeYear.id,
    ...result.data,
  })

  if (insertError) {
    return { error: 'Erro ao enviar inscrição. Tente novamente.', values }
  }

  return { success: true }
}
