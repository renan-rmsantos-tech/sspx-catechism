'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createAcademicYearSchema, updateAcademicYearSchema } from '@/lib/classes/schemas'

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

  if (profile?.role !== 'coordinator') return null
  return supabase
}

export async function createAcademicYearAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const yearStr = formData.get('year') as string
  const body = {
    year: yearStr ? parseInt(yearStr, 10) : undefined,
    is_active: formData.get('is_active') === 'true',
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

  revalidatePath('/admin/anos-letivos')
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

  revalidatePath('/admin/anos-letivos')
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

  revalidatePath('/admin/anos-letivos')
  return null
}
