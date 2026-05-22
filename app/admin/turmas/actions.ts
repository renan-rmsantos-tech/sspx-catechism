'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClassSchema, updateClassSchema } from '@/lib/classes/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

type ActionState = { error: string } | null

export async function createClassAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isCoordinatorOrAdmin(profile?.role)) return { error: 'Sem permissão.' }

  const raw = {
    name: formData.get('name') as string,
    academic_year_id: formData.get('academic_year_id') as string,
    level: (formData.get('level') as string) || undefined,
    schedule: (formData.get('schedule') as string) || undefined,
    catechist_ids: formData.getAll('catechist_ids') as string[],
  }

  const result = createClassSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join(', ') }
  }

  const { catechist_ids, ...classData } = result.data

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single()

  if (error) return { error: error.message }

  if (catechist_ids.length > 0) {
    await supabase.from('class_catechists').insert(
      catechist_ids.map((catechist_id) => ({ class_id: newClass.id, catechist_id }))
    )
  }

  redirect('/admin/turmas')
}

export async function updateClassAction(
  classId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isCoordinatorOrAdmin(profile?.role)) return { error: 'Sem permissão.' }

  const raw = {
    name: formData.get('name') as string,
    level: (formData.get('level') as string) || undefined,
    schedule: (formData.get('schedule') as string) || undefined,
    catechist_ids: formData.getAll('catechist_ids') as string[],
  }

  const result = updateClassSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join(', ') }
  }

  const { catechist_ids, ...classData } = result.data

  if (Object.keys(classData).length > 0) {
    const { error } = await supabase.from('classes').update(classData).eq('id', classId)
    if (error) return { error: error.message }
  }

  if (catechist_ids !== undefined) {
    await supabase.from('class_catechists').delete().eq('class_id', classId)
    if (catechist_ids.length > 0) {
      await supabase
        .from('class_catechists')
        .insert(catechist_ids.map((catechist_id) => ({ class_id: classId, catechist_id })))
    }
  }

  redirect('/admin/turmas')
}

export async function archiveClassAction(classId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isCoordinatorOrAdmin(profile?.role)) return

  await supabase.from('classes').update({ is_archived: true }).eq('id', classId)

  redirect('/admin/turmas')
}
