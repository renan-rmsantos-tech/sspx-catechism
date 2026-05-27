'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createStudentSchema, updateStudentSchema } from '@/lib/students/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export type ActionState = { error: string } | null

function extractStudentBody(formData: FormData) {
  const phone = (formData.get('guardian_phone') as string | null)?.trim() || null
  const birthDate = (formData.get('birth_date') as string | null)?.trim() || null
  return {
    class_id: formData.get('class_id') as string,
    full_name: formData.get('full_name') as string,
    birth_date: birthDate,
    city: (formData.get('city') as string | null)?.trim() || null,
    first_communion: formData.get('first_communion') === 'true',
    confirmation: formData.get('confirmation') === 'true',
    previous_catechism: (formData.get('previous_catechism') as string | null)?.trim() || null,
    religious_books: (formData.get('religious_books') as string | null)?.trim() || null,
    guardian_father_name: (formData.get('guardian_father_name') as string | null)?.trim() || null,
    guardian_mother_name: (formData.get('guardian_mother_name') as string | null)?.trim() || null,
    guardian_phone: phone,
    guardian_email: (formData.get('guardian_email') as string | null)?.trim() || null,
  }
}

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

export async function createStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const body = extractStudentBody(formData)
  const result = createStudentSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase.from('students').insert(result.data)
  if (error) return { error: error.message }

  redirect('/admin/alunos')
}

export async function updateStudentAction(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const body = extractStudentBody(formData)
  const result = updateStudentSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase
    .from('students')
    .update(result.data)
    .eq('id', studentId)

  if (error) return { error: error.message }

  redirect('/admin/alunos')
}

export async function deactivateStudentAction(studentId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const { error } = await supabase
    .from('students')
    .update({ is_active: false })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/alunos')
  return null
}

export async function activateStudentAction(studentId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const { error } = await supabase
    .from('students')
    .update({ is_active: true })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/alunos')
  return null
}

export async function deleteStudentAction(studentId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const { count } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)

  if (count && count > 0) {
    return { error: 'Aluno possui registros de chamada. Desative-o em vez de excluir.' }
  }

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/alunos')
  return null
}
