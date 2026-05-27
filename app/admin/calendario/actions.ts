'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createAcademicYearSchema, updateAcademicYearSchema } from '@/lib/classes/schemas'
import { z } from 'zod'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export type ActionState = { error: string } | null

async function getCoordinatorClient() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isCoordinatorOrAdmin(profile?.role)) return null
  return supabase
}

export async function createAcademicYearAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const yearStr = formData.get('year') as string
  const classDaysRaw = formData.getAll('class_days')
  const classDays = classDaysRaw.map((v) => parseInt(v as string, 10)).filter((n) => !isNaN(n))

  const body = {
    year: yearStr ? parseInt(yearStr, 10) : undefined,
    is_active: formData.get('is_active') === 'true',
    class_days: classDays.length > 0 ? classDays : [6],
  }

  const result = createAcademicYearSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase.from('academic_years').insert(result.data)
  if (error) {
    if (error.code === '23505') {
      return { error: 'Este ano letivo já existe' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/calendario')
  return null
}

export async function toggleAcademicYearAction(
  yearId: string,
  isActive: boolean
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const result = updateAcademicYearSchema.safeParse({ is_active: isActive })
  if (!result.success) return { error: 'Dados inválidos' }

  const { error } = await supabase
    .from('academic_years')
    .update(result.data)
    .eq('id', yearId)

  if (error) return { error: error.message }

  revalidatePath('/admin/calendario')
  return null
}

const updateClassDaysSchema = z.object({
  class_days: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Selecione pelo menos um dia da semana'),
})

export async function updateClassDaysAction(
  yearId: string,
  classDays: number[]
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const result = updateClassDaysSchema.safeParse({ class_days: classDays })
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase
    .from('academic_years')
    .update({ class_days: result.data.class_days })
    .eq('id', yearId)

  if (error) return { error: error.message }

  revalidatePath('/admin/calendario')
  return null
}

export async function updateEnrollmentPeriodAction(
  yearId: string,
  enrollmentStartsAt: string | null,
  enrollmentEndsAt: string | null
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const result = updateAcademicYearSchema.safeParse({
    enrollment_starts_at: enrollmentStartsAt,
    enrollment_ends_at: enrollmentEndsAt,
  })
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase
    .from('academic_years')
    .update({
      enrollment_starts_at: result.data.enrollment_starts_at ?? null,
      enrollment_ends_at: result.data.enrollment_ends_at ?? null,
    })
    .eq('id', yearId)

  if (error) return { error: error.message }

  revalidatePath('/admin/calendario')
  return null
}

export async function deleteAcademicYearAction(yearId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const { error } = await supabase
    .from('academic_years')
    .delete()
    .eq('id', yearId)

  if (error) {
    if (error.code === '23503') {
      return { error: 'Ano letivo possui turmas vinculadas e não pode ser excluído' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/calendario')
  return null
}
